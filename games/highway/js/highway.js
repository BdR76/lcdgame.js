// Highway LCD game simulation
// Bas de Reuver (c)2018

var highway = {};

// constants
var STATE_DEMO = 1;
var STATE_MODESELECT = 2;
var STATE_GAMESTART = 10;
var STATE_GAMEPLAY = 11;
var STATE_GAMEPICK = 12;
var STATE_GAMEDROP = 13;

var STATE_GAMECRASH = 20;
var STATE_GAMEOVER = 21;


// =============================================================================
// clock state
// =============================================================================
highway.ClockMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.demotimer = null;
	this.democount;
};
highway.ClockMode.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);
		this.democount = 0;

		this.demotimer = this.lcdgame.addtimer(this, this.onTimerDemo, 500, false);

		// start demo mode
		this.demotimer.start();
	},

	update: function() {
	},

	press: function(btn) {
		if (btn == "mode") {
			this.lcdgame.state.start("select");
		}
	},

	close: function() {
	},

	onTimerDemo: function() {
		// update clock
		if (this.demotimer.counter % 2 == 0) {
			// demo timer event fired every half second
			this.lcdgame.setShapeByName("timecolon", false);
		} else {
			// only update road every whole second
			this.lcdgame.setShapeByName("timecolon", true);
			this.updateClock();
			this.updateDemoRoad();
		}
	},

	updateClock: function() {
		// get time as 12h clock with PM
		var datenow = new Date();
		//var str = datenow.toLocaleTimeString();
		//var strtime = "" + str.substring(0, 2) + str.substring(3, 5); // example "2359"
		var ihours = datenow.getHours();
		var imin = datenow.getMinutes();

		// adjust hour and set PM if needed
		if (ihours >= 12) {
			if (ihours > 12) ihours = ihours - 12;
			this.lcdgame.setShapeByName("time_pm", true);
		} else {
			if (ihours == 0) ihours = 12; // weird AM/PM time rule
			this.lcdgame.setShapeByName("time_pm", false);
		}
		// format hour and minute
		var strtime = ("  "+ihours).substr(-2) + ("00"+imin).substr(-2);

		// display time
		this.lcdgame.digitsDisplay("digit", strtime, false);
	},

	updateDemoRoad: function() {
		// TODO: add demo mode updateDemoRoad
		this.democount++;

		// shift all sequences
		this.lcdgame.sequenceShift("road_left");
		this.lcdgame.sequenceShift("road_right");

		this.lcdgame.sequenceShift("girl");
		this.lcdgame.sequenceShift("dog");
		this.lcdgame.sequenceShift("sign");
		this.lcdgame.sequenceShift("tree");
		this.lcdgame.sequenceShift("signdrop");

		// add new active shapes to the sequence
		if (this.democount % 5 != 0) {
			this.lcdgame.sequenceSetFirst("road_left", true);
			this.lcdgame.sequenceSetFirst("road_right", true);
		}

		// change of new road objects appearing
		this.objfreqs = [10, 33, 33, 33, 10]; // 10%, 25% etc.
		for (var i=0; i < this.objfreqs.length; i++) {
			var o = this.lcdgame.randomInteger(1, 100);
			if (o <= this.objfreqs[i]) {this.objfreqs[i]=1;} else {this.objfreqs[i]=0;} // 1=appears, 0=doesn't appear
		}
		// exception, objects in 3 middle lanes (dog, sign, tree) may never ALL appear at once because then player can't go anywhere
		if ( (this.objfreqs[1] == 1) && (this.objfreqs[2] == 1) && (this.objfreqs[3] == 1)) {
			var idx = this.lcdgame.randomInteger(1, 3);
			this.objfreqs[idx] = 0; // erase one of the three
		}
		// girl appears not more than once at a time
		if ( (this.objfreqs[0] == 1) && (this.lcdgame.sequenceShapeVisible("girl") == true) ) {
			this.objfreqs[0] = 0;
		}
		// dropoffsign appears not more than once at a time
		if ( (this.objfreqs[4] == 1) && (this.lcdgame.sequenceShapeVisible("signdrop") == true) ) {
			this.objfreqs[4] = 0;
		}

		// make objects appear
		if (this.objfreqs[0] == 1) this.lcdgame.sequenceSetFirst("girl", true);
		if (this.objfreqs[1] == 1) this.lcdgame.sequenceSetFirst("dog", true);
		if (this.objfreqs[2] == 1) this.lcdgame.sequenceSetFirst("sign", true);
		if (this.objfreqs[3] == 1) this.lcdgame.sequenceSetFirst("tree", true);
		if (this.objfreqs[4] == 1) this.lcdgame.sequenceSetFirst("signdrop", true);
	}
};

