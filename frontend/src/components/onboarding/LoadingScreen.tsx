"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOADING_MESSAGES } from "@/lib/onboarding";
import DuoMascot from "./DuoMascot";

interface LoadingScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDurationMs = 2800,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIndex((i) => (i < LOADING_MESSAGES.length - 1 ? i + 1 : i));
    }, 1200);

    const doneTimer = setTimeout(onComplete, minDurationMs);

    return () => {
      clearInterval(msgTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete, minDurationMs]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#131F24] flex flex-col items-center justify-center px-6 font-nunito">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-10 w-full max-w-md text-center"
      >
        <DuoMascot size={160} bounce />

        <div className="h-16 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="text-lg sm:text-xl font-extrabold text-slate-200 leading-snug"
            >
              {LOADING_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full max-w-xs h-2 bg-[#202F36] rounded-full overflow-hidden border border-[#37464F]">
          <motion.div
            className="h-full bg-brand-green rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: minDurationMs / 1000, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
