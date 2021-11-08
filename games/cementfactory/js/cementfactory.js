// Cement Factory LCD game simulation
// Bas de Reuver (c)2019

var cementfactory = {};

// constants
var STATE_NONE = 0;
var STATE_PLAYING = 1;
var WAIT_LIFT_MISS = 2;
var WAIT_CEMENT_MISS = 3;
var STATE_GAMEOVER = 4;

var DIR_NONE = 0;
var DIR_UP = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 4;
var DIR_RIGHT = 8;
var DIR_JUMP = 16;

// note: it's easier for each Mario position to put all valid moves and lever/lift positions in a look-up array
// than it is to programmatically determine where Mario can move and which lifts to check, that would become needlessly complex.
// Each array item is a Mario position, which are valid moves and move how many steps in this array, and where is access to lifts and levers.
//                           up down left right lever          lift pos
var MoveCollide = [
	{"move":[ 0,   0,   0,    0,   0], "lift":[  1, 2] }, // crush at top (miss)
	{"move":[-1,  +4,   0,   +1,   0], "lift":[  1, 2] }, // top-left lift
	{"move":[-2,  +4,  -1,    0,   0], "lift":[  2, 4] }, // top-right lift
	{"move":[ 0,   0,   0,   +1,   1], "lift":[  0, 0] }, // top platform at lever (left most)
	{"move":[ 0,   0,  -1,   +1,   0], "lift":[  0, 0] }, // ..
	{"move":[-4,  +6,  -1,   +1,   0], "lift":[  1, 3] },
	{"move":[-4,  +6,  -1,   +1,   0], "lift":[  2, 3] },
	{"move":[ 0,   0,  -1,   +1,   0], "lift":[  0, 0] },
	{"move":[ 0,   0,  -1,    0,   2], "lift":[  0, 0] },
	{"move":[ 0,   0,   0,   +1,   3], "lift":[  0, 0] }, // bottom platform at lever (left most)
	{"move":[ 0,   0,  -1,   +1,   0], "lift":[  0, 0] },
	{"move":[-6,  +5,  -1,   +1,   0], "lift":[  1, 4] },
	{"move":[-6,  +5,  -1,   +1,   0], "lift":[  2, 2] },
	{"move":[ 0,   0,  -1,   +1,   0], "lift":[  0, 0] },
	{"move":[ 0,   0,  -1,    0,   4], "lift":[  0, 0] },
	{"move":[ 0,   0,   0,   +1,   0], "lift":[  0, 0] }, // hide position
	{"move":[-5,  +2,  -1,   +1,   0], "lift":[  1, 5] }, // bottom-left lift
	{"move":[-5,  +1,  -1,    0,   0], "lift":[  2, 1] }, // bottom-right lift
	{"move":[ 0,   0,   0,    0,   0], "lift":[  0, 0] }  // crush at bottom (miss)
];

