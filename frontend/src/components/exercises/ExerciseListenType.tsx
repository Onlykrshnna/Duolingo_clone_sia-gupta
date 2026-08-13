"use client";

import React, { useEffect } from "react";
import AudioButton from "@/components/audio/AudioButton";
import { audioManager } from "@/lib/audio/AudioManager";
import ExerciseTypeAnswer from "./ExerciseTypeAnswer";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

interface ExerciseListenTypeProps {
  typedAnswer: string;
  onChangeAnswer: (text: string) => void;
  isAnswerChecked?: boolean;
  audioUrl?: string | null;
  fallbackText?: string | null;
  fallbackPronunciation?: string;
  showAudio?: boolean;
}

export const ExerciseListenType: React.FC<ExerciseListenTypeProps> = ({
  typedAnswer,
  onChangeAnswer,
  isAnswerChecked,
  fallbackText,
  showAudio = true,
}) => {
  const { targetLang, challengeMode } = useExerciseDisplay();
  const speakText = fallbackText?.trim() ?? "";

  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isAnswerChecked || !speakText) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      void audioManager.play(speakText, targetLang, { context: "vocabulary" });
    };
    window.addEventListener("keydown", onSpace);
    return () => window.removeEventListener("keydown", onSpace);
  }, [isAnswerChecked, speakText, targetLang]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 flex flex-col items-center">
      {showAudio && speakText && (
        <div id="listen-type-audio-btn">
          <AudioButton
            text={speakText}
            language={targetLang}
            variant="circle"
            speechContext="vocabulary"
            challengeMode={challengeMode}
          />
        </div>
      )}

      <p className="text-xs text-[#8b95a5] font-bold uppercase tracking-wider text-center">
        Press play, then type what you hear
      </p>

      <ExerciseTypeAnswer
        typedAnswer={typedAnswer}
        onChangeAnswer={onChangeAnswer}
        isAnswerChecked={isAnswerChecked}
      />
    </div>
  );
};

export default ExerciseListenType;
