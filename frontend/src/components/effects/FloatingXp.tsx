"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingXpProps {
  amount?: number;
  show: boolean;
  onComplete?: () => void;
}

export const FloatingXp: React.FC<FloatingXpProps> = ({
  amount = 10,
  show,
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="floating-xp"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0.8, 1.15, 1, 0.9] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          onAnimationComplete={onComplete}
          className="fixed left-1/2 top-[45%] -translate-x-1/2 z-50 pointer-events-none select-none"
        >
          <span className="text-2xl font-black text-[#FFC800] drop-shadow-lg font-nunito">
            +{amount} XP
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingXp;
