import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import { audioManager } from "@/lib/audio/AudioManager";
import { Exercise, StartLessonResponse, AnswerResponse, CompleteResponse } from "@/lib/types";
import {
  buildLessonSession,
  prepareLessonCompletion,
  LessonProgressEngine,
  isClientGraded,
  isIntroExercise,
  isExerciseValid,
} from "@/lib/lessonEngine";
import { usePathStore } from "@/store/usePathStore";
import { isValidCourseId, isValidLessonId } from "@/lib/ids";

async function applyCompleteToPath(summary: CompleteResponse) {
  const activeCourseId = usePathStore.getState().activeCourseId;
  if (isValidCourseId(activeCourseId)) {
    await usePathStore.getState().refreshPath(activeCourseId);
    return;
  }
  if (summary.path && summary.stats) {
    usePathStore.getState().applyLessonComplete(summary.path, summary.stats);
  }
}

interface LessonState {
  attemptId: string | null;
  lessonId: string | null;
  courseId: string | null;
  targetLang: string;
  exercises: Exercise[];
  currentIndex: number;
  hearts: number;
  heartsMax: number;
  shakeHearts: boolean;
  selectedOption: string | null;
  typedAnswer: string;
  selectedWords: string[];
  matchedPairs: Record<string, string>;
  selectedLeftCard: string | null;
  selectedRightCard: string | null;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: any;
  loading: boolean;
  loadStatus: "idle" | "loading" | "retrying" | "error";
  retryAttempt: number;
  error: string | null;
  resultSummary: CompleteResponse | null;
  outOfHearts: boolean;
  streakAtStart: number;
  progressEngine: LessonProgressEngine | null;
  vocabMap: Map<string, { english: string; target: string; romanization: string }>;
  lessonAccuracy: number;
  startLesson: (courseId: string, lessonId: string, isPractice?: boolean) => Promise<void>;
  selectOption: (option: string) => void;
  setTypedAnswer: (text: string) => void;
  selectWord: (word: string) => void;
  unselectWord: (index: number) => void;
  selectLeftPair: (card: string) => void;
  selectRightPair: (card: string) => void;
  checkAnswer: () => Promise<void>;
  skipExercise: () => void;
  forceSkipBrokenExercise: () => void;
  nextExercise: () => Promise<boolean>;
  completeLesson: () => Promise<void>;
  resetLesson: () => void;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  attemptId: null,
  lessonId: null,
  courseId: null,
  targetLang: "",
  exercises: [],
  currentIndex: 0,
  hearts: 5,
  heartsMax: 5,
  shakeHearts: false,
  selectedOption: null,
  typedAnswer: "",
  selectedWords: [],
  matchedPairs: {},
  selectedLeftCard: null,
  selectedRightCard: null,
  isAnswerChecked: false,
  isCorrect: false,
  correctAnswer: null,
  loading: false,
  loadStatus: "idle",
  retryAttempt: 0,
  error: null,
  resultSummary: null,
  outOfHearts: false,
  streakAtStart: 0,
  progressEngine: null,
  vocabMap: new Map(),
  lessonAccuracy: 1,

  resetLesson: () => {
    audioManager.stop();
    set({
      attemptId: null,
      lessonId: null,
      courseId: null,
      targetLang: "",
      exercises: [],
      currentIndex: 0,
      hearts: 5,
      heartsMax: 5,
      shakeHearts: false,
      selectedOption: null,
      typedAnswer: "",
      selectedWords: [],
      matchedPairs: {},
      selectedLeftCard: null,
      selectedRightCard: null,
      isAnswerChecked: false,
      isCorrect: false,
      correctAnswer: null,
      loading: false,
      loadStatus: "idle",
      retryAttempt: 0,
      error: null,
      resultSummary: null,
      outOfHearts: false,
      streakAtStart: 0,
      progressEngine: null,
      vocabMap: new Map(),
      lessonAccuracy: 1,
    });
  },

  startLesson: async (courseId: string, lessonId: string, isPractice: boolean = false) => {
    if (!isValidCourseId(courseId) || !isValidLessonId(lessonId)) {
      set({
        loading: false,
        loadStatus: "error",
        error: "This lesson cannot be loaded — the course or lesson id is missing.",
        exercises: [],
      });
      return;
    }

    set({
      loading: true,
      loadStatus: "loading",
      retryAttempt: 0,
      error: null,
      resultSummary: null,
      outOfHearts: false,
      courseId,
    });

    const retryOpts = {
      onRetry: (attempt: number) => set({ loadStatus: "retrying", retryAttempt: attempt }),
    };

    try {
      const [userStats, lesson] = await Promise.all([
        api.getUserStats("me", retryOpts),
        api.getLesson(courseId, lessonId, retryOpts),
      ]);
      const attempt: StartLessonResponse = await api.startLesson(
        courseId,
        lessonId,
        isPractice,
        retryOpts
      );
      const targetLang = lesson.language_code ?? "";
      if (!targetLang) {
        throw new Error("Lesson is missing language_code — cannot load exercises.");
      }
      const session = buildLessonSession(lesson.exercises || [], targetLang);

      set({
        attemptId: attempt.attempt_id,
        lessonId: attempt.lesson_id,
        courseId,
        targetLang,
        exercises: session.exercises,
        currentIndex: 0,
        hearts: userStats.hearts_current,
        heartsMax: userStats.hearts_max,
        shakeHearts: false,
        selectedOption: null,
        typedAnswer: "",
        selectedWords: [],
        matchedPairs: {},
        selectedLeftCard: null,
        selectedRightCard: null,
        isAnswerChecked: false,
        isCorrect: false,
        correctAnswer: null,
        loading: false,
        loadStatus: "idle",
        retryAttempt: 0,
        outOfHearts: isPractice ? false : userStats.hearts_current <= 0,
        streakAtStart: userStats.current_streak,
        progressEngine: session.progress,
        vocabMap: session.vocabMap,
        lessonAccuracy: 1,
      });
    } catch (err: unknown) {
      const friendly =
        err instanceof ApiError
          ? err.friendlyMessage
          : err instanceof Error
            ? err.message
            : "Lesson failed to load.";
      console.error("[LessonStore] startLesson failed:", err);
      set({
        error: friendly,
        loading: false,
        loadStatus: "error",
        exercises: [],
      });
    }
  },

