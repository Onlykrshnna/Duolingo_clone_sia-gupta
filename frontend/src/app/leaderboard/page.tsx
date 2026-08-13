"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { LeaderboardEntry, UserStats } from "@/lib/types";
import { RefreshCw } from "lucide-react";
import DuoButton from "@/components/DuoButton";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { hoverLift, interactionEase } from "@/lib/interactions";
import { HoverCard } from "@/components/interactions";

const ShieldsIllustration = () => (
  <div className="relative w-56 h-36 flex items-center justify-center my-2 select-none">
    <div className="absolute top-1 left-8 text-amber-300 animate-pulse text-xl">✦</div>
    <div className="absolute top-3 right-10 text-amber-300 animate-pulse text-sm">✦</div>
    <div className="absolute -top-2 right-20 text-amber-200 animate-bounce text-sm">✨</div>
    <div className="absolute bottom-4 left-6 text-amber-200 text-xs">✦</div>
    <div className="absolute left-6 top-5 -rotate-[14deg] transform">
      <svg className="w-16 h-20 drop-shadow-md" viewBox="0 0 64 76">
        <path d="M32 0 L64 12 V38 C64 58 32 76 32 76 C32 76 0 58 0 38 V12 Z" fill="#C87D55" stroke="#965225" strokeWidth="3.5" />
      </svg>
    </div>
    <div className="absolute right-6 top-5 rotate-[14deg] transform">
      <svg className="w-16 h-20 drop-shadow-md" viewBox="0 0 64 76">
        <path d="M32 0 L64 12 V38 C64 58 32 76 32 76 C32 76 0 58 0 38 V12 Z" fill="#AFBFC6" stroke="#7A8F99" strokeWidth="3.5" />
      </svg>
    </div>
    <div className="relative z-10 -top-1 transform drop-shadow-2xl">
      <svg className="w-20 h-24" viewBox="0 0 64 76">
        <path d="M32 0 L64 12 V38 C64 58 32 76 32 76 C32 76 0 58 0 38 V12 Z" fill="#FFC800" stroke="#E5A000" strokeWidth="4" />
      </svg>
    </div>
  </div>
);

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [board, userStats] = await Promise.all([
        api.getLeaderboard(),
        api.getUserStats("me"),
      ]);
      setLeaderboard(board);
      setStats(userStats);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load leaderboard. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentUserId = stats?.user_id;

  return (
    <div className="flex min-h-screen bg-[#131F24] text-[#F3F4F6] max-lg:min-h-[100dvh] max-lg:overflow-x-clip">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:pl-[256px] min-w-0 max-lg:overflow-x-clip">
        <div className="h-[50px] lg:hidden w-full" />

        <div className="max-w-[1056px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-12 items-start min-w-0 max-lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <main className="flex-1 max-w-[560px] w-full mx-auto flex flex-col items-center text-center space-y-4 min-w-0">
            <ShieldsIllustration />

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-nunito tracking-tight">
              Bronze League
            </h1>
            <p className="text-sm font-bold text-slate-400 font-nunito">
              Top learners this week by XP earned
            </p>

            {loading && (
              <div className="flex flex-col items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-green" />
                <p className="text-slate-400 font-bold mt-4 text-sm">Loading rankings...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <p className="text-rose-400 font-semibold text-sm">{error}</p>
                <DuoButton variant="primary" onClick={loadData}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </DuoButton>
              </div>
            )}

            {!loading && !error && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[460px] pt-4 flex flex-col space-y-1"
              >
                {leaderboard.map((entry) => {
                  const isCurrentUser =
                    entry.user_id === currentUserId ||
                    (!entry.user_id && entry.display_name === "Duo Learner");
                  return (
                    <motion.div
                      key={entry.id}
                      variants={staggerItem}
                      layout
                      whileHover={!isCurrentUser ? hoverLift : undefined}
                      transition={interactionEase}
                      className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-[background-color,border-color,box-shadow] duration-[170ms] ${
                        isCurrentUser
                          ? "bg-[#58CC02]/10 border-2 border-brand-green/40 shadow-[0_0_20px_rgba(88,204,2,0.15)]"
                          : "hover:bg-[#1F2E35]/80 border-2 border-transparent hover:border-[#37464F]/60 hover:shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <motion.span
                          whileHover={{ scale: 1.08 }}
                          transition={interactionEase}
                          className={`font-extrabold text-sm w-6 text-center shrink-0 ${
                            entry.rank <= 3 ? "text-amber-400" : "text-slate-500"
                          }`}
                        >
                          {entry.rank}
                        </motion.span>
                        <motion.div
                          whileHover={{ scale: 1.06 }}
                          transition={interactionEase}
                          className="w-10 h-10 rounded-full bg-[#202F36] border border-[#37464F] flex items-center justify-center shrink-0 overflow-hidden"
                        >
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-lg">🦉</span>
                          )}
                        </motion.div>
                        <span
                          className={`font-extrabold text-sm truncate ${
                            isCurrentUser ? "text-brand-green" : "text-slate-200"
                          }`}
                        >
                          {entry.display_name}
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-green/80">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                      <motion.span
                        whileHover={{ scale: 1.05, filter: "brightness(1.15)" }}
                        transition={interactionEase}
                        className="font-extrabold text-sm text-amber-400 shrink-0 ml-2"
                      >
                        {entry.weekly_xp} XP
                      </motion.span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            <Link href="/" className="mt-4 inline-block">
              <button className="border-2 border-[#37464F] hover:bg-[#1F2E35] hover:border-slate-500 active:scale-95 transition-all text-[#1CB0F6] font-extrabold rounded-2xl px-10 py-3 text-xs tracking-widest uppercase font-nunito shadow-sm cursor-pointer">
                BACK TO PATH
              </button>
            </Link>
          </main>

          <aside className="hidden lg:flex flex-col w-[350px] shrink-0 h-fit sticky top-8">
            <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-6 flex flex-col gap-3 text-left shadow-sm">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest font-nunito">
                YOUR STANDING
              </span>
              {stats && (
                <>
                  <p className="text-2xl font-extrabold text-slate-100 font-nunito">
                    {leaderboard.find(
                      (e) =>
                        e.user_id === stats.user_id ||
                        (!e.user_id && e.display_name === "Duo Learner")
                    )?.rank ?? "—"}
                    <span className="text-sm text-slate-400 font-bold ml-2">place</span>
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">
                    {stats.total_xp} total XP · {stats.current_streak} day streak
                  </p>
                </>
              )}
              <p className="text-xs text-slate-400 font-semibold leading-relaxed pt-2 border-t border-[#37464F]">
                Complete lessons to earn XP and climb the weekly leaderboard.
              </p>
            </HoverCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
