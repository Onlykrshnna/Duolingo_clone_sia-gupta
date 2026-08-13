"""Assemble a full lesson from vocabulary — delegates to scheduled generator."""
from __future__ import annotations

from .scheduled_lesson_generator import ScheduledLessonGenerator


class LessonBuilder:
    """Backward-compatible entry point."""

    def __init__(
        self,
        vocabulary: list[dict],
        target_lang: str,
        *,
        accept_romanization: bool = False,
        sentence_drills: list[dict] | None = None,
        prior_vocabulary_ids: list[str] | None = None,
        pool_vocabulary: list[dict] | None = None,
        seed: int | None = 42,
    ):
        self._gen = ScheduledLessonGenerator(
            vocabulary,
            target_lang,
            accept_romanization=accept_romanization,
            sentence_drills=sentence_drills,
            prior_vocabulary_ids=prior_vocabulary_ids,
            pool_vocabulary=pool_vocabulary,
            seed=seed,
        )

    def build_steps(self) -> list[dict]:
        return self._gen.build_steps()
