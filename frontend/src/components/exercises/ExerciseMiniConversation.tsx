"use client";

import React from "react";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";

interface ExerciseMiniConversationProps {
  prompt: string;
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: unknown;
  foreignOptions?: boolean;
}

export const ExerciseMiniConversation: React.FC<ExerciseMiniConversationProps> = ({
  prompt,
  options,
  ...mcProps
}) => {
  const lines = prompt.split("\n");

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-3 rounded-2xl font-bold text-sm ${
              i % 2 === 0
                ? "bg-[#1CB0F6]/20 border border-[#1CB0F6]/40 text-sky-200 ml-0 mr-auto"
                : "bg-[#58CC02]/15 border border-[#58CC02]/30 text-green-200 ml-auto mr-0"
            }`}
          >
            {line}
          </div>
        ))}
      </div>
      <ExerciseMultipleChoice options={options} {...mcProps} />
    </div>
  );
};

export default ExerciseMiniConversation;
