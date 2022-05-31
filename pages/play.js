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
	const msg = {
		"type": "joinRoom",
		"roomId": code,
		"username": "test"
	};
	console.log("Code: ", msg);
	socket.send(msg);
}

var createRoom = (questions) => {
	let request = {
		type: "createRoom",
		questions: [
			{
				question: "Test",
				choices: ["1", "2", "3"],
				answer: 1,
				time: 30,
			},
		]
	};
	request = JSON.stringify(request);
	console.log("Creating room: ", request);
	socket.send(request);
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
