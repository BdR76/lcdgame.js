// LCD game JavaScript library
// Bas de Reuver (c)2018

LCDGame.State = function () {

    this.lcdgame = null;
    this.key = ""; // state name

    this.statemanager = null;
};

LCDGame.State.prototype = {
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

LCDGame.State.prototype.constructor = LCDGame.State;
