"use client";

import { useEffect } from "react";
import { useLessonStore } from "@/store/useLessonStore";

const STORAGE_PREFIXES = ["duolingo", "duo-", "lesson-", "real-duolingo"];
const PRESERVED_KEYS = ["app-preferences", "duolingo-active-course-id", "duolingo-course-store"];

function clearAppStorage() {
  for (const storage of [localStorage, sessionStorage]) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        if (PRESERVED_KEYS.includes(key)) continue;
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
  }
}

export default function ClientBootstrap() {
  useEffect(() => {
    clearAppStorage();
    useLessonStore.getState().resetLesson();
  }, []);

  return null;
}
