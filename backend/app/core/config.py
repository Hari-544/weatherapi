from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "National Weather Big Data Analytics Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/weather_platform"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/weather_platform"
    REDIS_URL: str = "redis://localhost:6379/0"
    MONGO_URL: str = "mongodb://localhost:27017"
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    # JWT
    JWT_SECRET_KEY: str = "super-secret-change-in-production-weather-platform-2024"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://127.0.0.1:5173",
    ]

    # External APIs
    OPENWEATHER_API_KEY: str = ""
    TWITTER_BEARER_TOKEN: str = ""
    TWITTER_API_KEY: str = ""
    TWITTER_API_SECRET: str = ""
    TWITTER_ACCESS_TOKEN: str = ""
    TWITTER_ACCESS_SECRET: str = ""
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # ML
    FAKE_DETECTION_THRESHOLD: float = 0.7
    DUPLICATE_DISTANCE_KM: float = 10.0
    DUPLICATE_TIME_WINDOW_HOURS: int = 6


settings = Settings()
