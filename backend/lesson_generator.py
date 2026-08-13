"""
Lesson content loader + persistence.

Generation uses learning_engine/ScheduledLessonGenerator with
VocabularyPool, QuestionScheduler, ReviewGenerator, MasteryTracker.
"""
from __future__ import annotations

import json
import uuid
from pathlib import Path

from models import Exercise, ExerciseOption, ExerciseType

from learning_engine import LessonBuilder, normalize_vocab_word

CONTENT_DIR = Path(__file__).parent / "content"

CONTENT_KEY_TO_LESSON = {
    "greetings": "lesson1",
    "food": "lesson2",
    "travel": "lesson3",
    "family": "lesson4",
    "shopping": "lesson5",
    "directions": "lesson6",
}

SLICE_ORDER = ["greetings", "food", "travel", "family", "shopping", "directions"]

LANG_FOLDER = {
    "ja": "japanese",
    "es": "spanish",
    "de": "german",
    "fr": "french",
}


def _apply_vocab(data: dict) -> dict:
    data["vocabulary"] = [normalize_vocab_word(w) for w in data.get("vocabulary", [])]
    return data


def load_lesson_content(target_language: str, content_key: str) -> dict:
    folder = LANG_FOLDER.get(target_language, target_language)

    unit_path = CONTENT_DIR / folder / "unit1.json"
    if unit_path.exists():
        with open(unit_path, encoding="utf-8") as f:
            unit_data = json.load(f)
        slices = unit_data.get("lessonSlices", {})
        word_ids = slices.get(content_key)
        if word_ids:
            all_vocab = [normalize_vocab_word(w) for w in unit_data.get("vocabulary", [])]
            id_map = {w["id"]: w for w in all_vocab}
            prior_ids: list[str] = []
            for key in SLICE_ORDER:
                if key == content_key:
                    break
                prior_ids.extend(slices.get(key, []))
            return {
                "id": f"{content_key}-slice",
                "title": unit_data.get("title", content_key),
                "targetLanguage": unit_data.get("targetLanguage", target_language),
                "acceptRomanization": unit_data.get("acceptRomanization", False),
                "vocabulary": [id_map[wid] for wid in word_ids if wid in id_map],
                "poolVocabulary": all_vocab,
                "priorVocabularyIds": [wid for wid in prior_ids if wid in id_map],
                "sentenceDrills": unit_data.get("sentenceDrills", [])
                if content_key == "greetings"
                else [],
            }

    lesson_file = CONTENT_KEY_TO_LESSON.get(content_key, "lesson1") + ".json"
    path = CONTENT_DIR / folder / lesson_file
    if not path.exists():
        path = CONTENT_DIR / folder / "lesson1.json"
    with open(path, encoding="utf-8") as f:
        return _apply_vocab(json.load(f))


class LessonGenerator:
    def __init__(self, lesson_data: dict, *, seed: int | None = 42):
        self.lesson_data = lesson_data
        self.seed = seed

    def generate_steps(self) -> list[dict]:
        builder = LessonBuilder(
            self.lesson_data["vocabulary"],
            self.lesson_data["targetLanguage"],
            accept_romanization=self.lesson_data.get("acceptRomanization", False),
            sentence_drills=self.lesson_data.get("sentenceDrills"),
            prior_vocabulary_ids=self.lesson_data.get("priorVocabularyIds"),
            pool_vocabulary=self.lesson_data.get("poolVocabulary"),
            seed=self.seed,
        )
        return builder.build_steps()


from learning_engine.exercise_validator import validate_exercise


def persist_generated_lesson(session, lesson_uuid, lesson_data: dict, *, seed: int | None = 42) -> int:
    generator = LessonGenerator(lesson_data, seed=seed)
    steps = generator.generate_steps()

    persisted = 0
    for step in steps:
        meta = step.get("metadata") or {}
        word = None
        if meta.get("vocabulary_id"):
            word = {
                "id": meta["vocabulary_id"],
                "english": meta.get("englishMeaning") or meta.get("english") or "",
                "target": meta.get("targetWord") or meta.get("target") or "",
            }
        ok, reason = validate_exercise(step, word, lesson_id=str(lesson_uuid), log_rejection=True)
        if not ok:
            continue

        persisted += 1
        order = persisted
        ex_id = uuid.uuid4()
        session.add(
            Exercise(
                id=ex_id,
                lesson_id=lesson_uuid,
                order_index=order,
                type=step["type"],
                prompt=step["prompt"],
                prompt_audio_url=step.get("prompt_audio_url"),
                correct_answer=step["correct_answer"],
                exercise_metadata=step["metadata"],
            )
        )
        for idx, opt in enumerate(step.get("options", []), 1):
            session.add(
                ExerciseOption(
                    exercise_id=ex_id,
                    label=opt["label"],
                    is_correct=opt.get("is_correct", False),
                    pair_key=opt.get("pair_key"),
                    image_url=opt.get("image_url"),
                    order_index=idx,
                )
            )

        if step["type"] == ExerciseType.match_pairs:
            meta = step["metadata"]
            opt_idx = 1
            for left_word in meta["left"]:
                session.add(
                    ExerciseOption(
                        exercise_id=ex_id,
                        label=left_word,
                        pair_key=left_word,
                        order_index=opt_idx,
                    )
                )
                opt_idx += 1
                session.add(
                    ExerciseOption(
                        exercise_id=ex_id,
                        label=step["correct_answer"]["pairs"][left_word],
                        pair_key=left_word,
                        order_index=opt_idx,
                    )
                )
                opt_idx += 1

    return persisted
