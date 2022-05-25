use std::collections::HashMap;

use axum::extract::ws::Message;
// `serde` is a library used for serializing and deserializing Rust types into
// from various data representations, namely JSON.
//
// Relevant: https://serde.rs/
use serde::{Deserialize, Serialize};

/// Messages sent by the client to "do" something.
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    CreateRoom { questions: Vec<Question> },
    JoinRoom { room_id: RoomId, username: String },

    // Player only
    Answer { choice: usize },

    // Host only
    BeginRound,
    EndRound,
}

/// Messages sent by the server to the room host.
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HostEvent {
    RoomCreated {
        room_id: RoomId,
    },
    UserJoined {
        username: String,
    },
    UserLeft {
        username: String,
    },
    UserAnswered {
        username: String,
    },
    RoundBegin {
        question: Question,
    },
    RoundEnd {
        /// The amount of points each player gains.
        ///
        /// If they aren't in the object, they got the question wrong or
        /// didn't answer.
        point_gains: HashMap<String, u32>,
    },
    GameEnd,
}

/// Messages sent by the server to a player.
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum UserEvent {
    RoundBegin { choice_count: usize },
    RoundEnd { point_gain: Option<u32> },
    GameEnd,
}

/// A type alias representing a room's id.
//
// Type aliases are useful for reducing duplication and for improving clarity.
//
// Relevant: https://doc.rust-lang.org/reference/items/type-aliases.html
pub type RoomId = u32;

/// A structure containing all relevant information of a question.
#[derive(Debug, Serialize, Deserialize)]
pub struct Question {
    pub question: String,
    /// All of the valid choices.
    pub choices: Vec<String>,
    /// The index of the correct answer.
    pub answer: usize,
    /// The maximum number of seconds for this question.
    pub time: u16,
}

impl TryFrom<Message> for Action {
    type Error = ();

    fn try_from(msg: Message) -> Result<Action, Self::Error> {
        let text = msg.to_text().map_err(|_| ())?;
        serde_json::from_str(text).map_err(|_| ())
    }
}
