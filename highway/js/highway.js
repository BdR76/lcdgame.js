// Highway LCD game simulation
// Bas de Reuver (c)2015

var highway = {};

// constants
var STATE_DEMO = 1;
var STATE_MODESELECT = 2;
var STATE_GAMESTART = 10;
var STATE_GAMEPLAY = 11;
var STATE_GAMEPICK = 12;
var STATE_GAMEDROP = 13;
var STATE_BONUSSTART = 14;
var STATE_BONUSPLAY = 15;
var STATE_BONUSEND = 16;
var STATE_GAMECRASH = 20;
var STATE_GAMEOVER = 21;

highway.MainGame = function(lcdgame) {
	// save reference to lcdgame object
	this.lcdgame = lcdgame;

	// game specific variables
	this.gamestate = 0;
	this.difficulty = 1; // difficulty game1 or game2
	this.level = 1; // level up after every 3 hitchhikers dropped off
	this.hitchhikers = 0; // nr of hitchhikers dropped off in current level
	this.carpos = 0; // car position on road, 0=left most, 4=right most
	this.score = 0; // actual score
	this.displayscore = 0;
	this.misses = 0;
	this.girlincar = false; // girl hitchhiker is in car
	
	this.roadcount = 0; // acts as a metronome

	// settings
	this.sound_onoff = false;

	// timers/pulse generators
	this.roadtimer = null;
	this.bonustimer = null;
	this.waittimer = null;
	this.crashtimer = null; // for crash animation

	// frequencies of the 3 bonus digits, as sampled from a 30fps video, example {"symbol": "1", "fps30": 8} means show digit "1" for (8/30)th of a second
	// changed 3 the fps30 values, because the 3 digit cycles were exactly synched up (always same cycle)
	// changed them slightly so they are now out of synch with each other, just like in the real game
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
	this.objfreqs = [10, 25, 25, 25, 10];

	// variables for bonus game
	this.bonusvars = [];
	this.bonushold = 0; // how many digits pressed on hold
}

