import { useLessonStore } from "@/store/useLessonStore";
import { usePathStore } from "@/store/usePathStore";
import { useWritingStore } from "@/store/useWritingStore";
import { audioManager } from "@/lib/audio/AudioManager";
import { resetAutoPlaySession } from "@/components/audio/AudioButton";

const ACTIVE_COURSE_KEY = "duolingo-active-course-id";
const WRITING_CACHE_PREFIX = "duolingo-writing-";

/** Drop in-memory lesson/session state when the active course changes. */
export function clearLessonCaches() {
  audioManager.stop();
  resetAutoPlaySession();
  useLessonStore.getState().resetLesson();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("duolingo-lesson-draft");
    sessionStorage.removeItem("duolingo-exercise-queue");
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(WRITING_CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/** Persist active course id for reloads. */
export function persistActiveCourseId(courseId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVE_COURSE_KEY, courseId);
  }
}

export function getPersistedActiveCourseId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_COURSE_KEY);
}

/** Full course switch: clear lesson, path, and writing caches until fresh data arrives. */
export function resetStoresForCourseSwitch() {
  clearLessonCaches();
  usePathStore.getState().reset();
  useWritingStore.getState().reset();
}
