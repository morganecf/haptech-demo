/*
	Contains the server backend and the Chipmunk simulation engine. 
*/

// Initialize server/socket 
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname));
app.get('/', function (request, response) {
    response.sendFile(__dirname + '/test.html');
});

// Initialize physics engine 
var cp = require('chipmunk');

// Add some helper functions 
// cp.Space.prototype.running = false;

// cp.Space.prototype.stop = function () {
// 	this.running = false;
// }

// cp.Space.prototype.start = function (dt) {
// 	this.running = true;
// 	this.myStep(dt);
// }

// cp.Space.prototype.myStep = function (dt) {
// 	if (!this.running) return;
// 	this.step(dt);
// }

// Some constants
var width = 1335;
var height = 568;

var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

// The current simulation 
var simulation = null;

function init_ball_simulation () {
	// Init the chipmunk space 
	var space = new cp.Space();
	space.iterations = 20;
	space.gravity = cp.v(0, -500);
	space.sleepTimeThreshold = 0.5;
	space.collisionSlop = 0.5;
	space.sleepTimeThreshold = 0.5;

	//add floor
	var pts = [cp.v(0, 0), cp.v(width, 0)];
	var floor = space.addShape(new cp.SegmentShape(space.staticBody, pts[0], pts[1], 0));
	floor.setElasticity(1);
	floor.setFriction(1);
	floor.setLayers(NOT_GRABABLE_MASK);
	  
	//add walls
	pts = [cp.v(0, 0), cp.v(0, height), cp.v(width, 0), cp.v(width, height)];
	var wall1 = space.addShape(new cp.SegmentShape(space.staticBody, pts[0], pts[1], 0));
	wall1.setElasticity(1);
	wall1.setFriction(1);
	wall1.setLayers(NOT_GRABABLE_MASK);
	var wall2 = space.addShape(new cp.SegmentShape(space.staticBody, pts[2], pts[3], 0));
	wall2.setElasticity(1);
	wall2.setFriction(1);
	wall2.setLayers(NOT_GRABABLE_MASK);

	//add balls
	var circles = [];
	for (var i = 1; i <= 2; i++) {
		var radius = 20+i;
		mass = 3+(i*2)/i;
		var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0, radius, cp.v(0,0))));
		pts = [cp.v(200 + i, (2 * radius + 5) * i)];
		body.setPos(pts[0]);
		var circle = space.addShape(new cp.CircleShape(body, radius, cp.v(0, 0)));
		circle.setElasticity(0.8);
		circle.setFriction(1);
		circles.push(circle);
	}

	return {'space': space, 'circles': circles};
}

function start_ball_simulation () {
	simulation = init_ball_simulation();
	setInterval(function () {
		// Step through simulation 
		simulation.space.step(1/30);
		//simulation.space.start(1/30);

		// Send positional data to front end at 30 hz
		// make this modular
		var data = [];
		for (var i = 0; i < simulation.circles.length; i++) {
			data.push({x: simulation.circles[i].tc.x, y: simulation.circles[i].tc.y});
		}
		io.emit('draw', {'circle_data': data});

	}, 33);
}

function init_test_simulation () {
	// Quick test: one static ball, one moving ball 

	var space = new cp.Space();
	space.iterations = 20;
	// space.gravity = cp.v(0, -100);
	space.gravity = cp.v(-100, 0);
	space.sleepTimeThreshold = 0.5;
	// space.collisionSlop = 0.5;
	space.sleepTimeThreshold = 0.5;

	//add floor
	var pts = [cp.v(0, 0), cp.v(width, 0)];
	var floor = space.addShape(new cp.SegmentShape(space.staticBody, pts[0], pts[1], 0));
	console.log(floor);
	floor.setElasticity(1);
	floor.setFriction(0);
	floor.setLayers(NOT_GRABABLE_MASK);
	  
	//add walls
	pts = [cp.v(0, 0), cp.v(0, height), cp.v(width, 0), cp.v(width, height)];
	var wall1 = space.addShape(new cp.SegmentShape(space.staticBody, pts[0], pts[1], 0));
	wall1.setElasticity(1);
	wall1.setFriction(1);
	wall1.setLayers(NOT_GRABABLE_MASK);

	var wall2 = space.addShape(new cp.SegmentShape(space.staticBody, pts[2], pts[3], 0));
	wall2.setElasticity(1);
	wall2.setFriction(1);
	wall2.setLayers(NOT_GRABABLE_MASK);

	var mass1 = radius1 = 100;
	// var moment = cp.momentForCircle(mass1, 0, radius1, cp.v(0, 0));
	var moment = .0000001;
	console.log(moment);
	var body1 = space.addBody(new cp.Body(mass1, moment));
	var circle1 = space.addShape(new cp.CircleShape(body1, radius1, cp.v(500, 200)));
	circle1.setElasticity(0.8);
	circle1.setFriction(0);

	var mass2 = radius2 = 50;
	var body2 = space.addBody(new cp.Body(mass2, moment));
	var circle2 = space.addShape(new cp.CircleShape(body2, radius2, cp.v(800, 200)));
	circle2.setElasticity(0.8);
	circle2.setFriction(0);

	return {'space': space, 'circles': [circle1, circle2]};
}

function start_test_simulation () {
	simulation = init_test_simulation();
	setInterval(function () {
		// Step through simulation 
		simulation.space.step(1/30);

		//console.log(simulation.circles[0].tc);

		// Send positional data to front end at 30 hz
		var data = [];
		data.push({x: simulation.circles[0].tc.x, y: simulation.circles[0].tc.y});
		data.push({x: simulation.circles[1].tc.x, y: simulation.circles[1].tc.y});
		io.emit('draw', {'circle_data': data});

	}, 33);
}


function init_circle_simulation () {

	var simulation = {};

	// Init the chipmunk space 
	var space = new cp.Space();

	// Create the user - connected to device 
 	var user_radius = 35;
 	var user_mass = 100;
	var user_body = space.addBody(new cp.Body(user_mass, cp.momentForCircle(user_mass, 0, user_radius, cp.v(0, 0))));
	var user = space.addShape(new cp.CircleShape(user_body, user_radius, cp.v(0, 0)));

	// Create the circle
	var circle_radius = circle_mass = 60;
	var circle_body = space.addBody(new cp.Body(circle_mass, cp.momentForCircle(circle_mass, 0, circle_radius, cp.v(0, 0))));
	var circle = space.addShape(new cp.CircleShape(circle_body, circle_radius, cp.v(0, 0)));
	circle.setElasticity(0.8);
	circle.setFriction(1);

	// Return a simulation object
	simulation.space = space;
	simulation.user = user;
	simulation.circle = circle;
	return simulation
}


// Listen for connection events 
io.on('connection', function (socket) {
	console.log('a user connected');

	socket.on('ready', function () {
		console.log("frontend is ready");
		// Start the simulation 
		// start_ball_simulation();

		start_test_simulation();

	});

  	// Listen for the user moving 
	// socket.on('user-move', function (move) {

	// 	// Update backend position 
	// 	simulation.user.tc.x = move.x;
	// 	simulation.user.tc.y = move.y;

	// 	// Send message to update frontend position in the demo 
	// 	// (not the emulator - that's already been updated)
	// 	io.emit('user-move-backend', move);

	// });

});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});
