import { Button, ButtonType, Frame, GameConfig } from "./@types";

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

function getButtonDirection(name:string):string {
	return name.substring(name.lastIndexOf('_') + 1).replace('dn', 'down');
}

function getClipPathId(name:string):string {
	return `svg-clippath-${name}`;
}

function getFrameId(name:string):string {
	return `svg-image-${name}`;
}

function isButton(frame: Frame):boolean {
	return frame.filename.startsWith('btn') || frame.filename.includes('dpad');
}

function renderAttributes(attributes:Record<string, number | string>):string {
	return Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join('\n');
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
			'data-name': button.name,
			'data-type': button.type
		};

		return `
			<g class="svgButton" ${renderAttributes(attributes)}>
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

function renderImage(frame:Frame, spriteImage:HTMLImageElement):string {
	return `
		<image
			id="${getFrameId(frame.filename)}"
			clip-path="url(#${getClipPathId(frame.filename)})"
			height="${spriteImage.height}"
			href="${spriteImage.src}"
			transform="translate(${frame.spriteSourceSize.x - frame.frame.x},${frame.spriteSourceSize.y - frame.frame.y})"
			width="${spriteImage.width}"
			x="0"
			y="0"
		/>
	`;
}

export async function render(config:GameConfig):Promise<string> {
	const backgroundImage = await fetchImage(config.imgback);
	const spriteImage = await fetchImage(config.imgshapes);
	// filter out non-position digit frames
	const frames = config.frames.filter(frame => {
		return !frame.filename.startsWith('dig') || frame.filename.includes('pos_');
	});

	const buttons = frames.filter(frame => isButton(frame));
	const images = frames.filter(frame => !isButton(frame));

	const string = `
		<svg id="svgElement" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${backgroundImage.width} ${backgroundImage.height}" preserveAspectRatio="xMidYMid meet" version="2.0">
			<defs>
				${config.frames.map(renderClipPath).join('')}
			</defs>
			<image class="svgBackground" width="${backgroundImage.width}" height="${backgroundImage.height}" href="${backgroundImage.src}" x="0" y="0" />
			${images.map((frame) => renderImage(frame, spriteImage)).join('')}
			${renderButtons(buttons, spriteImage, config.buttons)}
		</svg>
	`;

	return string;
}