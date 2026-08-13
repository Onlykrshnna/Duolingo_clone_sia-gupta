"""Normalize vocabulary entries from lesson JSON."""
from __future__ import annotations


def normalize_vocab_word(raw: dict) -> dict:
    pronunciation = raw.get("pronunciation") or raw.get("romanization") or ""
    english = raw.get("meaning") or raw.get("english") or raw.get("englishMeaning", "")
    target = raw.get("native") or raw.get("target") or raw.get("targetWord", "")
    return {
        "id": raw["id"],
        "english": english,
        "target": target,
        "romanization": raw.get("romanization", ""),
        "pronunciation": pronunciation,
        "image": raw.get("image"),
        "audio": raw.get("audio"),
        "exampleSentence": raw.get("exampleSentence"),
        "difficulty": raw.get("difficulty", 1),
        "category": raw.get("category", "general"),
        "conversationScenario": raw.get("conversationScenario"),
    }
