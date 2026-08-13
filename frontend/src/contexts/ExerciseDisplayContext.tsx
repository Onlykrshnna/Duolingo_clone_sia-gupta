"use client";

import React, { createContext, useContext, useMemo } from "react";
import { Exercise } from "@/lib/types";
import {
  buildPronunciationLookup,
  formatPronunciationDisplay,
  shouldShowPronunciation,
  VocabEntry,
} from "@/lib/pronunciation";

type ExerciseDisplayContextValue = {
  targetLang: string;
  unitIndex: number;
  challengeMode: boolean;
  getPronunciation: (native: string, explicit?: string) => string | undefined;
  shouldShow: (native: string, explicit?: string) => boolean;
};

const ExerciseDisplayContext = createContext<ExerciseDisplayContextValue | null>(null);

const FALLBACK: ExerciseDisplayContextValue = {
  targetLang: "",
  unitIndex: 0,
  challengeMode: false,
  getPronunciation: () => undefined,
  shouldShow: () => false,
};

export function ExerciseDisplayProvider({
  children,
  targetLang,
  unitIndex = 0,
  challengeMode = false,
  exercises,
  vocabMap,
}: {
  children: React.ReactNode;
  targetLang: string;
  unitIndex?: number;
  challengeMode?: boolean;
  exercises: Exercise[];
  vocabMap: Map<string, VocabEntry>;
}) {
  const lookup = useMemo(
    () => buildPronunciationLookup(exercises, vocabMap, targetLang),
    [exercises, vocabMap, targetLang]
  );

  const value = useMemo<ExerciseDisplayContextValue>(
    () => ({
      targetLang,
      unitIndex,
      challengeMode,
      getPronunciation: (native: string, explicit?: string) => {
        const raw = explicit || lookup.get(native);
        return formatPronunciationDisplay(targetLang, raw);
      },
      shouldShow: (native: string, explicit?: string) => {
        const pron = explicit || lookup.get(native);
        return shouldShowPronunciation(targetLang, unitIndex, Boolean(pron));
      },
    }),
    [lookup, targetLang, unitIndex, challengeMode]
  );

  return (
    <ExerciseDisplayContext.Provider value={value}>{children}</ExerciseDisplayContext.Provider>
  );
}

export function useExerciseDisplay(): ExerciseDisplayContextValue {
  return useContext(ExerciseDisplayContext) ?? FALLBACK;
}
