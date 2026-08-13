"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPathNodeSide, getPathNodeStyle } from "@/lib/pathLayout";
import PathMascot from "./PathMascot";

const PathStarIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const PathCardIcon = () => (
  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
  </svg>
);

const PathHeadphonesIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h3v-8H5v-2a7 7 0 0 1 14 0v2h-4v8h3a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z" />
  </svg>
);

const PathDumbbellIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M20.57 14.86L22 13.43V10.57L20.57 9.14L19.14 10.57H17.57V6.43h1.57l1.43 1.43V4.99l-1.43-1.43l-2.86 2.86l-4.28-4.29l-2.86 2.86L10 6.43H8.43V10.57H6.86L5.43 9.14L4 10.57v2.86l1.43 1.43l1.43-1.43h1.57v4.14H6.86l-1.43-1.43L4 17.57v2.86l1.43 1.43l2.86-2.86l4.28 4.28l2.86-2.86L14 17.57h1.57V13.43h1.57l1.43 1.43l1.43-1.43z" />
  </svg>
);

const PathTrophyIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.67 4.41 4.94C8.4 14.42 10 15.74 12 15.93V19H9v2h6v-2h-3v-3.07c2-.19 3.6-1.51 4.59-2.99C19.08 12.67 21 10.55 21 8V7c0-1.1-.9-2-2-2zm-12 5c-1.1 0-2-.9-2-2V7h2v3zm12-2c0 1.1-.9 2-2 2v-3h2v1z" />
  </svg>
);

const PathChestIcon = () => (
  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M20 6H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 9h-4v-2h4v2zm6-7v2H4V8h16z" />
  </svg>
);

const PathLockIcon = () => (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden>
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
);

interface LessonButtonProps {
  id: string;
  index: number;
  title: string;
  status: "locked" | "available" | "in_progress" | "completed";
  lessonsCompleted: number;
  lessonsPerLevel: number;
  currentLevel: number;
  nextLessonId?: string | null;
  type?: "star" | "headphones" | "dumbbell" | "trophy" | "chest" | "card";
  isCurrentLesson?: boolean;
}

