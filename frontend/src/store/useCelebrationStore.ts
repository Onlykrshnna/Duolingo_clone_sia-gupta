import { create } from "zustand";
import { Achievement } from "@/lib/types";

export type CelebrationKind =
  | "achievement"
  | "streak"
  | "dailyGoal"
  | "courseComplete";

export interface CelebrationPayload {
  kind: CelebrationKind;
  title: string;
  subtitle?: string;
  icon?: string;
  achievement?: Achievement;
  streak?: number;
  xp?: number;
}

interface CelebrationState {
  current: CelebrationPayload | null;
  queue: CelebrationPayload[];
  show: (payload: CelebrationPayload) => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  current: null,
  queue: [],

  show: (payload) => {
    set((state) => {
      const queue = [...state.queue, payload];
      return {
        queue,
        current: state.current ?? payload,
      };
    });
  },

  dismiss: () => {
    const queue = get().queue.slice(1);
    set({
      queue,
      current: queue[0] ?? null,
    });
  },
}));
