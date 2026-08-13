"""
Per-word learning progression.

Stages (never skip, never shuffle order across words):
  1. Introduce
  2. Recognition (multiple choice)
  3. Recognition (tap word for English)
  4. Recall (type English meaning)
  5. Recognition (which target word means English)
  6. Recall (listening → choose English meaning)
  7. Production (type target word)
  8. Sentence comprehension (optional)
"""
from __future__ import annotations

import random
from typing import Any

from models import ExerciseType

from .language_labels import get_target_language_label


class WordProgressionBuilder:
    """Build the full exercise sequence for ONE vocabulary item."""

    def __init__(
        self,
        word: dict,
        lesson_vocab: list[dict],
        target_lang: str,
        *,
        accept_romanization: bool = False,
        rng: random.Random | None = None,
    ):
        self.word = word
        self.lesson_vocab = lesson_vocab
        self.target_lang = target_lang
        self.lang_label = get_target_language_label(target_lang)
        self.accept_romanization = accept_romanization
        self.rng = rng or random.Random(0)

    def build(self) -> list[dict]:
        steps: list[dict] = [
            self._intro(),
            self._recognition_which_means(),
            self._recognition_tap_word_for(),
        ]

        if self.word.get("image"):
            steps.append(self._image_recognition())

        steps.extend(
            [
                self._recall_type_meaning(),
                self._recognition_which_word_means(),
                self._listening_choose_meaning(),
                self._production_type_target(),
            ]
        )

        if self.word.get("exampleSentence"):
            steps.append(self._sentence_meaning())

        return steps

    def _base_meta(self, phase: str, stage: str) -> dict:
        return {
            "phase": phase,
            "stage": stage,
            "vocabulary_id": self.word["id"],
        }

    def _intro(self) -> dict:
        return {
            "type": ExerciseType.intro,
            "prompt": "",
            "correct_answer": {"acknowledged": True},
            "metadata": {
                **self._base_meta("introduce", "introduce"),
                "isNewWord": True,
                "targetWord": self.word["target"],
                "romanization": self.word["romanization"],
                "pronunciation": self.word["pronunciation"],
                "englishMeaning": self.word["english"],
                "image": self.word.get("image"),
                "audio": self.word.get("audio"),
            },
            "options": [],
        }

    def _target_options(self, count: int = 3) -> list[str]:
        """Target-script options from this lesson only."""
        pool = [w["target"] for w in self.lesson_vocab if w["id"] != self.word["id"]]
        self.rng.shuffle(pool)
        options = [self.word["target"]] + pool[: max(0, count - 1)]
        self.rng.shuffle(options)
        return options

    def _english_options(self, count: int = 3) -> list[str]:
        pool = [w["english"] for w in self.lesson_vocab if w["id"] != self.word["id"]]
        self.rng.shuffle(pool)
        options = [self.word["english"]] + pool[: max(0, count - 1)]
        self.rng.shuffle(options)
        return options

    def _recognition_which_means(self) -> dict:
        options = self._target_options(3)
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": f'Which one means "{self.word["english"]}"?',
            "correct_answer": {"selected": self.word["target"]},
            "metadata": {
                **self._base_meta("recognition", "recognition"),
                "options": options,
                "direction": "english_to_target",
            },
            "options": [{"label": o, "is_correct": o == self.word["target"]} for o in options],
        }

    def _recognition_tap_word_for(self) -> dict:
        options = self._target_options(3)
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": f'Tap the {self.lang_label} word for "{self.word["english"]}"',
            "correct_answer": {"selected": self.word["target"]},
            "metadata": {
                **self._base_meta("recognition", "recognition"),
                "options": options,
                "direction": "english_to_target",
            },
            "options": [{"label": o, "is_correct": o == self.word["target"]} for o in options],
        }

    def _recognition_which_word_means(self) -> dict:
        options = self._target_options(3)
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": f'Which {self.lang_label} word means "{self.word["english"]}"?',
            "correct_answer": {"selected": self.word["target"]},
            "metadata": {
                **self._base_meta("recognition", "recognition"),
                "options": options,
                "direction": "english_to_target",
            },
            "options": [{"label": o, "is_correct": o == self.word["target"]} for o in options],
        }

    def _image_recognition(self) -> dict:
        distractors = [w for w in self.lesson_vocab if w["id"] != self.word["id"] and w.get("image")]
        self.rng.shuffle(distractors)
        pool = [self.word] + distractors[:2]
        self.rng.shuffle(pool)
        cards = [
            {
                "targetWord": w["target"],
                "romanization": w["romanization"],
                "image": w["image"],
                "vocabulary_id": w["id"],
            }
            for w in pool
        ]
        return {
            "type": ExerciseType.image_selection,
            "prompt": f'Choose the picture for "{self.word["english"]}"',
            "correct_answer": {"selected": self.word["target"]},
            "metadata": {
                **self._base_meta("recognition", "recognition"),
                "options": cards,
                "hideEnglishLabels": True,
            },
            "options": [
                {
                    "label": c["targetWord"],
                    "image_url": c["image"],
                    "is_correct": c["targetWord"] == self.word["target"],
                }
                for c in cards
            ],
        }

    def _recall_type_meaning(self) -> dict:
        return {
            "type": ExerciseType.type_answer,
            "prompt": f'What does this mean?\n\n{self.word["target"]}',
            "correct_answer": {"text": self.word["english"]},
            "metadata": {
                **self._base_meta("recall", "recall"),
                "alternatives": [self.word["english"]],
                "direction": "target_to_english",
            },
            "options": [],
        }

    def _listening_choose_meaning(self) -> dict:
        options = self._english_options(3)
        return {
            "type": ExerciseType.listening,
            "prompt": "Listen and choose the meaning",
            "prompt_audio_url": self.word.get("audio"),
            "correct_answer": {"selected": self.word["english"]},
            "metadata": {
                **self._base_meta("recall", "recall"),
                "options": options,
                "direction": "listening_meaning",
                "fallback_text": self.word["target"] if not self.word.get("audio") else None,
                "pronunciation": self.word["pronunciation"],
                "romanization": self.word["romanization"],
                "englishMeaning": None,
            },
            "options": [{"label": o, "is_correct": o == self.word["english"]} for o in options],
        }

    def _production_type_target(self) -> dict:
        alternatives = [self.word["target"]]
        if self.accept_romanization and self.word.get("romanization"):
            alternatives.append(self.word["romanization"])
        if self.accept_romanization and self.word.get("pronunciation"):
            alternatives.append(self.word["pronunciation"])
        return {
            "type": ExerciseType.type_answer,
            "prompt": f'How do you say "{self.word["english"]}"?',
            "correct_answer": {"text": self.word["target"]},
            "metadata": {
                **self._base_meta("production", "production"),
                "alternatives": alternatives,
                "accept_romanization": self.accept_romanization,
                "direction": "english_to_target",
            },
            "options": [],
        }

    def _sentence_meaning(self) -> dict:
        sentence = self.word["exampleSentence"]
        alts = [self.word["english"]]
        if not self.word["english"].endswith("!"):
            alts.append(f'{self.word["english"]}!')
        return {
            "type": ExerciseType.type_answer,
            "prompt": f"What does this mean?\n\n{sentence}",
            "correct_answer": {"text": alts[0]},
            "metadata": {
                **self._base_meta("recall", "recall"),
                "alternatives": alts,
                "direction": "sentence_to_english",
            },
            "options": [],
        }
