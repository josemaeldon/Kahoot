use async_trait::async_trait;
use axum::extract::ws::Message;
use futures::{Stream, StreamExt};
use serde::Serialize;

use crate::ws::api::Action;

pub trait ToMessageExt {
    fn to_message(&self) -> Message;
}

impl<T> ToMessageExt for T
where
    T: Serialize,
{
    fn to_message(&self) -> Message {
        let text = serde_json::to_string(self).unwrap();

        Message::Text(text)
    }
}

#[async_trait]
pub trait NextActionExt {
    async fn next_action(&mut self) -> Option<Action>;
}

#[async_trait]
impl<S, E> NextActionExt for S
where
    S: Stream<Item = Result<Message, E>> + Unpin + Send,
{
    async fn next_action(&mut self) -> Option<Action> {
        let msg = self.next().await?.ok()?;
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
}