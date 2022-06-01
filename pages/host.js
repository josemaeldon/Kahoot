// Create WebSocket connection.
const socket = new WebSocket("ws://64.225.12.53/ws");
// buttons
const createRmBtn = document.getElementById("createRmBtn");
// rm id
const display = document.getElementById("display");
//  Listen for messages
var receiveMessage = (e) => {
	console.log("Message from server: ", event.data);
	let data = JSON.parse(event.data);

	switch (data.type) {
		case "roomCreated":
			display.innerText = `Room ID: ${data.roomId}`;
			break;
		case "userJoined":

			break;
	}
};

socket.addEventListener("message", receiveMessage);

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
}
