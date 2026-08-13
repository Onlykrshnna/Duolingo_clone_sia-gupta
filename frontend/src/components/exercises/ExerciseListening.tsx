"use client";

import React, { useEffect } from "react";
import AudioButton from "@/components/audio/AudioButton";
import { audioManager } from "@/lib/audio/AudioManager";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

interface ExerciseListeningProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  audioUrl?: string | null;
  fallbackText?: string | null;
  romanization?: string;
  pronunciation?: string;
  englishMeaning?: string;
  disabled?: boolean;
  isCorrect?: boolean;
  isAnswerChecked?: boolean;
  correctAnswer?: { selected?: string };
}

export const ExerciseListening: React.FC<ExerciseListeningProps> = ({
  options,
  selectedOption,
  onSelect,
  fallbackText,
  disabled = false,
  isAnswerChecked = false,
  isCorrect,
  correctAnswer,
}) => {
  const { targetLang, challengeMode } = useExerciseDisplay();
  const speakText = fallbackText?.trim() ?? "";

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

  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isAnswerChecked || disabled || !speakText) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      void audioManager.play(speakText, targetLang, { context: "vocabulary" });
    };
    window.addEventListener("keydown", onSpace);
    return () => window.removeEventListener("keydown", onSpace);
  }, [isAnswerChecked, disabled, speakText, targetLang]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {speakText ? (
        <div id="listening-audio-btn">
          <AudioButton
            text={speakText}
            language={targetLang}
            variant="circle"
            speechContext="vocabulary"
            challengeMode={challengeMode}
            disabled={!speakText}
          />
        </div>
      ) : (
        <p className="text-sm text-[#AAB7C2] font-semibold">No audio available for this exercise.</p>
      )}

      <p className="text-xs text-[#8b95a5] font-bold uppercase tracking-wider">
        Listen, then choose the meaning
      </p>

      <ExerciseMultipleChoice
        options={options}
        selectedOption={selectedOption}
        onSelect={onSelect}
        disabled={disabled}
        isAnswerChecked={isAnswerChecked}
        isCorrect={isCorrect}
        correctAnswer={correctAnswer}
        foreignOptions={false}
      />
    </div>
  );
};

export default ExerciseListening;
