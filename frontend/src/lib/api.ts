import {
  Course,
  PathData,
  Skill,
  Lesson,
  UserStats,
  RegenStatus,
  LeaderboardEntry,
  Achievement,
  UserProfile,
  UserCourse,
  StartLessonResponse,
  AnswerResponse,
  CompleteResponse,
  UserQuestProgress,
} from "./types";
import { apiRequest, ApiRequestOptions, getApiBaseUrl } from "./apiClient";
import { isValidCourseId, isValidLessonId } from "./ids";

export { ApiError, getApiBaseUrl, MAX_RETRIES } from "./apiClient";
export type { ApiRequestOptions };

type ApiOpts = Pick<ApiRequestOptions, "onRetry" | "retries">;

function withOpts(options?: ApiOpts): ApiRequestOptions {
  return options ?? {};
}

function guardCourseId(courseId: string, path: string): void {
  if (!isValidCourseId(courseId)) {
    throw new Error(`[API] Refusing request with invalid courseId for ${path}`);
  }
}

function guardLessonId(lessonId: string, path: string): void {
  if (!isValidLessonId(lessonId)) {
    throw new Error(`[API] Refusing request with invalid lessonId for ${path}`);
  }
}

export const api = {
  getCourses: (options?: ApiOpts) => request<Course[]>("/courses", options),

  getCoursePath: (courseId: string, options?: ApiOpts) => {
    guardCourseId(courseId, "/courses/:id/path");
    return request<PathData>(`/courses/${courseId}/path`, withOpts(options));
  },

  getSkill: (skillId: string, options?: ApiOpts) => request<Skill>(`/skills/${skillId}`, options),

  getLesson: (courseId: string, lessonId: string, options?: ApiOpts) => {
    guardCourseId(courseId, "/courses/:id/lessons/:lessonId");
    guardLessonId(lessonId, "/courses/:id/lessons/:lessonId");
    return request<Lesson>(`/courses/${courseId}/lessons/${lessonId}`, withOpts(options));
  },

  /** @deprecated Use getLesson(courseId, lessonId) */
  getLessonLegacy: (lessonId: string, options?: ApiOpts) =>
    request<Lesson>(`/lessons/${lessonId}`, options),

  startLesson: (
    courseId: string,
    lessonId: string,
    isPractice: boolean = false,
    options?: ApiOpts
  ) => {
    guardCourseId(courseId, "/courses/:id/lessons/:lessonId/start");
    guardLessonId(lessonId, "/courses/:id/lessons/:lessonId/start");
    return request<StartLessonResponse>(
      `/courses/${courseId}/lessons/${lessonId}/start?is_practice=${isPractice}`,
      {
        method: "POST",
        ...withOpts(options),
      }
    );
  },

  submitAnswer: (attemptId: string, exerciseId: string, submittedAnswer: unknown, options?: ApiOpts) =>
    request<AnswerResponse>(`/lessons/attempts/${attemptId}/answer`, {
      method: "POST",
      body: JSON.stringify({ exercise_id: exerciseId, submitted_answer: submittedAnswer }),
      ...withOpts(options),
    }),

  completeLesson: (attemptId: string, options?: ApiOpts) =>
    request<CompleteResponse>(`/lessons/attempts/${attemptId}/complete`, {
      method: "POST",
      ...withOpts(options),
    }),

  abandonLesson: (attemptId: string, options?: ApiOpts) =>
    request<CompleteResponse>(`/lessons/attempts/${attemptId}/abandon`, {
      method: "POST",
      ...withOpts(options),
    }),

  getUserStats: (userId: string = "me", options?: ApiOpts) =>
    request<UserStats>(`/users/${userId}/stats`, options),

  refillHearts: (userId: string = "me", options?: ApiOpts) =>
    request<{ success: boolean; message: string; gems_remaining: number; hearts_current: number }>(
      `/users/${userId}/hearts/refill`,
      { method: "POST", ...withOpts(options) }
    ),

  getHeartsRegenStatus: (userId: string = "me", options?: ApiOpts) =>
    request<RegenStatus>(`/users/${userId}/hearts/regen-status`, options),

  getLeaderboard: (options?: ApiOpts) => request<LeaderboardEntry[]>("/leaderboard", options),

  getUserAchievements: (userId: string = "me", options?: ApiOpts) =>
    request<Achievement[]>(`/users/${userId}/achievements`, options),

  getUserProfile: (userId: string = "me", options?: ApiOpts) =>
    request<UserProfile>(`/users/${userId}/profile`, options),

  getUserQuests: (userId: string = "me", options?: ApiOpts) =>
    request<UserQuestProgress[]>(`/users/${userId}/quests`, options),

  healthCheck: (options?: ApiOpts) =>
    request<{ status: string; service: string; version: string }>("/health", options),

  selectCourse: (courseId: string, userId: string = "me", completeOnboarding: boolean = false, options?: ApiOpts) =>
    request<{ success: boolean; active_course_id: string; onboarding_completed: boolean }>(
      `/users/${userId}/select-course`,
      {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, complete_onboarding: completeOnboarding }),
        ...withOpts(options),
      }
    ),

  completeOnboarding: (courseId: string, selectedLanguage: string, userId: string = "me", options?: ApiOpts) =>
    request<{
      success: boolean;
      active_course_id: string;
      onboarding_completed: boolean;
      selected_language: string | null;
    }>(`/users/${userId}/select-course`, {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId,
        complete_onboarding: true,
        selected_language: selectedLanguage,
      }),
      ...withOpts(options),
    }),

  getUserCourses: (userId: string = "me", options?: ApiOpts) =>
    request<UserCourse[]>(`/users/${userId}/courses`, options),

  switchCourse: (courseId: string, userId: string = "me", options?: ApiOpts) =>
    request<{
      success: boolean;
      course: UserCourse;
      stats: UserStats;
      path: PathData;
      active_course_id: string;
    }>(`/users/${userId}/switch-course`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
      ...withOpts(options),
    }),

  enrollCourse: (
    courseId: string,
    opts?: { redirectToFirstLesson?: boolean },
    userId: string = "me",
    options?: ApiOpts
  ) =>
    request<{
      success: boolean;
      course: UserCourse;
      first_lesson_id: string | null;
      active_course_id: string;
      stats: UserStats;
      path: PathData;
    }>(`/users/${userId}/enroll-course`, {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId,
        redirect_to_first_lesson: opts?.redirectToFirstLesson ?? false,
      }),
      ...withOpts(options),
    }),
};

async function request<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, options ?? {});
}
