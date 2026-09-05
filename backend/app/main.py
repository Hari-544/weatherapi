from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api import weather, auth, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="National Weather Big Data Analytics Platform",
    description="Real-time weather event tracking, verification, and analytics for India",
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

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather Events"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard & Analytics"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "national-weather-platform",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "National Weather Big Data Analytics Platform API",
        "docs": "/docs",
        "health": "/health",
    }
