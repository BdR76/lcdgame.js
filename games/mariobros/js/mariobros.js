// Mario Bros LCD game simulation
// Bas de Reuver (c)2018

var mariobros = {};

// constants
var STATE_DEMO = 1;
var STATE_MODESELECT = 2;
var STATE_GAMEPLAY = 10;
var STATE_GAMEDROP = 11;
var STATE_GAMEWIN = 12;
var STATE_GAMEOVER = 13;

mariobros = function(lcdgame) {
	// save reference to lcdgame object
	this.lcdgame = lcdgame;
}

// =============================================================================
// clock state
// =============================================================================
mariobros.ClockMode = function(lcdgame) {
	this.lcdgame = lcdgame;
}
mariobros.ClockMode.prototype = {
	init: function(){
		// startup show all
		this.lcdgame.shapesDisplayAll(true);
		this.lcdgame.shapesRefresh();
		this.lcdgame.shapesDisplayAll(false);

		this.demotimer = new LCDGame.Timer(this, this.onTimerDemo, 500);

		// start demo mode
		this.demotimer.Start();
	},

	update: function() {
	},
	
	input: function(btn) {
		if ( (btn == "gamea") || (btn == "gameb") ) {
			this.lcdgame.level = 0; // new game
			this.lcdgame.gametype = (btn == "gamea" ? 1 : 2); // 1=game a, 2=game b
			this.demotimer.Stop();
			this.lcdgame.state.start("maingame");
		};
	},
		
	close: function() {
	},

	onTimerDemo: function() {
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
		this.lcdgame.setShapeByName("time_colon", (this.demotimer.Counter % 2 == 0));

		// display time
		this.lcdgame.digitsDisplay("digits", strtime, false);
		
		// refresh shapes
		this.lcdgame.shapesRefresh();
	}
}

