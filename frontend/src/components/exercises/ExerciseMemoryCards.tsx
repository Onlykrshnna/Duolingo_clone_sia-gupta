"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ForeignWord from "@/components/ForeignWord";

interface ExerciseMemoryCardsProps {
  left: string[];
  right: string[];
  pairs: Record<string, string>;
  matchedPairs: Record<string, string>;
  onMatch: (leftCard: string, rightCard: string) => void;
  onSetMatchedPairs: (allPairs: Record<string, string>) => void;
  isAnswerChecked?: boolean;
}

type Card = { id: string; text: string; side: "en" | "target" };

export const ExerciseMemoryCards: React.FC<ExerciseMemoryCardsProps> = ({
  left,
  right,
  pairs,
  matchedPairs,
  onMatch,
  onSetMatchedPairs,
  isAnswerChecked = false,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [first, setFirst] = useState<Card | null>(null);
  const [second, setSecond] = useState<Card | null>(null);

  useEffect(() => {
    const deck: Card[] = [
      ...left.map((t, i) => ({ id: `l-${i}`, text: t, side: "en" as const })),
      ...right.map((t, i) => ({ id: `r-${i}`, text: t, side: "target" as const })),
    ].sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped(new Set());
    setMatched(new Set());
    setFirst(null);
    setSecond(null);
  }, [left.join("|"), right.join("|")]);

  useEffect(() => {
    if (!first || !second) return;
    const timer = setTimeout(() => {
      const enCard = first.side === "en" ? first : second;
      const targetCard = first.side === "target" ? first : second;
      if (enCard && targetCard && pairs[enCard.text] === targetCard.text) {
        const newMatched = new Set(matched).add(first.id).add(second.id);
        setMatched(newMatched);
        const newPairs = { ...matchedPairs, [enCard.text]: targetCard.text };
        onMatch(enCard.text, targetCard.text);
        if (Object.keys(newPairs).length >= left.length) onSetMatchedPairs(newPairs);
      }
      setFlipped(new Set());
      setFirst(null);
      setSecond(null);
    }, 700);
    return () => clearTimeout(timer);
  }, [first, second, pairs, matched, matchedPairs, left.length, onMatch, onSetMatchedPairs]);

  const flip = (card: Card) => {
    if (isAnswerChecked || matched.has(card.id) || flipped.has(card.id)) return;
    const next = new Set(flipped).add(card.id);
    setFlipped(next);
    if (!first) setFirst(card);
    else if (!second && card.id !== first.id) setSecond(card);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-xl mx-auto">
      {cards.map((card) => {
        const isFlipped = flipped.has(card.id) || matched.has(card.id);
        return (
          <motion.button
            key={card.id}
            type="button"
            disabled={isAnswerChecked || matched.has(card.id)}
            onClick={() => flip(card)}
            whileTap={{ scale: 0.96 }}
            className={`aspect-[3/4] rounded-xl border-2 border-b-4 font-bold text-sm p-2 flex items-center justify-center text-center transition-colors ${
              matched.has(card.id)
                ? "bg-[#1a3d24] border-[#46a302] text-green-400 opacity-70"
                : isFlipped
                  ? "bg-[#183949] border-sky-400 text-sky-200"
                  : "bg-[#37464F] border-[#4E606A] text-transparent"
            }`}
          >
            {isFlipped ? (
              card.side === "target" ? (
                <ForeignWord native={card.text} size="xs" align="center" />
              ) : (
                card.text
              )
            ) : (
              "?"
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ExerciseMemoryCards;