  selectOption: (option: string) => {
    if (get().isAnswerChecked) return;
    set({ selectedOption: option });
  },

  setTypedAnswer: (text: string) => {
    if (get().isAnswerChecked) return;
    set({ typedAnswer: text });
  },

  selectWord: (word: string) => {
    if (get().isAnswerChecked) return;
    set((state) => ({ selectedWords: [...state.selectedWords, word] }));
  },

  unselectWord: (index: number) => {
    if (get().isAnswerChecked) return;
    set((state) => ({
      selectedWords: state.selectedWords.filter((_, idx) => idx !== index),
    }));
  },

  selectLeftPair: (card: string) => {
    if (get().isAnswerChecked) return;
    set({ selectedLeftCard: card });
  },

  selectRightPair: (card: string) => {
    if (get().isAnswerChecked) return;
    set({ selectedRightCard: card });
  },

  checkAnswer: async () => {
    const {
      attemptId,
      exercises,
      currentIndex,
      selectedOption,
      typedAnswer,
      selectedWords,
      matchedPairs,
      progressEngine,
      hearts,
    } = get();
    if (!attemptId || exercises.length === 0) return;

    const exercise = exercises[currentIndex];
    if (!isExerciseValid(exercise)) {
      get().forceSkipBrokenExercise();
      return;
    }
    let submittedAnswer: Record<string, unknown> | null = null;

    if (
      exercise.type === "multiple_choice" ||
      exercise.type === "fill_blank" ||
      exercise.type === "image_selection" ||
      exercise.type === "listening"
    ) {
      submittedAnswer = { selected: selectedOption };
    } else if (exercise.type === "intro") {
      submittedAnswer = { acknowledged: true };
    } else if (exercise.type === "type_answer") {
      submittedAnswer = { text: typedAnswer.trim() };
    } else if (exercise.type === "translate") {
      submittedAnswer = { translation: typedAnswer.trim() };
    } else if (exercise.type === "word_bank") {
      submittedAnswer = { words: selectedWords };
    } else if (exercise.type === "match_pairs") {
      submittedAnswer = { pairs: matchedPairs };
    }

    if (!submittedAnswer) return;

    set({ loading: true });

    try {
      if (isIntroExercise(exercise)) {
        progressEngine?.recordAnswer(exercise, true);
        set({
          isAnswerChecked: false,
          isCorrect: true,
          correctAnswer: exercise.correct_answer,
          loading: false,
          lessonAccuracy: progressEngine?.accuracy ?? 1,
        });
        return;
      }

      if (isClientGraded(exercise) && progressEngine) {
        const correct = progressEngine.gradeLocally(exercise, submittedAnswer);
        progressEngine.recordAnswer(exercise, correct);
        const wasWrong = !correct;
        const newHearts = wasWrong ? Math.max(0, hearts - 1) : hearts;
        set({
          isAnswerChecked: true,
          isCorrect: correct,
          correctAnswer: exercise.correct_answer,
          hearts: newHearts,
          shakeHearts: wasWrong,
          loading: false,
          lessonAccuracy: progressEngine.accuracy,
        });
        if (wasWrong) {
          setTimeout(() => set({ shakeHearts: false }), 700);
          progressEngine?.scheduleRetry(exercise, currentIndex, get().vocabMap, get().targetLang);
        }
        return;
      }

      const response: AnswerResponse = await api.submitAnswer(
        attemptId,
        exercise.id,
        submittedAnswer
      );
      progressEngine?.recordAnswer(exercise, response.correct);
      const wasWrong = !response.correct;
      set({
        isAnswerChecked: true,
        isCorrect: response.correct,
        correctAnswer: response.correct_answer,
        hearts: response.hearts_remaining,
        shakeHearts: wasWrong,
        loading: false,
        lessonAccuracy: progressEngine?.accuracy ?? 1,
      });
      if (wasWrong) {
        setTimeout(() => set({ shakeHearts: false }), 700);
        progressEngine?.scheduleRetry(exercise, currentIndex, get().vocabMap, get().targetLang);
      }
    } catch (err: unknown) {
      const friendly =
        err instanceof ApiError
          ? err.friendlyMessage
          : err instanceof Error
            ? err.message
            : "Could not submit your answer.";
      console.error("[LessonStore] checkAnswer failed:", err);
      set({ error: friendly, loading: false });
    }
  },

