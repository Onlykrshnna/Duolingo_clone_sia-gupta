"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserProgress from "@/components/UserProgress";
import Link from "next/link";
import { api } from "@/lib/api";
import { UserStats, UserQuestProgress } from "@/lib/types";
import { Clock, Lock, RefreshCw } from "lucide-react";
import DuoButton from "@/components/DuoButton";
import { HoverCard } from "@/components/interactions";

// Purple Welcome Banner Duo Owl & Treasure Chest Graphic
const WelcomeBannerGraphic = () => (
  <div className="relative w-36 h-28 flex items-center justify-center shrink-0 select-none">
    {/* Sparkles */}
    <div className="absolute top-1 left-2 text-amber-200 animate-pulse text-sm">✦</div>
    <div className="absolute top-4 right-4 text-amber-300 animate-bounce text-xs">✨</div>
    <div className="absolute bottom-2 left-6 text-amber-300 text-xs">✦</div>

    {/* Glowing Chest */}
    <div className="absolute -left-1 top-2 text-3xl transform -rotate-12 animate-pulse select-none">
      🎁
    </div>

    {/* Duo Owl Graphic */}
    <div className="relative z-10 w-24 h-24 transform rotate-6">
      <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#58CC02" />
        <circle cx="50" cy="54" r="30" fill="#7AC70C" />
        <path d="M 32 50 Q 50 68 68 50 Z" fill="#A5ED4E" />
        <circle cx="38" cy="40" r="10" fill="white" />
        <circle cx="62" cy="40" r="10" fill="white" />
        <circle cx="38" cy="40" r="4.5" fill="#131F24" />
        <circle cx="62" cy="40" r="4.5" fill="#131F24" />
        <circle cx="40" cy="38" r="1.5" fill="white" />
        <circle cx="64" cy="38" r="1.5" fill="white" />
        <polygon points="50,44 44,51 56,51" fill="#FF9600" />
      </svg>
    </div>
  </div>
);

// Monthly Challenge Badge Medallion Graphic
const MonthlyBadgeGraphic = () => (
  <div className="w-20 h-20 relative flex items-center justify-center shrink-0 select-none">
    <svg className="w-full h-full" viewBox="0 0 80 80">
      {/* Green back disc */}
      <circle cx="48" cy="32" r="26" fill="#58CC02" />
      {/* Gold medallion */}
      <circle cx="36" cy="44" r="26" fill="#FFC800" stroke="#E5A000" strokeWidth="3" />
      <circle cx="36" cy="44" r="21" fill="#FFD700" opacity="0.8" />
      {/* Lightning bolt inside badge */}
      <polygon points="38,28 26,46 36,46 34,60 46,42 36,42" fill="#FF9600" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  </div>
);

