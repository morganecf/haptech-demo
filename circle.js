var v = cp.v;

var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

// NOTE: hue places color on color wheel - 0 is red, 120 is green, 240 is blue, 360 red again 

var CircleDemo = function () {

	var point2canvas = function(point) {
			return new Point(point.x, (height - point.y));
	};

	var canvas2point = function(x, y) {
		return v(x, height - y);
	};

	var width = window.innerWidth-30;
	var height = window.innerHeight-30;

	// The socket client 
	var socket = io();

	// Install view
	paper.install(window);  
  	paper.setup('canvas');

  	// Create the user 
	var user = new Path.Circle(new Point(0, 0), 35);
	// Customizing you 
	user.fillColor = 'grey';
	user.strokeColor = 'black';
	user.strokeWidth = 5;
	user.opacity = 0.7;

	// Create the circle
	var circle = new Path.Circle(new Point(500, 200), 60);

	console.log(canvas2point(500, 200));

	// Customize it 
	circle.fillColor = {
		hue: 60,
		saturation: 1,
		brightness: 1
	};
	circle.strokeColor = 'black';
	circle.strokeWidth = 5;
	circle.opacity = 0.7;

	view.draw();

	// socket.on('user-move-backend', function (move) {
	// 	console.log('received user move event');
	// 	user.position = new Point(move.x, move.y);
	// 	view.draw();
	// });

	// socket.on('draw', function (data) {
	// 	user.position = new Point(data.user);
	// 	circle.position = new Point(data.circle);
	// });	

	socket.on('draw', function (data) {
		user.position = new Point(point2canvas(data.circle_data[1]));
		circle.position = new Point(point2canvas(data.circle_data[0]));

		//console.log(user.position);
		//console.log(circle.position);

		view.draw();
	});	
};
