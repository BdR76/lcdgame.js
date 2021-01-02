// LCD game JavaScript library
// Bas de Reuver (c)2018

import { LCDGAME_VERSION } from './System';
import { displayInfobox, renderInfoBox } from './Menu';
import HighScores, { SCORE_HTML } from './Highscores';
import AnimationFrame from './AnimationFrame';
import Sounds from './Sounds';
import StateManager from './StateManager';
import Timer from './Timer';
import { isTouchDevice, randomInteger, request } from './utils';
import { addSVG, BUTTON_CLASSNAME, setDigitVisibility, setShapeVisibility, setShapesVisibility } from './svg';
import { getKeyMapping, normalizeButtons } from './buttons';

const CONTAINER_HTML =
	'<div id="container" class="container">' +
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

	// create elements and add to document
	var str =
		CONTAINER_HTML +
		SCORE_HTML;

	document.write(str);

	this.scorecontent = document.getElementById("scorecontent");

	// state manager
	this.state = new StateManager(this);

	// request animation frame
	this.raf = new AnimationFrame(this);

	this.digitMap = new Map();
	// @NOTE: change this object to add / remove custom key bindings
	this.keyMap = {};
	this.timers = [];

	this.initGame(configfile, metadatafile);

	return this;
};

Game.prototype = {
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
			const digitGroup = data.digits[d];
			this.digitMap.set(digitGroup.name, digitGroup);
		}

		// prepare buttons keycodes
		this.keyMap = getKeyMapping(data.buttons);
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

	// -------------------------------------
	// start the specific game
	// -------------------------------------
	initGame: async function(configfile, metadatafile) {
		await this.loadConfig(configfile);
		await this.loadMetadata(metadatafile);

		// prepare sounds
		this.sounds = new Sounds(this.gamedata.sounds);

		// bind input
		document.querySelectorAll(`.${BUTTON_CLASSNAME}`).forEach((element) => {
			element.addEventListener("mousedown", this.onmousedown.bind(this), false);
			element.addEventListener("mouseup", this.onmouseup.bind(this), false);

			if (isTouchDevice()) {
				element.addEventListener("touchstart", this.ontouchstart.bind(this), false);
				element.addEventListener("touchend", this.ontouchend.bind(this), false);
			}
		});

		// keyboard
		document.addEventListener("keydown", this.onkeydown.bind(this), false);
		document.addEventListener("keyup",   this.onkeyup.bind(this), false);

		displayInfobox();

		this.raf.start();

		console.log("lcdgame.js v" +  LCDGAME_VERSION + " :: start");
	},

	// -------------------------------------
	// timers and game loop
	// -------------------------------------
	addtimer: function(context, callback, ms, waitfirst = true) {

		// after .start() do instantly start callbacks (true), or wait the first time (false), so:
		// true  => .start() [callback] ..wait ms.. [callback] ..wait ms.. etc.
		// false => .start() ..wait ms.. [callback] ..wait ms.. [callback] etc.

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
	},

	gameReset: function(gametype = this.gametype) {
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
	// function for shapes
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
	 * @param {[string | number ]} filename - index or name of Shape.
	 * @param {boolean} value
	 */
	setShapeByName: function(filename, value) {
		let name = filename;
		let frame;
		// Some code still uses indexes. Kept for compatibility.
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

	// -------------------------------------
	// function for sequences
	// -------------------------------------
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
	shapesDisplayAll: setShapesVisibility,

	// -------------------------------------
	// function for digits
	// -------------------------------------

	/**
	 *
	 * @param {string} name - DigitGroup name.
	 * @param {string} str - value. e.g. score (200), time (12:34)
	 * @param {boolean} [rightalign=false]
	 */
	digitsDisplay: function(name, str, rightalign = false) {
		// not loaded yet
		if (this.digitMap.size === 0) {
			return;
		}

		const digitGroup = this.digitMap.get(name);
		if (!digitGroup) {
			console.log("** ERROR ** digitsDisplay('"+name+"') - digits not found.");
			throw "lcdgames.js - digitsDisplay, no digits with name '" + name + "'";
		}

		const digitGroupLength = digitGroup.locations.length;

		// some games (e.g. tomsadventure) prepend more characters than the group has. fix this here.
		if (str.length > digitGroupLength) {
			str = str.substring(str.length - digitGroupLength);
		}

		if (rightalign) {
			str = str.padStart(digitGroupLength, ' ');
		}

		str.split('').forEach((character, index) => {
			const isVisible = character !== ' ';
			setDigitVisibility(name, index, character, isVisible);
		});
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
		const buttonName = this.keyMap[evt.key];
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
		const buttonName = this.keyMap[evt.key];

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

	// -------------------------------------
	// Public helper functions
	// -------------------------------------
	randomInteger: randomInteger
};

export default Game;
