"use client";

import React, { useEffect, useState, use, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { useLessonStore } from "@/store/useLessonStore";
import { usePathStore } from "@/store/usePathStore";
import { getPersistedActiveCourseId } from "@/lib/courseIsolation";
import { isValidCourseId, isValidLessonId } from "@/lib/ids";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { api } from "@/lib/api";
import DuoButton from "@/components/DuoButton";
import FeedbackBar from "@/components/FeedbackBar";
import Mascot, { MascotMood } from "@/components/Mascot";
import FloatingXp from "@/components/effects/FloatingXp";
import FlyingHeart from "@/components/effects/FlyingHeart";

import ExerciseByTemplate from "@/components/exercises/ExerciseByTemplate";
import LessonCompleteModal from "@/components/modals/LessonCompleteModal";
import OutOfHeartsModal from "@/components/modals/OutOfHeartsModal";
import ExercisePrompt from "@/components/exercises/ExercisePrompt";
import ExerciseSkipButton from "@/components/exercises/ExerciseSkipButton";
import InvalidExercisePanel from "@/components/exercises/InvalidExercisePanel";
import { normalizeExercise } from "@/lib/exerciseUtils";
import { isExerciseValid, validateExercise } from "@/lib/lessonEngine/exerciseValidator";
import { enrichExerciseMetadata } from "@/lib/lessonEngine/exerciseEnrichment";
import { showHeartRestoredToast } from "@/lib/gamificationToasts";
import { fadeSlideUp } from "@/lib/animations";
import { ExerciseDisplayProvider } from "@/contexts/ExerciseDisplayContext";
import { audioManager } from "@/lib/audio/AudioManager";
import { getFeedbackWord } from "@/lib/audio/feedbackWord";
import { resetAutoPlaySession } from "@/components/audio/AudioButton";

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default function LessonPage({ params }: PageProps) {
  const { lessonId } = use(params);
  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams ? searchParams.get("practice") === "true" : false;
  const isChallenge = isPractice;
  const storedCourseId = usePathStore((s) => s.activeCourseId);
  const activeCourseId = isValidCourseId(storedCourseId)
    ? storedCourseId
    : isValidCourseId(getPersistedActiveCourseId())
      ? getPersistedActiveCourseId()
      : null;
  const routeReady = isValidLessonId(lessonId);

  const {
    attemptId,
    exercises,
    currentIndex,
    hearts,
    heartsMax,
    shakeHearts,
    selectedOption,
    typedAnswer,
    selectedWords,
    matchedPairs,
    isAnswerChecked,
    isCorrect,
    correctAnswer,
    loading,
    loadStatus,
    retryAttempt,
    error,
    resultSummary,
    outOfHearts,
    streakAtStart,
    lessonAccuracy,
    vocabMap,
    targetLang,
    startLesson,
    selectOption,
    setTypedAnswer,
    selectWord,
    unselectWord,
    checkAnswer,
    skipExercise,
    forceSkipBrokenExercise,
    nextExercise,
    resetLesson,
  } = useLessonStore();

  const [loadingRefill, setLoadingRefill] = useState(false);
  const [init, setInit] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");
  const [showFloatingXp, setShowFloatingXp] = useState(false);
  const [showFlyingHeart, setShowFlyingHeart] = useState(false);
  const [heartPopIndex, setHeartPopIndex] = useState<number | null>(null);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);

  const activeExercise = exercises[currentIndex] ?? null;
  const enrichedExercise = activeExercise
    ? enrichExerciseMetadata(activeExercise, vocabMap)
    : null;
  const normalized = enrichedExercise ? normalizeExercise(enrichedExercise) : null;
  const exerciseValid = enrichedExercise ? isExerciseValid(enrichedExercise, vocabMap) : true;
  const invalidReason = enrichedExercise && !exerciseValid
    ? validateExercise(enrichedExercise, vocabMap).reason
    : undefined;

  const feedbackWord = useMemo(() => {
    if (!normalized || normalized.isIntro) return null;
    return getFeedbackWord(normalized, correctAnswer, activeExercise);
  }, [normalized, correctAnswer, activeExercise]);

  useEffect(() => {
    audioManager.stop();
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      audioManager.stop();
      resetAutoPlaySession();
    };
  }, []);

  const loadRequestRef = useRef(0);

  useEffect(() => {
    if (activeExercise && !isExerciseValid(enrichedExercise ?? activeExercise, vocabMap)) {
      console.error("[Lesson] Invalid exercise — auto-skipping", {
        exerciseId: activeExercise.id,
        template: activeExercise.metadata?.template ?? activeExercise.type,
        lessonId: activeExercise.lesson_id || lessonId,
        reason: invalidReason,
      });
      forceSkipBrokenExercise();
    }
  }, [activeExercise, enrichedExercise, currentIndex, invalidReason, lessonId, vocabMap, forceSkipBrokenExercise]);

  useEffect(() => {
    if (!routeReady || !activeCourseId || !router.isReady) return;

    const requestId = ++loadRequestRef.current;
    let cancelled = false;

    (async () => {
      await startLesson(activeCourseId, lessonId, isPractice);
      if (!cancelled && requestId === loadRequestRef.current) {
        setInit(true);
      }
    })();

    return () => {
      cancelled = true;
      resetLesson();
    };
  }, [lessonId, activeCourseId, startLesson, resetLesson, isPractice, routeReady, router.isReady]);

  useEffect(() => {
    if (!activeCourseId || !router.isReady) return;
    const onCourseStore = usePathStore.subscribe((state, prev) => {
      if (state.activeCourseId && prev.activeCourseId && state.activeCourseId !== prev.activeCourseId) {
        resetLesson();
        router.replace("/");
      }
    });
    return onCourseStore;
  }, [activeCourseId, resetLesson, router.isReady, router.replace]);

  const handleRetryLoad = useCallback(() => {
    if (!activeCourseId || !routeReady) return;
    setInit(false);
    startLesson(activeCourseId, lessonId, isPractice).then(() => setInit(true));
  }, [activeCourseId, lessonId, isPractice, startLesson, routeReady]);

  useEffect(() => {
    if (!isAnswerChecked) {
      setMascotMood("idle");
    }
  }, [currentIndex, isAnswerChecked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && normalized?.skippable && !isAnswerChecked) {
        e.preventDefault();
        skipExercise();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [normalized?.skippable, isAnswerChecked, skipExercise]);

  const handleCorrectFeedback = useCallback(() => {
    setMascotMood("happy");
    setShowFloatingXp(true);
    setShowCorrectFlash(true);
    setTimeout(() => setShowCorrectFlash(false), 500);
  }, []);

  const handleWrongFeedback = useCallback(() => {
    const currentHearts = useLessonStore.getState().hearts;
    setMascotMood("sad");
    setShowFlyingHeart(true);
    setHeartPopIndex(currentHearts);
  }, []);

  const getHasSelection = () => {
    if (!activeExercise || !normalized) return false;
    if (normalized.isIntro) return true;
    switch (normalized.type) {
      case "multiple_choice":
      case "fill_blank":
      case "image_selection":
      case "listening":
        return selectedOption !== null;
      case "type_answer":
      case "translate":
        return typedAnswer.trim() !== "";
      case "word_bank":
        return selectedWords.length > 0;
      case "match_pairs":
        return Object.keys(matchedPairs).length === normalized.left.length;
      default:
        return false;
    }
  };

  const hasSelection = getHasSelection();

  const handleRefill = async () => {
    setLoadingRefill(true);
    try {
      const response = await api.refillHearts("me");
      if (response.success) {
        useLessonStore.setState({ hearts: response.hearts_current, outOfHearts: false });
        showHeartRestoredToast();
      } else {
        const { toast } = await import("sonner");
        toast.error(response.message || "Failed to refill hearts.");
      }
    } catch (err: unknown) {
      const { toast } = await import("sonner");
      const message = err instanceof Error ? err.message : "Error refilling hearts.";
      toast.error(message);
    } finally {
      setLoadingRefill(false);
    }
  };

  const handleAbandon = async () => {
    if (attemptId) {
      try {
        await api.abandonLesson(attemptId);
      } catch (err) {
        console.error(err);
      }
    }
    router.push("/");
  };

  const handleMatchPair = (leftCard: string, rightCard: string) => {
    useLessonStore.setState((state) => ({
      matchedPairs: { ...state.matchedPairs, [leftCard]: rightCard },
    }));
  };

  const handleSetMatchedPairs = (allPairs: Record<string, string>) => {
    useLessonStore.setState({ matchedPairs: allPairs });
  };

  const renderExercise = () => {
    if (!activeExercise || !normalized) return null;

    return (
      <ExerciseByTemplate
        normalized={normalized}
        exercise={enrichedExercise ?? activeExercise}
        selectedOption={selectedOption}
        typedAnswer={typedAnswer}
        selectedWords={selectedWords}
        matchedPairs={matchedPairs}
        isAnswerChecked={isAnswerChecked}
        isCorrect={isCorrect}
        correctAnswer={correctAnswer}
        onSelect={selectOption}
        onChangeAnswer={setTypedAnswer}
        onSelectWord={selectWord}
        onUnselectWord={unselectWord}
        onMatch={handleMatchPair}
        onSetMatchedPairs={handleSetMatchedPairs}
      />
    );
  };

  if (!routeReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <Mascot size={100} mood="sad" message="Invalid lesson link" />
        <h1 className="text-2xl font-extrabold text-slate-100">Lesson Not Found</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">
          This lesson link is invalid. Return to your course path and try again.
        </p>
        <Link href="/">
          <DuoButton variant="primary">Back to Path Map</DuoButton>
        </Link>
      </div>
    );
  }

  if (routeReady && !activeCourseId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <Mascot size={100} mood="sad" message="No active course" />
        <h1 className="text-2xl font-extrabold text-slate-100">Course Not Selected</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">
          Select a course from the home page before starting a lesson.
        </p>
        <Link href="/">
          <DuoButton variant="primary">Back to Path Map</DuoButton>
        </Link>
      </div>
    );
  }

  if (!init || (loading && exercises.length === 0 && loadStatus !== "error")) {
    const statusMessage =
      loadStatus === "retrying"
        ? `Retrying… (attempt ${retryAttempt} of 3)`
        : "Loading lesson…";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green" />
        <p className="text-muted-text font-bold mt-4 font-nunito">{statusMessage}</p>
        {loadStatus === "retrying" && (
          <p className="text-slate-500 text-xs font-semibold mt-2 max-w-xs">
            The server may be starting up. Hang tight…
          </p>
        )}
      </div>
    );
  }

  if (error && exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <Mascot size={100} mood="sad" message="Something went wrong" />
        <h1 className="text-2xl font-extrabold text-slate-100">Lesson Loading Issue</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
          <DuoButton variant="primary" className="w-full" onClick={handleRetryLoad}>
            Retry
          </DuoButton>
          <Link href="/" className="w-full">
            <DuoButton variant="secondary" className="w-full">
              Back to Path Map
            </DuoButton>
          </Link>
        </div>
      </div>
    );
  }

  if (!exercises.length && !resultSummary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <Mascot size={100} mood="sad" />
        <h1 className="text-2xl font-extrabold text-slate-100">No Exercises Found</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">This lesson does not contain any questions.</p>
        <Link href="/"><DuoButton variant="primary">Back to Path Map</DuoButton></Link>
      </div>
    );
  }

  const handlePractice = async () => {
    if (attemptId) {
      try {
        await api.abandonLesson(attemptId);
      } catch (err) {
        console.error(err);
      }
    }
    router.push(`/lesson/${lessonId}?practice=true`);
  };

  if (resultSummary) {
    const wordsLearned = Array.from(vocabMap.values()).map((w) => w.english).filter(Boolean);
    return (
      <LessonCompleteModal
        summary={resultSummary}
        previousStreak={streakAtStart}
        accuracy={lessonAccuracy}
        wordsLearned={wordsLearned}
      />
    );
  }

  if (outOfHearts) {
    return (
      <OutOfHeartsModal
        onRefill={handleRefill}
        onPractice={handlePractice}
        onAbandon={handleAbandon}
        loadingRefill={loadingRefill}
      />
    );
  }

  const progressPercent = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#131F24] text-slate-100 relative overflow-x-hidden max-lg:min-h-[100dvh]">
      <AnimatePresence>
        {showCorrectFlash && (
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-brand-green pointer-events-none z-30"
          />
        )}
      </AnimatePresence>
      <FloatingXp show={showFloatingXp} onComplete={() => setShowFloatingXp(false)} />
      <FlyingHeart show={showFlyingHeart} onComplete={() => setShowFlyingHeart(false)} />

      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-light-border max-w-4xl w-full mx-auto shrink-0 select-none bg-[#131F24]">
        <button onClick={handleAbandon} className="text-[#AAB7C2] hover:text-slate-200 transition-colors active:scale-95 cursor-pointer" title="Exit lesson">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 max-w-xl mx-6 bg-[#202F36] h-4 rounded-full overflow-hidden border border-[#37464F]">
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-brand-green h-full rounded-full"
          />
        </div>
        <div className={`flex items-center gap-1 select-none ${shakeHearts ? "animate-shake" : ""}`}>
          {Array.from({ length: heartsMax }).map((_, i) => (
            <motion.div
              key={i}
              animate={
                heartPopIndex === i
                  ? { scale: [1, 1.4, 0], opacity: [1, 1, 0], y: [0, -20, -40] }
                  : { scale: 1, opacity: 1, y: 0 }
              }
              transition={{ duration: 0.6 }}
              onAnimationComplete={() => {
                if (heartPopIndex === i) setHeartPopIndex(null);
              }}
            >
              <Heart
                className={`w-6 h-6 transition-colors duration-200 ${
                  i < hearts ? "fill-current text-rose-red" : "text-[#37464F] fill-current"
                }`}
              />
            </motion.div>
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 text-center max-w-2xl w-full mx-auto overflow-y-auto pb-40 pt-4 max-lg:px-4 max-lg:pb-[max(10rem,env(safe-area-inset-bottom))]">
        <ExerciseDisplayProvider
          targetLang={targetLang}
          unitIndex={0}
          challengeMode={isChallenge}
          exercises={exercises}
          vocabMap={vocabMap}
        >
        <Mascot size={80} mood={mascotMood} className={`mb-4 ${normalized?.isIntro ? "hidden" : ""}`} />

        <AnimatePresence mode="wait">
          {activeExercise && normalized && !exerciseValid && (
            <InvalidExercisePanel
              exerciseId={activeExercise.id}
              template={String(activeExercise.metadata?.template ?? activeExercise.type)}
              lessonId={activeExercise.lesson_id || lessonId}
              reason={invalidReason}
              onSkip={forceSkipBrokenExercise}
              loading={loading}
            />
          )}
          {activeExercise && normalized && exerciseValid && (
            <motion.div
              key={currentIndex}
              variants={fadeSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="w-full space-y-2 relative"
            >
              {normalized.skippable && !normalized.isIntro && !isAnswerChecked && (
                <ExerciseSkipButton onSkip={skipExercise} disabled={loading} />
              )}
              {!normalized.isIntro && normalized.prompt.trim() && (
                <ExercisePrompt prompt={normalized.prompt} />
              )}
              {renderExercise()}
            </motion.div>
          )}
        </AnimatePresence>
        </ExerciseDisplayProvider>
      </main>

      {activeExercise && normalized && exerciseValid && (
        <FeedbackBar
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer}
          activeExerciseType={normalized.type}
          hasSelection={hasSelection}
          isIntro={normalized.isIntro}
          onCheck={checkAnswer}
          onNext={nextExercise}
          loading={loading}
          onCorrectFeedback={handleCorrectFeedback}
          onWrongFeedback={handleWrongFeedback}
          feedbackWord={feedbackWord}
          targetLang={targetLang}
        />
      )}

      {activeExercise && normalized && !exerciseValid && (
        <div className="fixed bottom-0 left-0 right-0 py-6 px-4 bg-[#1F2E35] border-t-2 border-[#37464F] z-40">
          <div className="max-w-3xl mx-auto flex justify-end">
            <DuoButton
              variant="primary"
              className="w-full md:w-48 py-4"
              onClick={forceSkipBrokenExercise}
              disabled={loading}
            >
              Skip Exercise
            </DuoButton>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
