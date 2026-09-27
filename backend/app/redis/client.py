import os
import json
import time
import socket
from typing import Optional, Any, Dict
from backend.app.config import settings
from backend.app.core.logging import logger

def is_redis_available(host: str = "localhost", port: int = 6379, timeout: float = 0.1) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

# In-memory mock store for environments without a live Redis server running
_in_memory_store: Dict[str, tuple[Any, Optional[float]]] = {}

class RedisManager:
    def __init__(self):
        self._client = None
        self._connected = False
        self._init_client()

    def _init_client(self):
        # Quick check if redis port is open
        if not is_redis_available("localhost", 6379, timeout=0.1):
            self._connected = False
            self._client = None
            logger.info("Using high-performance in-memory coordination (Redis standalone not active).")
            return

        try:
            import redis
            self._client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=0.2
            )
            self._client.ping()
            self._connected = True
            logger.info("Connected to Redis server successfully.")
        except Exception:
            self._connected = False
            self._client = None
            logger.info("Using high-performance in-memory coordination fallback.")

    @property
    def is_connected(self) -> bool:
        return self._connected

    def get(self, key: str) -> Optional[str]:
        if self._connected and self._client:
            try:
                return self._client.get(key)
            except Exception:
                pass
        # In-memory fallback with TTL check
        val_entry = _in_memory_store.get(key)
        if val_entry:
            val, expiry = val_entry
            if expiry is None or time.time() < expiry:
                return val
            else:
                _in_memory_store.pop(key, None)
        return None

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if self._connected and self._client:
            try:
                return bool(self._client.set(key, value, ex=ex))
            except Exception:
                pass
        expiry = time.time() + ex if ex else None
        _in_memory_store[key] = (value, expiry)
        return True

    def delete(self, *keys: str) -> int:
        if self._connected and self._client:
            try:
                return self._client.delete(*keys)
            except Exception:
                pass
        count = 0
        for k in keys:
            if k in _in_memory_store:
                del _in_memory_store[k]
                count += 1
        return count

    def delete_pattern(self, pattern: str) -> int:
        if self._connected and self._client:
            try:
                matched = self._client.keys(pattern)
                if matched:
                    return self._client.delete(*matched)
                return 0
            except Exception:
                pass
        # Simple wildcard matching
        prefix = pattern.rstrip("*")
        to_del = [k for k in _in_memory_store if k.startswith(prefix)]
        for k in to_del:
            del _in_memory_store[k]
        return len(to_del)

redis_client = RedisManager()
