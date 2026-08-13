"use client";

import React from "react";
import DuoButton from "@/components/DuoButton";
import Mascot from "@/components/Mascot";

interface InvalidExercisePanelProps {
  exerciseId?: string;
  template?: string;
  lessonId?: string;
  reason?: string;
  onSkip: () => void;
  loading?: boolean;
}

export const InvalidExercisePanel: React.FC<InvalidExercisePanelProps> = ({
  exerciseId,
  template,
  lessonId,
  reason,
  onSkip,
  loading = false,
}) => {
  React.useEffect(() => {
    console.error("[InvalidExercisePanel] Corrupted exercise", {
      exerciseId,
      template,
      lessonId,
      reason,
    });
  }, [exerciseId, template, lessonId, reason]);

  return (
    <div className="w-full flex flex-col items-center gap-6 py-8 px-4">
      <Mascot size={90} mood="sad" message="This one didn't load correctly" />
      <div className="max-w-md space-y-2 text-center">
        <h2 className="text-xl font-extrabold text-slate-100">This exercise couldn&apos;t be loaded.</h2>
        <p className="text-sm text-slate-400 font-semibold leading-relaxed">
          Something went wrong preparing this question. You can skip it and keep learning.
        </p>
      </div>
      <DuoButton variant="primary" className="min-w-[200px] min-h-[44px]" onClick={onSkip} disabled={loading}>
        Skip Exercise
      </DuoButton>
    </div>
  );
};

export default InvalidExercisePanel;
