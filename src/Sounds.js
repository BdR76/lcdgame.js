// LCD game JavaScript library
// Bas de Reuver (c)2018

const Sounds = function Sounds(soundsArray) {
	this.map = new Map();
	soundsArray.forEach(sound => {
		sound.audio = new Audio(sound.filename);
		sound.audio.load();
		this.map.set(sound.name, sound);
	});
	this.muted = false;
};

Sounds.prototype = {
	mute: function(isMuted = !this.muted) {
		this.muted = isMuted;

		this.map.forEach(sound => {
			sound.audio.muted = isMuted;
		});
	},

	play: function(effectName) {
		if (this.muted || !this.map.has(effectName)) {
			return;
		}

		const { audio } = this.map.get(effectName);
		// if sound is playing then stop it now
		if (audio.paused === false) {
			audio.pause();
			// fix for IE11
			if (!isNaN(audio.duration)) {
				audio.currentTime = 0;
			}
		}
		// start playing sound
		audio.play();
	}
};

export default Sounds;