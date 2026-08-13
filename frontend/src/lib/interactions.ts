import type { Transition, TargetAndTransition } from "framer-motion";

/** Duolingo-style interaction presets — GPU-friendly transforms only. */

export const INTERACTION_DURATION = 0.17;

export const interactionEase: Transition = {
  duration: INTERACTION_DURATION,
  ease: "easeOut",
};

export const interactionSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
};

export const hoverLift: TargetAndTransition = {
  y: -2,
  scale: 1.03,
};

export const tapPress: TargetAndTransition = {
  y: 1,
  scale: 0.97,
};

export const cardHover: TargetAndTransition = {
  y: -3,
  scale: 1.02,
};

export const iconHover: TargetAndTransition = {
  scale: 1.08,
  y: -1,
  rotate: 1,
};

export const sidebarHover: TargetAndTransition = {
  y: -1,
  scale: 1.02,
  x: 2,
};

export const nodeHover: TargetAndTransition = {
  y: -3,
  scale: 1.05,
};

export const nodeTap: TargetAndTransition = {
  y: 2,
  scale: 0.96,
};

export const lockedShake = {
  x: [0, -3, 3, -2, 2, 0],
};

export type GlowAccent =
  | "streak"
  | "goal"
  | "xp"
  | "gems"
  | "hearts"
  | "language"
  | "neutral";

export const GLOW_STYLES: Record<GlowAccent, string> = {
  streak: "hover:shadow-[0_0_16px_rgba(251,146,60,0.22)] hover:border-orange-400/30",
  goal: "hover:shadow-[0_0_16px_rgba(88,204,2,0.22)] hover:border-brand-green/30",
  xp: "hover:shadow-[0_0_16px_rgba(255,200,0,0.22)] hover:border-amber-400/30",
  gems: "hover:shadow-[0_0_16px_rgba(56,189,248,0.22)] hover:border-sky-400/30",
  hearts: "hover:shadow-[0_0_16px_rgba(244,63,94,0.22)] hover:border-rose-400/30",
  language: "hover:shadow-[0_0_14px_rgba(255,255,255,0.08)] hover:border-slate-400/35",
  neutral: "hover:shadow-[0_4px_14px_rgba(0,0,0,0.22)] hover:border-[#4E606A]",
};

export const STAT_BASE_CLASS =
  "flex items-center justify-center gap-1.5 min-h-[40px] min-w-[40px] px-3 rounded-xl border-2 border-[#37464F]/60 bg-[#1F2E35]/40 transition-[background-color,border-color,box-shadow] duration-[170ms] ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]";

export const CARD_BASE_CLASS =
  "border-2 border-[#37464F] rounded-2xl bg-[#1F2E35] shadow-[0_2px_0_#0f171b,0_4px_14px_rgba(0,0,0,0.18)] transition-[border-color,box-shadow] duration-[170ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50";

export const INTERACTIVE_ROW_CLASS =
  "transition-[background-color,transform,box-shadow] duration-[170ms] ease-out hover:bg-[#243840]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50";
