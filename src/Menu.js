// LCD game JavaScript library
// Bas de Reuver (c)2018

import { hideScorebox } from './Highscores';

export const MENU_HTML =
		'<div class="container">' +
		'  <canvas id="mycanvas" class="gamecvs"></canvas>' +
		'  <a class="mybutton btnmenu" onclick="LCDGame.displayInfobox();">help</a>' +
		'  <a class="mybutton btnmenu" onclick="LCDGame.displayScorebox();">highscores</a>' +
		'  <div class="infobox" id="infobox">' +
		'    <div id="infocontent">' +
		'      instructions' +
		'    </div>' +
		'    <a class="mybutton btnpop" onclick="LCDGame.hideInfobox();">Ok</a>' +
		'  </div>' +
		'</div>';


export function displayInfobox() {
	hideScorebox();
	document.getElementById("infobox").style.display = "inherit";
	//event.stopPropagation(); // stop propagation on button click event
}

export function hideInfobox() {
	//var target = event.target || event.srcElement;
	// filter event handling when the event bubbles
	//if (event.currentTarget == target) {
	document.getElementById("infobox").style.display = "none";
	//}
}

// -------------------------------------
// menu overlay object
// -------------------------------------
const Menu = function (lcdgame, name) {
	// save reference to game object
	this.lcdgame = lcdgame;
};

export default Menu;
