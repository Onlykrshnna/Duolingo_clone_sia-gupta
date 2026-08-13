"""Simulated mastery weights during lesson assembly."""
from __future__ import annotations

from enum import Enum


class MasteryLevel(str, Enum):
    NEW = "new"
    RECENT = "recent"
    MASTERED = "mastered"
    OLD = "old"


WEIGHTS = {
    MasteryLevel.NEW: 1.0,
    MasteryLevel.RECENT: 0.5,
    MasteryLevel.MASTERED: 0.15,
    MasteryLevel.OLD: 0.05,
}


class MasteryTracker:
    def __init__(self) -> None:
        self._levels: dict[str, MasteryLevel] = {}
        self._practice_count: dict[str, int] = {}

    def mark_introduced(self, word_id: str) -> None:
        self._levels[word_id] = MasteryLevel.NEW
        self._practice_count.setdefault(word_id, 0)

    def mark_practiced(self, word_id: str) -> None:
        self._practice_count[word_id] = self._practice_count.get(word_id, 0) + 1
        count = self._practice_count[word_id]
        if count >= 4:
            self._levels[word_id] = MasteryLevel.OLD
        elif count >= 2:
            self._levels[word_id] = MasteryLevel.MASTERED
        else:
            self._levels[word_id] = MasteryLevel.RECENT

    def weight(self, word_id: str) -> float:
        level = self._levels.get(word_id, MasteryLevel.NEW)
        return WEIGHTS[level]

    def level(self, word_id: str) -> MasteryLevel:
        return self._levels.get(word_id, MasteryLevel.NEW)
