// Create WebSocket connection.
const socket = new WebSocket("wss://ws.postman-echo.com/raw");

//  Listen for messages
var receiveMessage = (e) => {
  console.log("Message from server: ", event.data);
};

socket.addEventListener("message", receiveMessage);

// Send messages
var sendMessage = (e) => {
  const message = document.getElementById("message").value;
  console.log("Sending: ", message);
  socket.send(message);
};

var sendButton = document.getElementById("send");
sendButton.addEventListener("click", sendMessage);
