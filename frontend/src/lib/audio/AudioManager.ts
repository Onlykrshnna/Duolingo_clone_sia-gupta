import { usePreferencesStore } from "@/store/usePreferencesStore";
import { toSpeechLocale, voiceMatchesLocale } from "./localeMap";
import {
  CONTEXT_SPEECH_RATES,
  PlayOptions,
  SPEED_PRESET_MULTIPLIERS,
  SpeechContext,
  SpeechSpeedPreset,
} from "./types";

type QueueItem = {
  text: string;
  locale: string;
  options?: PlayOptions;
  resolve: () => void;
  reject: (err: Error) => void;
};

type Listener = () => void;

function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

class AudioManager {
  private listeners = new Set<Listener>();
  private queueItems: QueueItem[] = [];
  private processing = false;
  private utterance: SpeechSynthesisUtterance | null = null;

  isPlaying = false;
  isPaused = false;
  currentWord = "";
  voicesReady = false;
  voiceAvailable = true;
  lastLanguage: string | null = null;
  speed = 1;
  pitch = 1;
  volume = 1;

  constructor() {
    if (!speechSupported()) return;
    this.refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => this.refreshVoices());
  }

  get queue(): string[] {
    return this.queueItems.map((item) => item.text);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private refreshVoices() {
    if (!speechSupported()) return;
    const voices = window.speechSynthesis.getVoices();
    this.voicesReady = voices.length > 0;
    this.notify();
  }

  private resolveRate(context: SpeechContext = "vocabulary", override?: number): number {
    if (override !== undefined) return override;
    const base = CONTEXT_SPEECH_RATES[context];
    const preset: SpeechSpeedPreset =
      usePreferencesStore.getState().speechSpeedPreset ?? "normal";
    return base * SPEED_PRESET_MULTIPLIERS[preset];
  }

  private pickVoice(locale: string): SpeechSynthesisVoice | null {
    if (!speechSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase());
    if (exact) return exact;
    const prefix = locale.split("-")[0].toLowerCase();
    const partial = voices.find((v) => voiceMatchesLocale(v.lang, locale));
    if (partial) return partial;
    return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
  }

  hasVoiceForLanguage(languageCode: string): boolean {
    if (!speechSupported()) return false;
    if (!this.voicesReady) return true;
    const locale = toSpeechLocale(languageCode);
    return this.pickVoice(locale) !== null;
  }

  play(text: string, language: string, options?: PlayOptions): Promise<void> {
    if (!text?.trim()) return Promise.resolve();
    if (!speechSupported()) {
      options?.onError?.("Speech synthesis not supported");
      return Promise.reject(new Error("Speech synthesis not supported"));
    }

    this.stop();

    const locale = toSpeechLocale(language);
    this.lastLanguage = locale;

    return new Promise((resolve, reject) => {
      this.queueItems.push({ text: text.trim(), locale, options, resolve, reject });
      void this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queueItems.length === 0) return;
    this.processing = true;

    while (this.queueItems.length > 0) {
      const item = this.queueItems.shift()!;
      try {
        await this.speakItem(item);
        item.resolve();
      } catch (err) {
        item.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }

    this.processing = false;
    this.notify();
  }

  private speakItem(item: QueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!speechSupported()) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      const voice = this.pickVoice(item.locale);
      if (this.voicesReady && !voice) {
        this.voiceAvailable = false;
        item.options?.onError?.("No native voice available");
        reject(new Error(`No voice for ${item.locale}`));
        this.notify();
        return;
      }

      this.voiceAvailable = true;
      const utterance = new SpeechSynthesisUtterance(item.text);
      this.utterance = utterance;

      if (voice) utterance.voice = voice;
      utterance.lang = item.locale;

      const context = item.options?.context ?? "vocabulary";
      const rate = this.resolveRate(context, item.options?.rate);
      utterance.rate = rate;
      utterance.pitch = item.options?.pitch ?? this.pitch;
      utterance.volume = item.options?.volume ?? this.volume;

      this.speed = rate;
      this.pitch = utterance.pitch;
      this.volume = utterance.volume;
      this.currentWord = item.text;
      this.isPlaying = true;
      this.isPaused = false;
      this.notify();

      utterance.onstart = () => {
        this.isPlaying = true;
        item.options?.onStart?.();
        this.notify();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentWord = "";
        this.utterance = null;
        item.options?.onEnd?.();
        this.notify();
        resolve();
      };

      utterance.onerror = (event) => {
        if (event.error === "interrupted" || event.error === "canceled") {
          resolve();
          return;
        }
        this.isPlaying = false;
        this.isPaused = false;
        this.currentWord = "";
        this.utterance = null;
        item.options?.onError?.(event.error);
        this.notify();
        reject(new Error(event.error));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  pause() {
    if (!speechSupported()) return;
    window.speechSynthesis.pause();
    this.isPaused = true;
    this.notify();
  }

  resume() {
    if (!speechSupported()) return;
    window.speechSynthesis.resume();
    this.isPaused = false;
    this.notify();
  }

  stop() {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    this.queueItems = [];
    this.processing = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentWord = "";
    this.utterance = null;
    this.notify();
  }
}

export const audioManager = new AudioManager();
