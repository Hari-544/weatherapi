from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.core.database import engine, Base
from app.api import weather, auth, dashboard, ingest


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

upload_directory = Path(settings.UPLOAD_DIR)
upload_directory.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_directory), name="uploads")

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
app.include_router(ingest.router, prefix="/api/ingest", tags=["Data Ingestion"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "national-weather-platform",
        "version": "1.0.0",
    }


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    """Serve the compiled React app in the single-container deployment."""
    dist_dir = settings.FRONTEND_DIST_DIR
    requested_file = dist_dir / full_path

    if requested_file.is_file():
        return FileResponse(requested_file)

    index_file = dist_dir / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    return {
        "message": "Frontend has not been built. Run npm run dev in frontend/ for development.",
        "docs": "/docs",
    }
