// Highway LCD game simulation
// Bas de Reuver (c)2018

var eaglechicken = {};

// constants
var STATE_PLAYING  = 0;
var WAIT_LEVELANIM = 1;
var WAIT_LOSEANIM  = 2;
var WAIT_ROOSTER  = 3;
var WAIT_RESETANIM  = 4;
var STATE_GAMEOVER = 5;

// =============================================================================
// clock state
// =============================================================================
eaglechicken.ClockMode = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.demotimer = null;
	this.timemonth;
	this.timemode;
	this.chickenpos = 3;
	this.eaglepos = 3;
};
eaglechicken.ClockMode.prototype = {
	init: function(){
		// startup clear all
		this.lcdgame.shapesDisplayAll(false);

		this.demotimer = this.lcdgame.addtimer(this, this.onTimerDemo, 1000, false);
		this.timemonth = true;
		this.timemode = 0;

		// start demo mode
		this.demotimer.start();

		var tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		for (var i = 0; i < 1000; i++) {
			var r = this.lcdgame.randomInteger(1, 8);
			if (r == 3) r = 2;		// 3 = b0011
			if (r >= 6) r = r + 2;	// 6 and 7 unused
			if (r == 1) {
				// divide 1 over 1/8=6, 3/8=1, 1/2=4
				// 37,5% = 1
				var x = this.lcdgame.randomInteger(0, 7);
				if (x >= 4) r = 4; // 50% = 4
				if (x == 0) r = 6; // 12,5% = 6
			}

			tmp[r] = tmp[r] + 1;
		}
		console.log(tmp);

		var dropbit = 0;
		var eaglepos = 2;
		var eagledrop =  2; // b0101
		//var eagledrop =  9; // b1001
		//var eagledrop = 11; // b1011
		//var eagledrop = 12; // b1100
		dropbit = (eagledrop >> 0) & 1;
		console.log("dropbit 0 =" + dropbit);
		dropbit = (eagledrop >> 1) & 1;
		console.log("dropbit 1 =" + dropbit);
		dropbit = (eagledrop >> 2) & 1;
		console.log("dropbit 2 =" + dropbit);
		dropbit = (eagledrop >> 3) & 1;
		console.log("dropbit 3 =" + dropbit);

		tmp = [];
		for (var i = 0; i < 20; i++) {
			// drop in current eagle pos, or two places ahead/behind, i.e. at 1&3 or at 2&4
			var r = this.lcdgame.randomInteger(0, 1);
			var pos = (eaglepos + (r * 2)) % 4;
			tmp[i] = pos;
		}
		console.log("random positions");
		console.log(tmp);
	},

	update: function() {
	},

	press: function(btn) {
		if (btn == "game") {
			// cycle through modes
			this.timemode = (this.timemode + 1) % 4;

			// time mode
			if (this.timemode == 0) {
				this.lcdgame.setShapeByName("game_g2", false);
				// pause animation
				this.demotimer.unpause();
			}

			// display month+date
			if (this.timemode == 1) this.updateClock();

			// game select mode G1 or G2
			if (this.timemode > 1) {
				// pause animation
				this.demotimer.pause();

				// clear all falling eagles
				this.lcdgame.sequenceClear("eagle1");
				this.lcdgame.sequenceClear("eagle2");
				this.lcdgame.sequenceClear("eagle3");
				this.lcdgame.sequenceClear("eagle4");

				this.lcdgame.digitsDisplay("digits", "0", true);

				// display G1 or G2
				this.lcdgame.setShapeByName("game_g1", (this.timemode == 2));
				this.lcdgame.setShapeByName("game_g2", (this.timemode == 3));
			}
		}

		if (btn == "start") {
			// start game G1
			if (this.timemode == 2) {
				// eagle and chicken pos the same between states
				this.lcdgame.state.states["gamemode1"].eaglepos   = this.eaglepos;
				this.lcdgame.state.states["gamemode1"].chickenpos = this.chickenpos;
				this.lcdgame.state.start("gamemode1");
			}

			// start game G2
			if (this.timemode == 3) {
				// eagle and chicken pos the same between states
				this.lcdgame.state.states["gamemode2"].eaglepos   = this.eaglepos;
				this.lcdgame.state.states["gamemode2"].chickenpos = this.chickenpos;
				this.lcdgame.state.start("gamemode2");
			}
		}
	},

	close: function() {
	},

	onTimerDemo: function() {
		// update clock
		this.updateClock();

		this.updateDemo();
	},

	updateClock: function() {
		// get time as 12h clock with PM
		var datenow = new Date();
		var str = "";

		this.lcdgame.setShapeByName("time_colon", (this.timemode == 0));
		this.lcdgame.setShapeByName("time_pm", false);

		if (this.timemode == 0) {
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
			}
			// format hour and minute
			str = ("  "+ihours).substr(-2) + ("00"+imin).substr(-2);

		} else {
			var imonth = 1 + datenow.getMonth();
			var iday = datenow.getDate();

			// format hour and minute
			str = ("  "+imonth).substr(-2) + ("  "+iday).substr(-2);
		}

		// display time
		this.lcdgame.digitsDisplay("digits", str, false);
	},

	updateDemo: function() {
		// demo mode animations
		var t = this.demotimer.counter;

		// shift all sequences
		this.lcdgame.sequenceShift("eagle1");
		this.lcdgame.sequenceShift("eagle2");
		this.lcdgame.sequenceShift("eagle3");
		this.lcdgame.sequenceShift("eagle4");

		this.eaglepos = (this.eaglepos + 1) % 4;

		// chicken always visible

		this.lcdgame.sequenceSetPos("chicken", this.chickenpos, true);

		// move big eagle
		this.lcdgame.sequenceClear("eaglebig");
		this.lcdgame.sequenceSetPos("eaglebig", this.eaglepos, true);

		// drop random eagles from big eagle
		var r = this.lcdgame.randomInteger(0, 3);
		if (r == 0) this.lcdgame.sequenceSetFirst("eagle" + (this.eaglepos+1), true);
	}
};


