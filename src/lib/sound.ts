const MUTE_KEY = "zombix.soundMuted";

type ToneStep = { frequency: number; duration: number; delay?: number; endFrequency?: number; volume?: number; type?: OscillatorType };

let audioContext: AudioContext | null = null;

function readMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "true";
}

let muted = readMuted();

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(next: boolean) {
  muted = next;
  localStorage.setItem(MUTE_KEY, String(next));
}

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function playSteps(steps: ToneStep[]) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime;
  for (const step of steps) {
    const t = start + (step.delay ?? 0);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = step.type ?? "sine";
    oscillator.frequency.setValueAtTime(step.frequency, t);
    if (step.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(step.endFrequency, t + step.duration);
    }
    const peak = step.volume ?? 0.2;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + step.duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + step.duration + 0.02);
  }
}

export const sounds = {
  click: () => playSteps([{ frequency: 880, duration: 0.06, volume: 0.12 }]),
  open: () => playSteps([{ frequency: 220, endFrequency: 880, duration: 0.6, type: "triangle", volume: 0.18 }]),
  win: () =>
    playSteps([
      { frequency: 523, duration: 0.12, volume: 0.18 },
      { frequency: 659, duration: 0.12, delay: 0.1, volume: 0.18 },
      { frequency: 784, duration: 0.25, delay: 0.2, volume: 0.2 },
    ]),
  lose: () => playSteps([{ frequency: 320, endFrequency: 120, duration: 0.45, type: "sawtooth", volume: 0.12 }]),
  error: () =>
    playSteps([
      { frequency: 180, duration: 0.12, type: "square", volume: 0.08 },
      { frequency: 150, duration: 0.18, delay: 0.14, type: "square", volume: 0.08 },
    ]),
};

export function installButtonClickSound() {
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (target?.closest("button:not(:disabled)")) sounds.click();
  });
}
