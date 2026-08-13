"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { hoverLift, interactionEase, tapPress } from "@/lib/interactions";
import { useInteractionMotion } from "./useInteractionMotion";

interface HoverButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  disabled?: boolean;
}

export const HoverButton = React.memo(function HoverButton({
  children,
  disabled = false,
  className = "",
  ...props
}: HoverButtonProps) {
  const { enabled } = useInteractionMotion();

  if (disabled || !enabled) {
    return (
      <button disabled={disabled} className={className} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      className={className}
      whileHover={hoverLift}
      whileTap={tapPress}
      transition={interactionEase}
      {...props}
    >
      {children}
    </motion.button>
  );
});
