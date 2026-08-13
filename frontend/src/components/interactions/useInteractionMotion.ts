"use client";

import { useEffect, useState } from "react";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export function useInteractionMotion() {
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return {
    enabled: animationsEnabled && !reducedMotion,
  };
}
