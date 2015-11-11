@echo off

echo --------------------------------------------------------
echo Start Chrome with parameter allow-file-access-from-files
echo --------------------------------------------------------
echo.
echo Close all Chrome sessions and then start with this parameter.
echo This is needed to allow Chrome to load the json files locally from Windows,
echo instead of from an http server.
echo If you load lcdgame or editor on Windows in Chrome without this parameter
echo you'll get the following message in javascript console (ctrl+shift+J)
echo.
echo "XMLHttpRequest cannot load ... Cross origin requests are.." etc.
echo.
echo Starting new Chrome session with --allow-file-access-from-files
echo Now open highway, searanger or shapes_editor in Chrome locally on Windows
echo.

"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files

pause.