"""Central language registry — codes, names, and flag asset paths."""
from __future__ import annotations

FLAGS_BASE = "/flags"

FLAG_FILE_OVERRIDES: dict[str, str] = {
    "ja": "jp",
    "zh": "cn",
    "en": "us",
}

LANGUAGE_REGISTRY: dict[str, dict[str, str]] = {
    "es": {"languageName": "Spanish", "nativeName": "Español"},
    "fr": {"languageName": "French", "nativeName": "Français"},
    "de": {"languageName": "German", "nativeName": "Deutsch"},
    "ja": {"languageName": "Japanese", "nativeName": "日本語"},
    "ko": {"languageName": "Korean", "nativeName": "한국어"},
    "it": {"languageName": "Italian", "nativeName": "Italiano"},
    "pt": {"languageName": "Portuguese", "nativeName": "Português"},
    "en": {"languageName": "English", "nativeName": "English"},
    "zh": {"languageName": "Chinese", "nativeName": "中文"},
    "hi": {"languageName": "Hindi", "nativeName": "हिन्दी"},
    "ru": {"languageName": "Russian", "nativeName": "Русский"},
}

LEGACY_FLAG_MAP: dict[str, str] = {
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
}

DEFAULT_FLAG_ASSET = f"{FLAGS_BASE}/default.svg"


def _flag_filename(code: str) -> str:
    return FLAG_FILE_OVERRIDES.get(code, code)


def normalize_language_code(value: str | None) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    if trimmed in LEGACY_FLAG_MAP:
        return LEGACY_FLAG_MAP[trimmed]
    if trimmed.startswith("/flags/"):
        file_stem = trimmed.replace("/flags/", "").replace(".svg", "")
        for iso, fname in FLAG_FILE_OVERRIDES.items():
            if fname == file_stem:
                return iso
        return file_stem
    lower = trimmed.lower()
    if lower in LANGUAGE_REGISTRY:
        return lower
    return lower if len(lower) <= 5 else None


def get_flag_asset(code_or_legacy: str | None) -> str:
    code = normalize_language_code(code_or_legacy)
    if code and code in LANGUAGE_REGISTRY:
        return f"{FLAGS_BASE}/{_flag_filename(code)}.svg"
    return DEFAULT_FLAG_ASSET


def get_language_name(code: str | None) -> str:
    normalized = normalize_language_code(code)
    if normalized and normalized in LANGUAGE_REGISTRY:
        return LANGUAGE_REGISTRY[normalized]["languageName"]
    return (code or "—").upper() if code else "—"
