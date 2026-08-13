"""Build exercise dicts from vocabulary + template type."""
from __future__ import annotations

import random

from models import ExerciseType

from .language_labels import get_target_language_label
from . import template_catalog as T
from . import prompt_variants as P
from .vocabulary_pool import VocabularyPool


class QuestionFactory:
    # Re-export template constants for callers
    TEMPLATE_INTRO = T.FLASHCARD_INTRO
    TEMPLATE_MC = T.SELECT_FOREIGN
    TEMPLATE_TAP = T.TAP_WORD
    TEMPLATE_IMAGE = T.PICTURE_RECOGNITION
    TEMPLATE_TYPE_MEANING = T.TYPE_MEANING
    TEMPLATE_TYPE_TARGET = T.TYPE_TARGET
    TEMPLATE_LISTENING = T.LISTENING
    TEMPLATE_MATCH = T.MATCH_PAIRS
    TEMPLATE_WORD_BANK = T.WORD_BANK
    TEMPLATE_SENTENCE = T.SENTENCE
    TEMPLATE_SPEAKING = T.SPEAKING
    TEMPLATE_FILL = T.FILL_BLANK

    def __init__(
        self,
        pool: VocabularyPool,
        target_lang: str,
        *,
        accept_romanization: bool = False,
        rng: random.Random | None = None,
    ):
        self.pool = pool
        self.target_lang = target_lang
        self.lang_label = get_target_language_label(target_lang)
        self.accept_romanization = accept_romanization
        self.rng = rng or random.Random(0)

    def build(self, template: str, word: dict, *, phase: str = "practice") -> dict:
        builders = {
            T.FLASHCARD_INTRO: self._flashcard_intro,
            T.IMAGE_VOCAB: self._image_vocab,
            T.PICTURE_RECOGNITION: self._picture_recognition,
            T.TAP_WORD: self._tap_word,
            T.SELECT_MEANING: self._select_meaning,
            T.SELECT_FOREIGN: self._select_foreign,
            T.TRUE_FALSE: self._true_false,
            T.MINI_CONVERSATION: self._mini_conversation,
            T.TYPE_MEANING: self._type_meaning,
            T.TYPE_TARGET: self._type_target,
            T.MISSING_LETTERS: self._missing_letters,
            T.LISTENING: self._listening,
            T.LISTEN_IMAGE: self._listen_image,
            T.LISTEN_TYPE: self._listen_type,
            T.FILL_BLANK: self._fill_blank,
            T.SENTENCE: self._sentence,
            T.SPEAKING: self._speaking,
            T.DRAG_DROP: self._drag_drop,
            T.WORD_BANK: self._word_bank,
        }
        builder = builders.get(template)
        if builder:
            step = builder(word, phase=phase)
            step.setdefault("metadata", {})["template"] = template
            if phase in (T.MIXED_REVIEW, T.BOSS_REVIEW):
                step["metadata"]["reviewKind"] = phase
            return step
        return self._select_foreign(word, phase=phase)

    def build_match(self, words: list[dict], *, phase: str = "review", memory: bool = False) -> dict:
        return self._match_pairs(words, phase=phase, memory=memory)

    def build_word_bank_sentence(self, drill: dict) -> dict:
        tokens = list(drill["tokens"])
        self.rng.shuffle(tokens)
        return {
            "type": ExerciseType.word_bank,
            "prompt": drill["prompt"],
            "correct_answer": {"words": drill["words"]},
            "metadata": {
                "phase": "production",
                "stage": "sentence",
                "template": T.WORD_BANK,
                "layout": "word_bank",
                "tokens": tokens,
                "vocabulary_id": drill["id"],
                "targetLanguage": self.target_lang,
            },
            "options": [{"label": t, "is_correct": t in drill["words"]} for t in tokens],
        }

    def _meta(self, word: dict, phase: str, template: str, layout: str | None = None) -> dict:
        return {
            "phase": phase,
            "stage": "practice",
            "template": template,
            "layout": layout or template,
            "vocabulary_id": word["id"],
            "englishMeaning": word["english"],
            "targetWord": word["target"],
            "romanization": word.get("romanization", ""),
            "pronunciation": word.get("pronunciation") or word.get("romanization", ""),
            "targetLanguage": self.target_lang,
        }

    def _option_pronunciations(self, targets: list[str]) -> dict[str, str]:
        out: dict[str, str] = {}
        for target in targets:
            word = self.pool.get_by_target(target)
            if not word:
                continue
            pron = word.get("pronunciation") or word.get("romanization", "")
            if pron:
                out[target] = pron
        return out

    def _flashcard_intro(self, word: dict, *, phase: str = "introduce") -> dict:
        return {
            "type": ExerciseType.intro,
            "prompt": "",
            "correct_answer": {"acknowledged": True},
            "metadata": {
                **self._meta(word, phase, T.FLASHCARD_INTRO, "flashcard"),
                "isNewWord": True,
                "pronunciation": word.get("pronunciation", ""),
                "englishMeaning": word["english"],
                "image": word.get("image"),
                "audio": word.get("audio"),
            },
            "options": [],
        }

    def _image_vocab(self, word: dict, *, phase: str = "introduce") -> dict:
        return {
            "type": ExerciseType.intro,
            "prompt": "",
            "correct_answer": {"acknowledged": True},
            "metadata": {
                **self._meta(word, phase, T.IMAGE_VOCAB, "image_vocab"),
                "isNewWord": False,
                "englishMeaning": word["english"],
                "pronunciation": word.get("pronunciation", ""),
                "image": word.get("image") or "/vocab/hello.svg",
                "audio": word.get("audio"),
            },
            "options": [],
        }

    def _picture_recognition(self, word: dict, *, phase: str = "recognition") -> dict:
        others = self.pool.others(word, with_image=True)
        self.rng.shuffle(others)
        pool_words = ([word] if word.get("image") else []) + others[:2]
        if len(pool_words) < 3:
            pool_words = [word] + self.pool.others(word)[:2]
        seen_targets: set[str] = set()
        unique_pool: list[dict] = []
        for w in pool_words:
            t = w.get("target", "")
            if t and t not in seen_targets:
                seen_targets.add(t)
                unique_pool.append(w)
        pool_words = unique_pool if len(unique_pool) >= 3 else pool_words[:3]
        self.rng.shuffle(pool_words)
        cards = [
            {
                "targetWord": w["target"],
                "romanization": w.get("romanization", ""),
                "pronunciation": w.get("pronunciation") or w.get("romanization", ""),
                "image": w.get("image") or "/vocab/hello.svg",
            }
            for w in pool_words[:3]
        ]
        return {
            "type": ExerciseType.image_selection,
            "prompt": P.pick(self.rng, P.PICTURE_PROMPTS, english=word["english"]),
            "correct_answer": {"selected": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.PICTURE_RECOGNITION, "picture_grid"),
                "options": cards,
                "hideEnglishLabels": True,
            },
            "options": [
                {"label": c["targetWord"], "image_url": c["image"], "is_correct": c["targetWord"] == word["target"]}
                for c in cards
            ],
        }

    def _tap_word(self, word: dict, *, phase: str = "recognition") -> dict:
        options = self.pool.sample_targets(word, 4, self.rng)
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": P.pick(self.rng, P.TAP_WORD_PROMPTS, english=word["english"]),
            "correct_answer": {"selected": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.TAP_WORD, "tap_chips"),
                "options": options,
                "optionPronunciations": self._option_pronunciations(options),
                "showPromptAsTarget": True,
            },
            "options": [{"label": o, "is_correct": o == word["target"]} for o in options],
        }

    def _select_meaning(self, word: dict, *, phase: str = "recognition") -> dict:
        options = self.pool.sample_english(word, 3, self.rng)
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": P.pick(self.rng, P.SELECT_MEANING_PROMPTS, target=word["target"]),
            "correct_answer": {"selected": word["english"]},
            "metadata": {**self._meta(word, phase, T.SELECT_MEANING, "meaning_cards"), "options": options},
            "options": [{"label": o, "is_correct": o == word["english"]} for o in options],
        }

    def _select_foreign(self, word: dict, *, phase: str = "recognition") -> dict:
        options = self.pool.sample_targets(word, 3, self.rng)
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": P.pick(self.rng, P.SELECT_FOREIGN_PROMPTS, english=word["english"], lang=self.lang_label),
            "correct_answer": {"selected": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.SELECT_FOREIGN, "foreign_cards"),
                "options": options,
                "optionPronunciations": self._option_pronunciations(options),
            },
            "options": [{"label": o, "is_correct": o == word["target"]} for o in options],
        }

    def _true_false(self, word: dict, *, phase: str = "recognition") -> dict:
        is_true = self.rng.random() > 0.45
        if is_true:
            statement = f'{word["target"]} = {word["english"]}'
            correct = "True"
        else:
            other = self.rng.choice(self.pool.others(word) or [word])
            statement = f'{word["target"]} = {other["english"]}'
            correct = "False"
        return {
            "type": ExerciseType.multiple_choice,
            "prompt": statement,
            "correct_answer": {"selected": correct},
            "metadata": {**self._meta(word, phase, T.TRUE_FALSE, "true_false"), "options": ["True", "False"]},
            "options": [{"label": "True", "is_correct": correct == "True"}, {"label": "False", "is_correct": correct == "False"}],
        }

    def _mini_conversation(self, word: dict, *, phase: str = "recall") -> dict:
        from .conversation_scenarios import get_scenario_for_word, resolve_response_word

        scenario = get_scenario_for_word(word)
        if not scenario:
            return self._select_foreign(word, phase=phase)

        response_word = resolve_response_word(scenario, self.pool.get) or word
        line_a = scenario.get("line_a", f'{word["english"]}!')
        options = self.pool.sample_targets(response_word, 3, self.rng)
        correct = response_word["target"]

        return {
            "type": ExerciseType.multiple_choice,
            "prompt": P.pick(self.rng, P.CONVERSATION_PROMPTS, line_a=line_a),
            "correct_answer": {"selected": correct},
            "metadata": {
                **self._meta(word, phase, T.MINI_CONVERSATION, "conversation"),
                "options": options,
                "conversationLineA": line_a,
                "responseWordId": response_word["id"],
            },
            "options": [{"label": o, "is_correct": o == correct} for o in options],
        }

    def _type_meaning(self, word: dict, *, phase: str = "recall") -> dict:
        return {
            "type": ExerciseType.type_answer,
            "prompt": P.pick(self.rng, P.TYPE_MEANING_PROMPTS, target=word["target"]),
            "correct_answer": {"text": word["english"]},
            "metadata": {
                **self._meta(word, phase, T.TYPE_MEANING, "typing"),
                "alternatives": [word["english"]],
                "skippable": True,
            },
            "options": [],
        }

    def _type_target(self, word: dict, *, phase: str = "production") -> dict:
        alts = [word["target"]]
        if self.accept_romanization:
            for key in ("romanization", "pronunciation"):
                if word.get(key):
                    alts.append(word[key])
        return {
            "type": ExerciseType.type_answer,
            "prompt": P.pick(self.rng, P.TYPE_TARGET_PROMPTS, english=word["english"], lang=self.lang_label),
            "correct_answer": {"text": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.TYPE_TARGET, "typing"),
                "alternatives": alts,
                "accept_romanization": self.accept_romanization,
                "skippable": True,
            },
            "options": [],
        }

    def _missing_letters(self, word: dict, *, phase: str = "recall") -> dict:
        target = word["target"]
        if len(target) <= 2:
            partial = target[0] + "__"
        else:
            mid = len(target) // 2
            partial = target[:mid] + "__" + target[mid + 1 :]
        alts = [word["target"]]
        if self.accept_romanization and word.get("romanization"):
            alts.append(word["romanization"])
        return {
            "type": ExerciseType.type_answer,
            "prompt": P.pick(self.rng, P.MISSING_LETTERS_PROMPTS, partial=partial),
            "correct_answer": {"text": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.MISSING_LETTERS, "missing_letters"),
                "alternatives": alts,
                "partialWord": partial,
                "accept_romanization": self.accept_romanization,
                "skippable": True,
            },
            "options": [],
        }

    def _listening(self, word: dict, *, phase: str = "recall") -> dict:
        if not word.get("audio"):
            return self._select_meaning(word, phase=phase)
        options = self.pool.sample_english(word, 3, self.rng)
        return {
            "type": ExerciseType.listening,
            "prompt": P.pick(self.rng, P.LISTENING_PROMPTS),
            "prompt_audio_url": word["audio"],
            "correct_answer": {"selected": word["english"]},
            "metadata": {
                **self._meta(word, phase, T.LISTENING, "listening"),
                "options": options,
                "pronunciation": word.get("pronunciation"),
            },
            "options": [{"label": o, "is_correct": o == word["english"]} for o in options],
        }

    def _listen_image(self, word: dict, *, phase: str = "recall") -> dict:
        if not word.get("audio"):
            return self._picture_recognition(word, phase=phase)
        step = self._picture_recognition(word, phase=phase)
        step["prompt"] = P.pick(self.rng, P.LISTEN_IMAGE_PROMPTS)
        step["prompt_audio_url"] = word["audio"]
        step["metadata"]["template"] = T.LISTEN_IMAGE
        step["metadata"]["layout"] = "listen_image"
        return step

    def _listen_type(self, word: dict, *, phase: str = "production") -> dict:
        if not word.get("audio"):
            return self._type_target(word, phase=phase)
        alts = [word["target"]]
        if self.accept_romanization:
            for key in ("romanization", "pronunciation"):
                if word.get(key):
                    alts.append(word[key])
        return {
            "type": ExerciseType.type_answer,
            "prompt": P.pick(self.rng, P.LISTEN_TYPE_PROMPTS),
            "prompt_audio_url": word["audio"],
            "correct_answer": {"text": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.LISTEN_TYPE, "listen_type"),
                "alternatives": alts,
                "accept_romanization": self.accept_romanization,
                "skippable": True,
            },
            "options": [],
        }

    def _fill_blank(self, word: dict, *, phase: str = "recall") -> dict:
        options = self.pool.sample_targets(word, 3, self.rng)
        sentence = P.pick(
            self.rng,
            P.FILL_BLANK_PROMPTS,
            english=word["english"],
            lang=self.lang_label,
        )
        return {
            "type": ExerciseType.fill_blank,
            "prompt": sentence,
            "correct_answer": {"selected": word["target"]},
            "metadata": {
                **self._meta(word, phase, T.FILL_BLANK, "fill_blank"),
                "sentence": sentence,
                "options": options,
                "optionPronunciations": self._option_pronunciations(options),
                "blankMeans": word["english"],
            },
            "options": [{"label": o, "is_correct": o == word["target"]} for o in options],
        }

    def _drag_drop(self, word: dict, *, phase: str = "production") -> dict:
        distractors = [w["target"] for w in self.pool.others(word)[:3]]
        tokens = [word["target"], *distractors]
        self.rng.shuffle(tokens)
        return {
            "type": ExerciseType.word_bank,
            "prompt": P.pick(self.rng, P.DRAG_DROP_PROMPTS, english=word["english"]),
            "correct_answer": {"words": [word["target"]]},
            "metadata": {
                **self._meta(word, phase, T.DRAG_DROP, "drag_drop"),
                "tokens": tokens,
            },
            "options": [{"label": t, "is_correct": t == word["target"]} for t in tokens],
        }

    def _sentence(self, word: dict, *, phase: str = "recall") -> dict:
        sentence = word.get("exampleSentence") or f'{word["target"]}！'
        return {
            "type": ExerciseType.type_answer,
            "prompt": f"What does this mean?\n\n{sentence}",
            "correct_answer": {"text": word["english"]},
            "metadata": {**self._meta(word, phase, T.SENTENCE, "typing"), "alternatives": [word["english"]]},
            "options": [],
        }

    def _word_bank(self, word: dict, *, phase: str = "recall") -> dict:
        """Build sentence from character/word tiles."""
        target = word["target"]
        pieces = list(target) if len(target) <= 6 else [target]
        if len(pieces) == 1:
            distractors = [w["target"][:1] for w in self.pool.others(word)[:3] if w["target"]]
            tokens = pieces + distractors
        else:
            tokens = pieces + [w["target"] for w in self.pool.others(word)[:2]]
        self.rng.shuffle(tokens)
        return {
            "type": ExerciseType.word_bank,
            "prompt": P.pick(self.rng, P.WORD_BANK_PROMPTS, english=word["english"]),
            "correct_answer": {"words": pieces if len(pieces) > 1 else [target]},
            "metadata": {
                **self._meta(word, phase, T.WORD_BANK, "word_bank"),
                "tokens": tokens,
            },
            "options": [{"label": t, "is_correct": t in pieces} for t in tokens],
        }

    def _speaking(self, word: dict, *, phase: str = "production") -> dict:
        if not word.get("audio"):
            return self._type_target(word, phase=phase)
        return {
            "type": ExerciseType.intro,
            "prompt": f'Repeat after Duo: "{word["english"]}"',
            "correct_answer": {"acknowledged": True},
            "metadata": {
                **self._meta(word, phase, T.SPEAKING, "speaking"),
                "isSpeakingPlaceholder": True,
                "englishMeaning": word["english"],
                "pronunciation": word.get("pronunciation", ""),
                "audio": word.get("audio"),
            },
            "options": [],
        }

    def _match_pairs(self, words: list[dict], *, phase: str = "review", memory: bool = False) -> dict:
        category = words[0].get("category") if words else None
        subset = self.pool.words_for_match(min(4, len(words)), category=category)
        if len(subset) < 3:
            subset = words[: min(4, len(words))]
        pairs = {w["english"]: w["target"] for w in subset}
        left = list(pairs.keys())
        right = list(pairs.values())
        shuffled = list(right)
        self.rng.shuffle(shuffled)
        template = T.MEMORY_CARDS if memory else T.MATCH_PAIRS
        layout = "memory_cards" if memory else "match_pairs"
        return {
            "type": ExerciseType.match_pairs,
            "prompt": P.pick(self.rng, P.MEMORY_PROMPTS) if memory else P.pick(self.rng, P.MATCH_PROMPTS, lang=self.lang_label),
            "correct_answer": {"pairs": pairs},
            "metadata": {
                "phase": phase,
                "stage": "review",
                "template": template,
                "layout": layout,
                "left": left,
                "right": shuffled,
                "targetLanguage": self.target_lang,
                "optionPronunciations": self._option_pronunciations(right),
            },
            "options": [],
        }
