import { create } from "zustand";
import { WritingSystemOverview } from "@/lib/types";

interface WritingState {
  overviewByCourse: Record<string, WritingSystemOverview | null>;
  setOverview: (courseId: string, overview: WritingSystemOverview | null) => void;
  getOverview: (courseId: string) => WritingSystemOverview | null;
  reset: () => void;
}

export const useWritingStore = create<WritingState>((set, get) => ({
  overviewByCourse: {},
  setOverview: (courseId, overview) =>
    set((state) => ({
      overviewByCourse: { ...state.overviewByCourse, [courseId]: overview },
    })),
  getOverview: (courseId) => get().overviewByCourse[courseId] ?? null,
  reset: () => set({ overviewByCourse: {} }),
}));
