"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserProgress from "@/components/UserProgress";
import DuoButton from "@/components/DuoButton";
import { api } from "@/lib/api";
import { UserStats } from "@/lib/types";
import { Volume2, RefreshCw } from "lucide-react";

export default function SoundsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
        <p className="text-slate-400 font-bold mt-4 font-nunito">Loading sounds...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <div className="text-5xl">🔊</div>
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
    <div className="flex min-h-screen bg-[#131F24] text-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-[256px]">
        <div className="h-[50px] lg:hidden w-full" />
        <div className="max-w-[1056px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-8">
          <main className="flex-1 max-w-[600px] w-full mx-auto flex items-center justify-center pt-10">
            <div className="border-2 border-light-border rounded-3xl p-8 text-center space-y-6 shadow-sm bg-dark-card-bg max-w-md flex flex-col items-center select-none">
              
              <div className="w-20 h-20 flex items-center justify-center text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                <Volume2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-nunito leading-tight">
                  Audio & Sounds
                </h1>
                <p className="text-slate-400 font-semibold text-sm leading-relaxed">
                  Listen to Spanish pronunciation guides, music tracks, and voice actors coming soon to Duolingo!
                </p>
              </div>

              <DuoButton variant="primary" className="px-6" onClick={() => window.history.back()}>
                Go Back
              </DuoButton>

            </div>
          </main>
          <aside className="hidden lg:flex flex-col w-[368px] gap-6 shrink-0 h-fit sticky top-6">
            <UserProgress
              showCourseSwitcher={false}
              streak={stats.current_streak}
              gems={stats.gems}
              hearts={stats.hearts_current}
              isPro={false}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
