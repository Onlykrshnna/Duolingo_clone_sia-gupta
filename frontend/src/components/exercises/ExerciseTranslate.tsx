"use client";

import React from "react";

interface ExerciseTranslateProps {
  typedAnswer: string;
  onChangeAnswer: (text: string) => void;
  disabled?: boolean;
  isAnswerChecked?: boolean;
}

export const ExerciseTranslate: React.FC<ExerciseTranslateProps> = ({
  typedAnswer,
  onChangeAnswer,
  disabled = false,
  isAnswerChecked = false,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col text-left">
      <textarea
        disabled={disabled || isAnswerChecked}
        value={typedAnswer}
        onChange={(e) => onChangeAnswer(e.target.value)}
        placeholder="Type your translation here..."
        className="w-full p-4 border-2 border-[#37464F] bg-[#202F36] rounded-2xl h-36 font-semibold text-slate-100 placeholder:text-[#4E606A] outline-none focus:border-sky-400 transition-colors resize-none font-nunito text-lg caret-sky-400"
      />
    </div>
  );
};

export default ExerciseTranslate;
