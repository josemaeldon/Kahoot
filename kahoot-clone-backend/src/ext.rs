use axum::extract::ws::Message;
use serde::Serialize;

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
