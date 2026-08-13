"""Comprehensive exercise validation with structured rejection logging."""
from __future__ import annotations

import logging
import os
import re
from typing import Any

from models import ExerciseType

from . import template_catalog as T

log = logging.getLogger(__name__)

DEV_MODE = os.getenv("ENV", "development").lower() in ("development", "dev", "local")
MAX_GENERATION_RETRIES = 3

_EMPTY_QUOTE_PATTERN = re.compile(r'["\']\s*["\']|for\s+["\']\s*["\']|=\s*["\']\s*["\']')


def _is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    return False


def validate_word(word: dict | None) -> tuple[bool, str]:
    if not word:
        return False, "missing vocabulary word"
    if _is_blank(word.get("id")):
        return False, "missing word id"
    if _is_blank(word.get("english")):
        return False, "missing source text"
    if _is_blank(word.get("target")):
        return False, "missing target text"
    return True, ""


def validate_prompt(step: dict, word: dict | None, template: str) -> tuple[bool, str]:
    ex_type = step.get("type")
    if ex_type == ExerciseType.intro:
        meta = step.get("metadata") or {}
        if _is_blank(meta.get("targetWord")):
            return False, "intro missing target word"
        meaning = meta.get("englishMeaning") or meta.get("english") or meta.get("meaning")
        if _is_blank(meaning):
            return False, "intro missing meaning"
        return True, ""

    prompt = (step.get("prompt") or "").strip()
    if _is_blank(prompt) and template not in (T.PICTURE_RECOGNITION, T.IMAGE_VOCAB, T.LISTEN_IMAGE):
        return False, "empty prompt"

    if _EMPTY_QUOTE_PATTERN.search(prompt):
        return False, "prompt contains empty quoted text"

    if word and word.get("english"):
        eng = word["english"].strip()
        if f'"{eng}"' not in prompt and f"'{eng}'" not in prompt:
            if template in (T.TAP_WORD, T.SELECT_FOREIGN, T.FILL_BLANK, T.TYPE_TARGET):
                if '""' in prompt or "''" in prompt:
                    return False, "prompt missing source text"

    return True, ""


def validate_choices(step: dict, template: str) -> tuple[bool, str]:
    ex_type = step.get("type")
    if ex_type not in (
        ExerciseType.multiple_choice,
        ExerciseType.fill_blank,
        ExerciseType.image_selection,
        ExerciseType.listening,
    ):
        return True, ""

    correct = step.get("correct_answer") or {}
    selected = correct.get("selected")
    if selected is None:
        return False, "no correct selection"
    if _is_blank(str(selected)):
        return False, "empty correct selection"

    options = step.get("options") or []
    meta_opts = step.get("metadata", {}).get("options") or []
    labels: list[str] = []

    if meta_opts and isinstance(meta_opts[0], dict):
        labels = [
            str(o.get("targetWord") or o.get("label"))
            for o in meta_opts
            if isinstance(o, dict) and (o.get("targetWord") or o.get("label"))
        ]
    elif meta_opts and isinstance(meta_opts[0], str):
        labels = [str(o) for o in meta_opts if o is not None]
    elif options:
        labels = [str(o.get("label")) for o in options if o.get("label") is not None]

    if not labels:
        return False, "no options"

    str_labels = [str(l) for l in labels]
    if any(_is_blank(l) for l in str_labels):
        return False, "empty option label"

    if len(set(str_labels)) != len(str_labels):
        return False, "duplicate options"

    if str(selected) not in str_labels:
        return False, "correct answer not in options"

    if options:
        correct_count = sum(1 for o in options if o.get("is_correct"))
        if correct_count != 1:
            return False, "must have exactly one correct option"

    return True, ""


def validate_translation(step: dict, word: dict | None) -> tuple[bool, str]:
    if not word:
        return True, ""
    ok, reason = validate_word(word)
    if not ok:
        return ok, reason

    meta = step.get("metadata", {})
    if _is_blank(meta.get("englishMeaning")) and _is_blank(meta.get("targetWord")):
        if step.get("type") != ExerciseType.match_pairs:
            return False, "missing translation metadata"
    return True, ""


def validate_audio(step: dict, word: dict | None, template: str) -> tuple[bool, str]:
    audio_templates = {T.LISTENING, T.LISTEN_TYPE, T.LISTEN_IMAGE, T.SPEAKING}
    if template not in audio_templates:
        return True, ""
    if step.get("prompt_audio_url"):
        return True, ""
    if word and word.get("audio"):
        return True, ""
    return False, "missing audio for listening exercise"


def validate_image(step: dict, word: dict | None, template: str) -> tuple[bool, str]:
    image_templates = {T.PICTURE_RECOGNITION, T.IMAGE_VOCAB, T.LISTEN_IMAGE}
    if template not in image_templates:
        return True, ""

    meta = step.get("metadata", {})
    cards = meta.get("options") or []
    if isinstance(cards, list) and cards:
        if isinstance(cards[0], dict):
            has_image = any(c.get("image") for c in cards if isinstance(c, dict))
            if has_image:
                return True, ""
    if word and word.get("image"):
        return True, ""
    opts = step.get("options") or []
    if any(o.get("image_url") for o in opts):
        return True, ""
    return False, "missing image for picture exercise"


