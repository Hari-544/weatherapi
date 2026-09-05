from pathlib import Path
import os


class Settings:
    PROJECT_NAME = "National Weather Big Data Analytics Platform"
    VERSION = "1.0.0"

    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    DB_PATH = BASE_DIR / "weather.db"
    DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sih-demo-secret-key-change-me")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    FAKE_THRESHOLD = 0.7
    DUP_DISTANCE_KM = 15.0
    DUP_TIME_WINDOW_HOURS = 6
    DUP_TEXT_SIMILARITY = 0.55


settings = Settings()
