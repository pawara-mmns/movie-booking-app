import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _database_url() -> str:
    """Return a Supabase PostgreSQL URL suitable for SQLAlchemy + asyncpg."""
    value = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not value:
        raise RuntimeError(
            "SUPABASE_DATABASE_URL is required. Copy the Postgres connection string "
            "from Supabase Dashboard > Connect into backend/.env."
        )
    if value.startswith("sqlite"):
        raise RuntimeError("SQLite is no longer supported; use SUPABASE_DATABASE_URL.")
    if value.startswith("postgres://"):
        value = "postgresql://" + value.removeprefix("postgres://")
    if value.startswith("postgresql://"):
        value = "postgresql+asyncpg://" + value.removeprefix("postgresql://")
    if not value.startswith("postgresql+asyncpg://"):
        raise RuntimeError("SUPABASE_DATABASE_URL must be a PostgreSQL connection string.")
    return value


DATABASE_URL = _database_url()

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
