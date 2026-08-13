"use client";

import React from "react";
import ForeignWord from "@/components/ForeignWord";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";

interface ExerciseFillBlankProps {
  sentence: string;
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  disabled?: boolean;
  isCorrect?: boolean;
  isAnswerChecked?: boolean;
  correctAnswer?: any;
}

export const ExerciseFillBlank: React.FC<ExerciseFillBlankProps> = ({
  sentence,
  options,
  selectedOption,
  onSelect,
  disabled = false,
  isCorrect,
  isAnswerChecked = false,
  correctAnswer,
}) => {
  // Highlights the selected word or formats empty spaces
  const formatSentence = () => {
    const parts = (sentence || "___").split("___");
    return (
      <span className="font-nunito text-lg sm:text-xl font-extrabold text-slate-100">
        {parts[0]}
        {selectedOption ? (
          <span className="text-sky-400 border-b-2 border-sky-400 px-1 mx-1 inline-flex">
            <ForeignWord native={selectedOption} size="md" align="left" />
          </span>
        ) : (
          <span className="text-[#4E606A] font-bold px-1 mx-1">______</span>
        )}
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 flex flex-col items-center">
      <div className="w-full text-left px-2">
        {formatSentence()}
      </div>

      <div className="w-full">
        <ExerciseMultipleChoice
          options={options}
          selectedOption={selectedOption}
          onSelect={onSelect}
          disabled={disabled}
          isCorrect={isCorrect}
          isAnswerChecked={isAnswerChecked}
          correctAnswer={correctAnswer}
          foreignOptions
        />
      </div>
    </div>
  );
};

export default ExerciseFillBlank;
