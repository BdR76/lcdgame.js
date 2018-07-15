// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// request animation frame
// -------------------------------------
LCDGame.AnimationFrame = function (lcdgame) {
	// save reference to game object 
	this.lcdgame = lcdgame;
	this.raftime = null;
};

LCDGame.AnimationFrame.prototype = {

    start: function () {
		var vendors = [
			'ms',
			'moz',
			'webkit',
			'o'
		];

		for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++)
		{
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'];
		}

		animationlast = 0.0;

		var _this = this;

		// cannot use requestAnimationFrame for whatever reason, fall back on `setTimeout`
		if (!window.requestAnimationFrame)
		{
			useSetTimeout = true;

			animationLoop = function () {
				return _this.updateSetTimeout();
			};

			_timeOutID = window.setTimeout(this.animationLoop, 0);
		}
		else
		{
			// use requestAnimationFrame
			useSetTimeout = false;

			animationLoop = function (time) {
				return _this.updateAnimFrame(time);
			};

			_timeOutID = window.requestAnimationFrame(animationLoop);
		}
	},
	
    updateAnimFrame: function (rafTime) {
		// floor the rafTime to make it equivalent to the Date.now() provided by updateSetTimeout (just below)
		this.raftime = Math.floor(rafTime);
		this.lcdgame.updateloop(this.raftime);

		_timeOutID = window.requestAnimationFrame(animationLoop);
	},
	
    updateSetTimeout: function () {
		this.raftime = Date.now();
		this.lcdgame.updateloop(this.raftime);

		var ms = Math.floor(1000.0 / 60.0);
		_timeOutID = window.setTimeout(animationLoop, ms);
	}
}
