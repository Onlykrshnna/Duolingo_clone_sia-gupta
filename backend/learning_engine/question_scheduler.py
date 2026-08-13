"""Schedules diverse questions — no consecutive duplicate templates or categories."""
from __future__ import annotations

import random
from typing import Callable

from . import template_catalog as T
from .mastery_tracker import MasteryTracker
from .progress_tracker import ProgressTracker
from .question_factory import QuestionFactory


class QuestionScheduler:
    QUESTIONS_PER_NEW_WORD = 4

    def __init__(self, factory: QuestionFactory, rng: random.Random | None = None):
        self.factory = factory
        self.rng = rng or random.Random(0)
        self._last_template: str | None = None
        self._last_category: str | None = None
        self._last_vocab: str | None = None
        self._vocab_streak = 0
        self._category_index = 0

    def reset_streaks(self) -> None:
        self._last_template = None
        self._last_category = None
        self._last_vocab = None
        self._vocab_streak = 0
        self._category_index = 0

    def pick_new_word_questions(self, word: dict) -> list[str]:
        """4 diverse practice templates after flashcard intro."""
        selected: list[str] = []
        for _ in range(self.QUESTIONS_PER_NEW_WORD):
            template = self._pick_rotating_template(word, pool=T.ALL_PRACTICE_TEMPLATES)
            selected.append(template)
            self._last_template = template
        self._last_vocab = word["id"]
        self._vocab_streak = 1
        return selected

    def pick_review_question(
        self,
        word_ids: list[str],
        get_word: Callable[[str], dict],
        mastery: MasteryTracker,
        progress: ProgressTracker,
        *,
        phase: str = T.MIXED_REVIEW,
    ) -> tuple[str, dict] | None:
        eligible = [wid for wid in word_ids if progress.can_use(wid)]
        if not eligible:
            return None

        weights = [mastery.weight(wid) for wid in eligible]
        word_id = self.rng.choices(eligible, weights=weights, k=1)[0]
        word = get_word(word_id)

        if self._last_vocab == word_id:
            self._vocab_streak += 1
        else:
            self._vocab_streak = 1
            self._last_vocab = word_id

        if self._vocab_streak > 2:
            others = [w for w in eligible if w != word_id]
            if others:
                word_id = self.rng.choice(others)
                word = get_word(word_id)
                self._last_vocab = word_id
                self._vocab_streak = 1

        review_pool = list(T.ALL_PRACTICE_TEMPLATES)
        if phase == T.BOSS_REVIEW:
            review_pool = T.ALL_PRACTICE_TEMPLATES + [T.TRUE_FALSE, T.MINI_CONVERSATION, T.MISSING_LETTERS]

        template = self._pick_rotating_template(word, pool=review_pool)
        self._last_template = template
        return template, word

    def pick_boss_templates(self, word_ids: list[str], get_word: Callable[[str], dict], count: int = 5) -> list[tuple[str, dict]]:
        """Boss review — random mix from entire lesson."""
        picks: list[tuple[str, dict]] = []
        if not word_ids:
            return picks
        for _ in range(count):
            word_id = self.rng.choice(word_ids)
            word = get_word(word_id)
            if not word:
                continue
            template = self._pick_rotating_template(word, pool=T.ALL_PRACTICE_TEMPLATES)
            self._last_template = template
            picks.append((template, word))
        return picks

    def _pick_rotating_template(self, word: dict, *, pool: list[str]) -> str:
        eligible = self._filter_for_word(word, pool)
        if not eligible:
            eligible = list(pool)

        category = T.CATEGORY_ORDER[self._category_index % len(T.CATEGORY_ORDER)]
        self._category_index += 1

        category_templates = [t for t in T.CATEGORY_POOLS.get(category, []) if t in eligible]
        if category_templates:
            candidates = [t for t in category_templates if t != self._last_template]
            if candidates:
                return self.rng.choice(candidates)
            return self.rng.choice(category_templates)

        candidates = [t for t in eligible if t != self._last_template]
        if not candidates:
            candidates = eligible
        return self.rng.choice(candidates)

    def _filter_for_word(self, word: dict, pool: list[str]) -> list[str]:
        result = list(pool)
        if not word.get("image"):
            result = [
                t
                for t in result
                if t not in (T.PICTURE_RECOGNITION, T.IMAGE_VOCAB, T.LISTEN_IMAGE)
            ]
            if T.LISTENING not in result:
                result.append(T.LISTENING)
        if len(word.get("target", "")) <= 2:
            result = [t for t in result if t != T.MISSING_LETTERS]
        return result
