"use client";

import React from "react";
import { motion } from "framer-motion";

interface RightRailCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const RightRailCard: React.FC<RightRailCardProps> = ({
  children,
  className = "",
  hover = true,
}) => {
  return (
    <motion.div
      whileHover={
        hover
          ? { y: -2, transition: { duration: 0.18, ease: "easeOut" } }
          : undefined
      }
      className={`border-2 border-[#37464F] rounded-2xl p-5 bg-[#1F2E35] shadow-[0_2px_0_#0f171b,0_4px_14px_rgba(0,0,0,0.18)] transition-shadow duration-200 hover:shadow-[0_2px_0_#0f171b,0_6px_20px_rgba(0,0,0,0.22)] ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default RightRailCard;
