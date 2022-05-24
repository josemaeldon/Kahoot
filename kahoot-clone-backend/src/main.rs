/// Module for handling the websocket api.
mod ws;
mod ext;

// Standard library stuffs
use std::io;
use std::sync::{Arc, Mutex};
use std::net::SocketAddr;
use std::collections::HashMap;

use ws::handle_ws_connection;
use ws::state::State;

// `axum` is a Rust web server framework
use axum::{Extension, Router};
use axum::routing::{MethodRouter, get_service, get};
use axum::http::StatusCode;

// `axum` is built on top of `tower_http`, so we can use some of its tools and
// integrate it with the `axum` server.
use tower_http::services::ServeDir;

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