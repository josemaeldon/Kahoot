// Create WebSocket connection.
const socket = new WebSocket("ws://64.225.12.53/ws");
// buttons
const joinBtn = document.getElementById("joinBtn");
const createRmBtn = document.getElementById("createRmBtn");
// code box
const codeBox = document.getElementById("code");
// rm idea
const roomId = document.getElementById("roomId");
//  Listen for messages
var receiveMessage = (e) => {
	console.log("Message from server: ", event.data);
	let data = JSON.parse(event.data);

	switch (data.type) {
		case "roomCreated":
			roomId.innerText = `Room ID: ${data.roomId}`;
			break;
	}
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
	let code = codeBox.value;
	code = parseInt(code);
	let msg = {
		type: "joinRoom",
		roomId: code,
		username: "test",
	};
	msg = JSON.stringify(msg);

	console.log("Code: ", msg);
	socket.send(msg);

	codeBox.remove();
	joinBtn.remove();
	createRmBtn.remove();
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

	createRmBtn.remove();
	joinBtn.remove();
	codeBox.remove();
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
