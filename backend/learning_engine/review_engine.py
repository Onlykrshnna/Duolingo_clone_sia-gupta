"""Interval-based review scheduling with mixed old/new vocabulary."""
from __future__ import annotations

import random
from typing import Callable

from . import template_catalog as T
from .difficulty_engine import DifficultyEngine
from .exercise_generator import ExerciseGenerator
from .vocabulary_tracker import VocabularyTracker


class ReviewEngine:
    REVIEW_EVERY_N_WORDS = 6
    REVIEW_QUESTIONS_PER_BLOCK = 1

    def __init__(
        self,
        generator: ExerciseGenerator,
        difficulty: DifficultyEngine,
        *,
        rng: random.Random | None = None,
    ):
        self.generator = generator
        self.difficulty = difficulty
        self.rng = rng or random.Random(0)
        self.prior_word_ids: list[str] = []

    def set_prior_vocabulary(self, word_ids: list[str]) -> None:
        self.prior_word_ids = list(word_ids)

    def should_insert_review(self, words_introduced: int) -> bool:
        return words_introduced > 0 and words_introduced % self.REVIEW_EVERY_N_WORDS == 0

    def _review_pool(self, introduced_ids: list[str]) -> list[str]:
        """Mix prior-lesson words with today's words for review."""
        pool = list(dict.fromkeys(self.prior_word_ids + introduced_ids))
        self.rng.shuffle(pool)
        return pool

    def pick_review_word(
        self,
        word_ids: list[str],
        get_word: Callable[[str], dict],
        tracker: VocabularyTracker,
        *,
        exclude_id: str | None,
        used_in_block: set[str],
        last_template: str | None,
        last_category: str | None,
        can_use_word: Callable[[str], bool] | None = None,
    ) -> tuple[str, dict] | None:
        eligible = [
            wid
            for wid in word_ids
            if wid != exclude_id and wid not in used_in_block
            and (can_use_word(wid) if can_use_word else True)
        ]
        if not eligible:
            return None

        weights = []
        for wid in eligible:
            state = tracker.get(wid)
            w = 2.5 if wid in self.prior_word_ids else 1.0
            if state.wrong_count > 0:
                w *= 2.0
            if state.appearances <= 1:
                w *= 1.2
            weights.append(w)

        word_id = self.rng.choices(eligible, weights=weights, k=1)[0]
        word = get_word(word_id)
        if not word:
            return None
        template = self._pick_review_template(word, last_template, last_category)
        return template, word

    def _pick_review_template(
        self, word: dict, last_template: str | None, last_category: str | None
    ) -> str:
        pool = [
            T.SELECT_FOREIGN,
            T.SELECT_MEANING,
            T.TRUE_FALSE,
            T.FILL_BLANK,
            T.TAP_WORD,
        ]
        if word.get("image"):
            pool.append(T.PICTURE_RECOGNITION)
        pool = [self.difficulty.resolve_template(t, word) for t in pool]
        pool = list(dict.fromkeys(pool))

        candidates = [t for t in pool if t != last_template]
        if last_category:
            cat_filtered = [
                t for t in candidates if self.difficulty.layout_category(t) != last_category
            ]
            if cat_filtered:
                candidates = cat_filtered
        if not candidates:
            candidates = pool
        return self.rng.choice(candidates)

    def build_mixed_review(
        self,
        word_ids: list[str],
        get_word: Callable[[str], dict],
        tracker: VocabularyTracker,
        *,
        last_vocab: str | None,
        last_template: str | None,
        last_category: str | None,
        step_index: int,
        memory: bool = False,
        count: int | None = None,
        can_use_word: Callable[[str], bool] | None = None,
    ) -> list[dict]:
        steps: list[dict] = []
        review_pool = self._review_pool(word_ids)
        used_in_block: set[str] = set()
        exclude = last_vocab
        n = count if count is not None else self.REVIEW_QUESTIONS_PER_BLOCK

        for _ in range(n):
            picked = self.pick_review_word(
                review_pool,
                get_word,
                tracker,
                exclude_id=exclude,
                used_in_block=used_in_block,
                last_template=last_template,
                last_category=last_category,
                can_use_word=can_use_word,
            )
            if not picked:
                break
            template, word = picked
            result = self.generator.generate_validated(
                template, word, phase=T.MIXED_REVIEW
            )
            if not result:
                used_in_block.add(word["id"])
                continue
            step, resolved = result
            step["metadata"]["reviewKind"] = T.MIXED_REVIEW
            step["metadata"]["template"] = resolved
            tracker.mark_practiced(word["id"], step_index=step_index, stage="review")
            steps.append(step)
            used_in_block.add(word["id"])
            exclude = word["id"]
            last_template = resolved
            last_category = self.difficulty.layout_category(resolved)
            step_index += 1

        if len(review_pool) >= 3 and n >= 2:
            match_words = []
            for wid in review_pool:
                w = get_word(wid)
                if w and wid not in {m["id"] for m in match_words}:
                    match_words.append(w)
                if len(match_words) >= 4:
                    break
            if len(match_words) >= 3:
                match = self.generator.generate_match(match_words, phase=T.MIXED_REVIEW, memory=memory)
                if match:
                    match["metadata"]["reviewKind"] = T.MIXED_REVIEW
                    steps.append(match)

        return steps

    def build_boss_review(
        self,
        word_ids: list[str],
        get_word: Callable[[str], dict],
        tracker: VocabularyTracker,
        *,
        count: int = 3,
        last_vocab: str | None = None,
        last_template: str | None = None,
        last_category: str | None = None,
        step_index: int = 0,
        can_use_word: Callable[[str], bool] | None = None,
    ) -> list[dict]:
        steps: list[dict] = []
        exclude = last_vocab
        used: set[str] = set()
        boss_pool = [
            T.TYPE_TARGET,
            T.WORD_BANK,
            T.MINI_CONVERSATION,
            T.FILL_BLANK,
            T.SELECT_MEANING,
        ]
        review_pool = self._review_pool(word_ids)

        for _ in range(count):
            eligible = [
                wid for wid in review_pool
                if wid != exclude and wid not in used
                and (can_use_word(wid) if can_use_word else True)
            ]
            if not eligible:
                break
            word_id = self.rng.choice(eligible)
            word = get_word(word_id)
            if not word:
                continue

            pool = [self.difficulty.resolve_template(t, word) for t in boss_pool]
            pool = list(dict.fromkeys(pool))
            candidates = [t for t in pool if t != last_template]
            if last_category:
                cat_filtered = [
                    t for t in candidates if self.difficulty.layout_category(t) != last_category
                ]
                if cat_filtered:
                    candidates = cat_filtered
            if not candidates:
                candidates = pool
            template = self.rng.choice(candidates)

            result = self.generator.generate_validated(
                template, word, phase=T.BOSS_REVIEW
            )
            if not result:
                used.add(word_id)
                continue
            step, resolved = result
            step["metadata"]["reviewKind"] = T.BOSS_REVIEW
            step["metadata"]["template"] = resolved
            step["metadata"]["difficulty"] = 3
            tracker.mark_practiced(word["id"], step_index=step_index, stage="review")
            steps.append(step)
            used.add(word_id)
            exclude = word_id
            last_template = resolved
            last_category = self.difficulty.layout_category(resolved)
            step_index += 1

        return steps
