// Donkey Kong 2 LCD game simulation
// Bas de Reuver (c)2018

var donkeykong2 = {};

// constants
var STATE_NONE = 0;
var STATE_PLAYING = 1;
var WAIT_STARTANIM = 2; // mario+dk+chain appear
var WAIT_LOSEANIM = 3;
var WAIT_MOVEKEY1 = 4;
var WAIT_MOVEKEY2 = 5;
var WAIT_LOCKANIM = 6;
var WAIT_WINANIM1 = 7; // climb down
var WAIT_WINANIM2 = 8; // catch Donkey Kong, add points
var STATE_GAMEOVER = 9;

var DIR_NONE = 0;
var DIR_UP = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 4;
var DIR_RIGHT = 8;
var DIR_JUMP = 16;

// note: it's easier for each DkJr position to put all valid moves and potential collisions in a look-up array
// than it is to programmatically determine where DkJr can move and which collisions to check, that would become needlessly complex.
// Each array item is a DkJr position, which are valid moves and move how many steps in this array, and which shapes are potential collisions.
//                           up down left right jump                      up        down       left        right  jump-over
var MoveCollide = [
	{"move":[+1,   0,   0,    0,   0], "collide":[        "",         "",         "",         "",         ""], }, // lives position, below play area
	{"move":[ 0,   0,   0,   +2,  +1], "collide":[        "",         "",         "", "croc1_06",         ""], }, // bottom row (dkjr_02..11)
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark1_2",         "",         "",         "", "croc1_06"], }, //   jump position
	{"move":[ 0,   0,  -2,   +2,  +1], "collide":[        "",         "", "croc1_06", "croc1_05",         ""], }, //   one step to right
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark1_3",         "",         "",         "", "croc1_05"], }, //   jump position
	{"move":[ 0,   0,  -2,   +2,  +1], "collide":[        "",         "", "croc1_05", "croc1_04",         ""], }, //   one step to right
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark1_4",         "",         "",         "", "croc1_04"], }, //   etc.
	{"move":[ 0,   0,  -2,   +2,  +1], "collide":[        "",         "", "croc1_04", "croc1_03",         ""], },
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark1_5",         "",         "",         "", "croc1_03"], },
	{"move":[ 0,   0,  -2,    0,  +1], "collide":[        "",         "", "croc1_03", "croc1_02",         ""], },
	{"move":[+1,  -1,   0,    0,   0], "collide":["spark1_6",         "",         "",         "", "croc1_02"], },
	{"move":[ 0,  -1,  +1,    0,   0], "collide":[        "",         "", "spark1_6",         "",         ""], }, // middle row (dkjr_12..20)
	{"move":[ 0,   0,  +2,   -1,  +1], "collide":[        "",         "", "spark1_5", "spark1_6",         ""], },
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark2_2",         "",         "",         "", "spark1_5"], },
	{"move":[ 0,   0,  +2,   -2,  +1], "collide":[        "",         "", "spark1_4", "spark1_5",         ""], },
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark2_3",         "",         "",         "", "spark1_4"], },
	{"move":[ 0,   0,  +2,   -2,  +1], "collide":[        "",         "", "spark1_3", "spark1_4",         ""], },
	{"move":[ 0,   0,   0,    0,   0], "collide":["spark2_4",         "",         "",         "", "spark1_3"], },
	{"move":[ 0,   0,   0,   -2,  +1], "collide":[        "",         "", "spark1_2", "spark1_3",         ""], },
	{"move":[+1,  -1,   0,    0,   0], "collide":["spark2_5",         "",         "",         "",         ""], },
	{"move":[ 0,  -1,   0,   +2,  +1], "collide":[        "",         "",         "",  "croc2_6",         ""], }, // top row (dkjr_21..38)
	{"move":[ 0,   0,   0,    0,   0], "collide":[        "",         "",         "",         "",  "croc2_6"], },
	{"move":[ 0,   0,  -2,   +4,  +1], "collide":[        "",         "",  "croc2_6",  "croc2_5",         ""], }, // below rope 1 (left-most)
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",  "bird3_1",         "",         ""], },
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",         "",  "bird2_4",         ""], },
	{"move":[ 0,  -1,   0,    0,   0], "collide":[        "",         "",  "bird1_2",         "",         ""], },
	{"move":[ 0,   0,  -4,   +4,  +1], "collide":[        "",         "",  "croc2_5",  "croc2_4",         ""], }, // below rope 2
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",  "bird3_2",         "",         ""], },
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",         "",  "bird2_3",         ""], },
	{"move":[ 0,  -1,   0,    0,   0], "collide":[        "",         "",  "bird1_3",         "",         ""], },
	{"move":[ 0,   0,  -4,   +4,  +1], "collide":[        "",         "",  "croc2_4",  "croc2_3",         ""], }, // below rope 3
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",  "bird3_3",         "",         ""], },
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",         "",  "bird2_2",         ""], },
	{"move":[ 0,  -1,   0,    0,   0], "collide":[        "",         "",  "bird1_4",         "",         ""], },
	{"move":[ 0,   0,  -4,    0,  +1], "collide":[        "",         "",  "croc2_3",  "croc2_2",         ""], }, // below rope 4 (right-most)
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",  "bird3_4",         "",         ""], },
	{"move":[+1,  -1,   0,    0,   0], "collide":[        "",         "",         "",  "bird2_1",         ""], },
	{"move":[ 0,  -1,   0,    0,   0], "collide":[        "",         "",  "bird1_5",         "",         ""], }
];

