// Jungle Kong LCD game simulation
// Bas de Reuver (c)2018

var junglekong = {};

// constants
var STATE_NONE = 0;
var STATE_PLAYING = 1;
var WAIT_LOSEANIM = 2;
var WAIT_BRIDGE = 3;
var WAIT_WINANIM = 4;
var STATE_GAMEOVER = 5;

var DIR_NONE = 0;
var DIR_UP = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 4;
var DIR_RIGHT = 8;


// note: it's easier for each guy position to put all valid moves and potential collisions in a look-up array
// than it is to programmatically determine where the guy can move and which collisions to check, that would become needlessly complex.
// Each array item is a hunter guy position, which are valid moves and move how many steps in this array, and which shapes are potential collisions.
//                           up down left right                    left        right  collide/jump-over
var MoveCollide = [
	{"move":[ 0,   0,  +1,    0], "collide":[         "",          ""] }, // out-of-screen invisible, press left to start
	{"move":[+1,   0,  +2,    0], "collide":["barrel_17",          ""] }, // first walk position, bottom row (guy_01..08)
	{"move":[ 0,   0,   0,    0], "collide":[         "",          ""] }, // jump position
	{"move":[ 0,   0,  +1,   -2], "collide":["barrel_16", "barrel_17"] }, // walk position
	{"move":[+1,   0,  +2,   -1], "collide":["barrel_15", "barrel_16"] }, // walk position
	{"move":[ 0,   0,   0,    0], "collide":[         "",          ""] }, // jump position
	{"move":[+1,   0,  +2,   -2], "collide":["barrel_14", "barrel_15"] }, // etc.
	{"move":[ 0,   0,   0,    0], "collide":[         "",          ""] },
	{"move":[+1,   0,   0,   -2], "collide":["barrel_13", "barrel_14"] },

	{"move":[ 0,  -1,   0,   +1], "collide":[         "", "barrel_10"] }, // middle row (guy_09..15)
	{"move":[+1,   0,  -1,   +2], "collide":["barrel_10", "barrel_09"] },
	{"move":[ 0,   0,   0,    0], "collide":[         "",    "bird_4"] },
	{"move":[ 0,   0,  -2,   +1], "collide":["barrel_09", "barrel_08"] },
	{"move":[+1,   0,  -1,   +2], "collide":["barrel_08", "barrel_07"] },
	{"move":[ 0,   0,   0,    0], "collide":[         "",    "bird_2"] },
	{"move":[+1,   0,  -2,    0], "collide":["barrel_07", "barrel_06"] },

	{"move":[ 0,  -1,  +1,    0], "collide":["barrel_04",          ""] }, // top row (guy_16..19)
	{"move":[+1,   0,  +2,   -1], "collide":["barrel_03", "barrel_04"] },
	{"move":[ 0,   0,   0,    0], "collide":[         "",          ""] },
	{"move":[+1,   0,   0,   -2], "collide":["barrel_02", "barrel_03"] },

	{"move":[ 0,  -1,   0,    0], "collide":[         "",          ""] }  // final position
];

