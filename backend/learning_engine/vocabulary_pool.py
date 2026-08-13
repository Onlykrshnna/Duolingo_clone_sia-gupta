"""Vocabulary pool with semantic-category distractor sampling."""
from __future__ import annotations

import random


class VocabularyPool:
    def __init__(self, words: list[dict], *, rng: random.Random | None = None):
        self.words = list(words)
        self.by_id = {w["id"]: w for w in self.words}
        self.by_target = {w["target"]: w for w in self.words if w.get("target")}
        self.rng = rng or random.Random(0)
        self._by_category: dict[str, list[dict]] = {}
        for w in self.words:
            cat = w.get("category") or "general"
            self._by_category.setdefault(cat, []).append(w)

    def get(self, word_id: str) -> dict | None:
        return self.by_id.get(word_id)

    def get_by_target(self, target: str) -> dict | None:
        return self.by_target.get(target)

    def get_category(self, word: dict) -> str:
        return word.get("category") or "general"

    def sample_distractors(
        self,
        word: dict,
        count: int,
        *,
        field: str = "target",
        exclude_ids: set[str] | None = None,
    ) -> list[dict]:
        """Prefer same semantic category; fall back to lesson pool."""
        exclude = exclude_ids or set()
        exclude.add(word["id"])
        category = self.get_category(word)
        same_cat = [w for w in self._by_category.get(category, []) if w["id"] not in exclude]
        pool = same_cat if len(same_cat) >= count else [
            w for w in self.words if w["id"] not in exclude
        ]
        if len(pool) < count:
            return pool
        return self.rng.sample(pool, count)

    def sample_labels(
        self,
        word: dict,
        count: int,
        *,
        field: str = "target",
        exclude_ids: set[str] | None = None,
    ) -> list[str]:
        distractors = self.sample_distractors(word, count, field=field, exclude_ids=exclude_ids)
        labels = [d[field] for d in distractors]
        if field == "target":
            labels = [self._display(w) for w in distractors]
        return labels

    def _display(self, word: dict) -> str:
        return word.get("target") or word.get("english", "")

    def build_options(
        self,
        word: dict,
        *,
        field: str = "target",
        count: int = 3,
        correct_label: str | None = None,
    ) -> tuple[list[dict], str]:
        correct = correct_label or (self._display(word) if field == "target" else word["english"])
        wrong = self.sample_labels(word, count, field=field)
        labels = [correct] + [w for w in wrong if w != correct]
        labels = list(dict.fromkeys(labels))[: count + 1]
        while len(labels) < min(count + 1, len(self.words)):
            extra = self.sample_labels(word, 1, field=field)
            for e in extra:
                if e not in labels:
                    labels.append(e)
            if len(labels) >= count + 1:
                break
        self.rng.shuffle(labels)
        options = [{"label": lbl, "is_correct": lbl == correct} for lbl in labels]
        return options, correct

    def words_for_match(self, count: int = 4, *, category: str | None = None) -> list[dict]:
        if category and len(self._by_category.get(category, [])) >= count:
            return self.rng.sample(self._by_category[category], count)
        if len(self.words) >= count:
            return self.rng.sample(self.words, count)
        return list(self.words)

    def review_candidates(
        self,
        introduced_ids: list[str],
        *,
        exclude_id: str | None = None,
        used_in_block: set[str] | None = None,
    ) -> list[str]:
        """Pick review words with diversity — no repeats in block."""
        used = used_in_block or set()
        eligible = [
            wid
            for wid in introduced_ids
            if wid != exclude_id and wid not in used
        ]
        return eligible

    def others(self, word: dict, *, with_image: bool = False) -> list[dict]:
        exclude = {word["id"]}
        pool = [w for w in self.words if w["id"] not in exclude]
        if with_image:
            with_img = [w for w in pool if w.get("image")]
            if len(with_img) >= 2:
                return with_img
        return pool

    def sample_targets(self, word: dict, count: int, rng: random.Random | None = None) -> list[str]:
        rng = rng or self.rng
        labels = self.sample_labels(word, count, field="target")
        options = [word["target"]] + [l for l in labels if l and str(l).strip() and l != word["target"]]
        options = list(dict.fromkeys(o for o in options if o and str(o).strip()))
        while len(options) < min(count + 1, len(self.words)):
            extra = self.sample_labels(word, 1, field="target")
            for e in extra:
                if e and str(e).strip() and e not in options:
                    options.append(e)
            if len(options) >= count + 1:
                break
        rng.shuffle(options)
        return options[: count + 1]

    def sample_english(self, word: dict, count: int, rng: random.Random | None = None) -> list[str]:
        rng = rng or self.rng
        distractors = self.sample_distractors(word, count, field="english")
        options = [word["english"]] + [d["english"] for d in distractors if d.get("english") and d["english"] != word["english"]]
        options = list(dict.fromkeys(o for o in options if o and str(o).strip()))
        while len(options) < min(count + 1, len(self.words)):
            extra = self.sample_distractors(word, 1, field="english")
            for d in extra:
                if d["english"] not in options:
                    options.append(d["english"])
            if len(options) >= count + 1:
                break
        rng.shuffle(options)
        return options[: count + 1]
