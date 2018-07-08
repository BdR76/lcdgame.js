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
	this.Interval = interval || 1000;

	// counter, useful for directing animations etc.
	this.Counter = 0;

	// maximum counter, useful for directing animations etc.
	this.Max = null;

	// Property: Whether the timer is enable or not
	this.Enabled = false;

	// Member variable: Hold interval id of the timer
	this.timerId = 0;
	this.lasttime = 0;
}
	
LCDGame.Timer.prototype = {

	// update each frame
	update: function(timestamp) {
		var delta = timestamp - this.lasttime;
		
		// timer tick
		if (delta > this.Interval) {
			this.lasttime = timestamp;
			this.doTimerEvent();
		};
	},
	
	// local timer event of Timer-object
	doTimerEvent: function() {
		// keep track how many times event has fired
		this.Counter++;
		// do callback function to gameobj, so not to LCDGame.Timer object

		this.doGameEvent.call(this.context);
		// if maximum of callbacks was set
		if (typeof this.Max !== "undefined") {
			if (this.Counter >= this.Max) this.Enabled = false;
		};
	},

	// start/enable the timer
	Start: function(max) {
		// initialise variables
		this.Enabled = true;
		this.Counter = 0;
		this.Max = max;

		// start interval
		this.lasttime = 0;
	},

	// pause the timer
	pause: function() {
		debugger;
		// initialise variables
		this.Enabled = false;
	}
};
