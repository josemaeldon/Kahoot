// Create WebSocket connection.
const socket = new WebSocket("ws://64.225.12.53/ws");

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
	const answer = event.target.innerHTML;
	console.log("Sending: ", answer);
	socket.send(answer);
}

var joinRoom = (e) => {
	const code = document.getElementById("code").value;
	console.log("Code: ", code);
	socket.send({
		"type": "joinRoom",
		"roomId": code,
		"username": "test"
	});
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
