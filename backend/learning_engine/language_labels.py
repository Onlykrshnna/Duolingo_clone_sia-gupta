"""Language-agnostic labels for English → target courses."""
from __future__ import annotations

TARGET_LANGUAGE_LABELS: dict[str, str] = {
    "ja": "Japanese",
    "es": "Spanish",
    "de": "German",
    "fr": "French",
    "en": "English",
}


def get_target_language_label(code: str) -> str:
    return TARGET_LANGUAGE_LABELS.get(code, "target language")
