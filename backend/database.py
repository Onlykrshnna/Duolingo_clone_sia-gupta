from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import DATABASE_URL

# Create async database engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Session maker for creating async sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# Declarative base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Dependency generator to retrieve async sessions in FastAPI routers
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
