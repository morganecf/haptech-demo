/* JS hello world example of chipmunk's C hello world  */

// Server/socket stuff 
// var express = require('express');
// var app = express();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);
// app.use(express.static(__dirname));
// app.get('/', function (request, response) {
//     response.sendFile(__dirname + '/hello.html');
// });

cp = require("chipmunk");

// The hello world simulation 
function hello_world () {
	// Create space 
	var space = new cp.Space();
	space.gravity = cp.v(0, -100);
	space.collisionSlop = 0.5;

	// Add static line segment for ground  
	var ground = space.addShape(new cp.SegmentShape(space.staticBody, cp.v(0, 0), cp.v(100, 0), 0));
	ground.setFriction(1);

	// Set moment of inertia (mass for rotation)
	var radius = 5;
	var mass = 1;
	var moment = cp.momentForCircle(mass, 0, radius, cp.v(0, 0));

	// Add the ball body
	var body = space.addBody(new cp.Body(mass, moment));
	body.setPos(cp.v(50, 15));

	// Add the associated collision shape of the ball 
	var shape = space.addShape(new cp.CircleShape(body, radius, cp.v(0, 0)));
	shape.setFriction(0.7);

	// Add a collision handler for the wall and ball 
	// args: obj1, obj2, preSolve, postSolve, separate
	// space.addCollisionHandler(ground, body, null, null, function (arbiter, space, data) {
	// 	console.log("collision detected");
	// });
	space.setDefaultCollisionHandler(null, null, function (arbiter, space, data) {
		console.log("collision detected");
	});

	// Now step through the simulation of a ball dropping 
	var time_step = 1.0/60.0;

	for (var time = 0; time < 2; time += time_step) {
		var pos = body.getPos();
		var vel = body.getVel();

		console.log(pos);

		// console.log('Time:', time);
		// console.log('Position:', pos);
		// console.log('Velocity:', vel);
		// console.log('');

		// if (body.space.arbiters[0]) {
		// 	console.log(body.space.arbiters[0].getContactPointSet());
		// 	console.log("COLLISION");
		// 	console.log(pos);
		// }
		// else {
		// 	console.log('no collision');
		// 	console.log(pos);
		// }

		space.step(time_step);

		//io.emit('draw', pos);
	}
}

hello_world();

// Start the simulation as soon as front end has loaded 
// io.on('connection', function (socket) {
// 	socket.on('ready', function () {
// 		hello_world();
// 	});
// });

// // Listen to port 3000
// http.listen(3000, function () {
//     console.log("listening on *:3000");
// });

