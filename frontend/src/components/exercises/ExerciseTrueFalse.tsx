"use client";

import React from "react";

interface ExerciseTrueFalseProps {
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: unknown;
}

export const ExerciseTrueFalse: React.FC<ExerciseTrueFalseProps> = ({
  selectedOption,
  onSelect,
  isAnswerChecked = false,
  isCorrect,
  correctAnswer,
}) => {
  const options = ["True", "False"];

  const style = (opt: string) => {
    const selected = selectedOption === opt;
    const correct = (correctAnswer as { selected?: string })?.selected === opt;
    if (isAnswerChecked && correct) return "bg-[#1a3d24] border-[#46a302] text-green-400";
    if (isAnswerChecked && selected && !isCorrect) return "bg-[#3d1a24] border-rose-500 text-rose-400";
    if (selected) return "bg-[#183949] border-sky-400 text-sky-300";
    return "bg-[#202F36] border-[#37464F] text-slate-100 hover:bg-[#2B3A42]";
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={isAnswerChecked}
          onClick={() => onSelect(opt)}
          className={`py-8 rounded-2xl font-extrabold text-xl border-2 border-b-4 transition-all ${style(opt)}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export default ExerciseTrueFalse;
