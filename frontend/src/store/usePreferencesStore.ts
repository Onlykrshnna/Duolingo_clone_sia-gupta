import { create } from "zustand";
import type { SpeechSpeedPreset } from "@/lib/audio/types";

const STORAGE_KEY = "app-preferences";

interface PreferencesState {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoPlayEnabled: boolean;
  speechSpeedPreset: SpeechSpeedPreset;
  hydrated: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setAutoPlayEnabled: (enabled: boolean) => void;
  setSpeechSpeedPreset: (preset: SpeechSpeedPreset) => void;
  hydrate: () => void;
}

function readStored(): Pick<
  PreferencesState,
  "soundEnabled" | "animationsEnabled" | "autoPlayEnabled" | "speechSpeedPreset"
> {
  if (typeof window === "undefined") {
    return {
      soundEnabled: true,
      animationsEnabled: true,
      autoPlayEnabled: true,
      speechSpeedPreset: "normal",
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PreferencesState>;
      return {
        soundEnabled: parsed.soundEnabled ?? true,
        animationsEnabled: parsed.animationsEnabled ?? true,
        autoPlayEnabled: parsed.autoPlayEnabled ?? true,
        speechSpeedPreset: parsed.speechSpeedPreset ?? "normal",
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return {
    soundEnabled: true,
    animationsEnabled: true,
    autoPlayEnabled: true,
    speechSpeedPreset: "normal",
  };
}

function persist(
  state: Pick<
    PreferencesState,
    "soundEnabled" | "animationsEnabled" | "autoPlayEnabled" | "speechSpeedPreset"
  >
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...readStored(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ ...readStored(), hydrated: true });
  },

  setSoundEnabled: (soundEnabled) => {
    const next = {
      soundEnabled,
      animationsEnabled: get().animationsEnabled,
      autoPlayEnabled: get().autoPlayEnabled,
      speechSpeedPreset: get().speechSpeedPreset,
    };
    persist(next);
    set({ soundEnabled });
  },

  setAnimationsEnabled: (animationsEnabled) => {
    const next = {
      soundEnabled: get().soundEnabled,
      animationsEnabled,
      autoPlayEnabled: get().autoPlayEnabled,
      speechSpeedPreset: get().speechSpeedPreset,
    };
    persist(next);
    set({ animationsEnabled });
  },

  setAutoPlayEnabled: (autoPlayEnabled) => {
    const next = {
      soundEnabled: get().soundEnabled,
      animationsEnabled: get().animationsEnabled,
      autoPlayEnabled,
      speechSpeedPreset: get().speechSpeedPreset,
    };
    persist(next);
    set({ autoPlayEnabled });
  },

  setSpeechSpeedPreset: (speechSpeedPreset) => {
    const next = {
      soundEnabled: get().soundEnabled,
      animationsEnabled: get().animationsEnabled,
      autoPlayEnabled: get().autoPlayEnabled,
      speechSpeedPreset,
    };
    persist(next);
    set({ speechSpeedPreset });
  },
}));

export function shouldAnimate(): boolean {
  const { animationsEnabled } = usePreferencesStore.getState();
  if (!animationsEnabled) return false;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  return true;
}