// =============================================================================
// clock state
// =============================================================================
donkeykong2.ClockMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.demotimer = null;
	this.democount;

	this.demospawn;
	this.demodkjr;
	this.demokey;
	this.demochains;
};
donkeykong2.ClockMode.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);
		this.democount = 0;

		this.demotimer = this.lcdgame.addtimer(this, this.onTimerDemo, 500, false);

		// start demo mode
		this.demospawn = {"croc1": -1, "spark1": -1, "spark2": -1, "croc2": -1, "bird": -1};
		this.resetDemo();
		this.demotimer.start();
	},

	update: function() {

	},

	press: function(btn) {
		// show highscore before starting game
		if ( (btn == "gamea") || (btn == "gameb") ) {
			this.demotimer.pause();
			this.lcdgame.setShapeByName("time_colon", false);
			// show highscore
			var sc = this.lcdgame.highscores.getHighscore((btn == "gamea" ? 1 : 2));
			this.lcdgame.digitsDisplay("digits", ""+sc, true);
		}
	},
	release: function(btn) {
		// start game
		if ( (btn == "gamea") || (btn == "gameb") ) {
			this.lcdgame.level = 0; // new game
			this.lcdgame.gametype = (btn == "gamea" ? 1 : 2); // 1=game a, 2=game b
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

		// hack
		if (this.lcdgame.shapeVisible("mario") == false) {
			this.resetDemo();
		}
	},

	resetDemo: function() {
		// reset donkey kong and mario
		this.lcdgame.setShapeByName("mario", true);
		this.lcdgame.setShapeByName("dk_1", true);

		this.lcdgame.setShapeByName("chain_1", true);
		this.lcdgame.setShapeByName("chain_2", true);
		this.lcdgame.setShapeByName("chain_3", true);
		this.lcdgame.setShapeByName("chain_4", true);

		// reset variables
		//this.demodkjr = 0;
		//this.demokey = 0;
		//this.demochains = [4, 5, 6, 7];
	},

	moveDkjrDemo: function() {
		/*
		var jump = false;

		// jump to first key
		if ( ( (this.demokey == 0) && (this.demodkjr == 2) )	// jump to first key
			|| ( (this.demokey == 2) && (this.demodkjr == 21) )	// jump to second key
			) {
			jump = true;
		};

		// jump to first key
		if (jump) {

		} else if (this.jumping) {
		} else {
			// moving left or right
			if () {

			}
		}
		if ( (this.demokey == 0) && (this.demodkjr == 2) )		// jump to first key
		|| ( (this.demokey == 2) && (this.demodkjr == 21) ) {	// jump to second key
			jump = true;
		};


		this.demodkjr = 0;
		this.demokey = 0;
		this.demochains = [4, 5, 6, 7];
*/
	},

	updateDemo: function() {
		// update moving enemies
		var t = this.demotimer.counter;

		// move the enemies
		if (t % 2 == 0) {
			// from top row birds to middle row birds
			if (this.lcdgame.sequenceShapeVisible("bird1", -1) == true) {
				this.lcdgame.sequenceSetFirst("bird2", true);
			}
			this.lcdgame.sequenceShift("bird1");
			this.lcdgame.sequenceShift("bird3");
			this.lcdgame.sequenceShift("croc1");

			// top row sparks move slower
			if (t % 4 == 0) this.lcdgame.sequenceShift("spark2");
		} else {
			// from middle row birds to bottom row birds
			if (this.lcdgame.sequenceShapeVisible("bird2", -1) == true) {
				this.lcdgame.sequenceSetFirst("bird3", true);
			}

			this.lcdgame.sequenceShift("croc2");
			this.lcdgame.sequenceShift("bird2");
			this.lcdgame.sequenceShift("spark1");
		}

		// NOTE: this is best guess of randomisation of enemies, on the real device there may be a pattern but couldn't find it
		if (t % 2 == 0) {
			// count down and spawn enemy
			this.demospawn.croc1--;
			this.demospawn.bird--;
			if (this.demospawn.croc1  == 0) this.lcdgame.sequenceSetFirst("croc1", true);
			if (this.demospawn.bird   == 0) this.lcdgame.sequenceSetFirst("bird1", true);

			// reset spawn count down
			if (this.demospawn.croc1  <= 0) this.demospawn.croc1  = this.lcdgame.randomInteger(2, 8);
			if (this.demospawn.bird   <= 0) this.demospawn.bird   = this.lcdgame.randomInteger(4, 12);
			// add new enemies
			if (t % 4 == 0) {
				// after blink animation, add spark2 on second position
				if (this.spark2) {
					this.spark2 = false;
					this.lcdgame.sequenceSetPos("spark2", 0, true);
					this.lcdgame.setShapeByName("spark2_1", false);
				}
				// count down and spawn enemy
				this.demospawn.spark2--;
				this.spark2 = (this.demospawn.spark2 == 0); // spark blink animation

				// reset spawn count down
				if (this.demospawn.spark2 <= 0) this.demospawn.spark2 = this.lcdgame.randomInteger(4, 12);
			}
		} else {
			// after blink animation, add spark1 on second position
			if (this.spark1) {
				this.spark1 = false;
				this.lcdgame.sequenceSetPos("spark1", 0, true);
				this.lcdgame.setShapeByName("spark1_1", false);
			}
			// count down and spawn enemy
			this.demospawn.croc2--;
			this.demospawn.spark1--;
			if (this.demospawn.croc2  == 0) this.lcdgame.sequenceSetFirst("croc2", true);
			this.spark1 = (this.demospawn.spark1 == 0);  // spark blink animation

			// reset spawn count down
			//if (this.demospawn.croc2  <= 0) this.demospawn.croc2  = this.lcdgame.randomInteger(2, 8);
			//if (this.demospawn.spark1 <= 0) this.demospawn.spark1 = this.lcdgame.randomInteger(4, 12);

			// reset spawn count down
			if (this.demospawn.croc2  <= 0) this.demospawn.croc2  = this.lcdgame.randomInteger(2, 4);
			if (this.demospawn.spark1 <= 0) this.demospawn.spark1 = this.lcdgame.randomInteger(4, 6);
		}

		this.moveDkjrDemo();
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
		} else {
			if (ihours == 0) ihours = 12; // weird AM/PM time rule
			this.lcdgame.setShapeByName("time_am", true);
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
donkeykong2.MainGame = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.gametimer = null;
	this.keytimer = null;
	this.waittimer = null;
	this.pushtimer = null;
	this.sparktimer = null;
	this.chancetimer = null;

	this.dkjrpos;
	this.jumping;
	this.jumpover;
	this.keypos;
	this.lives;
	this.chains;
	this.unlockstart;
	this.unlockbonus;

	this.spark1;
	this.spark2;

	this.enemyspawn;

	this.waitmode;  // waittimer, type of pause
	this.unlockmiss; // after unlocking a lock, make round trip back down with a miss
	this.chancetime;
};
donkeykong2.MainGame.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		this.gametimer = this.lcdgame.addtimer(this, this.onTimerGame, 400, false);
		this.keytimer = this.lcdgame.addtimer(this, this.onTimerKey, 500, false); // key on/off and also chance-time score blink in 60 bpm

		this.waittimer = this.lcdgame.addtimer(this, this.onTimerWait, 100, false); // key animation, death animation, dk free animation
		this.pushtimer = this.lcdgame.addtimer(this, this.onTimerPush, 12500, true); // idle time out after 12.5 sec
		this.chancetimer = this.lcdgame.addtimer(this, this.onTimerChance, 250, true);

		// start of spark animation
		this.sparktimer = this.lcdgame.addtimer(this, this.onTimerSpark, 40, true);
		this.sparktimer.start();

		// continuously run key blink timer
		this.keytimer.start();

		// start new game
		this.newGame();
	},

	// start a new game, reset score level etc.
	newGame: function() {
		// stop any other state
		this.lcdgame.shapesDisplayAll(false);

		// reset game specific variables
		this.lcdgame.gameReset(this.lcdgame.gametype);
		this.lives = 3;
		this.chancetime = false;
		this.lcdgame.setShapeByName("dkjr_life_1", true);
		this.lcdgame.setShapeByName("dkjr_life_2", true);
		this.spark1 = false;
		this.spark2 = false;

		// show "game b" or "game b"
		var gametxt = (this.lcdgame.gametype == 1 ? "game_a" : "game_b");
		this.lcdgame.setShapeByName(gametxt, true);

		this.lcdgame.setShapeByName("dkjr_01", true);

		// trigger clear enemy spawn
		//this.enemyspawn = [-1, -1, -1, -1, -1];
		this.enemyspawn = {"croc1": -1, "spark1": -1, "spark2": -1, "croc2": -1, "bird": -1};

		// start first level
		this.nextLevel();
	},

	// go to next level, possibly after cutscene
	nextLevel: function() {

		// next level
		this.lcdgame.level++;

		// reset donkey kong
		this.chains = [4, 5, 6, 7];

		// start game enemies
		this.doWait(WAIT_STARTANIM);

		// reset score, positions etc.
		//this.continueGame();
	},

	// continue at start of game, new level or after a miss
	continueGame: function() {
		// reset variables
		this.dkjrpos = 0;
		this.unlockmiss = false;
		this.jumping = 0;
		this.jumpover = "";
		this.scorePoints(0);

		// reset timers
		this.waittimer.pause();
		this.waitmode = STATE_PLAYING;
		this.refreshGameSpeed();

		// reset key and push timer
		this.resetKey();
		this.pushtimer.start();
	},

	// go to next level, possibly after cutscene
	resetKey: function() {
		// reset key to first position
		this.keypos = 0;
		this.lcdgame.sequenceClear("key");
		this.lcdgame.sequenceSetPos("key", this.keypos, true);

		// lock bonus timer resets
		this.unlockstart = Date.now();
	},

	update: function() {
	},

	press: function(btn, idx) {

		// playing game
		if (this.waitmode == STATE_PLAYING) {
			if (btn == "dpad") {
				// up
				if (idx == 0) {
					this.tryMoveDkJr(DIR_UP);
				}
				// down
				if (idx == 1) {
					this.tryMoveDkJr(DIR_DOWN);
				}
				// left
				if (idx == 2) {
					this.tryMoveDkJr(DIR_LEFT);
				}
				// right
				if (idx == 3) {
					this.tryMoveDkJr(DIR_RIGHT);
				}
			}
			if (btn == "jump") {
				this.tryMoveDkJr(DIR_JUMP);
			}
		}

		// game over
		if (this.waitmode == STATE_GAMEOVER) {
			if ( (btn == "gamea") || (btn == "gameb") ) {
				//this.lcdgame.setShapeByName("time_colon", false);
				// show highscore
				var sc = this.lcdgame.highscores.getHighscore((btn == "gamea" ? 1 : 2));
				//this.lcdgame.digitsDisplay("digits", ""+sc, true);
			}
		}
	},

	release: function(btn) {
		// after game over, release gamea/gameb to start game
		if (this.waitmode == STATE_GAMEOVER) {
			if ( (btn == "gamea") || (btn == "gameb") ) {
				this.lcdgame.level = 0; // new game
				this.lcdgame.gametype = (btn == "gamea" ? 1 : 2); // 1=game a, 2=game b
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
		// Formula below is an as-good-as-possible educated guess, based on many soundwave measurements
		var msecs = 600 - ((this.lcdgame.level-1) * 50) - ( (5-this.chains.length) * 25); // ms lower is faster speed

		// limit max.speed. NOTE: not verified so not sure that this limit was also on actual device
		//if (msecs < 62.5) {msecs = 62.5};

		this.gametimer.interval = msecs;
		this.gametimer.start();
	},

	tryMoveDkJr: function(dir) {
		// initialise move position
		var move = 0;
		var coll = "";

		if (dir == DIR_LEFT) {
			// bottom row
			move = MoveCollide[this.dkjrpos].move[2];
			coll = MoveCollide[this.dkjrpos].collide[2];
		}
		if (dir == DIR_RIGHT) {
			move = MoveCollide[this.dkjrpos].move[3];
			coll = MoveCollide[this.dkjrpos].collide[3];
		}
		if (dir == DIR_UP) {
			move = MoveCollide[this.dkjrpos].move[0];
			coll = MoveCollide[this.dkjrpos].collide[0];
		}
		if (dir == DIR_DOWN) {
			move = MoveCollide[this.dkjrpos].move[1];
			coll = MoveCollide[this.dkjrpos].collide[1];
		}
		if (dir == DIR_JUMP) {
			move = MoveCollide[this.dkjrpos].move[4];
		}

		// falling down after jumping
		if (dir == DIR_NONE) {
			move = -1;
			this.lcdgame.setShapeByName("dkjr_hand_1", false);
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
			this.dkjrpos = this.dkjrpos + move;
			this.lcdgame.sequenceClear('dkjr');
			this.lcdgame.sequenceSetPos('dkjr', this.dkjrpos, true);

			// jumping
			if (dir == DIR_JUMP) {
				this.lcdgame.playSoundEffect("jump");
			} else {
				this.lcdgame.playSoundEffect("move");
			}

			// Exception when DkJr on rope:
			// When bird moves to position directly next to DkJr -> not collide yet, only collide when bird passes through DkJr
			// When DkJr moves to position directly next to bird -> then collide immediately (exception in code below)
			var collLeft  = "";
			var collRight = "";
			if ( (this.dkjrpos > 22) && (MoveCollide[this.dkjrpos].move[1] < 0) ) {
				// can move down, so DkJr is on rope
				var collLeft  = MoveCollide[this.dkjrpos].collide[2];
				var collRight = MoveCollide[this.dkjrpos].collide[3];
			}

			// check collision up, for when jumping or moving vertically
			var collUp = MoveCollide[this.dkjrpos].collide[0];
			// check any collision
			if ( (this.lcdgame.shapeVisible(collUp)) || (this.lcdgame.shapeVisible(collLeft))  || (this.lcdgame.shapeVisible(collRight)) ) {
				this.doWait(WAIT_LOSEANIM);
				return;
			}

			// if jumping position doesn't have a "can move down with dpad" value, then fall down from that position, else jump into rope/vine but don't fall (same as moving)
			if ( (dir == DIR_JUMP) && (MoveCollide[this.dkjrpos].move[1] == 0) ) {
				this.jumping = 2;

				// check if jump over enemy
				var en = MoveCollide[this.dkjrpos].collide[4];
				this.jumpover = (this.lcdgame.shapeVisible(en) ? en : "");

				// jump at first position to advance key on bottom screen
				if ( (this.dkjrpos == 2) && (this.keypos == 0) ) {
					this.jumping = 1; // shorter jump
					this.doWait(WAIT_MOVEKEY1);
				}

				// jump at 21th position to advance key on top screen
				if ( (this.dkjrpos == 21) && (this.keypos == 2) ) {
					this.jumping = 1; // shorter jump
					this.doWait(WAIT_MOVEKEY2);
				}
				this.lcdgame.setShapeByName("dkjr_hand_1", (this.dkjrpos == 21));
			}
		} else {
			// exception; move up on top position of rope to grab key
			if (dir == DIR_UP) {
				// top rope positions
				var rope = [25, 29, 33, 37].indexOf(this.dkjrpos);
				if (rope >= 0) {
					// check if key is at same position
					if (this.keypos-4 == rope) {
						// remove index from array
						var idx = this.chains.indexOf(this.keypos);
						this.chains.splice(idx, 1);
						// unlock animation
						this.doWait(WAIT_LOCKANIM);
					}
				}
			}
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
		if (!this.chancetime) {
			this.refreshScore(this.lcdgame.score);
		}

		// pass 300 for bonus
		if ( (this.lcdgame.score-pts < 300) && (this.lcdgame.score >= 300) ) {
			if (this.lives == 3) {
				// reach 300 points without any misses
				this.chancetime = true; // score doubler
			} else {
				// reach 300 points with misses; add lives
				this.lives = 3;
			}
			// score >300 can occur either during game or during cutscene
			this.waittimer.pause();
			this.gametimer.pause();

			// set this.waitmode to STATE_NONE, so it diables button input
			if (this.waitmode == STATE_PLAYING) this.waitmode = STATE_NONE;

			this.chancetimer.start();
		}
	},

	doWait: function(code) {

		this.waittimer.pause();

		switch(code) {
			case WAIT_STARTANIM:
				this.waittimer.interval = 100;
				break;
			case WAIT_LOSEANIM:
				this.waittimer.interval = 100;
				// lose a life
				this.lives--;
				// stop chance time
				this.chancetime = false;
				this.scorePoints(0);
				break;
			case WAIT_MOVEKEY1:
				this.waittimer.interval = 100;
				break;
			case WAIT_MOVEKEY2:
				this.waittimer.interval = 100;
				break;
			case WAIT_LOCKANIM:
				this.unlockmiss = true;
				this.waittimer.interval = 100;

				// bonus points for unlock, depends on time between key appean and unlock
				var lockfinish = Date.now();
				var msecs = (lockfinish - this.unlockstart);

				// bonus points for unlocking, depends on time between key first appear and unlocking
				// less than 15 sec = 15 points
				// less then 30 sec = 14 points
				// less then 45 sec = 13 points
				// less then 60?sec = 12 points (never unlocked after 60 sec, it's an extrapolation)
				// etc.
				var deduct = Math.floor(msecs / 15000);    // divide by 15 seconds and round down
				this.unlockbonus = Math.max(15 - deduct, 5); // maximum is 15 points, minimum bonus is 5 points

				break;
			case WAIT_WINANIM1:

				this.waittimer.interval = 100;
				break;
			case WAIT_WINANIM2:

				this.waittimer.interval = 100;
				break;
		}

		this.waitmode = code;

		// key doesn't blink during lose or cut-scene animation
		var keyvis = (this.waitmode == WAIT_MOVEKEY1) || (this.waitmode == WAIT_MOVEKEY2);
		this.lcdgame.sequenceSetPos("key", this.keypos, keyvis);

		this.gametimer.pause();
		this.waittimer.start();
	},

	onTimerWait: function() {

		// initialise variables
		var t = this.waittimer.counter;
		var waitover = false;

		// do different wait animations
		switch(this.waitmode) {
			case WAIT_STARTANIM:
				t = t - 1;

				// 0ms Mario+DK re-appear
				if (t == 0) {
					this.lcdgame.playSoundEffect("beep1");
					this.lcdgame.setShapeByName("mario", true);
					this.lcdgame.setShapeByName("dk_1", true);
				}

				// 600ms chains appear + DkJr start pos
				if (t == 6) {
					this.lcdgame.playSoundEffect("start1");
					this.lcdgame.setShapeByName("chain_1", true);
					this.lcdgame.setShapeByName("chain_2", true);
					this.lcdgame.setShapeByName("chain_3", true);
					this.lcdgame.setShapeByName("chain_4", true);

					this.lcdgame.setShapeByName("dkjr_01", true);
				}

				// 1200ms key appears + game continue
				if (t == 14) {
					this.continueGame();
				}

				break;
			case WAIT_LOSEANIM:
				t = t - 1;

				// 0ms lose sound effect
				if (t == 0) {
					this.lcdgame.playSoundEffect("lose1");
				}

				///nTimerGame -- 4
				///donkeykong2.js:511 lose animation -- t=2 o=false
				///donkeykong2.js:511 lose animation -- t=5 o=true
				///donkeykong2.js:511 lose animation -- t=8 o=false
				///donkeykong2.js:511 lose animation -- t=11 o=true
				///donkeykong2.js:511 lose animation -- t=14 o=false
				///donkeykong2.js:511 lose animation -- t=17 o=true
				///donkeykong2.js:741 onTimerGame -- 1

				// blink on/off at 200ms 300ms 600ms 900ms 1200ms 1500ms
				if ( (t <= 14) && ((t+1) % 3 == 0) ) {
					var o = ((t+1) % 6 == 0); // on at 0ms 600ms 1200ms
					this.lcdgame.sequenceSetPos('dkjr', this.dkjrpos, o);
					// beep
					if (t > 3) this.lcdgame.playSoundEffect("lose2");
				}

				// still more lives, animate move lives
				if (this.lives >= 1) {
					if (t == 20) this.lcdgame.setShapeByName("dkjr_life_1", false);
					if (t == 21) this.lcdgame.setShapeByName("dkjr_01", true);
					if (t == 22) this.lcdgame.setShapeByName("dkjr_life_2", false);
					if((t == 23) && (this.lives > 1)) this.lcdgame.setShapeByName("dkjr_life_1", true);
				} else {
					// no more lives, game over
					if (t == 19) {
						// no move lives, game over sound
						this.lcdgame.playSoundEffect("gameover");
					}
				}

				// continue game
				if (t >= 23) {
					if (this.lives >= 1) {
						this.continueGame();
					} else {
						// no move lives, game over state and highscore
						// NOTE: highscore pop-up will pause any update/sound so wait a short while between game over sound and high score check
						this.waitmode = STATE_GAMEOVER;
						this.waittimer.pause();
						// game over, check for highscore
						this.lcdgame.highscores.checkScore();
					}
				}
				break;
			case WAIT_MOVEKEY1:

				// 500ms move key
				if (t == 5) {
					this.lcdgame.playSoundEffect("movekey");
					this.lcdgame.setShapeByName("key_1", false);
					this.lcdgame.setShapeByName("key_2", true);
				}
				// 800ms move key
				if (t == 8) {
					this.lcdgame.setShapeByName("key_2", false);
					this.lcdgame.setShapeByName("key_3", true);
					// continue without adding score
					waitover = !this.unlockmiss;
				}

				// add score before continueing, +1 point at 800ms, 900ms, 1000ms, 1100ms, 1200ms
				if (this.unlockmiss == true) {
					if ( (t >= 8) && (t <= 12) ) {
						this.lcdgame.playSoundEffect("beep1");
						this.scorePoints(1);
					}
					// continue after adding score
					waitover = (t >= 12);
				}
				// continue game
				if (waitover == true) {
					this.keypos = 2;
				}
				break;
			case WAIT_MOVEKEY2:
				// 500ms move key
				if (t == 5) {
					this.lcdgame.playSoundEffect("movekey");
					this.lcdgame.setShapeByName("key_3", false);
					this.lcdgame.setShapeByName("key_4", true);

					// move hand
					this.lcdgame.setShapeByName("dkjr_hand_1", false);
					this.lcdgame.setShapeByName("dkjr_hand_2", true);
				}
				// 800ms move key
				if (t == 8) {
					this.lcdgame.setShapeByName("key_4", false);
					// move hand
					this.lcdgame.setShapeByName("dkjr_hand_1", true);
					this.lcdgame.setShapeByName("dkjr_hand_2", false);
				}
				// 1000ms move key to random
				if (t == 10) {
					this.lcdgame.setShapeByName("key_5", false);

					// randomely choose one of the remaining chains
					var idx = this.lcdgame.randomInteger(0, this.chains.length-1);
					this.keypos = this.chains[idx];

					this.lcdgame.setShapeByName("dkjr_hand_1", false);
					waitover = true;
				}
				// continue game
				if (t >= 12) {
					waitover = true;
				}
				break;
			case WAIT_LOCKANIM:
				//    0ms  chain+key on
				//  300ms  chain+key off
				//  600ms  chain+key on
				//  900ms  chain+key off
				// 1200ms  +1 point
				// 1300ms  +1 point
				// 1400ms  +1 point
				// etc. depending on how many unlock-bonus points
				t = t - 1;

				// chain on at 0ms and 600ms
				if ( (t == 0) || (t == 6) ) {

					this.lcdgame.sequenceSetPos("key", this.keypos, true);
					this.lcdgame.sequenceSetPos("chain", this.keypos-4, true);
					this.lcdgame.playSoundEffect("beep1");
				}
				// chain off at 300ms and 900ms
				if ( (t == 3) || (t == 9) ) {
					this.lcdgame.playSoundEffect("beep1");
					this.lcdgame.sequenceSetPos("key", this.keypos, false);
					this.lcdgame.sequenceSetPos("chain", this.keypos-4, false);
				}
				// bonus points
				if (t >= 12) {
					if (this.unlockbonus > 0) {
						this.lcdgame.playSoundEffect("beep1");
						this.scorePoints(1);
						this.unlockbonus--;
					} else {
						// continue game or win level
						if (this.chains.length > 0) {
							this.resetKey();
							waitover = true;
						} else {
							this.doWait(WAIT_WINANIM1);
						}
						// game a or game win, clear enemies in top screen
						if ( (this.chains.length == 0) || (this.lcdgame.gametype == 1) ) {
							this.lcdgame.sequenceClear('bird1');
							this.lcdgame.sequenceClear('bird2');
							this.lcdgame.sequenceClear('bird3');
							this.lcdgame.sequenceClear('croc2');
						}
					}
				}
				break;
			case WAIT_WINANIM1:
				// DkJr climbs down
				// Win animation split into two parts, because timing varies
				// depending on which rope was last key, amount moving DkJr to right varies
				t = t - 1;

				//debugger;

				// move on 0ms 600ms 1200ms etc.
				if (t % 6 == 0) {
					// DkJr on rope or on ground
					if (MoveCollide[this.dkjrpos].move[1] != 0) {
						this.dkjrpos--; // move down rope
					} else {
						if (this.dkjrpos+4 < MoveCollide.length-1) {
							this.dkjrpos = this.dkjrpos + 4;
						}
					}
					this.lcdgame.playSoundEffect("move");
					this.lcdgame.sequenceClear('dkjr');
					this.lcdgame.sequenceSetPos('dkjr', this.dkjrpos, true);
				}

				// dk blink on off on 0ms 300ms 600ms 900ms etc.
				if (t % 3 == 0) {
					this.lcdgame.setShapeByName("dk_1", (t % 6 != 0));
				}

				// if DkJr at final position then start the second part of win-animation
				if (this.dkjrpos == 34) {
					this.doWait(WAIT_WINANIM2);
				}
				break;
			case WAIT_WINANIM2:
				// DkJr catches DK, add points, restart chains
				t = t - 1;

				// 500ms move DK
				if (t == 5) {
					this.lcdgame.playSoundEffect("win1");
					this.lcdgame.setShapeByName("dk_1", false);
					this.lcdgame.setShapeByName("dk_2", true);
				}

				// 1300ms move DK final catch position
				if (t == 13) {
					this.lcdgame.playSoundEffect("win2");
					this.lcdgame.setShapeByName("dkjr_35", false);
					this.lcdgame.setShapeByName("dk_2", false);
					this.lcdgame.setShapeByName("dk_3", true);
				}

				// 2500ms..mario disappear
				if (t == 25) this.lcdgame.setShapeByName("mario", false);

				// 2500ms..4400ms score 20 points on each 100ms
				if ( (t >= 25) && (t <= 44) ) {
					this.lcdgame.playSoundEffect("beep1");
					this.scorePoints(1);
				}

				// 4400ms remove DK + DkJr
				if (t == 44) {
					this.lcdgame.setShapeByName("dk_3", false);
				}

				// 5000ms Mario+DK re-appear
				if (t == 50) {
					this.nextLevel();
				}

				break;
		}

		// wait is over, continue game
		if (waitover) {
			this.waitmode = STATE_PLAYING;
			this.waittimer.pause();
			this.gametimer.unpause();

			//this.lcdgame.sequenceSetPos("key", this.keypos, true); // show key immediately(?)
		}
	},

	onTimerPush: function() {
		// idle time out; if player does nothing, push DkJr into the game
		this.pushtimer.pause();
		if (this.dkjrpos == 0) {
			this.tryMoveDkJr(DIR_UP);
		}
	},

	onTimerChance: function() {


		// blink lives on/off
		var b = (this.chancetimer.counter % 2 == 0);
		this.lcdgame.setShapeByName("dkjr_life_1", (b || this.chancetime)); // when no misses, only dkj_lives_2 is blinking
		this.lcdgame.setShapeByName("dkjr_life_2", b);

		// play sound
		if (!b) this.lcdgame.playSoundEffect("beep1");

		// continue regular game or cut scene
		if (this.chancetimer.counter > 5) {
			this.chancetimer.pause();

			// continue game or cutscene
			if (this.waitmode == STATE_NONE) {
				this.waitmode = STATE_PLAYING;
				this.gametimer.unpause();
			} else {
				this.waittimer.unpause();
			}
		}
	},


	onTimerSpark: function() {
		// idle time out; if player does nothing, push DkJr into the game
		var t = (this.sparktimer.counter % 2 == 0);
		if (this.spark1 == true) {
			this.lcdgame.setShapeByName("spark1_1", t);
		}
		if (this.spark2 == true) {
			this.lcdgame.setShapeByName("spark2_1", t);
		}
	},

	onTimerKey: function() {
		// key only blinks during gameplay, not during or cutscene
		if (this.waitmode == STATE_PLAYING) {
			// key blinking on/off
			if (this.keytimer.counter % 2 == 0) {
				this.lcdgame.sequenceClear("key");
			} else {
				this.lcdgame.sequenceSetPos("key", this.keypos, true);
			}
		}
		// chance time blink score while playing
		if (this.chancetime) {
			var s = (this.keytimer.counter % 2 == 0 ? this.lcdgame.score : "");
			this.refreshScore(s);
		}

	},

	onTimerGame: function() {
		// update moving enemies
		var t = this.gametimer.counter;

		// different pulse sound when on top screen
		var pls = ((t % 2 == 0) && (this.dkjrpos > 19) ? "pulse2" : "pulse1");
		this.lcdgame.playSoundEffect(pls);

		// check collisions
		var hit       = false;
		var collUp    = MoveCollide[this.dkjrpos].collide[0];
		var collDown  = MoveCollide[this.dkjrpos].collide[1];
		var collLeft  = MoveCollide[this.dkjrpos].collide[2];
		var collRight = MoveCollide[this.dkjrpos].collide[3];

		// check collisions with enemies
		if (t % 2 == 0) {
			if (/croc1/.test(collRight)) hit = this.lcdgame.shapeVisible(collRight);
			if (/bird1/.test(collLeft))  hit = this.lcdgame.shapeVisible(collLeft);
			if (/bird3/.test(collLeft))  hit = this.lcdgame.shapeVisible(collLeft);
		} else {
			if (/spark1/.test(collLeft)) hit = this.lcdgame.shapeVisible(collLeft);
			if (/croc2/.test(collRight)) hit = this.lcdgame.shapeVisible(collRight);
			if (/bird2/.test(collRight)) hit = this.lcdgame.shapeVisible(collRight);
		}
		// collision
		if (hit) {
			this.doWait(WAIT_LOSEANIM);
			return;
		}

		// move the enemies
		if (t % 2 == 0) {
			// from top row birds to middle row birds
			if (this.lcdgame.sequenceShapeVisible("bird1", -1) == true) {
				this.lcdgame.sequenceSetFirst("bird2", true);
			}
			this.lcdgame.sequenceShift("bird1");
			this.lcdgame.sequenceShift("bird3");
			this.lcdgame.sequenceShift("croc1");

			// top row sparks move slower
			if (t % 4 == 0) this.lcdgame.sequenceShift("spark2");
		} else {
			// from middle row birds to bottom row birds
			if (this.lcdgame.sequenceShapeVisible("bird2", -1) == true) {
				this.lcdgame.sequenceSetFirst("bird3", true);
			}

			this.lcdgame.sequenceShift("croc2");
			this.lcdgame.sequenceShift("bird2");
			this.lcdgame.sequenceShift("spark1");
		}

		// check collisions with enemies up down
		if (t % 2 == 0) {
			// top row sparks move slower
			if (/spark2/.test(collUp))   hit = this.lcdgame.shapeVisible(collUp);
		} else {
			if (/spark1/.test(collUp))   hit = this.lcdgame.shapeVisible(collUp);
			if (/spark1/.test(collDown)) hit = this.lcdgame.shapeVisible(collDown);
		}
		// collision
		if (hit) {
			this.doWait(WAIT_LOSEANIM);
			return;
		}

		// NOTE: this is best guess of randomisation of enemies, on the real device there may be a pattern but couldn't find it
		if (t % 2 == 0) {
			// count down and spawn enemy
			this.enemyspawn.croc1--;
			this.enemyspawn.bird--;
			if (this.enemyspawn.croc1  == 0) this.lcdgame.sequenceSetFirst("croc1", true);
			if (this.enemyspawn.bird   == 0) this.lcdgame.sequenceSetFirst("bird1", true);

			// reset spawn count down
			if (this.enemyspawn.croc1  <= 0) this.enemyspawn.croc1  = this.lcdgame.randomInteger(2, 8);
			if (this.enemyspawn.bird   <= 0) this.enemyspawn.bird   = this.lcdgame.randomInteger(4, 12);
			// add new enemies
			if (t % 4 == 0) {
				// after blink animation, add spark2 on second position
				if (this.spark2) {
					this.spark2 = false;
					this.lcdgame.sequenceSetPos("spark2", 0, true);
					this.lcdgame.setShapeByName("spark2_1", false);
				}
				// count down and spawn enemy
				this.enemyspawn.spark2--;
				this.spark2 = (this.enemyspawn.spark2 == 0); // spark blink animation

				// reset spawn count down
				if (this.enemyspawn.spark2 <= 0) this.enemyspawn.spark2 = this.lcdgame.randomInteger(4, 6);
			}
		} else {
			// after blink animation, add spark1 on second position
			if (this.spark1) {
				this.spark1 = false;
				this.lcdgame.sequenceSetPos("spark1", 0, true);
				this.lcdgame.setShapeByName("spark1_1", false);
			}
			// count down and spawn enemy
			this.enemyspawn.croc2--;
			this.enemyspawn.spark1--;
			if (this.enemyspawn.croc2  == 0) this.lcdgame.sequenceSetFirst("croc2", true);
			this.spark1 = (this.enemyspawn.spark1 == 0);  // spark blink animation

			// reset spawn count down
			//if (this.enemyspawn.croc2  <= 0) this.enemyspawn.croc2  = this.lcdgame.randomInteger(2, 8);
			//if (this.enemyspawn.spark1 <= 0) this.enemyspawn.spark1 = this.lcdgame.randomInteger(4, 12);

			// reset spawn count down
			if (this.enemyspawn.croc2  <= 0) this.enemyspawn.croc2  = this.lcdgame.randomInteger(2, 4);
			if (this.enemyspawn.spark1 <= 0) this.enemyspawn.spark1 = this.lcdgame.randomInteger(4, 6);
		}

		// jumping
		if (this.jumping > 0) {
			this.jumping--;
			if (this.jumping <= 0) {
				// falling down again
				this.tryMoveDkJr(DIR_NONE);

				// check if jump over enemy
				if ( (this.jumpover != "") && (!this.lcdgame.shapeVisible(this.jumpover)) ) {
					this.scorePoints(1);
				}
				this.jumpover = "";
			}
		}
	}
};
