/* Functionality for creating the slingshot */

// Helper function to return a random number between two numbers
var random = function (a, b) { 
	return a + (Math.random() * (b - a)); 
};

// Function to create a slingshot line segment 
var segment = function (x1, y1, x2, y2) {
	var seg = new Path();
	seg.strokeColor = 'coral';
	seg.strokeWidth = 30;
	seg.opacity = 0.8;
	// Add the starting location 
	seg.add(new Point(x1, y1));
	// Add segments between start and end
	var unit = (x2 - x1) / 5.0;
	for (var i = 1; i < 5; i++) {
		// Make them deviate a little in the y direction 
		seg.add(new Point(x1 + i * unit, y1 + Math.random() * 20));
	}
	// Add the end location 
	seg.add(new Point(x2, y2));
	seg.strokeCap = 'round';
	seg.opacity = 0.5;
};

// Function to create an urchin spike 
var spike = function (urchin) {

};

var bubble_colors = ['#E2FFE6', '#DDFEFE', '#DEF6FD', '#FAECFF'];

// Function to create a bubble 
var bubble = function (pos, size) {
	var b = new Path.Circle(pos, size);
	b.strokeColor = bubble_colors[Math.floor(Math.random() * bubble_colors.length)];
	b.strokeWidth = Math.ceil(1 + Math.random() * 4);
	b.opacity = 0.1 + Math.random();
	console.log(b.strokeWidth, b.opacity);
	return b;
};

// Function to create a coral flower 
var flower = function (x, y) {
	var start = new Point(x, y);
	var end = new Point(x + Math.random() * 10, y + Math.random() * 8);
	var stem = new Path(start, end);
	var bud_radius = 3;
	var bud = new Path.Circle(new Point(end.x + bud_radius, end.y + (bud_radius /2)), 3);
	var flower_group = new Group(stem, bud);
	flower_group.fillColor = "#FF847C";
	flower_group.strokeColor = "#FF847C";
	flower_group.strokeWidth = 4;
};

