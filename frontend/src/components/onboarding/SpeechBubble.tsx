"use client";

import React from "react";
import { motion } from "framer-motion";

interface SpeechBubbleProps {
  text: string;
  className?: string;
  delay?: number;
  size?: "md" | "lg";
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  className = "",
  delay = 0.12,
  size = "lg",
}) => {
  const textClass =
    size === "lg"
      ? "text-xl sm:text-2xl md:text-[1.65rem]"
      : "text-lg sm:text-xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative bg-[#1F2E35] border-2 border-[#37464F] rounded-2xl px-6 py-5 sm:px-8 sm:py-6 shadow-xl w-full ${className}`}
    >
      <p
        className={`${textClass} font-extrabold text-slate-100 text-center leading-snug font-nunito`}
      >
        {text}
      </p>
      <div
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-[#37464F]"
        aria-hidden
      />
      <div
        className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-[#1F2E35]"
        aria-hidden
      />
    </motion.div>
  );
};

export default SpeechBubble;

/** @deprecated Use SpeechBubble */
export const DuoSpeechBubble = SpeechBubble;
