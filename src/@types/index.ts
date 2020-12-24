export interface SpriteBox {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface SourceSize {
	w: number;
	h: number;
}

export interface Frame {
	filename: string;
	frame: SpriteBox;
	rotated: boolean;
	sourceSize: SourceSize;
	spriteSourceSize: SpriteBox;
	trimmed: boolean;
}

export interface Sequence {
	frames: string[];
	name: string;
}

export interface Digit {
	frames: string[];
	locations: string[];
	max: string;
	name: string;
}

export interface Button {
	defaultkeys: string[];
	frames: string[];
	name: string;
	type: string;
}

export interface Sound {
	filename: string;
	name: string;
}

export interface Size {
	w: number;
	h: number;
}

export interface Meta {
	app: string;
	image: string;
	scale: number;
	size: Size;
	version: string;
}

export interface GameConfig {
	buttons: Button[];
	digits: Digit[];
	frames: Frame[];
	imgback: string;
	imgshapes: string;
	meta: Meta;
	sequences: Sequence[];
	sounds: Sound[];
}
