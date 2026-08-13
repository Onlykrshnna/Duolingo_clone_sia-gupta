from datetime import date, datetime, timedelta
from typing import Optional

# Constant regen rate: 30 minutes (1800 seconds) per heart
REGEN_INTERVAL_SECONDS = 1800

def compute_streak(
    last_activity_date: Optional[date],
    today: date,
    current_streak: int
) -> int:
    """
    Pure streak computation logic:
    - If no activity has ever been recorded: return 1.
    - If activity is on the same day (or in the past): return current streak (no-op).
    - If activity is on the consecutive next day: return current streak + 1.
    - If a gap of more than 1 day exists: reset streak to 1.
    """
    if last_activity_date is None:
        return 1

    delta = (today - last_activity_date).days

    if delta <= 0:
        # Same-day or past activity (timezone/skew safe): return current
        return current_streak
    elif delta == 1:
        # Consecutive day activity
        return current_streak + 1
    else:
        # Gap > 1 day: reset
        return 1


def calculate_regenerated_hearts(
    hearts_current: int,
    hearts_max: int,
    last_heart_lost_at: Optional[datetime],
    now: datetime
) -> tuple[int, Optional[datetime]]:
    """
    Pure heart regeneration calculation:
    - If already at max hearts: return max hearts and None.
    - If last_heart_lost_at is not set: return current hearts and None.
    - If elapsed time is negative: return current values.
    - Otherwise, calculate regenerated hearts. Shift last_heart_lost_at
      forward for any remaining time towards the next heart.
    """
    if hearts_current >= hearts_max:
        return hearts_max, None

    if last_heart_lost_at is None:
        return hearts_current, None

    elapsed = (now - last_heart_lost_at).total_seconds()
    if elapsed <= 0:
        return hearts_current, last_heart_lost_at

    regen_count = int(elapsed // REGEN_INTERVAL_SECONDS)

    if regen_count > 0:
        new_hearts = min(hearts_max, hearts_current + regen_count)
        if new_hearts >= hearts_max:
            return hearts_max, None
        else:
            new_lost_at = last_heart_lost_at + timedelta(seconds=regen_count * REGEN_INTERVAL_SECONDS)
            return new_hearts, new_lost_at

    return hearts_current, last_heart_lost_at


def should_reset_daily_xp(last_activity_date: Optional[date], today: date) -> bool:
    """Reset daily XP counter when the calendar day has rolled over since last activity."""
    if last_activity_date is None:
        return False
    return last_activity_date < today
