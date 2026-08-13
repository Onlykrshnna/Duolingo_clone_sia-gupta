"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import { audioManager } from "@/lib/audio/AudioManager";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import type { AudioButtonSize, AudioButtonVariant, SpeechContext } from "@/lib/audio/types";

const AUTO_PLAY_SESSION = new Set<string>();

export interface AudioButtonProps {
  text: string;
  language: string;
  autoPlay?: boolean;
  autoPlayKey?: string;
  size?: AudioButtonSize;
  variant?: AudioButtonVariant;
  disabled?: boolean;
  speechContext?: SpeechContext;
  challengeMode?: boolean;
  className?: string;
  /** Hide text label (circle variant only shows icon) */
  showLabel?: boolean;
}

type ButtonPhase = "idle" | "loading" | "playing" | "played" | "unavailable" | "limit";

const SIZE_CLASSES: Record<AudioButtonSize, { btn: string; icon: string; text: string }> = {
  sm: { btn: "px-3 py-1.5 text-xs gap-1.5", icon: "w-3.5 h-3.5", text: "text-xs" },
  md: { btn: "px-5 py-2.5 text-sm gap-2", icon: "w-5 h-5", text: "text-sm" },
  lg: { btn: "px-6 py-3 text-base gap-2.5", icon: "w-6 h-6", text: "text-base" },
};

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  language,
  autoPlay = false,
  autoPlayKey,
  size = "md",
  variant = "default",
  disabled = false,
  speechContext = "vocabulary",
  challengeMode = false,
  className = "",
  showLabel = true,
}) => {
  const autoPlayEnabled = usePreferencesStore((s) => s.autoPlayEnabled);
  const labelId = useId();
  const [phase, setPhase] = useState<ButtonPhase>("idle");
  const [replayCount, setReplayCount] = useState(0);
  const mountedRef = useRef(true);
  const playingTextRef = useRef<string | null>(null);

  const maxReplays = challengeMode ? 3 : Infinity;
  const atReplayLimit = challengeMode && replayCount >= maxReplays;

  const voicesReady = audioManager.voicesReady;
  const voiceOk = language ? audioManager.hasVoiceForLanguage(language) : false;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setReplayCount(0);
    setPhase("idle");
  }, [text, language]);

  useEffect(() => {
    const unsub = audioManager.subscribe(() => {
      if (!mountedRef.current) return;
      const playing = audioManager.isPlaying && audioManager.currentWord === text;
      if (playing) {
        setPhase("playing");
      } else if (playingTextRef.current === text && phase === "playing") {
        setPhase("played");
        playingTextRef.current = null;
      }
    });
    return unsub;
  }, [text, phase]);

  const play = useCallback(async () => {
    if (!text?.trim() || disabled || atReplayLimit) return;
    if (!voicesReady) return;
    if (voicesReady && !voiceOk) {
      setPhase("unavailable");
      return;
    }

    playingTextRef.current = text;
    setPhase("playing");
    setReplayCount((c) => c + 1);

    try {
      await audioManager.play(text, language, {
        context: speechContext,
        onEnd: () => {
          if (mountedRef.current) setPhase("played");
        },
        onError: () => {
          if (mountedRef.current) setPhase("unavailable");
        },
      });
    } catch {
      if (mountedRef.current) setPhase("unavailable");
    }
  }, [text, language, disabled, atReplayLimit, voicesReady, voiceOk, speechContext]);

  useEffect(() => {
    if (!autoPlay || !autoPlayEnabled || !text?.trim() || disabled) return;
    const key = autoPlayKey ?? `${language}:${text}`;
    if (AUTO_PLAY_SESSION.has(key)) return;
    AUTO_PLAY_SESSION.add(key);
    const timer = window.setTimeout(() => {
      void play();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [autoPlay, autoPlayEnabled, text, language, autoPlayKey, disabled, play]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (document.activeElement?.id === labelId.replace(/:/g, "") || 
          document.activeElement?.getAttribute("data-audio-btn") === labelId) {
        e.preventDefault();
        void play();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [play, labelId]);

  const resolvedPhase: ButtonPhase = (() => {
    if (!language) return "unavailable";
    if (!voicesReady) return "loading";
    if (voicesReady && !voiceOk) return "unavailable";
    if (atReplayLimit) return "limit";
    return phase;
  })();

  const label = (() => {
    switch (resolvedPhase) {
      case "loading":
        return "Loading voices…";
      case "playing":
        return "Playing…";
      case "played":
        return "Played";
      case "unavailable":
        return "Voice unavailable";
      case "limit":
        return "No replays left";
      default:
        return "Listen";
    }
  })();

  const isDisabled =
    disabled ||
    resolvedPhase === "loading" ||
    resolvedPhase === "unavailable" ||
    resolvedPhase === "limit" ||
    (resolvedPhase === "playing" && variant !== "circle");

  const sizeClass = SIZE_CLASSES[size];

  if (variant === "circle") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <motion.button
          type="button"
          id={labelId}
          data-audio-btn={labelId}
          onClick={() => void play()}
          disabled={isDisabled && resolvedPhase !== "playing"}
          aria-label={`${label}: ${text}`}
          aria-busy={resolvedPhase === "playing"}
          whileHover={!isDisabled ? { scale: 1.04 } : undefined}
          whileTap={!isDisabled ? { scale: 0.96 } : undefined}
          animate={
            resolvedPhase === "playing"
              ? { boxShadow: ["0 0 0 0 rgba(28,176,246,0.5)", "0 0 0 12px rgba(28,176,246,0)"] }
              : { scale: resolvedPhase === "played" ? [1, 1.06, 1] : 1 }
          }
          transition={
            resolvedPhase === "playing"
              ? { repeat: Infinity, duration: 1.2 }
              : { duration: 0.25 }
          }
          className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_4px_0_#1280B0] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24] ${
            resolvedPhase === "playing"
              ? "bg-[#1590D0] ring-2 ring-[#1CB0F6]/60"
              : "bg-[#1CB0F6] hover:bg-[#1590D0] hover:shadow-[0_0_20px_rgba(28,176,246,0.45)]"
          } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {resolvedPhase === "played" ? (
            <Check className="w-10 h-10 text-white" aria-hidden />
          ) : (
            <Volume2 className="w-10 h-10 text-white fill-white" aria-hidden />
          )}
          {resolvedPhase === "playing" && (
            <span className="absolute -bottom-1 flex gap-0.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 bg-white/80 rounded-full"
                  animate={{ height: [4, 14, 4] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                />
              ))}
            </span>
          )}
        </motion.button>
        {resolvedPhase === "unavailable" && (
          <p className="text-xs text-[#AAB7C2] font-semibold text-center max-w-[220px]">
            This browser doesn&apos;t have a native voice for this language.
          </p>
        )}
        {resolvedPhase === "limit" && (
          <p className="text-xs text-amber-400 font-bold">Maximum 3 replays in challenge mode</p>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        id={labelId}
        data-audio-btn={labelId}
        onClick={(e) => {
          e.stopPropagation();
          void play();
        }}
        disabled={isDisabled}
        aria-label={`${label}: ${text}`}
        className={`inline-flex items-center justify-center rounded-lg p-1.5 text-[#1CB0F6] hover:bg-[#1CB0F6]/15 hover:shadow-[0_0_12px_rgba(28,176,246,0.35)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6] ${className}`}
      >
        {resolvedPhase === "played" ? (
          <Check className="w-4 h-4" />
        ) : (
          <Volume2 className={`w-4 h-4 ${resolvedPhase === "playing" ? "animate-pulse" : ""}`} />
        )}
      </button>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.button
        type="button"
        id={labelId}
        data-audio-btn={labelId}
        onClick={() => void play()}
        disabled={isDisabled}
        aria-label={`${label}: ${text}`}
        aria-busy={resolvedPhase === "playing"}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        animate={resolvedPhase === "played" ? { scale: [1, 1.04, 1] } : undefined}
        className={`flex items-center font-extrabold font-nunito text-white rounded-2xl shadow-[0_3px_0_#1280B0] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB0F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24] ${sizeClass.btn} ${
          resolvedPhase === "playing"
            ? "bg-[#1590D0] ring-2 ring-[#1CB0F6]/50"
            : "bg-[#1CB0F6] hover:bg-[#1590D0] hover:shadow-[0_0_18px_rgba(28,176,246,0.4)]"
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {resolvedPhase === "played" ? (
          <Check className={sizeClass.icon} aria-hidden />
        ) : (
          <Volume2 className={`${sizeClass.icon} ${resolvedPhase === "playing" ? "animate-pulse" : ""}`} aria-hidden />
        )}
        {showLabel && <span className={sizeClass.text}>{label}</span>}
      </motion.button>
      {resolvedPhase === "unavailable" && (
        <p className="text-xs text-[#AAB7C2] font-semibold text-center max-w-xs">
          This browser doesn&apos;t have a native voice for this language.
        </p>
      )}
    </div>
  );
};

export default AudioButton;

/** Clear auto-play memory when leaving a lesson or switching language. */
export function resetAutoPlaySession() {
  AUTO_PLAY_SESSION.clear();
}
