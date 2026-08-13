"use client";

import React from "react";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";

export type ForeignWordSize = "xs" | "sm" | "md" | "lg" | "xl";

const NATIVE_SIZE: Record<ForeignWordSize, string> = {
  xs: "text-sm font-bold",
  sm: "text-base font-extrabold",
  md: "text-lg font-extrabold",
  lg: "text-2xl font-extrabold",
  xl: "text-4xl sm:text-5xl font-extrabold",
};

const PRON_SIZE: Record<ForeignWordSize, string> = {
  xs: "text-[10px] font-semibold",
  sm: "text-[11px] font-semibold",
  md: "text-xs font-semibold",
  lg: "text-sm font-semibold",
  xl: "text-sm font-semibold",
};

export interface ForeignWordProps {
  native: string;
  pronunciation?: string;
  meaning?: string;
  languageCode?: string;
  /** Show pronunciation for Latin languages (e.g. French Unit 1). */
  forcePronunciation?: boolean;
  size?: ForeignWordSize;
  /** Show English meaning line (only when exercise requires it). */
  showMeaning?: boolean;
  /** Force pronunciation on/off; otherwise derived from language rules. */
  showPronunciation?: boolean;
  align?: "center" | "left";
  className?: string;
  nativeClassName?: string;
}

export const ForeignWord: React.FC<ForeignWordProps> = ({
  native,
  pronunciation,
  meaning,
  size = "md",
  showMeaning = false,
  showPronunciation,
  forcePronunciation = false,
  align = "center",
  className = "",
  nativeClassName = "",
}) => {
  const display = useExerciseDisplay();
  const resolvedPron = pronunciation ?? display.getPronunciation(native);
  const showPron =
    showPronunciation ?? (forcePronunciation ? Boolean(resolvedPron) : display.shouldShow(native, resolvedPron));

  return (
    <span
      className={`inline-flex flex-col gap-0.5 leading-tight ${
        align === "center" ? "items-center text-center" : "items-start text-left"
      } ${className}`}
    >
      <span className={`text-slate-100 font-nunito ${NATIVE_SIZE[size]} ${nativeClassName}`}>
        {native}
      </span>
      {showPron && resolvedPron && (
        <span
          className={`text-[#8b95a5] font-nunito tracking-wide ${PRON_SIZE[size]}`}
          aria-label={`Pronunciation: ${resolvedPron}`}
        >
          {resolvedPron}
        </span>
      )}
      {showMeaning && meaning && (
        <span className="text-[#58CC02] text-sm font-bold font-nunito">{meaning}</span>
      )}
    </span>
  );
};

export default ForeignWord;
