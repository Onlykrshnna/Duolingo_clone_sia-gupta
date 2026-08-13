"use client";

import React from "react";
import ForeignWord from "@/components/ForeignWord";

interface ExerciseTypeAnswerProps {
  typedAnswer: string;
  onChangeAnswer: (text: string) => void;
  disabled?: boolean;
  isAnswerChecked?: boolean;
  pronunciationHint?: string;
}

export const ExerciseTypeAnswer: React.FC<ExerciseTypeAnswerProps> = ({
  typedAnswer,
  onChangeAnswer,
  disabled = false,
  isAnswerChecked = false,
  pronunciationHint,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col text-left gap-3">
      <input
        type="text"
        disabled={disabled || isAnswerChecked}
        value={typedAnswer}
        onChange={(e) => onChangeAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-4 border-2 border-[#37464F] bg-[#202F36] rounded-2xl font-semibold text-slate-100 placeholder:text-[#4E606A] outline-none focus:border-sky-400 transition-colors font-nunito text-lg caret-sky-400"
      />
      {pronunciationHint && (
        <p className="text-center text-xs font-semibold text-[#8b95a5] font-nunito tracking-wide">
          {pronunciationHint}
        </p>
      )}
    </div>
  );
};

export default ExerciseTypeAnswer;
