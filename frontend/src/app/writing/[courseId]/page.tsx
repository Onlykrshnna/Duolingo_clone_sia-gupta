"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { isValidCourseId } from "@/lib/ids";
import { fetchWritingSystemForCourse } from "@/lib/fetchWritingSystem";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { usePathStore } from "@/store/usePathStore";
import { WritingCharacter, WritingSectionSummary, WritingSystemOverview } from "@/lib/types";
import CharacterIntroCard from "@/components/writing/CharacterIntroCard";
import CharacterQuiz from "@/components/writing/CharacterQuiz";
import WritingSystemSkeleton from "@/components/writing/WritingSystemSkeleton";
import DuoButton from "@/components/DuoButton";
import { correctAnswerBurst } from "@/lib/confettiUtils";
import { playSound } from "@/lib/sounds";
import { audioManager } from "@/lib/audio/AudioManager";
import AudioButton from "@/components/audio/AudioButton";

type Phase = "browse" | "intro" | "quiz" | "section_complete";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function WritingPage({ params }: PageProps) {
  const { courseId } = use(params);
  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const sectionSlugParam = searchParams?.get("section");
  const routeReady = isValidCourseId(courseId);

  const [overview, setOverview] = useState<WritingSystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("browse");
  const [charIndex, setCharIndex] = useState(0);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [lessonChars, setLessonChars] = useState<WritingCharacter[]>([]);

  const [unavailable, setUnavailable] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!routeReady) {
      setLoading(false);
      setUnavailable(true);
      setOverview(null);
      return null;
    }

    setLoading(true);
    setLoadError(null);
    setUnavailable(false);
    try {
      const { overview, unavailable: isUnavailable } = await fetchWritingSystemForCourse(courseId);
      if (isUnavailable) {
        setUnavailable(true);
        setOverview(null);
        return null;
      }
      setOverview(overview);
      return overview;
    } catch (err) {
      const friendly =
        err instanceof Error
          ? err.message
          : "We couldn't load the writing system right now. Please try again.";
      setLoadError(friendly);
      setOverview(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId, routeReady]);

  useEffect(() => {
    if (!routeReady) {
      setLoading(false);
      setUnavailable(true);
      return;
    }

    setOverview(null);
    setPhase("browse");
    setActiveSlug(null);
    setLessonChars([]);
    setCharIndex(0);
    setLoadError(null);

    loadOverview().catch(() => undefined);

    return () => audioManager.stop();
  }, [courseId, loadOverview, routeReady]);

  useEffect(() => {
    if (!router.isReady || !routeReady) return;
    const activeId = usePathStore.getState().activeCourseId;
    if (isValidCourseId(activeId) && activeId !== courseId) {
      router.replace(`/writing/${activeId}`);
    }
  }, [courseId, routeReady, router.isReady, router.replace]);

  const activeSection = useMemo(() => {
    if (!overview) return null;
    if (activeSlug) return overview.sections.find((s) => s.slug === activeSlug) ?? null;
    if (sectionSlugParam) return overview.sections.find((s) => s.slug === sectionSlugParam) ?? null;
    return overview.sections.find((s) => s.unlocked && s.total_characters > 0) ?? overview.sections[0] ?? null;
  }, [overview, activeSlug, sectionSlugParam]);

  useEffect(() => {
    if (!overview || !sectionSlugParam || activeSlug) return;
    setActiveSlug(sectionSlugParam);
  }, [overview, sectionSlugParam, activeSlug]);

  const sectionCharacters = useMemo(() => {
    if (!activeSection) return [];
    return activeSection.characters ?? [];
  }, [activeSection]);

  const currentChar = lessonChars[charIndex];
  const progressPct =
    lessonChars.length > 0
      ? Math.round(((charIndex + (phase === "quiz" ? 0.5 : 0)) / lessonChars.length) * 100)
      : activeSection && activeSection.total_characters > 0
        ? Math.round((activeSection.characters_learned / activeSection.total_characters) * 100)
        : 0;

  const selectSection = (section: WritingSectionSummary) => {
    if (!section.unlocked) return;
    setActiveSlug(section.slug);
    setPhase("browse");
    setLessonChars([]);
    setCharIndex(0);
  };

  const startSectionLesson = (chars?: WritingCharacter[]) => {
    const pool = chars ?? sectionCharacters.filter((c) => !c.locked);
    if (pool.length === 0) return;
    setLessonChars(pool);
    setCharIndex(0);
    setPhase("intro");
  };

  const startSingleCharacter = (char: WritingCharacter) => {
    if (char.locked) return;
    setLessonChars([char]);
    setCharIndex(0);
    setPhase("intro");
  };

  const handleIntroContinue = () => setPhase("quiz");

  const handleQuizAnswer = async (correct: boolean) => {
    if (!currentChar || !routeReady) return;
    await api.submitCharacterProgress(courseId, currentChar.id, correct);
    if (correct) {
      playSound("correct");
    } else {
      playSound("wrong");
    }

    if (charIndex + 1 >= lessonChars.length) {
      correctAnswerBurst();
      playSound("xp");
      setPhase("section_complete");
      await loadOverview();
      return;
    }
    setCharIndex((i) => i + 1);
    setPhase("intro");
  };

  if (!routeReady || (unavailable && !loading)) {
    return (
      <div className="min-h-screen bg-[#131F24] text-slate-100 flex flex-col items-center justify-center p-6">
        <p className="text-6xl mb-4">✍️</p>
        <p className="text-lg font-bold text-slate-200 text-center mb-2">Writing system not available</p>
        <p className="text-sm text-[#8E9FA8] text-center max-w-sm mb-6">
          {routeReady
            ? "Writing system is not available yet for this course. You can still continue with your regular lessons."
            : "The writing system link is invalid. Return to your course and try again."}
        </p>
        <Link href="/" className="w-full max-w-xs">
          <DuoButton variant="primary" className="w-full py-3">
            Back to course
          </DuoButton>
        </Link>
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-[#131F24] flex flex-col">
        <header className="flex items-center px-4 sm:px-6 py-4 border-b border-[#37464F] max-w-3xl mx-auto w-full">
          <Link href="/" className="text-[#AAB7C2] hover:text-white shrink-0">
            <X className="w-6 h-6" />
          </Link>
        </header>
        <WritingSystemSkeleton />
      </div>
    );
  }

  if (loadError && !overview) {
    return (
      <div className="min-h-screen bg-[#131F24] text-slate-100 flex flex-col items-center justify-center p-6">
        <p className="text-lg font-bold text-slate-200 text-center mb-2">Writing system unavailable</p>
        <p className="text-sm text-[#8E9FA8] text-center max-w-sm mb-6">{loadError}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <DuoButton variant="primary" className="w-full py-3 gap-2" onClick={() => loadOverview()}>
            <RefreshCw className="w-4 h-4" />
            Try again
          </DuoButton>
          <Link href="/" className="w-full">
            <DuoButton variant="secondary" className="w-full py-3">
              Back to course
            </DuoButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131F24] text-slate-100 flex flex-col overflow-x-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#37464F] max-w-3xl mx-auto w-full">
        <Link href="/" className="text-[#AAB7C2] hover:text-white shrink-0">
          <X className="w-6 h-6" />
        </Link>
        <div className="flex-1 min-w-[120px] mx-0 sm:mx-4 h-3 rounded-full bg-[#202F36] overflow-hidden border border-[#37464F]">
          <motion.div
            animate={{ width: `${phase === "section_complete" ? 100 : progressPct}%` }}
            className="h-full bg-[#1CB0F6] rounded-full"
          />
        </div>
        <span className="text-xs font-bold text-[#AAB7C2] w-auto sm:w-12 text-right shrink-0">
          {phase === "browse"
            ? `${activeSection?.characters_learned ?? 0}/${activeSection?.total_characters ?? "—"}`
            : `${charIndex + 1}/${lessonChars.length || "—"}`}
        </span>
      </header>

      {overview && overview.sections.length > 1 && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {overview.sections.map((section) => {
              const isActive = activeSection?.slug === section.slug;
              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={!section.unlocked}
                  onClick={() => selectSection(section)}
                  className={`shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-extrabold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? "border-[#1CB0F6] bg-[#1a3d4d] text-[#84D8FF]"
                      : "border-[#37464F] bg-[#1F2E35] text-[#AAB7C2] hover:bg-[#26343c]"
                  }`}
                >
                  {!section.unlocked && <Lock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {section.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-3xl mx-auto w-full pb-32 min-w-0">
        <AnimatePresence mode="wait">
          {phase === "browse" && overview && activeSection && (
            <motion.div
              key={`browse-${activeSection.slug}-${courseId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-5"
            >
              <div className="text-center space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1CB0F6]">
                  {overview.language} Writing System
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold font-nunito">{activeSection.title}</h1>
                <p className="text-xs sm:text-sm text-[#8E9FA8] font-semibold px-2">{activeSection.description}</p>
              </div>

              {sectionCharacters.length === 0 ? (
                <p className="text-center text-[#8E9FA8] font-semibold py-8">This section is coming soon.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {sectionCharacters.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      disabled={char.locked}
                      onClick={() => startSingleCharacter(char)}
                      className={`relative flex flex-col items-center justify-center gap-1 p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer min-h-[88px] sm:min-h-[96px] ${
                        char.completed
                          ? "border-[#58CC02]/60 bg-[#1a3d24]/40"
                          : char.locked
                            ? "border-[#37464F]/60 bg-[#182228] opacity-50 cursor-not-allowed"
                            : "border-[#37464F] bg-[#1F2E35] hover:border-[#1CB0F6] hover:bg-[#243840]"
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl font-extrabold leading-none">{char.glyph}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#8E9FA8] truncate max-w-full">
                        {char.romanization ?? char.romaji}
                      </span>
                      {char.completed && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#58CC02]" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {sectionCharacters.length > 0 && (
                <DuoButton
                  variant="primary"
                  className="w-full max-w-md mx-auto py-3.5 sm:py-4"
                  onClick={() => startSectionLesson()}
                >
                  {activeSection.completed ? "Practice all characters" : "Start lesson"}
                </DuoButton>
              )}
            </motion.div>
          )}

          {phase === "intro" && currentChar && overview && (
            <motion.div key={`intro-${currentChar.id}`} className="w-full min-w-0">
              <CharacterIntroCard
                character={currentChar}
                languageCode={overview.language_code}
                autoPlayKey={`ws-${courseId}-${currentChar.id}`}
              />
            </motion.div>
          )}

          {phase === "quiz" && currentChar && overview && (
            <motion.div key={`quiz-${currentChar.id}`} className="w-full min-w-0">
              <CharacterQuiz
                character={currentChar}
                pool={lessonChars}
                languageCode={overview.language_code}
                onAnswer={handleQuizAnswer}
              />
            </motion.div>
          )}

          {phase === "section_complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 w-full"
            >
              <p className="text-6xl">🎉</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#58CC02] font-nunito">
                {lessonChars.length === 1 ? "Character mastered!" : "Section complete!"}
              </h2>
              <p className="text-base sm:text-lg text-[#AAB7C2] font-semibold max-w-sm mx-auto px-2">
                {overview?.primary_completed
                  ? "You are ready for Unit 1. Great work!"
                  : `Keep going — more characters await in ${overview?.language ?? "your course"}!`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto px-4">
                <DuoButton variant="primary" className="w-full py-4" onClick={() => setPhase("browse")}>
                  Back to characters
                </DuoButton>
                <DuoButton variant="secondary" className="w-full py-4" onClick={() => router.push("/")}>
                  Continue to course
                </DuoButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {phase === "intro" && currentChar && overview && (
        <div className="fixed bottom-0 left-0 right-0 py-4 sm:py-6 px-4 bg-[#1F2E35] border-t-2 border-[#37464F]">
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-center">
            <AudioButton
              text={currentChar.glyph}
              language={overview.language_code}
              className="w-full sm:w-auto sm:shrink-0"
            />
            <DuoButton variant="primary" className="w-full py-4" onClick={handleIntroContinue}>
              Continue
            </DuoButton>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
