"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import ForeignWord from "@/components/ForeignWord";
import AudioButton from "@/components/audio/AudioButton";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

export interface IntroCardData {
  targetWord: string;
  romanization?: string;
  pronunciation?: string;
  englishMeaning: string;
  image?: string | null;
  audio?: string | null;
  isNewWord?: boolean;
}

interface ExerciseIntroProps {
  data: IntroCardData;
  layout?: "flashcard" | "speaking";
  autoPlayKey?: string;
}

export const ExerciseIntro: React.FC<ExerciseIntroProps> = ({
  data,
  layout = "flashcard",
  autoPlayKey,
}) => {
  const { targetLang, challengeMode } = useExerciseDisplay();
  const pronunciation = data.pronunciation || data.romanization;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md mx-auto flex flex-col items-center gap-5 font-nunito"
    >
      {data.isNewWord && (
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1CB0F6] bg-[#1CB0F6]/10 px-3 py-1 rounded-full">
          New word
        </span>
      )}

      {data.image ? (
        <div className="w-36 h-36 rounded-3xl bg-[#202F36] border-2 border-[#37464F] flex items-center justify-center overflow-hidden shadow-lg">
          <img src={data.image} alt="" className="w-28 h-28 object-contain" />
        </div>
      ) : null}

      <ForeignWord
        native={data.targetWord}
        pronunciation={pronunciation}
        size="xl"
        align="center"
      />

      {data.englishMeaning?.trim() ? (
        <p className="text-xl font-extrabold text-[#58CC02]">{data.englishMeaning}</p>
      ) : null}

      {layout === "speaking" ? (
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1CB0F6] hover:bg-[#1590D0] text-white font-extrabold text-sm shadow-[0_3px_0_#1280B0] active:translate-y-0.5 transition-all cursor-pointer"
          aria-label="Speaking practice"
        >
          <Mic className="w-5 h-5" />
          Tap microphone — repeat after Duo
        </button>
      ) : (
        <AudioButton
          text={data.targetWord}
          language={targetLang}
          autoPlay={Boolean(data.isNewWord)}
          autoPlayKey={autoPlayKey}
          speechContext="vocabulary"
          challengeMode={challengeMode}
          size="md"
        />
      )}
    </motion.div>
  );
};

export default ExerciseIntro;
