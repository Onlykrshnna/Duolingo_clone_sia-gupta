from datetime import date
from logic import compute_streak

def test_first_ever_activity():
    # Scenario 1: First-ever activity (last_activity_date is None)
    # Expected: Streak initializes to 1
    assert compute_streak(None, date(2026, 8, 13), 0) == 1


def test_same_day_noop():
    # Scenario 2: Same-day activity (last_activity_date is today)
    # Expected: Streak remains at the current value (no change)
    assert compute_streak(date(2026, 8, 13), date(2026, 8, 13), 5) == 5


def test_consecutive_day_increment():
    # Scenario 3: Consecutive-day activity (last_activity_date was yesterday)
    # Expected: Streak increments by 1
    assert compute_streak(date(2026, 8, 12), date(2026, 8, 13), 5) == 6


def test_gap_day_reset():
    # Scenario 4: Gap-day activity (last_activity_date was more than 1 day ago)
    # Expected: Streak resets back to 1
    assert compute_streak(date(2026, 8, 10), date(2026, 8, 13), 5) == 1


def test_daily_xp_reset_on_new_day():
    from logic import should_reset_daily_xp

    assert should_reset_daily_xp(date(2026, 8, 12), date(2026, 8, 13)) is True
    assert should_reset_daily_xp(date(2026, 8, 13), date(2026, 8, 13)) is False
    assert should_reset_daily_xp(None, date(2026, 8, 13)) is False
