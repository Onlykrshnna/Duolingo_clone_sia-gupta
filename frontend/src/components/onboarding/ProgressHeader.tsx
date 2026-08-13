"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getOnboardingProgress } from "@/lib/onboarding";

interface ProgressHeaderProps {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  step,
  totalSteps,
  onBack,
  showBack = true,
}) => {
  const progress = getOnboardingProgress(step);

  return (
    <header className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-center gap-4">
      {showBack && onBack ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border-2 border-[#37464F] bg-[#1F2E35] text-slate-300 hover:bg-[#2A3B43] hover:border-slate-500 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </motion.button>
      ) : (
        <div className="w-11 shrink-0" aria-hidden />
      )}

      <div className="flex-1 h-[14px] bg-[#202F36] rounded-full overflow-hidden border-2 border-[#37464F]">
        <motion.div
          className="h-full bg-brand-green rounded-full shadow-[0_0_8px_rgba(88,204,2,0.45)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <span className="sr-only">
        Step {step} of {totalSteps}
      </span>
    </header>
  );
};

export default ProgressHeader;
