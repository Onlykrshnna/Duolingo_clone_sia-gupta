"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserProgress from "@/components/UserProgress";
import DuoButton from "@/components/DuoButton";
import AddCourseModal from "@/components/AddCourseModal";
import { useCourseStore } from "@/store/useCourseStore";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { playSound } from "@/lib/sounds";
import { api } from "@/lib/api";
import { UserStats } from "@/lib/types";
import { Globe2, RefreshCw, Volume2, VolumeX, Sparkles } from "lucide-react";

function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
  icon,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-2 py-1 -mx-2 transition-[background-color] duration-[170ms] hover:bg-[#243840]/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#131F24] text-[#1CB0F6] rounded-xl flex items-center justify-center border border-[#37464F] transition-transform duration-[170ms] hover:scale-105">
          {icon}
        </div>
        <div>
          <h3 className="font-extrabold text-slate-100 text-base font-nunito">{label}</h3>
          <p className="text-slate-400 font-semibold text-sm">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => {
          playSound("click");
          onChange(!enabled);
        }}
        className={`relative w-14 h-8 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
          enabled ? "bg-brand-green" : "bg-[#37464F]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ease-out ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const loadEnrolledCourses = useCourseStore((s) => s.loadEnrolledCourses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const soundEnabled = usePreferencesStore((s) => s.soundEnabled);
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);
  const autoPlayEnabled = usePreferencesStore((s) => s.autoPlayEnabled);
  const speechSpeedPreset = usePreferencesStore((s) => s.speechSpeedPreset);
  const setSoundEnabled = usePreferencesStore((s) => s.setSoundEnabled);
  const setAnimationsEnabled = usePreferencesStore((s) => s.setAnimationsEnabled);
  const setAutoPlayEnabled = usePreferencesStore((s) => s.setAutoPlayEnabled);
  const setSpeechSpeedPreset = usePreferencesStore((s) => s.setSpeechSpeedPreset);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userProfile] = await Promise.all([
        api.getUserProfile("me"),
        loadEnrolledCourses(),
      ]);
      setStats(userProfile.stats);
      await loadEnrolledCourses();
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load user progress. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
        <p className="text-muted-text font-bold mt-4 font-nunito">Loading settings...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <div className="text-5xl">⚙️</div>
        <h1 className="text-2xl font-extrabold text-slate-200">Connection Issue</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">
          {error || "Could not load settings."}
        </p>
        <DuoButton variant="primary" onClick={loadData}>
          <RefreshCw className="w-5 h-5 mr-2" /> Retry Connection
        </DuoButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#131F24] text-[#F3F4F6] max-lg:min-h-[100dvh] max-lg:overflow-x-clip">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:pl-[256px] min-w-0 max-lg:overflow-x-clip">
        <div className="h-[50px] lg:hidden w-full" />

        <div className="max-w-[1056px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-8 min-w-0 max-lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <main className="flex-1 max-w-[600px] w-full mx-auto flex flex-col gap-6 pt-6 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-nunito">
              Settings
            </h1>

            <div className="border-2 border-[#37464F] rounded-2xl p-6 space-y-4 bg-[#1F2E35]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500/10 text-[#1CB0F6] rounded-xl flex items-center justify-center">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-100 text-lg font-nunito">
                    Language Course
                  </h2>
                  <p className="text-slate-400 font-semibold text-sm">
                    Use the course switcher in the header to change or add languages
                  </p>
                </div>
              </div>

              <DuoButton
                variant="secondary"
                className="w-full sm:w-auto px-6"
                onClick={() => setShowAddCourseModal(true)}
              >
                Add another course
              </DuoButton>
            </div>

            <div className="border-2 border-[#37464F] rounded-2xl p-6 space-y-6 bg-[#1F2E35]">
              <div>
                <h2 className="font-extrabold text-slate-100 text-lg font-nunito mb-1">
                  Experience
                </h2>
                <p className="text-slate-400 font-semibold text-sm">
                  Control sounds and animations across the app
                </p>
              </div>

              <ToggleSwitch
                enabled={soundEnabled}
                onChange={(v) => {
                  setSoundEnabled(v);
                  if (v) playSound("click");
                }}
                label="Sound Effects"
                description="Play sounds for answers, XP, hearts, and celebrations"
                icon={soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              />

              <ToggleSwitch
                enabled={animationsEnabled}
                onChange={setAnimationsEnabled}
                label="Animations"
                description="Enable motion, confetti, and celebration effects"
                icon={<Sparkles className="w-5 h-5" />}
              />

              <ToggleSwitch
                enabled={autoPlayEnabled}
                onChange={setAutoPlayEnabled}
                label="Auto Play Pronunciation"
                description="Automatically speak new words when they first appear"
                icon={<Volume2 className="w-5 h-5" />}
              />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#131F24] text-[#1CB0F6] rounded-xl flex items-center justify-center border border-[#37464F]">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-base font-nunito">
                      Speech Speed
                    </h3>
                    <p className="text-slate-400 font-semibold text-sm">
                      Adjust how fast words are spoken
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {(["slow", "normal", "fast"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        playSound("click");
                        setSpeechSpeedPreset(preset);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-colors cursor-pointer ${
                        speechSpeedPreset === preset
                          ? "bg-brand-green text-white"
                          : "bg-[#37464F] text-slate-300 hover:bg-[#45525a]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden lg:flex flex-col w-[368px] gap-6 shrink-0 h-fit sticky top-6">
            <UserProgress
              streak={stats.current_streak}
              gems={stats.gems}
              hearts={stats.hearts_current}
              maxHearts={stats.hearts_max}
              dailyXpToday={stats.daily_xp_today}
              dailyXpGoal={stats.daily_xp_goal}
              isPro={false}
              onAddCourse={() => setShowAddCourseModal(true)}
            />
          </aside>
        </div>
      </div>

      <AddCourseModal isOpen={showAddCourseModal} onClose={() => setShowAddCourseModal(false)} />
    </div>
  );
}

export const dynamic = "force-dynamic";
