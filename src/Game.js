// LCD game JavaScript library
// Bas de Reuver (c)2018

import { LCDGAME_VERSION } from './System';
import { displayInfobox, renderInfoBox } from './Menu';
import HighScores, { SCORE_HTML } from './Highscores';
import AnimationFrame from './AnimationFrame';
import Sounds from './Sounds';
import StateManager from './StateManager';
import Timer from './Timer';
import { randomInteger, request } from './utils';
import { addSVG, BUTTON_CLASSNAME, setShapeVisibility } from './svg';
import { getKeyMapping, normalizeButtons } from './buttons';

const CONTAINER_HTML =
	'<div id="container" class="container">' +
	'	<canvas id="mycanvas" class="gamecvs"></canvas>' +
	'	<div id="svg" class="svgContainer"></div>' +
	'	<div class="menu">' +
	'		<a class="mybutton" onclick="LCDGame.displayScorebox();">highscores</a>' +
	'		<a class="mybutton" onclick="LCDGame.displayInfobox();">help</a>' +
	'	</div>' +
	'</div>';

// -------------------------------------
// game object
// -------------------------------------
const Game = function (configfile, metadatafile = "metadata/gameinfo.json") {

	this.gamedata = {};
	this.imageBackground = null;
	this.imageShapes = null;
	this.score = 0;
	this.gametype = 0;
	this.level = 0;

	this.buttonpress = 0;
	this.playtimestart = null;

	// site lock, enable for no hotlinking
	/*
	var domain = document.domain;
	siteLock = false;
	var siteLock = (domain.indexOf("bdrgames.nl") == -1);
	if (siteLock) {
		document.write('To play LCD game simulations, please visit: <a href="http://www.bdrgames.nl/lcdgames/">http://www.bdrgames.nl/lcdgames/</a>');
		console.log('%c To play LCD game simulations, please visit: http://www.bdrgames.nl/lcdgames/', 'background: #000; color: #0f0'); // cool hax0r colors ;)
		return;
	};
*/

	// initialise object
	this.countimages = 0;
	this.scaleFactor = 1.0;

	this.imageBackground = new Image();
	this.imageShapes = new Image();

	// events after loading image
	this.imageBackground.addEventListener("load", this.onImageLoaded.bind(this));
	this.imageBackground.addEventListener("error", this.onImageError.bind(this));
	this.imageShapes.addEventListener("load", this.onImageLoaded.bind(this));
	this.imageShapes.addEventListener("error", this.onImageError.bind(this));

	// create canvas element and add to document
	var str =
		CONTAINER_HTML +
		SCORE_HTML;

	document.write(str);

	this.canvas = document.getElementById("mycanvas");
	this.scorecontent = document.getElementById("scorecontent");

	// get context of canvas element
	this.context2d = this.canvas.getContext("2d");

	// state manager
	this.state = new StateManager(this);

	// request animation frame
	this.raf = new AnimationFrame(this);

	this.timers = [];

	// add gamedata and populate by loading json
	this.loadConfig(configfile);
	this.loadMetadata(metadatafile);

	return this;
};

