"use client";

import React from "react";

interface ExercisePromptProps {
  prompt: string;
}

export const ExercisePrompt: React.FC<ExercisePromptProps> = ({ prompt }) => {
  if (!prompt.trim()) return null;

  return (
    <div className="flex items-center gap-4 w-full text-left mb-8">
      <div className="text-5xl select-none shrink-0">🦉</div>
      <div className="relative bg-[#202F36] border-2 border-[#37464F] p-5 rounded-2xl shadow-sm flex-1 font-nunito text-lg sm:text-xl font-extrabold text-slate-100 leading-snug">
        {prompt}
        <div className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-[#37464F]" />
        <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-[#202F36]" />
      </div>
    </div>
  );
};

export default ExercisePrompt;
