"""Per-word mastery state for lesson scheduling."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class WordState:
    word_id: str
    introduced: bool = False
    recognized: bool = False
    recalled: bool = False
    mastered: bool = False
    stage_index: int = 0
    appearances: int = 0
    correct_count: int = 0
    wrong_count: int = 0
    skipped_count: int = 0
    last_seen_at: int = -1

    def to_dict(self) -> dict:
        return {
            "word": self.word_id,
            "introduced": self.introduced,
            "recognized": self.recognized,
            "recalled": self.recalled,
            "mastered": self.mastered,
            "stage_index": self.stage_index,
            "appearances": self.appearances,
            "correct_count": self.correct_count,
            "wrong_count": self.wrong_count,
            "skipped_count": self.skipped_count,
        }


class VocabularyTracker:
    """Tracks learning stage per vocabulary item during lesson assembly."""

    def __init__(self) -> None:
        self._states: dict[str, WordState] = {}

    def get(self, word_id: str) -> WordState:
        if word_id not in self._states:
            self._states[word_id] = WordState(word_id=word_id)
        return self._states[word_id]

    def mark_introduced(self, word_id: str, *, step_index: int) -> None:
        state = self.get(word_id)
        state.introduced = True
        state.stage_index = max(state.stage_index, 1)
        state.appearances += 1
        state.last_seen_at = step_index

    def mark_practiced(self, word_id: str, *, step_index: int, stage: str) -> None:
        state = self.get(word_id)
        state.appearances += 1
        state.last_seen_at = step_index
        state.correct_count += 1

        if stage in ("recognition", "introduce"):
            state.recognized = True
            state.stage_index = max(state.stage_index, 2)
        elif stage in ("recall", "review"):
            state.recalled = True
            state.stage_index = max(state.stage_index, 3)
        elif stage in ("production",):
            state.mastered = True
            state.stage_index = max(state.stage_index, 4)

    def can_use_production(self, word_id: str) -> bool:
        return self.get(word_id).recognized

    def can_use_typing(self, word_id: str) -> bool:
        return self.get(word_id).recalled or self.get(word_id).recognized

    def summary(self) -> list[dict]:
        return [s.to_dict() for s in self._states.values()]
