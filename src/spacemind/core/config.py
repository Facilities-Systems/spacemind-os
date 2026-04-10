"""
SpaceMind OS — Core Configuration
Central settings object loaded once at startup from .env
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "SpaceMind OS"
    app_version: str = "1.0.0"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True
    log_level: str = "INFO"

    # AI
    anthropic_api_key: str = ""
    primary_model: str = "claude-sonnet-4-6"
    fast_model: str = "claude-haiku-4-5-20251001"
    max_tokens: int = 4096
    ai_temperature: float = 0.2

    # Database
    database_url: str = "sqlite:///./spacemind.db"

    # Features
    enable_history: bool = True
    enable_vector_memory: bool = False

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