// Have a different setup based on chosen slingshot arm separation size
var setup = function (size, width, height, radius, arm_size) {
	var components = {};

	// Where the spring/slingshot base starts off at 
	components.start = {};

	// Used to position the arms 
	var mid = height / 2;
	var a = mid + ((size / 2.0) * mid);
	var b = mid - ((size / 2.0) * mid);

	// Ground 
	components.ground = {
		x1: 0, y1: 0, x2: 0, y2: height,
		create: function () { return segment(this.x1, this.y1, this.x2, this.y2); }
	};

	// Slingshot arms (made of coral)
	components.armTop = {
		x1: 0, y1: a, x2: arm_size, y2: a,
		create: function () { return segment(this.x1, this.y1, this.x2, this.y2); }
	};
	components.armBottom = {
		x1: 0, y1: b, x2: arm_size, y2: b,
		create: function () { segment(this.x1, this.y1, this.x2, this.y2); }
	};

	components.flowers = function () {
		// Add a slew of flower corals to the coral arms 
		// Do this first so that they show up above arms 
		for (var i = 0; i < 10; i++) {
			// Pick a random area within the top arm 
			var x = random(components.armTop.x1, components.armTop.x2);
			var y = random(components.armTop.y1, components.armTop.y2);
			flower(x, y);
		}
		for (var i = 0; i < 10; i++) {
			// Pick a random area within the bottom arm 
			var x = random(components.armBottom.x1, components.armBottom.x2);
			var y = random(components.armBottom.y1, components.armBottom.y2);
			flower(x, y);
		}
	};
	
	// Slingshot 
	components.slingshot = function () {
		var slingshot = new Path();
		// Add an extra 15 - this is half the size of the coral arm width 
		// allows seaweed to 'wrap around' arm 
	  	slingshot.add(new Point(arm_size, a + 15));

	  	// Where the urchin will be nestled to start with 
	  	components.start.x = arm_size - 20;
	  	components.start.y = a - ((a - b) / 2);
		slingshot.apex = slingshot.add(new Point(components.start.x, components.start.y));

		slingshot.add(new Point(arm_size, b - 15));
		
		slingshot.strokeColor = 'green';
		slingshot.strokeWidth = 10;
		slingshot.smooth();
		slingshot.strokeCap = 'butt';
		return slingshot;
	};

	// The urchin center is slightly offset from the center of the slingshot 
	components.urchin_radius = radius;
	components.urchin_center = null;
	components.urchin = function () {
		components.urchin_center = {x: components.start.x + 20, y: components.start.y - 8};
		var urchin = new Path.Circle(new Point(components.urchin_center), components.urchin_radius);
		// Add spikes to urchin 

		urchin.fillColor = 'black';
		urchin.opacity = 0.6;
		return urchin;
	};

	// Fish target 
	components.fish = function (size) {
		var body = new Path();
		// TODO 
	};

	// Eel - direction is 1 or -1 
	components.eel = function (specs) {
		var body = new Path(specs.p);
		var back = new Path(specs.p);
		// Add segments to the eel body, each of size 'size'
		var point;
		for (var i = 1; i < 4; i++) {
			point = new Point(specs.p.x, specs.p.y + specs.dir * specs.size * i)
			body.add(point);
			back.add(point);
		}
		// Add the eyes 
		var lefteye = new Path.Circle(new Point(specs.p.x - 5, specs.p.y), 6);
		var righteye = new Path.Circle(new Point(specs.p.x + 5, specs.p.y), 6);
		var eyes = new Group(lefteye, righteye);
		eyes.fillColor = 'black';
		// Add the tip of the tail 
		var p = body.segments[3].point;
		var end = new Point(p.x, p.y - (specs.size / 2));
		var tail = new Path(new Point(p.x - 10, p.y), end, new Point(p.x + 10, p.y));
		// Add a little head 
		p = body.segments[0].point;
		var start = new Point(p.x, p.y + 10);
		var head = new Path(new Point(p.x - 10, p.y), start, new Point(p.x + 10, p.y));
		// Stylings
		var group = new Group(body, back, eyes, tail);
		body.smooth(); back.smooth(); tail.smooth(); head.smooth();
		body.strokeColor = 'green'; tail.fillColor = 'green'; head.fillColor = 'green';
		back.strokeColor = 'black';
		body.strokeWidth = 20; 
		back.strokeWidth = 5;
		body.opacity = 0.5; back.opacity = 0.5; tail.opacity = 0.5; eyes.opacity = 0.5; head.opacity = 0.5;
		back.strokeCap = 'round';
		this.body = body;
		this.back = back;
		this.eyes = eyes;
		this.tail = tail;
		this.head = head;
		this.group = new Group(body, back, eyes, tail, head);
		return this;
	};
	components.animate_eel = function (eel, time, step, start_x, width) {
		// Start from top if we're at the bottom 
		if (eel.tail.position.y > 800) eel.group.position.y = -100;

		var segment1, segment2, sinus;
		var top_pos, bottom_pos;
		for (var i = 0; i < 4; i++) {
			segment1 = eel.body.segments[i];
			segment2 = eel.back.segments[i];
			sinus = Math.sin(time * 2 + i*1.3);			// A cylic value between -1 and 1
			segment1.point.x = sinus * width + start_x;	// Move the eel body segments side to side
			segment1.point.y += step;					// Advance the eel up or down 
			segment2.point.x = sinus * width + start_x;
			segment2.point.y += step;

			if (i == 0) top_pos = segment1.point.x;
			if (i == 3) bottom_pos = segment1.point.x;
		}
		eel.eyes.position.y += step;
		eel.eyes.position.x = top_pos;
		eel.tail.position.y += step;
		eel.tail.position.x = bottom_pos;
		eel.tail.segments[1].x = top_pos;
		eel.head.position.y += step;
		eel.head.position.x = top_pos;
	};

	components.init_bubbles = function (n, width, height) {
		var bubbles = [];
		var pos, rad, bub;
		for (var i = 0; i < n; i++) {
			pos = new Point(Math.random() * width, Math.random() * height);
			rad = Math.random() * 10;
			bub = bubble(pos, rad);
			bubbles.push(bub);
		}
		return bubbles;
	};
	components.animate_bubbles = function (bubbles, step, width) { 
		for (var i = 0; i < bubbles.length; i++) {
			// reset if needed 
			if (bubbles[i].position.x > width) bubbles[i].position.x = 0;
			// otherwise move bubble 
			else bubbles[i].position.x += step;
		}
	};

	return components;
};

