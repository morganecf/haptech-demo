/* 
	Simple maze example using Chipmunk JS. Go through a maze, moving
	some obstacles in the way. 
*/

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

var mouse_body = null;
var space = null;

// The maze
function maze (height, width) {
	if (!(height && width)) {
		height = 1300;
		width = 800;
	}

	// Create space 
	space = new cp.Space();
	space.gravity = cp.v(0, 500);
	space.collisionSlop = 0.5;

	// Add maze line segments
	var mazeSegment = function (x1, y1, x2, y2, sid) {
		var segment = space.addShape(new cp.SegmentShape(space.staticBody, cp.v(x1, y1), cp.v(x2, y2), 0));
		segment.setFriction(1);
		segment.setElasticity(1);
		segment.setLayers(NOT_GRABABLE_MASK);
		segment.id = sid;
		return segment;
	};
	var padding = 30;
	var door = 100;
	var s1 = mazeSegment(padding, height, width - padding, height, 1);   // bottom
	var s2 = mazeSegment(padding, padding, width - door - padding, padding, 2);  // top 
	var s3 = mazeSegment(padding, padding, padding, padding * 4, 3);  // far left top 
	var s4 = mazeSegment(padding, (padding * 4) + door, padding, height, 4); // far left bottom 
	var s5 = mazeSegment(width - door - padding, padding, width - door - padding, height / 1.5, 5);  // inner right top
	var s6 = mazeSegment(width - padding, height, width - padding, padding, 6); // far right 
	var s7 = mazeSegment(width - door - padding, height / 1.5, width - door - (padding * 7), height / 1.5, 7);
	var s8 = mazeSegment(width - door - (padding * 7), height / 1.5, width - door - (padding * 7), padding + door, 8);
	var s9 = mazeSegment(width - door - (padding * 7), padding + door, padding + door * 1.5, padding + door, 9);
	var s10 = mazeSegment(padding + door * 4, padding + door, padding + door * 4, height - door * 3, 10);
	var s11 = mazeSegment(width * .6, height, width * .6, height - door, 11);
	var s12 = mazeSegment(width * .8, height - door, width * .5, height - door, 12);
	var s13 = mazeSegment(width * .5, height - door, width * .5, height - (door * 3.5), 13);
	var s14 = mazeSegment(width * .5, height - (door * 1.75), width * .15, height - (door * 1.75), 14);   
	var s15 = mazeSegment(padding, (padding * 4) + door, padding + door, (padding * 4) + door, 15); // liftoff 

	// User attributes 
	var user_mass = 2;
	var user_radius = 25;
	var user_start = cp.v(padding + user_radius, (padding * 4) + door - user_radius);
	var user_moment = cp.momentForCircle(user_mass, 0, user_radius, cp.v(0, 0));
	// User body 
	var user_body = space.addBody(new cp.Body(user_mass, user_moment));
	user_body.setPos(user_start);
	// User collision shape 
	var user_shape = space.addShape(new cp.CircleShape(user_body, user_radius, cp.v(0, 0)));
	user_shape.setFriction(1);
	user_shape.setElasticity(0);

	// Mouse control body 
	mouse_body = new cp.Body(Infinity, Infinity);
	mouse_body.setPos(user_start);

	// Add a collision handler for the wall and ball - THIS IS DEFAULT ONE 
	space.setDefaultCollisionHandler(null, null, function (arbiter, space) {
		// TODO: get custom collision handler working
		var wall_id = arbiter.getA().id ? arbiter.getA().id : arbiter.getB().id;
		io.emit('wall-collision', wall_id);
	});

	// Now step through the simulation 
	setInterval(function () {
		var pos = user_body.getPos();
		space.step(1.0/60.0);
		io.emit('draw', pos);
	}, 66);
}

// Start the simulation as soon as front end has loaded 
io.on('connection', function (socket) {

	// Wait for the front end to be ready 
	socket.on('ready', function (dimensions) {
		maze(dimensions.height, dimensions.width);
	});

	// Listen for the user (mouse) moving
	socket.on('user-move', function (pos) {
		if (mouse_body) mouse_body.setPos(cp.v(pos.x, pos.y));
	});

	// Add a joint constraint once user clicks on circle, so that 
	// the mouse control body can drag the circle around 
	socket.on('mousedown', function (pos) {
		if (space) {
			var shape = space.pointQueryFirst(pos, GRABABLE_MASK_BIT, cp.NO_GROUP);
			if (shape) {
				var body = shape.body;

				// Add a joint
				var mouseJoint = new cp.PivotJoint(mouse_body, body, cp.v(0, 0),  body.world2Local(pos));
				mouseJoint.maxForce = 50000;
				mouseJoint.errorBias = 0.0000001;
				space.addConstraint(mouseJoint);
			}
		}
	});

	// Update the mouse body position 
	socket.on('mousemove', function (pos) {
		if (mouse_body) mouse_body.setPos(cp.v(pos.x, pos.y));
	});
});

// Listen to port 3000
http.listen(3000, function () {
    console.log("listening on *:3000");
});