// =============================================================================
// Game select mode
// =============================================================================
highway.SelectMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.selectdiff = 1;
};
highway.SelectMode.prototype = {
	init: function(){
		this.selectdiff = 1;

		// clear screen
		this.lcdgame.shapesDisplayAll(false);

		// show score=0
		this.lcdgame.digitsDisplay("digit", "0", true);

		// enter player
		this.lcdgame.sequenceClear("car");
		this.lcdgame.sequenceSetPos("car", 4, true);

		// set road sides
		for (var i=0; i <= 4; i++) {
			this.lcdgame.sequenceSetPos("road_left",  i, (i > 0));
			this.lcdgame.sequenceSetPos("road_right", i, (i > 0));
		}

		// game1
		this.lcdgame.setShapeByName("game1", true);
	},
	press: function(btn) {
		// select difficulty 1 or 2 or back to demo mode
		if (btn == "mode") {
			if (this.selectdiff == 1) {
				// select difficulty 2
				this.selectdiff = 2;
				this.lcdgame.setShapeByName("game1", false);
				this.lcdgame.setShapeByName("game2", true);
			} else {
				// back to demo mode
				// NOTE: actually, after game1 and game2 the "mode" button switches to alarm clock,
				// then press "set" button and it displays "setting" shape
				// and you can set alarm time by left=hours+1, right=minutes+1
				this.lcdgame.state.start("clock");
			}
		}
		// start game
		if ( (btn == "left") || (btn == "right") ) {
			// show highscore
			var sc = this.lcdgame.highscores.getHighscore(this.selectdiff);
			this.lcdgame.digitsDisplay("digit", ""+sc, true);
		}
	},

	release: function(btn) {
		// start game
		if ( (btn == "left") || (btn == "right") ) {
			// reset game specific variables
			this.lcdgame.gameReset(this.selectdiff);
			this.lcdgame.state.start("maingame");
		}
	},
};

// =============================================================================
// main game state
// =============================================================================
highway.MainGame = function(lcdgame) {
	// save reference to lcdgame object
	this.lcdgame = lcdgame;

	// game specific variables
	this.gamestate = 0;
	this.hitchhikers = 0; // nr of hitchhikers dropped off in current level
	this.carpos = 0; // car position on road, 0=left most, 4=right most
	this.displayscore = 0;
	this.misses = 0;
	this.girlincar = false; // girl hitchhiker is in car
	this.pushcountdown = 0; // push back on road

	this.roadcount = 0; // acts as a metronome

	// settings
	this.sound_onoff = false;

	// timers/pulse generators
	this.roadtimer = null;
	this.waittimer = null;
	this.crashtimer = null; // for crash animation

	this.objfreqs = [10, 25, 25, 25, 10];
};

