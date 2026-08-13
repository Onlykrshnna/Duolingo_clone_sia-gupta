import {
  getLanguageName,
  getNativeName,
  getLanguageByCode,
  getFlagAsset,
  normalizeLanguageCode,
  LANGUAGE_REGISTRY,
} from "./languageRegistry";

export {
  getLanguageName,
  getNativeName,
  getLanguageByCode,
  getFlagAsset,
  normalizeLanguageCode,
  LANGUAGE_REGISTRY,
};

export function formatCourseDirection(
  source: string | null | undefined,
  target: string | null | undefined
): string {
  return `${getLanguageName(source)} → ${getLanguageName(target)}`;
}
