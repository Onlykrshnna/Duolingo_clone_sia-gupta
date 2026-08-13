"use client";

import React from "react";
import DuoButton from "@/components/DuoButton";
import Mascot from "@/components/Mascot";

interface InvalidExercisePanelProps {
  reason?: string;
  onSkip: () => void;
  loading?: boolean;
}

export const InvalidExercisePanel: React.FC<InvalidExercisePanelProps> = ({
  reason,
  onSkip,
  loading = false,
}) => (
  <div className="w-full flex flex-col items-center gap-6 py-8 px-4">
    <Mascot size={90} mood="sad" message="This one didn't load correctly" />
    <div className="max-w-md space-y-2 text-center">
      <h2 className="text-xl font-extrabold text-slate-100">This exercise couldn&apos;t be loaded.</h2>
      <p className="text-sm text-slate-400 font-semibold leading-relaxed">
        Something went wrong preparing this question. You can skip it and keep learning.
      </p>
      {reason && process.env.NODE_ENV === "development" && (
        <p className="text-xs text-rose-400/80 font-mono">{reason}</p>
      )}
    </div>
    <DuoButton variant="primary" className="min-w-[200px]" onClick={onSkip} disabled={loading}>
      Skip Exercise
    </DuoButton>
  </div>
);

export default InvalidExercisePanel;
