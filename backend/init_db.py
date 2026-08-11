# init_db.py
import asyncio
from app.database import engine, Base
from app.models import User, Movie, Screen, Showtime, Booking, Ticket

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Supabase tables are ready.")

if __name__ == "__main__":
    asyncio.run(init_db())
