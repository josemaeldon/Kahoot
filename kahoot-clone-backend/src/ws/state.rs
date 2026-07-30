use super::api::{RankingEntry, RoomId};

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tokio::sync::{mpsc, watch};

// `Arc` is an "atomic reference counter" which allows multiple ownership
// of values across threads.
//
// Relevant: https://doc.rust-lang.org/book/ch15-00-smart-pointers.html
//           https://doc.rust-lang.org/std/sync/struct.Arc.html
pub type SharedState = Arc<State>;

/// Structure representing the state of our program
pub struct State {
    // A `Mutex` is used when you want to share mutability across threads.
    //
    // Relevant: https://doc.rust-lang.org/book/ch16-03-shared-state.html
    pub rooms: Mutex<HashMap<RoomId, Arc<Room>>>,
}

pub struct Room {
    pub users: Users,
    pub action_stream: mpsc::Sender<PlayerAction>,
    pub result_stream: watch::Receiver<GameEvent>,
    pub scores: Arc<Mutex<HashMap<String, u32>>>,
}

pub struct Users {
    users: Arc<Mutex<UserMap>>,
    event_stream: mpsc::Sender<PlayerEvent>,
    next_connection_id: AtomicU64,
    reconnect_grace: Duration,
}

struct UserSession {
    token: String,
    connection_id: u64,
    connected: bool,
}

type UserMap = HashMap<String, UserSession>;

pub struct UserPresence {
    username: String,
    connection_id: u64,
    users: Arc<Mutex<UserMap>>,
    event_stream: mpsc::Sender<PlayerEvent>,
    reconnect_grace: Duration,
}

pub enum PlayerAction {
    Answer { username: String, choice: usize },
    Leave { username: String },
}

#[derive(Clone)]
pub enum GameEvent {
    InLobby,
    RoundBegin {
        choices: Vec<String>,
    },
    RoundEnd {
        point_gains: Arc<HashMap<String, u32>>,
    },
    GameEnd {
        ranking: Arc<Vec<RankingEntry>>,
    },
}

pub enum PlayerEvent {
    Joined(String),
    Left(String),
}

impl State {
    pub fn insert_room(&self, room: Arc<Room>) -> RoomId {
        let mut rooms = self.rooms.lock().unwrap();
        loop {
            let id: RoomId = rand::random::<u32>() % 900_000 + 100_000;
            if let std::collections::hash_map::Entry::Vacant(entry) = rooms.entry(id) {
                entry.insert(Arc::clone(&room));
                return id;
            }
        }
    }

    pub async fn remove_room(&self, room_id: &RoomId) {
        let mut rooms = self.rooms.lock().unwrap();
        if rooms.remove(&room_id).is_none() {
            tracing::debug!("Room `{room_id}` doesn't exist");
            return;
        }
    }

    pub fn find_room(&self, room_id: &RoomId) -> Option<Arc<Room>> {
        self.rooms.lock().unwrap().get(room_id).map(Arc::clone)
    }
}

impl Users {
    pub fn new() -> (Self, mpsc::Receiver<PlayerEvent>) {
        // Accommodates bursts of joins without making 500+ clients wait for
        // the host UI to render each name before accepting the next socket.
        let (tx, rx) = mpsc::channel(2048);

        let users = Arc::new(Mutex::new(HashMap::new()));

        let users = Self {
            users,
            event_stream: tx,
            next_connection_id: AtomicU64::new(1),
            reconnect_grace: reconnect_grace(),
        };

        (users, rx)
    }

    pub fn connected_player_count(&self) -> usize {
        self.users
            .lock()
            .unwrap()
            .values()
            .filter(|session| session.connected)
            .count()
    }

    pub fn usernames(&self) -> Vec<String> {
        self.users.lock().unwrap().keys().cloned().collect()
    }

    pub fn is_current_connection(&self, name: &str, connection_id: u64) -> bool {
        self.users
            .lock()
            .unwrap()
            .get(name)
            .is_some_and(|session| {
                session.connected && session.connection_id == connection_id
            })
    }

