"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import AudioButton from "@/components/audio/AudioButton";
import { WritingCharacter } from "@/lib/types";

type QuizType = "tap_character" | "choose_pronunciation" | "image_match" | "listening" | "typing";

interface CharacterQuizProps {
  character: WritingCharacter;
  pool: WritingCharacter[];
  languageCode: string;
  onAnswer: (correct: boolean) => void;
}

function pickQuizType(index: number): QuizType {
  const types: QuizType[] = ["tap_character", "choose_pronunciation", "image_match", "listening", "typing"];
  return types[index % types.length];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const CharacterQuiz: React.FC<CharacterQuizProps> = ({
  character,
  pool,
  languageCode,
  onAnswer,
}) => {
  const quizType = useMemo(() => pickQuizType(character.order_index), [character.order_index]);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);

  const distractors = useMemo(() => {
    const others = pool.filter((c) => c.id !== character.id);
    return shuffle(others).slice(0, 3);
  }, [character.id, pool]);

  const glyphOptions = useMemo(
    () => shuffle([character, ...distractors]).map((c) => c.glyph),
    [character, distractors]
  );

  const pronOptions = useMemo(
    () => shuffle([character.pronunciation, ...distractors.map((d) => d.pronunciation)]),
    [character, distractors]
  );

  const imageOptions = useMemo(
    () => shuffle([character, ...distractors]),
    [character, distractors]
  );

  const handleSelect = (value: string, correct: boolean) => {
    if (checked) return;
    setSelected(value);
    setChecked(true);
    setTimeout(() => onAnswer(correct), 600);
  };

  const handleTypeSubmit = () => {
    if (checked) return;
    const ok =
      typed.trim().toLowerCase() === character.romanization.toLowerCase() ||
      typed.trim().toLowerCase() === character.glyph.toLowerCase();
    setChecked(true);
    setTimeout(() => onAnswer(ok), 600);
  };

  const prompt = {
    tap_character: "Tap the correct character",
    choose_pronunciation: `How is "${character.glyph}" pronounced?`,
    image_match: `Which character matches this word?`,
    listening: "Listen and choose the character",
    typing: `Type the reading for "${character.glyph}"`,
  }[quizType];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-lg mx-auto space-y-6 font-nunito"
    >
      <p className="text-center text-sm font-extrabold uppercase tracking-wider text-[#1CB0F6]">
        Mini Quiz
      </p>
      <h3 className="text-center text-lg font-extrabold text-slate-100">{prompt}</h3>

      {quizType === "image_match" && (
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#202F36] border border-[#37464F]">
          <span className="text-4xl">{character.image_emoji}</span>
          <p className="text-xl font-bold text-slate-100">{character.example_glyph}</p>
        </div>
      )}

      {quizType === "listening" && (
        <div className="flex justify-center">
          <AudioButton
            text={character.glyph}
            language={languageCode}
            variant="circle"
            autoPlay
            autoPlayKey={`quiz-${character.id}`}
          />
        </div>
      )}

      {quizType === "typing" ? (
        <div className="space-y-4">
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={checked}
            className="w-full px-4 py-3 rounded-xl bg-[#202F36] border-2 border-[#37464F] text-slate-100 font-bold text-center text-lg focus:border-[#1CB0F6] outline-none"
            placeholder="Type reading…"
            onKeyDown={(e) => e.key === "Enter" && handleTypeSubmit()}
          />
          <button
            type="button"
            onClick={handleTypeSubmit}
            disabled={checked || !typed.trim()}
            className="w-full py-3 rounded-xl bg-[#1CB0F6] text-white font-extrabold disabled:opacity-40 cursor-pointer"
          >
            Check
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {quizType === "tap_character" &&
            glyphOptions.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleSelect(g, g === character.glyph)}
                className={`p-4 rounded-xl border-2 text-3xl font-extrabold transition-all cursor-pointer ${
                  checked && g === character.glyph
                    ? "border-[#46a302] bg-[#1a3d24]"
                    : checked && selected === g
                      ? "border-rose-500 bg-[#3d1a24]"
                      : "border-[#37464F] bg-[#202F36] hover:bg-[#2B3A42]"
                }`}
              >
                {g}
              </button>
            ))}

          {quizType === "choose_pronunciation" &&
            pronOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSelect(p, p === character.pronunciation)}
                className={`p-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                  checked && p === character.pronunciation
                    ? "border-[#46a302] bg-[#1a3d24] text-green-400"
                    : checked && selected === p
                      ? "border-rose-500 bg-[#3d1a24] text-rose-400"
                      : "border-[#37464F] bg-[#202F36] text-slate-100 hover:bg-[#2B3A42]"
                }`}
              >
                {p}
              </button>
            ))}

          {(quizType === "image_match" || quizType === "listening") &&
            imageOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id, c.id === character.id)}
                className={`p-3 rounded-xl border-2 text-2xl font-extrabold transition-all cursor-pointer ${
                  checked && c.id === character.id
                    ? "border-[#46a302] bg-[#1a3d24]"
                    : checked && selected === c.id
                      ? "border-rose-500 bg-[#3d1a24]"
                      : "border-[#37464F] bg-[#202F36] hover:bg-[#2B3A42]"
                }`}
              >
                {c.glyph}
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
};

export default CharacterQuiz;
