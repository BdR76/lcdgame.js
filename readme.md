lcdgame.js
==========
lcdgame.js is a JavaScript library for creating high quality LCD game
simulators that can run in any browser. It is compatible with most modern
browsers and several games are fully playable on pc's, laptops, mobile phones
and tablets.

The lcdgame.js library could be updated with bug fixes or possibly
additional game devices, so in that sense it remains work in progress.

![preview screenshot](/lcdgamejs_preview.jpg?raw=true "preview")

[play the LCD games here](http://bdrgames.nl/lcdgames/)  

[Highway](http://bdrgames.nl/lcdgames/games/highway) :: 
[Mario Bros](http://bdrgames.nl/lcdgames/games/mariobros) :: 
[Sea Ranger](http://bdrgames.nl/lcdgames/games/searanger/) :: 
[Tom's Adventure](http://bdrgames.nl/lcdgames/games/tomsadventure/) :: 
[Donkey Kong II](http://bdrgames.nl/lcdgames/games/donkeykong2/) :: 
[Jungle Kong](http://bdrgames.nl/lcdgames/games/junglekong/) :: 
[Eagle n Chicken](http://bdrgames.nl/lcdgames/games/eaglenchicken/) :: 
[Cement Factory](http://bdrgames.nl/lcdgames/games/cementfactory/)

<p align="center">
<b>Support the lcdgames.js project by buying the developer a coffee!</b><br>
<a href="https://www.buymeacoffee.com/bdr76" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
</p>

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

What is lcdgame.js
------------------
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
The lcdgame.js is largly finished, all the main features have been added, but here is a list of
possible future improvements (~~strikethrough~~ is done).

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
* ~~responsive resizing/scaling and display centered~~
* ~~filter options for high score list~~
* sound mp3/wav based on browsertype
* Shapes editor, allow shapes change position, mouse drag/move
* Shapes editor, support/preview/edit types (normal shape, digit, digit position, button)
* Shapes editor, copy shape (for digit positions)
* add key hints and/or tutorial elements (separate dom-elements?)
* allow button/keys re-mapping
* add more games

Simulation vs emulation
-----------------------
Why create simulations when you could also create emulators? Handheld LCD games
typically use a wide range of 4-bit microprocessors (MCU) of which there isn't
much information. Also, the ROMs in these devices are usually embedded in the
MCU, meaning they need to be
["decapped"](https://arstechnica.com/gaming/2017/07/mame-devs-are-cracking-open-arcade-chips-to-get-around-drm/)
to extract the code and data. This also involves taking a microscope image
and visually decoding the zeros and ones. This is feasible, but considering
the sheer amount and variety of different LCD games this is very time
consuming and expensive, not to mention it destroys the MCU in the process.
Therefor it is more practical to create simulations instead of emulators.
Also, a simulator can recreate the entire device, including buttons and
artwork, and not just the screen.

History
-------
31-dec-2019 v0.3.4 added Cement Factory, minor fixes in GUI and highscores   
02-dec-2018 v0.3.3 added Jungle Kong, Eagle n Chicken, added highscore filter options   
08-oct-2018 v0.3.2 added Donkey Kong II, Tom's Adventure, better browser compatibility   
01-jul-2018 v0.3.1 menu, infobox, online highscores   
23-jun-2018 v0.3 added statemanager, preliminary touch and scale   
27-apr-2017 v0.2 Mario bros and Sea Ranger playable, better compatibility, utilities and tools   
10-nov-2015 v0.1 first release of lcdgame.js and shape editor on github

See also the [html5gamedevs forum](http://www.html5gamedevs.com/topic/8204-lcd-game-simulator-engine-using-html5js/)  
Questions, comments -- Bas de Reuver (bdr1976@gmail.com)
