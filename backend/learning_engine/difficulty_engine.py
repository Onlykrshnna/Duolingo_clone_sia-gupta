"""Maps learning stages to allowed exercise templates."""
from __future__ import annotations

from . import template_catalog as T

# Ordered progression: introduce → recognition → recall → production
STAGE_PIPELINE: list[dict] = [
    {
        "key": "introduce",
        "phase": "introduce",
        "templates": [T.FLASHCARD_INTRO],
        "requires": None,
    },
    {
        "key": "recognition_visual",
        "phase": "recognition",
        "templates": [T.PICTURE_RECOGNITION],
        "requires": "introduced",
        "needs_image": True,
    },
    {
        "key": "recognition_foreign",
        "phase": "recognition",
        "templates": [T.SELECT_FOREIGN, T.TAP_WORD],
        "requires": "introduced",
    },
    {
        "key": "recognition_meaning",
        "phase": "recognition",
        "templates": [T.SELECT_MEANING, T.TRUE_FALSE, T.FILL_BLANK],
        "requires": "introduced",
    },
    {
        "key": "recall_wordbank",
        "phase": "recall",
        "templates": [T.WORD_BANK, T.DRAG_DROP],
        "requires": "recognized",
    },
    {
        "key": "recall_listening",
        "phase": "recall",
        "templates": [T.LISTENING, T.LISTEN_IMAGE],
        "requires": "recognized",
        "needs_audio": True,
    },
    {
        "key": "production_typing",
        "phase": "production",
        "templates": [T.TYPE_MEANING, T.TYPE_TARGET, T.MISSING_LETTERS, T.LISTEN_TYPE],
        "requires": "recalled",
    },
    {
        "key": "production_conversation",
        "phase": "production",
        "templates": [T.MINI_CONVERSATION, T.SPEAKING],
        "requires": "recalled",
    },
]

PRACTICE_STAGES = [s for s in STAGE_PIPELINE if s["key"] != "introduce"]

# Layout categories for visual rotation (never same category twice)
LAYOUT_CATEGORY: dict[str, str] = {
    T.FLASHCARD_INTRO: "flashcard",
    T.IMAGE_VOCAB: "flashcard",
    T.PICTURE_RECOGNITION: "picture",
    T.TAP_WORD: "tap",
    T.SELECT_FOREIGN: "mcq",
    T.SELECT_MEANING: "mcq",
    T.TRUE_FALSE: "mcq",
    T.FILL_BLANK: "mcq",
    T.WORD_BANK: "wordbank",
    T.DRAG_DROP: "wordbank",
    T.LISTENING: "listening",
    T.LISTEN_IMAGE: "listening",
    T.LISTEN_TYPE: "typing",
    T.TYPE_MEANING: "typing",
    T.TYPE_TARGET: "typing",
    T.MISSING_LETTERS: "typing",
    T.MATCH_PAIRS: "matching",
    T.MEMORY_CARDS: "matching",
    T.MINI_CONVERSATION: "conversation",
    T.SPEAKING: "speaking",
}


class DifficultyEngine:
    """Unlock templates based on word state and filter by word capabilities."""

    AUDIO_TEMPLATES = frozenset({T.LISTENING, T.LISTEN_TYPE, T.LISTEN_IMAGE, T.SPEAKING})

    AUDIO_FALLBACKS: dict[str, str] = {
        T.LISTENING: T.SELECT_MEANING,
        T.LISTEN_TYPE: T.TYPE_TARGET,
        T.LISTEN_IMAGE: T.PICTURE_RECOGNITION,
        T.SPEAKING: T.TYPE_TARGET,
    }

    IMAGE_TEMPLATES = frozenset({T.PICTURE_RECOGNITION, T.IMAGE_VOCAB, T.LISTEN_IMAGE})

    def templates_for_stage(self, stage_key: str, word: dict, *, has_audio: bool) -> list[str]:
        stage = next((s for s in STAGE_PIPELINE if s["key"] == stage_key), None)
        if not stage:
            return [T.SELECT_FOREIGN]

        templates = list(stage["templates"])
        if stage.get("needs_image") and not word.get("image"):
            templates = [t for t in templates if t not in self.IMAGE_TEMPLATES]
            if not templates:
                templates = [T.SELECT_FOREIGN, T.TAP_WORD]
        if stage.get("needs_audio") and not has_audio:
            templates = [t for t in templates if t not in self.AUDIO_TEMPLATES]
        return templates or [T.SELECT_FOREIGN]

    def resolve_template(self, template: str, word: dict) -> str:
        """Replace audio-dependent templates when no audio exists."""
        if word.get("audio"):
            return template
        if template in self.AUDIO_TEMPLATES:
            return self.AUDIO_FALLBACKS.get(template, T.SELECT_MEANING)
        return template

    def difficulty_for_step(self, template: str, layout: str, *, phase: str) -> int:
        if phase == "introduce":
            return 1
        cat = LAYOUT_CATEGORY.get(template, layout)
        if cat in ("flashcard", "picture", "tap", "mcq"):
            return 1 if phase == "recognition" else 2
        if cat in ("listening", "matching", "conversation"):
            return 2
        if cat in ("wordbank", "typing", "speaking"):
            return 3
        return 2

    def layout_category(self, template: str) -> str:
        return LAYOUT_CATEGORY.get(template, "other")
