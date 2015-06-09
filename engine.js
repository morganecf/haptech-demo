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

function init_circle_simulation () {

	// Init the chipmunk space 
	var space = new cp.Space();

	// Create the circle
	var radius = mass = 60;

	var circle_body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0, radius, cp.v(0, 0))));
	var circle = space.addShape(new cp.CircleShape(circle_body, radius, cp.v(0, 0)));
	circle.setElasticity(0.8);
	circle.setFriction(1);
}

function start_circle_simulation () {
	simulation = init_circle_simulation();
}

// Listen for connection events 
io.on('connection', function (socket) {
  console.log('a user connected');

  socket.on('ready', function () {
    console.log("frontend is ready");

    // Start the simulation 
    // start_ball_simulation();
    start_circle_simulation();

  });

});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});
