// LCD game JavaScript library
// Bas de Reuver (c)2018

const State = function () {

	this.lcdgame = null;
	this.key = ""; // state name

	this.statemanager = null;
};

State.prototype = {
	// additional methods, can implemented by each state
	init: function () {
	},

	preload: function () {
	},

	loadUpdate: function () {
	},

	loadRender: function () {
	},

	create: function () {
	},

	update: function () {
	}
};

State.prototype.constructor = State;

export default State;
