"""Wraps QuestionFactory with audio gating, validation, and stage metadata."""
from __future__ import annotations

import random

from . import template_catalog as T
from .difficulty_engine import DifficultyEngine
from .exercise_validator import MAX_GENERATION_RETRIES, log_rejected_exercise, template_eligible, validate_exercise
from .question_factory import QuestionFactory


class ExerciseGenerator:
    """Generates exercises with capability checks, validation, and natural prompts."""

    FALLBACK_TEMPLATES = [
        T.SELECT_FOREIGN,
        T.SELECT_MEANING,
        T.TAP_WORD,
        T.TRUE_FALSE,
        T.PICTURE_RECOGNITION,
    ]

    def __init__(
        self,
        factory: QuestionFactory,
        difficulty: DifficultyEngine,
        *,
        rng: random.Random | None = None,
        target_lang: str = "",
    ):
        self.factory = factory
        self.difficulty = difficulty
        self.rng = rng or random.Random(0)
        self.target_lang = target_lang

    def generate(self, template: str, word: dict, *, phase: str = "practice", stage_key: str = "") -> dict | None:
        result = self.generate_validated(template, word, phase=phase, stage_key=stage_key)
        return result[0] if result else None

    def generate_validated(
        self,
        template: str,
        word: dict,
        *,
        phase: str = "practice",
        stage_key: str = "",
        max_attempts: int | None = None,
        lesson_id: str | None = None,
    ) -> tuple[dict, str] | None:
        pool_size = len(self.factory.pool.words)
        attempts_limit = max_attempts if max_attempts is not None else MAX_GENERATION_RETRIES
        candidates = [template] + [t for t in self.FALLBACK_TEMPLATES if t != template]
        tried: set[str] = set()
        last_reason = "unknown"

        for attempt in range(attempts_limit * 2):
            if len(tried) >= len(candidates):
                break
            t = candidates[attempt % len(candidates)] if attempt < len(candidates) else self.rng.choice(self.FALLBACK_TEMPLATES)
            if t in tried:
                continue
            tried.add(t)
            if not template_eligible(t, word, pool_size):
                last_reason = f"template {t} not eligible"
                continue
            resolved = self.difficulty.resolve_template(t, word)
            step = self.factory.build(resolved, word, phase=phase)
            meta = step.setdefault("metadata", {})
            meta["requested_template"] = t
            meta["template"] = resolved
            meta["targetLanguage"] = self.target_lang
            if stage_key:
                meta["stage_key"] = stage_key
            meta["difficulty"] = self.difficulty.difficulty_for_step(
                resolved, meta.get("layout", resolved), phase=phase
            )
            meta["skippable"] = step.get("type") and str(step["type"]) in (
                "type_answer",
                "translate",
            ) or meta.get("layout") in ("typing", "listen_type", "missing_letters")

            ok, reason = validate_exercise(step, word, lesson_id=lesson_id, log_rejection=True)
            if ok:
                return step, resolved
            last_reason = reason
            meta["validationRetry"] = reason

        log_rejected_exercise(
            template=template,
            lesson_id=lesson_id,
            word=word,
            language=self.target_lang,
            reason=f"exhausted retries ({last_reason})",
        )
        return None

    def generate_match(self, words: list[dict], *, phase: str = "review", memory: bool = False) -> dict | None:
        valid_words = [w for w in words if w.get("english") and w.get("target")]
        if len(valid_words) < 3:
            return None
        step = self.factory.build_match(valid_words, phase=phase, memory=memory)
        ok, reason = validate_exercise(step, None)
        if ok:
            return step
        log_rejected_exercise(template=T.MATCH_PAIRS, reason=reason, word=None)
        return None

    def generate_sentence_drill(self, drill: dict) -> dict | None:
        step = self.factory.build_word_bank_sentence(drill)
        ok, _ = validate_exercise(step, None)
        return step if ok else None