// =============================================================================
// main game state
// =============================================================================
mariobros.MainGame = function(lcdgame) {
	this.lcdgame = lcdgame;
	
	// game specific variables
	this.gamestate = 0;
	this.score = 0;
	this.misscount = 0;
	this.truckcases = 0;
	this.caseadd = 0;
	this.caseaddbulk = 0;

	// cases on truck
	this.truckdrop = false;
	
	this.luigipos = 0;
	this.mariopos = 0;
	this.luigigrab = 0;
	this.mariograb = 0;
	this.misscase = 0;
	this.misswho = "";
	
	this.belttimer = null; // also drives the grab/move and dust animations
	this.misstimer = null;
	
	// global game variables
	this.holdcase = [];
	this.dropcase = [];

	// initialise variable only once
	for (var c = 1; c < 11; c++) {
		this.holdcase[c] = false;
	};
	// 2 stacks of 4 cases on the truck, for dropped animation
	for (var c = 0; c < 8; c++) {
		var seq = (c%2==0 ? "case12" : "case13");
		var max = (c%2==0 ? 5 : 4) - Math.floor(c / 2);
		this.dropcase[c] = {"case":c,"seq":seq,"max":max,"dropped":0,"falling":false,"frame":0,"fallsync":0};
	};
}
mariobros.MainGame.prototype = {
	init: function(){
	
		// add timers
		this.belttimer = new LCDGame.Timer(this, this.onTimerBelt, 210);
		this.misstimer = new LCDGame.Timer(this, this.onTimerMiss, 200);

		// new game or continue after cutscene
		if (this.lcdgame.level == 0) {
			this.newGame();
		} else {
			this.nextLevel();
		};
	},
	
	// start a new game, reset score level etc.
	newGame: function() {
		// stop any other start
		this.lcdgame.shapesDisplayAll(false);

		// game specific variables
		this.lcdgame.level = 0; // level up after every truck completed
		
		// show "game b" or "game b"
		var gametxt = (this.lcdgame.gametype == 1 ? "game_a" : "game_b");
		this.lcdgame.setShapeByName(gametxt, true);
		
		// reset score, positions etc.
		this.luigipos = 0;
		this.mariopos = 1;
		this.score = 0;
		this.scorePoints(0);
		this.misscount = 0;

		this.caseadd = 0;
		this.caseaddbulk = 2;
		
		// show truck
		this.lcdgame.setShapeByName("truck", true);
	
		this.nextLevel();
		
		// TESTING! start with cases in truck and on top belt
		//this.lcdgame.sequenceSetPos("case10", 1, true);
		//this.lcdgame.sequenceSetPos("case10", 3, true);
		//this.lcdgame.sequenceSetPos("case11", 0, true);
		//this.lcdgame.sequenceSetPos("case11", 2, true);
		//
		//// testing
		//this.truckcases = 0;
		//for (var c = 0; c < 6; c++) {
		//	this.dropcase[c].dropped = 1;
		//	this.dropcase[c].falling = false;
		//	this.lcdgame.sequenceSetPos(this.dropcase[c].seq, this.dropcase[c].max, true);
		//	this.truckcases++;
		//};
		// TESTING!!
	},
	
	// go to next level, possibly after cutscene
	nextLevel: function() {

		// clear drop animations
		this.truckcases = 0;
		for (var c = 0; c < 8; c++) {
			this.dropcase[c].dropped = 0
			this.dropcase[c].falling = false;
			this.dropcase[c].frame = 0;
		};
		
		this.continueGame();
	},
		
	// continue game after a miss (dropped crate)
	continueGame: function() {
		this.gamestate = STATE_GAMEPLAY;
	
		
		// refresh luigi
		this.lcdgame.sequenceClear("luigi_body");
		this.lcdgame.sequenceClear("luigi_arms");
		this.lcdgame.sequenceSetPos("luigi_body", this.luigipos, true);
		this.lcdgame.sequenceSetPos("luigi_arms", (this.luigipos*2), true);
				
		// refresh mario
		this.lcdgame.sequenceClear("mario_body");
		this.lcdgame.sequenceClear("mario_arms");
		this.lcdgame.sequenceSetPos("mario_body", this.mariopos, true);
		this.lcdgame.sequenceSetPos("mario_arms", (this.mariopos*2), true);

		// determine game speed
		// NOTE: the speed varies a lot, possibly due to the electronics design, nr of cases on belts, other unknown game-rules?
		// the speed calculated here is an approximation/average of several measurements
		var msecs = 420;
		if (this.lcdgame.gametype == 1) {msecs = 420 - ((this.lcdgame.level-1) * 20)}; // Game A
		if (this.lcdgame.gametype == 2) {msecs = 380 - ((this.lcdgame.level-1) * 20)}; // Game B
		// limit max.speed. NOTE: not verified so not sure that this limit was also on actual device
		msecs = Math.floor(msecs / 4);
		if (msecs < 80) {msecs = 80};

		this.belttimer.Interval = msecs;
		this.belttimer.Start();

	},

	onTimerBelt: function() {
		// belt timer works as follows
		//    ## ->
		// B ------
		//   <- ## 
		// A ------
		//
		// All left moving belts move in sync
		// First belt A moves, then belt B moves (exactly out of sync).
		// When player moves case from belt A to the next belt B,
		// belt B moves but case stays in place,
		// when belt B moves again only then case also moves

		if (this.gamestate == STATE_GAMEPLAY) {
			// check if grab case
			this.doCheckGrabCase();
			
			// drop case animation
			//if (this.belttimer.Counter % 4 == 0) {
				this.doDropCaseAnimate();
			//};
		};
			
		// smoke animation is in-sync with conveyor belt moves
		// belttimer ticks
		// 1..2..3..4..5..6..7..8..9.. etc.
		// move left^ move right^
		var movebelt = (this.belttimer.Counter % 4 == 0);
		var moveleft = (this.belttimer.Counter % 8 == 0);

		// truck smoke animation, only when almost ready locading cases
		if (this.truckcases >= 6) {
			var smoke = (this.belttimer.Counter % 4); // 0..3
			if (smoke == 0) this.lcdgame.setShapeByName("truck_s3", true);
			if (smoke == 1) this.lcdgame.setShapeByName("truck_s4", true);
			if (smoke == 2) this.lcdgame.setShapeByName("truck_s3", false);
			if (smoke == 3) this.lcdgame.setShapeByName("truck_s4", false);
		};
		
		// check for falling cases
		if (movebelt) {
			this.misscase = 0;
			if (moveleft) {
				// luigi
				if (this.lcdgame.sequenceShapeVisible("case3", -1) && (this.luigipos != 0)) this.misscase = 3;
				if (this.lcdgame.sequenceShapeVisible("case7", -1) && (this.luigipos != 1)) this.misscase = 7;
				if (this.lcdgame.sequenceShapeVisible("case11",-1) && (this.luigipos != 2)) this.misscase = 11;
			} else {
				// mario
				if (this.lcdgame.sequenceShapeVisible("case1", -1) && (this.mariopos != 0)) this.misscase = 1;
				if (this.lcdgame.sequenceShapeVisible("case5", -1) && (this.mariopos != 1)) this.misscase = 5;
				if (this.lcdgame.sequenceShapeVisible("case9", -1) && (this.mariopos != 2)) this.misscase = 9;
			};
			// oh noes! dropped a case
			if (this.misscase != 0) {
				// mario or luigi
				this.misswho = (moveleft ? "luigi" : "mario");
				this.gamestate = STATE_GAMEDROP;
				movebelt = false;
				this.belttimer.Stop();
				this.misstimer.Start();
				// play drop case sound
				this.lcdgame.playSoundEffect("dropcase");
			}
		};

		// check all conveyor belts
		if (movebelt) {
			var anycases = false;
			var beltsound = false;

			// move all conveyor belts
			for (var c = 11; c > 0; c--) {

				// check if any cases at all in game
				var beltcases = false;
				if ( (this.holdcase[c] == true) || ( this.lcdgame.sequenceShapeVisible(("case"+c)) == true) ) {
					beltcases = true;
					anycases = true;
				};

				// check left right
				var docheck = false;
				if ( (moveleft) && ([2,3,6,7,10,11].indexOf(c) > -1) ) {docheck = true};
				if ( (!moveleft) && ([1,4,5,8,9].indexOf(c) > -1) )        {docheck = true};

				if (docheck) {
					// if case goes into middle of bottlemachine, temporary invisible
					hold = this.lcdgame.sequenceShapeVisible(("case"+c), -1);
					this.holdcase[c] = hold;
					
					// move all case on conveyor belt
					this.lcdgame.sequenceShift("case"+c);
					
					// previous
					var hold = this.holdcase[c-1];
					if (hold == true) this.lcdgame.sequenceSetFirst(("case"+(c)), true);

					// play belt move sound if any cases moving left (or right) so do not play sound for each and every case
					if (beltcases == true) beltsound = true;
				};
			};
			
			// play conveyor belt sound
			if (beltsound) {
				this.lcdgame.playSoundEffect("beltmove");
			};
			
			// when no cases in play, then force a new case
			if (anycases == false) {
				this.caseadd = 0;
			};

			// TODO: random generator unknown, add cases more like the original game device
			if (moveleft) {
				this.caseadd--;
				console.log("move belt -- count down to next" + this.caseadd);
				if (this.caseadd <= 0) {
					// add new case
					this.lcdgame.sequenceSetPos("case1", 0, true);
					
					this.caseaddbulk--;
					// add cases consecutively
					if (this.caseaddbulk > 0) {
						this.caseadd = 3;
					} else {
						// waitmax
						var waitmin = 10;
						var waitmax = 40;
						// at start of game wait longer
						if ( (this.lcdgame.level == 1) && (this.truckcases <= 1) ) waitmin = 35;
						// random waiting
						this.caseadd = Math.floor(Math.random() * (waitmax-waitmin)) + waitmin;
						// add 1..3 in bulk
						this.caseaddbulk = Math.floor(Math.random() * 2) + 1; 
					};					
				};
			};
			//if (this.gamestate == STATE_GAMEPLAY) {
			//	if (this.belttimer.Counter % 24 == 0) {
			//		this.lcdgame.sequenceSetFirst("case1", true);
			//		this.lcdgame.sequenceSetFirst("case1", true);
			//	};
			//};
		};

		// refresh shapes
		this.lcdgame.shapesRefresh();
	},
	
	doCheckGrabCase: function() {
		// variable
		var casemove = 0;

		// luigi
		if (this.luigigrab == 0) {
			// luigi, check if case on edge of conveyor belt
			if (this.lcdgame.sequenceShapeVisible("case3", -1) && (this.luigipos == 0)) casemove = 3;
			if (this.lcdgame.sequenceShapeVisible("case7", -1) && (this.luigipos == 1)) casemove = 7;
			if (this.lcdgame.sequenceShapeVisible("case11",-1) && (this.luigipos == 2)) casemove = 11;
			
			// handle luigi grab case
			if (casemove != 0) {
				// start grab animation countdown
				this.lcdgame.playSoundEffect("grabcase");
				this.luigigrab = 3;

				// move case, one conveyor belt upwards
				this.lcdgame.sequenceSetPos(("case"+casemove), -1, false);
				this.lcdgame.sequenceSetPos(("case"+(casemove+1)), 0, true);
				this.scorePoints(1);

				// arms move animations
				this.lcdgame.sequenceSetPos("luigi_arms", (this.luigipos*2), false);
				this.lcdgame.sequenceSetPos("luigi_arms", (this.luigipos*2)+1, true);
				// exception, luigi
				if (this.luigipos == 2) {
					this.lcdgame.sequenceSetPos("luigi_body", this.luigipos, false);
					// drop case on truck
					this.doDropCase();
				};
			};
		} else {
			this.luigigrab--;
			// move arms back to original position
			if (this.luigigrab == 0) {
				this.lcdgame.sequenceSetPos("luigi_arms", (this.luigipos*2), true);
				this.lcdgame.sequenceSetPos("luigi_arms", (this.luigipos*2)+1, false);
				// exception, luigi
				if (this.luigipos == 2) this.lcdgame.sequenceSetPos("luigi_body", this.luigipos, true);
			};
		};

		// mario
		casemove = 0;
		if (this.mariograb == 0) {
			// mario, check if case on edge of conveyor belt
			if (this.lcdgame.sequenceShapeVisible("case1", -1) && (this.mariopos == 0)) casemove = 1;
			if (this.lcdgame.sequenceShapeVisible("case5", -1) && (this.mariopos == 1)) casemove = 5;
			if (this.lcdgame.sequenceShapeVisible("case9", -1) && (this.mariopos == 2)) casemove = 9;
			
			// handle mario grab case
			if (casemove != 0) {
				// start grab animation countdown
				this.lcdgame.playSoundEffect("grabcase");
				this.mariograb = 3;
				
				// move case, one conveyor belt upwards
				this.lcdgame.sequenceSetPos(("case"+casemove), -1, false);
				this.lcdgame.sequenceSetPos(("case"+(casemove+1)), 0, true);
				this.scorePoints(1);

				// arms move animations
				this.lcdgame.sequenceSetPos("mario_arms", (this.mariopos*2), false);
				this.lcdgame.sequenceSetPos("mario_arms", (this.mariopos*2)+1, true);
			};
		} else {
			this.mariograb--;
			// move arms back to original position
			if (this.mariograb == 0) {
				this.lcdgame.sequenceSetPos("mario_arms", (this.mariopos*2), true);
				this.lcdgame.sequenceSetPos("mario_arms", (this.mariopos*2)+1, false);
			};
		};
	},
	
	doDropCase: function() {
		// find an ampty spot
		for (var c = 0; c < 8; c++) {
			if ( (this.dropcase[c].dropped == 0) && (this.dropcase[c].falling == false) ){
				console.log("doDropCase -- found non-dropped case, c=" + c + " frame="+this.dropcase[c].frame + " seq="+this.dropcase[c].seq);
				this.dropcase[c].falling = true;
				this.dropcase[c].fallsync = ((this.belttimer.Counter-1) % 4);
				this.truckdrop = true;
				break;
			};
		};
	},
	
	doDropCaseAnimate: function() {

		// right pile on truck
		if (this.truckdrop) {
			// assume animation is ready
			this.truckdrop = false;
			// check if any case if falling
			for (var c = 0; c < 8; c++) {
				if (this.dropcase[c].falling) {
					// animation continues
					this.truckdrop = true;
					var seq = this.dropcase[c].seq;
					
					// check if time to move one over
					if (this.belttimer.Counter % 4 == this.dropcase[c].fallsync) {
						// move one down
						//this.lcdgame.sequenceSetPos("case12", 0, false); // top case held by luigi
						this.lcdgame.sequenceSetPos(seq, this.dropcase[c].frame, false);
						this.dropcase[c].frame++;
						this.lcdgame.sequenceSetPos(seq, this.dropcase[c].frame, true);
						// check if finished falling
						if (this.dropcase[c].frame >= this.dropcase[c].max) {
							this.dropcase[c].falling = false;
							this.dropcase[c].dropped = 1;
							this.truckcases++;

							// driver appears impatiently
							if (this.truckcases == 6) {
								this.lcdgame.setShapeByName("driver", true);
							};
							// if game won
							if (this.truckcases == 8) {
								this.gamestate = STATE_GAMEWIN;
								this.belttimer.Stop();
								this.lcdgame.state.start("cutscene");
								// keep smoke animation in cutscene in-sync with smoke during game
								this.lcdgame.currentState().smokeframe = this.belttimer.Counter;
							};
						};
					};
				};
			};
		};
	},

	scorePoints: function(pts) {
		this.score = this.score + pts;
		// display score
		this.lcdgame.digitsDisplay("digits", ""+this.score, true);
	},

	// -------------------------------------
	// drop a case animation
	// -------------------------------------
	onTimerMiss: function() {

		var refresh = false;

		var frame = this.misstimer.Counter;
		if (frame == 1) {
			this.lcdgame.sequenceSetPos("case"+this.misscase, -1, false);
			refresh = true;
		} else if (frame == 2) {
			this.lcdgame.sequenceSetPos("case"+this.misscase, -1, true);
			refresh = true;
		} else if (frame == 3) {
			this.lcdgame.sequenceSetPos("case"+this.misscase, -1, false);
			refresh = true;
		} else if (frame == 4) {
			this.lcdgame.sequenceSetPos("case"+this.misscase, -1, true);
			refresh = true;
		} else if (frame == 5) {
			// which crash
			var crash = 3;
			if (this.misscase == 1) crash = 1;
			if ( (this.misscase == 5) || (this.misscase == 9) ) crash = 2;

			// show crash
			this.lcdgame.sequenceSetPos("case"+this.misscase, -1, false);
			this.lcdgame.setShapeByName("crash_"+crash, true);
			
			refresh = true;
		} else if (frame == 7) {
			// which crash
			var crash = 3;
			if (this.misscase == 1) crash = 1;
			if ( (this.misscase == 5) || (this.misscase == 9) ) crash = 2;

			// remove crash
			this.lcdgame.setShapeByName("crash_"+crash, false);
		} else if ([9,10,13,16,19].indexOf(frame) > -1) {
			// initialise luigi/mario and foreman
			if (frame == 9) {
				// clear luigi or mario
				this.lcdgame.sequenceClear(this.misswho+"_body");
				this.lcdgame.sequenceClear(this.misswho+"_arms");
				// set foreman and luigi or mario
				this.lcdgame.setShapeByName(this.misswho+"_body5", true);
				this.lcdgame.setShapeByName(this.misswho+"_foreman", true);
			};
			
			// bow down or up
			var bowdown = ( (frame == 10) || (frame == 16) );

			// bow
			this.lcdgame.setShapeByName(this.misswho+"_bow1", !bowdown);
			this.lcdgame.setShapeByName(this.misswho+"_bow2", bowdown);
			
			// foreman smoke air puff and arm
			this.lcdgame.setShapeByName(this.misswho+"_foreman_s", bowdown);
			this.lcdgame.setShapeByName(this.misswho+"_foreman_a1", !bowdown);
			this.lcdgame.setShapeByName(this.misswho+"_foreman_a2", bowdown);

			refresh = true;
		} else if (frame >= 22) {
			
			// count miss
			this.misscount++;
			this.lcdgame.setShapeByName("miss_"+this.misscount, true);
			if (this.misscount == 1) {this.lcdgame.setShapeByName("miss", true)};

			// clear foreman
			this.lcdgame.setShapeByName(this.misswho+"_foreman", false);
			this.lcdgame.setShapeByName(this.misswho+"_foreman_s", false);
			this.lcdgame.setShapeByName(this.misswho+"_foreman_a1", false);
			this.lcdgame.setShapeByName(this.misswho+"_foreman_a2", false);
			
			this.lcdgame.setShapeByName(this.misswho+"_body5", false);
			this.lcdgame.setShapeByName(this.misswho+"_bow1", false);
			this.lcdgame.setShapeByName(this.misswho+"_bow2", false);

			this.misstimer.Stop();

			// game over or continue
			if (this.misscount >= 3) {
				// game over
				this.gamestate = STATE_GAMEOVER;
			} else {
				// continue
			if (this.misswho == "luigi") {this.luigipos = 0} else {this.mariopos = 1}; // resets positions
				this.continueGame();
			};

			refresh = true;
		};
		
		// refresh shapes
		if (refresh) this.lcdgame.shapesRefresh();
	},

	// -------------------------------------
	// player input
	// -------------------------------------
	input: function(btn, idx) {
		// determine state of gameplay
		console.log("mario bros -- handleInput " + btn + ", idx=" + idx + " this.gamestate="+this.gamestate);

		// button press sounds		
		//if ( (btn == "luigi") || (btn == "mario") ) {
		//	if (idx == 0) {
		//		this.lcdgame.playSoundEffect("btn_moveup");
		//	} else {
		//		this.lcdgame.playSoundEffect("btn_movedown");
		//	};
		//} else {
		//	this.lcdgame.playSoundEffect("btn_small");
		//};
		if (this.gamestate == STATE_GAMEOVER) {
			// button to start game
			if ( (btn == "gamea") || (btn == "gameb") ) {
				this.lcdgame.gametype = (btn == "gamea" ? 1 : 2); // 1=game a, 2=game b
				this.newGame();
			};
		} else { //if (this.gamestate == STATE_GAMEPLAY) {
			// which button, up or down
			if (btn == "luigi") {
				var update = false;
				// move up
				if ( (idx == 0) && (this.luigipos < 2) ) {
					this.luigipos++;
					update = true;
				};
				// move down
				if ( (idx == 1) && (this.luigipos > 0) ) {
					this.luigipos--;
					update = true;
				}
				// move
				if (update) {
					// move sound
					this.lcdgame.playSoundEffect("move");
					// refresh shapes
					this.lcdgame.sequenceClear("luigi_body");
					this.lcdgame.sequenceClear("luigi_arms");
					this.lcdgame.sequenceSetPos("luigi_body", this.luigipos, true);
					this.lcdgame.sequenceSetPos("luigi_arms", (this.luigipos*2), true);
				};
			};
			if (btn == "mario") {
				var update = false;
				// move up
				if ( (idx == 0) && (this.mariopos < 2) ) {
					this.mariopos++;
					update = true;
				}
				// move down
				if ( (idx == 1) && (this.mariopos > 0) ) {
					this.mariopos--;
					update = true;
				}
				// move
				if (update) {
					// move sound
					this.lcdgame.playSoundEffect("move");
					// refresh shapes
					this.lcdgame.sequenceClear("mario_body");
					this.lcdgame.sequenceClear("mario_arms");
					this.lcdgame.sequenceSetPos("mario_body", this.mariopos, true);
					this.lcdgame.sequenceSetPos("mario_arms", (this.mariopos*2), true);
				};
			};
		};
	}
}

