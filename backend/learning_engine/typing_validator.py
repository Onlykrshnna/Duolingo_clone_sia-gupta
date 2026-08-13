"""Enhanced typing answer validation."""
from __future__ import annotations

import re
import unicodedata


def normalize_answer(text: str) -> str:
    """trim → NFKC → lowercase → collapse whitespace → strip punctuation edges."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKC", text.strip())
    collapsed = re.sub(r"\s+", " ", normalized)
    lowered = collapsed.lower()
    return lowered.strip(".,!?;:\"'""''「」")


def answers_match(submitted: str, acceptable: str) -> bool:
    return normalize_answer(submitted) == normalize_answer(acceptable)


def answer_in_set(submitted: str, acceptable_values: list[str]) -> bool:
    normalized = normalize_answer(submitted)
    if not normalized:
        return False
    acceptable = {normalize_answer(a) for a in acceptable_values if a}
    if normalized in acceptable:
        return True
    stripped = normalized.rstrip(".,!?")
    return stripped in acceptable or any(stripped == a.rstrip(".,!?") for a in acceptable)
