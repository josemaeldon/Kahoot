// Create WebSocket connection.
const socket = WebSocket('localhost:8000');

// Connection opened
socket.addEventListener('open', function (event) {
	socket.send('Hello Server');
});

//  Listen for messages
socket.addEventListener('message',
function(event) {
	console.log('Message from server: ', event.data);
});
