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

var user_body = null;

// The hello world simulation 
function hello_world (height, width) {
	if (!(height && width)) {
		height = 1300;
		width = 800;
	}

	/* CONSTANTS */
	// ground
	var ground_start = cp.v(0, height);
	var ground_end = cp.v(width, height);
	// circle
	var circle_start = cp.v(width / 2, 20);
	var circle_radius = 50;
	var circle_mass = 50;
	// user
	var user_start = cp.v(width / 3, 20);
	var user_radius = 20;
	var user_mass = 55;

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

	body.id = 'body';

	// Add the associated collision shape of the ball 
	var shape = space.addShape(new cp.CircleShape(body, circle_radius, cp.v(0, 0)));
	shape.setFriction(1);
	shape.setElasticity(1);

	// Add user 
	var user_moment = cp.momentForCircle(user_mass, 0, user_radius, cp.v(0, 0));
	user_body = space.addBody(new cp.Body(user_mass, user_moment));
	user_body.setPos(user_start);
	var user_shape = space.addShape(new cp.CircleShape(user_body, user_radius, cp.v(0, 0)));
	user_shape.setFriction(1);
	user_shape.setElasticity(1);

	user_body.id = 'user';

	// Add a collision handler for the wall and ball 
	// args: obj1, obj2, before, preSolve, postSolve, separate
	space.addCollisionHandler(user_body, body, null, null, function (arbiter, space) {
		console.log("collision detected!!");
	});
	space.setDefaultCollisionHandler(null, null, function (arbiter, space) {
		// TODO: Fix custom collision handler 
		// In lieu of custom collision handler (not working), get the ids to figure out
		// which bodies are being acted upon -- THIS IS BAD 
		var aid = arbiter.getA().body.id;
		var bid = arbiter.getB().body.id;
		if ((aid == 'user' && bid == 'body') || (bid == 'user' && aid == 'body')) {
			console.log("collision between user and circle detected");
			io.emit('user-collision',  null);
		}
	});

	// Now step through the simulation of a ball dropping
	setInterval(function () {
		var pos = body.getPos();
		space.step(1.0/60.0);
		io.emit('draw', pos);
	}, 66);
}

// For debugging the simulation only: 
//hello_world();

// Start the simulation as soon as front end has loaded 
io.on('connection', function (socket) {
	socket.on('ready', function (dimensions) {
		hello_world(dimensions.height, dimensions.width);
	});

	socket.on('user-move', function (pos) {
		//io.emit('user-move-backend', pos);
		if (user_body) user_body.setPos(cp.v(pos.x, pos.y));
	});
});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});

