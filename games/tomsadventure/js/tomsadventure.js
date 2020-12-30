// Tom's Adventure LCD game simulation
// Bas de Reuver (c)2018

var tomsadventure = {};

// constants
var STATE_WAIT = 0;
var STATE_PLAYING = 1;
var STATE_GAMEOVER = 2;

// =============================================================================
// boot state
// =============================================================================
tomsadventure.BootMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.boottimer;
};
tomsadventure.BootMode.prototype = {
	init: function(){
		// startup clear all
		this.boottimer = this.lcdgame.addtimer(this, this.onTimerBoot, 100, false);
		this.boottimer.start();
	},

	update: function() {
	},

	press: function(btn) {
	},

	release: function(btn) {
		// nothing
	},

	close: function() {
	},

	onTimerBoot: function() {
		this.lcdgame.shapesDisplayAll(true);
		if (this.boottimer.counter > 5) {
			this.lcdgame.state.start("demo");
		}
	}
};

// =============================================================================
// demo state
// =============================================================================
tomsadventure.DemoMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.demotimer = null;
	this.democount;
	this.demostate; // 0=demo, 1=g1, 2=g2
};
tomsadventure.DemoMode.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);
		this.democount = 0;
		this.demostate = 0;

		// start demo mode, always reset to melody-on
		this.lcdgame.soundmute = false;

		this.demotimer = this.lcdgame.addtimer(this, this.onTimerDemo, 1250, false);

		// show sound icon
		this.lcdgame.setShapeByName("sound", !this.lcdgame.soundmute);

		// start demo mode
		this.demotimer.start();
	},

	update: function() {
	},

	press: function(btn) {
		// game select
		if (btn == "select") {
			// cycle 0, 1, or 2
			this.demostate = (this.demostate + 1) % 3;

			if (this.demostate == 0) {
				// clear digits
				this.lcdgame.digitsDisplay("digits", "");
				this.lcdgame.setShapeByName("game_2", false);
				// toggle sound back on
				this.lcdgame.setShapeByName("sound", true);
				this.lcdgame.setSoundMute(false);
			} else {
				// set digits
				this.lcdgame.digitsDisplay("digits", "0000");
				// set G1 or G2
				this.lcdgame.setShapeByName("game_1", (this.demostate == 1));
				this.lcdgame.setShapeByName("game_2", (this.demostate == 2));
			}
		}

		// only when selecting a game
		if (this.demostate != 0) {
			// toggle sound on/off
			if (btn == "melody") {
				var snd = !this.lcdgame.soundmute;
				// toggle melody on/off
				this.lcdgame.setShapeByName("sound", !snd);
				this.lcdgame.setSoundMute(snd);
			}
			// start game
			if (btn == "start") {
				this.lcdgame.level = 0; // new game
				this.lcdgame.gametype = this.demostate; // 1=G1, 2=G2
				this.lcdgame.state.start("maingame");
			}
		}

	},
	release: function(btn) {
		// nothing
	},

	close: function() {
	},

	onTimerDemo: function() {
		// update test
		this.lcdgame.sequenceShift("tom");
		this.lcdgame.sequenceShift("chest");
		this.lcdgame.sequenceShift("thief");
		this.lcdgame.sequenceShift("dragon");

		if ((this.demotimer.counter-1) % 7 == 0) this.lcdgame.setShapeByName("tom_1", true);
		if ((this.demotimer.counter-2) % 7 == 0) this.lcdgame.setShapeByName("chest_1", true);
		if ((this.demotimer.counter-3) % 7 == 0) this.lcdgame.setShapeByName("thief_1", true);
		if ((this.demotimer.counter-4) % 7 == 0) this.lcdgame.setShapeByName("dragon_1", true);
	}
};

