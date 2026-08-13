"use client";

import { useEffect, useState, useCallback } from "react";
import { audioManager } from "@/lib/audio/AudioManager";
import type { PlayOptions } from "@/lib/audio/types";

export function useAudio() {
  const [, tick] = useState(0);

  useEffect(() => audioManager.subscribe(() => tick((n) => n + 1)), []);

  const play = useCallback(
    (text: string, language: string, options?: PlayOptions) =>
      audioManager.play(text, language, options),
    []
  );

  return {
    play,
    pause: () => audioManager.pause(),
    resume: () => audioManager.resume(),
    stop: () => audioManager.stop(),
    isPlaying: audioManager.isPlaying,
    isPaused: audioManager.isPaused,
    currentWord: audioManager.currentWord,
    queue: audioManager.queue,
    speed: audioManager.speed,
    pitch: audioManager.pitch,
    volume: audioManager.volume,
    voicesReady: audioManager.voicesReady,
    voiceAvailable: audioManager.voiceAvailable,
    hasVoiceForLanguage: (lang: string) => audioManager.hasVoiceForLanguage(lang),
  };
}
