// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// pulse timer object
// -------------------------------------
LCDGame.Timer = function (game, eventfunction, interval) {
	// save reference to game object 
	this.game = game;

	// frequency of the timer in milliseconds
	this.Interval = interval || 1000;
	
	// counter, useful for directing animations etc.
	this.Counter = 0;

	// maximum counter, useful for directing animations etc.
	this.Max = null;

	// Property: Whether the timer is enable or not
	this.Enable = new Boolean(false);

	// Event: Timer tick
	this.doGameEvent = eventfunction;

	// Member variable: Hold interval id of the timer
	var timerId = 0;

	// local timer event of Timer-object
	this.doTimerEvent = function()
	{
		// keep track how many times event has fired
		this.Counter++;
		// do callback function to gameobj, so not to LCDGame.Timer object
		this.doGameEvent.call(this.game);
		// if maximum of callbacks was set
		if (typeof this.Max !== "undefined") {
			if (this.Counter >= this.Max) this.Stop();
		};
	},

	// start/enable the timer
	this.Start = function(max)
	{
		// initialise variables
		this.Enable = new Boolean(true);
		this.Counter = 0;
		this.Max = max;
		
		// bind callback function to gameobj, so not to LCDGame.Timer object
		var timerEvent = this.doTimerEvent.bind(this);
		
		// start interval
		if (this.Enable)
		{
			// clear any previous
			if (this.timerId) {
				clearInterval(this.timerId);
			};

			// start interval
			this.timerId = setInterval(
				timerEvent,
				this.Interval
			);
		}
	},

	// stop/disable the timer
	this.Stop = function()
	{
		this.Enable = new Boolean(false);
		clearInterval(this.timerId);
	}
};

