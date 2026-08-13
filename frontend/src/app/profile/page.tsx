"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UserProgress from "@/components/UserProgress";
import Link from "next/link";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import { getLanguageName } from "@/lib/languages";
import { Pencil, ChevronRight, RefreshCw } from "lucide-react";
import DuoButton from "@/components/DuoButton";
import { HoverCard, InteractivePressable } from "@/components/interactions";
import LanguageFlag from "@/components/LanguageFlag";

// Header Avatar Silhouette Graphic with plus icon
const AvatarSilhouetteGraphic = () => (
  <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-[#1CB0F6] bg-[#202F36] flex items-center justify-center shrink-0">
    <svg className="w-16 h-16 text-[#1CB0F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m-3-3h6" strokeWidth="2" />
    </svg>
  </div>
);

// Friends Group Illustration for Right Rail Card
const FriendsGroupGraphic = () => (
  <div className="w-full h-24 relative flex items-center justify-center shrink-0 select-none my-1">
    <svg className="w-full h-full drop-shadow-md" viewBox="0 0 200 90">
      {/* Pink figure */}
      <circle cx="30" cy="50" r="14" fill="#FF85A2" />
      <circle cx="26" cy="46" r="2.5" fill="white" />
      <circle cx="34" cy="46" r="2.5" fill="white" />

      {/* Purple figure */}
      <circle cx="52" cy="58" r="13" fill="#A55EEA" />

      {/* Orange figure */}
      <circle cx="76" cy="46" r="15" fill="#FF9600" />
      <circle cx="72" cy="42" r="2.5" fill="white" />
      <circle cx="80" cy="42" r="2.5" fill="white" />

      {/* Center Turban Leader figure */}
      <circle cx="106" cy="38" r="18" fill="#FF4B4B" />
      <circle cx="100" cy="34" r="3" fill="white" />
      <circle cx="112" cy="34" r="3" fill="white" />

      {/* Green figure */}
      <circle cx="136" cy="54" r="14" fill="#58CC02" />

      {/* Yellow figure */}
      <circle cx="162" cy="46" r="15" fill="#FFC800" />
      <circle cx="158" cy="42" r="2.5" fill="white" />
      <circle cx="166" cy="42" r="2.5" fill="white" />
    </svg>
  </div>
);

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("es");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"following" | "followers">("following");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, courses] = await Promise.all([
        api.getUserProfile("me"),
        api.getCourses(),
      ]);
      setProfile(profileData);
      if (profileData.active_course_id) {
        const course = courses.find((c) => c.id === profileData.active_course_id);
        if (course) {
          setActiveCourseCode(course.target_language ?? course.language_code ?? "es");
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load user profile. Make sure the backend is running.");
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
        <p className="text-slate-400 font-bold mt-4 font-nunito">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131F24] px-4 text-center space-y-4">
        <div className="text-5xl">👤</div>
        <h1 className="text-2xl font-extrabold text-slate-200">Connection Issue</h1>
        <p className="text-muted-text max-w-md font-semibold text-sm leading-relaxed">
          {error || "Could not load user profile."}
        </p>
        <DuoButton variant="primary" onClick={loadData}>
          <RefreshCw className="w-5 h-5 mr-2" /> Retry Connection
        </DuoButton>
      </div>
    );
  }

  const { stats, achievements } = profile;

  const joinDate = new Date(profile.join_date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

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
          
          {/* Main Feed: Header, Stats, Achievements */}
          <main className="flex-1 max-w-[560px] w-full mx-auto flex flex-col min-w-0">
            
            {/* 1. Header User Card Banner */}
            <HoverCard interactive className="border-2 border-[#37464F] bg-[#1F2E35] rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center relative shadow-sm mb-6 select-none group">
              
              {/* Top right pencil edit icon */}
              <button className="w-8 h-8 rounded-xl bg-[#202F36] border border-[#37464F] flex items-center justify-center text-slate-300 hover:bg-[#2A3B43] hover:border-[#4E606A] hover:-translate-y-0.5 transition-all duration-[170ms] cursor-pointer absolute top-4 right-4 opacity-80 group-hover:opacity-100">
                <Pencil className="w-4 h-4 text-slate-300" />
              </button>

              {/* Avatar Silhouette */}
              <InteractivePressable className="rounded-full">
                <AvatarSilhouetteGraphic />
              </InteractivePressable>

              {/* User details */}
              <div className="mt-4 flex flex-col items-center w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col text-left">
                    <h1 className="text-2xl font-extrabold text-slate-100 font-nunito leading-tight">
                      {profile.display_name}
                    </h1>
                    <span className="text-xs font-semibold text-slate-400 font-nunito mt-0.5">
                      {profile.username}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-nunito mt-1">
                      Joined {joinDate}
                    </span>
                    <p className="text-xs font-semibold text-slate-500 font-nunito mt-1">
                      {profile.course_progress_summary}
                    </p>
                    {(profile.native_language || profile.learning_language) && (
                      <div className="mt-2 text-left w-full space-y-1">
                        <p className="text-xs font-semibold text-slate-400 font-nunito">
                          Native:{" "}
                          <span className="text-slate-200">
                            {getLanguageName(profile.native_language ?? "en")}
                          </span>
                          {" · "}
                          Learning:{" "}
                          <span className="text-slate-200">
                            {getLanguageName(profile.learning_language ?? profile.selected_language)}
                          </span>
                        </p>
                        {profile.current_unit_title && (
                          <p className="text-xs font-semibold text-slate-500 font-nunito">
                            {profile.current_unit_title}
                            {profile.current_skill_title ? ` · ${profile.current_skill_title}` : ""}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs font-extrabold text-[#1CB0F6] mt-2 font-nunito">
                      <span className="hover:underline cursor-pointer">0 Following</span>
                      <span className="hover:underline cursor-pointer">0 Followers</span>
                    </div>
                  </div>

                  <LanguageFlag code={activeCourseCode} size="lg" />
                </div>
              </div>

            </HoverCard>
            <h2 className="text-xl font-extrabold text-slate-100 font-nunito tracking-tight mb-4 text-left">
              Statistics
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              
              {/* Day Streak */}
              <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-4 rounded-2xl flex items-center gap-3 text-left shadow-sm hover:border-[#4E606A]">
                <div className="text-2xl text-slate-500 shrink-0 select-none">
                  🔥
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                    {stats.current_streak}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold font-nunito">
                    Day streak
                  </span>
                </div>
              </HoverCard>

              {/* Total XP */}
              <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-4 rounded-2xl flex items-center gap-3 text-left shadow-sm hover:border-[#4E606A]">
                <div className="text-2xl text-amber-400 shrink-0 select-none">
                  ⚡
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                    {stats.total_xp}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold font-nunito">
                    Total XP
                  </span>
                </div>
              </HoverCard>

              {/* Longest Streak */}
              <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-4 rounded-2xl flex items-center gap-3 text-left shadow-sm hover:border-[#4E606A]">
                <div className="text-2xl text-orange-400 shrink-0 select-none">
                  🏆
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                    {stats.longest_streak}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold font-nunito">
                    Longest streak
                  </span>
                </div>
              </HoverCard>

              {/* Current League */}
              <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-4 rounded-2xl flex items-center gap-3 text-left shadow-sm hover:border-[#4E606A]">
                <div className="text-2xl text-slate-500 shrink-0 select-none">
                  🛡️
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                    None
                  </span>
                  <span className="text-xs text-slate-400 font-semibold font-nunito">
                    Current league
                  </span>
                </div>
              </HoverCard>

              {/* Top 3 Finishes */}
              <HoverCard className="border-2 border-[#37464F] bg-[#131F24] p-4 rounded-2xl flex items-center gap-3 text-left shadow-sm hover:border-[#4E606A]">
                <div className="text-2xl text-slate-500 shrink-0 select-none">
                  🏅
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-100 text-base font-nunito leading-tight">
                    0
                  </span>
                  <span className="text-xs text-slate-400 font-semibold font-nunito">
                    Top 3 finishes
                  </span>
                </div>
              </HoverCard>

            </div>

            {/* 3. Achievements Section */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-slate-100 font-nunito tracking-tight text-left">
                Achievements
              </h2>
              <button className="text-xs font-extrabold text-[#1CB0F6] hover:underline uppercase tracking-wider font-nunito cursor-pointer">
                VIEW ALL
              </button>
            </div>

            <div className="border-2 border-[#37464F] bg-[#131F24] rounded-2xl divide-y divide-[#37464F] overflow-hidden text-left shadow-sm">
              {achievements.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 font-semibold text-center">
                  No achievements available yet.
                </p>
              ) : (
                achievements.map((achievement) => (
                  <InteractivePressable
                    key={achievement.id}
                    className={`p-4 flex items-center gap-4 ${
                      achievement.unlocked ? "bg-[#1CB0F6]/5" : ""
                    }`}
                  >
                    <div
                      className={`w-14 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm p-1 select-none ${
                        achievement.unlocked
                          ? "bg-[#58CC02] text-white"
                          : "bg-[#202F36] text-slate-500 border border-[#37464F]"
                      }`}
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      {achievement.unlocked && (
                        <span className="text-[8px] font-black uppercase tracking-wider mt-0.5 bg-black/20 px-1 py-0.5 rounded">
                          Unlocked
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-100 text-sm font-nunito">
                          {achievement.title}
                        </h3>
                        {achievement.unlocked && achievement.unlocked_at && (
                          <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">
                            ✓ Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-semibold font-nunito">
                        {achievement.description}
                      </p>
                    </div>
                  </InteractivePressable>
                ))
              )}
            </div>

            {unlockedAchievements.length > 0 && (
              <p className="text-xs text-slate-500 font-semibold mt-3 text-left">
                {unlockedAchievements.length} of {achievements.length} achievements unlocked
                {lockedAchievements.length > 0 &&
                  ` · ${lockedAchievements.length} remaining`}
              </p>
            )}

          </main>

          {/* Right Sidebar Column */}
          <aside className="hidden lg:flex flex-col w-[350px] gap-6 shrink-0 h-fit sticky top-8">
            
            {/* Top User Progress metrics */}
            <UserProgress
              streak={stats.current_streak}
              totalXp={stats.total_xp}
              gems={stats.gems}
              hearts={stats.hearts_current}
              maxHearts={stats.hearts_max}
              dailyXpToday={stats.daily_xp_today}
              dailyXpGoal={stats.daily_xp_goal}
              isPro={false}
              showCourseSwitcher={false}
            />

            {/* 1. Friends Card Widget (FOLLOWING / FOLLOWERS Tabs) */}
            <div className="border-2 border-[#37464F] bg-[#131F24] p-5 rounded-2xl flex flex-col gap-4 text-center items-center shadow-sm">
              
              {/* Tab Header */}
              <div className="flex items-center w-full border-b border-[#37464F]">
                <button
                  onClick={() => setActiveTab("following")}
                  className={`flex-1 pb-2.5 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer font-nunito ${
                    activeTab === "following"
                      ? "border-b-2 border-[#1CB0F6] text-[#1CB0F6]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  FOLLOWING
                </button>
                <button
                  onClick={() => setActiveTab("followers")}
                  className={`flex-1 pb-2.5 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer font-nunito ${
                    activeTab === "followers"
                      ? "border-b-2 border-[#1CB0F6] text-[#1CB0F6]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  FOLLOWERS
                </button>
              </div>

              {/* Graphic & Text */}
              <FriendsGroupGraphic />

              <p className="text-xs text-slate-400 font-semibold leading-relaxed px-1 font-nunito">
                Learning is more fun and effective when you connect with others.
              </p>

            </div>

            {/* 2. Add Friends Card Widget */}
            <div className="border-2 border-[#37464F] bg-[#131F24] p-5 rounded-2xl flex flex-col gap-3 text-left shadow-sm">
              <h4 className="font-extrabold text-slate-100 text-sm font-nunito">
                Add friends
              </h4>

              <div className="flex flex-col divide-y divide-[#37464F]">
                <div className="py-2.5 flex items-center justify-between hover:bg-[#1F2E35] px-2 rounded-xl transition cursor-pointer">
                  <div className="flex items-center gap-3 text-xs font-extrabold text-slate-200 font-nunito">
                    <span className="text-base">🔍</span>
                    <span>Find friends</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="py-2.5 flex items-center justify-between hover:bg-[#1F2E35] px-2 rounded-xl transition cursor-pointer">
                  <div className="flex items-center gap-3 text-xs font-extrabold text-slate-200 font-nunito">
                    <span className="text-base">✉️</span>
                    <span>Invite friends</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
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

