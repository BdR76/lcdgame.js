// LCD game JavaScript library
// Bas de Reuver (c)2015

// namespace
var LCDGame = LCDGame || {
	gamedata: [],
	test123: "This is a test value 123",
	imageBackground: null,
	imageShapes: null,
	countimages: 0,
	onImageLoaded: null,
	onImageError: null,
	canvas: null,
	context2d: null
};

// -------------------------------------
// game object
// -------------------------------------
LCDGame.Game = function (jsonfilename, gameobj) {

	// initialise object
	this.countimages = 0;

	this.imageBackground = new Image();
	this.imageShapes = new Image();

	// events after loading image
	if (this.imageBackground.addEventListener) {
		// chrome, firefox
		this.imageBackground.addEventListener("load", this.onImageLoaded.bind(this));
		this.imageBackground.addEventListener("error", this.onImageError.bind(this));
		this.imageShapes.addEventListener("load", this.onImageLoaded.bind(this));
		this.imageShapes.addEventListener("error", this.onImageError.bind(this));
	}
	else {
		// IE8
		this.imageBackground.attachEvent("load", this.onImageLoaded.bind(this));
		this.imageBackground.attachEvent("error", this.onImageError.bind(this));
		this.imageShapes.attachEvent("load", this.onImageLoaded.bind(this));
		this.imageShapes.attachEvent("error", this.onImageError.bind(this));
	};

	// add gamedata and populate by loading json
	this.loadJSON(jsonfilename);
	
	// create canvas element and add to document
	this.canvas = document.createElement("canvas");
	document.body.appendChild(this.canvas);

	// get context of canvas element
	this.context2d = this.canvas.getContext("2d");
		
	// initialise specific game
	this.GameObj = new gameobj(this);

	return this;
}

