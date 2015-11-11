lcdgame.js
==========
lcdgame.js is a JavaScript library with the goal of creating high quality LCD 
game simulators that can run in any browser. 

Work in progress
----------------
At this point the lcdgame.js library is very much a work-in-progress project. 
Only one game "Highway" works and another game "Sea Ranger" only has a very 
basic demo mode. It doesn't work properly on mobile or tablets yet. 

What are LCD games
------------------
Before the GameBoy was introduced, electronics companies including Nintendo were 
making small handheld toys that used LCD crystals to display flickering shapes. 
The shapes could only be turned on or off, creating a crude form of animation. 

Companies incl. Gakken, Tandy, Radio Shack, Sunwing, Tiger, Tomy called these 
games "card game" or just electronic lcd game, while Nintendo called their line 
"Game & Watch". Over the years hundreds (maybe thousands) of [different 
games](http://handheldempire.com/games.jsp) were created. 

What is lcdgames.js
--------------------
lcdgame.js is a JavaScript library for creating LCD game simulators. It works 
based on a shapes.png and a JSON file which can be created with the 
shapes_editor.html. 

Direct inspiration is a very cool site called 
[pica-pic](http://www.pica-pic.com/) by 
[Hipopotam](http://www.hipopotamstudio.pl/). On the site there are 26 playable 
simulations of lcd games. The simulators on pica-pic work great but it is based 
on Flash, making the games unplayable on tablets and some browsers. 

The goal of lcdgame.js is to create high quality LCD game simulators that can 
run in any browser using html5 and JavaScript. Lcd games are relatively easy, 
they don't require fancy sprite animations or scaling and fading effects, or 
html DOM-manipulation. So the goal is to develop lcdgame.js as a stand-alone 
library, so without the use of external libraries like jQuery, Angular.js, 
Phaser.js etc. 

Shapes editor
-------------
The library read the shapes of a game from a compiled png file and a json files. 
The png file is similar to a sprite sheet, in that it contains the location and 
size of each sprite in the sprite sheet. However, the sprites don't need to move 
around the screen, so the shapes json file also contains the fixed on-screen 
position for each shape. 

The shapes png and json file can easily be created using the editor. The editor 
is still a bit crude and clunky, but it get's the job done. 

The idea is to create two separate in Painshop or Photoshop, and then load them 
into the editor and start marking, naming and numbering the individual shapes. 
Note that taking a good picture of the game and editing the photo's into a 
usable photo for a simlator takes a lot of time. See the files of the existing 2 
games to see how it works. 
 
Goals checklist
---------------

* (++) LCD games simulator
* (++) Open source
* (++) Standardised interface and file structure
* (++) Re-use code and editor
* (+-) Fully functional without extra libraries
* (+-) Easily add new games
* (--) Should work on any device (win, mac, ipad etc.)
* (--) Automatically scale-to-fit
* (--) Extra features like highscores etc.

(++) = ready, (+-) = not quite working, (--) = future goal, not implemented

History
-------
10-nov-2015 v0.1 first release of lcdgame.js and shape editor on github

See also the [html5gamedevs forum](http://www.html5gamedevs.com/topic/8204-lcd-game-simulator-engine-using-html5js/)  
Questions, comments -- Bas de Reuver (bdr1976@gmail.com)
