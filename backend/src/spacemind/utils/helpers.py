"""General utilities."""
from datetime import datetime


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def truncate(text: str, max_len: int = 100) -> str:
    return text if len(text) <= max_len else text[:max_len] + "…"