// =============================================================================
// game state for game mode 1
// =============================================================================
eaglechicken.GameMode1 = function(lcdgame) {
	this.lcdgame = lcdgame;

	this.gametimer;
	this.hittimer;
	this.waittimer;

	this.gamestate;
	this.chickenpos = 3;
	this.eaglepos = 3;
	this.misses;

	this.winghits;
};
eaglechicken.GameMode1.prototype = {
	init: function() {
		// start game mode
		this.lcdgame.shapesDisplayAll(false);

		// initialise all timers
		this.gametimer = this.lcdgame.addtimer(this, this.onTimerGame, 1000, true); // wait before continuing after a miss
		this.hittimer  = this.lcdgame.addtimer(this, this.onTimerHit,    50);
		this.waittimer = this.lcdgame.addtimer(this, this.onTimerWait,  100);

		this.newGame();
	},

	update: function() {
	},

	close: function() {
	},

	press: function(btn) {
		if (this.gamestate == STATE_PLAYING) {
			if (btn == "left")  this.moveChicken(-1);
			if (btn == "right") this.moveChicken(+1);
		}

		if (this.gamestate == STATE_GAMEOVER) {
			// restart game
			if (btn == "start") {
				var str = "gamemode" + this.lcdgame.gametype;
				this.lcdgame.state.states[str].eaglepos   = this.eaglepos;
				this.lcdgame.state.states[str].chickenpos = this.chickenpos;
				this.lcdgame.state.start(str);
			}
			// back to clock
			if (btn == "game") {
				if (this.lcdgame.gametype == 1) {
					// clear all eagles
					this.lcdgame.digitsDisplay("digits", "0", true);
					this.lcdgame.sequenceClear("eagle1");
					this.lcdgame.sequenceClear("eagle2");
					this.lcdgame.sequenceClear("eagle3");
					this.lcdgame.sequenceClear("eagle4");
					this.lcdgame.sequenceClear("miss");
					// switch g1 to g2
					this.lcdgame.setShapeByName("game_g1", false);
					this.lcdgame.setShapeByName("game_g2", true);
					this.lcdgame.gametype = 2;
				} else {
					// eagle and chicken pos the same between states
					this.lcdgame.state.states["clock"].eaglepos   = this.eaglepos;
					this.lcdgame.state.states["clock"].chickenpos = this.chickenpos;
					this.lcdgame.state.start("clock");
				}
			}
		}
	},

	newGame: function() {
		// reset game specific variables
		this.lcdgame.gameReset(1);
		this.lcdgame.setShapeByName("game_g"+this.lcdgame.gametype, true);

		// new game, reset variables
		this.misses = 0;
		this.winghits = [0, 0, 0, 0];

		// move big eagle
		this.lcdgame.sequenceClear("eaglebig");
		this.lcdgame.sequenceClear("chicken");
		this.lcdgame.sequenceSetPos("eaglebig", this.eaglepos, true);
		this.lcdgame.sequenceSetPos("chicken",  this.chickenpos, true);

		// reset score and misses
		this.scorePoints(0);
		this.lcdgame.sequenceClear("miss");
		this.lcdgame.sequenceClear("miss123");

		this.continueGame();
	},

	continueGame: function() {

		this.gamestate = STATE_PLAYING;

		// set game speed
		this.gametimer.interval = 625;
		this.gametimer.start();
		this.hittimer.start();
	},

	onTimerHit: function() {

		// animate eagle being hit, i=0 is left-most, i=3 is right-most
		for (var i=0; i <= 3; i++) {
			// check if animation
			if (this.winghits[i] != 0) {
				// decrease animation counter
				var t = 8 - this.winghits[i];
				this.winghits[i] = this.winghits[i] - 1;

				// remove bird, add wings
				if (t == 2) {
					var p = (i+1);
					this.lcdgame.sequenceSetPos("eagle"+p, -1, false); // clear last position
					this.lcdgame.setShapeByName("wings_"+p, true);
				}

				// remove wings
				if (t == 7) {
					var p = (i+1);
					this.lcdgame.setShapeByName("wings_"+p, false);
				}
			}
		}
	},

	onTimerGame: function() {
		// demo mode animations
		var t = this.gametimer.counter;

		// speed-up at 50 points
		// Note: never played beyond 110 points, unknown if any speed-ups after 110 points
		if (this.lcdgame.score >= 50) {
			this.gametimer.interval = 375;
		}

		// next eagle position
		this.eaglepos = (this.eaglepos + 1) % 4; // 0..3

		// move big eagle
		this.lcdgame.sequenceClear("eaglebig");
		this.lcdgame.sequenceSetPos("eaglebig", this.eaglepos, true);

		// at pos=0, determine new random drop points
		if (this.eaglepos == 0) {
			// semi-random dropping, statistics based on observing real device
			// example eagledrop = 5 = b0101 means drop at pos 1 and 3, or 2=b0010 mean drop at pos 2, or 4=b0100 mean drop at pos 3 etc.
			var r = this.lcdgame.randomInteger(1, 8);
			if (r == 3) r = 2;		// 3 = b0011
			if (r >= 6) r = r + 2;	// 6 and 7 unused
			if (r == 1) {
				// divide 1 over 1/8=6, 3/8=1, 1/2=4
				// 37,5% = 1
				var x = this.lcdgame.randomInteger(0, 7);
				if (x >= 4) r = 4; // 50% = 4
				if (x == 0) r = 6; // 12,5% = 6
			}
			this.eagledrop = r;
		}

		var hit1 = false;
		var hit2 = false;

		// shift eagles sequences
		if ((this.eaglepos % 2) == 0) {
			// move eagles, and check landing
			hit1 = (this.lcdgame.sequenceShift("eagle1") && (this.winghits[0] <= 0));
			hit2 = (this.lcdgame.sequenceShift("eagle3") && (this.winghits[2] <= 0));


			// check if eagle landed
			if (hit1 || hit2) {
				this.eagleHasLanded();
				return;
			}

			// check hits
			this.checkHitEagle(0);
			this.checkHitEagle(2);
		} else {
			// move eagles, and check landing
			hit1 = (this.lcdgame.sequenceShift("eagle2") && (this.winghits[1] <= 0));
			hit2 = (this.lcdgame.sequenceShift("eagle4") && (this.winghits[3] <= 0));

			// check if eagle landed
			if (hit1 || hit2) {
				this.eagleHasLanded();
				return;
			}

			// check hits
			this.checkHitEagle(1);
			this.checkHitEagle(3);
		}

		// drop new semi-random eagles from big eagle
		var dropbit = (this.eagledrop >> this.eaglepos) & 1;
		if (dropbit) {
			// drop in current eagle pos, or two places ahead/behind, i.e. at 1&3 or at 2&4
			var r = this.lcdgame.randomInteger(0, 1);
			var pos = (this.eaglepos + (r * 2)) % 4;
			this.lcdgame.sequenceSetFirst("eagle" + (pos+1), true);
		}
	},

	onTimerWait: function() {

		var t = this.waittimer.counter;

		switch (this.gamestate) {
			case WAIT_LOSEANIM:
				// continue game after 2,5s
				if (t >= 25) {
					// remove eagle and update misses
					this.lcdgame.setShapeByName("eagle_land", false);
					this.updateMisses(1);

					// continue game
					if (this.misses < 3) {
						this.waittimer.pause();
						this.continueGame();
					} else {
						// no move lives, game over state and highscore
						this.gamestate = STATE_GAMEOVER;
					}
				}
				break;
			case STATE_GAMEOVER:
				// game over, check for highscore
				this.waittimer.pause();
				this.lcdgame.highscores.checkScore();

				break;
		}
	},

	moveChicken: function(step) {
		// assume move is valid
		this.chickenpos = this.chickenpos + step;

		// check if position is valid
		if (this.chickenpos < 0) this.chickenpos = 0;
		if (this.chickenpos > 3) this.chickenpos = 3;

		// update position
		this.lcdgame.sequenceClear("chicken");
		this.lcdgame.sequenceSetPos("chicken", this.chickenpos, true);

		// check if hitting an eagle
		this.checkHitEagle(this.chickenpos);
	},

	checkHitEagle: function(pos) {
		// check if last position of eagle is visible
		if (pos == this.chickenpos) {
			if (this.lcdgame.sequenceShapeVisible("eagle"+(pos+1), -1)) {
				this.scorePoints(1);
				this.winghits[pos] = 8; // animation counter
			}
		}
	},

	eagleHasLanded: function() {
		this.gametimer.pause();
		this.hittimer.pause();

		this.lcdgame.setShapeByName("eagle_land", true);

		this.gamestate = WAIT_LOSEANIM;
		this.waittimer.start();
	},

	scorePoints: function(pts) {
		// score points
		this.lcdgame.score += pts;
		// display score
		var d = this.lcdgame.score % 10000; // display 9999 max? haven't tried such highscores
		this.lcdgame.digitsDisplay("digits", ""+d, true);
	},

	updateMisses: function(m) {
		this.misses = this.misses + m;

		this.lcdgame.setShapeByName("miss_1", (this.misses >= 1));
		this.lcdgame.setShapeByName("miss_2", (this.misses >= 2));
		this.lcdgame.setShapeByName("miss_3", (this.misses >= 3));
	}
};