// =============================================================================
// cut scene between levels, truck full and drive away
// =============================================================================
mariobros.CutScene = function(lcdgame) {
	this.lcdgame = lcdgame;
	this.animatetimer;
	this.smokeframe=0;
}
mariobros.CutScene.prototype = {
	init: function(){
		this.animatetimer = new LCDGame.Timer(this, this.onTimerAnimate, 187); // 320bpm = 0.1875s
		this.animatetimer.Start();
	},
	input: function(btn) {
	},

	// -------------------------------------
	// level finish animations
	// -------------------------------------
	onTimerAnimate: function() {
		var refresh = false;

		var frame = this.animatetimer.Counter;
		
		if (frame == 1) {
			this.lcdgame.setShapeByName("driver", false);
		};
		
		// truck smoke animation, only when almost ready locading cases
		if (frame < 30) {
			refresh = true;
		
			// smoke animation in sync with smoke during game
			var smoke = frame + this.smokeframe;
			var smoke = (frame > 21 ? ((smoke >> 1) % 4) : (smoke % 4) );
			
			// smoke on/off
			switch(smoke) {
				case 0:
					this.lcdgame.setShapeByName("truck_s3", true);
					break;
				case 1:
					this.lcdgame.setShapeByName("truck_s4", true);
					break;
				case 2:
					this.lcdgame.setShapeByName("truck_s3", false);
					break;
				default:
					this.lcdgame.setShapeByName("truck_s4", false);
					break;
			};
		};
		
		if (frame <= 10) {
			// score 10 points, beep sound for each point
			this.lcdgame.state.states["maingame"].scorePoints(1);
			refresh = true;
			// bonus points sound
			this.lcdgame.playSoundEffect("bonuspoint");
		} else if (frame == 20) {
			// remove truck
			this.lcdgame.sequenceClear("case12");
			this.lcdgame.sequenceClear("case13");
			this.lcdgame.setShapeByName("truck", false);
			refresh = true;
		} else if (frame == 21) {
			// stripes
			this.lcdgame.setShapeByName("truck_s1", true);
			this.lcdgame.setShapeByName("truck_s2", true);
			refresh = true;
		} else if (frame == 25) {
			// stripes gone
			this.lcdgame.setShapeByName("truck_s1", false);
			this.lcdgame.setShapeByName("truck_s2", false);
			refresh = true;
		} else if (frame == 29) {
			// stripes
			this.lcdgame.setShapeByName("truck_s1", true);
			this.lcdgame.setShapeByName("truck_s2", true);
			refresh = true;
		} else if (frame == 30) {
			// stripes gone
			this.lcdgame.setShapeByName("truck_s1", false);
			this.lcdgame.setShapeByName("truck_s2", false);
			this.lcdgame.setShapeByName("truck_s3", false);
			this.lcdgame.setShapeByName("truck_s4", false);
			refresh = true;
		} else if (frame == 32) {
			// clear mario/luigi
			this.lcdgame.sequenceClear("luigi_body");
			this.lcdgame.sequenceClear("luigi_arms");
			this.lcdgame.sequenceClear("mario_body");
			this.lcdgame.sequenceClear("mario_arms");
			// mario/luigi resting
			this.lcdgame.sequenceSetPos("luigi_body", 3, true);
			this.lcdgame.sequenceSetPos("mario_body", 3, true);
			refresh = true;
		} else if (frame == 38) {
			// air puff
			this.lcdgame.setShapeByName("luigi_breath", true);
			this.lcdgame.setShapeByName("mario_breath", true);
			refresh = true;
		} else if (frame == 41) {
			// air puff gone
			this.lcdgame.setShapeByName("luigi_breath", false);
			this.lcdgame.setShapeByName("mario_breath", false);
			refresh = true;
		} else if (frame == 46) {
			// air puff
			this.lcdgame.setShapeByName("luigi_breath", true);
			this.lcdgame.setShapeByName("mario_breath", true);
			refresh = true;
		} else if (frame == 48) {
			// empty truck appears
			this.lcdgame.setShapeByName("truck", true);
			refresh = true;
		} else if (frame == 49) {
			// air puff gone
			this.lcdgame.setShapeByName("luigi_breath", false);
			this.lcdgame.setShapeByName("mario_breath", false);
			refresh = true;
		} else if (frame == 58) {
			// luigi foreman appears
			this.lcdgame.sequenceShift("luigi_body");
			this.lcdgame.setShapeByName("luigi_bow1", true);
			
			this.lcdgame.setShapeByName("luigi_foreman", true);
			this.lcdgame.setShapeByName("luigi_foreman_a1", true);

			// mario foreman appears
			this.lcdgame.sequenceShift("mario_body");
			this.lcdgame.setShapeByName("mario_bow1", true);
			
			this.lcdgame.setShapeByName("mario_foreman", true);
			this.lcdgame.setShapeByName("mario_foreman_a1", true);
			refresh = true;
		} else if (frame > 64) {
			// continue game
			this.lcdgame.sequenceClear("luigi_body");
			this.lcdgame.sequenceClear("mario_body");
			
			this.lcdgame.setShapeByName("luigi_bow1", false);
			this.lcdgame.setShapeByName("mario_bow1", false);
			
			this.lcdgame.setShapeByName("luigi_foreman", false);
			this.lcdgame.setShapeByName("luigi_foreman_a1", false);
			
			this.lcdgame.setShapeByName("mario_foreman", false);
			this.lcdgame.setShapeByName("mario_foreman_a1", false);
			
			// continue game state, and count next level
			this.animatetimer.Stop();
			this.lcdgame.level++; // next level
			this.lcdgame.state.start("maingame");
			refresh = true;
		};

		// refresh shapes
		if (refresh) this.lcdgame.shapesRefresh();
	},
}
