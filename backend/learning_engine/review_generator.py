"""Mixed review blocks — one diverse question per word."""
from __future__ import annotations

import random

from . import template_catalog as T
from .mastery_tracker import MasteryTracker
from .progress_tracker import ProgressTracker
from .question_factory import QuestionFactory
from .question_scheduler import QuestionScheduler
from .vocabulary_pool import VocabularyPool


class ReviewGenerator:
    REVIEW_EVERY_N_WORDS = 4

    def __init__(
        self,
        pool: VocabularyPool,
        factory: QuestionFactory,
        scheduler: QuestionScheduler,
        *,
        rng: random.Random | None = None,
    ):
        self.pool = pool
        self.factory = factory
        self.scheduler = scheduler
        self.rng = rng or random.Random(0)

    def should_insert_review(self, introduced_count: int) -> bool:
        return introduced_count > 0 and introduced_count % self.REVIEW_EVERY_N_WORDS == 0

    def generate_block(
        self,
        introduced_ids: list[str],
        mastery: MasteryTracker,
        progress: ProgressTracker,
        *,
        memory: bool = False,
    ) -> list[dict]:
        steps: list[dict] = []
        review_ids = introduced_ids[-self.REVIEW_EVERY_N_WORDS :]

        for word_id in review_ids:
            if not progress.can_use(word_id):
                continue
            picked = self.scheduler.pick_review_question(
                [word_id],
                self.pool.get,
                mastery,
                progress,
                phase=T.MIXED_REVIEW,
            )
            if not picked:
                continue
            template, word = picked
            steps.append(self.factory.build(template, word, phase=T.MIXED_REVIEW))
            progress.record(word_id)
            mastery.mark_practiced(word_id)

        if len(review_ids) >= 3:
            words = [self.pool.get(wid) for wid in review_ids if self.pool.get(wid)]
            words = [w for w in words if w]
            if words:
                steps.append(self.factory.build_match(words[:4], phase=T.MIXED_REVIEW, memory=memory))

        return steps

    def generate_final(
        self,
        introduced_ids: list[str],
        mastery: MasteryTracker,
        progress: ProgressTracker,
        *,
        max_questions: int = 4,
    ) -> list[dict]:
        steps: list[dict] = []
        attempts = 0
        used: set[str] = set()

        while len(steps) < max_questions and attempts < max_questions * 3:
            attempts += 1
            eligible = [wid for wid in introduced_ids if progress.can_use(wid) and wid not in used]
            if not eligible:
                break
            picked = self.scheduler.pick_review_question(
                eligible,
                self.pool.get,
                mastery,
                progress,
                phase=T.MIXED_REVIEW,
            )
            if not picked:
                break
            template, word = picked
            steps.append(self.factory.build(template, word, phase=T.MIXED_REVIEW))
            progress.record(word["id"])
            mastery.mark_practiced(word["id"])
            used.add(word["id"])

        return steps

    def generate_boss(
        self,
        introduced_ids: list[str],
        mastery: MasteryTracker,
        progress: ProgressTracker,
        *,
        max_questions: int = 5,
    ) -> list[dict]:
        """Lesson boss — random mix from all vocabulary."""
        steps: list[dict] = []
        picks = self.scheduler.pick_boss_templates(
            introduced_ids,
            self.pool.get,
            count=max_questions,
        )
        for template, word in picks:
            if not progress.can_use(word["id"]):
                continue
            steps.append(self.factory.build(template, word, phase=T.BOSS_REVIEW))
            progress.record(word["id"])
            mastery.mark_practiced(word["id"])

        if len(introduced_ids) >= 3:
            words = [self.pool.get(wid) for wid in introduced_ids if self.pool.get(wid)]
            words = [w for w in words if w]
            if words:
                self.rng.shuffle(words)
                steps.append(
                    self.factory.build_match(words[: min(4, len(words))], phase=T.BOSS_REVIEW, memory=True)
                )
        return steps
