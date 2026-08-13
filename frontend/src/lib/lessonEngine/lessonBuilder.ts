import { Exercise } from "@/lib/types";
import { LessonProgressEngine, buildVocabMapFromExercises } from "./progressEngine";
import { filterValidExercises } from "./exerciseValidator";
import { enrichExercises } from "./exerciseEnrichment";

/** Prepare exercises from API and attach progress tracking. */
export function buildLessonSession(
  exercises: Exercise[],
  targetLang: string
): {
  exercises: Exercise[];
  progress: LessonProgressEngine;
  vocabMap: Map<string, { english: string; target: string; romanization: string }>;
  rejectedCount: number;
} {
  const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index);
  const enriched = enrichExercises(sorted);
  const { valid, rejected } = filterValidExercises(enriched, targetLang || undefined);
  const progress = new LessonProgressEngine();
  const vocabMap = buildVocabMapFromExercises(valid);

  if (rejected.length > 0) {
    console.warn(
      `[LessonSession] Filtered ${rejected.length} invalid exercise(s) from lesson load`
    );
  }

  return { exercises: valid, progress, vocabMap, rejectedCount: rejected.length };
}

export function prepareLessonCompletion(
  exercises: Exercise[],
  currentIndex: number,
  progress: LessonProgressEngine,
  vocabMap: Map<string, { english: string; target: string; romanization: string }>,
  targetLang: string
): { exercises: Exercise[]; currentIndex: number; readyToComplete: boolean } {
  const atEnd = currentIndex + 1 >= exercises.length;

  if (!atEnd) {
    return { exercises, currentIndex, readyToComplete: false };
  }

  const withRemedials = progress.injectRemedials(exercises, vocabMap, targetLang);
  const { valid: validRemedials } = filterValidExercises(withRemedials, targetLang);

  if (validRemedials.length > exercises.length) {
    return { exercises: validRemedials, currentIndex, readyToComplete: false };
  }

  return {
    exercises: validRemedials,
    currentIndex,
    readyToComplete:
      progress.canComplete() ||
      (validRemedials.length === exercises.length && progress.gradedCount > 0),
  };
}

export { LessonProgressEngine, buildVocabMapFromExercises } from "./progressEngine";
export { normalizeAnswer, answersMatch, answerInSet } from "./normalizeAnswer";
export { buildRemedialQuestion, extractVocabId, isClientGraded, isIntroExercise, isGradedExercise } from "./questionGenerator";
export { validateExercise, isExerciseValid, filterValidExercises } from "./exerciseValidator";
export { enrichExerciseMetadata, enrichExercises, resolveSourceTarget } from "./exerciseEnrichment";
export type { VocabWord, LessonContent, QuestionPhase, Difficulty } from "./types";
export { MIN_LESSON_ACCURACY } from "./types";
