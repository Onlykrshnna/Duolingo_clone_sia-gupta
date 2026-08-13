"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Heart, Target, Gem } from "lucide-react";
import DuoButton from "../DuoButton";
import Mascot from "../Mascot";
import { CompleteResponse } from "@/lib/types";
import { api } from "@/lib/api";
import { celebrateLessonComplete } from "@/lib/gamificationToasts";
import { sideCannons, burstConfetti, fireworks } from "@/lib/confettiUtils";
import { playSound } from "@/lib/sounds";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useCelebrationStore } from "@/store/useCelebrationStore";

interface LessonCompleteModalProps {
  summary: CompleteResponse;
  previousStreak?: number;
  accuracy?: number;
  wordsLearned?: string[];
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 24;
    const step = value / totalFrames;
    const interval = setInterval(() => {
      frame += 1;
      setDisplay(Math.min(value, Math.round(step * frame)));
      if (frame >= totalFrames) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

export const LessonCompleteModal: React.FC<LessonCompleteModalProps> = ({
  summary,
  previousStreak = 0,
  accuracy = 1,
  wordsLearned = [],
}) => {
  const showCelebration = useCelebrationStore((s) => s.show);
  const streakIncreased = summary.current_streak > previousStreak;
  const accuracyPercent = Math.round(accuracy * 100);
  const gemsEarned = summary.gems_earned ?? 0;
  const dailyGoalMet = summary.daily_xp_today >= summary.daily_xp_goal;
  const perfectLesson = summary.hearts_lost === 0;
  const dailyPercent = Math.min(
    100,
    Math.round((summary.daily_xp_today / summary.daily_xp_goal) * 100)
  );

  useEffect(() => {
    playSound("lessonComplete");
    playSound("modalOpen");
    sideCannons(2500);
    setTimeout(() => burstConfetti("large"), 200);

    if (perfectLesson) {
      setTimeout(() => fireworks(2000), 400);
    }

    celebrateLessonComplete(summary, previousStreak, () => api.getUserAchievements("me"));

    if (streakIncreased) {
      setTimeout(() => {
        showCelebration({
          kind: "streak",
          title: "Streak increased!",
          subtitle: `Day ${summary.current_streak} complete! Keep the flame alive.`,
          icon: "🔥",
          streak: summary.current_streak,
        });
      }, 1200);
    }

    if (dailyGoalMet) {
      setTimeout(() => {
        showCelebration({
          kind: "dailyGoal",
          title: "Daily goal complete!",
          subtitle: `You earned ${summary.daily_xp_today} XP today.`,
          icon: "✅",
        });
      }, streakIncreased ? 2800 : 1200);
    }

    if (perfectLesson && summary.xp_earned >= 20) {
      setTimeout(() => {
        showCelebration({
          kind: "courseComplete",
          title: "Perfect lesson!",
          subtitle: "Flawless run — no hearts lost!",
          icon: "🏆",
          xp: summary.xp_earned,
        });
      }, 3500);
    }
  }, [summary, previousStreak, streakIncreased, dailyGoalMet, perfectLesson, showCelebration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#131F24] z-50 flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full space-y-6 flex flex-col items-center"
      >
        <motion.div variants={staggerItem}>
          <Mascot size={120} mood="celebrate" showBubble={false} />
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-nunito leading-tight">
            Lesson Complete!
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">
            Awesome job! You reached the finish line.
          </p>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4 w-full">
          <div className="border-2 border-[#37464F] bg-[#1F2E35] rounded-2xl p-4 flex flex-col items-center space-y-1">
            <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">
              XP Earned
            </span>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
              className="flex items-center gap-1.5 text-brand-orange font-extrabold text-2xl font-nunito"
            >
              <Zap className="w-6 h-6 fill-current" />
              <span>+<AnimatedCounter value={summary.xp_earned} /></span>
            </motion.div>
          </div>

          <div className="border-2 border-[#37464F] bg-[#1F2E35] rounded-2xl p-4 flex flex-col items-center space-y-1">
            <span className="text-xs font-extrabold text-brand-green uppercase tracking-wider">
              Accuracy
            </span>
            <div className="flex items-center gap-1.5 text-brand-green font-extrabold text-2xl font-nunito">
              <Target className="w-6 h-6" />
              <span>{accuracyPercent}%</span>
            </div>
          </div>

          <div className="border-2 border-[#37464F] bg-[#1F2E35] rounded-2xl p-4 flex flex-col items-center space-y-1">
            <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">
              Gems
            </span>
            <div className="flex items-center gap-1.5 text-sky-400 font-extrabold text-2xl font-nunito">
              <Gem className="w-6 h-6 fill-current" />
              <span>+{gemsEarned}</span>
            </div>
          </div>

          <div className="border-2 border-[#37464F] bg-[#1F2E35] rounded-2xl p-4 flex flex-col items-center space-y-1">
            <span className="text-xs font-extrabold text-rose-red uppercase tracking-wider">
              Hearts Lost
            </span>
            <div className="flex items-center gap-1.5 text-rose-red font-extrabold text-2xl font-nunito">
              <Heart className="w-6 h-6 fill-current" />
              <span>-{summary.hearts_lost}</span>
            </div>
          </div>
        </motion.div>

        {wordsLearned.length > 0 && (
          <motion.div
            variants={staggerItem}
            className="border-2 border-[#37464F] bg-[#1F2E35] w-full p-4 rounded-2xl space-y-3 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-100 text-sm">Words learned</span>
              <span className="font-extrabold text-brand-green text-sm">{wordsLearned.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {wordsLearned.map((word) => (
                <span
                  key={word}
                  className="px-3 py-1 rounded-full bg-[#202F36] border border-[#37464F] text-xs font-bold text-slate-200"
                >
                  {word}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          variants={staggerItem}
          className="border-2 border-[#37464F] bg-[#1F2E35] w-full p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3 text-left">
            <motion.span
              animate={streakIncreased ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : undefined}
              transition={{ duration: 0.6, repeat: streakIncreased ? 2 : 0 }}
              className="text-3xl"
            >
              🔥
            </motion.span>
            <div>
              <h4 className="font-extrabold text-slate-100 text-sm sm:text-base leading-tight">
                {streakIncreased ? "Streak increased!" : "Streak updated"}
              </h4>
              <p className="text-xs font-bold text-slate-400">Keep learning every day!</p>
            </div>
          </div>
          <span className="font-extrabold text-brand-orange text-xl sm:text-2xl">
            <AnimatedCounter value={summary.current_streak} />{" "}
            {summary.current_streak === 1 ? "Day" : "Days"}
          </span>
        </motion.div>

        <motion.div variants={staggerItem} className="border-2 border-[#37464F] bg-[#1F2E35] w-full p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-green" />
              <span className="font-extrabold text-slate-100 text-sm">Daily goal</span>
            </div>
            <span className="font-extrabold text-brand-green text-sm">
              {summary.daily_xp_today}/{summary.daily_xp_goal} XP
            </span>
          </div>
          <div className="h-3 bg-[#202F36] rounded-full overflow-hidden border border-[#37464F]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className={`h-full rounded-full ${dailyGoalMet ? "bg-brand-green" : "bg-brand-orange"}`}
            />
          </div>
          {dailyGoalMet && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-brand-green"
            >
              Daily goal reached! 🎉
            </motion.p>
          )}
        </motion.div>

        <motion.div variants={staggerItem} className="w-full pt-2">
          <Link href="/" className="block w-full">
            <DuoButton variant="primary" className="w-full py-4 text-base">
              Continue
            </DuoButton>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LessonCompleteModal;