LCDGame.Game.prototype = {

	// -------------------------------------
	// load a JSON file
	// -------------------------------------
	loadJSON: function(path) {
		
		var xhrCallback = function()
		{
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if ((xhr.status === 200) || (xhr.status === 0)) {
					this.onJSONsuccess(JSON.parse(xhr.responseText));
				} else {
					this.onJSONerror(xhr);
				}
			}
		};
	
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = xhrCallback.bind(this);

		xhr.open("GET", path, true);
		xhr.send();
	},
	
	// -------------------------------------
	// background ans shapes images loaded
	// -------------------------------------
	onImageLoaded: function() {
		// TODO: do something
		this.countimages++;
		// check if both background and shapes images were loaded
		if (this.countimages >= 2) {
			console.log("lcdgame.js - onImageLoaded.. ready to rock!");
			this.initGame();
		};
	},

	onImageError: function() {
		// TODO: do something?
		console.log("** ERROR ** lcdgame.js - onImageError.");
	},

	// -------------------------------------
	// start game
	// -------------------------------------
	onJSONsuccess: function(data) {
		// load all from JSON data
		this.gamedata = data;

		// set images locations will trigger event onImageLoaded
		this.imageBackground.src = data.imgback;
		this.imageShapes.src = data.imgshapes;
		
		// add current/previous values to all shape objects
		for (var i = 0; i < this.gamedata.shapes.length; i++) {
			this.gamedata.shapes[i].value = false;
			this.gamedata.shapes[i].valprev = false;
		};
	},

	onJSONerror: function(xhr) {
		console.log("** ERROR ** lcdgame.js - onJSONerror: error loading json file");
		console.error(xhr);
	},

	// -------------------------------------
	// start the specific game
	// -------------------------------------
	initGame: function() {
		// initialise canvas
		this.canvas.width = this.imageBackground.width;
		this.canvas.height = this.imageBackground.height;

		this.context2d.drawImage(this.imageBackground, 0, 0);
		
		// prepare sounds
		for (var i=0; i < this.gamedata.sounds.length; i++) {
			var strfile = this.gamedata.sounds[i].filename;
			this.gamedata.sounds[i].audio = new Audio(strfile);
			this.gamedata.sounds[i].audio.load();
		};

		// add buttons keycodes
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			var defkey = this.gamedata.buttons[i].name;
			if (typeof this.gamedata.buttons[i].defaultkey !== "undefined") {
				defkey = this.gamedata.buttons[i].defaultkey;
			};
			this.gamedata.buttons[i].keycode = this.determineKeyCode(defkey);
		};
		
		// 
		if (document.addEventListener) {
			// chrome, firefox
			document.addEventListener("keydown", this.onkeydown.bind(this), false);
		} else {
			// IE8
			document.attachEvent("keydown", this.onkeydown.bind(this));
		};

		// initialise game specifics
		this.GameObj.initialise();
	},

	// -------------------------------------
	// sound effects
	// -------------------------------------
	loadSoundEffects: function() {
		// TODO: do something?
		console.log("loadSoundEffects - TODO load sound effects");
	},

	soundIndexByName: function (name) {
		var idx = 0;
		for (var i = 0; i < this.gamedata.sounds.length; i++) {
			if (this.gamedata.sounds[i].name == name) {
				return i;
			};
		};
		return -1;
	},

	playSoundEffect: function (name) {
		// get sound index from name
		var idx = this.soundIndexByName(name);
		
		// if sound exists
		if (idx >= 0) {
			// if sound is playing then stop it now
			if (this.gamedata.sounds[idx].audio.paused == false) {
				this.gamedata.sounds[idx].audio.pause();
				this.gamedata.sounds[idx].audio.currentTime = 0;
			};
			// start playing sound
			this.gamedata.sounds[idx].audio.play();
		};
	},

	// -------------------------------------
	// function for shapes and sequences
	// -------------------------------------
	setShapeValue: function(name, value) {
		for (var i = 0; i < this.gamedata.shapes.length; i++) {
			if (this.gamedata.shapes[i].name == name) {
				this.gamedata.shapes[i].value = value;
				return true;
			};
		};
		return false;
	},
	
	sequenceIndexByName: function(name) {
		for (var i = 0; i < this.gamedata.sequences.length; i++) {
			if (this.gamedata.sequences[i].name == name)
				return i;
		}
		console.log("** ERROR ** sequenceIndexByName('"+name+"') - sequence name not found.");
		// if not found return -1
		throw "lcdgames.js - "+arguments.callee.caller.toString()+", no sequence with name '" + name + "'";
		return -1;
	},

	sequenceClear: function(name) {
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// shift shape values one place DOWN
		for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
			// get shape index in this sequence
			var shape = this.gamedata.sequences[seqidx].ids[i];
			// clear all shapes in sequence
			this.gamedata.shapes[shape].value = false;
		};
	},

	sequenceShift: function(name) {
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// shift shape values one place DOWN
		var i;
		for (i = this.gamedata.sequences[seqidx].ids.length-1; i > 0; i--) {
			// get shape indexes of adjacent shapes in this sequence
			var shape1 = this.gamedata.sequences[seqidx].ids[i-1];
			var shape2 = this.gamedata.sequences[seqidx].ids[i];
			// shift shape values DOWN one place in sequence
			this.gamedata.shapes[shape2].value = this.gamedata.shapes[shape1].value;
		};
		// set first value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.gamedata.shapes[shape1].value = false;
	},

	sequenceShiftReverse: function(name) {
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// shift shape values one place UP
		var i;
		for (i = 0; i < this.gamedata.sequences[seqidx].ids.length-1; i++) {
			// get shape indexes of adjacent shapes in this sequence
			var shape1 = this.gamedata.sequences[seqidx].ids[i];
			var shape2 = this.gamedata.sequences[seqidx].ids[i+1];
			// shift shape values UP one place in sequence
			this.gamedata.shapes[shape1].value = this.gamedata.shapes[shape2].value;
		};
		// set last value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[i];
		this.gamedata.shapes[shape1].value = false;
	},

	sequencePush: function(name, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// set value for first shape in sequence
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.gamedata.shapes[shape1].value = value;
	},

	sequencePosSetValue: function(name, pos, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// set value for first shape in sequence
		var shape1 = this.gamedata.sequences[seqidx].ids[pos];
		this.gamedata.shapes[shape1].value = value;
	},
	
	sequenceShapeVisible: function(name, pos) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// single pos or any pos
		if (typeof pos === "undefined") {
			// no pos given, check any any
			for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
				// check if any shape is visible (value==true)
				var shape1 = this.gamedata.sequences[seqidx].ids[i];
				if (this.gamedata.shapes[shape1].value == true) {
					return true;
				};
			};
		} else {
			// check if shape is visible (value==true)
			var shape1 = this.gamedata.sequences[seqidx].ids[pos];
			if (this.gamedata.shapes[shape1].value == true) {
				return true;
			};
		};
		return false;
	},

	shapesDisplayAll: function(value) {
		//console.log("shapesDisplayAll: " + this.gamedata.shapes[index].x);

		// all shapes
		for (var i = 0; i < this.gamedata.shapes.length; i++) {
			// print out current values of sequence
			if ( (this.gamedata.shapes[i].type == "shape") || (this.gamedata.shapes[i].type == "digitpos") ) {
				this.gamedata.shapes[i].value = value;
			};
		};
		// all digits
		if (value == true) {
			for (var i = 0; i < this.gamedata.digits.length; i++) {
				var str = '';
				if (typeof this.gamedata.digits[i].max === "undefined") {
					for (var c = 0; c < this.gamedata.digits[i].placeids.length; c++) { str += "8"}; // for example "8888"
				} else {
					str = this.gamedata.digits[i].max;
				};
				this.digitsDisplay(this.gamedata.digits[i].name, str);
			};
		};
	},

	// -------------------------------------
	// function for digits
	// -------------------------------------
	digitsDisplay: function(name, str, rightalign) {
		// get sequence
		var digidx = -1;
		for (var i = 0; i < this.gamedata.digits.length; i++) {
			if (this.gamedata.digits[i].name == name) {
				digidx = i;
				break;
			};
		};
		
		if (digidx != -1) {
			// align right parameter is optional, set default value
			//if (rightalign === "undefined") {rightalign = false};

			// set value for first shape in sequence
			var chridx = 0; // index of character in str
			var firstid = 0; // index of id in shape ids
			
			// exception for right-align
			if (rightalign == true) {
				firstid = this.gamedata.digits[digidx].placeids.length - str.length;
				// if too many digits
				if (firstid < 0) {
					chridx = Math.abs(firstid); // skip left-most digit(s) of str
					firstid = 0;
				};
			};

			// example
			// placeholders [ ] [ ] [ ] [ ] [ ]
			// str " 456"   [ ] [4] [5] [6]
			// outcome should be
			// placeholders [.] [4] [5] [6] [.]  (.=empty/invisible)
			// firstid = index 1-^
			
			// adjust all shapes of digitplaceholders to display correct digits, and force them to refresh
			for (var i=0; i < this.gamedata.digits[digidx].placeids.length; i++) {
				// shape of digitplaceholder
				var placehold = this.gamedata.digits[digidx].placeids[i];
				
				// make non-used digit placeholders invisible
				if ( (i < firstid) || (chridx >= str.length) ) {
					// make non-used digit placeholders invisible
					this.gamedata.shapes[placehold].value = false;
				} else {
					// 48 = ascii code for "0"
					var digit = str.charCodeAt(chridx) - 48;

					// check if valid digit				
					if ( (digit >= 0) && (digit < this.gamedata.digits[digidx].ids.length) ) {
						var digitshape = this.gamedata.digits[digidx].ids[digit]; // shape of digit
						
						// change the "from" part of the placeholder so it will draw the desired digit shape
						this.gamedata.shapes[placehold].x = this.gamedata.shapes[digitshape].x;
						this.gamedata.shapes[placehold].y = this.gamedata.shapes[digitshape].y;

						// make sure the placeholder (with new digit) gets re-drawn
						this.gamedata.shapes[placehold].value = true;
					} else {
						// non-digit, example space (' ')
						this.gamedata.shapes[placehold].value = false;
					};
					// next character in str
					chridx = chridx + 1;
				};
			};
		};
	},
	
	// -------------------------------------
	// function for drawing and redrawing shapes 
	// -------------------------------------
	shapesRefresh: function() {
		// TODO: implement dirty rectangles
		
		
		// FOR NOW: simply redraw everything
		
		// redraw entire background (=inefficient)
		this.context2d.drawImage(this.imageBackground, 0, 0);
		
		//console.log("shapesRefresh called");
		// add current/previous values to all shape objects
		for (var i = 0; i < this.gamedata.shapes.length; i++) {
			if (this.gamedata.shapes[i].value == true) {
				this.shapeDraw(i);
			};
		};
	},

	shapeDraw: function(index) {
		//console.log("shapeDraw: " + this.gamedata.shapes[index].x);

		// draw shape
		this.context2d.drawImage(
			this.imageShapes,
			this.gamedata.shapes[index].x, // from
			this.gamedata.shapes[index].y,
			this.gamedata.shapes[index].w,
			this.gamedata.shapes[index].h,
			this.gamedata.shapes[index].xpos, // to
			this.gamedata.shapes[index].ypos,
			this.gamedata.shapes[index].w,
			this.gamedata.shapes[index].h
		);

		// show shape index
		//this.context2d.font = "bold 12px sans-serif";
		//this.context2d.fillStyle = "#fff";
		//this.context2d.fillText(index, this.gamedata.shapes[index].xpos, this.gamedata.shapes[index].ypos);
	},

	// -------------------------------------
	// buttons input through keyboard
	// -------------------------------------
	determineKeyCode: function(keyname) {
		keyname = keyname.toUpperCase();
		if (keyname.indexOf("UP") > -1) {
			return 38;
		} else if (keyname.indexOf("DOWN") > -1) {
			return 40;
		} else if (keyname.indexOf("LEFT") > -1) {
			return 37;
		} else if (keyname.indexOf("RIGHT") > -1) {
			return 39;
		} else {
			return keyname.charCodeAt(0);
		}
	},

	onkeydown: function(e) {
		// get keycode
		var keyCode = e.keyCode;

		// check if keycode in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			if (this.gamedata.buttons[i].keycode == keyCode) {
				var name = this.gamedata.buttons[i].name;
				this.GameObj.handleInput(name);
			};
		};
	},

	// -------------------------------------
	// check if touch device
	// -------------------------------------
	is_touch_device: function() {
		var el = document.createElement("div");
		el.setAttribute("lcdgame.js - ongesturestart", "return;");
		if(typeof el.ongesturestart === "function"){
			return true;
		}else {
			return false
		}
	}
};

