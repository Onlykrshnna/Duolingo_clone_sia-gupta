import { Exercise } from "@/lib/types";
import { MIN_LESSON_ACCURACY } from "./types";
import { buildVocabMapFromExercises } from "./exerciseEnrichment";
import { buildRemedialQuestion, extractVocabId, isGradedExercise } from "./questionGenerator";
import { normalizeAnswer, answerInSet } from "./normalizeAnswer";
import { enrichExerciseMetadata } from "./exerciseEnrichment";
import { isExerciseValid } from "./exerciseValidator";

const LANG_LABELS: Record<string, string> = {
  ja: "Japanese",
  es: "Spanish",
  de: "German",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
  ko: "Korean",
  hi: "Hindi",
  ru: "Russian",
  zh: "Chinese",
  ar: "Arabic",
  el: "Greek",
  en: "English",
};

export type WordMastery = {
  introduced: boolean;
  recognized: boolean;
  recalled: boolean;
  mastered: boolean;
  wrongCount: number;
  correctCount: number;
  skippedCount: number;
};

export type LessonAnalytics = {
  wordsIntroduced: number;
  wordsMastered: number;
  wrongAnswers: number;
  accuracy: number;
  skippedExercises: number;
  hardestVocabulary: { wordId: string; wrongCount: number }[];
  totalGraded: number;
};

const RETRY_DELAY = 6;

export class LessonProgressEngine {
  introduced = new Set<string>();
  mastered = new Set<string>();
  mistakes: string[] = [];
  correctCount = 0;
  gradedCount = 0;
  remedialInjected = 0;
  skippedCount = 0;
  wordState = new Map<string, WordMastery>();
  private retryQueue: { exercise: Exercise; insertAfterIndex: number }[] = [];
  private questionStartMs = Date.now();

  startQuestionTimer() {
    this.questionStartMs = Date.now();
  }

  responseMs(): number {
    return Date.now() - this.questionStartMs;
  }

  private ensureWord(vocabId: string): WordMastery {
    if (!this.wordState.has(vocabId)) {
      this.wordState.set(vocabId, {
        introduced: false,
        recognized: false,
        recalled: false,
        mastered: false,
        wrongCount: 0,
        correctCount: 0,
        skippedCount: 0,
      });
    }
    return this.wordState.get(vocabId)!;
  }

  recordIntro(vocabId: string) {
    this.introduced.add(vocabId);
    const w = this.ensureWord(vocabId);
    w.introduced = true;
  }

  recordSkip(exercise: Exercise) {
    this.skippedCount += 1;
    const vocabId = extractVocabId(exercise);
    if (vocabId) {
      const w = this.ensureWord(vocabId);
      w.skippedCount += 1;
    }
  }

  recordAnswer(exercise: Exercise, correct: boolean) {
    if (!isGradedExercise(exercise)) {
      const vid = extractVocabId(exercise);
      if (vid) this.recordIntro(vid);
      return;
    }

    const vocabId = extractVocabId(exercise);
    const template = (exercise.metadata?.template as string) ?? exercise.type;
    this.gradedCount += 1;

    if (vocabId) {
      const w = this.ensureWord(vocabId);
      if (correct) {
        w.correctCount += 1;
        if (["picture_recognition", "select_foreign", "select_meaning", "tap_word", "true_false", "fill_blank", "listening", "listen_image"].includes(template)) {
          w.recognized = true;
        }
        if (["word_bank", "drag_drop", "type_meaning", "missing_letters"].includes(template)) {
          w.recalled = true;
        }
        if (["type_target", "listen_type", "mini_conversation"].includes(template)) {
          w.mastered = true;
          this.mastered.add(vocabId);
        }
      } else {
        w.wrongCount += 1;
      }
    }

    if (correct) {
      this.correctCount += 1;
      if (vocabId) this.mastered.add(vocabId);
    } else if (vocabId) {
      this.mistakes.push(vocabId);
    }
  }

  /** Queue wrong-answer retry ~6 questions later (recognition template, not immediate). */
  scheduleRetry(exercise: Exercise, currentIndex: number, lessonVocabMap: Map<string, { english: string; target: string; romanization: string }>, targetLang: string) {
    const vocabId = extractVocabId(exercise);
    if (!vocabId) return;
    const word = lessonVocabMap.get(vocabId);
    if (!word) return;

    const w = this.ensureWord(vocabId);
    if (!w.recognized) {
      // Failed recognition — retry with easier MCQ, not typing
      const langLabel = LANG_LABELS[targetLang] ?? "target language";
      const vocabList = Array.from(lessonVocabMap.entries()).map(([id, v]) => ({
        id,
        english: v.english,
        target: v.target,
        romanization: v.romanization,
      }));
      const remedial = buildRemedialQuestion(
        { id: vocabId, english: word.english, target: word.target, romanization: word.romanization },
        vocabList,
        langLabel,
        this.remedialInjected,
        targetLang
      );
      if (remedial) {
        const enriched = enrichExerciseMetadata(remedial, lessonVocabMap);
        if (!isExerciseValid(enriched, lessonVocabMap)) return;
        const alreadyQueued = this.retryQueue.some(
          (r) => extractVocabId(r.exercise) === vocabId
        );
        if (!alreadyQueued) {
          this.retryQueue.push({ exercise: enriched, insertAfterIndex: currentIndex + RETRY_DELAY });
          this.remedialInjected += 1;
        }
      }
    }
  }

