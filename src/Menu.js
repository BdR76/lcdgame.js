// LCD game JavaScript library
// Bas de Reuver (c)2018

import { hideScorebox } from './Highscores';
import { request, tinyMarkDown } from './utils';

export const INFOBOX_ID = 'infobox';

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

function renderInfoBox(data) {
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

export async function fetchMetadata(path) {
	try {
		const data = await request(path);
		renderInfoBox(data);
		return data;
	} catch (error) {
		console.log("** ERROR ** lcdgame.js - onMetadataError: error loading json file");
		console.error(error);
	}
}