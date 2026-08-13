import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
COURSE_ID = "c0000000-0000-0000-0000-000000000000"

def get(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post(endpoint, body=None):
    data = json.dumps(body or {}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def log(msg):
    print(msg, flush=True)

def main():
    log("--- STEP 1: INITIAL STATE ---")
    stats_before = get("/users/me/stats")
    path_before = get(f"/courses/{COURSE_ID}/path")

    log(f"Initial Streak: {stats_before['current_streak']}")
    log(f"Initial Total XP: {stats_before['total_xp']}")
    log(f"Initial Gems: {stats_before['gems']}")
    log(f"Initial Hearts: {stats_before['hearts_current']}/{stats_before['hearts_max']}")

    unit1 = path_before['units'][0]
    skills = unit1['skills']
    log("\nInitial Unit 1 Skills:")
    for s in skills:
        log(f"  - Skill '{s['title']}': Status={s['status']}, Level={s['current_level']}, Completed Lessons={s['lessons_completed']}, NextLessonId={s['next_lesson_id']}")

    active_skill = next((s for s in skills if s['status'] in ['available', 'in_progress']), None)
    if not active_skill:
        log("ERROR: No active skill found!")
        sys.exit(1)

    lesson_id = active_skill['next_lesson_id']
    log(f"\n--- STEP 2: STARTING LESSON '{lesson_id}' for Skill '{active_skill['title']}' ---")
    start_resp = post(f"/lessons/{lesson_id}/start", {"user_id": stats_before["user_id"]})
    attempt_id = start_resp["attempt_id"]
    log(f"Started attempt {attempt_id}.")

    lesson_details = get(f"/lessons/{lesson_id}")
    exercises = lesson_details["exercises"]
    log(f"Lesson has {len(exercises)} exercises.")

    log("\n--- STEP 3: SUBMITTING CORRECT ANSWERS FOR ALL EXERCISES ---")
    for ex in exercises:
        ex_id = ex["id"]
        correct_ans = ex.get("correct_answer", {})
        ans_resp = post(f"/lessons/attempts/{attempt_id}/answer", {
            "exercise_id": ex_id,
            "submitted_answer": correct_ans
        })
        log(f"  Ex ID '{ex_id}' (Type: {ex['type']}): Correct={ans_resp['correct']}")

    log("\n--- STEP 4: COMPLETING LESSON ---")
    complete_resp = post(f"/lessons/attempts/{attempt_id}/complete")
    log(f"Lesson Complete! Result={complete_resp['result']}, XP Earned={complete_resp['xp_earned']}")

    log("\n--- STEP 5: VERIFYING UPDATED STATE ---")
    stats_after = get("/users/me/stats")
    path_after = get(f"/courses/{COURSE_ID}/path")

    log(f"Updated Total XP: {stats_after['total_xp']} (Delta: +{stats_after['total_xp'] - stats_before['total_xp']})")
    log(f"Updated Streak: {stats_after['current_streak']}")
    
    skills_after = path_after['units'][0]['skills']
    log("\nUpdated Unit 1 Skills:")
    for s in skills_after:
        log(f"  - Skill '{s['title']}': Status={s['status']}, Level={s['current_level']}, Completed Lessons={s['lessons_completed']}")

    log("\n--- VERIFICATION SUCCESSFUL ---")

if __name__ == "__main__":
    main()
