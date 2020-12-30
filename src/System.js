// LCD game JavaScript library
// Bas de Reuver (c)2018

import { displayScorebox, hideScorebox } from './Highscores';
import { displayInfobox, hideInfobox } from './Menu';
import Game from './Game';

export const LCDGAME_VERSION = "0.3.4";

/**
 * @namespace LCDGame
 */
const LCDGame = window.LCDGame || {
	loadsounds: null,
	countimages: 0,
	// scale factor
	scaleFactor: 1.0,
	/**
	* Keep score on global variable for highscore
	*
	* @property {score} integer - The game current score
	* @default
	*/
	score: 0,
	/**
	* Which game type or difficulty, for high score purposes to be added later.
	* Has to implemented as seen fit for each individual game.
	* For the game Mariobros it can be 1='Game A', 2='Game B'
	* For the game Searanger it can be 1='Pro 1', 2='Pro 2'. etc.
	*
	* @property {gametype} integer - The game type or difficulty setting of the game
	* @default
	*/
	gametype: 0,
	/**
	* Which current 'level' in the game, for high score purposes to be added later.
	* Has to implemented as seen fit for each individual game.
	* For the game Highway it can be the amount of GAS bonus games played.
	* For the game Mariobros it can be how many trucks completed. etc.
	*
	* @property {level} integer - The current level in game
	* @default
	*/
	level: 0,
	/**
	* Total number of button presses for highscore heuristics
	*/
	buttonpress: 0,
	/**
	* Start time of a gameplay session for highscore heuristics
	*/
	playtimestart: null,
	// events
	onImageLoaded: null,
	onImageError: null,
	canvas: null,
	context2d: null,
	debugtxt: null,

	// Methods
	displayScorebox,
	hideScorebox,
	displayInfobox,
	hideInfobox,

	// Classes
	Game
};

export default LCDGame;