highway.MainGame.prototype = {
	init: function(){

		// initialise all timers
		this.roadtimer  = this.lcdgame.addtimer(this, this.onTimerRoad, 500);
		this.waittimer  = this.lcdgame.addtimer(this, this.onTimerWait, 1000); // pause moments during game (after pickup, before bonus etc.)
		this.crashtimer  = this.lcdgame.addtimer(this, this.onTimerCrash, 250); // crash on/off animation

		// new game, or returning from bonus game
		if (this.lcdgame.level == 0) {
			this.initNewGame();
		} else {
			this.initNextLevel();
		}

		this.toggleSound();
	},

	press: function(btn) {
		// determine state of gameplay
		switch (this.gamestate) {
			case STATE_GAMEPLAY:
				// handle player input appropriately
				if (btn == "left") {
					this.playerMove(-1);
				}
				if (btn == "right") {
					this.playerMove(+1);
				}
				break;
			case STATE_GAMEOVER:
				if (btn == "mode") {
					if (this.lcdgame.gametype == 1) {
						// select difficulty 2
						this.lcdgame.gametype = 2;
						this.lcdgame.setShapeByName("game1", false);
						this.lcdgame.setShapeByName("game2", true);
					} else {
						// back to demo mode
						this.lcdgame.state.start("clock");
					}
				}
				// start game
				if ( (btn == "left") || (btn == "right") ) {
					this.lcdgame.gameReset(this.lcdgame.gametype);
					this.initNewGame();
				}
		}
	},

	onTimerRoad: function() {
		// move all road objects
		this.updateRoad();

		// display score
		this.lcdgame.digitsDisplay("digit", ""+this.displayscore, true);
	},

	onTimerWait: function() {
		var d = new Date();
		var n = d.toLocaleTimeString() + '.' + ("000"+d.getMilliseconds()).substr(-3);
		// determine where to continue
		switch (this.gamestate) {
			case STATE_GAMEPICK:
				// remove hitchhiker and put in car
				this.lcdgame.sequenceShift("girl");
				for (var i = 0; i < 5; i++) {this.lcdgame.sequenceShift("car");}
				this.girlincar = true;
				this.pushcountdown = 20;
				// continue game
				this.gamestate = STATE_GAMEPLAY;
				this.roadtimer.start();
				break;
			case STATE_GAMEDROP:
				// remove hitchhiker and drop off sign
				this.lcdgame.setShapeByName("girl_dropoff", false);
				this.lcdgame.sequenceShift("signdrop");
				// bonus game or continue game
				if (this.hitchhikers >= 3) {
					// start bonus game
					this.lcdgame.state.start("bonusgame");
				} else {
					this.gamestate = STATE_GAMEPLAY;
					this.roadtimer.start();
				}
				break;
			case STATE_GAMECRASH:
				// alarm sound before and after bonus game
				if (this.waittimer.counter != this.waittimer.max) {
					this.lcdgame.playSoundEffect("crash");
				} else {
					// continue or game over
					if (this.misses < 3) {
						// reset player
						this.initCarPos();
						// continue game
						this.gamestate = STATE_GAMEPLAY;
						this.roadtimer.start();
					} else {
						// check for highscore
						this.lcdgame.highscores.checkScore();
						this.gamestate = STATE_GAMEOVER;
					}
				}
				break;
		}
	},

	onTimerCrash: function() {
		// flash crash animation on/off
		var b = (this.crashtimer.counter % 2 == 0);
		var p = (this.carpos % 5) - 1;
		this.lcdgame.sequenceSetPos("crash", p, b);
	},

	// -------------------------------------
	// non-game functions, settings etc.
	// -------------------------------------
	toggleSound: function() {
		// determine state of gameplay
		this.sound_onoff = !(this.sound_onoff);
		//this.lcdgame.setShapeByName("alarm_onoff", this.sound_onoff);
	},

	// -------------------------------------
	// game functions
	// -------------------------------------
	initCarPos: function() {
		// reset player to right-hand side
		this.girlincar = false;
		this.pushcountdown = 20;
		this.carpos = 4; // car position on road, 0=left most, 4=right most
		// clear any previous shapes
		this.lcdgame.sequenceClear("car");
		// set current shape
		this.lcdgame.sequenceSetPos("car", this.carpos, true);
	},

	initNextLevel: function() {
		// set and rest game specific variables
		this.hitchhikers = 0;
		this.lcdgame.level++; // next level
		this.gamestate = STATE_GAMEPLAY;

		// set road speed according to level
		var msecs = 750; // game1
		if (this.lcdgame.gametype == 1) {msecs = 750 - (this.lcdgame.level-1) * 62.5;} // game1
		if (this.lcdgame.gametype == 2) {msecs = 500 - (this.lcdgame.level-1) * 62.5;} // game2
		// limit max.speed. NOTE: not verified so not sure that this limit was also on actual device
		if (msecs < 62.5) {msecs = 62.5;}

		// reset player
		this.initCarPos();

		// start road moving
		this.roadtimer.interval = msecs;
		this.roadtimer.start();
	},

	initNewGame: function() {
		// reset game specific variables
		this.displayscore = this.lcdgame.score;
		this.misses = 0;
		this.girlincar = false; // girl hitchhiker is in car
		this.pushcountdown = 20;
		this.roadcount = 0;

		// clear screen
		this.lcdgame.shapesDisplayAll(false);

		// display game1 or game2
		if (this.lcdgame.gametype == 1) {this.lcdgame.setShapeByName("game1", true);}
		if (this.lcdgame.gametype == 2) {this.lcdgame.setShapeByName("game2", true);}

		// reset score
		this.lcdgame.digitsDisplay("digit", "0", true);

		// every game begins with one sign at front, one dog in middle and one tree in back, always.
		this.lcdgame.sequenceSetPos("dog",  1, true);
		this.lcdgame.sequenceSetPos("sign", 3, true);
		this.lcdgame.sequenceSetPos("tree", 0, true);

		// set road sides
		for (var i=0; i<=4; i++) {
			this.lcdgame.sequenceSetPos("road_left",  i, (i>0));
			this.lcdgame.sequenceSetPos("road_right", i, (i>0));
		}

		// start game
		this.initNextLevel();
	},

	initWait: function(msecs, max) {
		this.waittimer.pause();
		this.waittimer.counter = 0;
		// short pause when picking up/dropping off hitchhiker, before/after gas bonus game etc.
		if (typeof max === "undefined") max = 1;

		// bonus alarm or crash, then start immediately (instead of first time after <msecs> milliseconds)
		//if (max != 1) this.onTimerWait();
		var waitfirst = (max == 1);

		// start timer
		this.waittimer.interval = msecs;
		this.waittimer.start(max, waitfirst);
	},

	initCrash: function() {
		this.misses++;
		this.gamestate = STATE_GAMECRASH;
		// update misses display
		this.lcdgame.sequenceShift("carlives");
		this.lcdgame.sequenceSetFirst("carlives", true);
		if (this.misses >= 3) {
			this.lcdgame.setShapeByName("gameover", true);
		}
		// start timer
		this.roadtimer.pause();
		this.crashtimer.start(10-1); // 5 x on/off = 10 times (-1 because start at 0)
		this.onTimerCrash(); // start crash animation immediately
		this.initWait(1000, 4); // 4 x alarm sounds
	},

	updateRoad: function() {
		this.roadcount++;

		// score count
		var girl = this.lcdgame.sequenceShapeVisible("girl",  3);
		var dog  = this.lcdgame.sequenceShapeVisible("dog",  3);
		var sign = this.lcdgame.sequenceShapeVisible("sign", 3);
		var tree = this.lcdgame.sequenceShapeVisible("tree", 3);
		var drop = this.lcdgame.sequenceShapeVisible("signdrop",  3);

		// check collision
		if ( (this.carpos == 1) && dog )  this.initCrash();
		if ( (this.carpos == 2) && sign ) this.initCrash();
		if ( (this.carpos == 3) && tree ) this.initCrash();
		// stop road update when crashed
		if (this.gamestate != STATE_GAMEPLAY) {
			return false;
		}

		// check if no collision and car is in middle lane
		if ( (this.carpos > 0) && (this.carpos < 4) ) {
			this.pushcountdown = 0;
			// can only score points for passing objects when car is in middle lane
			if (dog)  {this.addScore(10);}
			if (sign) {this.addScore(10);}
			if (tree) {this.addScore(10);}
		} else {
			if (this.pushcountdown > 0) {
				this.pushcountdown--;
				if (this.pushcountdown <= 0) {
					// push back on road
					var step = (this.carpos == 0 ? +1 : -1);
					this.playerMove(step);
				}
			}

		}

		// shift all sequences
		this.lcdgame.sequenceShift("road_left");
		this.lcdgame.sequenceShift("road_right");

		this.lcdgame.sequenceShift("dog");
		this.lcdgame.sequenceShift("sign");
		this.lcdgame.sequenceShift("tree");

		// pick up hitchhiker
		if ( (this.carpos == 0) && girl && (this.girlincar == false) ) {
			this.addScore(20);
			// short pause
			this.roadtimer.pause();
			this.gamestate = STATE_GAMEPICK;
			this.initWait(1500);
			this.lcdgame.playSoundEffect("pickup");
		} else {
			this.lcdgame.sequenceShift("girl");
		}
		// drop off hitchhiker
		if ( (this.carpos == 4) && drop && (this.girlincar == true) ) {
			this.addScore(50);
			this.hitchhikers++;
			// girl get out
			for (var i = 0; i < 5; i++) {this.lcdgame.sequenceShiftReverse("car");}
			this.girlincar = false;
			this.pushcountdown = 20;
			this.lcdgame.setShapeByName("girl_dropoff", true);
			// short pause
			this.roadtimer.pause();
			this.gamestate = STATE_GAMEDROP;
			this.initWait(1750);
			this.lcdgame.playSoundEffect("dropoff");
		} else {
			this.lcdgame.sequenceShift("signdrop");
		}

		// tick sound effect (not when picking up or dropping off)
		if (this.gamestate == STATE_GAMEPLAY) {
			this.lcdgame.playSoundEffect("tick");
		}

		// add new active shapes to the sequence
		if (this.roadcount % 5 != 0) {
			this.lcdgame.sequenceSetFirst("road_left", true);
			this.lcdgame.sequenceSetFirst("road_right", true);
		}

		// change of new road objects appearing
		this.objfreqs = [10, 33, 33, 33, 10]; // 10%, 25% etc.
		for (var i=0; i < this.objfreqs.length; i++) {
			var o = this.lcdgame.randomInteger(1, 100);
			if (o <= this.objfreqs[i]) {this.objfreqs[i]=1;} else {this.objfreqs[i]=0;} // 1=appears, 0=doesn't appear
		}

		// exception, objects in 3 middle lanes (dog, sign, tree) may never ALL appear at once because then player can't go anywhere
		if ( (this.objfreqs[1] == 1) && (this.objfreqs[2] == 1) && (this.objfreqs[3] == 1)) {
			var idx = this.lcdgame.randomInteger(1, 3);
			this.objfreqs[idx] = 0; // erase one of the three
		}
		// girl appears not more than once at a time
		if ( (this.objfreqs[0] == 1) && (this.lcdgame.sequenceShapeVisible("girl") == true) ) {
			this.objfreqs[0] = 0;
		}
		// dropoffsign appears not more than once at a time
		if ( (this.objfreqs[4] == 1) && (this.lcdgame.sequenceShapeVisible("signdrop") == true) ) {
			this.objfreqs[4] = 0;
		}

		// make objects appear
		if (this.objfreqs[0] == 1) this.lcdgame.sequenceSetFirst("girl", true);
		if (this.objfreqs[1] == 1) this.lcdgame.sequenceSetFirst("dog", true);
		if (this.objfreqs[2] == 1) this.lcdgame.sequenceSetFirst("sign", true);
		if (this.objfreqs[3] == 1) this.lcdgame.sequenceSetFirst("tree", true);
		if (this.objfreqs[4] == 1) this.lcdgame.sequenceSetFirst("signdrop", true);
	},

	playerMove: function(step) {
		var validmove = false;
		// check if valid move
		if ( (this.carpos + step >=0) && (this.carpos + step < 5) ) {
			validmove = true;

			// cannot move to left-most when no girl in hitchhiker lane visible, or girl alreay in car
			if (this.carpos + step == 0) {
				if ( (this.lcdgame.sequenceShapeVisible("girl") == false) || (this.girlincar == true) ) validmove = false;
			}
			// cannot move to right-most when no drop off sign is visible, or girl not in car
			if (this.carpos + step == 4) {
				if ( (this.lcdgame.sequenceShapeVisible("signdrop") == false) || (this.girlincar == false) ) validmove = false;
			}

			if (validmove == true) {
				// play sound
				this.lcdgame.playSoundEffect("move");
				// move car
				this.carpos = this.carpos + step;
				if (step == -1) {
					this.lcdgame.sequenceShiftReverse("car");
				} else if (step == +1) {
					this.lcdgame.sequenceShift("car");
				}
			}
		}

		//
		return validmove;
	},

	addScore: function(points) {
		// check if valid move
		this.lcdgame.score += points;
		// score display can overflow, example when score=20790, display as "790"
		this.displayscore = (this.lcdgame.score % 20000);
	}
};