// -------------------------------------
// pulse timer object
// -------------------------------------
LCDGame.Timer = function (game, eventfunction, interval) {
	// save reference to game object 
	this.game = game;

	// frequency of the timer in milliseconds
	this.Interval = interval || 1000;
	
	// counter, useful for directing animations etc.
	this.Counter = 0;

	// maximum counter, useful for directing animations etc.
	this.Max = null;

	// Property: Whether the timer is enable or not
	this.Enable = new Boolean(false);

	// Event: Timer tick
	this.doGameEvent = eventfunction;

	// Member variable: Hold interval id of the timer
	var timerId = 0;

	// local timer event of Timer-object
	this.doTimerEvent = function()
	{
		// keep track how many times event has fired
		this.Counter++;
		// do callback function to gameobj, so not to LCDGame.Timer object
		this.doGameEvent.call(this.game);
		// if maximum of callbacks was set
		//console.log("LCDGame.Timer.doTimerEvent this.Max="+this.Max);
		
		// TESTING!!
		//var d = new Date();
		//var n = d.toLocaleTimeString() + '.' + ("000"+d.getMilliseconds()).substr(-3);
		//console.log("onTimerWait - time="+n+ " Timer.Counter="+this.Counter+" Timer.Max="+this.Max);
		if (typeof this.Max !== "undefined") {
			if (this.Counter >= this.Max) this.Stop();
		};
	},

	// start/enable the timer
	this.Start = function(max)
	{
		// initialise variables
		this.Enable = new Boolean(true);
		this.Max = max;
		
		// bind callback function to gameobj, so not to LCDGame.Timer object
		var timerEvent = this.doTimerEvent.bind(this);
		
		// start interval
		if (this.Enable)
		{
			this.timerId = setInterval(
				timerEvent,
				this.Interval
			);
		}
	},

	// stop/disable the timer
	this.Stop = function()
	{
		this.Enable = new Boolean(false);
		clearInterval(this.timerId);
	}
};

// -------------------------------------
// pulse timer object
// -------------------------------------
LCDGame.Button = function (lcdgame, name) {
	// save reference to game object 
	this.lcdgame = lcdgame;
	this.name = name;
	this.keycodes = [];
	
	// do a guess
	// save reference to game object

	//TODO: add support for buttons types normal dpad etc.
//button type="normal" ids[1] defkeys["left"]
//button type="dpad" ids[1, 2, 3, 4] defkeys["up", "down", "left", "right"]
//button type="diagonal" ids[1, 2, 3, 4] defkeys["upleft", "upright", "downleft", "downright"]
//button type="horizontal" ids[1, 2] defkeys["left", "right"]
//button type="vertical" ids[1, 2] defkeys["up", "down"]
//button type="switch" ids[1, 2] defkeys["on", "mute"]

};

// -------------------------------------
// beats per minute to milliseconds, static helper function
// -------------------------------------
LCDGame.BPMToMillSec = function (bpm) {
	return (60000 / bpm);
}
