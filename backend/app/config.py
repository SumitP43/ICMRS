import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "ICMRS Civic Management & Response System API"
    APP_ENV: str = "production"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Security & Auth
    SECRET_KEY: str = Field(default="icmrs-production-ultra-secure-jwt-signing-secret-key-2026", validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # PostgreSQL Database
    # Note: In some cloud environments, DATABASE_URL may be set by Firebase RTDB (https://...).
    # We prioritize POSTGRES_URL or SQL_DATABASE_URL, or fall back to standard Postgres / SQLite.
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://icmrs:icmrs_secure_pass@localhost:5432/icmrs_db",
        validation_alias="POSTGRES_URL"
    )
    DATABASE_URL_ASYNC: str = Field(
        default="postgresql+asyncpg://icmrs:icmrs_secure_pass@localhost:5432/icmrs_db",
        validation_alias="POSTGRES_URL_ASYNC"
    )

    # Redis Cache & Queue
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    REDIS_CACHE_TTL: int = 300  # 5 minutes

    # Celery Workers
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1", validation_alias="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2", validation_alias="CELERY_RESULT_BACKEND")

    # AI & Gemini
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # SLA Thresholds (Hours)
    SLA_CRITICAL_HOURS: int = 24
    SLA_HIGH_HOURS: int = 48
    SLA_MEDIUM_HOURS: int = 120  # 5 days
    SLA_LOW_HOURS: int = 168     # 7 days

    # Duplicate Detection Weights (Must sum to 1.0)
    DUPLICATE_WEIGHT_TEXT: float = 0.40
    DUPLICATE_WEIGHT_IMAGE: float = 0.20
    DUPLICATE_WEIGHT_LOCATION: float = 0.25
    DUPLICATE_WEIGHT_TIME: float = 0.15
    DUPLICATE_THRESHOLD: float = 0.72
    DUPLICATE_RADIUS_METERS: float = 250.0
    DUPLICATE_TIME_WINDOW_DAYS: int = 14

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
