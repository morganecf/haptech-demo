var v = cp.v;

var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

var socket = io();

// NOTE: hue places color on color wheel - 0 is red, 120 is green, 240 is blue, 360 red again 

var CircleDemo = function () {
	// Install view
	paper.install(window);  
  	paper.setup('canvas');

	// Create the circle
	var circle = new Path.Circle(new Point(500, 200), 60);
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
};
