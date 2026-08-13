import { Exercise } from "@/lib/types";
import { normalizeExercise, NormalizedExercise } from "@/lib/exerciseUtils";

const EMPTY_QUOTE = /["']\s*["']|for\s+["']\s*["']/i;

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return !value.trim();
  return false;
}

export type ExerciseValidationResult = {
  valid: boolean;
  reason: string;
};

export function validateExercise(exercise: Exercise): ExerciseValidationResult {
  const normalized = normalizeExercise(exercise);
  const meta = exercise.metadata ?? {};

  if (normalized.isIntro) {
    const intro = normalized.intro;
    if (!intro || isBlank(intro.targetWord)) {
      return { valid: false, reason: "intro missing target word" };
    }
    if (isBlank(intro.englishMeaning)) {
      return { valid: false, reason: "intro missing meaning" };
    }
    return { valid: true, reason: "" };
  }

  if (normalized.type === "match_pairs") {
    const pairs = normalized.pairs;
    const entries = Object.entries(pairs);
    if (entries.length < 3) return { valid: false, reason: "match needs at least 3 pairs" };
    for (const [left, right] of entries) {
      if (isBlank(left) || isBlank(right)) return { valid: false, reason: "match pair contains blank text" };
    }
    return { valid: true, reason: "" };
  }

  const english = (meta.englishMeaning as string) ?? (meta.english as string) ?? "";
  const target = (meta.targetWord as string) ?? (meta.target as string) ?? "";
  const vocabId = meta.vocabulary_id as string | undefined;

  if (vocabId && (isBlank(english) || isBlank(target))) {
    return { valid: false, reason: "missing source or target text" };
  }

  if (!isBlank(normalized.prompt) && EMPTY_QUOTE.test(normalized.prompt)) {
    return { valid: false, reason: "prompt contains empty quoted text" };
  }

  if (
    ["multiple_choice", "fill_blank", "image_selection", "listening"].includes(normalized.type) &&
    !normalized.isIntro
  ) {
    const choiceResult = validateChoices(exercise, normalized);
    if (!choiceResult.valid) return choiceResult;
  }

  if (normalized.type === "type_answer") {
    const text = exercise.correct_answer?.text;
    if (isBlank(text)) return { valid: false, reason: "missing correct text" };
  }

  if (normalized.type === "word_bank") {
    const words: string[] = exercise.correct_answer?.words ?? [];
    if (!words.length || words.some(isBlank)) return { valid: false, reason: "empty word bank answer" };
    if (normalized.tokens.some(isBlank)) return { valid: false, reason: "empty word bank token" };
  }

  const template = normalized.template;
  if (["listening", "listen_type", "listen_image"].includes(template)) {
    if (!exercise.prompt_audio_url && !normalized.audioUrl && !normalized.fallbackText) {
      return { valid: false, reason: "missing audio for listening exercise" };
    }
  }

  if (["picture_recognition", "image_vocab", "listen_image"].includes(template)) {
    if (!normalized.imageOptions.length && !meta.image) {
      return { valid: false, reason: "missing image for picture exercise" };
    }
  }

  if (template === "mini_conversation" && isBlank(normalized.prompt)) {
    return { valid: false, reason: "empty conversation prompt" };
  }

  return { valid: true, reason: "" };
}

function validateChoices(exercise: Exercise, normalized: NormalizedExercise): ExerciseValidationResult {
  const selected = exercise.correct_answer?.selected;
  if (selected === null || selected === undefined) {
    return { valid: false, reason: "no correct selection" };
  }
  if (isBlank(String(selected))) {
    return { valid: false, reason: "empty correct selection" };
  }

  const labels =
    normalized.options.length > 0
      ? normalized.options
      : (exercise.options ?? []).map((o) => o.label);

  if (!labels.length) return { valid: false, reason: "no options" };
  if (labels.some(isBlank)) return { valid: false, reason: "empty option label" };

  const strLabels = labels.map(String);
  if (new Set(strLabels).size !== strLabels.length) {
    return { valid: false, reason: "duplicate options" };
  }
  if (!strLabels.includes(String(selected))) {
    return { valid: false, reason: "correct answer not in options" };
  }

  const correctCount = (exercise.options ?? []).filter((o) => o.is_correct).length;
  if (exercise.options?.length && correctCount !== 1) {
    return { valid: false, reason: "must have exactly one correct option" };
  }

  return { valid: true, reason: "" };
}

export function validateExerciseLanguage(
  exercise: Exercise,
  expectedLanguage: string
): ExerciseValidationResult {
  const meta = exercise.metadata ?? {};
  const exLang = meta.targetLanguage ?? meta.language_code ?? meta.languageCode;
  if (!exLang) return { valid: false, reason: `missing targetLanguage (expected ${expectedLanguage})` };
  const normalizedExpected = expectedLanguage.toLowerCase().slice(0, 2);
  const normalizedActual = String(exLang).toLowerCase().slice(0, 2);
  if (normalizedExpected !== normalizedActual) {
    return { valid: false, reason: `language mismatch (expected ${expectedLanguage}, got ${exLang})` };
  }
  return { valid: true, reason: "" };
}

export function filterValidExercises(
  exercises: Exercise[],
  expectedLanguage?: string
): {
  valid: Exercise[];
  rejected: { exercise: Exercise; reason: string }[];
} {
  const valid: Exercise[] = [];
  const rejected: { exercise: Exercise; reason: string }[] = [];

  for (const ex of exercises) {
    const result = validateExercise(ex);
    if (!result.valid) {
      rejected.push({ exercise: ex, reason: result.reason });
      continue;
    }
    if (expectedLanguage) {
      const langResult = validateExerciseLanguage(ex, expectedLanguage);
      if (!langResult.valid) {
        console.warn("[ExerciseValidator] Rejected exercise (language):", {
          id: ex.id,
          reason: langResult.reason,
        });
        rejected.push({ exercise: ex, reason: langResult.reason });
        continue;
      }
    }
    valid.push(ex);
  }

  return { valid, rejected };
}

export function isExerciseValid(exercise: Exercise | null | undefined): boolean {
  if (!exercise) return false;
  return validateExercise(exercise).valid;
}
