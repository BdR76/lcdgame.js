Utilities for lcdgame.js
========================

Creating photos
---------------
All original asset photos are here: [high resolution GIMP images](https://drive.google.com/drive/folders/0B414aIL7Bhz-aFlLNDVhUWVrNVE?usp=sharing)

Note that taking high-resolution photos of an LCD device will require some work
and effort. It is recommended to use a tripod instead of holding the camera in
your hand. Using a tripod will make editing and aligning the different photos
much easier. It's also recommended to use something like a 100mm lens or a macro
lens. Don't use a wide angle lens, or you'll get a cuved surface.

![create photos using tripod and macro lens](/utils/createphoto.jpg?raw=true "preview")

If possible also photograph the buttons in all possible positions, using a
paperclip or tooth pick to press the buttons. The tooth pick can easily be
erased by editing the final photo.

![photo of buttons pressed down](/utils/buttonpress.jpg?raw=true "preview")

Recommended workflow
--------------------
The recommended workflow to get from high-resolution photographs to a working
lcdgame.js game is as follows.

![recommended workflow](/utils/workflow.png?raw=true "preview")

#### 1. Edit and arrange photos in GIMP ####
Create high resolution photos and import them into [GIMP](https://www.gimp.org/), which is
a free and open-source image editor. Create one layer with the device turned
off, so no segments are visible. Create another layer with all segments
visible. Arrange the layers so that they overlap and align perfectly.
Select each individual shape and use the menu option "Select > To path" to save
the selection as a "path" in GIMP. Open the Paths dialog under "Windows >
Dockable Dialogs > Paths" and give the path a useful name, like "boatguy_1",
"boatguy_2", "coconut_1" etc.

#### 2. Export pngs and json ####
Export all paths to .png files, using the plug-in explained below.
Remember to always back-up the original image in as high resolution as possible,
even if final result will be in a lower resolution. If necessary create a
separate lower resolution file before exporting.

#### 3. Create sprite sheet ####
Pack all .png into a spritesheet in the JSON-array format,
using [Leshy SpriteSheet Tool](https://www.leshylabs.com/apps/sstool/)
or another tool like [TexturePacker](https://www.codeandweb.com/texturepacker)
or [Phaser Editor](http://phasereditor.boniatillo.com/).

#### 4. Merge coordinate.json in shapeseditor ####
Use the lcdgames.js Shapeeditor to merge the orgcoords.json created in step 2
with the .json file created in step 3. This will add the original x/y
positions of each shape into the spritesheet JSON file, so that the lcdgame.js
library knows where each segment should be located on screen.

The shapes png and json file can be previewed using the editor. The editor is
still a bit crude and clunky, but it's main use is merging the orgcoords.json
file with the spritesheet file.

LCD games are relatively static, therefor all of the game specific
configuration is put neatly into one single JSON file. Next to the sprites,
the .json file also contains configuration for the sequences, digits, buttons
and sounds. Some of this must still be edited by hand using notepad or a text
editor.

GIMP plug-ins
-------------
GIMP can use plug-ins in the form of Python scripts. See
`export_paths_to_png.py` and `export_paths_to_png.py` which are are two
plug-in to process the photos for use in the lcdgmae.js library.
Install GIMP and place the Python files in the following directory:

	.\GIMP 2\lib\gimp\2.0\plug-ins\

After you've put the file in this directory, open GIMP and the plug-ins are available as menu items.

### export_paths_to_png.py ###

This plug-in can export paths to separate PNG files, along with a JSON file
containing all the original coordinates of each image. The JSON file can be
used in the editor to merge the coordinates with the spritesheet JSON file.

![GIMP 2.8 with export_paths_to_png plug-in](/utils/export_paths_to_png.png?raw=true "preview")

### set_paths_visibility.py ###
Because the LCD photos will typically have a large amount of paths, managing
these paths in GIMP is difficult. By default GIMP doesn't have an option to
make all paths visible or invisible in one click. Use this plug-in to easily
make all paths or certain paths visible or invisible.
Use this in combination with the export_paths_to_png plug-in to export only
certain paths.

![GIMP 2.8 with set_paths_visibility plug-in](/utils/set_paths_visibility.png?raw=true "preview")

Questions, comments -- Bas de Reuver (bdr1976@gmail.com)
