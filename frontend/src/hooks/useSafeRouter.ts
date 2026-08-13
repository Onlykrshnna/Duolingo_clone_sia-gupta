"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Wraps Next.js App Router navigation so actions are not dispatched before
 * the client router has finished initializing (avoids hydration-time errors).
 */
export function useSafeRouter() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      if (!isReady) return;
      router.push(href, options);
    },
    [isReady, router]
  );

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      if (!isReady) return;
      router.replace(href, options);
    },
    [isReady, router]
  );

  return useMemo(
    () => ({
      push,
      replace,
      back: router.back,
      forward: router.forward,
      refresh: router.refresh,
      prefetch: router.prefetch,
      isReady,
    }),
    [push, replace, router.back, router.forward, router.refresh, router.prefetch, isReady]
  );
}
