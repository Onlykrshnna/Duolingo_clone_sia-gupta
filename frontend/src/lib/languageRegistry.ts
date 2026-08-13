/**
 * Central language registry — single source of truth for codes, names, and flag assets.
 * ISO 639-1 codes are canonical; flag filenames use conventional codes (ja → jp.svg).
 */

export interface LanguageDefinition {
  languageCode: string;
  languageName: string;
  nativeName: string;
  /** Public URL path to the flag SVG */
  flagAsset: string;
}

/** Map ISO code → flag filename when they differ */
const FLAG_FILE_OVERRIDES: Record<string, string> = {
  ja: "jp",
  zh: "cn",
  en: "us",
};

const FLAGS_BASE = "/flags";

function flagPath(code: string): string {
  const file = FLAG_FILE_OVERRIDES[code] ?? code;
  return `${FLAGS_BASE}/${file}.svg`;
}

export const LANGUAGE_REGISTRY: LanguageDefinition[] = [
  { languageCode: "es", languageName: "Spanish", nativeName: "Español", flagAsset: flagPath("es") },
  { languageCode: "fr", languageName: "French", nativeName: "Français", flagAsset: flagPath("fr") },
  { languageCode: "de", languageName: "German", nativeName: "Deutsch", flagAsset: flagPath("de") },
  { languageCode: "ja", languageName: "Japanese", nativeName: "日本語", flagAsset: flagPath("ja") },
  { languageCode: "ko", languageName: "Korean", nativeName: "한국어", flagAsset: flagPath("ko") },
  { languageCode: "it", languageName: "Italian", nativeName: "Italiano", flagAsset: flagPath("it") },
  { languageCode: "pt", languageName: "Portuguese", nativeName: "Português", flagAsset: flagPath("pt") },
  { languageCode: "en", languageName: "English", nativeName: "English", flagAsset: flagPath("en") },
  { languageCode: "zh", languageName: "Chinese", nativeName: "中文", flagAsset: flagPath("zh") },
  { languageCode: "hi", languageName: "Hindi", nativeName: "हिन्दी", flagAsset: flagPath("hi") },
  { languageCode: "ru", languageName: "Russian", nativeName: "Русский", flagAsset: flagPath("ru") },
];

export const DEFAULT_FLAG_ASSET = `${FLAGS_BASE}/default.svg`;

const REGISTRY_BY_CODE = new Map(LANGUAGE_REGISTRY.map((l) => [l.languageCode, l]));

/** Emoji / legacy path → ISO code */
const LEGACY_FLAG_MAP: Record<string, string> = {
  "🇪🇸": "es",
  "🇫🇷": "fr",
  "🇩🇪": "de",
  "🇯🇵": "ja",
  "🇰🇷": "ko",
  "🇮🇹": "it",
  "🇺🇸": "en",
  "🇬🇧": "en",
  "🇨🇳": "zh",
  "🇮🇳": "hi",
  "🇷🇺": "ru",
  "/flags/es.svg": "es",
  "/flags/fr.svg": "fr",
  "/flags/de.svg": "de",
  "/flags/jp.svg": "ja",
  "/flags/ja.svg": "ja",
  "/flags/ko.svg": "ko",
  "/flags/it.svg": "it",
};

export function getLanguageByCode(code: string | null | undefined): LanguageDefinition | undefined {
  if (!code) return undefined;
  const normalized = normalizeLanguageCode(code);
  return normalized ? REGISTRY_BY_CODE.get(normalized) : undefined;
}

export function normalizeLanguageCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (LEGACY_FLAG_MAP[trimmed]) return LEGACY_FLAG_MAP[trimmed];
  if (trimmed.startsWith("/flags/")) {
    const file = trimmed.replace("/flags/", "").replace(".svg", "");
    const reverse = Object.entries(FLAG_FILE_OVERRIDES).find(([, v]) => v === file);
    if (reverse) return reverse[0];
    return file;
  }
  const lower = trimmed.toLowerCase();
  if (REGISTRY_BY_CODE.has(lower)) return lower;
  return lower.length <= 5 ? lower : null;
}

export function getFlagAsset(codeOrLegacy: string | null | undefined): string {
  const normalized = normalizeLanguageCode(codeOrLegacy);
  const lang = normalized ? REGISTRY_BY_CODE.get(normalized) : undefined;
  return lang?.flagAsset ?? DEFAULT_FLAG_ASSET;
}

export function getLanguageName(code: string | null | undefined): string {
  return getLanguageByCode(code)?.languageName ?? (code ? code.toUpperCase() : "—");
}

export function getNativeName(code: string | null | undefined): string {
  return getLanguageByCode(code)?.nativeName ?? getLanguageName(code);
}

/** @deprecated Use getFlagAsset — resolves any legacy value to a flag path */
export function resolveDisplayFlag(
  selectedLanguage: string | null | undefined,
  courseFlagIcon: string | undefined
): string {
  return getFlagAsset(selectedLanguage ?? courseFlagIcon);
}