Game.prototype = {
	// -------------------------------------
	// background ans shapes images loaded
	// -------------------------------------
	onImageLoaded: function() {
		// max two images
		this.countimages++;
		// check if both background and shapes images were loaded
		if (this.countimages >= 2) {
			this.initGame();
		}
	},

	onImageError: function() {
		// handle error
		console.log("** ERROR ** lcdgame.js - onImageError.");
	},

	// -------------------------------------
	// load a game configuration file
	// -------------------------------------
	loadConfig: async function(path) {
		try {
			const data = await request(path);
			await this.onConfigLoad(data);
		} catch (error) {
			console.log("** ERROR ** lcdgame.js - onConfigError: error loading json file");
			console.error(error);
		}
	},

	// -------------------------------------
	// start game
	// -------------------------------------
	onConfigLoad: async function(data) {
		data.buttons = normalizeButtons(data.buttons);

		this.gamedata = data;

		await addSVG(data);

		// set images locations will trigger event onImageLoaded
		this.imageBackground.src = data.imgback;
		this.imageShapes.src = data.imgshapes;

		// add custom lcdgame.js properties for use throughout the library
		for (var i = 0; i < this.gamedata.frames.length; i++) {

			// add current/previous values to all shape objects
			this.gamedata.frames[i].value = false;
			this.gamedata.frames[i].valprev = false;

			// add type
			this.gamedata.frames[i].type = "shape";
		}

		// prepare sequences
		for (var s = 0; s < this.gamedata.sequences.length; s++) {
			// shape indexes
			this.gamedata.sequences[s].ids = [];

			// find all frames indexes
			for (var f = 0; f < this.gamedata.sequences[s].frames.length; f++) {
				var filename = this.gamedata.sequences[s].frames[f];
				var idx = this.shapeIndexByName(filename);
				this.gamedata.sequences[s].ids.push(idx);
			}
		}

		// prepare digits
		for (var d = 0; d < this.gamedata.digits.length; d++) {
			// shape indexes
			this.gamedata.digits[d].ids = [];
			this.gamedata.digits[d].locids = [];

			// find all digit frames indexes
			for (let f = 0; f < this.gamedata.digits[d].frames.length; f++) {
				const filename = this.gamedata.digits[d].frames[f];
				const idx = this.shapeIndexByName(filename);
				this.gamedata.digits[d].ids.push(idx);
				// set shape types
				if (idx != -1) {
					this.gamedata.frames[idx].type = "digit";
				}
			}

			// find all digit locations
			for (var l = 0; l < this.gamedata.digits[d].locations.length; l++) {
				const filename = this.gamedata.digits[d].locations[l];
				const idx = this.shapeIndexByName(filename);
				this.gamedata.digits[d].locids.push(idx);
			}
			// set max
			var str = this.gamedata.digits[d].max || "";
			if (str == "") {
				for (var c = 0; c < this.gamedata.digits[d].locids.length; c++) { str += "8";} // for example "8888"
				this.gamedata.digits[d].max = str;
			}
		}

		// prepare buttons keycodes
		this.keyMapping = getKeyMapping(data.buttons);
	},

	// -------------------------------------
	// load a metadata file
	// -------------------------------------
	loadMetadata: async function(path) {
		try {
			const data = await request(path);
			renderInfoBox(data);

			// get info from metadata
			var title = data.gameinfo.device.title;
			var gametypes = data.gameinfo.gametypes;

			this.gametype = (typeof gametypes === "undefined" ? 0 : 1);

			// highscores
			this.highscores = new HighScores(this, title, gametypes);
			this.highscores.init(this.gametype);
		} catch (error) {
			console.log("** ERROR ** lcdgame.js - onMetadataError: error loading json file");
			console.error(error);
		}
	},

	resizeCanvas: function() {
		// determine which is limiting factor for current window/frame size; width or height
		var scrratio = window.innerWidth / window.innerHeight;
		var imgratio = this.canvas.width / this.canvas.height;

		// determine screen/frame size
		var w = this.canvas.width;
		var h = this.canvas.height;

		if (imgratio > scrratio) {
			// width of image should take entire width of screen
			w = window.innerWidth;
			this.scaleFactor = w / this.canvas.width;
			h = this.canvas.height * this.scaleFactor;
		} else {
			// height of image should take entire height of screen
			h = window.innerHeight;
			this.scaleFactor = h / this.canvas.height;
			w = this.canvas.width * this.scaleFactor;
		}

		// set canvas size
		this.canvas.style.width = w+"px";
		this.canvas.style.height = h+"px";
	},
	// -------------------------------------
	// start the specific game
	// -------------------------------------
	initGame: function() {
		// no scrollbars
		document.body.scrollTop = 0;

		// initialise canvas
		this.canvas.width = this.imageBackground.width;
		this.canvas.height = this.imageBackground.height;

		this.context2d.drawImage(this.imageBackground, 0, 0);

		// prepare sounds
		this.sounds = new Sounds(this.gamedata.sounds);

		// bind input
		document.querySelectorAll(`.${BUTTON_CLASSNAME}`).forEach((element) => {
			element.addEventListener("mousedown", this.onmousedown.bind(this), false);
			element.addEventListener("mouseup", this.onmouseup.bind(this), false);

			if (this.isTouchDevice()) {
				element.addEventListener("touchstart", this.ontouchstart.bind(this), false);
				element.addEventListener("touchend", this.ontouchend.bind(this), false);
			}
		});

		// keyboard
		document.addEventListener("keydown", this.onkeydown.bind(this), false);
		document.addEventListener("keyup",   this.onkeyup.bind(this), false);

		// real time resize
		window.addEventListener("resize", this.resizeCanvas.bind(this), false);

		// center position
		this.resizeCanvas();

		displayInfobox();

		this.raf.start();

		console.log("lcdgame.js v" +  LCDGAME_VERSION + " :: start");
	},

	// -------------------------------------
	// timers and game loop
	// -------------------------------------
	addtimer: function(context, callback, ms, waitfirst) {

		// after .start() do instantly start callbacks (true), or wait the first time (false), so:
		// true  => .start() [callback] ..wait ms.. [callback] ..wait ms.. etc.
		// false => .start() ..wait ms.. [callback] ..wait ms.. [callback] etc.
		if (typeof waitfirst === "undefined") waitfirst = true;

		// add new timer object
		var tim = new Timer(context, callback, ms, waitfirst);

		this.timers.push(tim);

		return tim;
	},

	cleartimers: function() {
		// clear all timers
		for (var t=0; t < this.timers.length; t++) {
			this.timers[t].pause();
			this.timers[t] = null;
		}
		this.timers = [];
	},

	updateloop: function(timestamp) {

		// check all timers
		for (var t=0; t < this.timers.length; t++) {
			if (this.timers[t].enabled) {
				this.timers[t].update(timestamp);
			}
		}

		// any shapes updates
		if (this._refresh) {
			this.shapesRefresh();
			this._refresh = false;
		}
	},

	gameReset: function(gametype) {
		// new game reset variables
		this.score = 0;
		this.level = 0;
		this.gametype = gametype;
		this.buttonpress = 0;
		this.playtimestart = new Date();
	},

	// -------------------------------------
	// sound effects
	// -------------------------------------

	/**
	 * Toggle all sounds. Defaults to opposite of current value.
	 *
	 * @param {boolean} [value]
	 */
	setSoundMute: function (value) {
		this.sounds.mute(value);
	},

	/**
	 * Play Sound.
	 *
	 * @param {string} name
	 */
	playSoundEffect: function (name) {
		this.sounds.play(name);
	},

	// -------------------------------------
	// random integer
	// -------------------------------------
	randomInteger: randomInteger,

	// -------------------------------------
	// function for shapes and sequences
	// -------------------------------------
	/**
	 * Get index of Shape by it's name.
	 *
	 * @private
	 * @param {string} name
	 * @returns {number}
	 */
	shapeIndexByName: function(name) {
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].filename == name)
				return i;
		}
		console.log("** ERROR ** shapeIndexByName('"+name+"') - filename not found.");
		// if not found return -1
		throw "lcdgames.js - "+arguments.callee.caller.toString()+", no frame with filename '" + name + "'";
	},

	/**
	 * Toggle shape visibility by its name.
	 *
	 * @param {string} filename
	 * @param {boolean} value
	 */
	setShapeByName: function(filename, value) {
		let name = filename;
		let frame;
		if (typeof filename === 'number') {
			frame = this.gamedata.frames[filename];
			name = frame.filename;
		} else {
			frame = this.gamedata.frames.find(f => f.filename === filename);
		}
		if (frame) {
			frame.value = value;
		}
		setShapeVisibility(name, value);
	},

	/**
	 * Get index of sequence by name.
	 *
	 * @private
	 * @param {string} name
	 * @returns {number}
	 */
	sequenceIndexByName: function(name) {
		if (this.gamedata.sequences) {
			for (var i = 0; i < this.gamedata.sequences.length; i++) {
				if (this.gamedata.sequences[i].name == name)
					return i;
			}
			console.log("** ERROR ** sequenceIndexByName('"+name+"') - sequence name not found.");
			// if not found return -1
			throw "lcdgames.js - "+arguments.callee.caller.toString()+", no sequence with name '" + name + "'";
		}
		return -1;
	},

	/**
	 *
	 * @param {string} name
	 * @param {boolean} [value=false]
	 */
	sequenceClear: function(name, value = false) {
		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		this.gamedata.sequences[seqidx].frames.forEach(frameName => {
			this.setShapeByName(frameName, value);
		});

		// refresh display
		this._refresh = true;
	},

	/**
	 *
	 * @param {string} name
	 * @param {number} [max]
	 * @returns {boolean}
	 */
	sequenceShift: function(name, max) {
		// example start [0] [1] [.] [3] [.] (.=off)
		//        result [.] [1] [2] [.] [4]

		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// max position is optional
		if (typeof max === "undefined") max = this.gamedata.sequences[seqidx].ids.length;

		// shift shape values one place DOWN
		var i;
		var ret = false;
		for (i = max-1; i > 0; i--) {
			// get shape indexes of adjacent shapes in this sequence
			const shape1 = this.gamedata.sequences[seqidx].ids[i-1];
			const shape2 = this.gamedata.sequences[seqidx].ids[i];

			// return value
			if (i == (max-1)) {
				ret = this.gamedata.frames[shape2].value;
			}

			// shift shape values DOWN one place in sequence
			this.setShapeByName(this.gamedata.frames[shape2].filename, this.gamedata.frames[shape1].value);
		}
		// set first value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.setShapeByName(this.gamedata.frames[shape1].filename, false);

		// refresh display
		this._refresh = true;

		// return value, was the last value that was "shifted-out" true or false
		return ret;
	},

	sequenceShiftReverse: function(name, min = 0) {
		// example start [.] [1] [.] [3] [4] (.=off)
		//        result [0] [.] [2] [3] [.]

		// get sequence index of name
		var seqidx = this.sequenceIndexByName(name);

		// shift shape values one place UP
		var i;
		for (i = min; i < this.gamedata.sequences[seqidx].ids.length-1; i++) {
			// get shape indexes of adjacent shapes in this sequence
			const shape1 = this.gamedata.sequences[seqidx].ids[i];
			const shape2 = this.gamedata.sequences[seqidx].ids[i+1];
			// shift shape values UP one place in sequence
			this.setShapeByName(this.gamedata.frames[shape1].filename, this.gamedata.frames[shape2].value);
		}
		// set last value to blank; default value false
		var shape1 = this.gamedata.sequences[seqidx].ids[i];
		this.setShapeByName(this.gamedata.frames[shape1].filename, false);
		// refresh display
		this._refresh = true;
	},

	/**
	 *
	 * @param {string} name
	 * @param {boolean} value
	 */
	sequenceSetFirst: function(name, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// set value for first shape in sequence
		var shape1 = this.gamedata.sequences[seqidx].ids[0];
		this.setShapeByName(this.gamedata.frames[shape1].filename, value);
		// refresh display
		this._refresh = true;
	},

	/**
	 * Set position of Sequence.
	 *
	 * @param {string} name
	 * @param {number} pos
	 * @param {boolean} value
	 */
	sequenceSetPos: function(name, pos, value) {
		if (this.gamedata.sequences) {
			// get sequence
			var seqidx = this.sequenceIndexByName(name);

			// if pos is -1, then last last position
			if (pos == -1) {pos = this.gamedata.sequences[seqidx].ids.length-1;}

			// if pos out of bound of sequence array
			if (pos < this.gamedata.sequences[seqidx].ids.length) {
				// set value for position shape in sequence
				var shape1 = this.gamedata.sequences[seqidx].ids[pos];
				this.setShapeByName(shape1, value);

				// refresh display
				this._refresh = true;
			}
		}
	},

	/**
	 * Check if a Frame is visible.
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	shapeVisible: function(name) {
		// find shape
		for (var i = 0; i < this.gamedata.frames.length; i++) {
			if (this.gamedata.frames[i].filename == name) {
				if (this.gamedata.frames[i].value == true) {
					return true;
				}
			}
		}
		return false;
	},

	/**
	 * Check if a Sequence is visible.
	 *
	 * @param {string} name
	 * @param {number} pos
	 * @returns {boolean}
	 */
	sequenceShapeVisible: function(name, pos) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// single pos or any pos
		if (typeof pos === "undefined") {
			// no pos given, check if any shape visible
			for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
				// check if any shape is visible (value==true)
				const shape1 = this.gamedata.sequences[seqidx].ids[i];
				if (this.gamedata.frames[shape1].value == true) {
					return true;
				}
			}
		} else {
			// if pos is -1, then last last position
			if (pos == -1) {pos = this.gamedata.sequences[seqidx].ids.length-1;}

			// if pos out of bound of sequence array
			if (pos < this.gamedata.sequences[seqidx].ids.length) {
				// check if shape is visible (value==true)
				const shape1 = this.gamedata.sequences[seqidx].ids[pos];
				if (this.gamedata.frames[shape1].value == true) {
					return true;
				}
			}
		}
		return false;
	},

	/**
	 * Check if all Frames of a Sequence are visible.
	 *
	 * @param {string} name
	 * @param {boolean} value
	 * @returns {boolean}
	 */
	sequenceAllVisible: function(name, value) {
		// get sequence
		var seqidx = this.sequenceIndexByName(name);

		// check if all visible same as value
		for (var i = 0; i < this.gamedata.sequences[seqidx].ids.length; i++) {
			// check if all shapes same visible
			var shape1 = this.gamedata.sequences[seqidx].ids[i];
			if (this.gamedata.frames[shape1].value != value) {
				return false;
			}
		}
		return true;
	},

	/**
	 * Hide / show all shapes
	 *
	 * @param {boolean} value - shape visibility.
	 */
	shapesDisplayAll: function(value) {

		if (this.gamedata.frames) {
			// all shapes
			for (let i = 0; i < this.gamedata.frames.length; i++) {
				// print out current values of sequence
				if ( (this.gamedata.frames[i].type == "shape") || (this.gamedata.frames[i].type == "digitpos") ) {
					this.setShapeByName(i, value);
				}
			}
			// all digits
			if (value == true) {
				for (let i = 0; i < this.gamedata.digits.length; i++) {
					this.digitsDisplay(this.gamedata.digits[i].name, this.gamedata.digits[i].max);
				}
			}
			// refresh display
			this._refresh = true;
		}
	},

	// -------------------------------------
	// function for digits
	// -------------------------------------

	/**
	 *
	 * @param {string} name - frame.filename prefix. prefix + 'pos' is the actual position
	 * @param {string} str - value. e.g. score (200), time (12:34)
	 * @param {boolean} [rightalign=false]
	 */
	digitsDisplay: function(name, str, rightalign = false) {
		// not loaded yet
		if (!this.gamedata.digits) return;

		// get sequence
		var digidx = -1;
		for (let i = 0; i < this.gamedata.digits.length; i++) {
			if (this.gamedata.digits[i].name == name) {
				digidx = i;
				break;
			}
		}

		if (digidx == -1) {
			console.log("** ERROR ** digitsDisplay('"+name+"') - digits not found.");
			// if not found return -1
			throw "lcdgames.js - digitsDisplay, no digits with name '" + name + "'";
		} else {

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
				}
			}

			// example
			// placeholders [ ] [ ] [ ] [ ] [ ]
			// str " 456"   [ ] [4] [5] [6]
			// outcome should be
			// placeholders [.] [4] [5] [6] [.]  (.=empty/invisible)
			// firstid = index 1-^

			// adjust all shapes of digitplaceholders to display correct digits, and force them to refresh
			for (let i=0; i < this.gamedata.digits[digidx].locids.length; i++) {
				// shape of digitplaceholder
				var locidx = this.gamedata.digits[digidx].locids[i];

				// make non-used digit placeholders invisible
				if ( (i < firstid) || (chridx >= str.length) ) {
					// make non-used digit placeholders invisible
					this.setShapeByName(locidx, false);
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
						this.setShapeByName(locidx, true);
					} else {
						// non-digit, example space (' ')
						this.setShapeByName(locidx, false);
					}
					// next character in str
					chridx = chridx + 1;
				}
			}

			// refresh display
			this._refresh = true;
		}
	},

	// -------------------------------------
	// function for drawing and redrawing shapes
	// -------------------------------------
	shapesRefresh: function() {

		// TODO: implement dirty rectangles?
		// FOR NOW: simply redraw everything

		if (this.gamedata.frames) {
			// redraw entire background (=inefficient)
			this.context2d.drawImage(this.imageBackground, 0, 0);

			// add current/previous values to all shape objects
			for (var i = 0; i < this.gamedata.frames.length; i++) {
				if (this.gamedata.frames[i].value == true) {
					this.shapeDraw(i);
				}
			}
		}
		// display was refreshed
		this._refresh = false;

	},

	shapeDraw: function(index) {
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
	},

	// -------------------------------------
	// buttons input through keyboard
	// -------------------------------------

	/**
	 * Button `touchstart` event handler.
	 *
	 * @param {Event} evt
	 */
	ontouchstart: function(evt) {
		evt.preventDefault();

		//  evt.changedTouches is changed touches in this event, not all touches at this moment
		for (var i = 0; i < evt.changedTouches.length; i++)
		{
			this.onmousedown(evt.changedTouches[i]);
		}
	},

	/**
	 * Button `touchend` event handler.
	 *
	 * @param {Event} evt
	 */
	ontouchend: function(evt) {
		evt.preventDefault();

		//  evt.changedTouches is changed touches in this event, not all touches at this moment
		for (var i = 0; i < evt.changedTouches.length; i++)
		{
			this.onmouseup(evt.changedTouches[i]);
		}
	},

	/**
	 * Button `mousedown` event handler.
	 *
	 * @param {Event} evt
	 */
	onmousedown: function(evt) {
		const data = evt.currentTarget.dataset;

		this.onButtonDown(data.name);
	},

	/**
	 * Button `mouseup` event handler.
	 *
	 * @param {Event} evt
	 */
	onmouseup: function(evt) {
		const data = evt.currentTarget.dataset;

		this.onButtonUp(data.name);
	},

	/**
	 * Keyboard `keydown` event handler.
	 *
	 * @param {Event} evt
	 */
	onkeydown: function(evt) {
		const buttonName = this.keyMapping[evt.key];
		if (buttonName) {
			this.onButtonDown(buttonName);
		}
	},

	/**
	 * Keyboard `keyup` event handler.
	 *
	 * @param {Event} evt
	 */
	onkeyup: function(evt) {
		const buttonName = this.keyMapping[evt.key];

		if (buttonName) {
			this.onButtonUp(buttonName);
		}
	},

	/**
	 * Button Down (Mouse Down / Touch Start) event handler.
	 *
	 * @param {string} name - name of button in gamedata.buttons Array.
	 */
	onButtonDown: function(name) {
		// Update UI
		this.setShapeByName(name, true);

		// handle button press
		const currentState = this.state.currentState();
		if (currentState?.press) {
			currentState.press(name);
		}

		// keep track of button presses
		this.buttonpress++;
	},

	/**
	 * Button Up (Mouse Up / Touch End) event handler.
	 *
	 * @param {string} name - name of button in gamedata.buttons Array.
	 */
	onButtonUp: function(name) {
		// Update UI
		this.setShapeByName(name, false);

		// pass input to game
		const currentState = this.state.currentState();
		if (currentState?.release) {
			currentState.release(name);
		}
	},

	isTouchDevice: function() {
		return 'ontouchstart' in document.documentElement || (window.navigator.maxTouchPoints && window.navigator.maxTouchPoints >= 1);
	}
};

export default Game;
