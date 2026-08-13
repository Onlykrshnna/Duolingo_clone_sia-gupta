"""Quick sanity check for lesson generation quality."""
from lesson_generator import load_lesson_content
from learning_engine import LessonBuilder


def check(key: str, lang: str = "es") -> None:
    data = load_lesson_content(lang, key)
    steps = LessonBuilder(
        data["vocabulary"],
        data["targetLanguage"],
        prior_vocabulary_ids=data.get("priorVocabularyIds"),
        seed=42,
    ).build_steps()

    vocab_counts: dict[str, int] = {}
    invalid: list[tuple] = []
    templates: dict[str, int] = {}

    for s in steps:
        meta = s.get("metadata", {})
        vid = meta.get("vocabulary_id")
        tmpl = meta.get("template", "")
        templates[tmpl] = templates.get(tmpl, 0) + 1
        if vid:
            vocab_counts[vid] = vocab_counts.get(vid, 0) + 1

        if tmpl == "fill_blank":
            ca = s.get("correct_answer", {}).get("selected")
            eng = meta.get("englishMeaning", "")
            if ca == eng:
                invalid.append(("fill_blank english answer", s.get("prompt"), ca))

        if tmpl == "mini_conversation":
            line_a = meta.get("conversationLineA", "")
            if line_a == meta.get("targetWord"):
                invalid.append(("unnatural conversation", s.get("prompt")))

    over2 = {k: v for k, v in vocab_counts.items() if v > 2}
    print(
        f"{key}: words={len(data['vocabulary'])} steps={len(steps)} "
        f"over2={len(over2)} invalid={len(invalid)} "
        f"prior={len(data.get('priorVocabularyIds', []))}"
    )
    if invalid:
        print("  invalid:", invalid[:5])
    if over2:
        print("  over2:", over2)


if __name__ == "__main__":
    for k in ["greetings", "food", "travel"]:
        check(k)
