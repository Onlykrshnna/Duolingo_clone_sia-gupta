import { toast } from "sonner";
import { Achievement, CompleteResponse } from "./types";
import { useCelebrationStore } from "@/store/useCelebrationStore";
import { playSound } from "./sounds";

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

export function showXpGainedToast(xp: number) {
  if (xp <= 0) return;
  playSound("xp");
  toast.success(`+${xp} XP earned!`, {
    description: "Keep going — you're making progress.",
    icon: "⚡",
    duration: 4000,
  });
}

export function showStreakMilestoneToast(currentStreak: number, previousStreak: number) {
  const crossedMilestone = STREAK_MILESTONES.find(
    (m) => currentStreak >= m && previousStreak < m
  );
  if (!crossedMilestone) return;

  playSound("streak");
  toast.success(`${crossedMilestone}-day streak!`, {
    description: "You're on fire — don't break the chain!",
    icon: "🔥",
    duration: 5000,
  });
}

export function showAchievementUnlockedToast(achievement: Achievement) {
  playSound("achievement");
  toast.success("Achievement unlocked!", {
    description: `${achievement.icon} ${achievement.title} — ${achievement.description}`,
    duration: 6000,
  });
}

export function showHeartRestoredToast() {
  playSound("heartRestored");
  toast.success("Heart restored!", {
    description: "You're back in the game.",
    icon: "❤️",
    duration: 3500,
  });
}

export function showLessonCompleteToast(xp: number) {
  playSound("lessonComplete");
  toast.success("Lesson complete!", {
    description: xp > 0 ? `You earned ${xp} XP.` : "Great work!",
    icon: "🎉",
    duration: 4500,
  });
}

export function showSkillUnlockedToast(skillName?: string) {
  playSound("skillUnlocked");
  toast.success("Skill unlocked!", {
    description: skillName ? `${skillName} is now available.` : "A new skill is ready.",
    icon: "⭐",
    duration: 4500,
  });
}

export async function celebrateLessonComplete(
  summary: CompleteResponse,
  previousStreak: number,
  fetchAchievements: () => Promise<Achievement[]>
) {
  showXpGainedToast(summary.xp_earned);
  showStreakMilestoneToast(summary.current_streak, previousStreak);

  try {
    const achievements = await fetchAchievements();
    const recentlyUnlocked = achievements.filter((a) => {
      if (!a.unlocked || !a.unlocked_at) return false;
      const unlockedAt = new Date(a.unlocked_at).getTime();
      return Date.now() - unlockedAt < 60_000;
    });

    recentlyUnlocked.forEach((achievement, index) => {
      showAchievementUnlockedToast(achievement);
      setTimeout(() => {
        useCelebrationStore.getState().show({
          kind: "achievement",
          title: achievement.title,
          subtitle: achievement.description,
          icon: achievement.icon,
          achievement,
        });
      }, 4500 + index * 2000);
    });
  } catch (err) {
    console.error("Failed to fetch achievements for toast:", err);
  }
}
