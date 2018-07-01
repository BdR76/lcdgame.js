lcdgame.js
==========
lcdgame.js is a JavaScript library with the goal of creating high quality LCD 
game simulators that can run in any browser. 

Work in progress
----------------
At this point the lcdgame.js library is very much a work-in-progress project. 
The games "Highway", "Mario Bros" and "Sea Ranger" are playable in browsers on
pc's and laptops. It doesn't work properly yet on mobile or tablets. 

![preview screenshot](/lcdgamejs_preview.png?raw=true "preview")

[play Highway here](http://bdrgames.nl/lcdgames/highway)  
[play Mario Bros here](http://bdrgames.nl/lcdgames/mariobros)  
[play Sea Ranger here](http://bdrgames.nl/lcdgames/searanger/)

What are LCD games
------------------
LCD games are electronic toys introduced in the 1980s. Nintendo first released
its Game & Watch series in 1980, which were electronic handheld toys that used
LCD crystals to display flickering shapes. The shapes could only be turned on
or off, creating a crude form of interactive animation to form games. These
were some of the earliest handheld gaming devices, years before the release of
the GameBoy.

Followed the success of Game & Watch, many other companies incl. Gakken,
Tandy, Radio Shack, Sunwing, Tiger, Tomy started creating their own lcd games
(sometimes called "card games"). Over the years hundreds, maybe thousands, of
[different games](http://handheldempire.com/games.jsp) were created.

What is lcdgames.js
--------------------
lcdgame.js is a JavaScript library for creating LCD game simulators. It works 
based on a spritesheet compatible wth json array format, which can be created with a photo editor like GIMP, and the 
shapes_editor.html which is part of this library, for more info [see here](/utils/).

Direct inspiration is a very cool site called 
[pica-pic](http://www.pica-pic.com/) by 
[Hipopotam](http://www.hipopotamstudio.pl/). On the site there are 26 playable 
simulations of lcd games. The simulators on pica-pic work great but it is based 
on Flash, making the games unplayable on tablets and some browsers. 

The goal of lcdgame.js is to create high quality LCD game simulators that can 
run in any browser using html5 and JavaScript. LCD games are relatively easy, 
they don't require fancy sprite animations or scaling and fading effects, or 
html DOM-manipulation. So the goal is to develop lcdgame.js as a stand-alone 
library, without the use of external libraries like jQuery, Angular.js, 
Phaser.js etc. 
 
Roadmap/goals
-------------
The lcdgame.js is work-in-progress, here is a goals checklist/roadmap of
still missing features (~~strikethrough~~ is done).

* ~~Open source~~
* ~~Standardised interface and file structure~~
* ~~Re-use code and editor~~
* ~~Easily add new games~~ (needs improvements)
* ~~add touch support for buttons~~
* ~~scale to fit screen~~ (needs improvements)
* ~~playable on any device~~
* ~~refactor code into separate JavaScript objects~~
* ~~add state manager (to separate time/demo, maingame, bonusgame code)~~
* ~~add gameplay info popup, explanation for each game~~
* ~~add high scores list (local storage)~~
* ~~add menu overlay in separate dom-elements~~
* ~~add high scores list (shared online)~~
* responsive resizing/scaling and display centered
* sound mp3/wav based on browsertype
* Shapes editor, allow shapes change position, mouse drag/move
* Shapes editor, support/preview/edit types (normal shape, digit, digit position, button)
* Shapes editor, copy shape (for digit positions)
* add key hints (separate dom-elements?)
* allow button/keys re-mapping
* and of course, add more games ;)

History
-------
01-jul-2018 v0.3.1 menu, infobox, online highscores   
23-jun-2018 v0.3 added statemanager, preliminary touch and scale   
27-apr-2017 v0.2 Mario bros and Sea Ranger playable, better compatibility, utilities and tools   
10-nov-2015 v0.1 first release of lcdgame.js and shape editor on github

See also the [html5gamedevs forum](http://www.html5gamedevs.com/topic/8204-lcd-game-simulator-engine-using-html5js/)  
Questions, comments -- Bas de Reuver (bdr1976@gmail.com)
