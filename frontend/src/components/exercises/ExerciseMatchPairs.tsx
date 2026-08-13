"use client";

import React, { useState, useEffect } from "react";
import ForeignWord from "@/components/ForeignWord";
import AudioButton from "@/components/audio/AudioButton";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

interface ExerciseMatchPairsProps {
  left: string[]; // e.g. ["boy", "girl", "dog", "cat"]
  right: string[]; // e.g. ["niño", "niña", "perro", "gato"]
  pairs: Record<string, string>; // The correct matching key-value pairs
  matchedPairs: Record<string, string>; // Store's matched pairs
  onMatch: (leftCard: string, rightCard: string) => void;
  onSetMatchedPairs: (allPairs: Record<string, string>) => void;
  disabled?: boolean;
  isAnswerChecked?: boolean;
}

export const ExerciseMatchPairs: React.FC<ExerciseMatchPairsProps> = ({
  left,
  right,
  pairs,
  matchedPairs,
  onMatch,
  onSetMatchedPairs,
  disabled = false,
  isAnswerChecked = false,
}) => {
  const [shuffledLeft, setShuffledLeft] = useState<string[]>([]);
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);
  
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  const [localMatches, setLocalMatches] = useState<Record<string, string>>({});
  const [failedLeft, setFailedLeft] = useState<string | null>(null);
  const [failedRight, setFailedRight] = useState<string | null>(null);

  const { targetLang, challengeMode } = useExerciseDisplay();

  // Shuffle columns once on load
  useEffect(() => {
    setShuffledLeft([...left].sort(() => Math.random() - 0.5));
    setShuffledRight([...right].sort(() => Math.random() - 0.5));
    setLocalMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [left, right]);

  // Check matching when both are selected
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const correctRight = pairs[selectedLeft];
      const isMatch = correctRight === selectedRight;

      if (isMatch) {
        // Successful match
        const newMatches = { ...localMatches, [selectedLeft]: selectedRight };
        setLocalMatches(newMatches);
        onMatch(selectedLeft, selectedRight);
        
        // If all pairs are matched, notify the store
        if (Object.keys(newMatches).length === left.length) {
          onSetMatchedPairs(newMatches);
        }
        
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        // Failed match: trigger error flash & reset after delay
        setFailedLeft(selectedLeft);
        setFailedRight(selectedRight);
        
        const timer = setTimeout(() => {
          setFailedLeft(null);
          setFailedRight(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [selectedLeft, selectedRight, pairs, localMatches, left.length, onMatch, onSetMatchedPairs]);

  const handleLeftClick = (card: string) => {
    if (disabled || isAnswerChecked || localMatches[card]) return;
    setSelectedLeft(card);
  };

  const handleRightClick = (card: string) => {
    if (disabled || isAnswerChecked || Object.values(localMatches).includes(card)) return;
    setSelectedRight(card);
  };

  const getCardStyle = (card: string, isLeft: boolean) => {
    const isMatched = isLeft 
      ? !!localMatches[card] 
      : Object.values(localMatches).includes(card);
      
    if (isMatched) {
      return "bg-[#1a3d24] border-[#46a302]/60 text-green-400 border-b-2 opacity-50 cursor-default";
    }

    const isSelected = isLeft ? selectedLeft === card : selectedRight === card;
    const isFailed = isLeft ? failedLeft === card : failedRight === card;

    if (isFailed) {
      return "bg-[#3d1a24] border-rose-500 text-rose-400 border-b-2 animate-shake";
    }

    if (isSelected) {
      return "bg-[#183949] border-sky-400 text-sky-300 border-b-2 translate-y-[2px]";
    }

    return "bg-[#202F36] border-[#37464F] border-b-4 text-slate-100 hover:bg-[#2B3A42] cursor-pointer active:border-b-2 active:translate-y-[2px]";
  };

  return (
    <div className="w-full max-w-lg mx-auto flex gap-6 pt-4 select-none">
      {/* Left Column (e.g. English) */}
      <div className="flex-1 flex flex-col gap-3">
        {shuffledLeft.map((card) => (
          <button
            key={card}
            disabled={disabled || isAnswerChecked || !!localMatches[card]}
            onClick={() => handleLeftClick(card)}
            className={`p-4 rounded-xl font-bold border-2 transition-all duration-100 text-center outline-none ${getCardStyle(
              card,
              true
            )}`}
          >
            {card}
          </button>
        ))}
      </div>

      {/* Right Column (e.g. Spanish) */}
      <div className="flex-1 flex flex-col gap-3">
        {shuffledRight.map((card) => (
          <div
            key={card}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleRightClick(card);
            }}
            onClick={() => handleRightClick(card)}
            className={`p-4 rounded-xl font-bold border-2 transition-all duration-100 text-center outline-none ${getCardStyle(
              card,
              false
            )} ${disabled || isAnswerChecked || Object.values(localMatches).includes(card) ? "pointer-events-none" : ""}`}
          >
            <div className="flex items-center justify-center gap-1">
              <ForeignWord native={card} size="sm" align="center" />
              <AudioButton
                text={card}
                language={targetLang}
                variant="inline"
                speechContext="vocabulary"
                challengeMode={challengeMode}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseMatchPairs;
