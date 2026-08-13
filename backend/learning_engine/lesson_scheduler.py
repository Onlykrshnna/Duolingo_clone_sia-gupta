"""
Interleaved lesson scheduler — efficient vocabulary teaching.

Goals: 10–15 words, ~20–25 total steps, max 2 appearances per word,
balanced templates, validated exercises, gradual difficulty.
"""
from __future__ import annotations

import random

from . import template_catalog as T
from .analytics_tracker import AnalyticsTracker
from .difficulty_engine import DifficultyEngine
from .exercise_generator import ExerciseGenerator
from .question_validator import template_eligible
from .review_engine import ReviewEngine
from .template_balancer import TemplateBalancer, WordFrequencyTracker
from .vocabulary_pool import VocabularyPool
from .vocabulary_tracker import VocabularyTracker


class LessonScheduler:
    MAX_PRACTICE_PER_WORD = 1
    TARGET_TOTAL_STEPS = 25

    EARLY_TEMPLATES = [T.PICTURE_RECOGNITION, T.SELECT_FOREIGN, T.TAP_WORD, T.IMAGE_VOCAB]
    MID_TEMPLATES = [T.SELECT_MEANING, T.TRUE_FALSE, T.FILL_BLANK]
    LATE_TEMPLATES = [T.TYPE_TARGET, T.WORD_BANK, T.MINI_CONVERSATION, T.DRAG_DROP]

    def __init__(
        self,
        pool: VocabularyPool,
        generator: ExerciseGenerator,
        review: ReviewEngine,
        difficulty: DifficultyEngine,
        *,
        lesson_word_ids: set[str] | None = None,
        rng: random.Random | None = None,
    ):
        self.pool = pool
        self.generator = generator
        self.review = review
        self.difficulty = difficulty
        self.lesson_word_ids = lesson_word_ids
        self.rng = rng or random.Random(0)
        self.tracker = VocabularyTracker()
        self.analytics = AnalyticsTracker()
        self.balancer = TemplateBalancer()
        self.frequency = WordFrequencyTracker()

        self._last_vocab: str | None = None
        self._last_template: str | None = None
        self._last_category: str | None = None

    def build_lesson(self, *, sentence_drills: list[dict] | None = None) -> list[dict]:
        from .exercise_validator import validate_word

        words = [
            w
            for w in self.pool.words
            if validate_word(w)[0]
            and (not self.lesson_word_ids or w["id"] in self.lesson_word_ids)
        ]
        if not words:
            return []

        steps: list[dict] = []
        step_index = 0
        intro_idx = 0
        introduced_ids: list[str] = []
        practice_queue: list[tuple[str, int]] = []
        practice_counts: dict[str, int] = {}
        review_block_count = 0
        total_words = len(words)

        def get_word(wid: str) -> dict | None:
            return self.pool.get(wid)

        def append_step(step: dict, word_id: str | None, template: str, *, is_intro: bool = False) -> bool:
            nonlocal step_index
            if word_id and word_id == self._last_vocab:
                return False
            if word_id and not self.frequency.can_use(word_id) and not is_intro:
                return False
            meta = step.setdefault("metadata", {})
            meta.setdefault("schedulerPosition", step_index)
            if word_id:
                meta["vocabularyState"] = self.tracker.get(word_id).to_dict()
            steps.append(step)
            step_index += 1
            if word_id:
                self.frequency.record(word_id)
                self._last_vocab = word_id
            self._last_template = template
            self._last_category = self.difficulty.layout_category(template)
            self.balancer.record(template, is_intro=is_intro)
            return True

        def can_use(wid: str) -> bool:
            return self.frequency.can_use(wid)

        while intro_idx < len(words) or practice_queue:
            if len(steps) >= self.TARGET_TOTAL_STEPS:
                break

            candidates: list[tuple[str, dict | None, int | None]] = []

            if intro_idx < len(words):
                w = words[intro_idx]
                if w["id"] != self._last_vocab:
                    candidates.append(("intro", w, None))

            for word_id, word_idx in practice_queue:
                if word_id != self._last_vocab and self.frequency.can_use(word_id):
                    w = get_word(word_id)
                    if w:
                        candidates.append(("practice", w, word_idx))

            if not candidates:
                break

            action, word, word_idx = self._pick_candidate(candidates, intro_idx < len(words))

            if action == "intro" and word:
                result = self.generator.generate_validated(
                    T.FLASHCARD_INTRO, word, phase="introduce", stage_key="introduce"
                )
                if not result:
                    intro_idx += 1
                    continue
                step, tmpl = result
                self.tracker.mark_introduced(word["id"], step_index=step_index)
                self.analytics.record_intro(word["id"])
                if not append_step(step, word["id"], tmpl, is_intro=True):
                    intro_idx += 1
                    continue

                introduced_ids.append(word["id"])
                practice_queue.append((word["id"], intro_idx - 1))
                intro_idx += 1

                if self.review.should_insert_review(len(introduced_ids)):
                    review_block_count += 1
                    review_steps = self.review.build_mixed_review(
                        introduced_ids,
                        get_word,
                        self.tracker,
                        last_vocab=self._last_vocab,
                        last_template=self._last_template,
                        last_category=self._last_category,
                        step_index=step_index,
                        memory=review_block_count % 2 == 0,
                        can_use_word=can_use,
                    )
                    for rs in review_steps:
                        tmpl = rs.get("metadata", {}).get("template", "")
                        vid = rs.get("metadata", {}).get("vocabulary_id")
                        steps.append(rs)
                        step_index += 1
                        if vid:
                            self.frequency.record(vid)
                        self.balancer.record(tmpl)
                        self._last_template = tmpl
                        self._last_category = self.difficulty.layout_category(tmpl)
                        if vid:
                            self._last_vocab = vid

            elif action == "practice" and word is not None and word_idx is not None:
                word_id = word["id"]
                if practice_counts.get(word_id, 0) >= self.MAX_PRACTICE_PER_WORD:
                    practice_queue = [(wid, i) for wid, i in practice_queue if wid != word_id]
                    continue

                template = self._pick_practice_template(word, word_idx, total_words)
                phase = self._phase_for_template(template, word_idx, total_words)

                result = self.generator.generate_validated(
                    template, word, phase=phase, stage_key=phase
                )
                if not result:
                    practice_queue = [(wid, i) for wid, i in practice_queue if wid != word_id]
                    continue
                step, resolved = result
                if not append_step(step, word_id, resolved):
                    practice_queue = [(wid, i) for wid, i in practice_queue if wid != word_id]
                    continue

                self.tracker.mark_practiced(word_id, step_index=step_index - 1, stage=phase)
                practice_counts[word_id] = practice_counts.get(word_id, 0) + 1
                practice_queue = [(wid, i) for wid, i in practice_queue if wid != word_id]

        if introduced_ids and len(steps) < self.TARGET_TOTAL_STEPS:
            final = self.review.build_mixed_review(
                introduced_ids,
                get_word,
                self.tracker,
                last_vocab=self._last_vocab,
                last_template=self._last_template,
                last_category=self._last_category,
                step_index=step_index,
                memory=False,
                count=2,
                can_use_word=can_use,
            )
            for rs in final:
                vid = rs.get("metadata", {}).get("vocabulary_id")
                steps.append(rs)
                if vid:
                    self.frequency.record(vid)
                step_index += 1

        if introduced_ids and len(steps) < self.TARGET_TOTAL_STEPS:
            boss = self.review.build_boss_review(
                introduced_ids,
                get_word,
                self.tracker,
                count=min(2, max(2, len(introduced_ids) // 5)),
                last_vocab=self._last_vocab,
                last_template=self._last_template,
                last_category=self._last_category,
                step_index=step_index,
                can_use_word=can_use,
            )
            for rs in boss:
                vid = rs.get("metadata", {}).get("vocabulary_id")
                if vid:
                    self.frequency.record(vid)
            steps.extend(boss)

        for drill in (sentence_drills or [])[:1]:
            drill_step = self.generator.generate_sentence_drill(drill)
            if drill_step:
                steps.append(drill_step)

        if steps:
            steps[-1].setdefault("metadata", {})["lessonAnalytics"] = self.analytics.summary()

        return steps

    def _pick_candidate(
        self,
        candidates: list[tuple[str, dict | None, int | None]],
        has_more_intros: bool,
    ) -> tuple[str, dict | None, int | None]:
        intros = [c for c in candidates if c[0] == "intro"]
        practices = [c for c in candidates if c[0] == "practice"]

        if intros and practices:
            if self._last_vocab and any(p[1] and p[1]["id"] == self._last_vocab for p in practices):
                return self.rng.choice(intros)
            if has_more_intros and self.rng.random() < 0.5:
                return self.rng.choice(intros)
            return self.rng.choice(practices)

        return self.rng.choice(candidates)

    def _phase_for_template(self, template: str, word_idx: int, total: int) -> str:
        progress = word_idx / max(total - 1, 1)
        if progress < 0.4:
            return "recognition"
        if progress < 0.75:
            return "recall"
        return "production"

    def _pick_practice_template(self, word: dict, word_idx: int, total: int) -> str:
        progress = word_idx / max(total - 1, 1)
        if progress < 0.35:
            pool = list(self.EARLY_TEMPLATES)
        elif progress < 0.7:
            pool = list(self.MID_TEMPLATES)
        else:
            pool = list(self.LATE_TEMPLATES)

        pool = [self.difficulty.resolve_template(t, word) for t in pool]
        pool = [t for t in dict.fromkeys(pool) if template_eligible(t, word, len(self.pool.words))]

        if not pool:
            pool = [T.SELECT_FOREIGN]

        scored = sorted(
            ((self.balancer.score_template(t), t) for t in pool if t != self._last_template),
            reverse=True,
        )
        if scored:
            top_score = scored[0][0]
            top = [t for s, t in scored if s >= top_score - 0.01]
            if self._last_category:
                cat_ok = [t for t in top if self.difficulty.layout_category(t) != self._last_category]
                if cat_ok:
                    top = cat_ok
            return self.rng.choice(top)

        return self.rng.choice(pool)
