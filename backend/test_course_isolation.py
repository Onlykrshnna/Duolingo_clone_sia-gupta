"""Verify lessons are scoped to the active course."""
import json
import urllib.request
import urllib.error
import sys

BASE = "http://127.0.0.1:8001/api/v1"
SPANISH = "c0000000-0000-0000-0000-000000000000"
FRENCH = "c1000000-0000-0000-0000-000000000001"
JAPANESE = "c3000000-0000-0000-0000-000000000003"


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=30) as resp:
        return json.loads(resp.read())


def post(path, body=None):
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def switch(course_id):
    code, body = post(f"/users/me/switch-course", {"course_id": course_id})
    assert code == 200, body
    return body


def first_lesson(course_id):
    path = get(f"/courses/{course_id}/path")
    for unit in path["units"]:
        for skill in unit["skills"]:
            if skill["status"] in ("available", "in_progress") and skill.get("next_lesson_id"):
                return skill["next_lesson_id"]
    raise RuntimeError(f"No lesson for course {course_id}")


def sample_target_word(lesson):
    for ex in lesson.get("exercises") or []:
        meta = ex.get("metadata") or {}
        target = meta.get("targetWord") or meta.get("target")
        if target:
            return target
        for opt in ex.get("options") or []:
            if opt.get("is_correct"):
                return opt.get("label")
    return None


def main():
    results = []
    for course_id, label, forbidden in [
        (SPANISH, "Spanish", ["こんにちは", "Bonjour"]),
        (FRENCH, "French", ["Hola", "こんにちは"]),
        (JAPANESE, "Japanese", ["Hola", "Bonjour"]),
    ]:
        switch(course_id)
        lid = first_lesson(course_id)
        lesson = get(f"/courses/{course_id}/lessons/{lid}")
        assert lesson.get("language_code"), f"{label}: missing language_code"
        word = sample_target_word(lesson)
        assert word, f"{label}: no vocabulary found"
        for bad in forbidden:
            assert bad not in (word or ""), f"{label}: leaked {bad!r} in {word!r}"
        results.append(f"{label}: ok ({word!r})")

        # Wrong course must be rejected
        wrong = FRENCH if course_id == SPANISH else SPANISH
        code, _ = post(f"/courses/{wrong}/lessons/{lid}/start")
        assert code == 403, f"{label}: expected 403 starting lesson on wrong course, got {code}"

    print("Course isolation OK:")
    for line in results:
        print(" ", line)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("FAIL:", exc, file=sys.stderr)
        sys.exit(1)
