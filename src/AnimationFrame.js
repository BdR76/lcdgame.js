// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// request animation frame
// -------------------------------------
const AnimationFrame = function (lcdgame) {
	// save reference to game object
	this.lcdgame = lcdgame;
	this.raftime = null;
};

AnimationFrame.prototype = {

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

		var _this = this;

		// cannot use requestAnimationFrame for whatever reason, fall back on `setTimeout`
		if (!window.requestAnimationFrame)
		{
			this.animationLoop = function () {
				return _this.updateSetTimeout();
			};

			window.setTimeout(this.animationLoop, 0);
		}
		else
		{

			this.animationLoop = function (time) {
				return _this.updateAnimFrame(time);
			};

			window.requestAnimationFrame(this.animationLoop);
		}
	},

	updateAnimFrame: function (rafTime) {
		// check if switch to pending new state
		this.lcdgame.state.checkSwitch();

		// floor the rafTime to make it equivalent to the Date.now() provided by updateSetTimeout (just below)
		this.raftime = Math.floor(rafTime);
		this.lcdgame.updateloop(this.raftime);

		window.requestAnimationFrame(this.animationLoop);
	},

	updateSetTimeout: function () {
		// check if switch to pending new state
		this.lcdgame.state.checkSwitch();

		this.raftime = Date.now();
		this.lcdgame.updateloop(this.raftime);

		var ms = Math.floor(1000.0 / 60.0);
		window.setTimeout(this.animationLoop, ms);
	}
};

export default AnimationFrame;