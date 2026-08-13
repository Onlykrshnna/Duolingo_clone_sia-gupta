"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCelebrationStore } from "@/store/useCelebrationStore";
import { playSound } from "@/lib/sounds";
import { burstConfetti, fireworks } from "@/lib/confettiUtils";
import { modalBackdrop, modalContent } from "@/lib/animations";
import DuoButton from "@/components/DuoButton";

export const CelebrationHost: React.FC = () => {
  const current = useCelebrationStore((s) => s.current);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;

    switch (current.kind) {
      case "achievement":
        playSound("achievement");
        burstConfetti("medium");
        break;
      case "streak":
        playSound("streak");
        burstConfetti("medium");
        break;
      case "dailyGoal":
        playSound("dailyGoal");
        burstConfetti("large");
        break;
      case "courseComplete":
        playSound("courseComplete");
        fireworks(3500);
        break;
    }
  }, [current]);

  const icon =
    current?.icon ??
    (current?.kind === "streak"
      ? "🔥"
      : current?.kind === "dailyGoal"
        ? "✅"
        : current?.kind === "courseComplete"
          ? "🏆"
          : "🏅");

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.kind + current.title}
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="bg-[#1F2E35] border-2 border-[#37464F] rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="text-7xl select-none"
            >
              {icon}
            </motion.div>
            <h2 className="text-2xl font-extrabold text-slate-100 font-nunito">{current.title}</h2>
            {current.subtitle && (
              <p className="text-slate-400 font-semibold text-sm leading-relaxed">{current.subtitle}</p>
            )}
            <DuoButton variant="primary" className="w-full py-3 mt-2" onClick={dismiss}>
              Continue
            </DuoButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationHost;
