import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and "db.supabase.co" not in DATABASE_URL:
    # SQLAlchemy requires postgresql+asyncpg:// for async pg drivers
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    # Use SQLite for local development fallback
    DATABASE_URL = "sqlite+aiosqlite:///./duolingo.db"
