// Highway LCD game simulation
// Bas de Reuver (c)2015

var searanger = {};

searanger.MainGame = function(lcdgame) {
	// save reference to lcdgame object
	this.lcdgame = lcdgame;

	// timers/pulse generators
	this.demotimer = null;
	this.democounter = 0;
}

searanger.MainGame.prototype = {
	initialise: function(){

		// startup show all
		this.lcdgame.shapesDisplayAll(true);
		this.lcdgame.shapesRefresh();
		this.lcdgame.shapesDisplayAll(false);

		// initialise all timers
		this.demotimer  = new LCDGame.Timer(this, this.onTimerDemo, 500);
		this.demotimer.Start();
		this.lcdgame.sequencePush("mainguy",   true);
	},

	// -------------------------------------
	// timer events
	// -------------------------------------
	onTimerDemo: function() {
		// update clock
		if (this.demotimer.Counter % 2 != 0) {
			// demo timer event fired every half second
			this.lcdgame.setShapeValue("timecolon", false);
		} else {
			// only update road every whole second
			this.lcdgame.setShapeValue("timecolon", true);
			this.updateClock();
		};
		
		// random shapes
		this.democounter++;
		
		// timer is on halve seconds, update shapes only on every whole second
		if ( (this.democounter % 2) == 0) {
			// shift all sequences
			this.lcdgame.sequenceShift("coconut");
			this.lcdgame.sequenceShift("shark");
			this.lcdgame.sequenceShift("ship");
			this.lcdgame.sequenceShift("bird");
			
			this.lcdgame.sequenceShift("mainguy");
			this.lcdgame.sequenceShift("lifesaver");
			
			// add random new shapes
			var r1 = Math.floor(Math.random() * 100) + 1; //1..100
			var r2 = Math.floor(Math.random() * 100) + 1; //1..100
			var r3 = Math.floor(Math.random() * 100) + 1; //1..100
			var r4 = Math.floor(Math.random() * 100) + 1; //1..100
			if (r1 < 25) {this.lcdgame.sequencePush("coconut", true)}; this.lcdgame.setShapeValue("monkey", (r1 < 25));
			if (r2 < 25) {this.lcdgame.sequencePush("shark", true) };
			if (r3 < 25) {this.lcdgame.sequencePush("ship", true) };
			if (r4 < 25) {this.lcdgame.sequencePush("bird", true) };

			if ( ( this.democounter    % 14) == 0) {this.lcdgame.sequencePush("mainguy",   true) };
			if ( ((this.democounter+10) % 14) == 0) {this.lcdgame.sequencePush("lifesaver", true) };
		};

		// refresh shapes
		this.lcdgame.shapesRefresh();
	},

	updateClock: function() {
		// get time as 12h clock with PM
		var datenow = new Date();
		//var str = datenow.toLocaleTimeString();
		//var strtime = "" + str.substring(0, 2) + str.substring(3, 5); // example "2359"
		var ihours = datenow.getHours();
		var imin = datenow.getMinutes();
		var isec = datenow.getSeconds();

		// format hours and minutes and seconds
		var strtime = ("  "+ihours).substr(-2) + ("00"+imin).substr(-2);
		var strsec  = ("00"+isec).substr(-2);

		// display time
		this.lcdgame.digitsDisplay("digits",     strtime, false);
		this.lcdgame.digitsDisplay("digitsmall", strsec,  false);
	}
}
