// LCD game JavaScript library
// Bas de Reuver (c)2018

import System from './System';
import State from './State';
import StateManager from './StateManager';
import AnimationFrame from './AnimationFrame';
import Menu from './Menu';
import HighScores from './Highscores';
import Game from './Game';
import Shape from './Shape';
import Button from './Button';
import Timer from './Timer';

System.State = State;
System.StateManager = StateManager;
System.AnimationFrame = AnimationFrame;
System.Menu = Menu;
System.HighScores = HighScores;
System.Game = Game;
System.Shape = Shape;
System.Button = Button;
System.Timer = Timer;

window.LCDGame = System;