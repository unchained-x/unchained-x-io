/**
 * Web Audio API sound engine.
 * Procedural sound generation with per-page/section ambient profiles.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = true;

// Current ambient state
let currentProfile = "";
let ambientGain: GainNode | null = null;
let ambientCleanup: (() => void) | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
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

export function isMuted(): boolean { return muted; }

export function toggleMute(): boolean {
  setMuted(!muted);
  return muted;
}

// === UI Sounds ===

export function playClick() {
  const c = getContext(); const g = getMasterGain(); const t = c.currentTime;
  const osc = c.createOscillator(); const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(og); og.connect(g); osc.start(t); osc.stop(t + 0.1);
}

export function playHover() {
  const c = getContext(); const g = getMasterGain(); const t = c.currentTime;
  const osc = c.createOscillator(); const og = c.createGain();
  osc.type = "sine"; osc.frequency.value = 2400;
  og.gain.setValueAtTime(0.04, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(og); og.connect(g); osc.start(t); osc.stop(t + 0.06);
}

export function playTransition() {
  const c = getContext(); const g = getMasterGain(); const t = c.currentTime;
  const osc = c.createOscillator(); const og = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.5);
  og.gain.setValueAtTime(0.1, t);
  og.gain.setTargetAtTime(0.001, t + 0.3, 0.15);
  const sub = c.createOscillator(); const sg = c.createGain();
  sub.type = "sine"; sub.frequency.setValueAtTime(80, t); sub.frequency.setValueAtTime(60, t + 0.3);
  sg.gain.setValueAtTime(0.08, t); sg.gain.setTargetAtTime(0.001, t + 0.4, 0.2);
  osc.connect(og); og.connect(g); sub.connect(sg); sg.connect(g);
  osc.start(t); osc.stop(t + 0.6); sub.start(t); sub.stop(t + 0.7);
}

export function playSwipe() {
  const c = getContext(); const g = getMasterGain(); const t = c.currentTime;
  const buf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "bandpass";
  f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(800, t + 0.08); f.Q.value = 2;
  const sg = c.createGain(); sg.gain.setValueAtTime(0.06, t); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  src.connect(f); f.connect(sg); sg.connect(g); src.start(t);
}

// Legacy
export function playTone(frequency = 440, duration = 0.15, volume = 0.3) {
  const c = getContext(); const g = getMasterGain();
  const osc = c.createOscillator(); const og = c.createGain();
  osc.type = "sine"; osc.frequency.value = frequency;
  og.gain.value = volume; og.gain.setTargetAtTime(0, c.currentTime + duration * 0.7, duration * 0.3);
  osc.connect(og); og.connect(g); osc.start(); osc.stop(c.currentTime + duration);
}

// === Ambient Profiles ===

interface AmbientProfile {
  oscillators: { freq: number; type: OscillatorType; gain: number; lfoRate: number; lfoDepth: number }[];
  noiseFilterFreq: number;
  noiseFilterQ: number;
  noiseLfoRate: number;
  noiseLfoDepth: number;
  noiseGain: number;
  masterVol: number;
}

const PROFILES: Record<string, AmbientProfile> = {
  // Home sections
  hero: {
    oscillators: [
      { freq: 55, type: "sine", gain: 0.4, lfoRate: 0.04, lfoDepth: 2 },
      { freq: 82.5, type: "sine", gain: 0.25, lfoRate: 0.06, lfoDepth: 3 },
      { freq: 110, type: "triangle", gain: 0.12, lfoRate: 0.03, lfoDepth: 1.5 },
    ],
    noiseFilterFreq: 180, noiseFilterQ: 1, noiseLfoRate: 0.025, noiseLfoDepth: 80,
    noiseGain: 0.015, masterVol: 0.025,
  },
  teaser: {
    oscillators: [
      { freq: 65, type: "sine", gain: 0.3, lfoRate: 0.03, lfoDepth: 4 },
      { freq: 98, type: "sine", gain: 0.15, lfoRate: 0.07, lfoDepth: 5 },
    ],
    noiseFilterFreq: 120, noiseFilterQ: 2, noiseLfoRate: 0.02, noiseLfoDepth: 50,
    noiseGain: 0.02, masterVol: 0.02,
  },
  identity: {
    oscillators: [
      { freq: 73.4, type: "sine", gain: 0.3, lfoRate: 0.08, lfoDepth: 6 },
      { freq: 110, type: "sine", gain: 0.2, lfoRate: 0.05, lfoDepth: 4 },
      { freq: 146.8, type: "triangle", gain: 0.1, lfoRate: 0.12, lfoDepth: 8 },
    ],
    noiseFilterFreq: 300, noiseFilterQ: 0.8, noiseLfoRate: 0.06, noiseLfoDepth: 150,
    noiseGain: 0.02, masterVol: 0.025,
  },
  values: {
    oscillators: [
      { freq: 130.8, type: "sine", gain: 0.2, lfoRate: 0.04, lfoDepth: 2 },
      { freq: 196, type: "triangle", gain: 0.12, lfoRate: 0.06, lfoDepth: 3 },
      { freq: 261.6, type: "sine", gain: 0.06, lfoRate: 0.03, lfoDepth: 1 },
    ],
    noiseFilterFreq: 400, noiseFilterQ: 1.5, noiseLfoRate: 0.04, noiseLfoDepth: 100,
    noiseGain: 0.01, masterVol: 0.02,
  },

  // Pages
  portfolio: {
    oscillators: [
      { freq: 82.5, type: "sine", gain: 0.3, lfoRate: 0.05, lfoDepth: 3 },
      { freq: 123.5, type: "square", gain: 0.03, lfoRate: 0.08, lfoDepth: 5 },
      { freq: 165, type: "sine", gain: 0.1, lfoRate: 0.04, lfoDepth: 2 },
    ],
    noiseFilterFreq: 250, noiseFilterQ: 1.2, noiseLfoRate: 0.03, noiseLfoDepth: 80,
    noiseGain: 0.015, masterVol: 0.02,
  },
  team: {
    oscillators: [
      { freq: 60, type: "sine", gain: 0.35, lfoRate: 0.03, lfoDepth: 2 },
      { freq: 90, type: "sine", gain: 0.2, lfoRate: 0.05, lfoDepth: 4 },
      { freq: 120, type: "triangle", gain: 0.08, lfoRate: 0.07, lfoDepth: 6 },
    ],
    noiseFilterFreq: 160, noiseFilterQ: 0.6, noiseLfoRate: 0.02, noiseLfoDepth: 60,
    noiseGain: 0.02, masterVol: 0.025,
  },
  merch: {
    oscillators: [
      { freq: 98, type: "sine", gain: 0.25, lfoRate: 0.06, lfoDepth: 5 },
      { freq: 147, type: "sine", gain: 0.15, lfoRate: 0.04, lfoDepth: 3 },
      { freq: 196, type: "triangle", gain: 0.06, lfoRate: 0.08, lfoDepth: 4 },
    ],
    noiseFilterFreq: 350, noiseFilterQ: 1, noiseLfoRate: 0.05, noiseLfoDepth: 120,
    noiseGain: 0.01, masterVol: 0.02,
  },
  company: {
    oscillators: [
      { freq: 110, type: "sine", gain: 0.2, lfoRate: 0.03, lfoDepth: 1.5 },
      { freq: 165, type: "sine", gain: 0.12, lfoRate: 0.05, lfoDepth: 2 },
      { freq: 220, type: "triangle", gain: 0.05, lfoRate: 0.02, lfoDepth: 1 },
    ],
    noiseFilterFreq: 200, noiseFilterQ: 1.5, noiseLfoRate: 0.03, noiseLfoDepth: 60,
    noiseGain: 0.008, masterVol: 0.02,
  },
};

function buildAmbient(profile: AmbientProfile, audioCtx: AudioContext, dest: GainNode): () => void {
  const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];

  // Oscillator layers
  for (const osc of profile.oscillators) {
    const o = audioCtx.createOscillator();
    const og = audioCtx.createGain();
    o.type = osc.type;
    o.frequency.value = osc.freq;
    og.gain.value = osc.gain;

    const lfo = audioCtx.createOscillator();
    const lg = audioCtx.createGain();
    lfo.frequency.value = osc.lfoRate;
    lg.gain.value = osc.lfoDepth;
    lfo.connect(lg); lg.connect(o.detune);
    lfo.start();

    o.connect(og); og.connect(dest);
    o.start();
    nodes.push(o, lfo);
  }

  // Noise layer
  const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const nSrc = audioCtx.createBufferSource();
  nSrc.buffer = noiseBuf; nSrc.loop = true;

  const nf = audioCtx.createBiquadFilter();
  nf.type = "lowpass"; nf.frequency.value = profile.noiseFilterFreq; nf.Q.value = profile.noiseFilterQ;

  const nlfo = audioCtx.createOscillator();
  const nlg = audioCtx.createGain();
  nlfo.frequency.value = profile.noiseLfoRate;
  nlg.gain.value = profile.noiseLfoDepth;
  nlfo.connect(nlg); nlg.connect(nf.frequency);
  nlfo.start();

  const ng = audioCtx.createGain();
  ng.gain.value = profile.noiseGain;

  nSrc.connect(nf); nf.connect(ng); ng.connect(dest);
  nSrc.start();
  nodes.push(nlfo as unknown as OscillatorNode);

  return () => {
    for (const n of nodes) { try { n.stop(); } catch {} }
    try { nSrc.stop(); } catch {}
  };
}

/** Switch ambient to a named profile with crossfade */
export function setAmbientProfile(name: string) {
  if (name === currentProfile) return;
  if (muted) { currentProfile = name; return; }

  const audioCtx = getContext();
  const gain = getMasterGain();
  const t = audioCtx.currentTime;
  const profile = PROFILES[name];
  if (!profile) return;

  // Fade out old
  if (ambientGain && ambientCleanup) {
    const oldGain = ambientGain;
    const oldCleanup = ambientCleanup;
    oldGain.gain.setTargetAtTime(0, t, 0.8);
    setTimeout(() => { oldCleanup(); oldGain.disconnect(); }, 3000);
  }

  // Fade in new
  ambientGain = audioCtx.createGain();
  ambientGain.gain.setValueAtTime(0, t);
  ambientGain.gain.setTargetAtTime(profile.masterVol, t + 0.5, 1.5);
  ambientGain.connect(gain);

  ambientCleanup = buildAmbient(profile, audioCtx, ambientGain);
  currentProfile = name;
}

/** Get the current profile name */
export function getCurrentProfile(): string {
  return currentProfile;
}

/** Start ambient with a given profile (called when unmuting) */
export function startAmbientIfNeeded() {
  if (currentProfile && !muted) {
    const saved = currentProfile;
    currentProfile = ""; // force restart
    setAmbientProfile(saved);
  }
}