// =============================================================================
// bonus game
// =============================================================================
var STATE_BONUSSTART = 0;
var STATE_BONUSPLAY = 1;
var STATE_BONUSEND = 2;

highway.BonusGame = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.bonustimer = null;
	this.bonusstate = 0;

	// frequencies of the 3 bonus digits, as sampled from a 30fps video, example {"symbol": "1", "fps30": 8} means show digit "1" for (8/30)th of a second
	// Note: 3 of the fps30 values were changed, because the digit cycles were exactly synched up, i.e. always same cycle
	// changing them slightly so they are now out of synch with each other, just like in the real game
	this.bonusfreqs = [
		[ // left most digit placeholder
			{"symbol": "1", "fps30": 12},
			{"symbol": "3", "fps30": 7},
			{"symbol": "1", "fps30": 3},
			{"symbol": "7", "fps30": 8},
			{"symbol": "=", "fps30": 4},
			{"symbol": "3", "fps30": 7},
			{"symbol": "=", "fps30": 4},
			{"symbol": "1", "fps30": 8},
			{"symbol": "7", "fps30": 7}
		],
		[ // middle digit placeholder
			{"symbol": "1", "fps30": 12},
			{"symbol": "3", "fps30": 10},
			{"symbol": "1", "fps30": 12},
			{"symbol": "3", "fps30": 10},
			{"symbol": "7", "fps30": 8},
			{"symbol": "=", "fps30": 7}//actually fps30=8
		],
		[ // right most digit placeholder
			{"symbol": "1", "fps30": 12},
			{"symbol": "7", "fps30": 7},
			{"symbol": "=", "fps30": 3},//actually fps30=4
			{"symbol": "3", "fps30": 6}//actually fps30=7
		]
	];
	// variables for bonus game
	this.bonusvars = [];
	this.bonushold = 0; // how many digits pressed on hold

	// initialise bonus digits (symbol "1" is shape digit 0, "3" is 1, "7" is 2, "=" is 3)
	for (var d=0; d < 3; d++) { //all 3 digit placeholders
		for (var e=0; e < this.bonusfreqs[d].length; e++) { //all 3 digit placeholders
			var c = this.bonusfreqs[d][e].symbol;
			if (c == "1") this.bonusfreqs[d][e].digit = "0";
			if (c == "3") this.bonusfreqs[d][e].digit = "1";
			if (c == "7") this.bonusfreqs[d][e].digit = "2";
			if (c == "=") this.bonusfreqs[d][e].digit = "3";
		}
		// hold bonus game vars
		this.bonusvars[d] = {"digit": "0", "countdown": 0, "index": 0}; // current digit displayed, countdown to new digit, index in bonusfreqs
	}
};
highway.BonusGame.prototype = {
	init: function(){
		// bonus game timers
		this.waittimer  = this.lcdgame.addtimer(this, this.onTimerWait, 1000); // pause moments during game (after pickup, before bonus etc.)
		this.bonustimer = this.lcdgame.addtimer(this, this.onTimerBonus, 33); // 33msecs = 30 times per second
		this.gastimer = this.lcdgame.addtimer(this, this.onTimerGas, 250); // gass on/off after a win

		// start
		// sound 3 alarms before and after bonus game
		this.bonushold = -1;
		this.bonuswin = false;
		this.bonusstate = STATE_BONUSSTART;
		this.bonusWait(1000, 4);
	},

	press: function(btn) {
		if (this.bonusstate == STATE_BONUSPLAY) {
			// handle player input appropriately
			if ( (btn == "left") || (btn == "right") ) {
				if (this.bonushold < 0) {
					// start random digits
					this.bonushold = 0;
					this.gastimer.pause();
					this.bonustimer.start();
				} else {
					// hold bonus digit
					this.bonushold++;
				}
				this.bonusEvaluate();
			}
		}
	},

	onTimerBonus: function() {

		// update bonus digits
		this.updateBonus();
	},

	bonusWait: function(msecs, max) {
		this.waittimer.pause();
		this.waittimer.counter = 0;
		// short pause when picking up/dropping off hitchhiker, before/after gas bonus game etc.
		if (typeof max === "undefined") max = 1;

		// bonus alarm or crash, then start immediately (instead of first time after <msecs> milliseconds)
		var waitfirst = (max == 1);

		// start timer
		this.waittimer.interval = msecs;
		this.waittimer.start(max, waitfirst);

		// bonus alarm or crash, then start immediately (instead of first time after <msecs> milliseconds)
		//if (max != 1) this.onTimerWait();
	},

	onTimerWait: function() {

		switch(this.bonusstate) {
			case STATE_BONUSSTART:
				// alarm sound before and after bonus game
				if ( (this.waittimer.max > 1) && (this.waittimer.counter <= 3) ) {
					this.lcdgame.playSoundEffect("bonusalarm");
				} else {
					// bonus win
					if (this.bonuswin) {
						this.gastimer.start();
					}
					// start or continue bonus game
					this.lcdgame.setShapeByName("gas", true);
					this.lcdgame.setShapeByName("gas_car", true);
					// display previous bonus digits
					var str = this.bonusvars[0].digit + this.bonusvars[1].digit + this.bonusvars[2].digit;
					this.lcdgame.digitsDisplay("digitbonus", str);

					this.bonusstate = STATE_BONUSPLAY;
				}
				break;
			case STATE_BONUSEND:
				// alarm sound before and after bonus game
				if (this.waittimer.counter <= 3) {
					this.lcdgame.playSoundEffect("bonusalarm");
				} else {
					// continue normal game
					// not all the same, bonus game is over and continue normal game
					this.lcdgame.setShapeByName("gas", false);
					this.lcdgame.setShapeByName("gas_car", false);
					this.lcdgame.digitsDisplay("digitbonus", "   "); // make digits invisible
					this.lcdgame.state.start("maingame");
				}
				break;
		}
	},

	updateBonus: function() {

		var str = "";
		// update all digits
		for (var d=0; d < 3; d++) { //all 3 digit placeholders
			// digit placeholder < this.bonushold was already pressed on hold by player
			if (d >= this.bonushold) {
				// countdown to new digit
				this.bonusvars[d].countdown--;
				if (this.bonusvars[d].countdown <= 0) {
					// goto next freq
					this.bonusvars[d].index++;
					if (this.bonusvars[d].index >= this.bonusfreqs[d].length) this.bonusvars[d].index = 0;
					// get new digit frequency values
					var index = this.bonusvars[d].index;
					this.bonusvars[d].digit = this.bonusfreqs[d][index].digit;
					this.bonusvars[d].countdown = this.bonusfreqs[d][index].fps30;
				}
			}
			// build display string
			str = str + this.bonusvars[d].digit;
		}
		// display bonus digits
		this.lcdgame.digitsDisplay("digitbonus", str);
	},

	bonusEvaluate: function() {
		// show bonus shapes
		if (this.bonushold < 3) {
			this.lcdgame.playSoundEffect("move");
		} else {
			// stop bonus game
			this.bonustimer.pause();
			// check if all the same
			if ( (this.bonusvars[0].digit == this.bonusvars[1].digit) && (this.bonusvars[1].digit == this.bonusvars[2].digit) ) {
				// all the same add bonus points
				if (this.bonusvars[0].digit == "0") this.lcdgame.state.states["maingame"].addScore(50);  // 111
				if (this.bonusvars[0].digit == "1") this.lcdgame.state.states["maingame"].addScore(100); // 333
				if (this.bonusvars[0].digit == "2") this.lcdgame.state.states["maingame"].addScore(300); // 777
				if (this.bonusvars[0].digit == "3") this.lcdgame.state.states["maingame"].addScore(500); // ===
				// display new score
				this.lcdgame.digitsDisplay("digit", ""+this.lcdgame.state.states["maingame"].displayscore, true);
				// make annoying sound
				this.lcdgame.playSoundEffect("bonuswin");
				// continue bonus game
				this.bonushold = -1;
				this.bonuswin = true;
				this.bonusWait(1500);
				this.bonusstate = STATE_BONUSSTART;
			} else {
				// not all the same, bonus game is over and continue normal game
				// sound 3 alarms after bonus game
				// this.initBonusAlarm();
				this.bonusstate = STATE_BONUSEND;
				this.bonusWait(1000, 4);
			}
		}
	},

	onTimerGas: function() {
		var onoff = (this.gastimer.counter % 2 == 0);
		this.lcdgame.setShapeByName("gas", onoff);
	}

};