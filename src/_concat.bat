REM // LCD game JavaScript library
REM // Bas de Reuver (c)2018

del ..\bin\lcdgame.js

echo /* LCD game JavaScript library -- by BdR 2018 */>> ..\bin\lcdgame.js
echo.>> ..\bin\lcdgame.js

type System.js >> ..\bin\lcdgame.js
type State.js >> ..\bin\lcdgame.js
type StateManager.js >> ..\bin\lcdgame.js
type AnimationFrame.js >> ..\bin\lcdgame.js


type Menu.js >> ..\bin\lcdgame.js
type Highscores.js >> ..\bin\lcdgame.js

type Game.js >> ..\bin\lcdgame.js
type Shape.js >> ..\bin\lcdgame.js
type Button.js >> ..\bin\lcdgame.js
type Timer.js >> ..\bin\lcdgame.js


REM // then js compress using https://jscompress.com/

echo You still have to manually compress resulting js file using https://jscompress.com/

pause