    pub async fn leave_user(&self, name: &str, connection_id: u64) -> bool {
        let removed = {
            let mut users = self.users.lock().unwrap();
            let should_remove = users
                .get(name)
                .is_some_and(|session| session.connection_id == connection_id);
            if should_remove {
                users.remove(name);
            }
            should_remove
        };

        if removed {
            let _ = self
                .event_stream
                .send(PlayerEvent::Left(name.to_owned()))
                .await;
        }
        removed
    }

    /// Tries to add a user to the user map.
    /// Returns the connection presence and a private resume token on success.
    pub async fn join_user(&self, name: String) -> Option<(UserPresence, String)> {
        let connection_id = self.next_connection_id.fetch_add(1, Ordering::Relaxed);
        let token = format!("{:016x}{:016x}", rand::random::<u64>(), rand::random::<u64>());
        {
            tracing::debug!("Accquiring users lock to add new user...");
            let mut users = self.users.lock().unwrap();
            tracing::debug!("Lock accquired.");

            if users.contains_key(&name) {
                return None;
            }

            tracing::debug!("Adding `{name}`...");
            users.insert(
                name.clone(),
                UserSession {
                    token: token.clone(),
                    connection_id,
                    connected: true,
                },
            );

            tracing::debug!("User added.");
        }

        // Emitting join event
        let _ = self
            .event_stream
            .send(PlayerEvent::Joined(name.clone()))
            .await;

        Some((
            self.presence(name, connection_id),
            token,
        ))
    }

    /// Reconnects an existing player without losing their identity or score.
    /// The newest connection supersedes any older socket using the same token.
    pub fn resume_user(&self, name: &str, token: &str) -> Option<UserPresence> {
        let connection_id = self.next_connection_id.fetch_add(1, Ordering::Relaxed);
        {
            let mut users = self.users.lock().unwrap();
            let session = users.get_mut(name)?;
            if session.token != token {
                return None;
            }
            session.connection_id = connection_id;
            session.connected = true;
        }

        Some(self.presence(name.to_owned(), connection_id))
    }

    fn presence(&self, username: String, connection_id: u64) -> UserPresence {
        UserPresence {
            username,
            connection_id,
            users: Arc::clone(&self.users),
            event_stream: self.event_stream.clone(),
            reconnect_grace: self.reconnect_grace,
        }
    }
}

impl Drop for UserPresence {
    /// Marks the player offline, but keeps the session long enough for mobile
    /// network changes, proxy resets and suspended browser tabs to reconnect.
    fn drop(&mut self) {
        {
            let mut users = self.users.lock().unwrap();
            let Some(session) = users.get_mut(&self.username) else {
                return;
            };
            if session.connection_id != self.connection_id {
                return;
            }
            session.connected = false;
        }

        let username = self.username.clone();
        let connection_id = self.connection_id;
        let users = Arc::clone(&self.users);
        let event_stream = self.event_stream.clone();
        let reconnect_grace = self.reconnect_grace;

        tokio::spawn(async move {
            tokio::time::sleep(reconnect_grace).await;
            let removed = {
                let mut users = users.lock().unwrap();
                let should_remove = users.get(&username).is_some_and(|session| {
                    !session.connected && session.connection_id == connection_id
                });
                if should_remove {
                    users.remove(&username);
                }
                should_remove
            };

            if removed {
                let _ = event_stream.send(PlayerEvent::Left(username)).await;
            }
        });
    }
}

impl UserPresence {
    pub fn connection_id(&self) -> u64 {
        self.connection_id
    }
}

fn reconnect_grace() -> Duration {
    #[cfg(test)]
    {
        return Duration::from_millis(50);
    }

    #[cfg(not(test))]
    {
        let seconds = std::env::var("PLAYER_RECONNECT_GRACE_SECONDS")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(120)
            .clamp(30, 3600);
        Duration::from_secs(seconds)
    }
}
