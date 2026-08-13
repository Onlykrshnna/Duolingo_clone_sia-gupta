"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface FlyingHeartProps {
  show: boolean;
  onComplete?: () => void;
}

export const FlyingHeart: React.FC<FlyingHeartProps> = ({ show, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="flying-heart"
          initial={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          animate={{
            opacity: [1, 1, 0],
            y: -120,
            scale: [1, 1.2, 0.6],
            x: [0, 20, 40],
            rotate: [0, -15, -30],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          onAnimationComplete={onComplete}
          className="fixed top-16 right-8 md:right-16 z-50 pointer-events-none"
        >
          <Heart className="w-8 h-8 text-rose-red fill-current drop-shadow-lg" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FlyingHeart;
