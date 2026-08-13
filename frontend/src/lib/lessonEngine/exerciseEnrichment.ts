import { Exercise } from "@/lib/types";
import { NormalizedExercise, normalizeExercise } from "@/lib/exerciseUtils";

export type VocabEntry = {
  english: string;
  target: string;
  romanization: string;
  pronunciation?: string;
};

export type VocabLookup = Map<string, VocabEntry>;

export type ResolvedExerciseText = {
  sourceText: string;
  targetText: string;
};

const QUOTED_TEXT = /"([^"]+)"/;

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** Derive canonical source (English) and target (foreign) strings from any exercise shape. */
export function resolveSourceTarget(
  exercise: Exercise,
  normalized?: NormalizedExercise,
  vocabMap?: VocabLookup
): ResolvedExerciseText {
  const norm = normalized ?? normalizeExercise(exercise);
  const meta = exercise.metadata ?? {};
  const correct = exercise.correct_answer ?? {};
  const direction = String(meta.direction ?? "");

  let sourceText = pickString(
    meta.source_text,
    meta.englishMeaning,
    meta.english,
    meta.meaning,
    norm.englishMeaning,
    norm.intro?.englishMeaning
  );
  let targetText = pickString(
    meta.target_text,
    meta.targetWord,
    meta.target,
    meta.translation,
    norm.intro?.targetWord
  );

  const vocabId = meta.vocabulary_id as string | undefined;
  if (vocabId && vocabMap?.has(vocabId)) {
    const word = vocabMap.get(vocabId)!;
    sourceText = sourceText || word.english;
    targetText = targetText || word.target;
  }

  if (!sourceText || !targetText) {
    const quoted = norm.prompt.match(QUOTED_TEXT);
    if (quoted?.[1]) {
      if (direction.includes("english_to_target") || direction.includes("listening")) {
        sourceText = sourceText || quoted[1];
      } else if (direction.includes("target_to_english")) {
        targetText = targetText || quoted[1];
      } else if (!sourceText) {
        sourceText = quoted[1];
      }
    }
  }

  if (!targetText && typeof correct.selected === "string") {
    if (direction.includes("english_to_target") || direction.includes("target")) {
      targetText = correct.selected;
    }
  }

  if (!sourceText && typeof correct.selected === "string") {
    if (direction.includes("listening") || direction.includes("meaning") || direction.includes("english")) {
      sourceText = correct.selected;
    }
  }

  if (!targetText && typeof correct.text === "string") {
    if (direction.includes("english_to_target") || direction.includes("production")) {
      targetText = correct.text;
    }
  }

  if (!sourceText && typeof correct.text === "string") {
    if (direction.includes("target_to_english") || direction.includes("sentence")) {
      sourceText = correct.text;
    }
  }

  if (!targetText && typeof correct.translation === "string") {
    targetText = correct.translation;
  }

  if (!sourceText && norm.prompt.includes("\n\n")) {
    const foreignLine = norm.prompt.split("\n\n").pop()?.trim();
    if (foreignLine && direction.includes("target_to_english")) {
      targetText = targetText || foreignLine;
    }
  }

  return { sourceText, targetText };
}

/** Fill metadata source/target fields so validators and renderers see a consistent shape. */
export function enrichExerciseMetadata(
  exercise: Exercise,
  vocabMap?: VocabLookup
): Exercise {
  const meta = { ...(exercise.metadata ?? {}) };
  const { sourceText, targetText } = resolveSourceTarget(exercise, undefined, vocabMap);

  if (sourceText) {
    if (!meta.source_text) meta.source_text = sourceText;
    if (!meta.englishMeaning) meta.englishMeaning = sourceText;
    if (!meta.english) meta.english = sourceText;
  }
  if (targetText) {
    if (!meta.target_text) meta.target_text = targetText;
    if (!meta.targetWord) meta.targetWord = targetText;
    if (!meta.target) meta.target = targetText;
  }

  return { ...exercise, metadata: meta };
}

function buildVocabMapFromEnriched(exercises: Exercise[]): VocabLookup {
  const map: VocabLookup = new Map();
  for (const exercise of exercises) {
    const { sourceText, targetText } = resolveSourceTarget(exercise);
    const vocabId = exercise.metadata?.vocabulary_id as string | undefined;
    if (!vocabId || map.has(vocabId)) continue;
    if (sourceText && targetText) {
      map.set(vocabId, {
        english: sourceText,
        target: targetText,
        romanization: (exercise.metadata?.romanization as string) ?? "",
        pronunciation: exercise.metadata?.pronunciation as string | undefined,
      });
    }
  }
  return map;
}

export function buildVocabMapFromExercises(exercises: Exercise[]): VocabLookup {
  const enriched = enrichExercises(exercises);
  return buildVocabMapFromEnriched(enriched);
}

export function enrichExercises(
  exercises: Exercise[],
  vocabMap?: VocabLookup
): Exercise[] {
  const map = vocabMap ?? buildVocabMapFromEnriched(exercises);
  return exercises.map((exercise) => enrichExerciseMetadata(exercise, map));
}
