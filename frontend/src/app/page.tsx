"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserProgress from "@/components/UserProgress";
import UnitBanner from "@/components/UnitBanner";
import LessonButton from "@/components/LessonButton";
import DuoButton from "@/components/DuoButton";
import AddCourseModal from "@/components/AddCourseModal";
import RightRailCard from "@/components/RightRailCard";

import { api, ApiError } from "@/lib/api";
import { userNeedsOnboarding } from "@/lib/onboarding";
import { getPersistedActiveCourseId } from "@/lib/courseIsolation";
import { isValidCourseId } from "@/lib/ids";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { PATH_NODE_GAP_CLASS } from "@/lib/pathLayout";
import { UserQuestProgress } from "@/lib/types";
import { usePathStore } from "@/store/usePathStore";
import { useCourseStore } from "@/store/useCourseStore";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useSafeRouter();
  const pathData = usePathStore((s) => s.pathData);
  const stats = usePathStore((s) => s.stats);
  const activeCourseId = usePathStore((s) => s.activeCourseId);
  const setPathData = usePathStore((s) => s.setPathData);
  const setStats = usePathStore((s) => s.setStats);
  const setActiveCourseId = usePathStore((s) => s.setActiveCourseId);
  const refreshPath = usePathStore((s) => s.refreshPath);

  const loadEnrolledCourses = useCourseStore((s) => s.loadEnrolledCourses);
  const activeCourse = useCourseStore((s) => s.activeCourse);
  const switching = useCourseStore((s) => s.switching);

  const [questsProgress, setQuestsProgress] = useState<UserQuestProgress[]>([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingPath, setLoadingPath] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourseData = useCallback(
    async (courseId: string) => {
      if (!isValidCourseId(courseId)) {
        setLoadingPath(false);
        return;
      }

      setLoadingPath(true);
      setError(null);

      const [userStats, coursePath, questsData] = await Promise.all([
        api.getUserStats("me"),
        api.getCoursePath(courseId),
        api.getUserQuests("me"),
      ]);

      setStats(userStats);
      setPathData(coursePath);
      setActiveCourseId(courseId);
      setQuestsProgress(questsData);
      setLoadingPath(false);
    },
    [setPathData, setStats, setActiveCourseId]
  );

  const initialize = useCallback(async () => {
    try {
      setInitializing(true);
      setError(null);

      const profile = await api.getUserProfile("me");

      if (userNeedsOnboarding(profile)) {
        if (router.isReady) router.replace("/onboarding");
        return;
      }

      const enrolled = await loadEnrolledCourses();

      if (enrolled.length === 0) {
        if (router.isReady) router.replace("/onboarding");
        return;
      }

      const courseId =
        profile.active_course_id ??
        getPersistedActiveCourseId() ??
        enrolled.find((c) => c.is_active)?.course_id ??
        enrolled[0].course_id;

      if (!isValidCourseId(courseId)) {
        setError("No valid course is selected. Please pick a course from onboarding.");
        return;
      }

      setActiveCourseId(courseId);
      await loadCourseData(courseId);
    } catch (err: unknown) {
      console.error("[Home] initialize failed:", err);
      const friendly =
        err instanceof ApiError
          ? err.friendlyMessage
          : "Failed to connect to the backend server. Make sure FastAPI is running on port 8000 and the database is seeded.";
      setError(friendly);
    } finally {
      setInitializing(false);
      setLoadingPath(false);
    }
  }, [loadCourseData, loadEnrolledCourses, router.isReady, router.replace, setActiveCourseId]);

  const reloadPath = useCallback(async () => {
    if (!isValidCourseId(activeCourseId)) return;
    try {
      setLoadingPath(true);
      setError(null);
      await refreshPath(activeCourseId);
      const questsData = await api.getUserQuests("me");
      setQuestsProgress(questsData);
      await loadEnrolledCourses();
    } catch (err: unknown) {
      console.error(err);
      setError("Could not reload learning path data.");
    } finally {
      setLoadingPath(false);
    }
  }, [activeCourseId, refreshPath, loadEnrolledCourses]);

  const prevCourseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    initialize();
  }, [initialize, router.isReady]);

  useEffect(() => {
    if (!isValidCourseId(activeCourseId) || initializing) return;
    if (prevCourseRef.current === activeCourseId) return;
    if (prevCourseRef.current !== null) {
      setQuestsProgress([]);
      setError(null);
      void loadCourseData(activeCourseId);
    }
    prevCourseRef.current = activeCourseId;
  }, [activeCourseId, initializing, loadCourseData]);

  useEffect(() => {
    if (switching) {
      setQuestsProgress([]);
    }
  }, [switching]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isValidCourseId(activeCourseId)) {
        reloadPath();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeCourseId, reloadPath]);

  const handleCourseEnrolled = (firstLessonId: string | null) => {
    if (firstLessonId && router.isReady) {
      router.push(`/lesson/${firstLessonId}`);
    }
  };

  const getLessonType = (
    skillsLength: number,
    index: number
  ): "star" | "headphones" | "dumbbell" | "trophy" | "chest" | "card" => {
    if (index === 0) return "star";
    if (index === 1) return "card";
    if (index === skillsLength - 1) return "trophy";
    if (index === skillsLength - 2) return "chest";

    const r = index % 3;
    if (r === 0) return "star";
    if (r === 1) return "card";
    return "dumbbell";
  };

  const activeSkillKey = useMemo(() => {
    if (!pathData) return null;
    for (let uIdx = 0; uIdx < pathData.units.length; uIdx++) {
      for (let sIdx = 0; sIdx < pathData.units[uIdx].skills.length; sIdx++) {
        const skill = pathData.units[uIdx].skills[sIdx];
        if (skill.status === "available" || skill.status === "in_progress") {
          return `${uIdx}-${sIdx}`;
        }
      }
    }
    return null;
  }, [pathData]);

  const renderMainContent = () => {
    if (initializing || switching) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
          <p className="text-slate-400 font-bold mt-4 font-nunito">
            {switching ? "Switching course…" : "Loading…"}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4">
          <div className="text-5xl">🦉</div>
          <h1 className="text-2xl font-extrabold text-slate-200">Connection Issue</h1>
          <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">{error}</p>
          <DuoButton variant="primary" onClick={initialize}>
            <RefreshCw className="w-5 h-5 mr-2" /> Retry Connection
          </DuoButton>
        </div>
      );
    }

    if (!activeCourseId || loadingPath || !stats || !pathData) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
          <p className="text-slate-400 font-bold mt-4 font-nunito">Loading path…</p>
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCourseId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="w-full flex flex-col items-center overflow-x-hidden"
        >
          {pathData.units.map((unit, uIdx) => (
            <div key={unit.id} className="w-full flex flex-col items-center mb-16 max-w-[600px] relative">
              <UnitBanner
                orderIndex={unit.order_index}
                title={unit.title}
                description={unit.description}
                colorTheme={unit.color_theme}
              />

              <div
                className={`learning-path-nodes flex flex-col items-center relative w-full pt-4 pb-6 ${PATH_NODE_GAP_CLASS}`}
              >
                {unit.skills.map((skill, sIdx) => {
                  const nodeType = getLessonType(unit.skills.length, sIdx);
                  const skillKey = `${uIdx}-${sIdx}`;
                  return (
                    <LessonButton
                      key={skill.id}
                      id={skill.id}
                      index={sIdx}
                      title={skill.title}
                      status={skill.status}
                      lessonsCompleted={skill.lessons_completed}
                      lessonsPerLevel={skill.lessons_per_level}
                      currentLevel={skill.current_level}
                      nextLessonId={skill.next_lesson_id}
                      type={nodeType}
                      isCurrentLesson={activeSkillKey === skillKey}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#131F24] text-[#F3F4F6] overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:pl-[256px] min-w-0 overflow-x-hidden">
        <div className="h-[50px] lg:hidden w-full" />

        {stats && (
          <div className="lg:hidden sticky top-[50px] z-30 bg-[#131F24]/95 backdrop-blur-sm border-b border-light-border px-4 py-2.5">
            <UserProgress
              streak={stats.current_streak}
              totalXp={stats.total_xp}
              gems={stats.gems}
              hearts={stats.hearts_current}
              maxHearts={stats.hearts_max}
              dailyXpToday={stats.daily_xp_today}
              dailyXpGoal={stats.daily_xp_goal}
              isPro={false}
              onAddCourse={() => setShowAddCourseModal(true)}
              compact
            />
          </div>
        )}

        <div className="max-w-[1056px] w-full mx-auto px-4 md:px-6 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 min-w-0">
          <main className="flex-1 flex flex-col items-center min-w-0 w-full overflow-x-hidden">
            {renderMainContent()}
          </main>

          <aside className="hidden lg:flex flex-col w-[368px] gap-5 shrink-0 h-fit sticky top-6">
            {stats && (
              <UserProgress
                streak={stats.current_streak}
                totalXp={stats.total_xp}
                gems={stats.gems}
                hearts={stats.hearts_current}
                maxHearts={stats.hearts_max}
                dailyXpToday={stats.daily_xp_today}
                dailyXpGoal={stats.daily_xp_goal}
                isPro={false}
                onAddCourse={() => setShowAddCourseModal(true)}
              />
            )}

            {stats && pathData && activeCourse && (
              <>
                <RightRailCard className="relative overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E9FA8]">
                      Current course
                    </p>
                    <h3 className="font-extrabold text-slate-100 text-lg font-nunito">
                      {activeCourse.language_name}
                    </h3>
                    <p className="text-sm text-[#8E9FA8] font-semibold">
                      {activeCourse.current_unit} • {activeCourse.current_lesson}
                    </p>
                    <p className="text-xs text-brand-green font-bold mt-1">
                      {activeCourse.completion_percent}% complete
                    </p>
                  </div>
                </RightRailCard>

                <RightRailCard className="relative overflow-hidden">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="bg-gradient-to-r from-[#FF4B9A] via-[#A855F7] to-[#6366F1] text-white font-black italic px-2.5 py-0.5 rounded-md text-[10px] uppercase w-fit tracking-[0.1em] shadow-sm">
                        SUPER
                      </span>
                      <h3 className="font-extrabold text-slate-100 text-[17px] font-nunito leading-tight">
                        Try Super for free
                      </h3>
                      <p className="text-[12px] text-[#8E9FA8] font-semibold leading-relaxed">
                        No ads, personalized practice, and unlimited Legendary!
                      </p>
                    </div>
                    <img
                      src="/mascot/super.jpg"
                      alt="Super Duo"
                      className="w-[84px] h-[84px] object-contain rounded-xl shrink-0"
                    />
                  </div>
                  <Link href="/super" className="block w-full mt-4">
                    <DuoButton
                      variant="super"
                      className="w-full rounded-2xl py-3 text-[11px] uppercase font-extrabold tracking-[0.1em] bg-gradient-to-r from-[#1CB0F6] to-[#6366F1] hover:from-[#38bdf8] hover:to-[#818cf8] border-none text-white shadow-[0_4px_0_#0c4a6e]"
                    >
                      TRY 1 WEEK FREE
                    </DuoButton>
                  </Link>
                </RightRailCard>

                <RightRailCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-slate-100 text-[15px] font-nunito">Daily Quests</h3>
                    <Link
                      href="/quests"
                      className="text-[11px] font-extrabold text-sky-400 hover:text-sky-300 uppercase tracking-[0.1em] transition-colors"
                    >
                      VIEW ALL
                    </Link>
                  </div>

                  <div className="flex flex-col gap-4">
                    {questsProgress.slice(0, 1).map((qp) => {
                      const percent = Math.min(
                        100,
                        Math.round((qp.progress / qp.quest.xp_target) * 100)
                      );
                      return (
                        <div key={qp.id} className="flex items-center gap-3">
                          <div className="text-[28px] text-brand-orange shrink-0">⚡</div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <span className="font-extrabold text-slate-100 text-[13px] font-nunito leading-tight">
                              {qp.quest.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#202F36] h-3 rounded-full overflow-hidden border border-light-border relative">
                                <div
                                  style={{ width: `${percent}%` }}
                                  className="h-full rounded-full transition-all duration-500 bg-brand-orange"
                                />
                              </div>
                            </div>
                            <span className="text-[11px] text-[#8E9FA8] font-extrabold tracking-wider">
                              {qp.progress} / {qp.quest.xp_target}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RightRailCard>
              </>
            )}
          </aside>
        </div>
      </div>

      <AddCourseModal
        isOpen={showAddCourseModal}
        onClose={() => setShowAddCourseModal(false)}
        onEnrolled={handleCourseEnrolled}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
