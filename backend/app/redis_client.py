import os
import time
from typing import Optional

# Try to import redis, but handle failure gracefully if not installed yet or server not running
try:
    import redis.asyncio as redis
except ImportError:
    redis = None

class RedisManager:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis: Optional[redis.Redis] = None
        self.mock_store = {} # Fallback for local dev without Redis

    async def connect(self):
        if redis:
            try:
                self.redis = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
                await self.redis.ping()
                print("Connected to Redis")
            except Exception as e:
                print(f"Could not connect to Redis: {e}. Using In-Memory Mock.")
                self.redis = None
        else:
             print("Redis library not found. Using In-Memory Mock.")

    async def get(self, key: str):
        if self.redis:
            return await self.redis.get(key)
        entry = self.mock_store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if expires_at is not None and expires_at <= time.monotonic():
            del self.mock_store[key]
            return None
        return value

    async def set(self, key: str, value: str, expire: int = None):
        if self.redis:
            await self.redis.set(key, value, ex=expire)
        else:
            expires_at = time.monotonic() + expire if expire else None
            self.mock_store[key] = (value, expires_at)

    async def delete(self, key: str):
        if self.redis:
            await self.redis.delete(key)
        else:
            if key in self.mock_store:
                del self.mock_store[key]

    async def keys(self, pattern: str):
        if self.redis:
            return [key async for key in self.redis.scan_iter(match=pattern)]
        prefix = pattern.rstrip("*")
        matching = []
        for key in list(self.mock_store):
            if await self.get(key) is not None and key.startswith(prefix):
                matching.append(key)
        return matching

    async def setnx(self, key: str, value: str, expire: int = 300) -> bool:
        """Sets key if not exists (Atomic lock)"""
        if self.redis:
             # Redis setnx does not support expire directly in one command in older versions 
             # but we can use set(..., nx=True, ex=expire)
             return await self.redis.set(key, value, nx=True, ex=expire)
        else:
            if await self.get(key) is not None:
                return False
            self.mock_store[key] = (value, time.monotonic() + expire if expire else None)
            return True

redis_client = RedisManager()