/* Running the slingshot simulation */
$(document).ready(function () {
      // Create the socket 
      var socket = io();

      // Get the device size 
      var width = $(window).width();
      var height = $(window).height();

      // Set the canvas to the device size 
      $("#canvas").attr("width", width);
      $("#canvas").attr("height", height);

      // Colors and gradient width percentages for the sea gradient 
      var sea_colors = ["#092B5A", "#09738A", "#78A890", "#9ED1B7"];

      // Make the background a nice gradient of blue/green
      var background = new Path.Rectangle({
        topLeft: new Point(0, 0), 
        topRight: new Point(width, 0), 
        bottomLeft: new Point(0, height), 
        bottomRight: new Point(width, height),
        fillColor: {
          gradient: {stops: sea_colors},
          origin: new Point(0, height / 2),
          destination: new Point(width, height / 2)
        }
      });

      var urchin_radius = 20;   // The radius of our projectile 
      var arm_size = 250;           // The slingshot arm height 

      /* Call this with a certain size to run the whole slingshot simulation */
      function run (size) {
        // Set up the slingshot arena 
        var arena = setup(size, width, height, urchin_radius, arm_size);
        //arena.ground.create();
        arena.armTop.create();
        arena.armBottom.create();
        //arena.flowers();
       	//arena.base.create();

        // Create the slingshot and urchin-projectile
        var slingshot = arena.slingshot();
        var urchin = arena.urchin();

        // Create a first layer of bubbles 
        var bubble_layer1 = arena.init_bubbles(60, width, height);

        // Create the animated bodies, starting with some eels
        var e1 = { p: new Point(950, 150), size: 60, dir: -1, step: 5, width: 20 };
       	var eel1 = arena.eel(e1);

       	// Create a second layer of bubbles 
       	var bubble_layer2 = arena.init_bubbles(60, width, height);

        // Determines if the mouse is on the projectile
        var touchingUrchin = function (x, y) {
          var r = Math.pow(urchin.position.x - x, 2) + Math.pow(urchin.position.y - y, 2);
          return r <= Math.pow(urchin_radius, 2);
        };

        arena.width = width;
        arena.height = height;

        var time = 0.0;
        setInterval(function () {
	      	arena.animate_eel(eel1, time, e1.step, e1.p.x, e1.width);
	      	arena.animate_bubbles(bubble_layer2, 1, width);
	      	view.draw();
	      	time += 0.1;
	    }, 100);

        // Tell the backend we're ready 
      //   socket.emit('ready', JSON.stringify(arena));

      //   // Functionality to drag the slingshot 
      //   var pulling = false;
      //   var released = false;
      //   canvas.onmousedown = function (event) {
      //     //event.preventDefault();
      //     // Only send mouse down event if the mouse is touching the bird  
      //     if (touchingUrchin(event.x, event.y)) {
      //       socket.emit('mousedown', {x: event.x, y: event.y});
      //     }
      //   };
      //   canvas.onmousemove = function (event) {
      //     if (pulling) {
      //       slingshot.apex.point.y = event.y;
      //       slingshot.apex.point.x = event.x;
      //       urchin.position.y = event.y;
      //       urchin.position.x = event.x;

      //       socket.emit('mousemove', {x: event.x, y: event.y});
      //     }
      //   };
      //   canvas.onmouseup = function (event) {
      //     pulling = false;
      //     released = true;

      //     socket.emit('mouseup', {x: event.x, y: event.y});
      //   };

      //   // As long as we're pulling, send mouse position information over 
      //   // this prevents the ball from being released in the backend 
      //   simulation = setInterval(function () {
      //     if (pulling) socket.emit('mousemove', {x: urchin.position.x, y: urchin.position.y});
      //   }, 66);

      //   // Backend has determined we're dragging the bird 
      //   socket.on('pulling', function () {
      //     pulling = true;
      //   });

      //   socket.on('draw', function (pos) {
      //     if (released) {
      //       // Slingshot goes back to original position
      //       slingshot.apex.point.y = arena.start.y;
      //       slingshot.apex.point.x = arena.start.x;

      //       // Bird goes flying according to simulation 
      //       urchin.position.y = pos.y;
      //       urchin.position.x = pos.x;

      //       view.draw();
      //     }
      //   });
      }

      // Possible arena sizes 
      var small = 0.5;
      var medium = 1.0;
      var large = 1.5;

      // Initialize with smallest size 
      run(medium);


  });
