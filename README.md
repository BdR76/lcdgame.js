# super-lcdgame.js 🎮

This project is a [fork](https://github.com/BdR76/lcdgame.js/pull/7#issuecomment-753530668) of [lcdgame.js](https://github.com/BdR76/lcdgame.js).

## Run

You need to build the sources using `npm run build` and run a webserver using `npm run serve:local`.

The original games can also be played online on [Bas de Reuver's website](http://bdrgames.nl/lcdgames/).

## Changes from lcdgame.js

- replaces `<canvas />` with `<svg />`.
- drops support for browsers who don't support ES2020.
- add Typescript support (in progress).
- remove online tracking of Highscores, to comply with privacy laws and not require a consent banner

## License & Copyright

As most of the code in this repository was authored by Bas de Reuver and he retains the copyright, that is still the case. Files copyrighted by him will contain the copyright header.

The artwork is licensed under [Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/) license by Bas de Reuver.

All other code is licensed under the ISC License.

## See also

- [Sean Riddle's Website](https://seanriddle.com) - Sean is *decapping* old LCD games to read the ROMs directly from the chip and emulate them in MAME. Check out the [Sharp SM5 Microcontroller](http://seanriddle.com/sharpsm5.html) page to see how popular Tiger Electronics and Nintento Game&Watch handhelds were preserved.
- [Handheld Empire](http://handheldempire.com/) - An open-collaboration catalogue of handheld LCD Games.
- [Handheld Games Museum](https://www.handheldmuseum.com/) - A extensive catalogue of handheld LCD Games.
- [Handheld History](https://archive.org/details/handheldhistory) - Handheld games on archive.org, playable online.
- [Some Very Entertaining Plastic, Emulated at the Archive](http://blog.archive.org/2018/03/18/some-very-entertaining-plastic-emulated-at-the-archive/) - how archive.org is preserving LCD Games with the help of the MAME developers.
- [pica-pic](http://www.pica-pic.com/) - LCD Games simulated in Adobe Flash.