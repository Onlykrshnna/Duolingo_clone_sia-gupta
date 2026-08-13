"""In-memory lesson analytics for adaptive learning (persisted at runtime via API)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class ExerciseEvent:
    vocabulary_id: str | None
    template: str
    correct: bool | None
    skipped: bool = False
    response_ms: int | None = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AnalyticsTracker:
    def __init__(self) -> None:
        self.events: list[ExerciseEvent] = []
        self.words_introduced: set[str] = set()
        self.words_mastered: set[str] = set()
        self.wrong_by_vocab: dict[str, int] = {}
        self.skipped_count = 0

    def record_intro(self, vocab_id: str) -> None:
        self.words_introduced.add(vocab_id)

    def record_answer(
        self,
        *,
        vocab_id: str | None,
        template: str,
        correct: bool,
        response_ms: int | None = None,
    ) -> None:
        self.events.append(
            ExerciseEvent(
                vocabulary_id=vocab_id,
                template=template,
                correct=correct,
                response_ms=response_ms,
            )
        )
        if correct and vocab_id:
            self.words_mastered.add(vocab_id)
        elif vocab_id:
            self.wrong_by_vocab[vocab_id] = self.wrong_by_vocab.get(vocab_id, 0) + 1

    def record_skip(self, *, vocab_id: str | None, template: str) -> None:
        self.skipped_count += 1
        self.events.append(
            ExerciseEvent(vocabulary_id=vocab_id, template=template, correct=None, skipped=True)
        )

    @property
    def accuracy(self) -> float:
        graded = [e for e in self.events if not e.skipped and e.correct is not None]
        if not graded:
            return 1.0
        return sum(1 for e in graded if e.correct) / len(graded)

    def hardest_words(self, limit: int = 5) -> list[tuple[str, int]]:
        return sorted(self.wrong_by_vocab.items(), key=lambda x: -x[1])[:limit]

    def summary(self) -> dict:
        return {
            "words_introduced": len(self.words_introduced),
            "words_mastered": len(self.words_mastered),
            "wrong_answers": sum(self.wrong_by_vocab.values()),
            "accuracy": round(self.accuracy, 3),
            "skipped_exercises": self.skipped_count,
            "hardest_vocabulary": [{"word_id": w, "wrong_count": c} for w, c in self.hardest_words()],
            "total_events": len(self.events),
        }
