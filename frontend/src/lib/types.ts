export interface Course {
  id: string;
  title: string;
  language_code: string;
  source_language?: string;
  target_language?: string;
  flag_icon: string;
  created_at: string;
}

export interface ExerciseOption {
  id: string;
  exercise_id: string;
  label: string;
  is_correct: boolean;
  pair_key?: string | null;
  image_url?: string | null;
  order_index: number;
}

export interface Exercise {
  id: string;
  lesson_id: string;
  order_index: number;
  type: "intro" | "multiple_choice" | "translate" | "word_bank" | "match_pairs" | "fill_blank" | "type_answer" | "image_selection" | "listening";
  prompt: string;
  prompt_audio_url?: string | null;
  correct_answer: any;
  metadata: any;
  options: ExerciseOption[];
}

export interface Lesson {
  id: string;
  skill_id: string;
  level: number;
  order_index: number;
  xp_reward: number;
  course_id?: string;
  language_code?: string;
  exercises?: Exercise[];
}

export interface Skill {
  id: string;
  unit_id: string;
  title: string;
  icon: string;
  order_index: number;
  total_levels: number;
  lessons_per_level: number;
  current_level: number;
  status: "locked" | "available" | "in_progress" | "completed";
  lessons_completed: number;
  next_lesson_id?: string | null;
}

export interface Unit {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  color_theme: string;
  skills: Skill[];
}

export interface PathData {
  units: Unit[];
}

export interface UserStats {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  hearts_current: number;
  hearts_max: number;
  last_heart_lost_at?: string | null;
  gems: number;
  daily_xp_goal: number;
  daily_xp_today: number;
}

export interface RegenStatus {
  hearts_current: number;
  hearts_max: number;
  time_left_seconds: number;
}

export interface LeaderboardEntry {
  id: string;
  user_id?: string | null;
  display_name: string;
  avatar_url: string;
  weekly_xp: number;
  league: string;
  rank: number;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  stats: UserStats;
  achievements: Achievement[];
  join_date: string;
  course_progress_summary: string;
  active_course_id?: string | null;
  onboarding_completed?: boolean;
  selected_language?: string | null;
  native_language?: string;
  learning_language?: string | null;
  active_course_title?: string | null;
  current_unit_title?: string | null;
  current_skill_title?: string | null;
}

export interface StartLessonResponse {
  attempt_id: string;
  lesson_id: string;
  user_id: string;
  started_at: string;
}

export interface AnswerResponse {
  correct: boolean;
  correct_answer: any;
  hearts_remaining: number;
  hearts_lost: number;
}

export interface CompleteResponse {
  attempt_id: string;
  xp_earned: number;
  hearts_lost: number;
  result: "passed" | "failed";
  current_streak: number;
  daily_xp_today: number;
  daily_xp_goal: number;
  gems_earned?: number;
  path?: PathData;
  stats?: UserStats;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp_target: number;
  quest_type: "xp" | "lesson";
}

export interface UserQuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  date: string;
  quest: Quest;
}

export interface UserCourse {
  id: string;
  course_id: string;
  language_code: string;
  language_name: string;
  flag: string;
  current_unit: string;
  current_lesson: string;
  xp: number;
  streak: number;
  hearts: number;
  hearts_max: number;
  gems: number;
  completion_percent: number;
  is_active: boolean;
  daily_xp_today: number;
  daily_xp_goal: number;
}

