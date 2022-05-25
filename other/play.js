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

// sends value on click
var sendAnswer = (e) => {
	const answer = event.target.value;
	console.log("Sending: ", answer);
	socket.send(answer);
}

/*
var sendButton = document.getElementById("send");
sendButton.addEventListener("click", sendMessage);
*/

var choices = document.getElementsByClassName("choice");
console.log(choices);
Array.from(choices).forEach(
	(choice, index, array) => {
		choice.addEventListener("click", sendAnswer);
	}
);
