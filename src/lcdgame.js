// LCD game JavaScript library
// Bas de Reuver (c)2015

// namespace
var LCDGame = LCDGame || {
	gamedata: [],
	imageBackground: null,
	imageShapes: null,
	loadsounds: null,
	countimages: 0,	
	// general game variables
	gametype: 0,
	level: 0,
	// events
	onImageLoaded: null,
	onImageError: null,
	canvas: null,
	context2d: null
};

// -------------------------------------
// game object
// -------------------------------------
LCDGame.Game = function (gameobj, jsonfilename) {

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
		console.log('onJSONsuccess start');
		// load all from JSON data
		this.gamedata = data;

		// set images locations will trigger event onImageLoaded
		this.imageBackground.src = data.imgback;
		this.imageShapes.src = data.imgshapes;
	
		// add custom lcdgame.js properties for use throughout the library
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			//console.log('TEST frame ' + name);
			//console.log('frame ' + name + ' -> x,y=' + this.gamedata.frames[i].frame.x + ',' + this.gamedata.frames[i].frame.y);

			// add current/previous values to all shape objects
			this.gamedata.frames[i].value = false;
			this.gamedata.frames[i].valprev = false;
			
			// add type
			this.gamedata.frames[i].type = "shape";
		};

		// prepare sequences
		for (var s = 0; s < this.gamedata.sequences.length; s++) {
			// shape indexes
			this.gamedata.sequences[s].ids = [];

			// find all frames indexes
			for (var f = 0; f < this.gamedata.sequences[s].frames.length; f++) {
				var filename = this.gamedata.sequences[s].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.sequences[s].ids.push(idx);
			};
		};

		// prepare digits
		for (var d = 0; d < this.gamedata.digits.length; d++) {
			// shape indexes
			this.gamedata.digits[d].ids = [];
			this.gamedata.digits[d].locids = [];

			// find all digit frames indexes
			for (var f = 0; f < this.gamedata.digits[d].frames.length; f++) {
				var filename = this.gamedata.digits[d].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.digits[d].ids.push(idx);
				// set shape types
				if (idx != -1) {
					this.gamedata.frames[idx].type = "digit";
				};
			};

			// find all digit locations
			for (var l = 0; l < this.gamedata.digits[d].locations.length; l++) {
				var filename = this.gamedata.digits[d].locations[l];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.digits[d].locids.push(idx);
			};
			// set max
			var str = this.gamedata.digits[d].max || "";
			if (str == "") {
				for (var c = 0; c < this.gamedata.digits[d].locids.length; c++) { str += "8"}; // for example "8888"
				this.gamedata.digits[d].max = str;
			}
		};
		
		// prepare buttons keycodes
		for (var b=0; b < this.gamedata.buttons.length; b++) {
		
			// shape indexes
			this.gamedata.buttons[b].ids = [];

			// find all digit frames indexes
			for (var f = 0; f < this.gamedata.buttons[b].frames.length; f++) {
				var filename = this.gamedata.buttons[b].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.buttons[b].ids.push(idx);
			};

			// default keycodes
			var defkey = this.gamedata.buttons[b].name;
			if (typeof this.gamedata.buttons[b].defaultkeys !== "undefined") {
				defkey = this.gamedata.buttons[b].defaultkeys;
			};
			this.gamedata.buttons[b].keycodes = this.determineKeyCodes(defkey);
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
		
		// 
		if (document.addEventListener) {
			// chrome, firefox
			document.addEventListener("keydown", this.onkeydown.bind(this), false);
			document.addEventListener("keyup",   this.onkeyup.bind(this), false);
		} else {
			// IE8
			document.attachEvent("keydown", this.onkeydown.bind(this));
			document.attachEvent("keyup",   this.onkeyup.bind(this));
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
	shapeIndexByName: function(name) {
		console.log('shapeIndexByName -- '+name);
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].filename == name)
				return i;
		}
		console.log("** ERROR ** shapeIndexByName('"+name+"') - filename not found.");
		// if not found return -1
		throw "lcdgames.js - "+arguments.callee.caller.toString()+", no frame with filename '" + name + "'";
		return -1;
	},

	setShapeByName: function(filename, value) {
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].filename == filename) {
				this.gamedata.frames[i].value = value;
				return true;
			};
		};
		return false;
	},
	
	setShapeByIdx: function(idx, value) {
		this.gamedata.frames[idx].value = value;
		return true;
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
			this.gamedata.frames[shape].value = false;
		};
	},

	sequenceShift: function(name, max) {
		// example start [0] [1] [.] [3] [.] (.=off)
		//        result [.] [1] [2] [.] [4]
		
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// max position is optional
		if (typeof max === "undefined") max = this.gamedata.sequences[seqidx].ids.length;

		// shift shape values one place DOWN
		var i;
		for (i = max-1; i > 0; i--) {
			// get shape indexes of adjacent shapes in this sequence
			var shape1 = this.gamedata.sequences[seqidx].ids[i-1];
			var shape2 = this.gamedata.sequences[seqidx].ids[i];
			// shift shape values DOWN one place in sequence
			this.gamedata.frames[shape2].value = this.gamedata.frames[shape1].value;
		};
		// set first value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.gamedata.frames[shape1].value = false;
	},

	sequenceShiftReverse: function(name, min) {
		// example start [.] [1] [.] [3] [4] (.=off)
		//        result [0] [.] [2] [3] [.]

		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);
		
		// min position is optional
		if (typeof min === "undefined") min = 0;

		// shift shape values one place UP
		var i;
		for (i = min; i < this.gamedata.sequences[seqidx].ids.length-1; i++) {
			// get shape indexes of adjacent shapes in this sequence
			var shape1 = this.gamedata.sequences[seqidx].ids[i];
			var shape2 = this.gamedata.sequences[seqidx].ids[i+1];
			// shift shape values UP one place in sequence
			this.gamedata.frames[shape1].value = this.gamedata.frames[shape2].value;
		};
		// set last value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[i];
		this.gamedata.frames[shape1].value = false;
	},

	sequenceSetFirst: function(name, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// set value for first shape in sequence
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.gamedata.frames[shape1].value = value;
	},

	sequenceSetPos: function(name, pos, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// if pos is -1, then last last position
		if (pos == -1) {pos = this.gamedata.sequences[seqidx].ids.length-1};

		// set value for first shape in sequence
		var shape1 = this.gamedata.sequences[seqidx].ids[pos];
		this.gamedata.frames[shape1].value = value;
	},
	
	sequenceShapeVisible: function(name, pos) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// single pos or any pos
		if (typeof pos === "undefined") {
			// no pos given, check if any shape visible
			for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
				// check if any shape is visible (value==true)
				var shape1 = this.gamedata.sequences[seqidx].ids[i];
				if (this.gamedata.frames[shape1].value == true) {
					return true;
				};
			};
		} else {
			// if pos is -1, then last last position
			if (pos == -1) {pos = this.gamedata.sequences[seqidx].ids.length-1};
			
			// check if shape is visible (value==true)
			var shape1 = this.gamedata.sequences[seqidx].ids[pos];
			if (this.gamedata.frames[shape1].value == true) {
				return true;
			};
		};
		return false;
	},

	shapesDisplayAll: function(value) {
		//console.log("shapesDisplayAll: " + this.gamedata.frames[index].frame.x);

		// all shapes
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			// print out current values of sequence
			if ( (this.gamedata.frames[i].type == "shape") || (this.gamedata.frames[i].type == "digitpos") ) {
				this.gamedata.frames[i].value = value;
			};
		};
		// all digits
		if (value == true) {
			for (var i = 0; i < this.gamedata.digits.length; i++) {
				this.digitsDisplay(this.gamedata.digits[i].name, this.gamedata.digits[i].max);
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
				firstid = this.gamedata.digits[digidx].locids.length - str.length;
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
			for (var i=0; i < this.gamedata.digits[digidx].locids.length; i++) {
				// shape of digitplaceholder
				var locidx = this.gamedata.digits[digidx].locids[i];
				
				// make non-used digit placeholders invisible
				if ( (i < firstid) || (chridx >= str.length) ) {
					// make non-used digit placeholders invisible
					this.gamedata.frames[locidx].value = false;
				} else {
					// 48 = ascii code for "0"
					var digit = str.charCodeAt(chridx) - 48;

					// check if valid digit				
					if ( (digit >= 0) && (digit < this.gamedata.digits[digidx].ids.length) ) {
						var digitshape = this.gamedata.digits[digidx].ids[digit]; // shape of digit
						
						// change the "from" part of the placeholder so it will draw the desired digit shape
						this.gamedata.frames[locidx].frame.x = this.gamedata.frames[digitshape].frame.x;
						this.gamedata.frames[locidx].frame.y = this.gamedata.frames[digitshape].frame.y;

						// make sure the placeholder (with new digit) gets re-drawn
						this.gamedata.frames[locidx].value = true;
					} else {
						// non-digit, example space (' ')
						this.gamedata.frames[locidx].value = false;
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
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].value == true) {
				this.shapeDraw(i);
			};
		};
	},

	shapeDraw: function(index) {
		//console.log("shapeDraw: " + this.gamedata.frames[index].x);

		// draw shape
		this.context2d.drawImage(
			this.imageShapes,
			this.gamedata.frames[index].frame.x, // from
			this.gamedata.frames[index].frame.y,
			this.gamedata.frames[index].frame.w,
			this.gamedata.frames[index].frame.h,
			this.gamedata.frames[index].spriteSourceSize.x, // to
			this.gamedata.frames[index].spriteSourceSize.y,
			this.gamedata.frames[index].spriteSourceSize.w,
			this.gamedata.frames[index].spriteSourceSize.h
		);

		// show shape index
		//this.context2d.font = "bold 12px sans-serif";
		//this.context2d.fillStyle = "#fff";
		//this.context2d.fillText(index, this.gamedata.frames[index].xpos, this.gamedata.frames[index].ypos);
	},

	// -------------------------------------
	// buttons input through keyboard
	// -------------------------------------
	buttonAdd: function(name, framenames, defaultkeys) {
		// if no buttons yet
		if (typeof this.buttons === 'undefined') {
			this.buttons = [];
		}
		var maxidx = this.gamedata.buttons.length;

		// add button keycodes
		this.gamedata.buttons[maxidx] = {};
		
		// set values for button
		this.gamedata.buttons[maxidx].name = name;
		this.gamedata.buttons[maxidx].frames = framenames;
		this.gamedata.buttons[maxidx].defaultkeys = defaultkeys;
		
		this.gamedata.buttons[maxidx].keycodes = this.determineKeyCodes(defaultkeys);
	},
		
	determineKeyCodes: function(keyname) {
		// variables
		var result = [];
		
		// possibly more than 1 keyvariables
		for (var i = 0; i < keyname.length; i++) {
			var c = 0;
			var k = keyname[i];
			
			// key code
			k = k.toUpperCase();
			if (k.indexOf("UP") > -1) {
				c = 38;
			} else if (k.indexOf("DOWN") > -1) {
				c = 40;
			} else if (k.indexOf("LEFT") > -1) {
				c = 37;
			} else if (k.indexOf("RIGHT") > -1) {
				c = 39;
			} else {
				c = k.charCodeAt(0);
			};
			// add
			result.push(c);
		};

		// return array of keycode(s)
		return result;
	},

	onkeydown: function(e) {
		// get keycode
		var keyCode = e.keyCode;
		//console.log('lcdgame.js onkeydown -- '+keyCode);

		// check if keycode in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			for (var j=0; j < this.gamedata.buttons[i].keycodes.length; j++) {
				if (this.gamedata.buttons[i].keycodes[j] == keyCode) {
					this.onButtonDown(i, j);
				};
			};
		};
	},
	
	onkeyup: function(e) {
		// get keycode
		var keyCode = e.keyCode;

		// check if keycode in defined buttons
		for (var i=0; i < this.gamedata.buttons.length; i++) {
			for (var j=0; j < this.gamedata.buttons[i].keycodes.length; j++) {
				if (this.gamedata.buttons[i].keycodes[j] == keyCode) {
					this.onButtonUp(i);
				};
			};
		};
	},
	
	onButtonDown: function(btnidx, diridx) {
		var name = this.gamedata.buttons[btnidx].name;
		//console.log('onButtonDown -- name=' + name + ' btnidx=' + btnidx);
		this.GameObj.handleInput(name, diridx);

		var idx = this.gamedata.buttons[btnidx].ids[diridx];
		this.setShapeByIdx(idx, true);
		this.shapesRefresh();
	
	},
	
	onButtonUp: function(btnidx, diridx) {
		//console.log('onButtonUp -- name=' + name + ' btnidx=' + btnidx);
		// TODO: visually update frame so key is in neutral position
		for (var s=0; s < this.gamedata.buttons[btnidx].ids.length; s++) {
			var idx = this.gamedata.buttons[btnidx].ids[s];
			this.setShapeByIdx(idx, false);
		};
		
		this.shapesRefresh();
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
// beats per minute to milliseconds, static helper function
// -------------------------------------
LCDGame.BPMToMillSec = function (bpm) {
	return (60000 / bpm);
}
// LCD game JavaScript library
// Bas de Reuver (c)2015

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
		this.Counter = 0;
		this.Max = max;
		
		// bind callback function to gameobj, so not to LCDGame.Timer object
		var timerEvent = this.doTimerEvent.bind(this);
		
		// start interval
		if (this.Enable)
		{
			// clear any previous
			if (this.timerId) {
				clearInterval(this.timerId);
			};

			// start interval
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
// LCD game JavaScript library
// Bas de Reuver (c)2015

// -------------------------------------
// button object
// -------------------------------------
LCDGame.Button = function (lcdgame, name) {
	// save reference to game object 
	this.lcdgame = lcdgame;
	this.name = name;
	this.keycodes = [];
	
	// do a guess
	// save reference to game object

	//TODO: add support for buttons types
//button type="button"		ok
//button type="updown"		ok
//button type="leftright"	TODO
//button type="dpad"		TODO
//button type="diagonal"	TODO
//button type="switch"		TODO

};

