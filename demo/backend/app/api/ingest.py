from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.auth import get_current_staff
from app.ingest.simulator import simulator
from app.ingest.openweather import openweather
from app.services.weather_service import weather_service

router = APIRouter()


@router.post("/simulate-social")
async def ingest_simulated_social(
    count: int = 20,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    posts = simulator.generate_posts(count)
    stored = 0
    for p in posts:
        try:
            await weather_service.ingest_event(
                db=db, title=p["title"], description=p["description"], source=p["source"],
                source_url=p["source_url"], source_handle=p["source_handle"],
                hashtags=p["hashtags"], city=p["city"], state=p["state"],
                latitude=p["latitude"], longitude=p["longitude"],
                metadata=p["metadata"], reported_at=p["reported_at"],
            )
            stored += 1
        except Exception:
            continue
    return {"message": f"Ingested {stored} simulated #IMD posts", "stored": stored}


@router.post("/ingest-api")
async def ingest_api_weather(
    count: int = 10,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    stored = await openweather.fetch_current(db, limit=count)
    return {"message": f"Ingested {stored} API weather events", "stored": stored}
