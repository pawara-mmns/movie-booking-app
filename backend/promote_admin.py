import argparse
import asyncio

from sqlalchemy import update

from app.database import AsyncSessionLocal
from app.models import User


async def promote(email: str) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            update(User).where(User.email == email).values(role="ADMIN")
        )
        await session.commit()
    if result.rowcount:
        print(f"Promoted {email} to ADMIN in Supabase.")
    else:
        print(f"No user found for {email}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a CineSphere user to admin")
    parser.add_argument("email", nargs="?", default="admin@test.com")
    args = parser.parse_args()
    asyncio.run(promote(args.email))
