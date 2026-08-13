"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import {
  GLOW_STYLES,
  GlowAccent,
  STAT_BASE_CLASS,
  hoverLift,
  iconHover,
  interactionEase,
  tapPress,
} from "@/lib/interactions";

import { useInteractionMotion } from "./useInteractionMotion";

interface HoverStatProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  accent?: GlowAccent;
  title?: string;
}

export const HoverStat = React.memo(function HoverStat({
  children,
  accent = "neutral",
  title,
  className = "",
  ...props
}: HoverStatProps) {
  const { enabled } = useInteractionMotion();

  const base = `${STAT_BASE_CLASS} hover:bg-[#243840]/90 ${GLOW_STYLES[accent]} ${className}`;

  if (!enabled) {
    return (
      <div className={base} title={title} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      title={title}
      className={`group ${base}`}
      whileHover={hoverLift}
      whileTap={tapPress}
      transition={interactionEase}
      {...props}
    >
      <div className="flex items-center gap-1.5 [&>svg]:transition-transform [&>svg]:duration-[170ms] group-hover:[&>svg]:scale-[1.08] group-hover:[&>svg]:-translate-y-px [&>span]:transition-[filter] [&>span]:duration-[170ms] hover:[&>span]:brightness-110">
        {children}
      </div>
    </motion.div>
  );
});

interface HoverIconProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const HoverIcon = React.memo(function HoverIcon({
  children,
  className = "",
  disabled = false,
}: HoverIconProps) {
  const { enabled } = useInteractionMotion();

  if (disabled || !enabled) {
    return <span className={`inline-flex ${className}`}>{children}</span>;
  }

  return (
    <motion.span
      className={`inline-flex ${className}`}
      whileHover={iconHover}
      whileTap={{ scale: 0.92 }}
      transition={interactionEase}
    >
      {children}
    </motion.span>
  );
});

interface HoverCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  interactive?: boolean;
  hover?: boolean;
}

export const HoverCard = React.memo(function HoverCard({
  children,
  className = "",
  interactive = false,
  hover = true,
  ...props
}: HoverCardProps) {
  const { enabled } = useInteractionMotion();
  const cardClass = `${className} ${interactive ? "cursor-pointer" : ""}`;

  if (!hover || !enabled) {
    return (
      <div className={cardClass} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cardClass}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={interactive ? tapPress : undefined}
      transition={interactionEase}
      {...props}
    >
      {children}
    </motion.div>
  );
});

interface InteractivePressableProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  disabled?: boolean;
}

export const InteractivePressable = React.memo(function InteractivePressable({
  children,
  disabled = false,
  className = "",
  ...props
}: InteractivePressableProps) {
  const { enabled } = useInteractionMotion();

  if (disabled || !enabled) {
    return (
      <div className={className} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={hoverLift}
      whileTap={tapPress}
      transition={interactionEase}
      {...props}
    >
      {children}
    </motion.div>
  );
});

export { AnimatedCounter } from "./AnimatedCounter";
export { HoverButton } from "./HoverButton";
export { InteractiveRow } from "./InteractiveRow";
export { useInteractionMotion } from "./useInteractionMotion";
