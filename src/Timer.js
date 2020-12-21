// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// pulse timer object
// -------------------------------------
const Timer = function (context, callback, interval, waitfirst) {
	// context of callback
	this.context = context;

	// Event: Timer tick
	this.callback = callback;

	// frequency of the timer in milliseconds
	this.interval = interval || 1000;

	// call callback instantly, or wait one pulse until calling callback
	this.waitfirst = waitfirst;

	// counter, useful for directing animations etc.
	this.counter = 0;

	// maximum counter, useful for directing animations etc.
	this.max = null;

	// Property: Whether the timer is enable or not
	this.enabled = false;

	// Member variable: Hold interval id of the timer
	this.timerId = 0;
	this.lasttime = 0;
};

Timer.prototype = {

	// update each frame
	update: function(timestamp) {

		//debugger;
		var varname = this.callback.name;
		//for (var key in this.context) {
		//	if (this.context.hasOwnProperty(key)) {
		//		if (key.indexOf("timer") >= 0) {
		//			varname = key;
		//			break;
		//		};
		//	};
		//};

		var delta = timestamp - this.lasttime;

		// timer tick
		if (delta >= this.interval) {
			//console.log("LCDGame.Timer<"+varname+">.update() -> delta="+delta+" this.interval="+this.interval+" this.lasttime="+this.lasttime+" this.waitfirst="+this.waitfirst);
			//this.lasttime = timestamp;
			this.lasttime = this.lasttime + this.interval;
			// game callbacks
			this.doTimerEvent();
		}
	},

	// local timer event of Timer-object
	doTimerEvent: function() {
		// keep track how many times event has fired
		this.counter++;

		// do callback function to gameobj, so not to LCDGame.Timer object
		this.callback.call(this.context, this);

		// if maximum of callbacks was set
		if (typeof this.max !== "undefined") {
			if (this.counter >= this.max) this.enabled = false;
		}
	},

	// start/enable the timer
	start: function(max, waitfirst) {
		// change waitfirst only when passed as parameter
		if (typeof waitfirst !== "undefined") this.waitfirst = waitfirst;
		// initialise variables
		this.enabled = true;
		this.counter = 0;
		this.max = max;
		//this.lasttime = 0;
		this.lasttime = (this.context.lcdgame.raf.raftime || 0);
		// start immediately?
		if (this.waitfirst == false) this.lasttime -= this.interval;
	},

	// pause the timer
	pause: function() {
		// initialise variables
		this.enabled = false;
	},

	// unpause the timer; continue but do not reset the counter
	unpause: function() {
		this.lasttime = (this.context.lcdgame.raf.raftime || 0);
		if (this.waitfirst == false) this.lasttime -= this.interval;
		this.enabled = true;
	}
};

export default Timer;