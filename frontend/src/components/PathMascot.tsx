"use client";

import React from "react";
import { motion } from "framer-motion";

interface PathMascotProps {
  className?: string;
  size?: number;
}

export const PathMascot: React.FC<PathMascotProps> = ({
  className = "",
  size = 72,
}) => {
  return (
    <motion.div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0], rotate: [0, -2, 2, 0] }}
      transition={{
        duration: 2.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.img
        src="/mascot/standing.jpg"
        alt=""
        draggable={false}
        className="w-full h-full object-contain rounded-full border-[3px] border-[#37464F] shadow-lg"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

export default PathMascot;
