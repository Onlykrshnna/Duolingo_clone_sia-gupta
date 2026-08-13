"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, CreditCard, Clock } from "lucide-react";
import DuoButton from "@/components/DuoButton";

interface SuperTrialCardProps {
  onMaybeLater?: () => void;
}

export default function SuperTrialCard({ onMaybeLater }: SuperTrialCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="px-4 py-8 max-w-lg mx-auto w-full"
    >
      <div className="rounded-3xl border-2 border-[#37464F] bg-gradient-to-b from-[#1F2E35] to-[#131F24] p-6 sm:p-8 shadow-2xl text-center">
        <div className="inline-flex items-center gap-2 bg-brand-green/15 text-brand-green font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          <Clock className="w-3.5 h-3.5" /> 7-Day Free Trial
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-nunito">Start learning without limits</h2>
        <p className="mt-2 text-slate-400 font-semibold text-sm">
          Then <span className="text-white font-extrabold">$12.99/month</span> after your trial
        </p>

        <ul className="mt-6 space-y-2.5 text-left text-sm font-semibold text-slate-300 font-nunito">
          <li className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400 shrink-0" /> Cancel anytime — no commitment
          </li>
          <li className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-400 shrink-0" /> Secure payments (demo — not charged)
          </li>
        </ul>

        <motion.div className="mt-8 space-y-3" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <DuoButton
            variant="super"
            className="w-full py-4 text-sm rounded-2xl bg-gradient-to-r from-[#1CB0F6] to-[#6366F1] border-none shadow-[0_4px_0_#0c4a6e]"
            onClick={() => {
              /* Demo only — no payment */
            }}
          >
            Start My Free Week
          </DuoButton>

          {onMaybeLater ? (
            <button
              type="button"
              onClick={onMaybeLater}
              className="w-full py-3 text-sm font-extrabold uppercase tracking-wider text-sky-400 hover:text-sky-300 transition-colors font-nunito min-h-[44px]"
            >
              Maybe Later
            </button>
          ) : (
            <Link
              href="/"
              className="block w-full py-3 text-sm font-extrabold uppercase tracking-wider text-sky-400 hover:text-sky-300 transition-colors font-nunito min-h-[44px]"
            >
              Maybe Later
            </Link>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
