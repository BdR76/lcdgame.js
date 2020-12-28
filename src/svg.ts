import { Button, Frame, GameConfig } from "./@types";

function getClipPathId(name:string):string {
	return `svg-clippath-${name}`;
}

export function getFrameId(name:string):string {
	return `svg-image-${name}`;
}

function fetchImage(url:string):Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onerror = (error):void => {
			reject(error)
		}
		image.onload = () => {
			resolve(image);
		};
		image.src = url;
	});
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

function renderButtons(frames:Frame[], spriteImage:HTMLImageElement, buttons: Button[]) {
	const buttonMap = new Map<string, Button>();
	buttons.forEach(button => {
		// updown, dpad button types have multiple frames
		return button.frames.forEach(frameName => buttonMap.set(frameName, button))
	});

	return frames.map((frame) => {
		const button = buttonMap.get(frame.filename);

		return renderImage(frame, spriteImage, {
			'data-direction': button.frames.indexOf(frame.filename),
			'data-name': button.name,
			'data-type': button.type
		});
	}).join('')
}

function renderImage(frame:Frame, spriteImage:HTMLImageElement, attributes?: Record<string, number | string>):string {
	const isButton = frame.filename.includes('btn');

	return `
		<image
			id="${getFrameId(frame.filename)}"
			class="${isButton ? 'svgButton' : ''}"
			clip-path="url(#${getClipPathId(frame.filename)})"
			height="${spriteImage.height}"
			href="${spriteImage.src}"
			transform="translate(${frame.spriteSourceSize.x - frame.frame.x},${frame.spriteSourceSize.y - frame.frame.y})"
			width="${spriteImage.width}"
			x="0"
			y="0"
			${!!attributes ? Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join('\n') : ''}
		/>
	`;
}

export async function render(config:GameConfig) {
	const backgroundImage = await fetchImage(config.imgback);
	const spriteImage = await fetchImage(config.imgshapes);
	// filter out non-position digit frames
	const frames = config.frames.filter(frame => {
		return !frame.filename.startsWith('dig') || frame.filename.includes('pos_');
	});

	const buttons = frames.filter(frame => frame.filename.startsWith('btn'))
	const images = frames.filter(frame => !frame.filename.startsWith('btn'))

	let string = `
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