// =============================================================================
// game state for game mode 2
// =============================================================================
eaglechicken.GameMode2 = function(lcdgame) {
	this.lcdgame = lcdgame;

	this.gametimer;
	this.hittimer;
	this.waittimer;

	this.gamestate;
	this.chickenpos = 3;
	this.eaglepos = 3;

	this.seconds;
	this.countdown;

	this.miss123;
	this.misses;

	this.winghits;
};
eaglechicken.GameMode2.prototype = {
	init: function() {
		// start game mode

		// initialise all timers
		this.gametimer = this.lcdgame.addtimer(this, this.onTimerGame, 1000, true); // wait before continuing after a miss
		this.sectimer = this.lcdgame.addtimer(this, this.onTimerSeconds, 1000, true);
		this.hittimer  = this.lcdgame.addtimer(this, this.onTimerHit,    50);
		this.waittimer = this.lcdgame.addtimer(this, this.onTimerWait,  500);

		this.newGame();
	},

	update: function() {
	},

	close: function() {
	},

	press: function(btn) {
		if (this.gamestate == STATE_PLAYING) {
			if (btn == "left")  this.moveChicken(-1);
			if (btn == "right") this.moveChicken(+1);
		}

		if (this.gamestate == STATE_GAMEOVER) {
			// restart game
			if (btn == "start") {
				this.lcdgame.state.start("gamemode2");
			}
			// back to clock
			if (btn == "game") {
				// eagle and chicken pos the same between states
				this.lcdgame.state.states["clock"].eaglepos   = this.eaglepos;
				this.lcdgame.state.states["clock"].chickenpos = this.chickenpos;
				this.lcdgame.state.start("clock");
			}
		}
	},

	newGame: function() {
		//clear screen
		this.lcdgame.shapesDisplayAll(false);

		// reset game specific variables
		this.lcdgame.gameReset(2);
		this.lcdgame.setShapeByName("game_g"+this.lcdgame.gametype, true);

		// new game, reset variables
		this.misses = 0;
		this.winghits = [0, 0, 0, 0];

		// move big eagle
		this.lcdgame.sequenceSetPos("eaglebig", this.eaglepos, true);
		this.lcdgame.sequenceSetPos("chicken",  this.chickenpos, true);

		// continue game
		this.continueGame();
	},

	continueGame: function() {

		// reset seconds and misses 1/2/3
		this.seconds = 60;
		this.countdown = 40;
		this.miss123 = 0;
		this.lcdgame.level++;

		// set game speed
		this.gametimer.interval = (this.lcdgame.level >= 4 ? 375 : 500);
		//this.gametimer.start();
		//this.sectimer.start();
		//this.hittimer.start();


		// at start blink level nr
		this.gamestate = WAIT_LEVELANIM;
		this.waittimer.start();
	},

	onTimerHit: function() {

		// animate eagle being hit, i=0 is left-most, i=3 is right-most
		for (var i=0; i <= 3; i++) {
			// check if animation
			if (this.winghits[i] != 0) {
				// decrease animation counter
				var t = 8 - this.winghits[i];
				this.winghits[i] = this.winghits[i] - 1;

				// remove bird, add wings
				if (t == 2) {
					var p = (i+1);
					this.lcdgame.sequenceSetPos("eagle"+p, -1, false); // clear last position
					this.lcdgame.setShapeByName("wings_"+p, true);
				}

				// remove wings
				if (t == 7) {
					var p = (i+1);
					this.lcdgame.setShapeByName("wings_"+p, false);
				}
			}
		}
	},

	onTimerSeconds: function() {
		if (this.seconds <= 0) {
			// pause game
			this.gametimer.pause();
			this.sectimer.pause();
			this.hittimer.pause();
			// wain animation
			this.gamestate = WAIT_RESETANIM;
			this.waittimer.start();
		} else {
			this.seconds = this.seconds - 1;
			this.refreshScoreSecs();
		}
	},

	onTimerGame: function() {
		// demo mode animations
		var t = this.gametimer.counter;

		// speed-up at 50 points
		// Note: never played beyond 110 points, unknown if any speed-ups after 110 points
		if (this.lcdgame.score >= 50) {
			this.gametimer.interval = 375;
		}

		// next eagle position
		this.eaglepos = (this.eaglepos + 1) % 4; // 0..3

		// move big eagle
		this.lcdgame.sequenceClear("eaglebig");
		this.lcdgame.sequenceSetPos("eaglebig", this.eaglepos, true);

		// at pos=0, determine new random drop points
		if (this.eaglepos == 0) {
			// semi-random dropping, statistics based on observing real device
			// example eagledrop = 5 = b0101 means drop at pos 1 and 3, or 2=b0010 mean drop at pos 2, or 4=b0100 mean drop at pos 3 etc.
			var r = this.lcdgame.randomInteger(1, 8);
			if (r == 3) r = 2;		// 3 = b0011
			if (r >= 6) r = r + 2;	// 6 and 7 unused
			if (r == 1) {
				// divide 1 over 1/8=6, 3/8=1, 1/2=4
				// 37,5% = 1
				var x = this.lcdgame.randomInteger(0, 7);
				if (x >= 4) r = 4; // 50% = 4
				if (x == 0) r = 6; // 12,5% = 6
			}
			this.eagledrop = r;
		}

		var hit1 = false;
		var hit2 = false;

		// shift eagles sequences
		if ((this.eaglepos % 2) == 0) {
			// move eagles, and check landing
			hit1 = (this.lcdgame.sequenceShift("eagle1") && (this.winghits[0] <= 0));
			hit2 = (this.lcdgame.sequenceShift("eagle3") && (this.winghits[2] <= 0));


			// check if eagle landed
			if (hit1 || hit2) {
				this.eagleHasLanded();
				return;
			}

			// check hits
			this.checkHitEagle(0);
			this.checkHitEagle(2);
		} else {
			// move eagles, and check landing
			hit1 = (this.lcdgame.sequenceShift("eagle2") && (this.winghits[1] <= 0));
			hit2 = (this.lcdgame.sequenceShift("eagle4") && (this.winghits[3] <= 0));

			// check if eagle landed
			if (hit1 || hit2) {
				this.eagleHasLanded();
				return;
			}

			// check hits
			this.checkHitEagle(1);
			this.checkHitEagle(3);
		}

		// drop new semi-random eagles from big eagle
		var dropbit = (this.eagledrop >> this.eaglepos) & 1;
		if (dropbit) {
			// drop in current eagle pos, or two places ahead/behind, i.e. at 1&3 or at 2&4
			var r = this.lcdgame.randomInteger(0, 1);
			var pos = (this.eaglepos + (r * 2)) % 4;
			this.lcdgame.sequenceSetFirst("eagle" + (pos+1), true);
		}
	},

	onTimerWait: function() {

		var t = this.waittimer.counter;

		switch (this.gamestate) {
			case WAIT_LEVELANIM:
				// blink round nr
				var str = (t % 2 == 0 ? "" : ""+this.lcdgame.level) + "40";
				this.lcdgame.digitsDisplay("digits", str, true);

				console.log("WAIT_LEVELANIM t="+t + "   str="+str);

				if (t >= 6) {
					console.log("WAIT_LEVELANIM ..continue");
					this.waittimer.pause();
					// actually start game
					this.gamestate = STATE_PLAYING;
					this.gametimer.start();
					this.sectimer.start();
					this.hittimer.start();
					this.refreshScoreSecs();
				}
				break;
			case WAIT_ROOSTER:
				// wait 2.50 sec then continue game
				if (t >= 5) {
					this.waittimer.pause();
					// continue game
					this.gamestate = STATE_PLAYING;
					this.gametimer.unpause();
					this.sectimer.unpause();
					this.hittimer.unpause();
				}
			case WAIT_RESETANIM:
				// wait 2.50 sec then show score
				if (t == 5) {
					this.lcdgame.digitsDisplay("digits", ""+this.lcdgame.score, true);
					// update misses
					this.lcdgame.setShapeByName("miss_1", (this.misses >= 1));
					this.lcdgame.setShapeByName("miss_2", (this.misses >= 2));
					this.lcdgame.setShapeByName("miss_3", (this.misses >= 3));
					this.lcdgame.setShapeByName("eagle_land", false);

					// game over
					if (this.misses >= 3) {
						this.gamestate = STATE_GAMEOVER;
						return;
					}
				}

				// wait 1.50 sec remove eagles, remove miss nr123, remove rooster
				if (t == 8) {
					// clear all eagles
					this.lcdgame.sequenceClear("eagle1");
					this.lcdgame.sequenceClear("eagle2");
					this.lcdgame.sequenceClear("eagle3");
					this.lcdgame.sequenceClear("eagle4");
					this.lcdgame.sequenceClear("miss123");
					this.lcdgame.setShapeByName("rooster_alarm", false);
				}

				// wait 1.00 sec then continue next level
				if (t == 10) {
					this.continueGame();
				}

				break;
			case STATE_GAMEOVER:
				// game over, check for highscore
				this.waittimer.pause();
				this.lcdgame.highscores.checkScore();

				break;
		}
	},

	moveChicken: function(step) {
		// assume move is valid
		this.chickenpos = this.chickenpos + step;

		// check if position is valid
		if (this.chickenpos < 0) this.chickenpos = 0;
		if (this.chickenpos > 3) this.chickenpos = 3;

		// update position
		this.lcdgame.sequenceClear("chicken");
		this.lcdgame.sequenceSetPos("chicken", this.chickenpos, true);

		// check if hitting an eagle
		this.checkHitEagle(this.chickenpos);
	},

	checkHitEagle: function(pos) {
		// check if last position of eagle is visible
		if (pos == this.chickenpos) {
			if (this.lcdgame.sequenceShapeVisible("eagle"+(pos+1), -1)) {
				this.lcdgame.score++;
				this.countdown--;
				this.refreshScoreSecs();
				this.winghits[pos] = 8; // animation counter

				// rooster appears (bonus?)
				if (this.countdown == 0) {
					this.lcdgame.setShapeByName("rooster_alarm", true);
					// pause game
					this.gametimer.pause();
					this.sectimer.pause();
					this.hittimer.pause();
					//
					this.gamestate = WAIT_ROOSTER;
					this.waittimer.start();
				}

			}
		}
	},

	eagleHasLanded: function() {
		// more than 3 landed, then it is a miss
		this.miss123++;
		this.lcdgame.setShapeByName("miss_no1", (this.miss123 == 1));
		this.lcdgame.setShapeByName("miss_no2", (this.miss123 == 2));
		this.lcdgame.setShapeByName("miss_no3", (this.miss123 >= 3));

		if (this.miss123 > 3) {
			// pause game timers
			this.gametimer.pause();
			this.sectimer.pause();
			this.hittimer.pause();

			this.lcdgame.setShapeByName("eagle_land", true);
			this.misses = this.misses + 1;

			this.gamestate = WAIT_RESETANIM;
			this.waittimer.start();
		}
	},

	refreshScoreSecs: function() {
		var p = (this.countdown >= 0 ? this.countdown : 40 - this.countdown);
		var str = ("  "+this.seconds).substr(-2) + ("00"+p).substr(-2);

		// display score and seconds
		this.lcdgame.digitsDisplay("digits", str, true);
	}

};
