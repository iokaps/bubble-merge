/**
 * Generate audio sounds using Web Audio API
 * No external files needed - sounds are synthesized in the browser
 */

const audioContext = new (window.AudioContext ||
	(window as any).webkitAudioContext)();

/**
 * Generate a bubble pop sound effect
 */
export function playPopSound(volume = 0.6): void {
	const now = audioContext.currentTime;
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();
	const filter = audioContext.createBiquadFilter();

	// Configure filter
	filter.type = 'lowpass';
	filter.frequency.setValueAtTime(2000, now);
	filter.frequency.exponentialRampToValueAtTime(500, now + 0.1);

	// Configure oscillator (high pitch that drops quickly)
	oscillator.type = 'sine';
	oscillator.frequency.setValueAtTime(800, now);
	oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);

	// Configure gain (volume envelope)
	gainNode.gain.setValueAtTime(volume, now);
	gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

	// Connect the audio graph
	oscillator.connect(filter);
	filter.connect(gainNode);
	gainNode.connect(audioContext.destination);

	// Play
	oscillator.start(now);
	oscillator.stop(now + 0.15);
}

/**
 * Generate a bounce/thud sound effect
 */
export function playBounceSound(volume = 0.4): void {
	const now = audioContext.currentTime;
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();

	// Low frequency thud
	oscillator.type = 'sine';
	oscillator.frequency.setValueAtTime(100, now);
	oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);

	// Sharp attack, quick decay
	gainNode.gain.setValueAtTime(volume, now);
	gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

	// Connect
	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);

	// Play
	oscillator.start(now);
	oscillator.stop(now + 0.15);
}

/**
 * Generate a victory fanfare sound effect
 */
export function playVictorySound(volume = 0.8): void {
	const now = audioContext.currentTime;
	const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

	notes.forEach((freq, index) => {
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.type = 'triangle';
		oscillator.frequency.setValueAtTime(freq, now);

		const startTime = now + index * 0.15;
		const duration = index === notes.length - 1 ? 0.6 : 0.2;

		gainNode.gain.setValueAtTime(0, startTime);
		gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.02);
		gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.start(startTime);
		oscillator.stop(startTime + duration);
	});
}

/**
 * Resume audio context (required after user interaction)
 */
export async function resumeAudioContext(): Promise<void> {
	if (audioContext.state === 'suspended') {
		await audioContext.resume();
	}
}
