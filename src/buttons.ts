// LCD game JavaScript library
// Bas de Reuver (c)2018

import { Button, ButtonType } from "./@types";

/**
 * Get Map of { KeyboardEvent.key: Button.name } from configured Buttons.
 *
 * @param {Button[]} buttons
 * @returns {object}
 */
export function getKeyMapping(buttons:Button[]):Record<string, string> {
	const keyMapping:Record<string, string> = {};
	// map metadata button name to KeyboardEvent.key
	const nameMap:Record<string, string> = {
		'up': 'ArrowUp',
		'down': 'ArrowDown',
		'left': 'ArrowLeft',
		'right': 'ArrowRight',
	};

	buttons.forEach((button) => {
		button.defaultkeys.forEach((keyLabel) => {
			const key = nameMap[keyLabel] || keyLabel;
			keyMapping[key] = button.name;
		});
	});

	return keyMapping;
}

/**
 * Convert dpad, updown to regular buttons. The difference is visual, not functional.
 *
 * Assumes frame names unique for each dpad / updown / leftright group.
 *
 * @param {Button[]} buttons
 * @returns {Button[]}
 */
export function normalizeButtons(buttons:Button[]):Button[] {
	return buttons.map((button) => {
		// e.g. DPAD:
		// {"name":"dpad","type":"dpad","frames":["dpad_up","dpad_down","dpad_left","dpad_right"],"defaultkeys":["up","down","left","right","w","s","a","d"]},

		// e.g. UPDOWN:
		// {"name": "luigi", "type": "updown", "frames": ["btn_luigi_up", "btn_luigi_down"], "defaultkeys": ["q","a","i","k","Home","End"]},
		if (button.type === ButtonType.DPad || button.type === ButtonType.UpDown) {
			return button.frames.map((frameName, index) => {
				return {
					// get every nth key
					defaultkeys: button.defaultkeys.filter((value, keyIndex) => {
						return keyIndex % button.frames.length === index;
					}),
					frames: [frameName],
					name: frameName,
					type: button.type
				};
			});
		}

		return button;
	}).flat();
}