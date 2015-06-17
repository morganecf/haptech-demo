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

var simulation_timestep = 1.0 / 60.0;			// 1/seconds
var interval_step = 66;							// milliseconds 

// Global variables
var arena, space, body, spring_body;
var width, height, spring_height;
var arm_size = 300;
var constraints = {};
// Will hold the interval id 
var simulation = null;

function slingshot () {

	running = true;

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
  	var ground = segment(arena.ground.x1, arena.ground.y1, arena.ground.x2, arena.ground.y2);
 	var armL = segment(arena.armTop.x1, arena.armTop.y1, arena.armTop.x2, arena.armTop.y2);
 	var armR = segment(arena.armBottom.x1, arena.armBottom.y1, arena.armBottom.x2, arena.armBottom.y2);

 	space.setDefaultCollisionHandler(null, null, function (arbiter, space) {
 		console.log('collision');
 	});

	// Step through the simulation 
	simulation = setInterval(function () {
		if (body) {
			var pos = body.getPos();

			/* HI RICHARD THIS IS WHERE I PRINT OUT THE SPRING FORCE */
			if (constraints.spring_on) {	
				var delta = cp.v.sub(pos, spring_body.p);
				var dist = cp.v.len(delta);
				var n = cp.v.mult(delta, 1/(dist ? dist : Infinity));
				var f_spring = constraints.spring.springForceFunc(constraints.spring, dist);
				var spring_force = {x: n.x * f_spring, y: n.y * f_spring};

				console.log('SPRING FORCE:', spring_force);
				console.log();
			}

			// Add an offset of 5
			if (constraints.spring_on && pos.x > (arena.start.x + arena.bird_radius + 5)) {
				console.log('release');
				space.removeConstraint(constraints.spring);
				constraints.spring_on = false;
			}

			space.step(simulation_timestep);
			io.emit('draw', pos);
		}
	}, 66);
}

// Start the simulation as soon as front end has loaded 
io.on('connection', function (socket) {

	// Wait for the front end to be ready 
	socket.on('ready', function (arena_info) {
		// Kill any existing simulations 
		if (simulation) {
			clearInterval(simulation);
			simulation = null;
		}

		arena = JSON.parse(arena_info);
		width = arena.width;
		height = arena.height;

		slingshot();
	});
 
 	// On mouse down, create the bird and spring 
	socket.on('mousedown', function (pos) {
		if (space) {
			// The body we're going to throw 
		 	var start = cp.v(arena.bird_center.x, arena.bird_center.y);
		 	var mass = 3;
		 	var momentum = cp.momentForCircle(mass, 0, arena.bird_radius, cp.v(0, 0));
		 	body = space.addBody(new cp.Body(mass, momentum));
		 	body.setPos(start);
		 	var shape = space.addShape(new cp.CircleShape(body, arena.bird_radius, cp.v(0, 0)));

			// Slingshot is modeled as a simplified spring attached to invisible body in the middle of the two arms
		 	spring_body = new cp.Body(Infinity, Infinity);
		 	spring_body.setPos(arena.start);
		  	var spring = new cp.DampedSpring(spring_body, body, cp.v(0, 0), body.world2Local(start), 0, 1000, 0);
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

});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});


