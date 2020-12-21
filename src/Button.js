// LCD game JavaScript library
// Bas de Reuver (c)2018

// -------------------------------------
// button object
// -------------------------------------
const Button = function (lcdgame, name) {
	// save reference to game object
	this.lcdgame = lcdgame;
	this.name = name;
	this.keycodes = [];

	// do a guess
	// save reference to game object

	//TODO: add support for buttons types
	//button type="button"		ok
	//button type="updown"		ok
	//button type="leftright"	ok
	//button type="dpad"		TODO
	//button type="diagonal"	TODO
	//button type="switch"		TODO

};

export default Button;