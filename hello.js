/* JS hello world example of chipmunk's C hello world  */

// Server/socket stuff 
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname));
app.get('/', function (request, response) {
    response.sendFile(__dirname + '/hello.html');
});

// Import the physics library 
var cp = require('chipmunk');

// Constants 
var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

// The hello world simulation 
function hello_world (height, width) {
	if (!(height && width)) {
		height = 1300;
		width = 800;
	}

	// CONSTANTS 
	var ground_start = cp.v(0, height);
	var ground_end = cp.v(width, height);
	var circle_start = cp.v(width / 2, 20);
	var circle_radius = 10;
	var circle_mass = 50;

	// Create space 
	var space = new cp.Space();
	space.gravity = cp.v(0, 500);
	space.collisionSlop = 0.5;

	// Add static line segment for ground  
	var ground = space.addShape(new cp.SegmentShape(space.staticBody, ground_start, ground_end, 0));
	ground.setFriction(1);
	ground.setElasticity(1);
	ground.setLayers(NOT_GRABABLE_MASK);

	// Set moment of inertia (mass for rotation)
	var moment = cp.momentForCircle(circle_mass, 0, circle_radius, cp.v(0, 0));

	// Add the ball body
	var body = space.addBody(new cp.Body(circle_mass, moment));
	body.setPos(circle_start);

	// Add the associated collision shape of the ball 
	var shape = space.addShape(new cp.CircleShape(body, circle_radius, cp.v(0, 0)));
	shape.setFriction(1);
	shape.setElasticity(1);

	// Add a collision handler for the wall and ball 
	// args: obj1, obj2, preSolve, postSolve, separate
	// space.addCollisionHandler(ground, body, null, null, function (arbiter, space, data) {
	// 	console.log("collision detected");
	// });
	space.setDefaultCollisionHandler(null, null, function (arbiter, space) {
		console.log("collision detected:", arbiter.getA().tc);
		// console.log(arbiter.totalImpulse());
		// console.log(arbiter.totalImpulseWithFriction());
		// console.log(arbiter.totalKE());
	});

	// Now step through the simulation of a ball dropping 
	var time_step = 1.0/60.0;

	for (var time = 0; time < 2; time += time_step) {
		var pos = body.getPos();
		var vel = body.getVel();

		io.emit('draw', pos);

		space.step(time_step);

		console.log(pos);
	}
}

// For debugging the simulation only: 
//hello_world();

// Start the simulation as soon as front end has loaded 
io.on('connection', function (socket) {
	socket.on('ready', function (dimensions) {
		hello_world(dimensions.height, dimensions.width);
	});
});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});

