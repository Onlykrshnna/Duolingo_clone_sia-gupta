export type SpeechContext = "vocabulary" | "sentence" | "conversation" | "review";

export type SpeechSpeedPreset = "slow" | "normal" | "fast";

export type AudioButtonSize = "sm" | "md" | "lg";

export type AudioButtonVariant = "default" | "circle" | "inline";

export type PlayOptions = {
  context?: SpeechContext;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (reason: string) => void;
};

export type AudioManagerState = {
  isPlaying: boolean;
  isPaused: boolean;
  currentWord: string;
  queueLength: number;
  voicesReady: boolean;
  voiceAvailable: boolean;
  lastLanguage: string | null;
};

export const CONTEXT_SPEECH_RATES: Record<SpeechContext, number> = {
  vocabulary: 0.8,
  sentence: 0.9,
  conversation: 1.0,
  review: 1.1,
};

export const SPEED_PRESET_MULTIPLIERS: Record<SpeechSpeedPreset, number> = {
  slow: 0.85,
  normal: 1.0,
  fast: 1.15,
};
