import { Exercise } from "./types";
import { normalizeLanguageCode } from "./languageRegistry";

/** Languages that always show transliteration when available. */
const NON_LATIN_SCRIPT_LANGUAGES = new Set(["ja", "ko", "zh", "ar", "hi", "ru"]);

/** Latin languages that may show optional pronunciation in Unit 1. */
const OPTIONAL_PRONUNCIATION_LANGUAGES = new Set(["fr", "de"]);

export type VocabEntry = {
  english: string;
  target: string;
  romanization: string;
  pronunciation?: string;
};

export function usesNonLatinScript(languageCode: string | null | undefined): boolean {
  const code = normalizeLanguageCode(languageCode);
  return code ? NON_LATIN_SCRIPT_LANGUAGES.has(code) : false;
}

export function shouldShowPronunciation(
  languageCode: string | null | undefined,
  unitIndex = 0,
  hasPronunciation = false
): boolean {
  if (!hasPronunciation) return false;
  const code = normalizeLanguageCode(languageCode);
  if (!code) return false;
  if (NON_LATIN_SCRIPT_LANGUAGES.has(code)) return true;
  if (OPTIONAL_PRONUNCIATION_LANGUAGES.has(code)) return unitIndex === 0;
  return false;
}

/** Display-friendly pronunciation (lowercase for CJK-style langs). */
export function formatPronunciationDisplay(
  languageCode: string | null | undefined,
  pronunciation: string | null | undefined
): string | undefined {
  if (!pronunciation?.trim()) return undefined;
  const code = normalizeLanguageCode(languageCode);
  if (code && NON_LATIN_SCRIPT_LANGUAGES.has(code)) {
    return pronunciation.trim().toLowerCase();
  }
  return pronunciation.trim();
}

export function resolvePronunciation(
  meta: Record<string, unknown> | undefined
): string | undefined {
  if (!meta) return undefined;
  const raw = (meta.pronunciation as string) || (meta.romanization as string) || "";
  return raw.trim() || undefined;
}

export function buildPronunciationLookup(
  exercises: Exercise[],
  vocabMap: Map<string, VocabEntry>,
  languageCode: string
): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const entry of vocabMap.values()) {
    if (!entry.target) continue;
    const pron = formatPronunciationDisplay(
      languageCode,
      entry.pronunciation || entry.romanization
    );
    if (pron) lookup.set(entry.target, pron);
  }

  for (const ex of exercises) {
    const meta = ex.metadata ?? {};
    const target = (meta.targetWord as string) || (meta.target as string);
    const pron = formatPronunciationDisplay(languageCode, resolvePronunciation(meta));
    if (target && pron) lookup.set(target, pron);

    const optionPron = meta.optionPronunciations as Record<string, string> | undefined;
    if (optionPron && typeof optionPron === "object") {
      for (const [target, pron] of Object.entries(optionPron)) {
        const formatted = formatPronunciationDisplay(languageCode, pron);
        if (target && formatted) lookup.set(target, formatted);
      }
    }

    if (Array.isArray(meta.options)) {
      for (const opt of meta.options as Array<Record<string, unknown> | string>) {
        if (typeof opt === "string") continue;
        const label = (opt.targetWord as string) || (opt.label as string);
        const optPron = formatPronunciationDisplay(
          languageCode,
          (opt.pronunciation as string) || (opt.romanization as string)
        );
        if (label && optPron) lookup.set(label, optPron);
      }
    }
  }

  return lookup;
}

const FOREIGN_OPTION_TEMPLATES = new Set([
  "select_foreign",
  "foreign_cards",
  "tap_word",
  "tap_chips",
  "fill_blank",
  "conversation",
  "mini_conversation",
  "drag_drop",
  "word_bank",
  "match_pairs",
  "picture_recognition",
  "picture_grid",
  "listen_image",
]);

export function exerciseShowsForeignOptions(template: string, layout: string): boolean {
  return FOREIGN_OPTION_TEMPLATES.has(template) || FOREIGN_OPTION_TEMPLATES.has(layout);
}
