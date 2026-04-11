"""
SpaceMind OS — In-Memory TTL Cache
Lightweight cache for read-heavy, rarely-changing endpoints.
Adopted from UFM project pattern: avoid redundant DB/AI calls for stable data.

Usage:
    cache = TTLCache(ttl_seconds=300)

    @cache.cached("locations")
    def get_locations():
        return expensive_db_call()

    # Or manually:
    cache.set("analytics", data)
    cache.get("analytics")  # Returns None if expired
"""
from __future__ import annotations

import functools
import threading
import time
from typing import Any, Callable


class TTLCache:
    """
    Thread-safe in-memory cache with per-entry TTL.
    Entries expire after `ttl_seconds`. No external dependencies.
    """

    def __init__(self, ttl_seconds: int = 300):
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[Any, float]] = {}   # key → (value, expires_at)
        self._lock = threading.RLock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = (value, time.monotonic() + self._ttl)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def cached(self, key: str) -> Callable:
        """
        Decorator: cache the return value of the decorated function under `key`.
        Example:
            @cache.cached("locations_list")
            def list_locs(): ...
        """
        def decorator(fn: Callable) -> Callable:
            @functools.wraps(fn)
            def wrapper(*args, **kwargs):
                hit = self.get(key)
                if hit is not None:
                    return hit
                result = fn(*args, **kwargs)
                self.set(key, result)
                return result
            return wrapper
        return decorator


# ─── Shared cache instances ────────────────────────────────────────────────────

# Locations: essentially static — 10 minute TTL
locations_cache = TTLCache(ttl_seconds=600)

# Analytics: updated on every decompose — 2 minute TTL
analytics_cache = TTLCache(ttl_seconds=120)
