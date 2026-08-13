"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TESTIMONIALS = [
  { name: "Maria L.", flag: "🇪🇸", text: "Super helped me stay consistent. Unlimited hearts changed everything!" },
  { name: "Kenji T.", flag: "🇯🇵", text: "The mistake review feature is a game-changer for Japanese practice." },
  { name: "Sophie M.", flag: "🇫🇷", text: "I finally finished my daily goal every day this month. Worth it!" },
  { name: "Alex R.", flag: "🇩🇪", text: "Clean, focused learning with zero ads. Premium feels right." },
];

export default function SuperTestimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = TESTIMONIALS[index];

  return (
    <section className="px-4 py-10 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-extrabold text-white text-center mb-8 font-nunito">Learners love Super</h2>

      <div className="relative min-h-[140px]">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border-2 border-[#37464F] bg-[#1F2E35] p-6 text-center shadow-lg"
          >
            <p className="text-slate-200 font-semibold text-sm sm:text-base leading-relaxed font-nunito italic">
              &ldquo;{current.text}&rdquo;
            </p>
            <footer className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xl">{current.flag}</span>
              <cite className="not-italic font-extrabold text-sky-300 text-sm font-nunito">{current.name}</cite>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Testimonial ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-all min-w-[8px] min-h-[8px] ${
              i === index ? "bg-sky-400 w-6" : "bg-slate-600 hover:bg-slate-500"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
