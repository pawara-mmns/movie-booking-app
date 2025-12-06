from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Default to SQLite for local development if DATABASE_URL not set
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./cinesphere.db")

engine = create_async_engine(
    DATABASE_URL,
    echo=True, # Set to False in production
    pool_pre_ping=True
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    print("DEBUG: Getting DB session")
    async with AsyncSessionLocal() as session:
        yield session
