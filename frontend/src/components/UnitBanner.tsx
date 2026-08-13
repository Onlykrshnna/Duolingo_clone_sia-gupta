"use client";

import React from "react";
import { motion } from "framer-motion";

interface UnitBannerProps {
  orderIndex: number;
  title: string;
  description: string;
  colorTheme: string;
}

export const UnitBanner: React.FC<UnitBannerProps> = ({
  orderIndex,
  title,
  colorTheme,
}) => {
  return (
    <div
      style={{ backgroundColor: colorTheme || "#58cc02" }}
      className="w-full text-white px-5 sm:px-6 py-4 min-h-[88px] rounded-2xl flex items-center justify-between shadow-[0_2px_0_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08)] mb-8 select-none font-nunito"
    >
      <div className="flex flex-col text-left gap-0.5 pr-4">
        <span className="text-white/85 font-extrabold text-[11px] uppercase tracking-[0.12em] flex items-center gap-1.5">
          <span aria-hidden>←</span>
          <span>Section 1, Unit {orderIndex}</span>
        </span>
        <h2 className="text-lg sm:text-[22px] font-extrabold tracking-tight leading-tight">
          {title}
        </h2>
      </div>

      <motion.button
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex items-center gap-2 bg-transparent border-2 border-white/25 text-white font-extrabold uppercase text-[11px] tracking-[0.1em] px-4 py-2.5 rounded-2xl shrink-0 shadow-[0_2px_0_rgba(0,0,0,0.1)]"
      >
        <svg className="w-[18px] h-[18px] fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
          />
        </svg>
        <span>Guidebook</span>
      </motion.button>
    </div>
  );
};

export default UnitBanner;
