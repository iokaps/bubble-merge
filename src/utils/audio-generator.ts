import * as Tone from 'tone';

/**
 * Generates audio files programmatically using Tone.js
 * This creates actual working sound effects without needing external files
 */

/**
 * Generate a bubble pop sound effect
 * Creates a quick pitch drop with filter sweep
 */
export async function generatePopSound(): Promise<Blob> {
	const recorder = new Tone.Recorder();
	const synth = new Tone.Synth({
		oscillator: { type: 'sine' },
		envelope: {
			attack: 0.001,
			decay: 0.1,
			sustain: 0,
			release: 0.1
		}
	}).connect(recorder);

	const filter = new Tone.Filter({
		frequency: 2000,
		type: 'lowpass'
	}).connect(Tone.getDestination());

	synth.connect(filter);

	recorder.start();

	// Play a quick pop sound
	const now = Tone.now();
	synth.triggerAttackRelease('C6', '0.1', now);
	filter.frequency.linearRampTo(500, 0.1, now);

	// Wait for sound to finish
	await new Promise((resolve) => setTimeout(resolve, 300));

	const recording = await recorder.stop();
	synth.dispose();
	filter.dispose();

	return recording;
}

/**
 * Generate a bounce/thud sound effect
 * Creates a low-pitched thump
 */
export async function generateBounceSound(): Promise<Blob> {
	const recorder = new Tone.Recorder();
	const synth = new Tone.MembraneSynth({
		pitchDecay: 0.05,
		octaves: 4,
		envelope: {
			attack: 0.001,
			decay: 0.2,
			sustain: 0,
			release: 0.1
		}
	}).connect(recorder);

	synth.connect(Tone.getDestination());

	recorder.start();

	// Play bounce sound
	synth.triggerAttackRelease('C2', '0.2', Tone.now());

	// Wait for sound to finish
	await new Promise((resolve) => setTimeout(resolve, 300));

	const recording = await recorder.stop();
	synth.dispose();

	return recording;
}

/**
 * Generate a victory fanfare sound effect
 * Creates an uplifting melody
 */
export async function generateVictorySound(): Promise<Blob> {
	const recorder = new Tone.Recorder();
	const synth = new Tone.PolySynth(Tone.Synth, {
		oscillator: { type: 'triangle' },
		envelope: {
			attack: 0.02,
			decay: 0.1,
			sustain: 0.3,
			release: 0.5
		}
	}).connect(recorder);

	synth.connect(Tone.getDestination());

	recorder.start();

	// Play victory melody (C major arpeggio up)
	const now = Tone.now();
	synth.triggerAttackRelease('C5', '0.2', now);
	synth.triggerAttackRelease('E5', '0.2', now + 0.15);
	synth.triggerAttackRelease('G5', '0.2', now + 0.3);
	synth.triggerAttackRelease('C6', '0.6', now + 0.45);

	// Wait for sound to finish
	await new Promise((resolve) => setTimeout(resolve, 2000));

	const recording = await recorder.stop();
	synth.dispose();

	return recording;
}

/**
 * Save a blob as an audio file
 */
export async function saveBlobAsFile(
	blob: Blob,
	filename: string
): Promise<void> {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Generate all audio files and download them
 * Call this function once to create all audio files
 */
export async function generateAllAudioFiles(): Promise<void> {
	await Tone.start();

	console.log('Generating pop sound...');
	const popBlob = await generatePopSound();
	await saveBlobAsFile(popBlob, 'pop-correct.mp3');

	console.log('Generating bounce sound...');
	const bounceBlob = await generateBounceSound();
	await saveBlobAsFile(bounceBlob, 'bounce-incorrect.mp3');

	console.log('Generating victory sound...');
	const victoryBlob = await generateVictorySound();
	await saveBlobAsFile(victoryBlob, 'level-complete.mp3');

	console.log('All audio files generated!');
}
