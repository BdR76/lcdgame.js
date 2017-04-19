#!/usr/bin/env python
# coding: utf-8

# Set paths visibility
# Utility script for processing photos and shapes for LCD game simulators.
# For more information see https://github.com/BdR76/lcdgame.js

from gimpfu import *
import os

def set_paths_visibility(img, layer, tog, apl, st):
	
	# iterate all paths (internally called "vectors")
	for v in img.vectors:
		if (apl == 0):
			v.visible = tog		# apply to all
		else:
			if st in v.name:	# apply when pathname contains..
				v.visible = tog

# tell gimp about our plugin
register(
	"python_fu_set_paths_visibility",
	"Set paths visibility for all paths or based on path name",
	"Set paths visibility for all or based on name, for use with lcd game simulators",
	"Bas de Reuver",
	"Bas de Reuver",
	"2017",
	"<Image>/Tools/Set paths visibility", # menu path
	"",	  # Create a new image, don't work on an existing one
	[
		(PF_RADIO,  "p1", "Toggle paths:", 1, (("Invisible", 0), ("Visible", 1))),
		(PF_RADIO,  "p2", "Apply to paths:", 1, (("All", 0), ("Based on name", 1))),
		(PF_STRING, "p3", "Name contains\n(case sensitive):", "test")
	],
	[],
	set_paths_visibility
)

main()