// =============================================================================
// clock state
// =============================================================================
cementfactory.ClockMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.demotimer = null;
};
cementfactory.ClockMode.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		this.demotimer = this.lcdgame.addtimer(this, this.onTimerDemo, 1000, false);

		this.liftdemo = 0;
		this.lift1 = 0;
		this.lift2 = 0;
		this.liftindex = 0;
		this.mario = 0;

		// initialise demo static shapes
		this.lcdgame.setShapeByName("mario_04", true);
		this.lcdgame.setShapeByName("driver1", true);
		this.lcdgame.setShapeByName("driver2", true);

		// reset all hatch and levers
		for (var i = 1; i <= 4 ; i++) {
			this.lcdgame.setShapeByName("hatch" + i + "_1", true);
			this.lcdgame.setShapeByName("lever" + i + "_1", true);

			this.lcdgame.setShapeByName("hatch" + i + "_2", false);
			this.lcdgame.setShapeByName("lever" + i + "_2", false);
		}

		// initially two empty buckets
		this.lcdgame.setShapeByName("bucket1_2", true);
		this.lcdgame.setShapeByName("bucket2_1", true);

		// start demo
		this.demotimer.start();
	},

	update: function() {

	},

	press: function(btn) {
		// show highscore before starting game
		if ( (btn == "game_a") || (btn == "game_b") ) {
			this.demotimer.pause();
			this.lcdgame.setShapeByName("time_colon", false);
			this.lcdgame.setShapeByName("time_am", false);
			this.lcdgame.setShapeByName("time_pm", false);
			this.lcdgame.setShapeByName(btn, true);
			// show highscore
			var sc = this.lcdgame.highscores.getHighscore((btn == "game_a" ? 1 : 2));
			this.lcdgame.digitsDisplay("digits", ""+sc, true);
		}
	},
	release: function(btn) {
		// start game
		if ( (btn == "game_a") || (btn == "game_b") ) {
			this.lcdgame.level = 0; // new game
			this.lcdgame.gametype = (btn == "game_a" ? 1 : 2); // 1=game A, 2=game B
			this.lcdgame.state.start("maingame");
		}
	},

	close: function() {
	},

	onTimerDemo: function() {
		// update clock
		this.updateclock();

		// update demo animation
		this.updateDemo();
	},

	updateDemo: function() {
		// update moving enemies
		var t = this.demotimer.counter;

		// move the enemies
		if (t % 2 == 0) {
			// from top row birds to middle row birds
			this.lcdgame.sequenceShift("bucket1");
			this.lcdgame.sequenceShift("lift1");
			this.lift1--;
			if (this.lift1 <= 0) {
				this.lcdgame.setShapeByName("lift1_1", true);
				this.liftindex++;
				this.lift1 = (this.liftindex % 2 == 0 ? 3 : 2);
			}
		} else {
			this.lcdgame.sequenceShift("bucket2");
			this.lcdgame.sequenceShift("lift2");
			this.lift2--;
			if (this.lift2 <= 0) {
				this.lcdgame.setShapeByName("lift2_1", true);
				this.liftindex++;
				this.lift2 = (this.liftindex % 2 == 0 ? 3 : 2);
			}
		}

		// new empty buckets
		if ((t+2) % 6 == 0) this.lcdgame.setShapeByName("bucket1_1", true);
		if ((t+1) % 6 == 0) this.lcdgame.setShapeByName("bucket2_1", true);

		// randomly move mario left and right
		var n = this.lcdgame.randomInteger(1, 5);
		if (n == 1) {
			this.mario = 1 - this.mario; // toggle 0 and 1

			var b = (this.mario == 0);
			this.lcdgame.setShapeByName("mario_03", b);
			this.lcdgame.setShapeByName("mario_04", !b);
			this.lcdgame.setShapeByName("arm1_1", b);
		}
	},

	updateclock: function() {
		// get time as 12h clock with PM
		var datenow = new Date();
		//var str = datenow.toLocaleTimeString();
		//var strtime = "" + str.substring(0, 2) + str.substring(3, 5); // example "2359"
		var ihours = datenow.getHours();
		var imin = datenow.getMinutes();

		// adjust hour and set PM if needed
		if (ihours >= 12) {
			if (ihours > 12) ihours = ihours - 12;
			this.lcdgame.setShapeByName("time_am", false);
			this.lcdgame.setShapeByName("time_pm", true);
		} else {
			if (ihours == 0) ihours = 12; // weird AM/PM time rule
			this.lcdgame.setShapeByName("time_am", true);
			this.lcdgame.setShapeByName("time_pm", false);
		}
		// format hour and minute
		var strtime = ("  "+ihours).substr(-2) + ("00"+imin).substr(-2);

		// clock time colon
		this.lcdgame.setShapeByName("time_colon", true);

		// display time
		this.lcdgame.digitsDisplay("digits", strtime, false);
	}
};



