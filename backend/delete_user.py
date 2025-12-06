from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy.future import select
import asyncio

async def delete_user():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@test.com"))
        user = result.scalars().first()
        if user:
            await session.delete(user)
            await session.commit()
            print("User deleted")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(delete_user())
