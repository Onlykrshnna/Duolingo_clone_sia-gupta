"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import CourseSwitcher from "./CourseSwitcher";
import { HoverStat } from "@/components/interactions";
import { Flame, Heart, Shield, Target } from "lucide-react";

interface UserProgressProps {
  streak: number;
  gems: number;
  hearts: number;
  maxHearts?: number;
  totalXp?: number;
  dailyXpToday?: number;
  dailyXpGoal?: number;
  isPro?: boolean;
  onAddCourse?: () => void;
  showCourseSwitcher?: boolean;
  compact?: boolean;
}

function formatRegenTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const UserProgress: React.FC<UserProgressProps> = ({
  streak,
  gems,
  hearts,
  maxHearts,
  totalXp,
  dailyXpToday,
  dailyXpGoal,
  isPro = false,
  onAddCourse,
  showCourseSwitcher = true,
  compact = false,
}) => {
  const [regenSeconds, setRegenSeconds] = useState<number | null>(null);
  const [displayHearts, setDisplayHearts] = useState(hearts);

  useEffect(() => {
    setDisplayHearts(hearts);
  }, [hearts]);

  useEffect(() => {
    if (isPro || displayHearts >= (maxHearts ?? 5)) {
      setRegenSeconds(null);
      return;
    }

    let cancelled = false;

    const pollRegen = async () => {
      try {
        const status = await api.getHeartsRegenStatus("me");
        if (cancelled) return;
        setDisplayHearts(status.hearts_current);
        setRegenSeconds(status.time_left_seconds);
      } catch (err) {
        console.error("Failed to fetch heart regen status:", err);
      }
    };

    pollRegen();
    const interval = setInterval(pollRegen, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [displayHearts, maxHearts, isPro]);

  const dailyGoal = dailyXpGoal ?? 20;
  const dailyToday = dailyXpToday ?? 0;
  const dailyPercent = Math.min(100, Math.round((dailyToday / dailyGoal) * 100));
  const showDailyGoal = dailyXpToday !== undefined && dailyXpGoal !== undefined;
  const textSize = compact ? "text-sm" : "text-[15px]";

  return (
    <div className="flex flex-col gap-2 w-full select-none font-nunito">
      <div className="flex items-center justify-between gap-2">
        {showCourseSwitcher && onAddCourse ? (
          <CourseSwitcher onAddCourse={onAddCourse} compact={compact} />
        ) : (
          <Link href="/" className="block">
            <HoverStat accent="language" className="p-2">
              <span className="text-xl">🦉</span>
            </HoverStat>
          </Link>
        )}

        <HoverStat accent="streak">
          <Flame className="w-[22px] h-[22px] text-brand-orange fill-current" />
          <span className={`font-extrabold text-brand-orange tracking-tight ${textSize}`}>
            {streak}
          </span>
        </HoverStat>

        {showDailyGoal && (
          <HoverStat accent="goal" title={`Daily goal: ${dailyToday}/${dailyGoal} XP`}>
            <div className="relative w-[22px] h-[22px] shrink-0">
              <svg className="w-[22px] h-[22px] -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#202F36" strokeWidth="3" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="#58CC02"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(dailyPercent / 100) * 62.83} 62.83`}
                />
              </svg>
              <Target className="w-2.5 h-2.5 text-brand-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className={`font-extrabold text-brand-green tracking-tight ${textSize}`}>
              {dailyToday}/{dailyGoal}
            </span>
          </HoverStat>
        )}

        {totalXp !== undefined && (
          <HoverStat accent="xp">
            <span className="text-[18px] leading-none">⚡</span>
            <span className={`font-extrabold text-[#FFC800] tracking-tight ${textSize}`}>
              {totalXp}
            </span>
          </HoverStat>
        )}

        <HoverStat accent="gems">
          <svg className="w-[22px] h-[22px] text-sky-400 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 9l10 13 10-13L12 2z" />
          </svg>
          <span className={`font-extrabold text-sky-blue tracking-tight ${textSize}`}>
            {gems}
          </span>
        </HoverStat>

        <div className="flex flex-col items-center">
          <HoverStat accent="hearts">
            {isPro ? (
              <>
                <Shield className="w-[22px] h-[22px] text-brand-indigo fill-current" />
                <span className={`font-extrabold text-brand-indigo tracking-tight ${textSize}`}>
                  ∞
                </span>
              </>
            ) : (
              <>
                <Heart className="w-[22px] h-[22px] text-rose-red fill-current" />
                <span className={`font-extrabold text-rose-red tracking-tight ${textSize}`}>
                  {maxHearts ? `${displayHearts}/${maxHearts}` : displayHearts}
                </span>
              </>
            )}
          </HoverStat>
          {!isPro &&
            displayHearts < (maxHearts ?? 5) &&
            regenSeconds !== null &&
            regenSeconds > 0 && (
              <span className="text-[10px] font-bold text-[#8E9FA8] leading-none -mt-0.5">
                +1 in {formatRegenTime(regenSeconds)}
              </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProgress;
