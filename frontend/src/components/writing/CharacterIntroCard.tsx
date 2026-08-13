"use client";

import React from "react";
import { motion } from "framer-motion";
import AudioButton from "@/components/audio/AudioButton";
import { WritingCharacter } from "@/lib/types";

interface CharacterIntroCardProps {
  character: WritingCharacter;
  languageCode: string;
  autoPlayKey: string;
}

export const CharacterIntroCard: React.FC<CharacterIntroCardProps> = ({
  character,
  languageCode,
  autoPlayKey,
}) => {
  const speakText = character.example_glyph.includes(character.glyph)
    ? character.example_glyph
    : character.glyph;

  return (
    <motion.div
      key={character.id}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="w-full max-w-md mx-auto flex flex-col items-center gap-5 font-nunito text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: 2, duration: 0.6 }}
        className="text-7xl sm:text-8xl font-extrabold text-slate-100 drop-shadow-lg"
      >
        {character.glyph}
      </motion.div>

      <p className="text-lg font-bold text-[#8b95a5] tracking-wide">{character.romanization}</p>
      <p className="text-sm font-semibold text-[#AAB7C2]">&quot;{character.pronunciation}&quot;</p>

      <div className="w-full rounded-2xl bg-[#202F36] border-2 border-[#37464F] p-5 flex flex-col items-center gap-3">
        <span className="text-5xl">{character.image_emoji}</span>
        <p className="text-2xl font-extrabold text-slate-100">{character.example_glyph}</p>
        <p className="text-base font-bold text-[#58CC02]">{character.example_meaning}</p>
      </div>

      <AudioButton
        text={speakText}
        language={languageCode}
        autoPlay
        autoPlayKey={autoPlayKey}
        speechContext="vocabulary"
        size="md"
      />
    </motion.div>
  );
};

export default CharacterIntroCard;
