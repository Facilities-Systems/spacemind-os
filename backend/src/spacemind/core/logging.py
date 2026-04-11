"""
SpaceMind OS — Structured Logging
Rich console output in dev, JSON in production.
"""
import logging
import sys
from functools import lru_cache

from rich.console import Console
from rich.logging import RichHandler

from spacemind.core.config import settings


@lru_cache(maxsize=1)
def get_logger(name: str = "spacemind") -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logger.setLevel(level)

    if settings.is_production:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '{"time": "%(asctime)s", "level": "%(levelname)s", '
            '"module": "%(module)s", "msg": "%(message)s"}'
        )
        handler.setFormatter(formatter)
    else:
        handler = RichHandler(
            console=Console(stderr=True),
            rich_tracebacks=True,
            markup=True,
            show_path=False,
        )

    logger.addHandler(handler)
    logger.propagate = False
    return logger


log = get_logger()
