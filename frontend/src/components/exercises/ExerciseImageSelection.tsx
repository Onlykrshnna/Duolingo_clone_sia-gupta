"use client";

import React, { useEffect } from "react";
import ForeignWord from "@/components/ForeignWord";
import AudioButton from "@/components/audio/AudioButton";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

export interface ImageOption {
  label: string;
  image: string;
  romanization?: string;
  pronunciation?: string;
  hideEnglish?: boolean;
}

interface ExerciseImageSelectionProps {
  options: ImageOption[];
  selectedOption: string | null;
  onSelect: (label: string) => void;
  disabled?: boolean;
  isCorrect?: boolean;
  isAnswerChecked?: boolean;
  correctAnswer?: { selected?: string };
  audioUrl?: string | null;
  fallbackText?: string | null;
  showAudioPlayer?: boolean;
  fallbackPronunciation?: string;
}

export const ExerciseImageSelection: React.FC<ExerciseImageSelectionProps> = ({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  isAnswerChecked = false,
  isCorrect,
  correctAnswer,
  fallbackText,
  showAudioPlayer = false,
  fallbackPronunciation,
}) => {
  const { targetLang, challengeMode } = useExerciseDisplay();
  const speakText = fallbackText?.trim() ?? "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || isAnswerChecked) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= options.length) {
        onSelect(options[num - 1].label);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, onSelect, disabled, isAnswerChecked]);

  const getCardStyles = (label: string) => {
    const isSelected = selectedOption === label;

    if (isAnswerChecked) {
      const isThisCorrect = correctAnswer?.selected === label || (isCorrect && isSelected);
      const isThisWrong = isSelected && !isCorrect;
      if (isThisCorrect) return "border-[#46a302] bg-[#1a3d24]";
      if (isThisWrong) return "border-rose-500 bg-[#3d1a24]";
    }

    if (isSelected) return "border-sky-400 bg-[#183949] border-b-2 translate-y-[2px]";
    return "border-[#37464F] bg-[#202F36] hover:bg-[#2B3A42] border-b-4";
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {showAudioPlayer && speakText && (
        <div className="flex justify-center">
          <AudioButton
            text={speakText}
            language={targetLang}
            variant="circle"
            speechContext="vocabulary"
            challengeMode={challengeMode}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 w-full">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option.label;
          const pronunciation = option.pronunciation || option.romanization;
          return (
            <button
              key={`${option.label}-${idx}`}
              disabled={disabled || isAnswerChecked}
              onClick={() => onSelect(option.label)}
              className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-100 outline-none ${getCardStyles(
                option.label
              )} ${isAnswerChecked ? "cursor-default" : "cursor-pointer active:border-b-2 active:translate-y-[2px]"}`}
            >
              <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-md border border-[#37464F] text-[10px] font-extrabold text-[#AAB7C2] bg-[#2B3A42]">
                {idx + 1}
              </span>
              <div className="absolute top-2 right-2">
                <AudioButton
                  text={option.label}
                  language={targetLang}
                  variant="inline"
                  speechContext="vocabulary"
                  challengeMode={challengeMode}
                />
              </div>
              <div className="w-20 h-20 flex items-center justify-center mb-2">
                <img src={option.image} alt="" className="w-full h-full object-contain" />
              </div>
              <ForeignWord
                native={option.label}
                pronunciation={pronunciation}
                size="sm"
                align="center"
                nativeClassName={isSelected ? "text-sky-300" : ""}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExerciseImageSelection;
