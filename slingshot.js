/* 
	Simple slingshot example using Chipmunk JS. 
*/

// Server/socket stuff 
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname));
app.get('/', function (request, response) {
    response.sendFile(__dirname + '/slingshot.html');
});

// Import the physics library 
var cp = require('chipmunk');

// Constants 
var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

var simulation_timestep = 1.0 / 60.0;		// 1/seconds
var interval_step = 66;						// milliseconds 

// Global variables
var body = null;
var space = null;
var arm_size = 300;
var constraints = {};
var width, height, spring_height;

function slingshot (height, width) {
	if (!(height && width)) {
		height = 1300;
		width = 800;
	}

	// Create space 
	space = new cp.Space();
	space.gravity = cp.v(0, 0);
	space.collisionSlop = 0.5;

	// Function for slingshot parts 
	var segment = function (x1, y1, x2, y2) {
  		var seg = space.addShape(new cp.SegmentShape(space.staticBody, cp.v(x1, y1), cp.v(x2, y2), 0));
		seg.setFriction(1);
		seg.setElasticity(1);
		seg.setLayers(NOT_GRABABLE_MASK);
		return segment;
  	};

  	// The ground and two slingshot arms 
  	var ground = segment(0, height, width, height);
 	var armL = segment(width * .33, height, width * .33, height - arm_size);
 	var armR = segment(width * .63, height, width * .63, height - arm_size);

 	space.setDefaultCollisionHandler(null, null, function (arbiter, space) {
 		console.log('collision');
 	});

	// Step through the simulation 
	setInterval(function () {
		if (body) {
			var pos = body.getPos();

			if (constraints.spring_on && pos.y < spring_height) {
				space.removeConstraint(constraints.spring);
				constraints.spring_on = false;
			}

			space.step(simulation_timestep);
			io.emit('draw', pos);
		}
	}, interval_step);

}

// Start the simulation as soon as front end has loaded 
io.on('connection', function (socket) {

	// Somewhat arbitrary
  	var slingshotPath = function (x) {
  		return -50 * Math.sin(x / 100) + (height - arm_size);
  	};

	// Wait for the front end to be ready 
	socket.on('ready', function (dimensions) {
		width = dimensions.width;
		height = dimensions.height;
		spring_height = (slingshotPath(width * .45)) - 8;

		console.log('spring height:', spring_height);

		slingshot(width, height);
	});
 
 	// On mouse down, create the bird and spring 
	socket.on('mousedown', function (pos) {
		if (space) {
			// The body we're going to throw 
		 	var start = cp.v((width * .45) + 20, spring_height);
		 	var mass = 3, radius = 20;
		 	var momentum = cp.momentForCircle(mass, 0, radius, cp.v(0, 0));
		 	body = space.addBody(new cp.Body(mass, momentum));
		 	body.setPos(start);
		 	var shape = space.addShape(new cp.CircleShape(body, radius, cp.v(0, 0)));

			// Slingshot is modeled as a simplified spring attached to invisible body in the middle of the two arms
			//var spring_location = cp.v((width * .45 + 20), height - arm_size); 
		 	var spring_body = new cp.Body(Infinity, Infinity);
		 	spring_body.setPos(start);
		  	var spring = new cp.DampedSpring(spring_body, body, cp.v(0, 0), body.world2Local(start), 0, 100, 0);
			space.addConstraint(spring);
			constraints.spring = spring;
			constraints.spring_on = true;

			io.emit('pulling');
		}
	});

	// Update the bird body position 
	socket.on('mousemove', function (pos) {
		if (body) body.setPos(cp.v(pos.x, pos.y));
	});

	// Release the spring once the user unclicks so that the bird can go flying 
	socket.on('mouseup', function () {
	});

});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});

