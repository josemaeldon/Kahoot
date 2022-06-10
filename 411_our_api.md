# Kahoot Clone API
Hello and welcome to a quick explanation of the Kahoot clone API! This is an in-house API, written in Rust, that powers the Kahoot clone app. All requests and responses are written in JSON.
## Player Side
The player side has the following commands it sends from the client to the server:
1. Joining Game
    1. joinRoom - Sends the API a specific room code, corresponding to a specific game instance. roomId is the code and is an integer value. Username is a string value and will be the display name of the user in the game.
       - Format:
          ```
          {
            type: "joinRoom",
            roomId: code,
            username: input.value,
          };
          ```
2. During Play
    1. answer - Sends the player's answer to the server. The answers are 0 indexed and the choice field is an integer.
       - Format: 
          ```
          {
            type: "answer",
            choice: parseInt(answer) - 1,
          };
          ```
2. 
