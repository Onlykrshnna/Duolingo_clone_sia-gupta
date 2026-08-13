"""Shared auth helpers (avoids circular imports between route modules)."""
from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import User


async def get_user_or_default(db: AsyncSession, user_id_str: str) -> User:
    try:
        user_uuid = uuid.UUID(user_id_str)
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if user:
            return user
    except ValueError:
        pass

    result = await db.execute(select(User).where(User.is_default_learner == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found and no default learner is seeded. Please run the seed script.",
        )
    return user
