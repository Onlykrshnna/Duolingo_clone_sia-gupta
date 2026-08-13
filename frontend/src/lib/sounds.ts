import { usePreferencesStore } from "@/store/usePreferencesStore";

export type SoundId =
  | "click"
  | "correct"
  | "wrong"
  | "lessonComplete"
  | "xp"
  | "heartLost"
  | "heartRestored"
  | "skillUnlocked"
  | "levelUp"
  | "streak"
  | "dailyGoal"
  | "courseComplete"
  | "modalOpen"
  | "achievement";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  delay = 0
) {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  const start = ctx.currentTime + delay;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

function playSequence(notes: Array<{ freq: number; dur: number; delay?: number; vol?: number; type?: OscillatorType }>) {
  notes.forEach((note) => {
    playTone(note.freq, note.dur, note.type ?? "sine", note.vol ?? 0.1, note.delay ?? 0);
  });
}

const SOUND_MAP: Record<SoundId, () => void> = {
  click: () => playTone(520, 0.06, "triangle", 0.08),
  correct: () =>
    playSequence([
      { freq: 523, dur: 0.1, type: "sine", vol: 0.11 },
      { freq: 659, dur: 0.12, delay: 0.08, type: "sine", vol: 0.11 },
      { freq: 784, dur: 0.16, delay: 0.16, type: "sine", vol: 0.1 },
    ]),
  wrong: () =>
    playSequence([
      { freq: 220, dur: 0.14, type: "sawtooth", vol: 0.07 },
      { freq: 185, dur: 0.2, delay: 0.1, type: "sawtooth", vol: 0.06 },
    ]),
  lessonComplete: () =>
    playSequence([
      { freq: 523, dur: 0.12, vol: 0.1 },
      { freq: 659, dur: 0.12, delay: 0.1, vol: 0.1 },
      { freq: 784, dur: 0.12, delay: 0.2, vol: 0.1 },
      { freq: 1047, dur: 0.22, delay: 0.3, vol: 0.09 },
    ]),
  xp: () =>
    playSequence([
      { freq: 880, dur: 0.08, type: "triangle", vol: 0.09 },
      { freq: 1175, dur: 0.1, delay: 0.06, type: "triangle", vol: 0.08 },
    ]),
  heartLost: () => playTone(160, 0.25, "sawtooth", 0.06),
  heartRestored: () =>
    playSequence([
      { freq: 440, dur: 0.1, type: "triangle", vol: 0.09 },
      { freq: 554, dur: 0.14, delay: 0.08, type: "triangle", vol: 0.09 },
    ]),
  skillUnlocked: () =>
    playSequence([
      { freq: 392, dur: 0.1, vol: 0.09 },
      { freq: 523, dur: 0.1, delay: 0.08, vol: 0.09 },
      { freq: 659, dur: 0.14, delay: 0.16, vol: 0.09 },
    ]),
  levelUp: () =>
    playSequence([
      { freq: 440, dur: 0.08, vol: 0.1 },
      { freq: 554, dur: 0.08, delay: 0.07, vol: 0.1 },
      { freq: 659, dur: 0.08, delay: 0.14, vol: 0.1 },
      { freq: 880, dur: 0.18, delay: 0.21, vol: 0.09 },
    ]),
  streak: () =>
    playSequence([
      { freq: 523, dur: 0.1, type: "triangle", vol: 0.1 },
      { freq: 659, dur: 0.1, delay: 0.09, type: "triangle", vol: 0.1 },
      { freq: 784, dur: 0.18, delay: 0.18, type: "triangle", vol: 0.09 },
    ]),
  dailyGoal: () =>
    playSequence([
      { freq: 659, dur: 0.1, vol: 0.1 },
      { freq: 784, dur: 0.1, delay: 0.08, vol: 0.1 },
      { freq: 988, dur: 0.2, delay: 0.16, vol: 0.09 },
    ]),
  courseComplete: () =>
    playSequence([
      { freq: 392, dur: 0.1, vol: 0.09 },
      { freq: 523, dur: 0.1, delay: 0.08, vol: 0.09 },
      { freq: 659, dur: 0.1, delay: 0.16, vol: 0.09 },
      { freq: 784, dur: 0.1, delay: 0.24, vol: 0.09 },
      { freq: 988, dur: 0.25, delay: 0.32, vol: 0.08 },
    ]),
  modalOpen: () => playTone(330, 0.08, "triangle", 0.07),
  achievement: () =>
    playSequence([
      { freq: 523, dur: 0.08, vol: 0.1 },
      { freq: 659, dur: 0.08, delay: 0.06, vol: 0.1 },
      { freq: 784, dur: 0.08, delay: 0.12, vol: 0.1 },
      { freq: 1047, dur: 0.2, delay: 0.18, vol: 0.08 },
    ]),
};

export function playSound(id: SoundId) {
  const { soundEnabled } = usePreferencesStore.getState();
  if (!soundEnabled) return;
  try {
    SOUND_MAP[id]?.();
  } catch {
    /* audio may be blocked until user gesture */
  }
}
