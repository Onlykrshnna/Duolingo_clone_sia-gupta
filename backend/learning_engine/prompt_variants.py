"""Natural, varied exercise prompts."""
from __future__ import annotations

import random


def pick(rng: random.Random, variants: list[str], **kwargs) -> str:
    template = rng.choice(variants)
    return template.format(**kwargs)


PICTURE_PROMPTS = [
    'Which one means "{english}"?',
    'Pick the picture for "{english}"',
    'Select the correct image for "{english}"',
    'Find the picture that matches "{english}"',
]

TAP_WORD_PROMPTS = [
    'Tap the word for "{english}"',
    'Find "{english}" in the word bank',
    'Which word means "{english}"?',
]

SELECT_FOREIGN_PROMPTS = [
    'Which one means "{english}"?',
    'Choose the correct translation for "{english}"',
    'Pick the right word for "{english}"',
    'What is "{english}" in {lang}?',
]

SELECT_MEANING_PROMPTS = [
    'What does "{target}" mean?',
    'Choose the correct meaning of "{target}"',
    'Which translation matches "{target}"?',
    'Select what "{target}" means',
]

TYPE_MEANING_PROMPTS = [
    'Type what this means:\n\n{target}',
    'What does "{target}" mean? Type your answer.',
    'Translate this word:\n\n{target}',
]

TYPE_TARGET_PROMPTS = [
    'How do you say "{english}"?',
    'Type "{english}" in {lang}',
    'Write the word for "{english}"',
]

LISTENING_PROMPTS = [
    "Listen and choose the meaning",
    "What did you hear?",
    "Pick the correct translation",
]

LISTEN_IMAGE_PROMPTS = [
    "Listen and choose the correct image",
    "Which picture matches what you hear?",
    "Select the picture you heard",
]

LISTEN_TYPE_PROMPTS = [
    "Listen and type what you hear",
    "Type the word you hear",
    "Write what you heard",
]

FILL_BLANK_PROMPTS = [
    'The {lang} word for "{english}" is ____',
    'How do you say "{english}" in {lang}? ____',
    'Fill in: "{english}" = ____',
]

WORD_BANK_PROMPTS = [
    'Build the word for "{english}"',
    'Sentence builder: "{english}"',
    'Arrange tiles for "{english}"',
]

DRAG_DROP_PROMPTS = [
    'Arrange the word for "{english}"',
    'Put the letters in order for "{english}"',
    'Drag words to spell "{english}"',
]

TRUE_FALSE_INTRO = "{target} = {english}"
TRUE_FALSE_WRONG = "{target} = {wrong_english}"

CONVERSATION_PROMPTS = [
    "A: {line_a}\nB: ______",
    "Continue the conversation:\nA: {line_a}\nB: ______",
    "What would you say here?\nA: {line_a}\nB: ______",
]

MATCH_PROMPTS = [
    "Match English to {lang}",
    "Connect each English word with its {lang} translation",
    "Pair the words on both sides",
]

MEMORY_PROMPTS = [
    "Flip cards and match pairs",
    "Memory match — find the pairs",
    "Match the memory cards",
]

MISSING_LETTERS_PROMPTS = [
    "Complete it:\n\n{partial}",
    "Fill in the missing letters:\n\n{partial}",
    "What's the full word?\n\n{partial}",
]
