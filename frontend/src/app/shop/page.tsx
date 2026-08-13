"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserProgress from "@/components/UserProgress";
import Link from "next/link";
import { api } from "@/lib/api";
import { UserStats } from "@/lib/types";
import { Lock, RefreshCw } from "lucide-react";
import DuoButton from "@/components/DuoButton";
import { HoverCard } from "@/components/interactions";

const shopRowClass =
  "py-5 flex items-center justify-between gap-4 text-left rounded-xl transition-[background-color,transform,box-shadow] duration-[170ms] hover:bg-[#1F2E35]/40 px-1 -mx-1";

// Start a Family Plan Banner Characters Graphic
const FamilyPlanGraphic = () => (
  <div className="relative w-40 h-28 flex items-center justify-center shrink-0 select-none">
    {/* Background sparkles */}
    <div className="absolute top-1 right-2 text-sky-300 animate-pulse text-xs">✨</div>
    <div className="absolute bottom-2 left-2 text-purple-200 animate-pulse text-xs">✦</div>

    {/* Colorful learner avatars graphic */}
    <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 160 110">
      {/* Blue character */}
      <circle cx="30" cy="72" r="16" fill="#1CB0F6" />
      <circle cx="26" cy="68" r="2.5" fill="white" />
      <circle cx="34" cy="68" r="2.5" fill="white" />

      {/* Orange character */}
      <circle cx="60" cy="80" r="15" fill="#FF9600" />
      <circle cx="56" cy="76" r="2.5" fill="white" />
      <circle cx="64" cy="76" r="2.5" fill="white" />

      {/* Center Leader character with Turban */}
      <circle cx="100" cy="52" r="22" fill="#00CD9C" />
      <path d="M 80 44 Q 100 22 120 44 Z" fill="#1CB0F6" />
      <circle cx="93" cy="48" r="3" fill="white" />
      <circle cx="107" cy="48" r="3" fill="white" />

      {/* Purple character */}
      <circle cx="136" cy="75" r="16" fill="#A55EEA" />
      <circle cx="132" cy="71" r="2.5" fill="white" />
      <circle cx="140" cy="71" r="2.5" fill="white" />

      {/* Duo green owl mascot circle */}
      <circle cx="118" cy="88" r="12" fill="#58CC02" />
    </svg>
  </div>
);

// Ad Blocker Goggles Duo Owl Graphic
const AdBlockerOwlGraphic = () => (
  <div className="w-20 h-20 relative flex items-center justify-center shrink-0 select-none">
    <svg className="w-full h-full drop-shadow-md" viewBox="0 0 100 100">
      {/* Duo green body */}
      <circle cx="50" cy="50" r="42" fill="#58CC02" />
      <circle cx="50" cy="54" r="32" fill="#7AC70C" />
      <path d="M 32 50 Q 50 68 68 50 Z" fill="#A5ED4E" />
      {/* Cyan Super Mask */}
      <rect x="18" y="30" width="64" height="24" rx="12" fill="#1CB0F6" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="36" cy="42" r="7" fill="white" />
      <circle cx="64" cy="42" r="7" fill="white" />
      <circle cx="36" cy="42" r="3.5" fill="#131F24" />
      <circle cx="64" cy="42" r="3.5" fill="#131F24" />
      {/* Beak */}
      <polygon points="50,46 44,54 56,54" fill="#FF9600" />
    </svg>
  </div>
);

