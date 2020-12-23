// LCD game JavaScript library
// Bas de Reuver (c)2018

import { hideScorebox } from './Highscores';
import { tinyMarkDown } from './utils';

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

function onMetadataLoad(data) {
	const container = document.getElementById('container');
	const instr = tinyMarkDown(data.gameinfo.instructions.en);

	const infobox = document.createElement('div');
	infobox.setAttribute('id', INFOBOX_ID);
	infobox.setAttribute('class', INFOBOX_ID);

	infobox.innerHTML =
		'<div id="infocontent">' +
		'	<h1>How to play</h1><br/>' + instr +
		'</div>' +
		'<a class="mybutton btnpop" onclick="LCDGame.hideInfobox();">Ok</a>';

	container.appendChild(infobox);
}

function onMetadataError(xhr) {
	console.log("** ERROR ** lcdgame.js - onMetadataError: error loading json file");
	console.error(xhr);
}

export function fetchMetadata(path) {
	return new Promise((resolve, reject) => {
		var xhrCallback = function() {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if ((xhr.status === 200) || (xhr.status === 0)) {
					const data = JSON.parse(xhr.responseText);
					onMetadataLoad(data);
					resolve(data);
				} else {
					onMetadataError(xhr);
					reject(xhr);
				}
			}
		};

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = xhrCallback.bind(this);

		xhr.open("GET", path, true);
		xhr.send();
	});
}