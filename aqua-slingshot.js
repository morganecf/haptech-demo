/* Functionality for creating the slingshot */

// Helper function to return a random number between two numbers
var random = function (a, b) { 
	return a + (Math.random() * (b - a)); 
};

// Helper function to return min of two numbers
var min = function (a, b) {
	if (a < b) return a;
	else return b;
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

// Solve for y given circle radius and x 
var circle_y = function (x, rad) { return Math.sqrt(Math.pow(rad, 2) - Math.pow(x, 2)); };

// Function to create an urchin spike 
var spike = function (position, radius, thickness) {
	var len = Math.random() * radius;
	var p1 = new Point(position.x, position.y);
	var p2 = new Point(position.x + radius + len, position.y + radius + len);
	var s = new Path(p1, p2);
	s.strokeColor = 'black';
	s.strokeWidth = 2;
	return s;
};

var bubble_colors = ['#E2FFE6', '#DDFEFE', '#DEF6FD', '#FAECFF'];

// Function to create a bubble 
var bubble = function (pos, size) {
	var b = new Path.Circle(pos, size);
	b.strokeColor = bubble_colors[Math.floor(Math.random() * bubble_colors.length)];
	b.strokeWidth = Math.ceil(1 + Math.random() * 4);
	b.opacity = 0.1 + Math.random();
	return b;
};

// Function to create a chest target
var chest = function (y1, y2, width) {
	var box = new Rectangle({
		topLeft: new Point(width - 60, y1),
		topRight: new Point(width + 10, y1),
		bottomLeft: new Point(width - 60, y2),
		bottomRight: new Point(width + 10, y2)
	});
	var corner_size = new Size(10, 10);
	var rounded_box = new Path.RoundRectangle(box, corner_size);

	rounded_box.fillColor = 'brown';
	rounded_box.strokeColor = 'yellow';
	rounded_box.strokeWidth = 3;

	var handle = new Path.Circle(new Point(width - 55, (y1 + y2) / 2), 15);
	handle.fillColor = 'brown';
	handle.strokeColor = 'yellow';
	handle.strokeWidth = 3;

	var group = new Group(handle, rounded_box);

	var interval = (y2 - y1) / 8;
	var line;
	for (var i = 1; i < 8; i++) {
		line = new Path(new Point(width - 60, y1 + (i * interval)), new Point(width, y1 + (i * interval)));
		line.strokeColor = 'yellow';
		line.strokeWidth = 3;
		line.opacity = 0.7;
	}

	group.opacity = 0.7;
	return group;
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

	// Firing pad 
    components.pad = function (height) {
      var p = new Path(new Point(0, 0), new Point(0, height));
      p.strokeColor = 'red';
      p.strokeWidth = 24;
      p.opacity = 0.7;
      return p;
    };

	// Urchin projectile 
	components.urchin_radius = radius;
	components.urchin_center = null;
	components.urchin = function () {
		// The urchin center is slightly offset from the center of the slingshot 
		components.urchin_center = center = {x: components.start.x + 20, y: components.start.y - 8};

		// Add spikes to urchin 
		var spikes = [];
		for (var i = 0; i < 200; i++) {
			var s = spike(center, components.urchin_radius);
			s.rotate(Math.random() * 500);
			spikes.push(s);
		}

		var body = new Group(spikes);
		body.fillColor = 'black';
		body.opacity = 0.6;
		body.position = center;

		// Add eyes to urchin 
		var eye1 = new Path.Circle(new Point(center.x - 5, center.y), 8);
		var eye2 = new Path.Circle(new Point(center.x + 5, center.y), 8);
		var inner1 = new Path.Circle(new Point(center.x - 5, center.y), 2);
		var inner2 = new Path.Circle(new Point(center.x + 5, center.y), 2);
		var outers = new Group(eye1, eye2);
		var inners = new Group(inner1, inner2);
		outers.fillColor = 'black';
		inners.fillColor = 'white';
		var eyes = new Group(outers, inners);

		var group = new Group(body, eyes, inners);;
		var urchin = {body: body, eyes: eyes, inners: inners, group: group}
		return urchin;
	};

	// Fish target 
	components.fish = function (size) { };

	// Eel target 
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

		var segment1, segment2, sinus, sway;
		var top_pos, bottom_pos;
		for (var i = 0; i < 4; i++) {
			segment1 = eel.body.segments[i];
			segment2 = eel.back.segments[i];
			// Pick a cylic value between -1 and 1
			sinus = Math.sin(time * 2 + i*1.3);	
			// Move the eel body segments side to side
			sway = sinus * width + start_x;		
			segment1.point.x = sway;			 
			segment2.point.x = sway;

			if (i == 0) top_pos = segment1.point.x;
			if (i == 3) bottom_pos = segment1.point.x;
		}

		// Advance the eel up and down 
		eel.group.position.y += step;

		// Make sure other eel components follow sinusoidal suit 
		eel.eyes.position.x = top_pos;
		eel.tail.position.x = bottom_pos;
		eel.tail.segments[1].x = top_pos;
		eel.head.position.x = top_pos;
	};

	// Chest targets
	components.chest_top = function (y1, y2, width) {
		this.top = y1;
		this.bottom = y2;
		this.chest = chest(y1, y2, width);
		return this;
	};

	components.chest_bottom = function (y1, y2, width) {
		this.top = y1;
		this.bottom = y2;
		this.chest = chest(y1, y2, width);
		return this;
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

	components.score_card = function (width, height) {
		var mid = height / 2;
		var card = new Rectangle({
			topLeft: new Point(width - 60, mid - 25),
			topRight: new Point(width + 10, mid - 25),
			bottomLeft: new Point(width - 60, mid + 25),
			bottomRight: new Point(width + 10, mid + 25)
		});
		var round_card = new Path.RoundRectangle(card, new Size(5, 5));
		round_card.fillColor = 'red';
		round_card.opacity = 0.6;

		var score = new PointText(new Point(width - 28, mid + 9));
		score.justification = 'center';
		score.fillColor = 'black';
		score.content = '0';
		score.fontSize = 25;
		score.fontWeight = 200;

		this.card = card;
		this.score = score;
		return this;
	};

	return components;
};


/* 
	Collision detection methods 
*/
function eel_hit (urchin, eel, arena) {
	var bb_x = eel.group.position.x - 10;
	var urchin_x = urchin.group.position.x + arena.urchin_radius;
	if (urchin_x >= bb_x) {
		var bb_y1 = eel.group.position.y + 100;
		var bb_y2 = eel.group.position.y - 100;
		var urchin_y1 = urchin.group.position.y + arena.urchin_radius;
		var urchin_y2 = urchin.group.position.y - arena.urchin_radius;
		return urchin_y1 <= bb_y1 && urchin_y2 >= bb_y2;
	}
	return false;
	
}
function target_hit (urchin, target, width, arena) {
	var bb_x = width - 50;
	var urchin_x = urchin.group.position.x + arena.urchin_radius;
	if (urchin_x >= bb_x) {
		var urchin_y1 = urchin.group.position.y + arena.urchin_radius;
		var urchin_y2 = urchin.group.position.y - arena.urchin_radius;
		return (urchin_y2 >= target.top && urchin_y1 <= target.bottom);
	}
	return false;
}

// Make eel glow red or green 
var glow = function (eel, color) {
	eel.body.strokeColor = color;
	eel.tail.fillColor = color;
	eel.head.fillColor = color;
};

/* Running the slingshot simulation */
$(document).ready(function () {
      // Create the socket 
      //var socket = io();

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

      var urchin_radius = 20;   	// The radius of our projectile 
      var arm_size = 350;           // The slingshot arm height 

      /* Call this with a certain size to run the whole slingshot simulation */
      function run (size) {
        // Set up the slingshot arena 
        var arena = setup(size, width, height, urchin_radius, arm_size);
        arena.armTop.create();
        arena.armBottom.create();

        // Create the slingshot, urchin-projectile, and firing pad
        var slingshot = arena.slingshot();
        var urchin = arena.urchin();
        var pad = arena.pad(height);

        // Create a first layer of bubbles 
        var bubble_layer1 = arena.init_bubbles(60, width, height);

        // Create the two chest targets 
        var chest1 = arena.chest_bottom(height - 200, height - 50, width);
        var chest2 = arena.chest_top(50, 200, width);

        console.log(chest2);

        // Create the animated bodies, starting with some eels
        var eel_specs = { p: new Point(950, 150), size: 60, dir: -1, step: 5, width: 20 };
       	var eel = arena.eel(eel_specs);

       	// Create a second layer of bubbles 
       	var bubble_layer2 = arena.init_bubbles(60, width, height);

       	// Create the score card 
       	var scorer = arena.score_card(width, height);


        // Determines if the mouse is on the projectile
        var touchingUrchin = function (x, y) {;
			var r = Math.pow(urchin.body.position.x - x, 2) + Math.pow(urchin.body.position.y - y, 2);
			return r <= Math.pow(urchin_radius, 2);
        };

        arena.width = width;
        arena.height = height;
        arena.eel = {
        	x: eel.group.position.x, 
        	y: eel.group.position.y,
        	length: eel_specs.size * 3,
        	width: 20
        }; 

        var time = 0.0;
        setInterval(function () {
	      	arena.animate_eel(eel, time, eel_specs.step, eel_specs.p.x, eel_specs.width);
	      	arena.animate_bubbles(bubble_layer2, 1, width);
	      	view.draw();
	      	time += 0.1;
	    }, 100);

        // Blink eyes every 4 seconds
	    setInterval(function () {
	    	urchin.inners.fillColor = 'black';
	    	setTimeout(function () {	
	    		urchin.inners.fillColor = 'white';
	    	}, 200);
	    }, 5000);

        // Tell the backend we're ready 
        // socket.emit('ready', JSON.stringify(arena));

        // Functionality to drag the slingshot 
        var pulling = false;
        var released = false;
        canvas.onmousedown = function (event) {
			// Only send mouse down event if the mouse is on the urchin  
			if (touchingUrchin(event.x, event.y)) {
				pulling = true;
				// socket.emit('mousedown', {x: event.x, y: event.y});
			}
        };
        canvas.onmousemove = function (event) {
			if (pulling) {
				slingshot.apex.point.y = event.y;
				slingshot.apex.point.x = event.x;
				urchin.group.position.y = event.y;
				urchin.group.position.x = event.x;

				// socket.emit('mousemove', {x: event.x, y: event.y});
			}
        };
        canvas.onmouseup = function (event) {
			pulling = false;
			released = true;

			// Reset the slingshot 
			slingshot.apex.point.x = arena.start.x;
			slingshot.apex.point.y = arena.start.y;

			var falling = false;
			var hit = false;
			var coin = new Path.Circle(new Point(-50, -50), 20);
			
			coin.fillColor = 'yellow';
			coin.strokeColor = 'GoldenRod';
			coin.strokeWidth = 4;
			coin.opacity = 0.8;

			var flying = setInterval(function () {
				// If the urchin has fallen to the ground or gone off screen, clear the interval and reset
				if (urchin.group.position.y >= height || urchin.group.position.x >= width + 100) {
					coin.position.x = -50;
					coin.position.y = -50;
					setTimeout(function () {
						urchin.group.position.x = arena.start.x;
						urchin.group.position.y = arena.start.y;
					}, 2000);
					clearInterval(flying);
				}

				// Send the urchin sailing 
				if (!falling) urchin.group.position.x += 50;
				// Make the urchin fall to the ground if it's hit something
				else urchin.group.position.y += 30;

				// If a chest target has been hit, make a coin emerge
				if (hit) {
					coin.position.x -= 5;
					coin.position.y -= 5;
					if (coin.opacity <= 0.05) coin.opacity = 0.05;
					coin.opacity -= 0.05;
				}

				// Check for collision only if we haven't already 
				if (!falling) {
					// Check to see if urchin hits an obstacle 
					if (eel_hit(urchin, eel, arena)) {
						falling = true;

						// Eel glows red
						glow(eel, 'red');
						setTimeout(function () { 
							glow(eel, 'green'); 
							setTimeout(function () {
								glow(eel, 'red');
								setTimeout(function () {
									glow(eel, 'green');
									setTimeout(function () {
										glow(eel, 'red');
										setTimeout(function () {
											glow(eel, 'green');
										}, 500);
									}, 500);
								}, 500);
							}, 500);
						}, 500);

						// Decrement score
						scorer.score.content = parseInt(scorer.score.content) - 1;

					}

					// Check to see if hits a target
					else if (target_hit(urchin, chest1, width, arena) || target_hit(urchin, chest2, width, arena)) {
						falling = true;
						hit = true;
						// Produce a coin
						coin.position.x = urchin.group.position.x;
						coin.position.y = urchin.group.position.y;
						// Increment score
						scorer.score.content = parseInt(scorer.score.content) + 1;
					}
				}

				
			}, 66);
        };

        // As long as we're pulling, send mouse position information over 
        // this prevents the ball from being released in the backend 
        // simulation = setInterval(function () {
        //   	if (pulling) socket.emit('mousemove', {x: urchin.group.position.x, y: urchin.group.position.y});
        // }, 66);

        // Backend has determined we're dragging the urchin
        // socket.on('pulling', function () { pulling = true; });

   //      var time = 0.0;
   //      socket.on('draw', function (pos) {

   //      	console.log(pos.x, pulling);

			// if (released) {
			// 	// Slingshot goes back to original position
			// 	slingshot.apex.point.y = arena.start.y;
			// 	slingshot.apex.point.x = arena.start.x;

			// 	// Urchin goes flying according to simulation 
			// 	urchin.group.position.y = pos.y;
			// 	urchin.group.position.x = pos.x;

			// 	//console.log()
			// }

			// //if (pulling) socket.emit('mousemove', {x: urchin.group.position.x, y: urchin.group.position.y});

			// // Animate the eel 
			// arena.animate_eel(eel, time, eel_specs.step, eel_specs.p.x, eel_specs.width);
			// // Animate the bubbles
			// arena.animate_bubbles(bubble_layer2, 1, width);

			// time += 0.1;
			// view.draw();
   //      });

      }

      // Possible arena sizes 
      var small = 0.5;
      var medium = 1.0;
      var large = 1.5;

      // Initialize with smallest size 
      run(medium);


  });


/* 
	== TO DO LIST == 
	- background bubbles screenshot
	- usage instructions 
	- tentatively test adding animated bubbles

	== if time ==
	- score 
	- best score 
	- timer
	- time out / reset 
*/

