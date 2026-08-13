"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X, Heart, RotateCcw, Zap, Volume2, BarChart3, ShieldOff, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

type FeatureRow = {
  label: string;
  icon: React.ReactNode;
  free: boolean | string;
  super: boolean | string;
};

const FEATURES: FeatureRow[] = [
  { label: "Learning content", icon: <Sparkles className="w-4 h-4" />, free: true, super: true },
  { label: "Unlimited Hearts", icon: <Heart className="w-4 h-4" />, free: false, super: true },
  { label: "Mistakes Review", icon: <RotateCcw className="w-4 h-4" />, free: false, super: true },
  { label: "Unlimited Practice", icon: <Zap className="w-4 h-4" />, free: false, super: true },
  { label: "Priority Audio", icon: <Volume2 className="w-4 h-4" />, free: false, super: true },
  { label: "Progress Insights", icon: <BarChart3 className="w-4 h-4" />, free: false, super: true },
  { label: "No Ads", icon: <ShieldOff className="w-4 h-4" />, free: false, super: true },
  { label: "Future Premium Features", icon: <Sparkles className="w-4 h-4" />, free: false, super: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-green/20 text-brand-green">
        <Check className="w-4 h-4 stroke-[3]" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-700/50 text-slate-500">
        <X className="w-4 h-4 stroke-[3]" />
      </span>
    );
  }
  return <span className="text-xs font-bold text-slate-300">{value}</span>;
}

export default function SuperComparisonTable() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="px-4 py-10 max-w-3xl mx-auto w-full"
    >
      <motion.h2 variants={staggerItem} className="text-2xl font-extrabold text-white text-center mb-6 font-nunito">
        Free vs Super
      </motion.h2>

      <motion.div
        variants={staggerItem}
        className="rounded-2xl border-2 border-[#37464F] bg-[#1F2E35]/80 backdrop-blur-sm overflow-hidden shadow-xl"
      >
        <div className="grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_96px_96px] bg-[#131F24] border-b border-[#37464F] text-xs font-extrabold uppercase tracking-wider">
          <div className="px-4 py-3 text-slate-400" />
          <div className="px-2 py-3 text-center text-slate-300">Free</div>
          <div className="px-2 py-3 text-center text-sky-300 bg-sky-500/10">Super</div>
        </div>

        {FEATURES.map((row, i) => (
          <motion.div
            key={row.label}
            variants={staggerItem}
            whileHover={{ backgroundColor: "rgba(32, 47, 54, 0.6)" }}
            className={`grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_96px_96px] items-center ${
              i < FEATURES.length - 1 ? "border-b border-[#37464F]/60" : ""
            } transition-colors`}
          >
            <div className="flex items-center gap-2.5 px-4 py-3.5 text-sm font-bold text-slate-200 font-nunito">
              <span className="text-sky-400 shrink-0">{row.icon}</span>
              {row.label}
            </div>
            <div className="flex justify-center py-3">
              <CellValue value={row.free} />
            </div>
            <div className="flex justify-center py-3 bg-sky-500/5">
              <CellValue value={row.super} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
