export default function isTouchDevice() {
	return 'ontouchstart' in document.documentElement || (window.navigator.maxTouchPoints && window.navigator.maxTouchPoints >= 1);
}