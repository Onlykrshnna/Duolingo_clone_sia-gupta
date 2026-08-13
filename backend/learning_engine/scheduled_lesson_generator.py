"""
Scheduled lesson generator — interleaved spaced learning pipeline.

Delegates to LessonScheduler for pedagogy; keeps backward-compatible API.
"""
from __future__ import annotations

import random

from .analytics_tracker import AnalyticsTracker
from .difficulty_engine import DifficultyEngine
from .exercise_generator import ExerciseGenerator
from .lesson_scheduler import LessonScheduler
from .question_factory import QuestionFactory
from .review_engine import ReviewEngine
from .vocabulary_pool import VocabularyPool
from .vocabulary_tracker import VocabularyTracker


class ScheduledLessonGenerator:
    MAX_APPEARANCES_PER_WORD = 5

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
        self.rng = random.Random(seed)
        self.lesson_word_ids = {w["id"] for w in vocabulary}
        pool_words = pool_vocabulary or vocabulary
        self.pool = VocabularyPool(pool_words)
        self.factory = QuestionFactory(
            self.pool, target_lang, accept_romanization=accept_romanization, rng=self.rng
        )
        self.difficulty = DifficultyEngine()
        self.generator = ExerciseGenerator(self.factory, self.difficulty, rng=self.rng, target_lang=target_lang)
        self.review = ReviewEngine(self.generator, self.difficulty, rng=self.rng)
        if prior_vocabulary_ids:
            self.review.set_prior_vocabulary(prior_vocabulary_ids)
        self.scheduler = LessonScheduler(
            self.pool,
            self.generator,
            self.review,
            self.difficulty,
            lesson_word_ids=self.lesson_word_ids,
            rng=self.rng,
        )
        self.sentence_drills = sentence_drills or []

    def build_steps(self) -> list[dict]:
        return self.scheduler.build_lesson(sentence_drills=self.sentence_drills)
