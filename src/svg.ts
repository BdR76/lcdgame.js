import { Button, ButtonType, DigitGroup, Frame, GameConfig } from "./@types";

export const BUTTON_CLASSNAME = 'svgButton';
const SHAPE_CLASSNAME = 'svgShape';
const VISIBLE_SHAPE_CLASSNAME = 'on';

interface AttributesObject {
	[key: string]: string | number;
}

function fetchImage(url:string):Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onerror = (error):void => {
			reject(error);
		};
		image.onload = () => {
			resolve(image);
		};
		image.src = url;
	});
}

function getButtonFrameNames(buttons:Button[]):string[] {
	return buttons.map(button => button.frames).flat();
}

function getButtonDirection(name:string):string {
	return name.substring(name.lastIndexOf('_') + 1);
}

function getClipPathId(name:string):string {
	return `svg-clippath-${name}`;
}

function getDigitFrameId(groupName:string, positionIndex:number|string, value:string):string {
	return `svg-frame-${groupName}-${positionIndex.toString()}-${value}`;
}

function getDigitFrameNames(digits:DigitGroup[]):string[] {
	return digits.map(digit => [...digit.frames, ...digit.locations]).flat();
}

const framesMap:Map<string, Frame> = new Map();
function getFramesMap(frames: Frame[]): Map<string, Frame> {
	if (framesMap.size === 0) {
		frames.forEach(frame => {
			framesMap.set(frame.filename, frame);
		});
	}
	return framesMap;
}

function getFrameId(name:string):string {
	return `svg-frame-${name}`;
}

function renderAttributes(attributes:AttributesObject):string {
	return Object
		.entries(attributes)
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ');
}

function renderButtons(frames:Frame[], spriteImage:HTMLImageElement, buttons: Button[]) {
	const buttonMap = new Map<string, Button>();
	buttons.forEach(button => {
		return button.frames.forEach(frameName => buttonMap.set(frameName, button));
	});

	return frames.map((frame) => {
		const button = buttonMap.get(frame.filename);

		if (!button) {
			return '';
		}

		const attributes = {
			// @WARNING This uses the _button name_, not the _shape name_ as an ID.
			// The game files use this as an ID.
			'id': getFrameId(button.name),
			'class': `${BUTTON_CLASSNAME} ${SHAPE_CLASSNAME}`,
			'data-name': button.name,
		};

		return `
			<g ${renderAttributes(attributes)}>
				${renderImage(frame, spriteImage)}
				${renderHitBox(frame, button.type)}
			</g>
		`;
	}).join('');
}

function renderClipPath(frame:Frame):string {
	return `
		<clipPath id="${getClipPathId(frame.filename)}">
			<rect
				width="${frame.frame.w}"
				height="${frame.frame.h}"
				x="${frame.frame.x}"
				y="${frame.frame.y}"
			/>
		</clipPath>
	`;
}

function renderDigitGroups(config:GameConfig, spriteImage: HTMLImageElement):string {
	const map = getFramesMap(config.frames);

	return config.digits.map(digitGroup => {
		return digitGroup.locations.map((locationDigitName, locationIndex) => {
			const locationFrame = map.get(locationDigitName);

			if (!locationFrame) {
				return '';
			}

			return digitGroup.frames.map(digitFrameName => {
				const digitFrame = map.get(digitFrameName);
				const digitFrameValue = digitFrameName.substring(digitFrameName.lastIndexOf('_') + 1);

				if (!digitFrame) {
					return '';
				}

				return renderImage(digitFrame, spriteImage, {
					'id': getDigitFrameId(digitGroup.name, locationIndex, digitFrameValue),
					'class': SHAPE_CLASSNAME,
					'data-digit-group': digitGroup.name,
					'data-digit-position': locationIndex,
					'data-digit-value': digitFrameValue,
					'transform': `translate(${locationFrame.spriteSourceSize.x - digitFrame.frame.x},${locationFrame.spriteSourceSize.y - digitFrame.frame.y})`,
				});
			});
		});
	}).flat(3).join('\n');
}

