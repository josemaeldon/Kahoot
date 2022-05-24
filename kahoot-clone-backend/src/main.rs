/// Module containing the schema of the websocket api.
///
/// All messages, both server -> client and client -> server, are in the form:
/// ```json
/// {
///     "type": "<message_type>",
///     "<field>": "<value>",
///     ...
/// } 
/// ```
mod api;
mod state;
mod ext;

use api::{Question, RoomId, Action, HostEvent, UserEvent};
use ext::ToMessageExt;
use state::{State, SharedState, Room, Users, PlayerAnswer, GameEvent};

// Standard library stuffs
use std::io;
use std::sync::{Arc, Mutex};
use std::net::SocketAddr;
use std::collections::{HashMap, HashSet};
use std::time::Duration;

// `axum` is a Rust web server framework
use axum::{Extension, Router};
use axum::extract::{ws::WebSocket, WebSocketUpgrade};
use axum::extract::ws::Message;
use axum::routing::{MethodRouter, get_service, get};
use axum::http::StatusCode;
use axum::response::Response;

// `axum` is built on top of `tower_http`, so we can use some of its tools and
// integrate it with the `axum` server.
use tower_http::services::ServeDir;

use tokio::sync::{mpsc, watch};

use futures::{StreamExt, SinkExt, Stream};

/**
 * Note: You may notice that some functions end with a naked expression without
 * and no return statement.
 * 
 * When a block of code (ie. code surrounded by curly braces `{}`) ends with
 * an expression without a semicolon, it is implicitly "resolved" to that value.
 *
 * Example:
 * ```
 * let x = {
 *     let y = 8;
 *     y * y
 * };
 * ```
 * is equivalent to:
 * ```
 * let x = 8 * 8;
 * ```
 * 
 * Relevant: https://doc.rust-lang.org/reference/expressions/block-expr.html
 */

/// The main function, where the application starts
//
// `tokio::main` is a macro for defining async main functions.
//
// `tokio` is an async/await runtime library for Rust.
//
// You need to use a library for async in Rust because it doesn't provide
// an "official" one out of the box which can be a pro or a con depending on
// how you look at it.
#[tokio::main]
async fn main() {
    // Set the host address to `localhost:3000`
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    // Start the server
    axum::Server::bind(&addr)
        .serve(app().into_make_service())
        .await
        .unwrap();
}

/// The server router
fn app() -> Router {
    let rooms = Mutex::new(HashMap::new());
    let state = Arc::new(State { rooms });

    Router::new()
        // GET /ws
        .route("/ws", get(handle_ws_connection))
        // If no route matches, try to serve a static file
        .fallback(dir_service())
        // Includes the shared state in routes
        .layer(Extension(state))
}

/// Passes an upgraded websocket to `handle_socket`.
//
// Here, `WebSocketUpgrade` and `Extension` are "extractors" from the `axum`
// framework, and they allow `axum` to automatically detect how to parse web
// requests based on the type parameters of the function.
async fn handle_ws_connection(
    // Since this function has a `WebSocketUpgrade` paremeter, `axum` knows it
    // should accept websocket connections on this route.
    ws: WebSocketUpgrade,
    // This is an example of "destructuring"
    //
    // You can do something similar with tuples like
    // `let (a, b) = (1, 2);` which sets a = 1, and b = 2
    //
    // Relevant: https://doc.rust-lang.org/rust-by-example/flow_control/match/destructuring.html
    Extension(state): Extension<SharedState>,
) -> Response {
    ws.on_upgrade(|socket| handle_ws(socket, state))
}

/// Deals with an upgraded websocket.
async fn handle_ws(mut socket: WebSocket, state: SharedState) {
    let action = if let Some(action) = next_action(&mut socket).await {
        action
    } else {
        eprintln!("Couldn't parse action");
        return;
    };

    match action {
        Action::CreateRoom { questions } => create_room(socket, state, questions).await,
        Action::JoinRoom { room_id, username } => join_room(socket, state, room_id, username).await,
        action => eprintln!("Invalid first action {action:?}"),
    };
}

