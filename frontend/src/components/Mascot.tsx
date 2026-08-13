"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export type MascotMood = "idle" | "happy" | "sad" | "celebrate";

interface MascotProps {
  className?: string;
  size?: number;
  mood?: MascotMood;
  message?: string;
  showBubble?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({
  className = "",
  size = 150,
  mood = "idle",
  message,
  showBubble = true,
}) => {
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);

  const defaultMessage =
    mood === "happy"
      ? "Great job!"
      : mood === "sad"
        ? "You'll get it next time!"
        : mood === "celebrate"
          ? "Lesson complete!"
          : "You got this!";

  const bubbleText = message ?? defaultMessage;

  const moodAnimation =
    mood === "happy"
      ? { y: [0, -10, 0], rotate: [0, 4, -4, 0] }
      : mood === "sad"
        ? { y: [0, 4, 0], rotate: [0, -3, 3, 0] }
        : mood === "celebrate"
          ? { y: [0, -14, 0], scale: [1, 1.08, 1], rotate: [0, -6, 6, 0] }
          : { y: [0, -8, 0] };

  const moodTransition =
    mood === "celebrate"
      ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={animationsEnabled ? moodAnimation : undefined}
        transition={animationsEnabled ? moodTransition : undefined}
      >
        <img
          src="/mascot/standing.jpg"
          alt="Duo Mascot"
          draggable={false}
          className={`object-contain rounded-full shadow-lg border-4 border-[#37464F] bg-[#131F24] w-full h-full ${
            mood === "sad" ? "opacity-90 grayscale-[20%]" : ""
          } ${mood === "celebrate" ? "ring-4 ring-[#58CC02]/40" : ""}`}
        />
        {animationsEnabled && mood === "idle" && (
          <motion.div
            className="absolute top-[38%] left-[32%] w-2 h-2 bg-white rounded-full opacity-80"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
          />
        )}
      </motion.div>

      {showBubble && (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          key={bubbleText}
          className="text-slate-200 font-extrabold text-sm tracking-wide mt-3 font-nunito bg-[#1F2E35] px-3.5 py-1.5 rounded-2xl border-2 border-[#37464F] shadow-sm"
        >
          {bubbleText}
        </motion.span>
      )}
    </div>
  );
};

export default Mascot;
