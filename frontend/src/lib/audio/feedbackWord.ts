import { Exercise } from "@/lib/types";
import { NormalizedExercise } from "@/lib/exerciseUtils";

export type FeedbackWord = {
  text: string;
  pronunciation?: string;
  meaning?: string;
};

export function getFeedbackWord(
  normalized: NormalizedExercise,
  correctAnswer: unknown,
  exercise?: Exercise | null
): FeedbackWord | null {
  const meta = (exercise?.metadata ?? {}) as Record<string, unknown>;

  const target =
    (meta.targetWord as string) ||
    (meta.target as string) ||
    normalized.fallbackText ||
    normalized.intro?.targetWord ||
    null;

  let text = target;

  if (!text && correctAnswer && typeof correctAnswer === "object") {
    const ca = correctAnswer as Record<string, unknown>;
    if (typeof ca.selected === "string") text = ca.selected;
    else if (typeof ca.text === "string") text = ca.text;
    else if (typeof ca.translation === "string") text = ca.translation;
    else if (Array.isArray(ca.words)) text = (ca.words as string[]).join(" ");
  }

  if (!text?.trim()) return null;

  return {
    text: text.trim(),
    pronunciation:
      (meta.pronunciation as string) ||
      (meta.romanization as string) ||
      normalized.pronunciation ||
      normalized.romanization ||
      normalized.intro?.pronunciation ||
      normalized.intro?.romanization,
    meaning:
      (meta.englishMeaning as string) ||
      (meta.english as string) ||
      normalized.englishMeaning ||
      normalized.intro?.englishMeaning,
  };
}
