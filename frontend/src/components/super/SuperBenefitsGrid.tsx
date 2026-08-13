"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, RotateCcw, Brain, Volume2, BarChart3, ShieldOff } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

const BENEFITS = [
  { title: "Unlimited Hearts", desc: "Practice without worrying about mistakes.", icon: Heart, color: "text-rose-400" },
  { title: "Review Mistakes", desc: "Revisit what you missed and master it.", icon: RotateCcw, color: "text-amber-400" },
  { title: "Smart Practice", desc: "Personalized drills based on your weak spots.", icon: Brain, color: "text-purple-400" },
  { title: "Priority Audio", desc: "Crystal-clear pronunciation on every lesson.", icon: Volume2, color: "text-sky-400" },
  { title: "Progress Tracking", desc: "Deep insights into your learning journey.", icon: BarChart3, color: "text-brand-green" },
  { title: "No Ads", desc: "Stay focused with a distraction-free experience.", icon: ShieldOff, color: "text-indigo-400" },
];

export default function SuperBenefitsGrid() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="px-4 py-10 max-w-4xl mx-auto w-full"
    >
      <motion.h2 variants={staggerItem} className="text-2xl font-extrabold text-white text-center mb-8 font-nunito">
        Super Benefits
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map((b) => (
          <motion.div
            key={b.title}
            variants={staggerItem}
            whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border-2 border-[#37464F] bg-[#1F2E35] p-5 text-left shadow-md"
          >
            <div className={`w-10 h-10 rounded-xl bg-[#131F24] border border-[#37464F] flex items-center justify-center mb-3 ${b.color}`}>
              <b.icon className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-100 text-base font-nunito">{b.title}</h3>
            <p className="mt-1.5 text-sm text-slate-400 font-semibold leading-relaxed font-nunito">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
