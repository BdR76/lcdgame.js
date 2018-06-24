// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// the state manager
// -------------------------------------
LCDGame.StateManager = function (lcdgame) {
    this.lcdgame = lcdgame;
    this._currentState;
	this.states = {}; // hold all states
};

LCDGame.StateManager.prototype = {

   add: function (key, state) {

		console.log("(typeof state) = " + (typeof state) );

		//state.game = this.game;
        this.states[key] = new state(this.lcdgame);

		this._currentState = key;
	
        return state;
    },
	
    start: function (key) {

		if (this._currentState && (this._currentState != key) ) {
			this.states[this._currentState].destroy;
		};
		this._currentState = key;
		this.states[this._currentState].init();
    },

    currentState: function (key) {

		if (this._currentState && (this._currentState != key) ) {
			return this.states[this._currentState];
		};
    }

};
