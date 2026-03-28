/**
 * Web Audio API sound engine.
 * Lazy-initializes AudioContext on first user interaction.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = true;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function getMasterGain(): GainNode {
  getContext();
  return masterGain as GainNode;
}

export function setMuted(value: boolean) {
  muted = value;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(value ? 0 : 1, ctx?.currentTime ?? 0, 0.1);
  }
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  setMuted(!muted);
  return muted;
}

/**
 * Play a simple tone — placeholder for real sound assets.
 */
export function playTone(frequency = 440, duration = 0.15, volume = 0.3) {
  const audioCtx = getContext();
  const gain = getMasterGain();

  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;
  oscGain.gain.value = volume;
  oscGain.gain.setTargetAtTime(0, audioCtx.currentTime + duration * 0.7, duration * 0.3);

  osc.connect(oscGain);
  oscGain.connect(gain);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

/**
 * Load and play an audio buffer from a URL.
 */
export async function loadSound(url: string): Promise<AudioBuffer> {
  const audioCtx = getContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

export function playBuffer(buffer: AudioBuffer, volume = 1.0) {
  const audioCtx = getContext();
  const gain = getMasterGain();

  const source = audioCtx.createBufferSource();
  const sourceGain = audioCtx.createGain();

  source.buffer = buffer;
  sourceGain.gain.value = volume;

  source.connect(sourceGain);
  sourceGain.connect(gain);
  source.start();
}