  skipExercise: () => {
    const state = get();
    const { exercises, currentIndex, isAnswerChecked } = state;
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    const invalid = !isExerciseValid(exercise);
    if (!invalid) {
      const meta = exercise.metadata ?? {};
      const layout = (meta.layout as string) ?? "";
      const skippable =
        Boolean(meta.skippable) ||
        exercise.type === "type_answer" ||
        exercise.type === "translate" ||
        ["typing", "listen_type", "missing_letters"].includes(layout);
      if (!skippable || isAnswerChecked) return;
    }

    get().forceSkipBrokenExercise();
  },

  forceSkipBrokenExercise: () => {
    const state = get();
    const { exercises, currentIndex, progressEngine, isAnswerChecked, hearts } = state;
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    progressEngine?.recordSkip(exercise);

    const updatedExercises = progressEngine
      ? progressEngine.injectDueRetries(exercises, currentIndex)
      : exercises;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= updatedExercises.length) {
      set({ exercises: updatedExercises });
      get().nextExercise();
      return;
    }

    set({
      exercises: updatedExercises,
      currentIndex: nextIndex,
      selectedOption: null,
      typedAnswer: "",
      selectedWords: [],
      matchedPairs: {},
      selectedLeftCard: null,
      selectedRightCard: null,
      isAnswerChecked: false,
      isCorrect: false,
      correctAnswer: null,
      error: null,
      outOfHearts: hearts <= 0 ? state.outOfHearts : false,
    });
  },

  nextExercise: async () => {
    const {
      attemptId,
      exercises,
      currentIndex,
      hearts,
      progressEngine,
      vocabMap,
    } = get();
    if (!attemptId) return false;

    if (hearts <= 0) {
      set({ outOfHearts: true, isAnswerChecked: false });
      return false;
    }

    const exercise = exercises[currentIndex];
    if (exercise && !isExerciseValid(exercise)) {
      get().forceSkipBrokenExercise();
      return false;
    }

    if (isIntroExercise(exercise)) {
      progressEngine?.recordAnswer(exercise, true);
    }

    let updatedExercises = progressEngine
      ? progressEngine.injectDueRetries(exercises, currentIndex)
      : exercises;

    const { targetLang } = get();
    const completion = prepareLessonCompletion(
      updatedExercises,
      currentIndex,
      progressEngine ?? new LessonProgressEngine(),
      vocabMap,
      targetLang
    );

    if (completion.exercises.length > updatedExercises.length) {
      updatedExercises = completion.exercises;
    }

    if (updatedExercises.length > exercises.length) {
      set({
        exercises: updatedExercises,
        currentIndex: currentIndex + 1,
        selectedOption: null,
        typedAnswer: "",
        selectedWords: [],
        matchedPairs: {},
        selectedLeftCard: null,
        selectedRightCard: null,
        isAnswerChecked: false,
        isCorrect: false,
        correctAnswer: null,
      });
      return false;
    }

    const isFinished = currentIndex + 1 >= updatedExercises.length;

    if (isFinished) {
      if (!completion.readyToComplete) {
        set({
          error: `Keep practicing! You need at least 70% accuracy to complete this lesson. Current: ${Math.round((progressEngine?.accuracy ?? 0) * 100)}%`,
          isAnswerChecked: false,
        });
        return false;
      }

      set({ loading: true });
      try {
        const summary = await api.completeLesson(attemptId);
        await applyCompleteToPath(summary);
        set({ resultSummary: summary, loading: false });
        return true;
      } catch (err: unknown) {
        const friendly =
          err instanceof ApiError
            ? err.friendlyMessage
            : err instanceof Error
              ? err.message
              : "Could not complete the lesson.";
        console.error("[LessonStore] completeLesson (nextExercise) failed:", err);
        set({ error: friendly, loading: false });
        return true;
      }
    }

    set({
      currentIndex: currentIndex + 1,
      selectedOption: null,
      typedAnswer: "",
      selectedWords: [],
      matchedPairs: {},
      selectedLeftCard: null,
      selectedRightCard: null,
      isAnswerChecked: false,
      isCorrect: false,
      correctAnswer: null,
      error: null,
    });
    return false;
  },

  completeLesson: async () => {
    const { attemptId } = get();
    if (!attemptId) return;
    set({ loading: true });
    try {
      const summary = await api.completeLesson(attemptId);
      await applyCompleteToPath(summary);
      set({ resultSummary: summary, loading: false });
    } catch (err: unknown) {
      const friendly =
        err instanceof ApiError
          ? err.friendlyMessage
          : err instanceof Error
            ? err.message
            : "Could not complete the lesson.";
      console.error("[LessonStore] completeLesson failed:", err);
      set({ error: friendly, loading: false });
    }
  },
}));
