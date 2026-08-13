import { Exercise } from "./types";
import { exerciseShowsForeignOptions, resolvePronunciation } from "./pronunciation";

export type ImageOption = {
  label: string;
  image: string;
  romanization?: string;
};

export type IntroCardData = {
  targetWord: string;
  romanization?: string;
  pronunciation?: string;
  englishMeaning: string;
  image?: string | null;
  audio?: string | null;
  isNewWord?: boolean;
};

export type NormalizedExercise = {
  type: Exercise["type"];
  template: string;
  layout: string;
  prompt: string;
  options: string[];
  imageOptions: ImageOption[];
  tokens: string[];
  sentence: string;
  left: string[];
  right: string[];
  pairs: Record<string, string>;
  intro?: IntroCardData;
  audioUrl?: string | null;
  fallbackText?: string | null;
  romanization?: string;
  pronunciation?: string;
  targetLanguage?: string;
  showsForeignOptions: boolean;
  pronunciationHint?: string;
  englishMeaning?: string;
  isIntro: boolean;
  isNonGraded: boolean;
  skippable: boolean;
  phase?: string;
  difficulty?: number;
};

function buildImageOptions(exercise: Exercise, meta: Record<string, unknown>): ImageOption[] {
  if (Array.isArray(meta.options) && meta.options.length > 0) {
    const first = meta.options[0] as Record<string, unknown>;
    if (first.targetWord || first.image) {
      return (meta.options as Array<{ targetWord?: string; romanization?: string; pronunciation?: string; image?: string; image_url?: string }>).map(
        (o) => ({
          label: o.targetWord ?? "",
          image: o.image ?? o.image_url ?? "",
          romanization: o.romanization,
          pronunciation: o.pronunciation || o.romanization,
        })
      );
    }
  }

  const sortedOptions = [...(exercise.options ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );
  return sortedOptions
    .filter((o) => o.image_url)
    .map((o) => ({
      label: o.label,
      image: o.image_url!,
      romanization: (meta.options as Array<{ targetWord: string; romanization?: string }> | undefined)?.find(
        (x) => x.targetWord === o.label
      )?.romanization,
    }));
}

/** Derive UI fields from metadata with fallbacks to the options relation. */
export function normalizeExercise(exercise: Exercise): NormalizedExercise {
  const meta = exercise.metadata ?? {};
  const sortedOptions = [...(exercise.options ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );
  const optionLabels = sortedOptions.map((o) => o.label);

  const options: string[] = Array.isArray(meta.options)
    ? typeof meta.options[0] === "string"
      ? meta.options
      : (meta.options as Array<{ label?: string; targetWord?: string }>).map(
          (o) => (typeof o === "string" ? o : o.targetWord ?? o.label ?? "")
        )
    : optionLabels;

  const imageOptions = buildImageOptions(exercise, meta);
  const tokens: string[] = Array.isArray(meta.tokens) ? meta.tokens : optionLabels;

  let left: string[] = Array.isArray(meta.left) ? meta.left : [];
  let right: string[] = Array.isArray(meta.right) ? meta.right : [];

  if (left.length === 0 && exercise.options?.some((o) => o.pair_key)) {
    const byPair = new Map<string, string[]>();
    for (const opt of sortedOptions) {
      if (!opt.pair_key) continue;
      const group = byPair.get(opt.pair_key) ?? [];
      group.push(opt.label);
      byPair.set(opt.pair_key, group);
    }
    left = [];
    right = [];
    byPair.forEach((labels) => {
      if (labels.length >= 2) {
        left.push(labels[0]);
        right.push(labels[1]);
      }
    });
  }

  const pairs: Record<string, string> =
    exercise.correct_answer?.pairs ??
    Object.fromEntries(left.map((l, i) => [l, right[i] ?? ""]));

  const isIntro = exercise.type === "intro";
  const template = (meta.template as string) ?? exercise.type;
  const layout = (meta.layout as string) ?? template;

  const intro: IntroCardData | undefined = isIntro
    ? {
        targetWord: (meta.targetWord as string) ?? "",
        romanization: meta.romanization as string | undefined,
        pronunciation: meta.pronunciation as string | undefined,
        englishMeaning: (meta.englishMeaning as string) ?? (meta.english as string) ?? (meta.meaning as string) ?? "",
        image: meta.image as string | null | undefined,
        audio: meta.audio as string | null | undefined,
        isNewWord: meta.isNewWord as boolean | undefined,
      }
    : undefined;

  return {
    type: exercise.type,
    template,
    layout,
    prompt: exercise.prompt ?? "",
    options,
    imageOptions,
    tokens,
    sentence: (meta.sentence as string) ?? exercise.prompt ?? "",
    left,
    right,
    pairs,
    intro,
    audioUrl: exercise.prompt_audio_url ?? (meta.audio as string | null) ?? null,
    fallbackText: (meta.fallback_text as string) ?? null,
    romanization: meta.romanization as string | undefined,
    pronunciation: resolvePronunciation(meta),
    englishMeaning: meta.englishMeaning as string | undefined,
    targetLanguage: (meta.targetLanguage as string) ?? undefined,
    showsForeignOptions: exerciseShowsForeignOptions(template, layout),
    pronunciationHint: resolvePronunciation(meta),
    isIntro,
    isNonGraded: isIntro,
    skippable: Boolean(meta.skippable) || ["typing", "listen_type", "missing_letters"].includes(layout),
    phase: meta.phase as string | undefined,
    difficulty: meta.difficulty as number | undefined,
  };
}
