Utilities for lcdgame.js
========================

Recommended workflow
--------------------
The recommended workflow to get from high-resolution photographs to a working lcdgame.js game.

1. Take high resolution photos
2. Edit and arrange in GIMP
3. mark segments as paths
4. scale down (keep backup of original hires!)
5. export pngs and json

Note; taking high resolution photos of a LCD device will require some work and
effort. Recommended to use something like 100mm lens or a macro lens. Don't
use a wide angle lens, or you'll get a cuved surface. If possible also
photograph the buttons in up and down positions, using a paperclip or tooth
pick to press the buttons. The tooth pick can easily be erased by editing the
final photo.

After photos are created, import them into [GIMP v2](https://www.gimp.org/),
which is a free and open-source image editor. GIMP can use plug-ins in the
form of Python scripts. See `export_paths_to_png.py` and `export_paths_to_png.py`
which are are two plug-in to process the photos for use in the lcdgmae.js library.
Install GIMP and place the Python files in the following directory:

	.\GIMP 2\lib\gimp\2.0\plug-ins\

After you've put the file in this directory, open GIMP and the plug-ins are available as menu items.

export_paths_to_png.py
----------------------
This plug-in can export paths to separate PNG files, along with a JSON file
containing all the original coordinates of each image. The JSON file can be
used in the editor to merge the coordinates with the spritesheet JSON file.

![GIMP 2.8 with export_paths_to_png plug-in](/utils/export_paths_to_png.png.png?raw=true "preview")

set_paths_visibility.py
-----------------------
Because the LCD photos will typically have a large amount of paths, managing
these paths in GIMP is difficult. By default GIMP doesn't have an option to
make all paths visible or invisible in one click. Use this plug-in to easily
make all paths or certain paths visible or invisible.
Use this in combination with the export_paths_to_png plug-in to export only
certain paths.

![GIMP 2.8 with set_paths_visibility plug-in](/utils/set_paths_visibility.png?raw=true "preview")

Questions, comments -- Bas de Reuver (bdr1976@gmail.com)
