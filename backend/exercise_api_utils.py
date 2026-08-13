"""Validate and sanitize exercises before API responses."""
from __future__ import annotations

import logging
import uuid
from typing import Any

from learning_engine.exercise_validator import DEV_MODE, validate_exercise
from language_registry import normalize_language_code

log = logging.getLogger(__name__)


def _exercise_language_matches(step: dict, expected_language: str | None) -> bool:
    if not expected_language:
        return True
    meta = step.get("metadata") or {}
    ex_lang = meta.get("targetLanguage") or meta.get("language_code") or meta.get("languageCode")
    if not ex_lang:
        return False
    return normalize_language_code(ex_lang) == normalize_language_code(expected_language)


def _exercise_to_validation_dict(exercise: Any) -> dict:
    """Build a step dict from ORM Exercise for validation."""
    meta = exercise.exercise_metadata or {}
    options = []
    for opt in sorted(exercise.options or [], key=lambda o: o.order_index):
        options.append(
            {
                "label": opt.label,
                "is_correct": opt.is_correct,
                "image_url": opt.image_url,
                "pair_key": opt.pair_key,
            }
        )
    if not options and meta.get("options"):
        raw = meta["options"]
        if isinstance(raw, list) and raw and isinstance(raw[0], str):
            correct = exercise.correct_answer or {}
            selected = correct.get("selected")
            options = [{"label": lbl, "is_correct": lbl == selected} for lbl in raw]

    return {
        "type": exercise.type,
        "prompt": exercise.prompt,
        "prompt_audio_url": exercise.prompt_audio_url,
        "correct_answer": exercise.correct_answer,
        "metadata": meta,
        "options": options,
    }


def _word_from_metadata(meta: dict) -> dict | None:
    vid = meta.get("vocabulary_id")
    if not vid:
        return None
    return {
        "id": vid,
        "english": meta.get("englishMeaning") or meta.get("english") or "",
        "target": meta.get("targetWord") or meta.get("target") or "",
    }


def sanitize_lesson_exercises(
    exercises: list[Any],
    *,
    lesson_id: uuid.UUID | str | None = None,
    expected_language: str | None = None,
) -> tuple[list[Any], list[str]]:
    """Filter invalid exercises. Returns (valid_exercises, rejection_reasons)."""
    valid: list[Any] = []
    reasons: list[str] = []
    lid = str(lesson_id) if lesson_id else None

    for ex in sorted(exercises, key=lambda e: e.order_index):
        step = _exercise_to_validation_dict(ex)
        if not _exercise_language_matches(step, expected_language):
            reasons.append(f"order {ex.order_index}: language mismatch (expected {expected_language})")
            log.warning(
                "Lesson %s exercise order %s rejected: language mismatch (expected %s)",
                lid or "—",
                ex.order_index,
                expected_language,
            )
            continue
        word = _word_from_metadata(step.get("metadata") or {})
        ok, reason = validate_exercise(step, word, lesson_id=lid, log_rejection=True)
        if ok:
            valid.append(ex)
        else:
            reasons.append(f"order {ex.order_index}: {reason}")

    if reasons:
        log.warning(
            "Lesson %s: filtered %d/%d invalid exercises",
            lid or "—",
            len(reasons),
            len(exercises),
        )

    if not valid and exercises and DEV_MODE:
        raise ValueError(
            f"Lesson {lid} has no valid exercises after sanitization: {'; '.join(reasons[:5])}"
        )

    return valid, reasons
