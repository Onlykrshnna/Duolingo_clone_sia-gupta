"use client";

import React from "react";
import { motion } from "framer-motion";
import ForeignWord from "@/components/ForeignWord";
import AudioButton from "@/components/audio/AudioButton";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";
import { IntroCardData } from "./ExerciseIntro";

interface ExerciseImageVocabProps {
  data: IntroCardData;
  autoPlayKey?: string;
}

export const ExerciseImageVocab: React.FC<ExerciseImageVocabProps> = ({ data, autoPlayKey }) => {
  const { targetLang, challengeMode } = useExerciseDisplay();
  const pronunciation = data.pronunciation || data.romanization;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto flex flex-col items-center gap-6 font-nunito"
    >
      <div className="w-full max-w-xs aspect-square rounded-3xl bg-[#202F36] border-2 border-[#37464F] flex items-center justify-center overflow-hidden shadow-xl">
        {data.image ? (
          <img src={data.image} alt="" className="w-4/5 h-4/5 object-contain" />
        ) : (
          <span className="text-6xl">📖</span>
        )}
      </div>
      <ForeignWord native={data.targetWord} pronunciation={pronunciation} size="xl" align="center" />
      {data.englishMeaning?.trim() ? (
        <p className="text-xl font-extrabold text-[#58CC02]">{data.englishMeaning}</p>
      ) : null}
      <AudioButton
        text={data.targetWord}
        language={targetLang}
        autoPlay={Boolean(data.isNewWord)}
        autoPlayKey={autoPlayKey}
        speechContext="vocabulary"
        challengeMode={challengeMode}
        size="md"
      />
    </motion.div>
  );
};

export default ExerciseImageVocab;