function renderHitBox(frame:Frame, type:ButtonType):string {
	const { x, y, w, h} = frame.spriteSourceSize;
	let offsetX = x;
	let offsetY = y;
	let width = w;
	let height = h;

	if (type === ButtonType.DPad) {
		const direction = getButtonDirection(frame.filename);
		height = Math.floor(h / 3);
		width = Math.floor(w / 3);

		switch (direction) {
			case "left":
				offsetY += height;
				break;
			case "right":
				offsetX += 2 * width;
				offsetY += height;
				break;
			case "up":
				offsetX += width;
				break;
			case "down":
				offsetX += width;
				offsetY += 2 * height;
				break;
		}
	}

	if (type === ButtonType.UpDown) {
		const direction = getButtonDirection(frame.filename);
		height = Math.floor(h / 2);

		if (direction === "down") {
			offsetY += height;
		}
	}

	return `<rect x="0" y="0" width="${width}" height="${height}" transform="translate(${offsetX}, ${offsetY})" />`;
}

function renderImage(frame: Frame, spriteImage: HTMLImageElement, attributes = {} as AttributesObject):string {
	const attr = {
		'clip-path': `url(#${getClipPathId(frame.filename)})`,
		'height': spriteImage.height,
		'href': spriteImage.src,
		'transform': `translate(${frame.spriteSourceSize.x - frame.frame.x},${frame.spriteSourceSize.y - frame.frame.y})`,
		'width': spriteImage.width,
		'x': "0",
		'y': "0",
		...attributes,
	};

	return `<image ${renderAttributes(attr)} />`;
}

async function render(config:GameConfig):Promise<string> {
	const backgroundImage = await fetchImage(config.imgback);
	const spriteImage = await fetchImage(config.imgshapes);

	const buttonFrameNames = getButtonFrameNames(config.buttons);
	const digitaFrameNames = getDigitFrameNames(config.digits);

	const buttons:Frame[] = [];
	const images:Frame[] = [];

	config.frames.forEach(frame => {
		const { filename } = frame;
		if (buttonFrameNames.includes(filename)) {
			buttons.push(frame);
		} else if (!digitaFrameNames.includes(filename)) {
			images.push(frame);
		}
	});

	const string = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${backgroundImage.width} ${backgroundImage.height}" preserveAspectRatio="xMidYMid meet" version="2.0">
			<defs>
				${config.frames.map(renderClipPath).join('')}
			</defs>
			<image width="${backgroundImage.width}" height="${backgroundImage.height}" href="${backgroundImage.src}" x="0" y="0" />
			${images.map((frame) => renderImage(frame, spriteImage, { id: getFrameId(frame.filename), class: SHAPE_CLASSNAME })).join('')}
			${renderButtons(buttons, spriteImage, config.buttons)}
			${renderDigitGroups(config, spriteImage)}
		</svg>
	`;

	return string;
}

export async function addSVG(config:GameConfig):Promise<void> {
	const html = await render(config);
	const svg = document.getElementById('svg');
	if (svg) {
		svg.innerHTML = html;
	} else {
		console.error('SVG container element missing.');
	}
}

function setElementVisibility(id:string, isVisible:boolean):void {
	const element = document.getElementById(id);

	if (!element) {
		return undefined;
	}
	if (isVisible) {
		element.classList.add(VISIBLE_SHAPE_CLASSNAME);
	} else {
		element.classList.remove(VISIBLE_SHAPE_CLASSNAME);
	}
}

export function setShapeVisibility(name:string, isVisible:boolean):void {
	const id = getFrameId(name);
	setElementVisibility(id, isVisible);
}

export function setShapesVisibility(isVisible:boolean):void {
	document.querySelectorAll(`.${SHAPE_CLASSNAME}`).forEach(element => {
		if (isVisible) {
			element.classList.add(VISIBLE_SHAPE_CLASSNAME);
		} else {
			element.classList.remove(VISIBLE_SHAPE_CLASSNAME);
		}
	});
}

export function setDigitVisibility(groupName:string, position: number, value:string, isVisible: boolean):void {
	const id = getDigitFrameId(groupName, position, value);
	// hide previously visible digit
	document.querySelectorAll(`.${SHAPE_CLASSNAME}.${VISIBLE_SHAPE_CLASSNAME}[data-digit-group="${groupName}"][data-digit-position="${position.toString()}"]:not([data-digit-value="${value}"])`).forEach(element => {
		element.classList.remove(VISIBLE_SHAPE_CLASSNAME);
	});
	setElementVisibility(id, isVisible);
}