  /** Insert due retries into exercise list when advancing. */
  injectDueRetries(exercises: Exercise[], currentIndex: number): Exercise[] {
    if (this.retryQueue.length === 0) return exercises;
    const due = this.retryQueue.filter((r) => r.insertAfterIndex <= currentIndex);
    if (due.length === 0) return exercises;
    this.retryQueue = this.retryQueue.filter((r) => r.insertAfterIndex > currentIndex);
    const insertAt = currentIndex + 1;
    const next = [...exercises];
    due.forEach((r, i) => next.splice(insertAt + i, 0, r.exercise));
    return next;
  }

  canUseTyping(vocabId: string): boolean {
    const w = this.wordState.get(vocabId);
    return Boolean(w?.recognized);
  }

  get accuracy(): number {
    if (this.gradedCount === 0) return 1;
    return this.correctCount / this.gradedCount;
  }

  canComplete(): boolean {
    return this.accuracy >= MIN_LESSON_ACCURACY;
  }

  analytics(): LessonAnalytics {
    const hardest = [...this.wordState.entries()]
      .filter(([, w]) => w.wrongCount > 0)
      .sort((a, b) => b[1].wrongCount - a[1].wrongCount)
      .slice(0, 5)
      .map(([wordId, w]) => ({ wordId, wrongCount: w.wrongCount }));

    return {
      wordsIntroduced: this.introduced.size,
      wordsMastered: this.mastered.size,
      wrongAnswers: this.mistakes.length,
      accuracy: this.accuracy,
      skippedExercises: this.skippedCount,
      hardestVocabulary: hardest,
      totalGraded: this.gradedCount,
    };
  }

  /** Insert remedial questions for recent mistakes before lesson end. */
  injectRemedials(exercises: Exercise[], lessonVocabMap: Map<string, { english: string; target: string; romanization: string }>, targetLang: string): Exercise[] {
    const pending = [...new Set(this.mistakes)].slice(-3);
    if (pending.length === 0) return exercises;

    const langLabel = LANG_LABELS[targetLang] ?? "target language";
    const vocabList = Array.from(lessonVocabMap.entries()).map(([id, w]) => ({
      id,
      english: w.english,
      target: w.target,
      romanization: w.romanization,
    }));

    const remedials: Exercise[] = pending
      .map((vocabId, i) => {
        const word = lessonVocabMap.get(vocabId);
        if (!word) return null;
        const remedial = buildRemedialQuestion(
          {
            id: vocabId,
            english: word.english,
            target: word.target,
            romanization: word.romanization,
          },
          vocabList,
          langLabel,
          this.remedialInjected + i,
          targetLang
        );
        if (!remedial) return null;
        const enriched = enrichExerciseMetadata(remedial, lessonVocabMap);
        return isExerciseValid(enriched, lessonVocabMap) ? enriched : null;
      })
      .filter((ex): ex is Exercise => ex !== null);

    this.remedialInjected += remedials.length;
    this.mistakes = [];
    return [...exercises, ...remedials];
  }

  gradeLocally(exercise: Exercise, submitted: Record<string, unknown>): boolean {
    const meta = exercise.metadata ?? {};

    if (exercise.type === "multiple_choice" || exercise.type === "image_selection") {
      return exercise.correct_answer?.selected === submitted.selected;
    }

    if (exercise.type === "type_answer") {
      const text = normalizeAnswer(String(submitted.text ?? ""));
      const alts: string[] = meta.alternatives ?? [];
      alts.push(exercise.correct_answer?.text ?? "");
      return answerInSet(text, alts);
    }

    if (exercise.type === "word_bank") {
      const sub: string[] = (submitted.words as string[]) ?? [];
      const cor: string[] = exercise.correct_answer?.words ?? [];
      if (sub.length !== cor.length) return false;
      return sub.every((s, i) => normalizeAnswer(s) === normalizeAnswer(cor[i]));
    }

    return false;
  }
}

export { buildVocabMapFromExercises } from "./exerciseEnrichment";
