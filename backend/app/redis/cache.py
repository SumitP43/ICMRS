import json
from typing import Any, Optional, Callable
from functools import wraps
from backend.app.redis.client import redis_client
from backend.app.config import settings

def get_cached(key: str) -> Optional[Any]:
    data = redis_client.get(key)
    if data:
        try:
            return json.loads(data)
        except Exception:
            return data
    return None

def set_cached(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    ttl = ttl or settings.REDIS_CACHE_TTL
    try:
        serialized = json.dumps(value, default=str)
        return redis_client.set(key, serialized, ex=ttl)
    except Exception:
        return False

def invalidate_cache(*keys: str):
    for key in keys:
        redis_client.delete(key)

def invalidate_pattern(pattern: str):
    redis_client.delete_pattern(pattern)
