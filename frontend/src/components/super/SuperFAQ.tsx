"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "When will I be charged?",
    a: "You won't be charged during your 7-day free trial. This is a demo page — no real payment is processed. In a production app, billing would begin after the trial ends unless you cancel.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel before your trial ends with no charge. Cancel anytime from your account settings with no commitment required.",
  },
  {
    q: "What happens after the trial?",
    a: "After 7 days, your subscription would renew monthly at $12.99 unless cancelled. All Super features remain active while subscribed.",
  },
  {
    q: "Is this the same as the real Duolingo Super?",
    a: "This is an original demo inspired by subscription landing pages. It matches this app's design language and is not affiliated with Duolingo Inc.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#37464F]/80 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left min-h-[44px]"
        aria-expanded={open}
      >
        <span className="font-extrabold text-slate-100 text-sm sm:text-base font-nunito">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-sky-400 shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-slate-400 font-semibold leading-relaxed font-nunito pr-6">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SuperFAQ() {
  return (
    <section className="px-4 py-10 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-extrabold text-white text-center mb-6 font-nunito">FAQ</h2>
      <div className="rounded-2xl border-2 border-[#37464F] bg-[#1F2E35] px-5 sm:px-6 shadow-lg">
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}
