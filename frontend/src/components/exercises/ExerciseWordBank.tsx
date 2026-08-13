"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ForeignWord from "@/components/ForeignWord";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";
import { usesNonLatinScript } from "@/lib/pronunciation";

interface ExerciseWordBankProps {
  tokens: string[]; // List of all available words in the bank
  selectedWords: string[]; // List of strings selected by the user
  onSelectWord: (word: string) => void;
  onUnselectWord: (index: number) => void;
  disabled?: boolean;
  isAnswerChecked?: boolean;
  dragMode?: boolean;
}

export const ExerciseWordBank: React.FC<ExerciseWordBankProps> = ({
  tokens,
  selectedWords,
  onSelectWord,
  onUnselectWord,
  disabled = false,
  isAnswerChecked = false,
  dragMode = false,
}) => {
  const { targetLang } = useExerciseDisplay();
  const cjk = usesNonLatinScript(targetLang);
  const tokenTransform = cjk ? "" : "uppercase tracking-wide";
  // Calculate which token instances are selected, supporting duplicate words
  const getTokensState = () => {
    const selectedCounts: Record<string, number> = {};
    selectedWords.forEach((word) => {
      selectedCounts[word] = (selectedCounts[word] || 0) + 1;
    });

    const occurrencesCounter: Record<string, number> = {};

    return tokens.map((token, index) => {
      occurrencesCounter[token] = (occurrencesCounter[token] || 0) + 1;
      const countSelected = selectedCounts[token] || 0;
      const isConsumed = occurrencesCounter[token] <= countSelected;

      return {
        id: `${token}-${index}`,
        text: token,
        isConsumed,
      };
    });
  };

  const tokenStates = getTokensState();

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 flex flex-col">
      {/* Drop Zone / Selected Words Area */}
      <div className="min-h-[70px] w-full p-4 border-b-2 border-[#37464F] bg-[#202F36] rounded-xl flex flex-wrap gap-2 items-center text-left">
        <AnimatePresence>
          {selectedWords.length === 0 ? (
            <span className="text-sm font-semibold text-[#AAB7C2] select-none">
              {dragMode ? "Drag words into order…" : "Tap words to build your answer…"}
            </span>
          ) : (
            selectedWords.map((word, idx) => (
              <motion.button
                key={`${word}-${idx}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                disabled={disabled || isAnswerChecked}
                onClick={() => onUnselectWord(idx)}
                className={`px-3 py-2 bg-[#2B3A42] border-2 border-b-4 border-[#37464F] rounded-xl text-slate-100 font-bold ${tokenTransform} transition-all outline-none ${
                  isAnswerChecked
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-[#37464F] active:border-b-2 active:translate-y-[2px]"
                }`}
              >
                {cjk ? <ForeignWord native={word} size="xs" align="center" /> : word}
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 3. Word Bank Tokens */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        {tokenStates.map((token) => (
          <div key={token.id} className="relative">
            {/* The token button */}
            <button
              disabled={disabled || isAnswerChecked || token.isConsumed}
              onClick={() => onSelectWord(token.text)}
              className={`px-4 py-2.5 rounded-xl font-bold ${tokenTransform} transition-all outline-none border-2 ${
                token.isConsumed
                  ? "bg-[#202F36] border-[#202F36] text-[#37464F] border-b-2 select-none pointer-events-none cursor-default"
                  : "bg-[#202F36] border-[#37464F] border-b-4 text-slate-100 hover:bg-[#2B3A42] cursor-pointer active:border-b-2 active:translate-y-[2px]"
              }`}
            >
              {cjk ? <ForeignWord native={token.text} size="xs" align="center" /> : token.text}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseWordBank;
