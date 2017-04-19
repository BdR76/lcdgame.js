lcdgame.js
==========
lcdgame.js is a JavaScript library with the goal of creating high quality LCD 
game simulators that can run in any browser. 

Work in progress
----------------
At this point the lcdgame.js library is very much a work-in-progress project. 
The games "Highway" and "Mario Bros" work and another game "Sea Ranger" has a
very basic demo mode. It doesn't work properly on mobile or tablets yet. 

![preview screenshot](https://raw.githubusercontent.com/BdR76/lcdgame.js/master/lcdgamejs_preview.png)

[play Highway here](http://bdrgames.nl/lcdgames/highway)  
[play Mario Bros here](http://bdrgames.nl/lcdgames/mariobros)

What are LCD games
------------------
Nintendo released its Game & Watch series in 1980, which were electronic
handheld toys that used LCD crystals to display flickering shapes. The shapes
could only be turned on or off, creating a crude form of interactive animation
to form games. These were some of the earliest handheld gaming devices, years
before the release of the GameBoy.

Followed the success of Game & Watch, many other companies incl. Gakken,
Tandy, Radio Shack, Sunwing, Tiger, Tomy started creating their own lcd games
(sometimes called "card games"). Over the years hundreds, maybe thousands, of
[different games](http://handheldempire.com/games.jsp) were created.

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

GIMP photo editor
-----------------
Use the GIMP editor to arrange photos and select all the segments and buttons as paths.

See example: [high resolution GIMP images](https://drive.google.com/drive/folders/0B414aIL7Bhz-aFlLNDVhUWVrNVE?usp=sharing)

The library read the shapes of a game from a compiled png file and a json file.
The sprite sheet is compatible with the JSON-array format. It has some extra
data also put into it so that it's all in one JSON file. Because the segments
(sprites) in LCD games typically do not move around the screen, they stay
statically in one place, so the shapes json file also contains the fixed
on-screen position for each shape. 

The shapes png and json file can be previewed using the editor. The editor 
is still a bit crude and clunky, but it get's the job done. 

The idea is to create two separate images in GIMP and then export all segments
using paths, then create a JSON arry sprite sheet (for example using [Leshy SpriteSheet Tool](https://www.leshylabs.com/apps/sstool/).
Note that taking a good picture of the game and editing the photo's into a 
usable photo for a simlator takes a lot of time. See the files of the existing 2 
games to see how it works. 
 
Roadmap/goals
-------------
The lcdgame.js is work-in-progress, here is a goals checklist/roadmap of
still missing features.

* add touch support for buttons
* scale to fit screen
* playable on any device (win, mac, ipad etc.)
* add a better state manager (demo, game)
* sound mp3/wav based on browsertype
* Shapes editor, allow shapes change position, mouse drag/move
* Shapes editor, support/preview/edit types (normal shape, digit, digit position, button)
* Shapes editor, copy shape (for digit positions)
* add menu, overlay in separate dom-element (sound off, buttons reset etc.)
* add high scores list (both local and shared)
* add key hints (separate dom-elements?)
* allow button/keys re-mapping
* and of course, add more games ;)

History
-------
19-apr-2017 v0.2 Mario bros available, better compatibility, utilities and tools  
10-nov-2015 v0.1 first release of lcdgame.js and shape editor on github

See also the [html5gamedevs forum](http://www.html5gamedevs.com/topic/8204-lcd-game-simulator-engine-using-html5js/)  
Questions, comments -- Bas de Reuver (bdr1976@gmail.com)
