export default function randomInteger(min, max) {
	max = max - min + 1;
	var r = Math.floor(Math.random() * max) + min;
	return r;
}