/// Handles room creation.
///
/// The websocket will be treated as the "host" from now on.
async fn create_room(
    mut host: WebSocket,
    state: SharedState,
    questions: Vec<Question>,
) {
    eprintln!("Creating room...");

    let (action_tx, action_rx) = mpsc::channel(20);
    let (result_tx, result_rx) = watch::channel(GameEvent::InLobby);
    let (users, mut player_event_rx) = Users::new();

    // Create an empty room
    let room = Room {
        users,
        result_stream: result_rx,
        action_stream: action_tx,
    };

    // Put the room into an `Arc`
    let room = Arc::new(room);

    let room_id = state.insert_room(Arc::clone(&room));

    // Room creation event
    eprintln!("Sending room id: `{room_id}`");
    {
        let event = HostEvent::RoomCreated { room_id };
        let _ = host.send(event.to_message()).await;
    }

    let (mut host_tx, mut host_rx) = host.split();

    // Wrap the host transmitter with an `mpsc`
    let host_tx = {
        let (host_tx_mpsc, mut rx) = mpsc::channel::<HostEvent>(30);

        tokio::spawn(async move {
            while let Some(event) = rx.recv().await {
                if host_tx.send(event.to_message())
                    .await
                    .is_err()
                {
                    return;
                }
            }
        });

        host_tx_mpsc
    };

    // Forward player leave/join to host
    let join_leave_task = {
        let host_tx = host_tx.clone();
        tokio::spawn(async move {
            while let Some(event) = player_event_rx.recv().await {
                let event = match event {
                    state::PlayerEvent::Joined(username) => HostEvent::UserJoined { username },
                    state::PlayerEvent::Left(username) => HostEvent::UserLeft { username },
                };

                let _ = host_tx.send(event).await;
            }
        })
    };

    // Wait until host begins room and there is at least one player in lobby
    loop {
        match next_action(&mut host_rx).await {
            // Host tries to begin the first round
            Some(Action::BeginRound) => {
                eprintln!("Attempting to start game...");

                // Accquire lock on users mutex, and check the length
                if room.users.player_count() > 0 {
                    eprintln!("Starting game...");
                    break;
                } else {
                    eprintln!("Not enough players.");
                }
            }
            // Close room otherwise
            _ => {
                state.remove_room(&room_id).await;
                return;
            }
        }
    }

    let action_rx = Arc::new(tokio::sync::Mutex::new(action_rx));
    for question in questions.into_iter() {
        let point_gains = Arc::new(tokio::sync::Mutex::new(HashMap::new()));

        // Collect answers from users
        let mut answer_collect_task = {
            let host_tx = host_tx.clone();
            let action_rx = Arc::clone(&action_rx);
            let point_gains = Arc::clone(&point_gains);
            let correct_choice = question.answer;
            let room = Arc::clone(&room);

            tokio::spawn(async move {
                let mut answered = HashSet::new();
                let mut action_rx = action_rx.lock().await;
                let mut point_gains = point_gains.lock().await;
                let mut points = 1000;

                while let Some(PlayerAnswer { username, choice }) = action_rx.recv().await {
                    if answered.contains(&username) {
                        return;
                    }

                    answered.insert(username.clone());

                    // Tell host user answered
                    let _ = host_tx.send(HostEvent::UserAnswered {
                        username: username.clone()
                    }).await;

                    eprintln!("`{username}` answered {choice}");

                    // If the choice is correct
                    if choice == correct_choice {

                        // Update points log
                        eprintln!("`{username}` +{points}");
                        point_gains.insert(username, points);

                        // Decrease next point gain
                        points = (points * 10 / 11).max(1);
                    }

                    // Has every player answered
                    let all_answered = room.users.users
                        .lock().unwrap()
                        .iter()
                        .all(|name| answered.contains(name));

                    // If everyone has answered, finish task
                    if all_answered {
                        return;
                    }
                }
            })
        };

        // Save values
        let question_time = question.time as u64;
        let choice_count = question.choices.len();

        // Alert host that the round began
        eprintln!("Alerting host that round began...");
        let _ = host_tx.send(HostEvent::RoundBegin { question }).await;

        // Alert players a round began
        eprintln!("Alerting players that round began...");
        let _ = result_tx
            .send(GameEvent::RoundBegin { choice_count });

        // Wait for the time duration or for the task to fully complete
        let time_task = tokio::time::sleep(Duration::from_secs(question_time));
        tokio::pin!(time_task);
        tokio::select! {
            _ = (&mut time_task) => answer_collect_task.abort(),
            _ = (&mut answer_collect_task) => { drop(time_task) },
        };

        eprintln!("End of round...");

        let point_gains = point_gains.lock().await.clone();

        // Tell host that the round ended
        eprintln!("Alerting host that round ended...");
        let _ = host_tx.send(HostEvent::RoundEnd { point_gains: point_gains.clone() }).await;

        // Alert players round ended
        eprintln!("Alerting players that round ended...");
        let _ = result_tx
            .send(GameEvent::RoundEnd { point_gains: Arc::new(point_gains) });

        // Wait until host begins next round
        match next_action(&mut host_rx).await {
            Some(Action::BeginRound) => (),
            _ => {
                eprintln!("Closing room...");
                state.remove_room(&room_id).await;
                return;
            }
        }
    }

    eprintln!("Game is over!");

    // Alert host that the game ended
    eprintln!("Alerting host that game has ended...");
    let _ = host_tx.send(HostEvent::GameEnd).await;

    join_leave_task.abort();
    drop(room);

    state.remove_room(&room_id).await;
        
    // Alert players game ended
    let _ = result_tx
        .send(GameEvent::GameEnd);
}

