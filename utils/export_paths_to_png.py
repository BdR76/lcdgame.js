#!/usr/bin/env python
# coding: utf-8

# Paths to png export
# Export all paths as PNG and export a file with coordinates.
# Utility script for processing photos and shapes for LCD game simulators.
# For more information see https://github.com/BdR76/lcdgame.js

# This script is partly based on python_fu_web_split by j.f.garcia

from gimpfu import *
import os
import re

COORDs = ""

def repl(s, chars):
	str = s
	for n in chars:
		str = str.replace(n, "")
	return str

def layer_set_visible(img, layername, vis):
	
	# iterate all layers and check for name
	for l in gimp.image_list()[0].layers:
		if l.name == layername:
			l.visible = vis
	return

def save_selection(image, img_path, vect, postfix):
	# variables
	global COORDs

	# path name can contain layer name, for example "btn_left [layer dpad LEFT button]"
	path_name = vect.name;
	layer_name = '';
	pos = path_name.find('[')
	if pos >= 0:
		layer_name = re.search('\[([^\]]+)', path_name).group(1);
		path_name = path_name[:pos].strip();

	# prepare export filename based on path name
	img_name = path_name.replace(" ", "_") + postfix
	img_name = repl(img_name, "#<>,'\"/=%?¿!¡") # remove illegal chars
	filename = "%s\%s.%s" % (img_path, img_name, "png")

	# create selection based on path
	pdb.gimp_image_select_item(image, CHANNEL_OP_REPLACE, vect)
	
	# determine max x/y of selection
	non_empty, x1, y1, x2, y2 = pdb.gimp_selection_bounds(image)
	
	# add coordinates to variable
	if (COORDs != ""): COORDs = COORDs + ",\n"
	COORDs = COORDs+("\t\t{\"filename\":\"%s\", \"spriteSourceSize\":{\"x\": %d, \"y\": %d, \"w\": %d, \"h\": %d}}"  % (img_name , x1, y1, (x2-x1), (y2-y1)))

	# if layer is specified, make the layer visible
	if layer_name != '':
		layer_set_visible(image, layer_name, True);
	
	# copy and paste as new temporary image
	# pdb.gimp_edit_copy(image.layers[0])
	pdb.gimp_edit_copy_visible(image)
	tmp_img = pdb.gimp_edit_paste_as_new()

	# save to file and clean up temporary image
	pdb.gimp_file_save(tmp_img, tmp_img.active_layer, filename, filename)
	pdb.gimp_image_delete(tmp_img)
	
	# if layer was specified, reset layer visibility
	if layer_name != '':
		layer_set_visible(image, layer_name, False);

	return
	
def export_paths_to_pngs(img, layer, path, vis, pfx):

	# if (vis == 0): pdb.gimp_message('export_paths_to_pngs vis=0 all!!')
	# if (vis == 1): pdb.gimp_message('export_paths_to_pngs vis=1 visible only!!')
	# if (vis == 2): pdb.gimp_message('export_paths_to_pngs vis=2 INvisible only!!')
	
	# trim any spaces
	pfx = pfx.strip()
	
	# iterate all paths (internally called "vectors")
	for v in img.vectors:
		# only visible paths
		if (vis == 0) or ((v.visible) and (vis == 1)) or ((not v.visible) and (vis == 2)):
			save_selection(img, path, v, pfx)
				
	# export coordinates variable to textfile
	exptxt = file(("%s\\orgcoords.json" % (path)), 'w')
	exptxt.write("{\n\t\"frames\":[\n" + COORDs + "\n\t]\n}\n")
	exptxt.close()


# tell gimp about our plugin
register(
	"python_fu_export_paths_to_png",
	"Export paths as png files",
	"Export all paths as png files, for use with lcd game simulators",
	"Bas de Reuver",
	"Bas de Reuver",
	"2017",
	"<Image>/Filters/Paths/Export paths to png", # menu path
	"",	  # Create a new image, don't work on an existing one
	[
		(PF_DIRNAME, "p1", "Export destination directory", "/tmp"),
		(PF_RADIO,   "p2", "Export paths:", 1, (("All paths", 0), ("Visible paths", 1), ("Invisible paths", 2))),
		(PF_STRING,  "p3", "Add post-fix to filename\n(optional)", "")
	],
	[],
	export_paths_to_pngs
)

main()