export const LessonButton: React.FC<LessonButtonProps> = ({
  index,
  title,
  status,
  lessonsCompleted,
  lessonsPerLevel,
  currentLevel,
  nextLessonId,
  type = "star",
  isCurrentLesson = false,
}) => {
  const nodeSide = getPathNodeSide(index);
  const nodeStyle = getPathNodeStyle(index);

  const isLocked = status === "locked";
  const isActive = status === "in_progress" || status === "available";
  const isCompleted = status === "completed";
  const showStartBadge = isCurrentLesson && isActive && !isCompleted;

  const completionPercentage =
    isCompleted
      ? 1
      : status === "in_progress" && lessonsPerLevel > 0
        ? Math.min(1, lessonsCompleted / lessonsPerLevel)
        : 0;

  const circleRadius = 36;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference * (1 - completionPercentage);
  const showProgressRing = isCompleted || (!isLocked && status === "in_progress" && completionPercentage > 0);
  const ringColor = isCompleted ? "#58CC02" : isActive ? "#58CC02" : "#37464F";

  const renderIcon = () => {
    if (isLocked) return <PathLockIcon />;
    switch (type) {
      case "card":
        return <PathCardIcon />;
      case "headphones":
        return <PathHeadphonesIcon />;
      case "dumbbell":
        return <PathDumbbellIcon />;
      case "trophy":
        return <PathTrophyIcon />;
      case "chest":
        return <PathChestIcon />;
      default:
        return <PathStarIcon />;
    }
  };

  const getTypeColors = () => {
    if (isLocked) {
      return {
        btnClass:
          "bg-[#202F36] border-[#37464F] text-[#4E606A] border-b-[8px] opacity-80 cursor-not-allowed shadow-[0_4px_0_#131F24]",
        glow: false,
      };
    }
    if (isCompleted) {
      return {
        btnClass:
          "bg-[#58CC02] border-[#46a302] text-white border-b-[8px] hover:bg-[#61e002] active:border-b-[2px] active:translate-y-[6px] shadow-[0_4px_0_#3d8a02,0_8px_20px_rgba(88,204,2,0.35)]",
        glow: true,
      };
    }
    switch (type) {
      case "card":
      case "chest":
        return {
          btnClass:
            "bg-[#202F36] border-[#37464F] text-slate-300 border-b-[8px] hover:bg-[#2A3B43] active:border-b-[2px] active:translate-y-[6px] shadow-[0_4px_0_#131F24]",
          glow: false,
        };
      default:
        return {
          btnClass:
            "bg-[#58cc02] border-[#46a302] text-white border-b-[8px] hover:bg-[#61e002] active:border-b-[2px] active:translate-y-[6px] shadow-[0_4px_0_#3d8a02,0_8px_20px_rgba(88,204,2,0.28)]",
          glow: isCurrentLesson && isActive,
        };
    }
  };

  const { btnClass, glow } = getTypeColors();
  const canNavigate = !isLocked && !!nextLessonId;
  const lessonHref = canNavigate
    ? isCompleted
      ? `/lesson/${nextLessonId}?practice=true`
      : `/lesson/${nextLessonId}`
    : undefined;

  const mascotPosition =
    nodeSide === "right"
      ? "-left-[clamp(4.5rem,12vw,5.5rem)]"
      : "-right-[clamp(4.5rem,12vw,5.5rem)]";

  const startBadgePosition =
    nodeSide === "right"
      ? "right-[clamp(4.25rem,11vw,5.25rem)]"
      : "left-[clamp(4.25rem,11vw,5.25rem)]";

  return (
    <motion.div
      style={nodeStyle}
      className="relative flex items-center justify-center select-none z-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
    >
      {isCurrentLesson && !isLocked && (
        <PathMascot size={68} className={`absolute top-1/2 -translate-y-1/2 z-30 ${mascotPosition}`} />
      )}

      {isCompleted && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#FF9600] text-white font-extrabold px-3 py-1 rounded-xl text-[10px] uppercase tracking-[0.12em] shadow-[0_2px_0_#C56E00] z-20"
        >
          PRACTICE
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#FF9600]" />
        </motion.div>
      )}

      {showStartBadge && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-1/2 -translate-y-1/2 bg-[#58CC02] text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-[0.12em] z-20 shadow-[0_2px_0_#3d8a02] flex items-center whitespace-nowrap ${startBadgePosition}`}
        >
          START
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ${
              nodeSide === "right"
                ? "right-[-6px] border-l-[6px] border-l-[#58CC02]"
                : "left-[-6px] border-r-[6px] border-r-[#58CC02]"
            }`}
          />
        </motion.div>
      )}

      {glow && (
        <div className="absolute w-[86px] h-[86px] rounded-full bg-[#58CC02]/35 blur-lg animate-path-glow pointer-events-none" />
      )}

      {showProgressRing && (
        <svg
          className="absolute w-[86px] h-[86px] -rotate-90 pointer-events-none"
          viewBox="0 0 86 86"
          aria-hidden
        >
          <circle
            cx={43}
            cy={43}
            r={circleRadius}
            stroke="#202F36"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={43}
            cy={43}
            r={circleRadius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={isCompleted ? 0 : strokeOffset}
            strokeLinecap="round"
            className={isCompleted ? "drop-shadow-[0_0_6px_rgba(88,204,2,0.6)]" : undefined}
          />
        </svg>
      )}

      {currentLevel > 0 && (
        <div className="absolute -bottom-1 -right-1 bg-[#FFC800] text-[#7A4B00] border-2 border-[#E5A000] font-black text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md z-30 font-nunito">
          👑 {currentLevel}
        </div>
      )}

      <motion.div
        role={canNavigate ? undefined : undefined}
        tabIndex={canNavigate ? undefined : undefined}
        whileHover={canNavigate ? { scale: 1.06, y: -2 } : undefined}
        whileTap={canNavigate ? { scale: 0.94, y: 4 } : undefined}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className={`w-[70px] h-[70px] rounded-full flex items-center justify-center outline-none ${btnClass} ${
          isLocked ? "cursor-not-allowed" : canNavigate ? "cursor-pointer" : "cursor-default"
        }`}
        title={title}
      >
        {canNavigate && lessonHref ? (
          <Link href={lessonHref} className="w-full h-full flex items-center justify-center" aria-label={title}>
            {renderIcon()}
          </Link>
        ) : (
          renderIcon()
        )}
      </motion.div>
    </motion.div>
  );
};

export default LessonButton;
