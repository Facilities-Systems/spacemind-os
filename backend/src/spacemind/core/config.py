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
    # Dev default: backend/data/spacemind.db (relative to working dir = backend/)
    # Production: override with DATABASE_URL=postgresql://user:pass@host/spacemind
    database_url: str = "sqlite:///./data/spacemind.db"
    test_database_url: str = "sqlite:///:memory:"

    # Features
    enable_history: bool = True
    enable_vector_memory: bool = False
    enable_multi_agent: bool = False

    # CORS
    # Dev: explicit localhost origins instead of wildcard
    # Prod: set CORS_ORIGINS=https://your-domain.com (comma-separated)
    cors_dev_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    cors_origins: str = ""

    # Rate limiting
    decompose_rate_limit: str = "10/minute"

    # Observability
    sentry_dsn: str = ""
    prometheus_enabled: bool = True

    # Auth
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480   # 8 hours

    # Celery / Redis
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
