import { UserProfile } from "./types";
import { LANGUAGE_REGISTRY, getLanguageName, getNativeName } from "./languageRegistry";

/** Seeded course IDs — English speakers learning target languages */
export const COURSE_IDS = {
  spanish: "c0000000-0000-0000-0000-000000000000",
  french: "c1000000-0000-0000-0000-000000000001",
  german: "c2000000-0000-0000-0000-000000000002",
  japanese: "c3000000-0000-0000-0000-000000000003",
} as const;

export const DEFAULT_NATIVE_LANGUAGE = "en";

export const ONBOARDING_TOTAL_STEPS = 5;

export interface OnboardingLanguageOption {
  id: string;
  name: string;
  nativeName: string;
  learnerCount: string;
  courseTitle: string;
  themeText: string;
  available: boolean;
  courseId?: string;
  targetLanguage: string;
}

function buildOnboardingOption(
  code: string,
  learnerCount: string,
  courseTitle: string,
  themeText: string,
  available: boolean,
  courseId?: string
): OnboardingLanguageOption {
  const entry = LANGUAGE_REGISTRY.find((l) => l.languageCode === code);
  return {
    id: code,
    name: entry?.languageName ?? getLanguageName(code),
    nativeName: entry?.nativeName ?? getNativeName(code),
    learnerCount,
    courseTitle,
    themeText,
    available,
    courseId,
    targetLanguage: code,
  };
}

/** Languages an English speaker can learn (source is always English) */
export const ONBOARDING_LANGUAGES: OnboardingLanguageOption[] = [
  buildOnboardingOption("es", "45.2M learners", "Spanish for English speakers", "Learn Spanish with bite-sized lessons", true, COURSE_IDS.spanish),
  buildOnboardingOption("ja", "9.8M learners", "Japanese for English speakers", "Start your Japanese journey today", true, COURSE_IDS.japanese),
  buildOnboardingOption("de", "12.4M learners", "German for English speakers", "Build your German skills step by step", true, COURSE_IDS.german),
  buildOnboardingOption("fr", "18.7M learners", "French for English speakers", "Learn French one lesson at a time", true, COURSE_IDS.french),
  buildOnboardingOption("en", "32.1M learners", "", "", false),
  buildOnboardingOption("hi", "8.1M learners", "", "", false),
  buildOnboardingOption("it", "6.5M learners", "", "", false),
  buildOnboardingOption("ko", "5.9M learners", "", "", false),
  buildOnboardingOption("zh", "5.2M learners", "", "", false),
  buildOnboardingOption("ru", "4.8M learners", "", "", false),
  {
    id: "math",
    name: "Math",
    nativeName: "Math",
    learnerCount: "3.1M learners",
    courseTitle: "",
    themeText: "",
    available: false,
    targetLanguage: "math",
  },
  {
    id: "chess",
    name: "Chess",
    nativeName: "Chess",
    learnerCount: "1.2M learners",
    courseTitle: "",
    themeText: "",
    available: false,
    targetLanguage: "chess",
  },
];

export const WELCOME_MESSAGES = [
  "Hi there! I'm Duo!",
  "Let's get this party started!",
] as const;

export const LANGUAGE_STEP_TITLE = "Choose your language";
export const LANGUAGE_STEP_MESSAGE = "What would you like to learn?";

export const LOADING_MESSAGES = [
  "Preparing your learning path...",
  "Creating your personalized course...",
] as const;

export function getGreatChoiceMessage(languageName: string): string {
  return `You're going to learn ${languageName}!`;
}

export function userNeedsOnboarding(
  profile: Pick<UserProfile, "onboarding_completed" | "active_course_id">
): boolean {
  return profile.onboarding_completed !== true;
}

export function userCanAccessLearningPath(
  profile: Pick<UserProfile, "onboarding_completed" | "active_course_id">
): boolean {
  return profile.onboarding_completed === true && Boolean(profile.active_course_id);
}

export function getOnboardingProgress(step: number): number {
  return Math.min(100, Math.round((step / ONBOARDING_TOTAL_STEPS) * 100));
}

export function findLanguageById(id: string): OnboardingLanguageOption | undefined {
  return ONBOARDING_LANGUAGES.find((l) => l.id === id);
}

export { getFlagAsset as resolveDisplayFlag } from "./languageRegistry";