/// Handles room joining.
///
/// The websocket will be treated as a "player" from now on.
async fn join_room(
    socket: WebSocket,
    state: SharedState,
    room_id: RoomId,
    username: String,
) {
    eprintln!("Finding room `{room_id}`...");
    let room = if let Some(room) = state.find_room(&room_id) {
        room
    } else {
        eprintln!("Couldn't find room `{room_id}`, disconnecting...");
        return;
    };

    eprintln!("Joining room...");

    let (mut user_tx, mut user_rx) = socket.split();
    let presence = if let Some(presence) = room.users.join_user(username.clone()).await {
        presence
    } else {
        eprintln!("User `{username}` already exists, disconnecting...");
        return
    };

    // Watch for game status updates
    let mut game_event_task = {
        let mut event_watch = room.result_stream.clone();
        let username = username.clone();
        tokio::spawn(async move {
            // If the game status changed
            while let Ok(_) = event_watch.changed().await {
                let event = event_watch.borrow().clone();
                match event {
                    GameEvent::GameEnd => {
                        let event = UserEvent::GameEnd;
                        let _ = user_tx.send(event.to_message()).await;
                    }
                    GameEvent::RoundBegin { choice_count } => {
                        let event = UserEvent::RoundBegin { choice_count };
                        let _ = user_tx.send(event.to_message()).await;
                    }
                    GameEvent::RoundEnd { point_gains } => {
                        let point_gain = point_gains.get(&username).copied();
                        let event = UserEvent::RoundEnd { point_gain };
                        let _ = user_tx.send(event.to_message()).await;
                    }
                    GameEvent::InLobby => (),
                }
            }
        })
    };

    // Feed user answers into action stream for the host to deal with
    let mut user_action_task = {
        let action_stream = room.action_stream.clone();
        tokio::spawn(async move {
            while let Some(action) = next_action(&mut user_rx).await {
                if let Action::Answer { choice } = action {
                    let _ = action_stream.send(PlayerAnswer { username: username.clone(), choice })
                        .await;
                }
            }
        })
    };

    // Wait until either task ends
    tokio::select! {
        _ = (&mut game_event_task) => user_action_task.abort(),
        _ = (&mut user_action_task) => game_event_task.abort(),
    };

    // Leaves room
    presence.leave().await;
}

async fn next_action<E>(stream: &mut (impl Stream<Item = Result<Message, E>> + Unpin)) -> Option<Action> {
    let msg = stream.next().await?.ok()?;
    eprintln!("Recieved message: {msg:?}");

    let text = msg.to_text().ok()?;

    match serde_json::from_str(text) {
        Ok(action) => Some(action),
        Err(err) => {
            eprintln!("{err}");
            None
        }
    }
}

/// Service for serving files.
fn dir_service() -> MethodRouter {
    get_service(ServeDir::new("static/")
        .append_index_html_on_directories(true))
        .handle_error(|err: io::Error| async move {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Unhandled internal error: {err}"),
            )
        })
} 