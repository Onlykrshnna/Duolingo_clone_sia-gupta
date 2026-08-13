import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import { UserCourse, UserStats, PathData } from "@/lib/types";
import { usePathStore } from "@/store/usePathStore";
import {
  getPersistedActiveCourseId,
  persistActiveCourseId,
  resetStoresForCourseSwitch,
} from "@/lib/courseIsolation";

interface CourseState {
  enrolledCourses: UserCourse[];
  activeCourse: UserCourse | null;
  availableCourses: { id: string; title: string; flag_icon: string; target_language: string }[];
  loading: boolean;
  switching: boolean;
  loadEnrolledCourses: () => Promise<UserCourse[]>;
  loadAvailableCourses: () => Promise<void>;
  switchCourse: (courseId: string) => Promise<{ stats: UserStats; path: PathData }>;
  enrollCourse: (courseId: string, options?: { redirectToFirstLesson?: boolean }) => Promise<{ firstLessonId: string | null }>;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      enrolledCourses: [],
      activeCourse: null,
      availableCourses: [],
      loading: false,
      switching: false,

      loadEnrolledCourses: async () => {
        set({ loading: true });
        try {
          const courses = await api.getUserCourses("me");
          const persistedId = getPersistedActiveCourseId();
          const active =
            courses.find((c) => c.is_active) ??
            (persistedId ? courses.find((c) => c.course_id === persistedId) : null) ??
            null;
          if (active) {
            persistActiveCourseId(active.course_id);
          }
          set({ enrolledCourses: courses, activeCourse: active, loading: false });
          return courses;
        } catch (err) {
          console.error("[CourseStore] loadEnrolledCourses failed:", err);
          set({ loading: false });
          return [];
        }
      },

      loadAvailableCourses: async () => {
        const all = await api.getCourses();
        const enrolledIds = new Set(get().enrolledCourses.map((c) => c.course_id));
        set({
          availableCourses: all
            .filter((c) => !enrolledIds.has(c.id))
            .map((c) => ({
              id: c.id,
              title: c.title,
              flag_icon: c.flag_icon,
              target_language: c.target_language ?? c.language_code,
            })),
        });
      },

      switchCourse: async (courseId: string) => {
        set({ switching: true });
        resetStoresForCourseSwitch();
        try {
          const result = await api.switchCourse(courseId);
          const courses = await api.getUserCourses("me");
          const active = courses.find((c) => c.is_active) ?? null;
          persistActiveCourseId(courseId);
          set({ enrolledCourses: courses, activeCourse: active, switching: false });
          usePathStore.getState().setPathData(result.path);
          usePathStore.getState().setStats(result.stats);
          usePathStore.getState().setActiveCourseId(courseId);
          return { stats: result.stats, path: result.path };
        } catch (err) {
          set({ switching: false });
          throw err;
        }
      },

      enrollCourse: async (courseId, options) => {
        set({ loading: true });
        resetStoresForCourseSwitch();
        try {
          const result = await api.enrollCourse(courseId, {
            redirectToFirstLesson: options?.redirectToFirstLesson,
          });
          await get().loadEnrolledCourses();
          await get().loadAvailableCourses();
          usePathStore.getState().setPathData(result.path);
          usePathStore.getState().setStats(result.stats);
          usePathStore.getState().setActiveCourseId(courseId);
          persistActiveCourseId(courseId);
          set({ loading: false });
          return { firstLessonId: result.first_lesson_id };
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },
    }),
    {
      name: "duolingo-course-store",
      partialize: (state) => ({
        activeCourse: state.activeCourse,
      }),
    }
  )
);

export { getPersistedActiveCourseId } from "@/lib/courseIsolation";