"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { INTERACTIVE_ROW_CLASS, hoverLift, interactionEase, tapPress } from "@/lib/interactions";
import { useInteractionMotion } from "./useInteractionMotion";

interface InteractiveRowProps {
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  onClick?: () => void;
}

export const InteractiveRow = React.memo(function InteractiveRow({
  children,
  className = "",
  showArrow = false,
  onClick,
}: InteractiveRowProps) {
  const { enabled } = useInteractionMotion();
  const base = `${INTERACTIVE_ROW_CLASS} rounded-xl px-3 py-2.5 ${onClick ? "cursor-pointer" : ""} ${className}`;

  if (!enabled) {
    return (
      <div className={base} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
        <div className="flex items-center justify-between gap-3">
          {children}
          {showArrow && <ChevronRight className="w-4 h-4 text-slate-500" />}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={base}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      whileHover={hoverLift}
      whileTap={onClick ? tapPress : undefined}
      transition={interactionEase}
    >
      <div className="flex items-center justify-between gap-3">
        <motion.div className="flex items-center gap-3 flex-1 min-w-0" whileHover={{ scale: 1.01 }}>
          {children}
        </motion.div>
        {showArrow && (
          <motion.span whileHover={{ x: 3 }} transition={interactionEase} className="inline-flex shrink-0">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </motion.span>
        )}
      </div>
    </motion.div>
  );
});
