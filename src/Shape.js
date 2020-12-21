// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// shape object
// -------------------------------------
const Shape = function (lcdgame, framename) {
	// save reference to game object
	this.lcdgame = lcdgame;
	this.framename = framename;
	this.idx = 0;
};

export default Shape;