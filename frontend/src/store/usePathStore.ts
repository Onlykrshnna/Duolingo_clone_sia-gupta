import { create } from "zustand";
import { PathData, UserStats } from "@/lib/types";
import { api } from "@/lib/api";
import { isValidCourseId } from "@/lib/ids";

interface PathState {
  pathData: PathData | null;
  stats: UserStats | null;
  activeCourseId: string | null;
  setPathData: (path: PathData) => void;
  setStats: (stats: UserStats) => void;
  setActiveCourseId: (courseId: string) => void;
  applyLessonComplete: (path: PathData, stats: UserStats) => void;
  refreshPath: (courseId: string) => Promise<void>;
  reset: () => void;
}

export const usePathStore = create<PathState>((set) => ({
  pathData: null,
  stats: null,
  activeCourseId: null,

  setPathData: (pathData) => set({ pathData }),
  setStats: (stats) => set({ stats }),
  setActiveCourseId: (activeCourseId) => set({ activeCourseId }),

  applyLessonComplete: (pathData, stats) => set({ pathData, stats }),

  refreshPath: async (courseId) => {
    if (!isValidCourseId(courseId)) return;
    const [userStats, coursePath] = await Promise.all([
      api.getUserStats("me"),
      api.getCoursePath(courseId),
    ]);
    set({ pathData: coursePath, stats: userStats, activeCourseId: courseId });
  },

  reset: () => set({ pathData: null, stats: null, activeCourseId: null }),
}));