// =============================================================================
// clock state
// =============================================================================
junglekong.ClockMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.demotimer = null;

	this.demoguypos;
	this.demobridge;
};
junglekong.ClockMode.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		this.demotimer = this.lcdgame.addtimer(this, this.onTimerDemo, 1000, false);

		// start demo mode
		this.demotimer.start();
	},

	update: function() {
		// nothing yet, TODO make optional so library doesn't crash
	},

	press: function(btn) {
		// show highscore before starting game
		if (btn == "mode") {
			this.lcdgame.state.start("select");
		}
	},

	release: function(btn) {
		// nothing yet, TODO make optional so library doesn't crash
	},

	close: function() {
		// nothing yet, TODO make optional so library doesn't crash
	},

	onTimerDemo: function() {
		// update clock
		this.updateclock();

		// update demo animation
		this.updateDemo();

		// show all bridge parts
		this.lcdgame.sequenceClear("bridge", true);

		this.lcdgame.setShapeByName("gorilla_1", true);
		this.lcdgame.setShapeByName("gorilla_arm1_1", true);
		this.lcdgame.setShapeByName("guy_01", true);
	},

	updateDemo: function() {
		// update moving enemies
		var t = this.demotimer.counter;

		// move the barrels
		this.lcdgame.sequenceShift("barrel");

		// random new barrels
		var i = this.lcdgame.randomInteger(0, 5);
		if (i == 0) this.lcdgame.setShapeByName("barrel_01", true);
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
			this.lcdgame.setShapeByName("time_pm", true);
		} else {
			if (ihours == 0) ihours = 12; // weird AM/PM time rule
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
// game select state
// =============================================================================
junglekong.SelectMode = function(lcdgame) {
	this.lcdgame = lcdgame;
};
junglekong.SelectMode.prototype = {
	init: function() {
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		// show all bridge parts
		this.lcdgame.sequenceClear("bridge", true);

		// always start with these barrels
		this.lcdgame.setShapeByName("barrel_02", true);
		this.lcdgame.setShapeByName("barrel_09", true);
		this.lcdgame.setShapeByName("barrel_14", true);

		this.lcdgame.setShapeByName("gorilla_2", true);
		this.lcdgame.setShapeByName("gorilla_arm2_2", true);

		// show all lives
		this.lcdgame.sequenceClear("lives", true);

		this.lcdgame.digitsDisplay("digits", "0", true);

		this.lcdgame.gametype = 1; // 1=game a, 2=game b
		this.lcdgame.setShapeByName("game_a", true);
		this.lcdgame.setShapeByName("game_b", false);
	},

	update: function() {
		// nothing yet, TODO make optional so library doesn't crash
	},

	press: function(btn, idx) {
		// press left or right to select Game A or Game B
		if ( (btn == "dpad") && ( (idx == 2) || (idx == 3) ) ) { // dpad 2=left 3=right
			// show highscore before when selecting game A or game B
			var gameA = (idx == 2);
			this.lcdgame.gametype = (gameA ? 1 : 2); // 1=game a, 2=game b
			this.lcdgame.setShapeByName("game_a", gameA);
			this.lcdgame.setShapeByName("game_b", !gameA);
			// show highscore
			var sc = this.lcdgame.highscores.getHighscore(this.lcdgame.gametype);
			this.lcdgame.digitsDisplay("digits", ""+sc, true);
		}
		// start button
		if (btn == "start") {
			this.lcdgame.level = 0; // new game
			this.lcdgame.state.start("maingame");
		}
		// back to clock mode
		if (btn == "mode") {
			this.lcdgame.state.start("clock");
		}
	},

	release: function(btn) {
		// release dpad, highscore disappears, display just "0"
		if (btn == "dpad") {
			this.lcdgame.digitsDisplay("digits", "0", true);
		}
	},

	close: function() {
		// nothing yet, TODO make optional so library doesn't crash
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
			// barrels
			this.lcdgame.sequenceShift("barrel");
		} else {
			// bird
			this.lcdgame.sequenceShift("bird");
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
			this.lcdgame.setShapeByName("time_pm", true);
		} else {
			if (ihours == 0) ihours = 12; // weird AM/PM time rule
			this.lcdgame.setShapeByName("time_pm", false);
		}
		// format hour and minute
		var strtime = ("  "+ihours).substr(-2) + ("00"+imin).substr(-2);

		// clock time colon
		this.lcdgame.setShapeByName("time_colon", (this.demotimer.counter % 2 == 0));

		// display time
		this.lcdgame.digitsDisplay("digits", strtime, false);
	}
};

