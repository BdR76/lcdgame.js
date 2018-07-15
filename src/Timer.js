// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// pulse timer object
// -------------------------------------
LCDGame.Timer = function (context, eventfunction, interval) {
	// context of callback
	this.context = context;
	
	// Event: Timer tick
	this.doGameEvent = eventfunction;

	// frequency of the timer in milliseconds
	this.interval = interval || 1000;

	// counter, useful for directing animations etc.
	this.counter = 0;

	// maximum counter, useful for directing animations etc.
	this.max = null;

	// Property: Whether the timer is enable or not
	this.enabled = false;

	// Member variable: Hold interval id of the timer
	this.timerId = 0;
	this.lasttime = 0;
}
	
LCDGame.Timer.prototype = {

	// update each frame
	update: function(timestamp) {
		var delta = timestamp - this.lasttime;
		
		// timer tick
		if (delta > this.interval) {
			this.lasttime = timestamp;
			this.doTimerEvent();
		};
	},
	
	// local timer event of Timer-object
	doTimerEvent: function() {
		// keep track how many times event has fired
		this.counter++;
		// do callback function to gameobj, so not to LCDGame.Timer object

		this.doGameEvent.call(this.context);
		// if maximum of callbacks was set
		if (typeof this.max !== "undefined") {
			if (this.counter >= this.max) this.enabled = false;
		};
	},

	// start/enable the timer
	Start: function(max) {
		// initialise variables
		this.enabled = true;
		this.counter = 0;
		this.max = max;

		// start interval
		this.lasttime = 0;
	},

	// pause the timer
	pause: function() {
		debugger;
		// initialise variables
		this.enabled = false;
	}
};
