"use client";

import React, { useEffect, useState } from "react";
import ForeignWord from "@/components/ForeignWord";

interface ExerciseTapWordProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isAnswerChecked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: unknown;
}

function shuffleOptions(items: string[]): string[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const ExerciseTapWord: React.FC<ExerciseTapWordProps> = ({
  options,
  selectedOption,
  onSelect,
  isAnswerChecked = false,
  isCorrect,
  correctAnswer,
}) => {
  const optionsKey = options.join("|");
  const [shuffled, setShuffled] = useState<string[]>(() => shuffleOptions(options));

  useEffect(() => {
    setShuffled(shuffleOptions(options));
  }, [optionsKey, options]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-wrap gap-3 justify-center">
      {shuffled.map((word) => {
        const selected = selectedOption === word;
        const correct = (correctAnswer as { selected?: string })?.selected === word;
        let cls =
          "px-5 py-3 rounded-2xl font-extrabold border-2 border-b-4 transition-all font-nunito min-w-[5rem] min-h-[44px] ";
        if (isAnswerChecked && correct) cls += "bg-[#1a3d24] border-[#46a302] text-green-400";
        else if (isAnswerChecked && selected && !isCorrect)
          cls += "bg-[#3d1a24] border-rose-500 text-rose-400";
        else if (selected) cls += "bg-[#183949] border-sky-400 text-sky-300 translate-y-0.5 border-b-2";
        else cls += "bg-[#202F36] border-[#37464F] text-slate-100 hover:bg-[#2B3A42] cursor-pointer active:translate-y-0.5";

        return (
          <button
            key={word}
            type="button"
            disabled={isAnswerChecked}
            onClick={() => onSelect(word)}
            className={cls}
          >
            <ForeignWord native={word} size="md" align="center" />
          </button>
        );
      })}
    </div>
  );
};

export default ExerciseTapWord;
