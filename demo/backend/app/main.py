import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api import auth, weather, dashboard, ingest


async def seed_if_empty():
    from sqlalchemy import select, func
    from app.core.database import async_session_factory
    from app.models.weather_event import WeatherEvent, EventSource
    from app.models.user import User, UserRole
    from app.ingest.simulator import simulator
    from app.services.weather_service import weather_service
    from app.api.auth import get_password_hash

    async with async_session_factory() as db:
        user_count = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
        if user_count == 0:
            users = [
                User(username="admin", email="admin@weather.gov.in",
                     hashed_password=get_password_hash("admin123"),
                     full_name="Platform Admin", role=UserRole.ADMIN),
                User(username="analyst", email="analyst@weather.gov.in",
                     hashed_password=get_password_hash("analyst123"),
                     full_name="Weather Analyst", role=UserRole.ANALYST),
            ]
            db.add_all(users)
            await db.flush()

        event_count = (await db.execute(select(func.count()).select_from(WeatherEvent))).scalar() or 0
        if event_count == 0:
            posts = simulator.generate_posts(120)
            for p in posts:
                try:
                    await weather_service.ingest_event(
                        db=db, title=p["title"], description=p["description"], source=p["source"],
                        source_url=p["source_url"], source_handle=p["source_handle"],
                        hashtags=p["hashtags"], city=p["city"], state=p["state"],
                        latitude=p["latitude"], longitude=p["longitude"],
                        metadata=p["metadata"], reported_at=p["reported_at"],
                    )
                except Exception:
                    continue


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_if_empty()
    yield


app = FastAPI(
    title="National Weather Big Data Analytics Platform",
    description="Real-time weather event collection, verification & analytics for India",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather Events"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["Data Ingestion"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "national-weather-platform", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "National Weather Big Data Analytics Platform API", "docs": "/docs", "health": "/health"}
