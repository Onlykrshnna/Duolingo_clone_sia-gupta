import { Exercise } from "@/lib/types";
import { VocabWord, QuestionPhase, Difficulty } from "./types";

/** Build a client-side remedial recognition question for a missed word. */
export function buildRemedialQuestion(
  word: VocabWord,
  lessonVocab: VocabWord[],
  langLabel: string,
  index: number,
  targetLang: string
): Exercise | null {
  if (!targetLang?.trim()) return null;
  if (!word.english?.trim() || !word.target?.trim()) {
    return null;
  }

  const distractors = lessonVocab
    .filter((w) => w.id !== word.id && w.target?.trim())
    .map((w) => w.target)
    .slice(0, 2);
  const options = [word.target, ...distractors].filter((o) => o && o.trim());
  if (options.length < 2) return null;
  // Shuffle so alphabetical order does not reveal answers
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    id: `remedial-${word.id}-${index}`,
    lesson_id: "",
    order_index: 9000 + index,
    type: "multiple_choice",
    prompt: `Tap the ${langLabel} word for "${word.english}"`,
    correct_answer: { selected: word.target },
    metadata: {
      phase: "remedial" as QuestionPhase,
      vocabulary_id: word.id,
      source_text: word.english,
      target_text: word.target,
      englishMeaning: word.english,
      targetWord: word.target,
      romanization: word.romanization,
      targetLanguage: targetLang,
      options,
      direction: "english_to_target",
      clientGraded: true,
      difficulty: 2 as Difficulty,
    },
    options: options.map((label, i) => ({
      id: `rem-opt-${index}-${i}`,
      exercise_id: `remedial-${word.id}-${index}`,
      label,
      is_correct: label === word.target,
      order_index: i + 1,
    })),
  };
}

export function extractVocabId(exercise: Exercise): string | null {
  return exercise.metadata?.vocabulary_id ?? null;
}

export function isClientGraded(exercise: Exercise): boolean {
  return Boolean(exercise.metadata?.clientGraded);
}

export function isIntroExercise(exercise: Exercise): boolean {
  return exercise.type === "intro";
}

export function isGradedExercise(exercise: Exercise): boolean {
  return exercise.type !== "intro";
}
