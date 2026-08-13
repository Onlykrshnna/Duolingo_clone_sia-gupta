"""Tracks per-word exposure caps within a lesson."""
from __future__ import annotations


class ProgressTracker:
    def __init__(self, *, max_per_word: int = 5) -> None:
        self.max_per_word = max_per_word
        self._counts: dict[str, int] = {}

    def count(self, word_id: str) -> int:
        return self._counts.get(word_id, 0)

    def can_use(self, word_id: str) -> bool:
        return self.count(word_id) < self.max_per_word

    def record(self, word_id: str) -> None:
        self._counts[word_id] = self.count(word_id) + 1

    def words_under_cap(self, word_ids: list[str]) -> list[str]:
        return [wid for wid in word_ids if self.can_use(wid)]