// =============================================================================
// game state
// =============================================================================
junglekong.MainGame = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.gametimer = null;
	this.jumptimer = null;
	this.sectimer = null;
	this.waittimer = null;
	this.pushtimer = null;
	this.blinktimer = null;

	this.guypos;
	this.jumping;
	this.jumpover;
	this.blinkshape;

	this.tempbarrel;

	this.gorillapos;
	this.gorillawait;
	this.gorillathrow; // true=throw, false=move

	this.lives;
	this.bridge;
	this.vines;
	this.birdpos;

	this.waitmode;  // waittimer, type of pause
};
junglekong.MainGame.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		this.gametimer = this.lcdgame.addtimer(this, this.onTimerGame,  820, true);
		this.jumptimer = this.lcdgame.addtimer(this, this.onTimerJump,  820, true); // jump timeing is 0.9 of barrel timing

		this.sectimer = this.lcdgame.addtimer(this, this.onTimerSecond, 1000, false); // fixed at 1 seconds, birds always appears after 10 seconds
		this.waittimer = this.lcdgame.addtimer(this, this.onTimerWait,  100, false); // death animation, defeat gorilla animation
		this.pushtimer = this.lcdgame.addtimer(this, this.onTimerPush, 5000, true); // push player into game

		this.blinktimer = this.lcdgame.addtimer(this, this.onTimerBlink,  250, false);

		// start new game
		this.newGame();
	},

	// start a new game, reset score level etc.
	newGame: function() {
		// stop any other state
		this.lcdgame.shapesDisplayAll(false);

		// reset game specific variables
		this.lcdgame.gameReset(this.lcdgame.gametype);

		// reset all lives
		this.lives = 3;
		this.refreshLives();
		this.vines = [false, false, false];

		// show "game b" or "game b"
		var gametxt = (this.lcdgame.gametype == 1 ? "game_a" : "game_b");
		this.lcdgame.setShapeByName(gametxt, true);

		// always start with these barrels
		this.lcdgame.setShapeByName("barrel_02", true);
		this.lcdgame.setShapeByName("barrel_09", true);
		this.lcdgame.setShapeByName("barrel_14", true);

		this.guypos = 0;

		this.gorillapos = 2;
		this.gorillawait = 0;
		this.gorillathrow = 1; // 2=throw, 0=move

		// start first level
		this.nextLevel();
	},

	// go to next level, possibly after cutscene
	nextLevel: function() {

		// next level
		this.lcdgame.level++;

		// reset bridge
		this.bridge = 3;

		// reset score, positions etc.
		this.continueGame();
	},

	// continue at start of game, new level or after a miss
	continueGame: function() {
		// reset variables
		this.jumping = 0;
		this.jumpover = "";
		this.birdpos = -1; // birds only appear in Game B
		this.scorePoints(0);

		// refresh bridge
		this.lcdgame.setShapeByName("bridge_1", true);
		this.lcdgame.setShapeByName("bridge_2", true);
		this.lcdgame.setShapeByName("bridge_3", (this.bridge > 1));
		this.lcdgame.setShapeByName("bridge_4", (this.bridge > 2));

		// display gorilla
		this.refreshGorilla();

		// reset guy pos
		this.lcdgame.sequenceClear("guy");
		if (this.guypos == 0) {
			// off screen
			this.pushtimer.start(1);
		} else {
			this.lcdgame.setShapeByName("guy_01", true);
			this.lcdgame.setShapeByName("barrel_17", false); // clear last barrel so player doesn't run into it immediately
			// sound effect
			this.lcdgame.playSoundEffect("move");
		}

		// reset timers
		this.waittimer.pause();
		this.waitmode = STATE_PLAYING;

		// Set game speed according to current level
		// NOTE: Formula below is an as-good-as-possible educated guess, based on many video-frame measurements
		var msecs = 820 - ((this.lcdgame.level-1) * 15); // ms lower is faster speed

		// limit max.speed. NOTE: not verified so not sure that this limit was also on actual device
		//if (msecs < 62.5) {msecs = 62.5};

		this.gametimer.interval = msecs;
		this.gametimer.start();
		this.sectimer.start();
	},


	update: function() {
		// nothing yet, TODO make optional so library doesn't crash
	},

	press: function(btn, idx) {

		// playing game
		if (this.waitmode == STATE_PLAYING) {
			if (btn == "dpad") {
				// up
				if (idx == 0) {
					this.tryMoveGuy(DIR_UP);
				}
				// down
				if (idx == 1) {
					this.tryMoveGuy(DIR_DOWN);
				}
				// left
				if (idx == 2) {
					this.tryMoveGuy(DIR_LEFT);
				}
				// right
				if (idx == 3) {
					this.tryMoveGuy(DIR_RIGHT);
				}
			}
		}

		// game over, do not reset screen only move Game A or Game B
		if (this.waitmode == STATE_GAMEOVER) {

			if ( (btn == "dpad") && ( (idx == 2) || (idx == 3) ) ) { // dpad 2=left 3=right
				// show highscore before when selecting game A or game B
				var gamtyp = (idx == 2 ? 1 : 2); // 1=game a, 2=game b
				this.lcdgame.gametype = gamtyp;
				this.lcdgame.setShapeByName("game_a", (gamtyp == 1));
				this.lcdgame.setShapeByName("game_b", !(gamtyp == 1));
				// show highscore
				var sc = this.lcdgame.highscores.getHighscore(this.lcdgame.gametype);
				this.lcdgame.digitsDisplay("digits", ""+sc, true);
			}

			// start button
			if (btn == "start") {
				this.lcdgame.level = 0; // new game
				this.lcdgame.state.start("maingame");
			}
			// mode button
			if (btn == "mode") {
				this.lcdgame.state.start("clock");
			}
		}
	},

	release: function(btn) {
		// after game over, release gamea/gameb to start game
		if (this.waitmode == STATE_GAMEOVER) {
			if ( (btn == "dpad") && ( (idx == 2) || (idx == 3) ) ) { // dpad 2=left 3=right
				// show highscore before when selecting game A or game B
				var gamtyp = (idx == 2 ? 1 : 2); // 1=game a, 2=game b
				this.lcdgame.gametype = gamtyp;
				this.lcdgame.setShapeByName("game_a", (gamtyp == 1));
				this.lcdgame.setShapeByName("game_b", !(gamtyp == 1));
				// show last score
				var sc = this.lcdgame.highscores.getHighscore(this.lcdgame.gametype);
				this.lcdgame.digitsDisplay("digits", ""+sc, true);
			}

			if ( (btn == "gamea") || (btn == "gameb") ) {
				//this.lcdgame.setShapeByName("time_colon", false);
				// show highscore
				var sc = this.lcdgame.highscores.getHighscore((btn == "gamea" ? 1 : 2));
				//this.lcdgame.digitsDisplay("digits", ""+sc, true);
			}

			if ( (btn == "gamea") || (btn == "gameb") ) {
				this.lcdgame.level = 0; // new game
				this.lcdgame.gametype = (btn == "gamea" ? 1 : 2); // 1=game a, 2=game b
				this.lcdgame.state.start("maingame"); //restart
			}
		}
	},

	close: function() {
	},

	tryMoveGuy: function(dir) {
		// initialise move position
		var move = 0;
		var coll = "";

		if (dir == DIR_LEFT) {
			// move left
			move = MoveCollide[this.guypos].move[2];
			coll = MoveCollide[this.guypos].collide[0];
			// when entering guy into game -> lose one life
			if (this.guypos == 0) {
				this.lives--;
				this.refreshLives();
			}
		}
		if (dir == DIR_RIGHT) {
			move = MoveCollide[this.guypos].move[3];
			coll = MoveCollide[this.guypos].collide[1];
		}
		if (dir == DIR_UP) {
			move = MoveCollide[this.guypos].move[0];
			// vine is not visible on position to climb, then cancel move
			if ( (this.guypos ==  8) && (!this.vines[0]) ) move = 0;
			if ( (this.guypos == 15) && (!this.vines[1]) ) move = 0;
			if ( (this.guypos == 19) && (!this.vines[2]) ) move = 0;
		}
		if (dir == DIR_DOWN) {
			move = MoveCollide[this.guypos].move[1];
			// vine is not visible on position to climb, then cancel move
			if ( (this.guypos ==  9) && (!this.vines[0]) ) move = 0;
			if ( (this.guypos == 16) && (!this.vines[1]) ) move = 0;
			if ( (this.guypos == 20) && (!this.vines[2]) ) move = 0;
		}

		// check collisions by moving into enemy
		if ( (move != 0) && (coll != "") ) {
			var hit = this.lcdgame.shapeVisible(coll);
			// collision
			if (hit) {
				this.doWait(WAIT_LOSEANIM);
				return;
			}
		}

		// update or not
		if (move != 0) {
			// sound effect
			this.lcdgame.playSoundEffect("move");

			this.guypos = this.guypos + move;
			this.lcdgame.sequenceClear("guy");
			this.lcdgame.sequenceSetPos("guy", this.guypos-1, true);

			// jumping is when move up and cannot move down by pressing down (=vine positions)
			// if UP position doesn't have a "can move down with dpad" value, then fall down from that position, else jump into next level but don't fall (same as moving)
			this.jumping = ( (dir == DIR_UP) && (MoveCollide[this.guypos].move[1] == 0) );
			this.jumpover = "";

			// jumping
			if (this.jumping) {

				// check collision with birds
				var coll = MoveCollide[this.guypos].collide[1];
				// check any collision
				if (coll != "") {
					if (this.lcdgame.shapeVisible(coll)) {
						this.doWait(WAIT_LOSEANIM);
						return;
					}
				}

				// check if jumping over barrel
				var i = ( (this.guypos >= 9) && (this.guypos <= 15) ? 1 : 0); // exception middle platform, jump over right-barrels instead of left-barrels
				coll = MoveCollide[this.guypos-1].collide[i];
				if (this.lcdgame.shapeVisible(coll)) {
					this.jumpover = coll;
				}

				// jump durationg is 90% of barrel speed duration
				this.jumptimer.interval = 0.9 * this.gametimer.interval;
				this.jumptimer.start(1);
			}
		} else {
			// exception; move left on top position to pick-axe the bridge
			if (dir == DIR_LEFT) {
				// top rope positions
				if (this.guypos == 20) {
					this.bridge--;
					this.doWait(WAIT_BRIDGE);
				}
			}
		}
	},

	refreshLives: function() {
		this.lcdgame.setShapeByName("life_1", (this.lives >= 1));
		this.lcdgame.setShapeByName("life_2", (this.lives >= 2));
		this.lcdgame.setShapeByName("life_3", (this.lives >= 3));
	},

	refreshGorilla: function() {
		// current gorilla position
		this.lcdgame.setShapeByName("gorilla_1", (this.gorillapos == 1));
		this.lcdgame.setShapeByName("gorilla_2", (this.gorillapos == 2));
		this.lcdgame.setShapeByName("gorilla_arm1_1", ( (this.gorillapos == 1) && (this.gorillathrow != 1)));
		this.lcdgame.setShapeByName("gorilla_arm1_2", ( (this.gorillapos == 1) && (this.gorillathrow == 1)));
		this.lcdgame.setShapeByName("gorilla_arm2_1", ( (this.gorillapos == 2) && (this.gorillathrow != 1)));
		this.lcdgame.setShapeByName("gorilla_arm2_2", ( (this.gorillapos == 2) && (this.gorillathrow == 1)));
	},

	refreshScore: function(s) {
		// device will not display scores over 1000
		// for example 1003 will display as "3" (not "1003" or "003")
		if (s != "") s = (s % 1000);
		this.lcdgame.digitsDisplay("digits", ""+s, true);
	},

	scorePoints: function(pts) {
		// update score
		this.lcdgame.score = this.lcdgame.score + pts;

		// display score
		this.refreshScore(this.lcdgame.score);
	},

	doWait: function(code) {

		// pause game timers
		this.gametimer.pause();
		this.sectimer.pause();

		// which pause mode
		switch(code) {
			case WAIT_LOSEANIM:
				this.waittimer.interval = 100;

				this.blinkshape = "guy_" + ("0" + this.guypos).slice(-2);
				this.blinktimer.start();

				break;
			case WAIT_BRIDGE:
				// axe the bridge, 10 bonus points and short pause
				this.waittimer.interval = 100;
				this.lcdgame.setShapeByName("guy_axe", true);
				this.scorePoints(10);

				break;
			case WAIT_WINANIM:

				this.waittimer.interval = 100;

				break;
		}

		this.waitmode = code;

		this.gametimer.pause();
		this.waittimer.start();
	},

	onTimerBlink: function() {
		var t = (this.blinktimer.counter % 2 == 0 ? true : false);
		this.lcdgame.setShapeByName(this.blinkshape, t);
	},

	onTimerWait: function() {

		// initialise variables
		var t = this.waittimer.counter;
		var waitover = false;

		// do different wait animations
		switch(this.waitmode) {
			case WAIT_LOSEANIM:
				t = t - 1;

				// 0ms lose sound effect
				if (t == 0) {
					this.lcdgame.playSoundEffect("guyhit");
				}

				// continue game
				if (t >= 23) {
					if (this.lives >= 1) {
						this.blinktimer.pause();
						this.guypos = 0; // start offscreen
						this.continueGame();
					} else {
						// no move lives, game over state and highscore
						// NOTE: highscore pop-up will pause any update/sound so wait a short while between game over sound and high score check
						this.waitmode = STATE_GAMEOVER;
						this.waittimer.pause();
						this.blinktimer.pause();
						// game over, check for highscore
						this.lcdgame.highscores.checkScore();
					}
				}
				break;

			case WAIT_BRIDGE:
				//  more bridge parts    -> wait 3,3 sec before restarting
				//  no bridge parts left -> wait 2,7 sec before going to win animation
				t = t - 1;

				// 0ms lose sound effect
				if (t == 0) {
					this.lcdgame.playSoundEffect("win");
				}

				if (this.bridge > 0) {
					// wait before restarting
					if (t >= 33) {
						this.waitmode = STATE_PLAYING;
						this.waittimer.pause();
						this.guypos = 1; // first pos
						this.continueGame();
					}
				} else {
					// wait before goin to win anim
					if (t >= 27) {
						this.doWait(WAIT_WINANIM);
					}
				}
				break;
			case WAIT_WINANIM:
				// bridge blinking
				if (t == 1) {
					// remove bridge and axe
					this.lcdgame.setShapeByName("bridge_2", false);
					this.lcdgame.setShapeByName("guy_axe", false);

					// bridge blinking
					this.blinkshape = "bridge_1";
					this.blinktimer.start();
				}
				// after 3 seconds remove bridge and show falling gorilla
				if (t == 30) {

					// glitch on original device? when showing falling gorilla, first 2 barrels shapes become temporarily invisible
					this.tempbarrel0 = this.lcdgame.shapeVisible("barrel_00");
					this.tempbarrel1 = this.lcdgame.shapeVisible("barrel_01");
					this.lcdgame.setShapeByName("barrel_00", false);
					this.lcdgame.setShapeByName("barrel_01", false);

					// score 10 bonus points
					this.scorePoints(10);

					// remove gorilla and bridge
					this.lcdgame.sequenceClear("bridge");
					this.lcdgame.sequenceClear("gorilla");

					this.blinkshape = "gorilla_3";
					this.blinktimer.start();
				}
				// after 6 seconds remove falling gorilla
				if (t == 60) {
					// falling gorilla invisible
					this.blinktimer.pause();
					this.lcdgame.setShapeByName("gorilla_3", false);
				}
				// after 7 seconds continue game
				if (t == 70) {
					// reset temp first barrels
					this.lcdgame.setShapeByName("barrel_00", this.tempbarrel0);
					this.lcdgame.setShapeByName("barrel_01", this.tempbarrel1);

					// reset bridge and continue
					this.bridge = 3;
					this.guypos = 1; // first pos
					this.nextLevel();
				}

				break;
		}

		// wait is over, continue game
		if (waitover) {
			this.waitmode = STATE_PLAYING;
			this.waittimer.pause();
			this.gametimer.unpause();
		}
	},

	onTimerPush: function() {
		// idle time out; if player does nothing, push guy into the game
		this.pushtimer.pause();
		if (this.guypos == 0) {
			this.tryMoveGuy(DIR_LEFT);
		}
	},

	onTimerSecond: function() {

		// Note : vines are fixed at 3 seconds, birds fixed at 1 second, appear every 10 seconds, no matter speed of barrels or level
		var t = this.sectimer.counter;
		if ((t % 3) == 0) {
			// update random vines
			var i = this.lcdgame.randomInteger(0, 7);
			this.vines[0] = ((i & 1) != 0); // bottom
			this.vines[1] = ((i & 2) != 0);
			this.vines[2] = ((i & 4) != 0); // top

			// set vines visible
			this.lcdgame.setShapeByName("vine_1", this.vines[0]);
			this.lcdgame.setShapeByName("vine_2", this.vines[1]);
			this.lcdgame.setShapeByName("vine_3", this.vines[2]);

			// every 3 seconds, slightly speed up the game
			// (speed increase on actual device might possibly be linked to climbing up a vine, but not sure)
			this.gametimer.interval = this.gametimer.interval - 4;
		}

		// Game B, also make birds appear
		if (this.lcdgame.gametype == 2) {
			// fixed at 1 seconds, birds always appears after 10 seconds
			this.birdpos++;
			if (this.birdpos > 10) {
				this.birdpos = 0;
			}

			// move bird visible
			this.lcdgame.sequenceClear("bird");
			if (this.birdpos < 4) {
				var frm = "bird_" + (this.birdpos + 1);
				this.lcdgame.setShapeByName(frm, true);
				// hit by bird while jumping
				if (this.guypos > 0) {
					if (frm == MoveCollide[this.guypos].collide[1]) {
						this.doWait(WAIT_LOSEANIM);
						return;
					}
				}
			}
		}
	},

	onTimerJump: function() {
		// not hit while jumping
		if (this.waitmode == STATE_PLAYING) {
			// guy falls down again
			this.guypos--;
			this.lcdgame.sequenceClear("guy");
			this.lcdgame.sequenceSetPos("guy", this.guypos-1, true);
		}
	},

	onTimerGame: function() {
		// update moving enemies
		var t = this.gametimer.counter;

		// pulse sound
		this.lcdgame.playSoundEffect("barrel");

		// update moving enemies and check collisions
		var hit       = false;
		var collLeft  = MoveCollide[this.guypos].collide[0];
		var collRight = MoveCollide[this.guypos].collide[1];

		// exception middle platform, swith, treat as if
		if ( (this.guypos >= 9) && (this.guypos <= 15) ) {
			var tmp = collLeft;
			collLeft = collRight;
			collRight = tmp;
		}

		// check collisions with barrel or bird
		if (collLeft != "") {
			// collision
			if (this.lcdgame.shapeVisible(collLeft)) {
				this.doWait(WAIT_LOSEANIM);
				return;
			}
		}

		// jumping over a barrel
		if ( (this.jumping) && (this.jumpover != "") ) {
			if (this.lcdgame.shapeVisible(this.jumpover)) {
				// on bottom platform it's 1 points, higher platform is 2 points
				var pnt = (this.guypos >= 9 ? 2 : 1);
				this.scorePoints(pnt);
			}
		}

		// exception; barrel pos=0, skips straight down to pos=12
		if (this.lcdgame.shapeVisible("barrel_00")) {
			this.lcdgame.setShapeByName("barrel_00", false);
			this.lcdgame.setShapeByName("barrel_11", true); // sequenceShift will set it to 12
		}
		// move barrels
		this.lcdgame.sequenceShift("barrel");

		// wait for next gorilla move or throw
		if (this.gorillawait > 0) {
			this.gorillawait--;
		} else {
			// gorilla moves or throws
			if (this.gorillathrow == 2) {
				// throws arms up
				this.gorillathrow = 1;
			} else {
				if (this.gorillathrow == 1) {
					// throws arms down barrel falls
					this.gorillathrow = 0;
					// throw barrel
					// gorilla on left  = throw left move straigh down = barrel_00
					// gorilla on right = throw left move straigh down = barrel_01
					var b = this.gorillapos - 1; // 0 or 1
					this.lcdgame.setShapeByName("barrel_0"+b, true);
				} else {
					// move gorilla
					this.gorillapos = 3 - this.gorillapos; // toggle 1..2
				}
				// determine next step; how long to wait and then throw or move
				var r = this.lcdgame.randomInteger(0, 7);
				this.gorillawait = (r & 3); // b0011 = wait 0..3 ticks
				this.gorillathrow = ((r & 4) == 0 ? 0 : 2); // b0100 => 2 or 0 = throw or move
			}
			// display correct gorilla
			this.refreshGorilla();
		}
	}
};