// =============================================================================
// game state
// =============================================================================
tomsadventure.MainGame = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.gametimer = null;

	this.tompos;
	this.tomwait; // wait interval after moving
	this.thiefpos;
	this.haschest; // -1=thief holds chest, 0=none, +1=tom holds chest
	this.dooropen; // 0..3=closed 4..7=opened
	this.newchest; // count down to new chest appears
	this.lives;
	this.gamestate;

	// dragons and rocks appear alternating, in pattern:
	// cycle 1: dragon 3x, rock 2x
	// cycle 2: dragon 2x, rock 4x
	// cycle 3: dragon 1x, rock 6x
	// cycle 4: dragon 2x, rock 4x
	// repeat
	this.dragrock = [3,2,  2,4,  1,6,  2,4]; // odd=dragons, even=rocks
	this.dragidx; // index in rockdrag array
	this.dragcount; // dragon/rocks counter
	this.dragstep; // current dragon/rocks step in sequence
};
tomsadventure.MainGame.prototype = {
	init: function(){
		// timers
		this.gametimer = this.lcdgame.addtimer(this, this.onTimerGame, 312, true); // (48bpm * 4) = 192bpm = 312.5ms
		this.waittimer = this.lcdgame.addtimer(this, this.onTimerWait, 3750, true);

		// start new game
		this.newGame();
	},

	// start a new game, reset score level etc.
	newGame: function() {

		// reset variables
		this.lcdgame.gameReset(this.lcdgame.gametype);

		// reset game specific variables
		this.lives = 4;
		this.gamestate = STATE_WAIT;

		// chest always visible at start of new game
		this.continueGame();
		this.lcdgame.setShapeByName("chest_1", true);
		this.newchest = 0;

		// game starting melody
		this.lcdgame.playSoundEffect("start");
		this.waittimer.interval = 3750;
		this.waittimer.start();
		this.gamestate = STATE_WAIT;
	},

	// continue game, at start or after death
	continueGame: function() {
		// start/continue game clear all
		this.lcdgame.shapesDisplayAll(false);

		// show sound icon
		this.lcdgame.setShapeByName("sound", !this.lcdgame.soundmute);

		// show "G1" or "G2"
		var gametxt = (this.lcdgame.gametype == 1 ? "game_1" : "game_2");
		this.lcdgame.setShapeByName(gametxt, true);

		// reset/redraw score
		this.scorePoints(0);
		// reset position
		this.tompos = 1;
		this.thiefpos = 5; // off screen
		this.dooropen = 1;
		this.haschest = 0;
		this.newchest = 5; // new chest, 5 ticks from now


		this.lcdgame.sequenceClear("tom");
		this.lcdgame.setShapeByName("tom_2", true);

		// dragon/rocks counters
		this.dragidx = -1;
		this.dragcount = 0;
		this.dragstep = 0;
		this.dragmax = 0;
	},

	// continue game, at start or after death
	onPlayerDies: function() {
		// stop game
		this.gamestate = STATE_WAIT;
		this.gametimer.pause();

		// tom falls down
		if (this.haschest > 0) this.lcdgame.sequenceClear("chest");
		this.lcdgame.sequenceClear("tom");
		this.lcdgame.setShapeByName("tom_6", true);

		// lose a live
		this.lives--;
		this.lcdgame.digitsDisplay("digits", ""+this.lives+" ", true);

		// continue or game over
		if (this.lives > 0) {
			// play lose melody
			this.lcdgame.playSoundEffect("lose");
			this.waittimer.interval = 1250;
		} else {
			// play game over melody
			this.lcdgame.playSoundEffect("end");
			this.waittimer.interval = 3000;
		}

		// short pause before continuing
		this.waittimer.start();
	},

	update: function() {
	},

	press: function(btn, idx) {
		// playing the game
		if (this.gamestate == STATE_PLAYING) {
			if (btn == "left") {
				this.tryMoveTom(-1);
			}
			if (btn == "right") {
				this.tryMoveTom(+1);
			}
		}

		// game over, press select to select new game
		if (this.gamestate == STATE_GAMEOVER) {
			if (btn == "start") {
				this.lcdgame.state.start("maingame");
			}
			if (btn == "select") {
				if (this.lcdgame.gametype == 2) {
					this.lcdgame.state.start("demo");
				} else {
					this.lcdgame.gametype = 2;
					this.lcdgame.setShapeByName("game_1", false);
					this.lcdgame.setShapeByName("game_2", true);
				}
			}
			if (btn == "melody") {
				// toggle sound, and show sound icon
				this.lcdgame.soundmute = !this.lcdgame.soundmute;
				this.lcdgame.setShapeByName("sound", !this.lcdgame.soundmute);
			}
		}
	},

	close: function() {
	},

	tryMoveTom: function(dir) {
		// valid moves
		if ( (dir < 0) && (this.tompos == 0) ) {dir = 0;} // cannot move further left
		if ( (dir > 0) && (this.tompos == 4) ) {dir = 0;} // cannot move further right

		// valid move
		if (dir != 0) {
			// sound effect
			this.lcdgame.playSoundEffect("beep");

			// move tom
			this.tompos = this.tompos + dir;
			this.lcdgame.sequenceClear("tom");
			this.lcdgame.sequenceSetPos("tom", this.tompos, true);

			// move chest
			if (this.haschest > 0) {
				var ch = (5 - this.tompos);
				this.lcdgame.sequenceClear("chest");
				this.lcdgame.sequenceSetPos("chest", ch, true);
			}

			// check if thief steals chest, dragon hit, rock hit etc.
			this.thiefGrabChest();
			this.checkDragonRock();

			// bear cannot appear when standing on its position
			if (this.tompos == 2) {
				if (this.lcdgame.shapeVisible("bear") == true) {
					this.onPlayerDies();
				}
			} else {
				this.updateBear();
			}

			// move offset, wait 2 intervals before checking chest grab/throw
			// for example, if player moved at interval 1, then check only at 3
			this.tomwait = (this.gametimer.counter + 1) % 4;
		}
	},

	thiefGrabChest: function() {
		// check if thief steals treasure
		if (this.haschest > 0) {
			if ( (this.tompos == 4) && (this.thiefpos == 1) ) this.haschest = -1; // at center
			if ( (this.tompos == 2) && (this.thiefpos == 2) ) this.haschest = -1; // on path
			if ( (this.tompos == 0) && (this.thiefpos == 3) ) this.haschest = -1; // at door
		}
	},

	moveDragonRock: function() {
		// next dragon or rock
		this.dragstep++;
		if (this.dragstep >= this.dragmax) {
			this.dragcount--;
			if (this.dragcount <= 0) {
				this.dragidx = (this.dragidx + 1) % this.dragrock.length;
				this.dragcount = this.dragrock[this.dragidx];
				this.dragmax = (this.dragidx % 2 ? 3 : 4);
			}
			this.dragstep = 0;
		}

		// set or move, dragon or rock
		this.lcdgame.sequenceClear("rock");
		this.lcdgame.sequenceClear("dragon");
		var str = (this.dragidx % 2 ? "rock" : "dragon");
		this.lcdgame.sequenceSetPos(str, this.dragstep, true);

		// exception; first rock doesn't fall down it's like a warning
		if ( (this.dragidx % 2) && (this.dragstep == 1) && (this.dragcount == this.dragrock[this.dragidx]) ) {
			// debugger;
			this.lcdgame.sequenceClear("rock");
		}
	},

	checkDragonRock: function() {
		if ( (this.tompos == 3) && (this.lcdgame.shapeVisible("dragon_3") == true) ) {
			this.onPlayerDies();
		}
		if ( (this.tompos == 1) && (this.lcdgame.shapeVisible("rock_2") == true) ) {
			this.onPlayerDies();
		}
	},

	updateBear: function() {
		// bear, only in G2 mode
		if (this.lcdgame.gametype == 2) {
			// bear appears
			if ( ( (this.thiefpos==0) || (this.thiefpos==4) ) && this.tompos != 2) {
				this.lcdgame.setShapeByName("bear", true);
			}
			// bear disappears
			if ( (this.thiefpos == 1) || (this.thiefpos==5) ) {
				this.lcdgame.setShapeByName("bear", false);
			}
		}
	},

	scorePoints: function(pts) {
		// update score
		this.lcdgame.score = this.lcdgame.score + pts;

		// pass 1000,2000,3000 etc for bonus, 100 points + extra life
		if ( (this.lcdgame.score > 0) && (this.lcdgame.score % 1000 == 0) ) {
			this.lcdgame.score = this.lcdgame.score + 100;
			this.lives++;
		}

		// display
		this.lcdgame.digitsDisplay("digits", "000"+this.lcdgame.score, true);
	},

	onTimerWait: function() {
		// disable wait timer
		this.waittimer.pause();

		if (this.lives > 0) {
			// continue game
			this.continueGame();
			this.gametimer.start();
			this.gamestate = STATE_PLAYING;
		} else {
			this.scorePoints(0);
			this.gamestate = STATE_GAMEOVER;
			this.lcdgame.highscores.checkScore();
		}
	},

	onTimerGame: function() {
		// update moving enemies
		var t = this.gametimer.counter - 1;

		// move the thief
		if ((t % 4) == 0) {
			// move thief position
			if (this.thiefpos > 4) {
				this.thiefpos = 0;
			} else {
				this.thiefpos++;
			}

			// clear
			this.lcdgame.sequenceClear("thief");

			if (this.thiefpos > 4) {
				// thiefpospos=5, is thief temporarily invisible off-screen
				if (this.haschest < 0) {
					this.haschest = 0;
					this.lcdgame.sequenceClear("chest");
					this.newchest = 9; // new chest, 9 ticks from now, so when (this.thiefpos == 1)
				}
			} else {
				this.lcdgame.sequenceSetPos("thief", this.thiefpos, true);
				this.thiefGrabChest();
				// thief has chest, move chest with thief
				if (this.haschest < 0) {
					var pos = [1,3,5,7];
					var ch = pos[this.thiefpos-1];
					this.lcdgame.sequenceClear("chest");
					this.lcdgame.sequenceSetPos("chest", ch, true);
				}
			}
			// open and close door, door pattern is continously; 5 ticks closed, 3 ticks opened
			this.dooropen++;
			 // door opens
			if (this.dooropen == 4) this.lcdgame.setShapeByName("door", true); // open
			 // door opens
			if (this.dooropen > 7) {
				this.lcdgame.setShapeByName("door", false);
				// reset countdown to next door open
				this.dooropen = 0;
			}

			// exception; rock falls down quicker
			if ( (this.dragidx % 2) && (this.dragstep == 1) && (this.dragcount != this.dragrock[this.dragidx]) ) {
				this.moveDragonRock();
				// check if hits tom
				this.checkDragonRock();
			}

			// bear appears in sync with thief moves
			this.updateBear();
		}

		// a new chest appears
		if (this.newchest > 0) {
			this.newchest--;
			if (this.newchest <= 0) {
				this.lcdgame.sequenceClear("chest");
				this.lcdgame.sequenceSetFirst("chest", true);
			}
		}

		if ((t % 4) == 1) {
			// next dragon or rock
			this.moveDragonRock();

			// check if hits tom
			this.checkDragonRock();
		}
		// dragon and rock dissapear slightly sooner
		if ((t % 4) == 2) {
			// dragon and rock disappear slightly sooner
			if (this.dragstep == (this.dragidx % 2 ? 1 : 2)) { // last index; rock=1, dragon=2
				this.lcdgame.sequenceClear("rock");
				this.lcdgame.sequenceClear("dragon");
			}
		}

		if ((t % 4) == this.tomwait) {
			// check if grabbing chest
			if (this.tompos == 4) {
				if (this.lcdgame.shapeVisible("chest_1") == true) {
					// play sound
					this.lcdgame.playSoundEffect("beep");
					// take chest
					this.lcdgame.setShapeByName("chest_1", false);
					this.lcdgame.setShapeByName("chest_2", true);
					this.haschest = +1;
					// check if thief immediately steals chest
					this.thiefGrabChest();
				}
			}
			// check if throwing chest through door
			if ( (this.tompos == 0) && (this.haschest > 0) && (this.dooropen >= 4) ) {
				// play sound
				this.lcdgame.playSoundEffect("beep");
				// throw chest
				this.lcdgame.setShapeByName("chest_6", false);
				this.lcdgame.setShapeByName("chest_7", true);
				this.haschest = 0;
				this.scorePoints(20);
				this.newchest = 2; // new chest, 2 ticks from now
			}
			// move offset, reset when not moving
			this.tomwait = 0;
		}
	}
};