export default function ShopPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refilling, setRefilling] = useState(false);
  const [refillMessage, setRefillMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userStats = await api.getUserStats("me");
      setStats(userStats);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const heartsFull = stats ? stats.hearts_current >= stats.hearts_max : true;
  const canRefill = stats ? !heartsFull && stats.gems >= 10 : false;

  const handleRefillHearts = async () => {
    if (!stats || heartsFull || refilling) return;
    try {
      setRefilling(true);
      setRefillMessage(null);
      const response = await api.refillHearts("me");
      setStats((prev) =>
        prev
          ? {
              ...prev,
              hearts_current: response.hearts_current,
              gems: response.gems_remaining,
            }
          : prev
      );
      setRefillMessage(response.message);
    } catch (err: unknown) {
      console.error(err);
      setRefillMessage("Could not refill hearts. Try again.");
    } finally {
      setRefilling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
        <p className="text-slate-400 font-bold mt-4 font-nunito">Loading shop...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <div className="text-5xl">🛍️</div>
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
          
          {/* Center Main Shop Feed */}
          <main className="flex-1 max-w-[560px] w-full mx-auto flex flex-col min-w-0">
            
            {/* 1. Start a family plan! Gradient Banner */}
            <div className="bg-gradient-to-r from-[#17263C] via-[#211E48] to-[#3B194E] border border-[#37464F]/50 rounded-3xl p-6 sm:p-7 flex items-center justify-between shadow-md relative overflow-hidden select-none mb-8">
              <div className="flex flex-col text-left gap-1.5 max-w-[300px]">
                <h1 className="text-2xl font-extrabold font-nunito tracking-tight text-white">
                  Start a family plan!
                </h1>
                <p className="text-xs font-semibold text-slate-300 leading-relaxed font-nunito mb-4">
                  Save on Super Duolingo when you learn with friends
                </p>
                <button className="bg-white hover:bg-slate-100 active:scale-95 text-[#131F24] font-black rounded-2xl px-7 py-3 text-xs tracking-widest uppercase transition shadow-md font-nunito w-fit cursor-pointer">
                  LEARN MORE
                </button>
              </div>
              <FamilyPlanGraphic />
            </div>

            {/* 2. Hearts Section */}
            <h2 className="text-xl font-extrabold text-slate-100 font-nunito tracking-tight mb-4 text-left">
              Hearts
            </h2>

            <div className="flex flex-col border-y border-[#37464F] divide-y divide-[#37464F]">
              
              {/* Refill Hearts */}
              <div className={shopRowClass}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center text-3xl shrink-0 select-none transition-transform duration-[170ms] hover:scale-110">
                    ❤️
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-slate-100 text-sm font-nunito leading-tight">
                      Refill Hearts
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-1 font-nunito">
                      Get full hearts so you can worry less about making mistakes in a lesson
                    </p>
                  </div>
                </div>
                
                <button
                  disabled={heartsFull || !canRefill || refilling}
                  onClick={handleRefillHearts}
                  className={`border-2 font-extrabold rounded-2xl px-6 py-2.5 text-xs tracking-widest uppercase font-nunito shrink-0 min-h-[44px] transition ${
                    heartsFull || !canRefill
                      ? "border-[#37464F] bg-[#131F24] text-slate-500 cursor-not-allowed"
                      : "border-[#58CC02] bg-[#58CC02] text-white hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer shadow-[0_0_12px_rgba(88,204,2,0.2)]"
                  }`}
                >
                  {refilling ? "…" : heartsFull ? "FULL" : canRefill ? "REFILL" : "10 💎"}
                </button>
              </div>
              {refillMessage && (
                <p className="text-xs text-slate-400 font-semibold font-nunito -mt-2 pb-2">{refillMessage}</p>
              )}

              {/* Unlimited Hearts */}
              <div className={shopRowClass}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-2xl font-bold border border-teal-300/40 shadow-sm shrink-0">
                    ♾️
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-slate-100 text-sm font-nunito leading-tight">
                      Unlimited Hearts
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-1 font-nunito">
                      Never run out of hearts with Super!
                    </p>
                  </div>
                </div>

                <Link href="/super">
                  <button className="border-2 border-[#37464F] hover:bg-[#1F2E35] hover:border-slate-500 hover:-translate-y-0.5 active:scale-[0.98] text-purple-400 font-extrabold rounded-2xl px-6 py-2.5 text-xs tracking-widest uppercase transition duration-[170ms] cursor-pointer font-nunito shrink-0 min-h-[44px]">
                    FREE TRIAL
                  </button>
                </Link>
              </div>

            </div>

            {/* 3. Power-Ups Section */}
            <h2 className="text-xl font-extrabold text-slate-100 font-nunito tracking-tight mt-8 mb-4 text-left">
              Power-Ups
            </h2>

            <div className={`border-y border-[#37464F] ${shopRowClass}`}>
              <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center text-3xl shrink-0 select-none">
                  🧊
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-extrabold text-slate-100 text-sm font-nunito leading-tight">
                      Streak Freeze
                    </h3>
                    <span className="bg-[#202F36] text-slate-400 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-[#37464F] tracking-wider font-nunito">
                      0 / 2 EQUIPPED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-1 font-nunito">
                    Streak Freeze allows your streak to remain in place for one full day of inactivity.
                  </p>
                </div>
              </div>

              <button className="border-2 border-[#37464F] hover:bg-[#1F2E35] hover:border-slate-500 hover:-translate-y-0.5 active:scale-[0.98] text-[#1CB0F6] font-extrabold rounded-2xl px-5 py-2.5 text-xs tracking-wider uppercase transition duration-[170ms] cursor-pointer font-nunito shrink-0 flex items-center gap-1.5 min-h-[44px] hover:shadow-[0_0_12px_rgba(56,189,248,0.18)]">
                <span>GET FOR:</span>
                <span className="text-sm transition-transform duration-[170ms] hover:scale-110">💎</span>
                <span>200</span>
              </button>
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

            {/* 1. Unlock Leaderboards! Card */}
            <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-5 rounded-2xl flex flex-col gap-3 text-left shadow-sm">
              <h4 className="font-extrabold text-slate-100 text-sm font-nunito">
                Unlock Leaderboards!
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#202F36] border border-[#37464F] flex items-center justify-center text-slate-400 shrink-0">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <p className="text-xs text-slate-400 font-semibold leading-snug font-nunito">
                  Complete 3 more lessons to start competing
                </p>
              </div>
            </HoverCard>
            <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-5 rounded-2xl flex flex-col gap-3 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-100 text-sm font-nunito">Daily Quests</h4>
                <Link href="/quests" className="text-xs font-extrabold text-[#1CB0F6] hover:underline uppercase tracking-wider font-nunito">
                  VIEW ALL
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-2xl text-amber-400 shrink-0 select-none">
                  ⚡
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-extrabold text-slate-100 text-xs font-nunito">
                    Earn 10 XP
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3.5 bg-[#202F36] rounded-full border border-[#37464F] relative overflow-hidden flex items-center">
                      <div className="h-full bg-[#FF9600] w-0 rounded-full" />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-300 font-nunito">
                        0 / 10
                      </span>
                    </div>
                    <span className="text-base leading-none shrink-0 select-none">
                      📦
                    </span>
                  </div>
                </div>
              </div>
            </HoverCard>

            {/* 3. Using an ad blocker? Gradient Card */}
            <HoverCard className="bg-gradient-to-b from-[#16424D] via-[#1B294A] to-[#3B194E] border-2 border-[#37464F] rounded-2xl p-6 flex flex-col gap-4 text-center items-center shadow-sm">
              <AdBlockerOwlGraphic />

              <div className="flex flex-col gap-1.5">
                <h4 className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                  Using an ad blocker?
                </h4>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed px-1 font-nunito">
                  Support education with Super Duolingo and we'll remove ads for you.
                </p>
              </div>

              <Link href="/super">
                <button className="bg-white hover:bg-slate-100 hover:-translate-y-0.5 active:scale-[0.98] text-[#131F24] font-black rounded-2xl py-3.5 w-full text-xs tracking-widest uppercase transition duration-[170ms] shadow-md font-nunito cursor-pointer min-h-[44px]">
                  TRY SUPER FOR FREE
                </button>
              </Link>

              <button className="text-[#1CB0F6] hover:underline font-extrabold text-xs tracking-widest uppercase font-nunito cursor-pointer">
                DISABLE AD BLOCKER
              </button>
            </HoverCard>
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

