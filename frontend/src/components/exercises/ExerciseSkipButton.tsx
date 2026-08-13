"use client";

import React from "react";
import { SkipForward } from "lucide-react";

interface ExerciseSkipButtonProps {
  onSkip: () => void;
  disabled?: boolean;
}

export const ExerciseSkipButton: React.FC<ExerciseSkipButtonProps> = ({ onSkip, disabled }) => {
  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide text-[#AAB7C2] hover:text-slate-200 hover:bg-[#202F36] border border-transparent hover:border-[#37464F] transition-colors disabled:opacity-40 disabled:pointer-events-none"
      title="Skip (Esc)"
      aria-label="Skip this exercise"
    >
      <SkipForward className="w-4 h-4" />
      Skip
    </button>
  );
};

export default ExerciseSkipButton;
