"""Track template quotas and word frequency within a lesson."""
from __future__ import annotations

from . import template_catalog as T

# Target share of graded (non-intro) exercises per template family
TEMPLATE_TARGETS: dict[str, float] = {
    "flashcard": 0.15,
    "picture": 0.15,
    "mcq": 0.15,  # translation / select meaning / foreign
    "matching": 0.10,
    "conversation": 0.10,
    "wordbank": 0.10,
    "fill_blank": 0.10,
    "typing": 0.10,
    "review": 0.05,
}

TEMPLATE_TO_FAMILY: dict[str, str] = {
    T.FLASHCARD_INTRO: "flashcard",
    T.IMAGE_VOCAB: "flashcard",
    T.PICTURE_RECOGNITION: "picture",
    T.SELECT_FOREIGN: "mcq",
    T.SELECT_MEANING: "mcq",
    T.TAP_WORD: "mcq",
    T.TRUE_FALSE: "mcq",
    T.FILL_BLANK: "fill_blank",
    T.WORD_BANK: "wordbank",
    T.DRAG_DROP: "wordbank",
    T.TYPE_MEANING: "typing",
    T.TYPE_TARGET: "typing",
    T.MISSING_LETTERS: "typing",
    T.LISTEN_TYPE: "typing",
    T.MATCH_PAIRS: "matching",
    T.MEMORY_CARDS: "matching",
    T.MINI_CONVERSATION: "conversation",
    T.LISTENING: "mcq",
    T.LISTEN_IMAGE: "picture",
}


class TemplateBalancer:
    """Pick templates that keep lesson mix close to target distribution."""

    def __init__(self):
        self.counts: dict[str, int] = {k: 0 for k in TEMPLATE_TARGETS}
        self.total_graded = 0

    def record(self, template: str, *, is_intro: bool = False) -> None:
        if is_intro:
            self.counts["flashcard"] = self.counts.get("flashcard", 0) + 1
            return
        family = TEMPLATE_TO_FAMILY.get(template, "mcq")
        self.counts[family] = self.counts.get(family, 0) + 1
        self.total_graded += 1

    def score_template(self, template: str) -> float:
        """Lower score = more needed in the mix."""
        family = TEMPLATE_TO_FAMILY.get(template, "mcq")
        target = TEMPLATE_TARGETS.get(family, 0.1)
        if self.total_graded == 0:
            return target
        actual = self.counts.get(family, 0) / max(self.total_graded, 1)
        return target - actual

    def pick_best(
        self,
        candidates: list[str],
        *,
        eligible_fn=None,
    ) -> str | None:
        if not candidates:
            return None
        scored = []
        for t in candidates:
            if eligible_fn and not eligible_fn(t):
                continue
            scored.append((self.score_template(t), t))
        if not scored:
            return None
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1]


class WordFrequencyTracker:
    MAX_APPEARANCES = 2

    def __init__(self):
        self.appearances: dict[str, int] = {}
        self.wrong: set[str] = set()

    def can_use(self, word_id: str) -> bool:
        if word_id in self.wrong:
            return True
        return self.appearances.get(word_id, 0) < self.MAX_APPEARANCES

    def record(self, word_id: str) -> None:
        self.appearances[word_id] = self.appearances.get(word_id, 0) + 1

    def mark_wrong(self, word_id: str) -> None:
        self.wrong.add(word_id)