export default function QuestsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [questsProgress, setQuestsProgress] = useState<UserQuestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [userStats, quests] = await Promise.all([
        api.getUserStats("me"),
        api.getUserQuests("me"),
      ]);
      
      setStats(userStats);
      setQuestsProgress(quests);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load quests data. Make sure backend is running.");
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
        <p className="text-slate-400 font-bold mt-4 font-nunito">Loading quests...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <div className="text-5xl">🎁</div>
        <h1 className="text-2xl font-extrabold text-slate-200">Connection Issue</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">
          {error || "Could not load stats."}
        </p>
        <DuoButton variant="primary" onClick={loadData}>
          <RefreshCw className="w-5 h-5 mr-2" /> Retry Connection
        </DuoButton>
      </div>
    );
  }

  // Active XP quest from API (seeded target is 20 XP)
  const activeQuest =
    questsProgress.find((q) => q.quest.quest_type === "xp") ?? questsProgress[0] ?? null;
  const currentProgress = activeQuest?.progress ?? 0;
  const targetXp = activeQuest?.quest.xp_target ?? 20;
  const questTitle = activeQuest?.quest.title ?? "Earn XP";
  const percent = Math.min(100, Math.round((currentProgress / targetXp) * 100));

  return (
    <div className="flex min-h-screen bg-[#131F24] text-[#F3F4F6] max-lg:min-h-[100dvh] max-lg:overflow-x-clip">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-[256px] min-w-0 max-lg:overflow-x-clip">
        {/* Mobile top spacer */}
        <div className="h-[50px] lg:hidden w-full" />
        
        {/* Content Layout */}
        <div className="max-w-[1056px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-10 items-start min-w-0 max-lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
          
          {/* Main Center Feed Column */}
          <main className="flex-1 max-w-[560px] w-full mx-auto flex flex-col space-y-6 min-w-0">
            
            {/* 1. Purple Welcome Banner */}
            <div className="bg-[#7952B3] text-white rounded-3xl p-6 sm:p-7 flex items-center justify-between shadow-md relative overflow-hidden select-none">
              <div className="flex flex-col text-left gap-1.5 max-w-[300px]">
                <h1 className="text-2xl font-extrabold font-nunito tracking-tight">
                  Welcome!
                </h1>
                <p className="text-xs font-semibold text-white/90 leading-relaxed font-nunito">
                  Complete quests to earn rewards! Quests refresh every day.
                </p>
              </div>
              <WelcomeBannerGraphic />
            </div>

            {/* 2. Daily Quests Subheader Row */}
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-xl font-extrabold text-slate-100 font-nunito tracking-tight">
                Daily Quests
              </h2>
              <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs tracking-wider uppercase font-nunito">
                <Clock className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>5 HOURS</span>
              </div>
            </div>

            {/* 3. Quest Cards List */}
            <div className="flex flex-col gap-4">
              
              {/* Card 1: Earn 10 XP */}
              <HoverCard className="border-2 border-[#37464F] bg-[#131F24] rounded-2xl p-5 flex items-center gap-4 text-left shadow-sm hover:border-[#4E606A] hover:shadow-[0_0_16px_rgba(255,200,0,0.12)] group">
                <div className="text-3xl text-amber-400 shrink-0 select-none transition-transform duration-[170ms] group-hover:scale-110 group-hover:rotate-6">
                  ⚡
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="font-extrabold text-slate-100 text-sm font-nunito leading-tight">
                    {questTitle}
                  </h3>

                  {/* Dark progress bar container with chest icon at end */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-5 bg-[#202F36] rounded-full border border-[#37464F] relative overflow-hidden flex items-center">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-[#FF9600] rounded-full transition-all duration-300 group-hover:brightness-110"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-300 font-nunito tracking-wider z-10">
                        {currentProgress} / {targetXp}
                      </span>
                    </div>

                    {/* Right end wooden chest icon */}
                    <div className="text-xl shrink-0 select-none transition-transform duration-[170ms] group-hover:rotate-12">
                      📦
                    </div>
                  </div>
                </div>
              </HoverCard>

              {/* Card 2: More quests unlock soon */}
              <div className="border-2 border-[#37464F] bg-[#131F24] rounded-2xl p-5 flex items-center gap-4 text-left shadow-sm opacity-80">
                <div className="w-10 h-10 rounded-xl bg-[#202F36] border border-[#37464F] flex items-center justify-center text-slate-400 shrink-0">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-slate-400 text-sm font-nunito">
                  More quests unlock soon
                </h3>
              </div>

            </div>

          </main>

          {/* Right Sidebar Column */}
          <aside className="hidden lg:flex flex-col w-[350px] gap-6 shrink-0 h-fit sticky top-8">
            {/* Top User Progress metrics */}
            <UserProgress
              showCourseSwitcher={false}
              streak={stats.current_streak}
              totalXp={stats.total_xp}
              gems={stats.gems}
              hearts={stats.hearts_current}
              maxHearts={stats.hearts_max}
              isPro={false}
            />

            {/* Monthly Challenges Card */}
            <div className="border-2 border-[#37464F] bg-[#131F24] p-6 rounded-2xl flex flex-col gap-5 text-left shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <h3 className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                    Monthly challenges unlock soon!
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed font-nunito">
                    Complete each month's challenge to earn exclusive badges
                  </p>
                </div>
                <MonthlyBadgeGraphic />
              </div>

              <Link href="/" className="w-full">
                <button className="w-full border-2 border-[#37464F] hover:bg-[#1F2E35] hover:border-slate-500 active:scale-95 transition-all text-[#1CB0F6] font-extrabold rounded-2xl py-3 text-xs tracking-widest uppercase font-nunito shadow-sm cursor-pointer">
                  START A LESSON
                </button>
              </Link>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase px-2 font-nunito">
              <span className="hover:text-slate-400 cursor-pointer">ABOUT</span>
              <span className="hover:text-slate-400 cursor-pointer">BLOG</span>
              <span className="hover:text-slate-400 cursor-pointer">STORE</span>
              <span className="hover:text-slate-400 cursor-pointer">EFFICACY</span>
              <span className="hover:text-slate-400 cursor-pointer">CAREERS</span>
              <span className="hover:text-slate-400 cursor-pointer">INVESTORS</span>
              <span className="hover:text-slate-400 cursor-pointer">TERMS</span>
              <span className="hover:text-slate-400 cursor-pointer">PRIVACY</span>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