def validate_conversation(step: dict, word: dict | None, template: str) -> tuple[bool, str]:
    if template != T.MINI_CONVERSATION:
        return True, ""
    from .conversation_scenarios import get_scenario_for_word

    if not word or get_scenario_for_word(word) is None:
        return False, "missing conversation scenario"
    prompt = (step.get("prompt") or "").strip()
    if _is_blank(prompt):
        return False, "empty conversation prompt"
    return True, ""


def validate_type_answer(step: dict) -> tuple[bool, str]:
    if step.get("type") != ExerciseType.type_answer:
        return True, ""
    correct = step.get("correct_answer") or {}
    text = correct.get("text")
    if _is_blank(text):
        return False, "missing correct text"
    alts = step.get("metadata", {}).get("alternatives") or []
    if not alts:
        alts = [text]
    if not any(not _is_blank(a) for a in alts):
        return False, "no acceptable answers"
    return True, ""


def validate_word_bank(step: dict) -> tuple[bool, str]:
    if step.get("type") != ExerciseType.word_bank:
        return True, ""
    words = (step.get("correct_answer") or {}).get("words") or []
    tokens = step.get("metadata", {}).get("tokens") or []
    if not words or any(_is_blank(w) for w in words):
        return False, "empty word bank answer"
    if any(_is_blank(t) for t in tokens):
        return False, "empty word bank token"
    for w in words:
        if tokens.count(w) < words.count(w):
            return False, "word bank tokens missing answer pieces"
    return True, ""


def validate_match_pairs(step: dict) -> tuple[bool, str]:
    if step.get("type") != ExerciseType.match_pairs:
        return True, ""
    pairs = (step.get("correct_answer") or {}).get("pairs") or {}
    if len(pairs) < 3:
        return False, "match needs at least 3 pairs"
    for left, right in pairs.items():
        if _is_blank(left) or _is_blank(right):
            return False, "match pair contains blank text"
    left = step.get("metadata", {}).get("left") or []
    if len(set(left)) != len(left):
        return False, "duplicate match labels"
    return True, ""


def validate_fill_blank_logic(step: dict, word: dict | None, template: str) -> tuple[bool, str]:
    if template != T.FILL_BLANK or not word:
        return True, ""
    selected = (step.get("correct_answer") or {}).get("selected")
    if str(selected) == word.get("english"):
        return False, "fill_blank answer is english gloss not target word"
    english = word.get("english", "")
    prompt = step.get("prompt") or ""
    if english and (f'Complete: {english} means' in prompt or f'{english} means "{english}"' in prompt):
        return False, "tautological fill_blank prompt"
    return True, ""


def validate_exercise(
    step: dict,
    word: dict | None = None,
    *,
    lesson_id: str | None = None,
    log_rejection: bool = True,
) -> tuple[bool, str]:
    """Run all validation checks. Returns (ok, reason)."""
    template = step.get("metadata", {}).get("template", "")
    checks = [
        validate_word(word) if word and step.get("type") != ExerciseType.match_pairs else (True, ""),
        validate_prompt(step, word, template),
        validate_translation(step, word),
        validate_choices(step, template),
        validate_type_answer(step),
        validate_word_bank(step),
        validate_match_pairs(step),
        validate_fill_blank_logic(step, word, template),
        validate_audio(step, word, template),
        validate_image(step, word, template),
        validate_conversation(step, word, template),
    ]

    for ok, reason in checks:
        if not ok:
            if log_rejection:
                log_rejected_exercise(
                    template=template,
                    lesson_id=lesson_id,
                    word=word,
                    reason=reason,
                    language=step.get("metadata", {}).get("targetLanguage"),
                )
            return False, reason

    return True, ""


def log_rejected_exercise(
    *,
    template: str,
    reason: str,
    lesson_id: str | None = None,
    word: dict | None = None,
    language: str | None = None,
) -> None:
    word_id = word.get("id") if word else "—"
    word_label = word.get("english") if word else "unknown"
    log.warning(
        "Rejected exercise: template=%s lessonId=%s word=%s (%s) language=%s reason=%s",
        template,
        lesson_id or "—",
        word_id or "—",
        word_label,
        language or "—",
        reason,
    )


def step_word_id(word: dict | None) -> str | None:
    return word.get("id") if word else None


def template_eligible(template: str, word: dict, pool_size: int) -> bool:
    """Can this template produce a valid exercise for this word?"""
    from .conversation_scenarios import get_scenario_for_word

    ok, _ = validate_word(word)
    if not ok:
        return False

    if template == T.PICTURE_RECOGNITION and not word.get("image"):
        return pool_size >= 3
    if template in (T.LISTENING, T.LISTEN_TYPE, T.LISTEN_IMAGE, T.SPEAKING):
        return bool(word.get("audio"))
    if template == T.MINI_CONVERSATION:
        return get_scenario_for_word(word) is not None
    if template == T.MISSING_LETTERS:
        return len(word.get("target", "")) >= 3
    if template == T.WORD_BANK:
        return len(word.get("target", "")) >= 2
    if template == T.FILL_BLANK:
        return bool(word.get("english") and word.get("target"))
    return True
