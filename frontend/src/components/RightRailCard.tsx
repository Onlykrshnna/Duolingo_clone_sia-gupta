"use client";

import React from "react";
import { HoverCard } from "@/components/interactions";
import { CARD_BASE_CLASS } from "@/lib/interactions";

interface RightRailCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
}

export const RightRailCard: React.FC<RightRailCardProps> = ({
  children,
  className = "",
  hover = true,
  interactive = false,
}) => {
  return (
    <HoverCard
      hover={hover}
      interactive={interactive}
      className={`${CARD_BASE_CLASS} p-5 hover:border-[#4E606A] ${className}`}
    >
      {children}
    </HoverCard>
  );
};

export default RightRailCard;
