import { Frame, GameConfig } from "./@types";

function getClipPathId(name:string):string {
	return `svg-clippath-${name}`;
}

export function getFrameId(name:string):string {
	return `svg-image-${name}`;
}

function fetchImage(url):Promise<HTMLImageElement> {
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

function renderImage(frame:Frame, spriteImage:HTMLImageElement):string {
	return `
		<image
			id="${getFrameId(frame.filename)}"
			class="${frame.filename.includes('btn') ? 'svgButton' : ''}"
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

export async function render(config:GameConfig) {
	const backgroundImage = await fetchImage(config.imgback);
	const spriteImage = await fetchImage(config.imgshapes);
	let string = `
		<svg id="svgElement" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${backgroundImage.width} ${backgroundImage.height}" preserveAspectRatio="xMidYMid meet" version="2.0">
			<defs>
				${config.frames.map(renderClipPath).join('')}
			</defs>
			<image class="svgBackground" width="${backgroundImage.width}" height="${backgroundImage.height}" href="${backgroundImage.src}" x="0" y="0" />
			${config.frames.map((frame) => renderImage(frame, spriteImage)).join('')}
		</svg>
	`;

	return string;
}