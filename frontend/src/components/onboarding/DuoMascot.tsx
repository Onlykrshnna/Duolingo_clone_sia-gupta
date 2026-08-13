"use client";

import React from "react";
import { motion } from "framer-motion";

interface DuoMascotProps {
  size?: number;
  className?: string;
  bounce?: boolean;
}

export const DuoMascot: React.FC<DuoMascotProps> = ({
  size = 200,
  className = "",
  bounce = true,
}) => {
  return (
    <motion.div
      className={`relative select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
      animate={bounce ? { y: [0, -12, 0] } : undefined}
      transition={
        bounce
          ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      <img
        src="/mascot/standing.jpg"
        alt="Duo the owl"
        className="w-full h-full object-contain drop-shadow-2xl rounded-full border-4 border-[#37464F]"
        draggable={false}
      />
    </motion.div>
  );
};

export default DuoMascot;

/** @deprecated Use DuoMascot */
export const MascotAnimation = DuoMascot;
