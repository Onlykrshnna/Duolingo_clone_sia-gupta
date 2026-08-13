"use client";

import React from "react";
import { motion } from "framer-motion";
import { playSound } from "@/lib/sounds";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { easeOutFast } from "@/lib/animations";

export type DuoButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "super"
  | "ghost"
  | "locked";

interface DuoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DuoButtonVariant;
}

export const DuoButton: React.FC<DuoButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  disabled,
  onClick,
  ...props
}) => {
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);
  const activeVariant = disabled ? "locked" : variant;
  const isInteractive = !disabled && activeVariant !== "locked";

  const baseStyles =
    "px-5 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-150 text-center select-none flex items-center justify-center border-2 border-b-4 active:border-b-2 active:translate-y-[2px]";

  const variantStyles: Record<DuoButtonVariant, string> = {
    primary:
      "bg-brand-green border-brand-green-border text-white hover:bg-green-500/90 hover:border-brand-green active:border-brand-green-border cursor-pointer shadow-[0_4px_0_#3d8a02]",
    secondary:
      "bg-sky-blue border-sky-blue-border text-white hover:bg-sky-300 hover:border-sky-blue active:border-sky-blue-border cursor-pointer shadow-[0_4px_0_#0c4a6e]",
    danger:
      "bg-rose-red border-rose-red-border text-white hover:bg-rose-400 hover:border-rose-red active:border-rose-red-border cursor-pointer shadow-[0_4px_0_#9f1239]",
    super:
      "bg-brand-indigo border-brand-indigo-border text-white hover:bg-indigo-400 hover:border-brand-indigo active:border-brand-indigo-border cursor-pointer shadow-[0_4px_0_#3730a3]",
    ghost:
      "bg-transparent border-light-border text-sky-blue hover:bg-[#202F36] active:border-light-border active:translate-y-[2px] cursor-pointer",
    locked:
      "bg-locked-bg border-locked-border text-muted-base cursor-not-allowed active:translate-y-0 active:border-b-4 shadow-none",
  };

  const combinedClassName = `${baseStyles} ${variantStyles[activeVariant]} ${className}`;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isInteractive) {
      playSound("click");
    }
    onClick?.(e);
  };

  const button = (
    <button
      disabled={!isInteractive}
      className={combinedClassName}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );

  if (animationsEnabled && isInteractive) {
    return (
      <motion.div
        className="inline-flex w-full"
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.96, y: 2 }}
        transition={easeOutFast}
      >
        {button}
      </motion.div>
    );
  }

  return button;
};

export default DuoButton;
