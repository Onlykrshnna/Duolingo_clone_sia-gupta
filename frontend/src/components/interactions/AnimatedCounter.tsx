"use client";

import React, { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  durationMs?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = "",
  durationMs = 720,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(12, Math.round(durationMs / 30));
    const step = value / totalFrames;
    const interval = setInterval(() => {
      frame += 1;
      setDisplay(Math.min(value, Math.round(step * frame)));
      if (frame >= totalFrames) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [value, durationMs]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