highway.MainGame.prototype = {
	initialise: function(){

		// startup show all
		this.lcdgame.shapesDisplayAll(true);
		this.lcdgame.shapesRefresh();
		this.lcdgame.shapesDisplayAll(false);

		// initialise bonus digits (symbol "1" is shape digit 0, "3" is 1, "7" is 2, "=" is 3)
		for (var d=0; d < 3; d++) { //all 3 digit placeholders
			for (var e=0; e < this.bonusfreqs[d].length; e++) { //all 3 digit placeholders
				var c = this.bonusfreqs[d][e].symbol;
				if (c == "1") this.bonusfreqs[d][e].digit = "0";
				if (c == "3") this.bonusfreqs[d][e].digit = "1";
				if (c == "7") this.bonusfreqs[d][e].digit = "2";
				if (c == "=") this.bonusfreqs[d][e].digit = "3";
			};
			// hold bonus game vars
			this.bonusvars[d] = {"digit": "0", "countdown": 0, "index": 0}; // current digit displayed, countdown to new digit, index in bonusfreqs
		};

		// initialise all timers
		this.demotimer  = new LCDGame.Timer(this, this.onTimerDemo, 500);
		this.roadtimer  = new LCDGame.Timer(this, this.onTimerRoad, 500);
		this.bonustimer = new LCDGame.Timer(this, this.onTimerBonus, 33); // 33msecs = 30 times per second
		this.waittimer  = new LCDGame.Timer(this, this.onTimerWait, 1000); // pause moments during game (after pickup, before bonus etc.)
		this.crashtimer  = new LCDGame.Timer(this, this.onTimerCrash, 250); // crash on/off animation

		this.initDemoMode();

		this.toggleSound();

		//this.roadtimer.Start();
		//this.bonustimer.Start();
		//this.initNewGame();
	},

	// -------------------------------------
	// timer events
	// -------------------------------------
	onTimerDemo: function() {
		// update clock
		if (this.demotimer.Counter % 2 == 0) {
			// demo timer event fired every half second
			this.lcdgame.setShapeValue("timecolon", false);
		} else {
			// only update road every whole second
			this.lcdgame.setShapeValue("timecolon", true);
			this.updateClock();
			this.updateRoad();
		};

		// refresh shapes
		this.lcdgame.shapesRefresh();
	},

	onTimerRoad: function() {

		//console.log(".. highway.onTimerRoad() called!! this.roadcount=" + this.roadcount);

		// move all road objects
		this.updateRoad();

		// display score
		this.lcdgame.digitsDisplay("digit", ""+this.displayscore, true);

		// refresh shapes
		this.lcdgame.shapesRefresh();
	},

	onTimerBonus: function() {

		// update bonus digits
		this.updateBonus();

		// refresh shapes
		this.lcdgame.shapesRefresh();
	},

	onTimerWait: function() {
		var d = new Date();
		var n = d.toLocaleTimeString() + '.' + ("000"+d.getMilliseconds()).substr(-3);
		console.log("onTimerWait - time="+n+ " waittimer.Counter="+this.waittimer.Counter+" waittimer.Max="+this.waittimer.Max+" this.gamestate="+this.gamestate);
		// determine where to continue
		switch (this.gamestate) {
			case STATE_GAMEPICK:
				// remove hitchhiker and put in car
				this.lcdgame.sequenceShift("girl");
				for (var i = 0; i < 5; i++) {this.lcdgame.sequenceShift("car")};
				this.girlincar = true;
				// continue game
				this.gamestate = STATE_GAMEPLAY;
				this.roadtimer.Start();
				break;
			case STATE_GAMEDROP:
				console.log("onTimerWait - STATE_GAMEDROP");
				// remove hitchhiker and drop off sign
				this.lcdgame.setShapeValue("girl_dropoff", false);
				this.lcdgame.sequenceShift("signdrop");
				// bonus game or continue game
				if (this.hitchhikers >= 3) {
					// start bonus game
					this.gamestate = STATE_BONUSSTART;
					//this.initBonusAlarm();
					// sound 3 alarms before and after bonus game
					this.bonushold = -1;
					// show all shapes
					this.lcdgame.shapesRefresh();
					// another small pause
					this.initWait(1000, 3);
				} else {
					this.gamestate = STATE_GAMEPLAY;
					this.roadtimer.Start();
				};
				break;
			case STATE_BONUSSTART:
				// alarm sound before and after bonus game
				if ( (this.waittimer.Counter < 3) && (this.waittimer.Max > 1) ) {
					this.lcdgame.playSoundEffect("bonusalarm");
				} else {
					// start or continue bonus game
					this.lcdgame.setShapeValue("gas", true);
					this.lcdgame.setShapeValue("gas_car", true);
					// display previous bonus digits
					var str = this.bonusvars[0].digit + this.bonusvars[1].digit + this.bonusvars[2].digit;
					this.lcdgame.digitsDisplay("digitbonus", str);

					this.gamestate = STATE_BONUSPLAY;
				};
				break;
			case STATE_BONUSEND:
				// alarm sound before and after bonus game
				if ( (this.waittimer.Counter < 3) && (this.waittimer.Max > 1) ) {
					this.lcdgame.playSoundEffect("bonusalarm");
				} else {
					// continue normal game
					// not all the same, bonus game is over and continue normal game
					this.lcdgame.setShapeValue("gas", false);
					this.lcdgame.setShapeValue("gas_car", false);
					this.lcdgame.digitsDisplay("digitbonus", "   "); // make digits invisible
					this.initNextLevel();
				};
				break;
			case STATE_GAMECRASH:
				// alarm sound before and after bonus game
				if (this.waittimer.Counter != this.waittimer.Max) {
					this.lcdgame.playSoundEffect("crash");
				} else {
					// continue or game over
					if (this.misses < 3) {
						// reset player
						this.initCarPos();
						// continue game
						this.gamestate = STATE_GAMEPLAY;
						this.roadtimer.Start();
					} else {
						// TODO: check for highscore
						this.gamestate = STATE_GAMEOVER;
					};
				};
				break;
		};
		// refresh shapes
		this.lcdgame.shapesRefresh();
	},

	onTimerCrash: function() {
		// flash crash animation on/off
		var b = (this.crashtimer.Counter % 2 == 0);
		var p = (this.carpos % 5) - 1;
		console.log("onTimerCrash - this.crashtimer.Counter="+this.crashtimer.Counter+" ==> p="+p+" b="+b);
		this.lcdgame.sequencePosSetValue("crash", p, b);
		// refresh shapes
		this.lcdgame.shapesRefresh();
	},

	// -------------------------------------
	// player input
	// -------------------------------------
	handleInput: function(buttonname) {
		// determine state of gameplay
		switch (this.gamestate) {
			case STATE_DEMO:
				if (buttonname == "sound") {
					this.toggleSound();
					// show/hide sound icon immediately
					this.lcdgame.shapesRefresh();
				};
				if (buttonname == "mode") {
					this.initModeSelect();
				};
				// NOTE: press "set" during demo mode to set time (displays "setting" shape) and then "mode" to go back
				//if (buttonname == "set") not implemented, no need because time always synched using Date()
				break;
			case STATE_MODESELECT:
				// select difficulty 1 or 2 or back to demo mode
				if (buttonname == "mode") {
					this.initModeSelect();
				};
				// start game
				if ( (buttonname == "left") || (buttonname == "right") ) {
					this.initNewGame();
				};
				break;
			case STATE_GAMEPLAY:
				// handle player input appropriately
				if (buttonname == "left") {
					if (this.playerMove(-1)) this.lcdgame.playSoundEffect("move");
				};
				if (buttonname == "right") {
					if (this.playerMove(+1)) this.lcdgame.playSoundEffect("move");
				};
				break;
			case STATE_BONUSPLAY:
				// handle player input appropriately
				if ( (buttonname == "left") || (buttonname == "right") ) {
					if (this.bonushold < 0) {
						// start random digits
						this.bonushold = 0;
						this.bonustimer.Start();
					} else {
						// hold bonus digit
						this.bonushold++;
					};
					this.bonusEvaluate();
				};
				break;
			case STATE_GAMEOVER:
				if (buttonname == "mode") {
					this.initModeSelect();
				};
				// start game
				if ( (buttonname == "left") || (buttonname == "right") ) {
					this.initNewGame();
				};
		};
	},

	// -------------------------------------
	// non-game functions, settings etc.
	// -------------------------------------
	toggleSound: function() {
		// determine state of gameplay
		this.sound_onoff = !(this.sound_onoff);
		this.lcdgame.setShapeValue("alarm_onoff", this.sound_onoff);
	},

	initDemoMode: function() {
		this.gamestate = STATE_DEMO;
		this.updateClock();
		this.demotimer.Start();
	},

	initModeSelect: function() {

		if (this.gamestate == STATE_DEMO) {
			// switch from demo to game select
			this.demotimer.Stop();

			// set road sides
			this.gamestate = STATE_MODESELECT;
			this.difficulty = 1;

			// clear screen
			this.lcdgame.shapesDisplayAll(false);

			// show score=0
			this.lcdgame.digitsDisplay("digit", "0", true);

			// enter player
			this.initCarPos();

			// set road sides
			for (var i=0; i<=4; i++) {
				console.log("initNewGame, sequencePush road -> "+i+ " true/false="+(i<4));
				this.lcdgame.sequencePosSetValue("road_left",  i, (i>0));
				this.lcdgame.sequencePosSetValue("road_right", i, (i>0));
			};

			// game1
			this.lcdgame.setShapeValue("game1", true);

			// refresh immediately
			this.lcdgame.shapesRefresh();
		} else {
			//
			if (this.difficulty == 1) {
				// select difficulty 2
				this.difficulty = 2;
				this.lcdgame.setShapeValue("game1", false);
				this.lcdgame.setShapeValue("game2", true);
				// refresh immediately
				this.lcdgame.shapesRefresh();
			} else {
				// back to demo mode
				// NOTE: actually, after game1 and game2 the "mode" button switches to alarm clock,
				// then press "set" button and it displays "setting" shape
				// and you can set alarm time by left=hours+1, right=minutes+1
				this.lcdgame.setShapeValue("game2", false);
				this.initDemoMode();
				// refresh immediately
				this.lcdgame.shapesRefresh();
			};
		};
	},

	// -------------------------------------
	// game functions
	// -------------------------------------
	initCarPos: function() {
		// reset player to right-hand side
		this.girlincar = false;
		this.carpos = 4; // car position on road, 0=left most, 4=right most
		// clear any previous shapes
		this.lcdgame.sequenceClear("car");
		// set current shape
		this.lcdgame.sequencePosSetValue("car", this.carpos, true);
	},

	initNewGame: function() {
		// reset game specific variables
		this.level = 0;
		this.score = 0;
		this.displayscore = this.score;
		this.misses = 0;
		this.girlincar = false; // girl hitchhiker is in car
		this.roadcount = 0;

		// clear screen
		this.lcdgame.shapesDisplayAll(false);

		// display game1 or game2
		if (this.difficulty == 1) {this.lcdgame.setShapeValue("game1", true)};
		if (this.difficulty == 2) {this.lcdgame.setShapeValue("game2", true)};

		// reset player
		this.initCarPos();

		// every game begins with one sign at front, one dog in middle and one tree in back, always.
		this.lcdgame.sequencePosSetValue("dog",  1, true);
		this.lcdgame.sequencePosSetValue("sign", 3, true);
		this.lcdgame.sequencePosSetValue("tree", 0, true);

		// set road sides
		for (var i=0; i<=4; i++) {
			console.log("initNewGame, sequencePush road -> "+i+ " true/false="+(i<4));
			this.lcdgame.sequencePosSetValue("road_left",  i, (i>0));
			this.lcdgame.sequencePosSetValue("road_right", i, (i>0));
		};

		// show all shapes
		this.lcdgame.shapesRefresh();

		// start game
		this.initNextLevel();
	},

	initWait: function(msecs, max) {
		console.log("initWait("+msecs+", "+max+").. ok");
		this.waittimer.Stop();
		this.waittimer.Counter = 0;
		// short pause when picking up/dropping off hitchhiker, before/after gas bonus game etc.
		if (typeof max === "undefined") max = 1;

		// start timer
		this.waittimer.Interval = msecs;
		this.waittimer.Start(max);

		// bonus alarm or crash, then start immediately (instead of first time after <msecs> milliseconds)
		if (max != 1) this.onTimerWait();
	},

	initCrash: function() {
		this.misses++;
		this.gamestate = STATE_GAMECRASH;
		// update misses display
		this.lcdgame.sequenceShift("carlifes");
		this.lcdgame.sequencePush("carlifes", true);
		if (this.misses >= 3) {
			this.lcdgame.setShapeValue("gameover", true);
		};
		// start timer
		this.roadtimer.Stop();
		this.crashtimer.Counter = 0;
		this.crashtimer.Start(10-1); // 5 x on/off = 10 times (-1 because start at 0)
		this.onTimerCrash(); // start crash animation immediately
		this.initWait(1000, 4); // 4 x alarm sounds
	},

	initNextLevel: function() {
		// set and rest game specific variables
		this.hitchhikers = 0;
		this.level++; // next level
		this.gamestate = STATE_GAMEPLAY;

		// set road speed according to level
		var msecs = 750; // game1
		if (this.difficulty == 1) {msecs = 750 - (this.level-1) * 62.5}; // game1
		if (this.difficulty == 2) {msecs = 500 - (this.level-1) * 62.5}; // game2
		// limit max.speed. NOTE: not verified so not sure that this limit was also on actual device
		if (msecs < 62.5) {msecs = 62.5};

		//console.log("initNextLevel, difficulty="+this.difficulty+" level="+this.level+" tick millisecs="+msecs);

		// start road moving
		this.roadtimer.Interval = msecs;
		this.roadtimer.Start();
	},

	bonusEvaluate: function() {
		// show bonus shapes
		if (this.bonushold < 3) {
			this.lcdgame.playSoundEffect("move");
		} else {
			// stop bonus game
			this.bonustimer.Stop();
			// check if all the same
			if ( (this.bonusvars[0].digit == this.bonusvars[1].digit) && (this.bonusvars[1].digit == this.bonusvars[2].digit) ) {
				// all the same add bonus points
				if (this.bonusvars[0].digit == "0") this.addScore(50);  // 111
				if (this.bonusvars[0].digit == "1") this.addScore(100); // 333
				if (this.bonusvars[0].digit == "2") this.addScore(300); // 777
				if (this.bonusvars[0].digit == "3") this.addScore(500); // ===
				// display new score
				this.lcdgame.digitsDisplay("digit", ""+this.displayscore, true);
				// make annoying sound
				this.lcdgame.playSoundEffect("bonuswin");
				// continue bonus game
				this.bonushold = -1;
				this.initWait(1500);
				this.gamestate = STATE_BONUSSTART;
			} else {
				// not all the same, bonus game is over and continue normal game
				// sound 3 alarms after bonus game
				// this.initBonusAlarm();
				this.gamestate = STATE_BONUSEND;
				this.initWait(1000, 3);
			};
			// show all shapes
			this.lcdgame.shapesRefresh();
		};
	},

	updateRoad: function() {
		this.roadcount++;
		//console.log(".. highway.onTimerRoad() called!! this.roadcount=" + this.roadcount);

		// score count
		var girl = this.lcdgame.sequenceShapeVisible("girl",  3);
		var dog  = this.lcdgame.sequenceShapeVisible("dog",  3);
		var sign = this.lcdgame.sequenceShapeVisible("sign", 3);
		var tree = this.lcdgame.sequenceShapeVisible("tree", 3);
		var drop = this.lcdgame.sequenceShapeVisible("signdrop",  3);

		// check collision
		if ( (this.carpos == 1) && dog )  {this.initCrash(); console.log("highway.onTimerRoad - CRASH into dog");};
		if ( (this.carpos == 2) && sign ) {this.initCrash(); console.log("highway.onTimerRoad - CRASH into sign")};
		if ( (this.carpos == 3) && tree ) {this.initCrash(); console.log("highway.onTimerRoad - CRASH into tree")};
		// stop road update when crashed
		if (this.gamestate != STATE_GAMEPLAY) {
			return false;
		};

		// check if no collision and car is in middle lane
		if ( (this.carpos > 0) && (this.carpos < 4) ) {
			// can only score points for passing objects when car is in middle lane
			if (dog)  {this.addScore(10)};
			if (sign) {this.addScore(10)};
			if (tree) {this.addScore(10)};
		};

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
			this.roadtimer.Stop();
			this.gamestate = STATE_GAMEPICK;
			this.initWait(1500);
			this.lcdgame.playSoundEffect("pickup");
		} else {
			this.lcdgame.sequenceShift("girl");
		};
		// drop off hitchhiker
		if ( (this.carpos == 4) && drop && (this.girlincar == true) ) {
			this.addScore(50);
			this.hitchhikers++;
			// girl get out
			for (var i = 0; i < 5; i++) {this.lcdgame.sequenceShiftReverse("car")};
			this.girlincar = false;
			this.lcdgame.setShapeValue("girl_dropoff", true);
			// short pause
			this.roadtimer.Stop();
			this.gamestate = STATE_GAMEDROP;
			this.initWait(1750);
			this.lcdgame.playSoundEffect("dropoff");
		} else {
			this.lcdgame.sequenceShift("signdrop");
		};
		
		// tick sound effect (not when picking up or dropping off)
		if (this.gamestate == STATE_GAMEPLAY) {
			this.lcdgame.playSoundEffect("tick");
		};

		// add new active shapes to the sequence
		if (this.roadcount % 5 != 0) {
			this.lcdgame.sequencePush("road_left", true);
			this.lcdgame.sequencePush("road_right", true);
		};

		// change of new road objects appearing
		var strTESTING = "";
		this.objfreqs = [10, 33, 33, 33, 10]; // 10%, 25% etc.
		for (var i=0; i < this.objfreqs.length; i++) {
			var o = Math.floor(Math.random() * 100) + 1; //1..100
			if (o <= this.objfreqs[i]) {this.objfreqs[i]=1} else {this.objfreqs[i]=0}; // 1=appears, 0=doesn't appear
			
			// TESTING!!
			strTESTING = strTESTING + this.objfreqs[i] + ",";
		};
		console.log("updateRoad - random stuff -> " + strTESTING);
		// exception, objects in 3 middle lanes (dog, sign, tree) may never ALL appear at once because then player can't go anywhere
		if ( (this.objfreqs[1] == 1) && (this.objfreqs[2] == 1) && (this.objfreqs[3] == 1)) {
			var idx = Math.floor(Math.random() * 3) + 1; //1..3
			this.objfreqs[idx] = 0; // erase one of the three
		};

		// make objects appear
		if (this.objfreqs[0] == 1) this.lcdgame.sequencePush("girl", true);
		if (this.objfreqs[1] == 1) this.lcdgame.sequencePush("dog", true);
		if (this.objfreqs[2] == 1) this.lcdgame.sequencePush("sign", true);
		if (this.objfreqs[3] == 1) this.lcdgame.sequencePush("tree", true);
		if (this.objfreqs[4] == 1) this.lcdgame.sequencePush("signdrop", true);
	},

	playerMove: function(step) {
		var validmove = false;
		// check if valid move
		if ( (this.carpos + step >=0) && (this.carpos + step < 5) ) {
			validmove = true;

			// cannot move to left-most when no girl in hitchhiker lane visible, or girl alreay in car
			if (this.carpos + step == 0) {
				if ( (this.lcdgame.sequenceShapeVisible("girl") == false) || (this.girlincar == true) ) validmove = false;
			};
			// cannot move to right-most when no drop off sign is visible, or girl not in car
			if (this.carpos + step == 4) {
				if ( (this.lcdgame.sequenceShapeVisible("signdrop") == false) || (this.girlincar == false) ) validmove = false;
			};

			if (validmove == true) {
				// move car
				this.carpos = this.carpos + step;
				if (step == -1) {
					this.lcdgame.sequenceShiftReverse("car");
				} else if (step == +1) {
					this.lcdgame.sequenceShift("car");
				};
				// refresh shapes
				this.lcdgame.shapesRefresh();
			};
		};

		// 
		return validmove;
	},

	addScore: function(points) {
		// check if valid move
		this.score += points;
		// score display can overflow, example when score=20790, display as "790"
		this.displayscore = (this.score % 20000);
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
				};
			};
			// build display string
			str = str + this.bonusvars[d].digit;
		};
		// display bonus digits
		this.lcdgame.digitsDisplay("digitbonus", str);
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
			this.lcdgame.setShapeValue("time_pm", true);
		} else {
			if (ihours == 0) ihours = 12; // weird AM/PM time rule
			this.lcdgame.setShapeValue("time_pm", false);
		}
		// format hour and minute
		var strtime = ("  "+ihours).substr(-2) + ("00"+imin).substr(-2);

		// display time
		this.lcdgame.digitsDisplay("digit", strtime, false);
	}
}
