/** Canonical vocabulary word for one lesson. */
export interface VocabWord {
  id: string;
  english: string;
  target: string;
  romanization: string;
  image?: string | null;
  audio?: string | null;
  difficulty?: number;
}

export interface LessonContent {
  id: string;
  title: string;
  targetLanguage: string;
  acceptRomanization?: boolean;
  vocabulary: VocabWord[];
}

export type QuestionPhase =
  | "introduce"
  | "image_recognition"
  | "recognition"
  | "matching"
  | "comprehension"
  | "production"
  | "listening"
  | "remedial";

export type Difficulty = 1 | 2 | 3;

export const MIN_LESSON_ACCURACY = 0.7;
