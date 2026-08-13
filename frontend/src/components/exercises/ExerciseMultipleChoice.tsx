"use client";

import React, { useEffect } from "react";
import ForeignWord from "@/components/ForeignWord";
import AudioButton from "@/components/audio/AudioButton";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

interface ExerciseMultipleChoiceProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  disabled?: boolean;
  isCorrect?: boolean;
  isAnswerChecked?: boolean;
  correctAnswer?: any;
  foreignOptions?: boolean;
}

export const ExerciseMultipleChoice: React.FC<ExerciseMultipleChoiceProps> = ({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  isCorrect,
  isAnswerChecked = false,
  correctAnswer,
  foreignOptions = false,
}) => {
  const { targetLang, challengeMode } = useExerciseDisplay();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || isAnswerChecked) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= options.length) {
        onSelect(options[num - 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, onSelect, disabled, isAnswerChecked]);

  const getCardStyles = (option: string) => {
    const isSelected = selectedOption === option;

    if (isAnswerChecked) {
      const isThisOptionCorrect = correctAnswer?.selected === option || (isCorrect && isSelected);
      const isThisOptionWrong = isSelected && !isCorrect;

      if (isThisOptionCorrect) {
        return "border-[#46a302] bg-[#1a3d24] text-green-400";
      }
      if (isThisOptionWrong) {
        return "border-rose-500 bg-[#3d1a24] text-rose-400";
      }
    }

    if (isSelected) {
      return "border-sky-400 bg-[#183949] text-sky-300 border-b-2 translate-y-[2px]";
    }

    return "border-[#37464F] bg-[#202F36] text-slate-100 hover:bg-[#2B3A42] border-b-4";
  };

  const getShortcutStyles = (option: string) => {
    const isSelected = selectedOption === option;

    if (isAnswerChecked) {
      const isThisOptionCorrect = correctAnswer?.selected === option || (isCorrect && isSelected);
      const isThisOptionWrong = isSelected && !isCorrect;

      if (isThisOptionCorrect) {
        return "border-green-500 text-green-400 bg-[#1a3d24]";
      }
      if (isThisOptionWrong) {
        return "border-rose-500 text-rose-400 bg-[#3d1a24]";
      }
    }

    if (isSelected) {
      return "border-sky-400 text-sky-300 bg-[#183949]";
    }

    return "border-[#37464F] text-[#AAB7C2] bg-[#2B3A42]";
  };

  return (
    <div className="grid grid-cols-1 gap-3 w-full max-w-lg mx-auto">
      {options.map((option, idx) => {
        const isSelected = selectedOption === option;
        return (
          <button
            key={idx}
            disabled={disabled || isAnswerChecked}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-xl font-bold text-left border-2 flex items-center justify-between transition-all duration-100 outline-none ${getCardStyles(
              option
            )} ${isAnswerChecked ? "cursor-default" : "cursor-pointer active:border-b-2 active:translate-y-[2px]"}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {foreignOptions ? (
                <>
                  <ForeignWord native={option} size="md" align="left" />
                  <AudioButton
                    text={option}
                    language={targetLang}
                    variant="inline"
                    speechContext="vocabulary"
                    challengeMode={challengeMode}
                  />
                </>
              ) : (
                <span className="text-lg font-nunito">{option}</span>
              )}
            </span>
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-extrabold transition-colors shrink-0 ${getShortcutStyles(
                option
              )}`}
            >
              {idx + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ExerciseMultipleChoice;
