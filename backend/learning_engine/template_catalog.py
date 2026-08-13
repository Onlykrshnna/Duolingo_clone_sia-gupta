"""Exercise template catalog — maps templates to UI categories for rotation."""
from __future__ import annotations

# Template identifiers (20+ distinct layouts)
FLASHCARD_INTRO = "flashcard_intro"
IMAGE_VOCAB = "image_vocab"
PICTURE_RECOGNITION = "picture_recognition"
TAP_WORD = "tap_word"
MATCH_PAIRS = "match_pairs"
MEMORY_CARDS = "memory_cards"
FILL_BLANK = "fill_blank"
DRAG_DROP = "drag_drop"
WORD_BANK = "word_bank"
LISTENING = "listening"
LISTEN_IMAGE = "listen_image"
LISTEN_TYPE = "listen_type"
SPEAKING = "speaking"
SELECT_MEANING = "select_meaning"
SELECT_FOREIGN = "select_foreign"
TRUE_FALSE = "true_false"
TYPE_MEANING = "type_meaning"
TYPE_TARGET = "type_target"
MISSING_LETTERS = "missing_letters"
MINI_CONVERSATION = "mini_conversation"
MIXED_REVIEW = "mixed_review"
BOSS_REVIEW = "boss_review"
SENTENCE = "sentence"

# Legacy aliases
MC_RECOGNITION = SELECT_FOREIGN
IMAGE = PICTURE_RECOGNITION
INTRO = FLASHCARD_INTRO

# Category pools — scheduler alternates categories, never same template twice
CATEGORY_POOLS: dict[str, list[str]] = {
    "visual": [PICTURE_RECOGNITION, IMAGE_VOCAB, LISTEN_IMAGE],
    "tap": [TAP_WORD, SELECT_FOREIGN, SELECT_MEANING],
    "typing": [TYPE_MEANING, TYPE_TARGET, MISSING_LETTERS, LISTEN_TYPE],
    "listening": [LISTENING, LISTEN_IMAGE, LISTEN_TYPE],
    "matching": [MATCH_PAIRS, MEMORY_CARDS],
    "choice": [SELECT_MEANING, SELECT_FOREIGN, TRUE_FALSE, MINI_CONVERSATION],
    "wordbank": [DRAG_DROP, WORD_BANK],
    "production": [TYPE_TARGET, DRAG_DROP, SPEAKING],
}

CATEGORY_ORDER = [
    "visual",
    "tap",
    "listening",
    "typing",
    "matching",
    "choice",
    "wordbank",
    "production",
]

ALL_PRACTICE_TEMPLATES = [
    PICTURE_RECOGNITION,
    TAP_WORD,
    MATCH_PAIRS,
    FILL_BLANK,
    DRAG_DROP,
    LISTENING,
    SELECT_MEANING,
    SELECT_FOREIGN,
    TRUE_FALSE,
    MEMORY_CARDS,
    LISTEN_IMAGE,
    LISTEN_TYPE,
    MISSING_LETTERS,
    MINI_CONVERSATION,
    TYPE_MEANING,
    TYPE_TARGET,
    IMAGE_VOCAB,
]
