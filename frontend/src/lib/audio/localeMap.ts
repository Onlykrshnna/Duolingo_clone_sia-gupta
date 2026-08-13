import { normalizeLanguageCode } from "@/lib/languageRegistry";

/** ISO 639-1 → BCP-47 locale for Web Speech API voices */
const SPEECH_LOCALE_MAP: Record<string, string> = {
  ja: "ja-JP",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
  hi: "hi-IN",
  ru: "ru-RU",
  ar: "ar-SA",
  el: "el-GR",
};

/** Convert course / ISO code to a speech synthesis locale. */
export function toSpeechLocale(languageCode: string | null | undefined): string {
  if (!languageCode) return "en-US";
  const trimmed = languageCode.trim();
  if (trimmed.includes("-")) return trimmed;
  const normalized = normalizeLanguageCode(trimmed);
  if (!normalized) return "en-US";
  return SPEECH_LOCALE_MAP[normalized] ?? `${normalized}-${normalized.toUpperCase()}`;
}

export function voiceMatchesLocale(voiceLang: string, locale: string): boolean {
  const v = voiceLang.toLowerCase();
  const l = locale.toLowerCase();
  return v === l || v.startsWith(`${l.split("-")[0]}-`) || l.startsWith(`${v.split("-")[0]}-`);
}
