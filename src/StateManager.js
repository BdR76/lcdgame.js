// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// the state manager
// -------------------------------------

/**
 * @param {LCDGame.Game} lcdgame
 */
const StateManager = function (lcdgame) {
	this.lcdgame = lcdgame;
	this._currentState = "";
	this._pendingState = "";
	this.states = {}; // hold all states
};

StateManager.prototype = {

	add: function (key, state) {
		//state.game = this.game;
		this.states[key] = new state(this.lcdgame);

		this._pendingState = key;

		return state;
	},

	start: function (key) {

		this.lcdgame.cleartimers();

		if (this._currentState) {
			this.states[this._currentState].destroy;
			this._currentState = "";
		}
		this._pendingState = key;
		//this._currentState = key;
		//this.states[this._currentState].init();
	},

	currentState: function () {

		if (this._currentState) {
			return this.states[this._currentState];
		}
	},

	checkSwitch: function () {
		// switch to next state
		if (this._currentState != this._pendingState) {
			this._currentState = this._pendingState;
			this.states[this._currentState].init();
		}
	}

};

export default StateManager;
