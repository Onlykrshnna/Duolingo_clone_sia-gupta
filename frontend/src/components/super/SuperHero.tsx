"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const CLOUDS = [
  { left: "8%", top: "12%", w: 120, delay: 0 },
  { left: "72%", top: "8%", w: 100, delay: 0.4 },
  { left: "55%", top: "22%", w: 80, delay: 0.8 },
];

const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 5) % 95}%`,
  top: `${(i * 23 + 8) % 70}%`,
  size: 4 + (i % 3) * 2,
  delay: (i % 5) * 0.3,
}));

export default function SuperHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-16 sm:pt-14 sm:pb-20 text-center">
      {STARS.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-white/70 pointer-events-none"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.5 + star.delay, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
        />
      ))}

      {CLOUDS.map((cloud, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none opacity-30"
          style={{ left: cloud.left, top: cloud.top }}
          animate={{ x: [0, 12, 0], y: [0, -6, 0] }}
          transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: cloud.delay }}
        >
          <svg width={cloud.w} height={cloud.w * 0.45} viewBox="0 0 120 54" fill="white">
            <ellipse cx="40" cy="34" rx="36" ry="20" />
            <ellipse cx="72" cy="28" rx="28" ry="18" />
            <ellipse cx="95" cy="36" rx="22" ry="14" />
          </svg>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 blur-2xl bg-sky-400/30 rounded-full scale-125" />
          <img
            src="/mascot/super.jpg"
            alt="Super Duo mascot"
            className="relative w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-2xl drop-shadow-2xl"
          />
          <motion.div
            className="absolute -top-2 -right-2 text-amber-300"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
        </motion.div>

        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FF4B9A] via-[#A855F7] to-[#6366F1] text-white font-black italic px-3 py-1 rounded-lg text-xs uppercase tracking-[0.15em] mb-4 shadow-lg">
          <Sparkles className="w-3.5 h-3.5" /> Super
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-nunito tracking-tight max-w-xl">
          Unlock Super Learning
        </h1>
        <p className="mt-3 text-xl sm:text-2xl font-extrabold text-sky-300 font-nunito">
          Try FREE for 7 Days
        </p>
        <p className="mt-4 text-sm sm:text-base text-slate-300 font-semibold max-w-md leading-relaxed font-nunito px-2">
          Learn faster with unlimited practice and exclusive learning features.
        </p>
      </motion.div>
    </section>
  );
}
