
// Initialize app as a function handler used for http server
var express = require('express');

var app = express();

var http = require('http').Server(app);
// Initialize socket with http node server 
var io = require('socket.io')(http);

app.use(express.static(__dirname));

// '/' is router handler, gets called when get to home page 
app.get('/', function (request, response) {
	response.sendFile(__dirname + '/index.html');
});

// Listen for connection events 
io.on('connection', function (socket) {
	console.log('a user connected');

	// Listen for entered emails 
	socket.on('location', function (location) {
    	console.log('location: ' + location);
    	// Emit the message to everyone
    	io.emit('location', location);
  	});

});

// Listen to port 3000 
http.listen(3000, function (){ 
  console.log('listening on *:3000');
});


// Emitting events: Socket io lets you send and receive any data you want, in JSON or binary format
