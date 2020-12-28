// LCD game JavaScript library
// Bas de Reuver (c)2018

import { hideScorebox } from './Highscores';
import { tinyMarkDown } from './utils';

export const INFOBOX_ID = 'infobox';

export function displayInfobox() {
	hideScorebox();
	if (document.getElementById("infobox")) {
		document.getElementById("infobox").style.display = "inherit";
	}
}

export function hideInfobox() {
	if (document.getElementById("infobox")) {
		document.getElementById("infobox").style.display = "none";
	}
}

export function renderInfoBox(data) {
	const instr = tinyMarkDown(data.gameinfo.instructions.en);

	const infobox = document.createElement('div');
	infobox.setAttribute('id', INFOBOX_ID);
	infobox.setAttribute('class', INFOBOX_ID);

	infobox.innerHTML =
		'<div id="infocontent">' +
		'	<h1>How to play</h1>' + instr +
		'</div>' +
		'<a class="mybutton btnpop" onclick="LCDGame.hideInfobox();">Ok</a>';

	document.body.appendChild(infobox);
}