var v = cp.v;

var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

var socket = io();

var Balls = function () {
	var self = this;
	
	this.canvas2point = function(x, y) {
		return v(x, height - y);
	};

	this.point2canvas = function(point) {
			return new Point(point.x, (height - point.y));
	};
  
  this.canvas = document.getElementById('canvas');

  // To avoid using mouse?? 
  this.canvas.keepalive = true;

  // To automatically resize based on window size  
  this.canvas.resize = true;
  
  var width = this.width = this.canvas.width = window.innerWidth-30;
	var height = this.height = this.canvas.height = window.innerHeight-30;
  
  // init paper
  paper.install(window);  //install view
  paper.setup('canvas');  // setup directly from canvas id
  
  this.draw_circle = function (pCircle, cpCircle) {
      //console.log(cpCircle);
      pCircle.position = self.point2canvas(cpCircle.tc);
      
      if (!pCircle.angle) pCircle.angle = 0;
      var deg = pCircle.body.a * (180.0/Math.PI); //convert rad to degrees
      pCircle.rotate(pCircle.angle - deg);
      pCircle.angle = deg;
  };

	//add floor
  console.log('adding floor');
  var pts = [v(0, 0), v(width, 0)];

  var floor = new Path();
  floor.strokeColor = 'black';
  floor.add(this.point2canvas(pts[0]), this.point2canvas(pts[0]));
  
  //add walls
  pts = [v(0, 0), v(0, height), v(width, 0), v(width, height)];

  console.log('adding walls');
  var wall1 = new Path();
  wall1.strokeColor = 'black';
  wall1.add(this.point2canvas(pts[0]), this.point2canvas(pts[1]));
  var wall2 = new Path();
  wall2.strokeColor = 'black';
  wall2.add(this.point2canvas(pts[2]), this.point2canvas(pts[3]));

  var circles = [];

  //add balls
  console.log('adding balls');
	for (var i = 1; i <= 2; i++) {
		var radius = 20+i;
		mass = 3+(i*2)/i;
		pts = [v(200 + i, (2 * radius + 5) * i)];

    var paper_circle = new Path.Circle(this.point2canvas(pts[0]), radius);
    paper_circle.fillColor = {
      hue: Math.random() * 360,
      saturation: 1,
      brightness: 1
    };
    var paper_circle_radius = new Path();
    paper_circle_radius.add(this.point2canvas(pts[0]), this.point2canvas(v(200+i-radius, (2 * radius + 5) * i)));
    var circle = new Group([paper_circle, paper_circle_radius]);
    circle.strokeColor = 'black';

    circles.push(circle);

	}
  
  socket.on("draw", function (data) {
    
    // Reposition everything 
    for (var i = 0; i < circles.length; i++) {
      circles[i].position = self.point2canvas(data.circle_data[i]);
    }

    view.draw();

  });
  

};