// =============================================================================
// game state
// =============================================================================
cementfactory.MainGame = function(lcdgame) {
	this.lcdgame = lcdgame;

	this.lifttimer = null;
	this.bucktimer = null;
	this.levertimer = null;
	this.valveopen;

	this.waittimer = null;
	this.chancetimer = null;

	this.mariopos;
	this.misses;
	this.movebucket;
	this.dropcement;
	this.spillcement;
	this.flowpoint;

	this.miss_overflow;
	this.miss_count;

	this.unlockstart;
	this.unlockbonus;

	this.enemyspawn;

	this.waitmode;  // waittimer, type of pause
	this.chancetime;
};
cementfactory.MainGame.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		this.lifttimer = this.lcdgame.addtimer(this, this.onTimerLift, 400, false);
		this.bucktimer = this.lcdgame.addtimer(this, this.onTimerBucket, 400, false);
		this.levertimer = this.lcdgame.addtimer(this, this.onTimerLever, 200, true);
		this.warntimer = this.lcdgame.addtimer(this, this.onTimerWarning, 250, false);

		this.waittimer = this.lcdgame.addtimer(this, this.onTimerWait, 500, true); // fall animation, spill over animation
		this.bonustimer = this.lcdgame.addtimer(this, this.onTimerBonus, 250, true);
		this.chancetimer = this.lcdgame.addtimer(this, this.onTimerChance, 500);

		// start new game
		this.newGame();
	},

	// start a new game, reset score level etc.
	newGame: function() {
		// stop any other state
		this.lcdgame.shapesDisplayAll(false);

		// reset game specific variables
		this.lcdgame.gameReset(this.lcdgame.gametype);
		this.misses = 0;
		this.chancetime = false;

		// show "game b" or "game b"
		var gametxt = (this.lcdgame.gametype == 1 ? "game_a" : "game_b");
		this.lcdgame.setShapeByName(gametxt, true);

		// reset game specific variables
		this.movebucket = 0;
		this.valveopen = -1;
		this.dropcement = [-1, -1, -1, -1]; // when to drop cement in hoppers, in sync with lift animation frames (top left, top right, bottom left, bottom right)
		this.spillcement = [0, 0, 0, 0, 0, 0]; // when to spill cement from one hopper to the next

		// difference between game modes:
		// GAME A has more predictable stable lift pattern, and more buckets are empty
		// GAME B has more erratic lift pattern, and more filled buckets
		this.liftvars = {"wait1": 0, "wait2": 0, "index1": 0, "index2": 0, "pattern": 0, "chancemax": 0, "chances": []};
		this.bucketvars = {"bucket1": 0, "bucket2": 0, "nibble": 0, "index": 0, "count": 0, "pref": 0};

		// NOTE: the lifts and buckets are semi-randomised, the pattern is hard to figure out,
		// so the algorithms here is an educated guess based on stats,
		// an approximation of the patterns as seen on the real device, not 100% accurate
		if (this.lcdgame.gametype == 1) {
			// Game A, more predictable lift pattern
			this.liftvars.chances = [3, 50-2-5-5, 50-2-5, 50-2, 50]; // lift-spaces probabilities GAME A
			this.liftvars.chancemax = 10; // GAME A starts with more 4-spaces on left, later normal chances
		} else {
			// Game B, more unpredictable lift pattern
			this.liftvars.chances = [3, 25-2-5-5, 25-2-5, 25-2, 25]; // lift-spaces probabilities GAME B
			this.liftvars.chancemax = this.liftvars.chances[4]; // GAME B starts right away
		}

		// reset all hatch and levers
		for (var i = 1; i <= 4 ; i++) {
			this.lcdgame.setShapeByName("hatch" + i + "_1", true);
			this.lcdgame.setShapeByName("lever" + i + "_1", true);

			this.lcdgame.setShapeByName("hatch" + i + "_2", false);
			this.lcdgame.setShapeByName("lever" + i + "_2", false);
		}

		// initially two empty buckets
		this.lcdgame.setShapeByName("bucket1_2", true);
		this.lcdgame.setShapeByName("bucket2_1", true);

		// start game
		this.continueGame();
	},

	// continue at start of game, or continue after a miss
	continueGame: function() {

		// reset mario
		this.mariopos = 4;
		this.lcdgame.sequenceClear("mario");
		this.lcdgame.sequenceClear("arm");
		this.lcdgame.sequenceSetPos("mario", this.mariopos, true);

		// reset drivers
		this.lcdgame.setShapeByName("driver1", true);
		this.lcdgame.setShapeByName("driver2", true);
		this.lcdgame.setShapeByName("driver_fall1", false);
		this.lcdgame.setShapeByName("driver_fall2", false);

		// reset score
		this.scorePoints(0);
		this.miss_overflow = 0;
		this.flowpoint = 0;

		// reset timers
		this.waittimer.pause();
		this.waitmode = STATE_PLAYING;
		this.refreshGameSpeed();
	},

	update: function() {
	},

	press: function(btn, idx) {

		// playing game
		if (this.waitmode == STATE_PLAYING) {
			if (btn == "left") {
				this.tryMoveMario(DIR_LEFT);
			}
			if (btn == "right") {
				this.tryMoveMario(DIR_RIGHT);
			}
			if (btn == "open") {
				this.tryMarioLever();
			}
		}

		// game over
		if (this.waitmode == STATE_GAMEOVER) {
			if ( (btn == "game_a") || (btn == "game_b") ) {
				//this.lcdgame.setShapeByName("time_colon", false);
				// show highscore
				var sc = this.lcdgame.highscores.getHighscore((btn == "gamea" ? 1 : 2));
				this.lcdgame.digitsDisplay("digits", ""+sc, true);
			}

			if (btn == "time") {
				// back to clock mode
				this.lcdgame.state.start("clock");
			}
		}
	},

	release: function(btn) {
		// after game over, release gamea/gameb to start game
		if (this.waitmode == STATE_GAMEOVER) {
			if ( (btn == "game_a") || (btn == "game_b") ) {
				this.lcdgame.level = 0; // new game
				this.lcdgame.gametype = (btn == "game_a" ? 1 : 2); // 1=game a, 2=game b
				this.lcdgame.state.start("maingame"); //restart
			}
		}
	},

	close: function() {
	},

	refreshGameSpeed: function() {
		// Set game speed according to current level and nr of locks remaining
		// NOTE: on the real device the actual speed varies a lot,
		// possibly due to the varying and enemies onscreen(?) and the very slow CPU

		// Formula below is an as-good-as-possible educated guess, based on Game & Watch Gallery 4 (GBA) video https://www.youtube.com/watch?v=-pJy8410ip4
		var msec = (this.lcdgame.gametype == 1 ? 750 : 688); // Game A starts at 750, Game B at 688
		if (this.lcdgame.gametype == 1) {
			// Game A
			if (this.lcdgame.score >  20) msec = 688;
			if (this.lcdgame.score > 220) msec = 620;
			if (this.lcdgame.score > 360) msec = 568;
			if (this.lcdgame.score > 560) msec = 502;
		} else {
			// Game B
			if (this.lcdgame.score >  20) msec = 620;
			if (this.lcdgame.score > 120) msec = 568;
			if (this.lcdgame.score > 360) msec = 502;
		}

		// set lifts and buckets speed
		this.lifttimer.interval = 0.5 * msec;
		this.lifttimer.start();

		this.bucktimer.interval = 0.8 * msec;
		this.bucktimer.start();
		this.movebucket = 0; // keep bucket hatch open/close in sync with bucket movement
	},

	tryMoveMario: function(dir) {
		// initialise move position
		var move = 0;

		if (dir == DIR_LEFT) {
			move = MoveCollide[this.mariopos].move[2];
		}
		if (dir == DIR_RIGHT) {
			move = MoveCollide[this.mariopos].move[3];
		}
		if (dir == DIR_UP) {
			move = MoveCollide[this.mariopos].move[0];
		}
		if (dir == DIR_DOWN) {
			move = MoveCollide[this.mariopos].move[1];
		}

		// update or not
		if (move != 0) {
			// clear any arms
			var arm = MoveCollide[this.mariopos].move[4];
			if (arm > 0) {
				this.lcdgame.setShapeByName("arm"+arm+"_1", false);
				this.lcdgame.setShapeByName("arm"+arm+"_2", false);
			}

			// move mario
			this.mariopos = this.mariopos + move;
			this.lcdgame.sequenceClear("mario");
			this.lcdgame.sequenceSetPos("mario", this.mariopos, true);

			// move sound effect, only when moving left or right
			if ( (dir == DIR_LEFT) || (dir == DIR_RIGHT) ) {
				this.lcdgame.playSoundEffect("move");
			}

			// Check if Mario stepped into lift column
			var lift = MoveCollide[this.mariopos].lift[0];
			if (lift > 0) {
				// check if lift is visible
				var liftpos = MoveCollide[this.mariopos].lift[1];
				var frm = "lift" + lift + "_" + liftpos;

				// check if lift not available
				if (!this.lcdgame.shapeVisible(frm)) {
					// fall down
					this.doWait(WAIT_LIFT_MISS);
					return;
				}
			}

			// show arm at lever
			var arm = MoveCollide[this.mariopos].move[4];
			if (arm > 0) {
				this.lcdgame.setShapeByName("arm"+arm+"_1", true);
			}

		}
	},

	tryMarioLever: function() {
		// can only push one lever at once, cancel if already pushing a lever
		if (this.levertimer.enabled) return;

		// is Mario standing next to a lever
		var arm = MoveCollide[this.mariopos].move[4];
		if (arm > 0) {
			// remember which valve was opened
			this.valveopen = arm;

			// move lever and Mario arm
			this.lcdgame.setShapeByName("arm" + arm + "_1", false);
			this.lcdgame.setShapeByName("arm" + arm + "_2", true);

			// open hatch
			this.lcdgame.setShapeByName("hatch" + arm + "_1", false);
			this.lcdgame.setShapeByName("hatch" + arm + "_2", true);

			// open lever
			this.lcdgame.setShapeByName("lever" + arm + "_1", false);
			this.lcdgame.setShapeByName("lever" + arm + "_2", true);

			// is there cement at bottom of hopper
			var c = this.lcdgame.shapeVisible("cement_hopper" + arm + "_3");
			if (c) {
				// drop cement
				this.lcdgame.setShapeByName("cement_hopper" + arm + "_3", false);
				// check if hopper is full, cancel full warning
				this.checkFullWarning();

				// spill cement to next hopper
				// from hopper 1 to hopper 3
				// from hopper 2 to hopper 4 etc.
				this.doSpillCement(arm+2);
				this.dropcement[arm-1] = ((this.lifttimer.counter-1) % 4);
				this.flowpoint = 1;
				// bottom hoppers, score extra point
				if (arm > 2) {
					this.scorePoints(1);
					// open lever sound effect
					this.lcdgame.playSoundEffect("lever");
				}
			}

			// close lever timeout
			this.levertimer.start(1); // only once
		}
	},

	refreshMiss: function(m) {
		// show "miss" shape
		this.lcdgame.setShapeByName("miss", (m > 0));
		// display misses according to counter
		for (var i = 1; i <= 3; i++) {
			this.lcdgame.setShapeByName("miss_"+i, (m >= i));
		}
	},

	refreshScore: function(s) {
		// device will not display scores over 1000
		// for example 1003 will display as "3" (not "1003" or "003")
		if (s != "") s = (s % 1000);
		this.lcdgame.digitsDisplay("digits", ""+s, true);
	},

	scorePoints: function(pts) {
		// update score
		this.lcdgame.score = this.lcdgame.score + (this.chancetime ? pts*2 : pts);
		// display score
		this.refreshScore(this.lcdgame.score);

		// pass 300 for bonus
		if ( (this.lcdgame.score-pts < 300) && (this.lcdgame.score >= 300) ) {

			// score >300 occurs during normal game
			this.waittimer.pause();
			this.lifttimer.pause();
			this.bucktimer.pause();
			this.warntimer.pause();

			// set this.waitmode to STATE_NONE, so it diables button input
			this.waitmode = STATE_NONE;
			this.bonustimer.start(9);
		}
	},

	doWait: function(code) {

		// stop all timers
		this.lifttimer.pause();
		this.bucktimer.pause();
		this.warntimer.pause();
		this.waittimer.pause();

		// cancel chance time
		if (this.chancetime) {
			this.chancetimer.pause();
			this.chancetime = false;
			this.scorePoints(0);
		}

		// initiate new game state
		switch(code) {
			case WAIT_LIFT_MISS:
				this.waittimer.interval = 500;
				// add a miss
				this.misses++;

				// sound effect
				this.lcdgame.playSoundEffect("miss_start");

				// can fall from different heights
				this.miss_count = 1; // assume already at top/bottom crushed position
				if ( (this.mariopos > 0) || (this.mariopos < 18) ) {
					if (this.mariopos >=  1) this.miss_count = 5; // top part (longest fall)
					if (this.mariopos >=  3) this.miss_count = 4; // top platform
					if (this.mariopos >=  9) this.miss_count = 3; // bottom platform
					if (this.mariopos >= 15) this.miss_count = 2; // bottom part
				}
				break;
			case WAIT_CEMENT_MISS:
				this.waittimer.interval = 500;
				// add a miss
				this.misses++;

				// display overflow
				this.lcdgame.sequenceSetPos("overflow1", 0, (this.miss_overflow == 1)); // top left
				this.lcdgame.sequenceSetPos("overflow2", 0, (this.miss_overflow == 2)); // top right
				this.lcdgame.sequenceSetPos("overflow1", 1, (this.miss_overflow == 3)); // bottom left
				this.lcdgame.sequenceSetPos("overflow2", 1, (this.miss_overflow == 4)); // bottom right

				// overflow remember just 1 or 2  (left or right)
				this.miss_count = (this.miss_overflow == 1 || this.miss_overflow == 2 ? 2 : 1); // can fall from different heights (top or bottom overflow)
				this.miss_overflow = (this.miss_overflow == 1 || this.miss_overflow == 3 ? 1 : 2);

				// sound effect
				this.lcdgame.playSoundEffect("miss_start");

				this.scorePoints(0);
				break;
			case STATE_GAMEOVER:
				this.waittimer.interval = 1000;
				break;
		}

		// save code for use in onTimerWait
		this.waitmode = code;
		this.waittimer.start();
	},

	onTimerWait: function() {

		// initialise variables
		var t = this.waittimer.counter;

		// do different wait animations
		switch(this.waitmode) {
			case WAIT_LIFT_MISS:
				t = t - this.miss_count;

				// bottom or top, or still falling
				if ( (this.mariopos == 0) || (this.mariopos == 18) ) {
					// at bottom or top
					//blink
					this.lcdgame.sequenceSetPos("mario", this.mariopos, (t % 2 != 0));
				} else {
					// clear mario
					this.lcdgame.sequenceClear("mario");
					// move mario once place down
					this.mariopos = this.mariopos + MoveCollide[this.mariopos].move[1];
					this.lcdgame.sequenceSetPos("mario", this.mariopos, true);
				}

				if (t == 1) {
					// reset flows and empty both top hoppers
					this.doResetCement();
				}

				if (t < 6) {
					// sound effect
					this.lcdgame.playSoundEffect("miss_cont");
				} else if (t == 6) {
					// continue game, display misses
					this.refreshMiss(this.misses);
					// continue game
					if (this.misses < 3) {
						this.continueGame();
					}
				} else {
					// NOTE: highscore pop-up will pause any update/sound so wait a short while between miss refresh and high score check
					if (this.misses >= 3) {
						// no move lives, game over
						this.doGameOver();
					}
				}
				break;

			case WAIT_CEMENT_MISS:
				// etc. depending on how many unlock-bonus points
				t = t - this.miss_count;

				// move overflow spill
				if (t <= 1) {
					this.lcdgame.sequenceShift("overflow" + this.miss_overflow);
				}
				// remove driver
				if (t == 1) {
					this.lcdgame.setShapeByName("driver" + this.miss_overflow, false);
					// reset flows and empty both top hoppers
					this.doResetCement();
				}
				// driver on floor, blink on/off
				if (t >= 1) {
					this.lcdgame.setShapeByName("driver_fall" + this.miss_overflow, ((t % 2) != 0));
				}

				// sound effect or continue game
				if (t < 8) {
					// sound effect
					this.lcdgame.playSoundEffect("miss_cont");
				} else if (t == 8) {
					// display misses
					this.refreshMiss(this.misses);
					// continue game
					if (this.misses < 3) {
						this.continueGame();
					}
				} else if (t > 9) { // wait driver falls=visible
					// NOTE: highscore pop-up will pause any update/sound so wait a short while between miss refresh and high score check
					if (this.misses >= 3) {
						// no move lives, game over
						this.doGameOver();
					}
				}

				break;
			case STATE_GAMEOVER:
				if (this.miss_overflow != 0) {
					// game over due to cement overflow on driver
					this.lcdgame.setShapeByName("driver_fall" + this.miss_overflow, ((t % 2) != 0));
				} else {
					// game over due to fall from lift
					this.lcdgame.sequenceSetPos("mario", this.mariopos, (t % 2 == 0));
				}
				break;
		}
	},

	doSpillCement: function(buck) {
		this.lcdgame.setShapeByName("cement_flow_" + buck, true);
		var i = this.spillcement[buck-1];
		this.spillcement[buck-1] = (this.spillcement[buck-1] | 32); // set 8th bit
	},

	doResetCement: function() {
		// after a miss, reset all spills
		for (var i=1; i <= 6; i++) {
			this.lcdgame.setShapeByName("cement_flow_" + i, false);
			this.spillcement[i-1] = 0;
		}
		// empty both top hoppers
		this.lcdgame.sequenceClear("cement_hopper1");
		this.lcdgame.sequenceClear("cement_hopper2");
	},

	onTimerBonus: function(tmr) {

		// short pause when getting 300 points bonus
		// blink misses (if any), beep and then continue
		var m = (tmr.counter % 2 == 0 ? this.misses : 0);
		this.refreshMiss(m);

		// play sound
		this.lcdgame.playSoundEffect("bonus");

		// on last blink, reset counter
		if (tmr.counter == tmr.max) {
			// continue game
			tmr.pause();

			// if no misses then change time (score doubler)
			if (this.misses == 0) {
				this.chancetime = true;
				this.chancetimer.start();
			}
			// reset misses to 0
			this.misses = 0;

			// continue game
			this.waitmode = STATE_PLAYING;
			this.refreshGameSpeed();
			this.checkFullWarning();
		}
	},

	onTimerChance: function(tmr) {
		// blink score while playing
		var s = (tmr.counter % 2 == 0 ? this.lcdgame.score : "");
		this.refreshScore(s);
	},


	onTimerLift: function() {
		// update lifts
		var t = this.lifttimer.counter-1;

		var n = this.lcdgame.randomInteger(0, 2);
		var onlift = MoveCollide[this.mariopos].lift[0];

		// move lifts, RIGHT SIDE going down
		if (t % 4 == 0) {
			// move lift and sound effect
			this.lcdgame.sequenceShift("lift1");
			this.lcdgame.playSoundEffect("lift");

			// if mario on this lift
			if (onlift == 1) {this.tryMoveMario(DIR_DOWN);}

			// wait period for next lift platform
			this.liftvars.wait1--;
			if (this.liftvars.wait1 <= 0) {
				// new lift appears
				this.lcdgame.sequenceSetFirst("lift1", true);
				// normal (pattern == 0 or 2)
				this.liftvars.wait1 = (this.liftvars.index1 % 2 == 0 ? 3 : 2);
				// semi random lift patern, NOTE: rhythm of left and right lifts is somehow connected
				if (this.liftvars.pattern == 1) this.liftvars.wait1 = 3;
				if (this.liftvars.pattern == 3) this.liftvars.wait1 = 2;
				if (this.liftvars.pattern == 4) this.liftvars.wait1 = 4;

				if (this.liftvars.pattern == 0) this.liftvars.index1++;

				// close semi random lift patern, back to normal pattern
				if (this.liftvars.pattern != 0) {
					this.liftvars.pattern = 0;
				}
			}
		}

		// move lifts, LEFT SIDE going up
		if ((t+2) % 4 == 0) {
			// lift sound effect
			this.lcdgame.sequenceShift("lift2");
			this.lcdgame.playSoundEffect("lift");

			// if mario on this lift
			if (onlift == 2) {this.tryMoveMario(DIR_UP);}

			// wait period for next lift platform
			this.liftvars.wait2--;
			if (this.liftvars.wait2 <= 0) {
				// new lift appears
				this.lcdgame.sequenceSetFirst("lift2", true);

				if (this.liftvars.pattern == 0) {
					// Game A starts with more 4-spaces-on-left and then goes to sort of regular pattern
					if (this.lcdgame.gametype == 1) {
						if (this.liftvars.index2 >= 10) this.liftvars.chancemax = this.liftvars.chances[4];
					}
					// semi random lift patern, NOTE: rhythm of left and right lifts is connected somehow
					var r = this.lcdgame.randomInteger(1, this.liftvars.chancemax);
					if (r < this.liftvars.chances[0]) this.liftvars.pattern = 4; // left lift  -> 4 spaces
					if (r > this.liftvars.chances[1]) this.liftvars.pattern = 1; // left lift  -> 3 spaces
					if (r > this.liftvars.chances[2]) this.liftvars.pattern = 2; // right lift -> 3 spaces
					if (r > this.liftvars.chances[3]) this.liftvars.pattern = 3; // right lift -> 4 spaces
				}

				// normal (pattern == 0 or 2)
				this.liftvars.wait2 = (this.liftvars.index2 % 2 == 0 ? 2 : 3);
				// exceptions
				if (this.liftvars.pattern == 2) this.liftvars.wait2 = 3;
				if (this.liftvars.pattern == 3) this.liftvars.wait2 = 4;
				if (this.liftvars.pattern == 4) this.liftvars.wait2 = 2;

				if (this.liftvars.pattern == 0) this.liftvars.index2++;
			}
		}

		// check all hoppers
		for (var h = 1; h <= 4; h++) {
			// drop cement animation
			var i = this.dropcement[h-1]; // when to drop cement in hoppers, in sync with lift animation frames (top left, top right, bottom left, bottom right)
			if ( (i >= 0) && (i == (t % 4)) ) {
				var b = true;
				// check all cement segment
				for (var s = 3; s > 1; s--) {
					// lower cement segment is not visible, upper is visible
					var shp3 = "cement_hopper" + h + "_" + s;
					var shp2 = "cement_hopper" + h + "_" + (s-1);
					if ( (this.lcdgame.shapeVisible(shp3) == false) && (this.lcdgame.shapeVisible(shp2) == true) ) {
						// drop down
						this.lcdgame.setShapeByName(shp3, true);
						this.lcdgame.setShapeByName(shp2, false);
						// stop animation?
						if (s < 3) b = false;
					}
				}
				// reset animation counter
				if (b) {
					this.dropcement[h-1] = -1;
				}
			}
		}

		// check all spills
		for (var s = 1; s <= 6; s++) {
			// drop cement animation
			var i = this.spillcement[s-1]; // spill cement from one hopper to next, takes longer than lift animation frame but in synch
			// each integer holds spill as bits, shift bits and when bit reaches lowest position then cement goes to next hopper below
			var next = (i & 1);
			i = (i >> 1);

			// check if cement goes to next hopper
			if ( (next) && (s < 5) ) {
				var cem = "cement_hopper" + s + "_1";
				if (this.lcdgame.shapeVisible(cem) == false) {
					this.lcdgame.setShapeByName(cem, true);
					this.dropcement[s-1] = ((this.lifttimer.counter-1) % 4);
					// check if hopper is full
					this.checkFullWarning();
				} else {
					// miss because cement overflow
					this.miss_overflow = s;
					this.doWait(WAIT_CEMENT_MISS);
				}
			}

			// remove spill or spill stays visible because of extra spill
			var shp = "cement_flow_" + s;
			this.lcdgame.setShapeByName(shp, (i != 0));

			this.spillcement[s-1] = i;
		}

		// different pulse sound when on top screen
		//var pls = ((t % 2 == 0) && (this.mariopos > 19) ? "pulse2" : "pulse1");
		//this.lcdgame.playSoundEffect(pls);

		// falling off lift
		if ( (this.mariopos == 0) || (this.mariopos == 18) ) {
			this.doWait(WAIT_LIFT_MISS);
			return;
		}
	},

	checkFullWarning: function() {
		// check all spills
		var full1 = this.lcdgame.sequenceAllVisible("cement_hopper1", true);
		var full2 = this.lcdgame.sequenceAllVisible("cement_hopper2", true);

		// check if should warning should be enabled
		if (full1 || full2) {
			// enable warning sound
			if (!this.warntimer.enabled) this.warntimer.start();
		} else {
			// disable warning sound
			if (this.warntimer.enabled) this.warntimer.pause();
		}
	},

	onTimerBucket: function() {
		// update buckets
		var t = this.bucktimer.counter;

		// move a bucket line
		if (t % 2 == 0) {
			// toggle between 1 or 2
			this.movebucket = (this.movebucket + 1) % 6;
			var b = 2 - (this.movebucket % 2);

			// move buckets 1 or 2
			this.lcdgame.sequenceShift("bucket" + b);
			this.lcdgame.sequenceShift("bucket_fill" + b);
			this.lcdgame.setShapeByName("bucket_hatch"+b+"_1", false); // clear closed hatch op position 3

			// new bucket appears
			if ( (this.movebucket == 0) || (this.movebucket == 3) ) {
				// empty bucket
				this.lcdgame.sequenceSetFirst("bucket" + b, true);

				// determine if bucket is full or empty
				this.bucketvars.index--;
				// next random set of 4 buckets
				if (this.bucketvars.index <= 0) {
					//this.bucketvars.nibble = this.lcdgame.randomInteger(0, 15);

					// fiddle a bit with the chances to get it close to original
					this.bucketvars.nibble = this.lcdgame.randomInteger(1, 15);

					// GAME B fiddle a bit with the chances to get it close to original
					if (this.lcdgame.gametype == 2) {
						if (this.bucketvars.nibble <=  2) this.bucketvars.nibble = 15;
						if (this.bucketvars.nibble <=  7) this.bucketvars.nibble = 11;
						if (this.bucketvars.nibble ==  9) this.bucketvars.nibble = 11;
						if (this.bucketvars.nibble == 13) this.bucketvars.nibble = 8;
					}
					// 'mirror' the nibble, so that most buckets are on the left side
					if (this.bucketvars.nibble ==  1) this.bucketvars.nibble = 2;
					if (this.bucketvars.nibble ==  4) this.bucketvars.nibble = 8;
					if (this.bucketvars.nibble ==  5) this.bucketvars.nibble = 10;
					if (this.bucketvars.nibble == 13) this.bucketvars.nibble = 14;

					this.bucketvars.index = 4;
				}

				var full = 0;
				if ( (this.bucketvars.index == 2) || (this.bucketvars.index == 4)) {
					// bucket 1
					this.bucketvars.bucket1 = ((this.bucketvars.nibble >> (this.bucketvars.index-1-this.bucketvars.pref)) & 1);
					full = this.bucketvars.bucket1;
					this.bucketvars.count = this.bucketvars.count - this.bucketvars.bucket1;
				} else {
					// bucket 2
					this.bucketvars.bucket2 = ((this.bucketvars.nibble >> (this.bucketvars.index-1+this.bucketvars.pref)) & 1);
					full = this.bucketvars.bucket2;
					this.bucketvars.count = this.bucketvars.count - this.bucketvars.bucket2;
				}

				// set full or empty
				this.lcdgame.sequenceSetFirst("bucket_fill" + b, (full != 0));

				// preference full bucket shifts over time from left to right
				if (this.bucketvars.count <= 0) {
					this.bucketvars.pref = 1 - this.bucketvars.pref; // toggle between 0 and 1
					this.bucketvars.count = this.lcdgame.randomInteger(16, 32);
				}
			}
		}

		// dump cement animation
		var b = 0;
		if (this.lcdgame.shapeVisible("bucket1_3")) b = 1;
		if (this.lcdgame.shapeVisible("bucket2_3")) b = 2;
		if (b > 0) {
			// animate bucket 1 or 2
			var a = t + (b == 1 ? 2 : 0);
			a = a % 4; // a = 0..3
			var h = ( (a == 0) || (a == 3) );
			this.lcdgame.setShapeByName("bucket_hatch"+b+"_1", h);
			this.lcdgame.setShapeByName("bucket_hatch"+b+"_2", !h);

			// spill cement from bucket into hopper
			var f = "bucket_fill" + b + "_3";
			if ( (a == 2) && (this.lcdgame.shapeVisible(f)) ) {
				// remove cement from bucket
				this.lcdgame.setShapeByName(f, false);

				// spill cement to next hopper
				this.doSpillCement(b);
			}
		}
	},

	onTimerLever: function() {
		// reset any arm
		var arm = MoveCollide[this.mariopos].move[4];
		if (arm > 0) {
			this.lcdgame.setShapeByName("arm"+arm+"_1", true);
			this.lcdgame.setShapeByName("arm"+arm+"_2", false);
		}

		// close hatch
		this.lcdgame.setShapeByName("hatch" + this.valveopen + "_1", true);
		this.lcdgame.setShapeByName("hatch" + this.valveopen + "_2", false);

		// close lever
		this.lcdgame.setShapeByName("lever" + this.valveopen + "_1", true);
		this.lcdgame.setShapeByName("lever" + this.valveopen + "_2", false);

		// score point and sound, only if cement flows
		if (this.flowpoint > 0) {
			this.scorePoints(1);
			this.flowpoint = 0;
			// close lever sound effect
			this.lcdgame.playSoundEffect("lever");
		}
	},

	onTimerWarning: function() {
		this.lcdgame.playSoundEffect("lever");
	},

	doGameOver: function() {
		this.waittimer.pause();
		// game over, check for highscore
		this.lcdgame.highscores.checkScore();
		// NOTE: highscore pop-up will pause any update/sound so wait a short while between game over sound and high score check
		this.doWait(STATE_GAMEOVER);
	}
};
