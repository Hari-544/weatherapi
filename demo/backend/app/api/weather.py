from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.weather_event import (
    WeatherEvent, EventType, SeverityLevel, EventSource, VerificationStatus,
)
from app.models.user import User
from app.api.auth import get_current_user, get_current_staff
from app.services.weather_service import weather_service

router = APIRouter()


class EventCreate(BaseModel):
    title: str
    description: str
    event_type: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos: List[str] = []
    videos: List[str] = []
    metadata: dict = {}


class VerifyRequest(BaseModel):
    verification_status: str


@router.get("")
async def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    verification_status: Optional[str] = None,
    source: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    is_fake: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(WeatherEvent)

    if event_type:
        query = query.where(WeatherEvent.event_type == EventType(event_type))
    if severity:
        query = query.where(WeatherEvent.severity == SeverityLevel(severity))
    if state:
        query = query.where(WeatherEvent.state.ilike(f"%{state}%"))
    if city:
        query = query.where(WeatherEvent.city.ilike(f"%{city}%"))
    if verification_status:
        query = query.where(WeatherEvent.verification_status == VerificationStatus(verification_status))
    if source:
        query = query.where(WeatherEvent.source == EventSource(source))
    if start_date:
        query = query.where(WeatherEvent.reported_at >= start_date)
    if end_date:
        query = query.where(WeatherEvent.reported_at <= end_date)
    if is_fake is not None:
        query = query.where(WeatherEvent.is_fake == is_fake)
    if search:
        query = query.where(or_(
            WeatherEvent.title.ilike(f"%{search}%"),
            WeatherEvent.description.ilike(f"%{search}%"),
            WeatherEvent.city.ilike(f"%{search}%"),
            WeatherEvent.state.ilike(f"%{search}%"),
        ))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.order_by(WeatherEvent.reported_at.desc()).offset((page - 1) * per_page).limit(per_page)
    events = (await db.execute(query)).scalars().all()

    return {
        "data": [e.to_dict() for e in events],
        "pagination": {"page": page, "per_page": per_page, "total": total,
                       "total_pages": (total + per_page - 1) // per_page},
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_event = await weather_service.ingest_event(
        db=db,
        title=event.title,
        description=event.description,
        source=EventSource.CITIZEN,
        city=event.city,
        state=event.state,
        latitude=event.latitude,
        longitude=event.longitude,
        photos=event.photos,
        videos=event.videos,
        metadata=event.metadata,
        reported_by_id=current_user.id,
    )
    return new_event.to_dict()


@router.get("/stats/general")
async def event_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    total = (await db.execute(select(func.count()).select_from(WeatherEvent))).scalar() or 0
    verified = (await db.execute(select(func.count()).select_from(WeatherEvent)
                .where(WeatherEvent.verification_status == VerificationStatus.VERIFIED))).scalar() or 0
    pending = (await db.execute(select(func.count()).select_from(WeatherEvent)
               .where(WeatherEvent.verification_status == VerificationStatus.PENDING))).scalar() or 0
    rejected = (await db.execute(select(func.count()).select_from(WeatherEvent)
                .where(WeatherEvent.verification_status == VerificationStatus.REJECTED))).scalar() or 0
    today = (await db.execute(select(func.count()).select_from(WeatherEvent)
             .where(WeatherEvent.reported_at >= today_start))).scalar() or 0
    fake = (await db.execute(select(func.count()).select_from(WeatherEvent)
            .where(WeatherEvent.is_fake == True))).scalar() or 0  # noqa: E712
    dup = (await db.execute(select(func.count()).select_from(WeatherEvent)
           .where(WeatherEvent.duplicate_of_id.isnot(None)))).scalar() or 0

    return {
        "total_events": total,
        "today_events": today,
        "pending_review": pending,
        "verified_events": verified,
        "rejected_events": rejected,
        "detected_fake": fake,
        "duplicates": dup,
        "verification_rate": round(verified / total * 100, 1) if total else 0,
    }


@router.get("/{event_id}")
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WeatherEvent).where(WeatherEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event.to_dict()


@router.post("/{event_id}/verify")
async def verify_event(
    event_id: int,
    verify_req: VerifyRequest,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WeatherEvent).where(WeatherEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    try:
        status_val = VerificationStatus(verify_req.verification_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    event.verification_status = status_val
    event.verified_by_id = current_user.id
    if status_val == VerificationStatus.REJECTED:
        event.is_fake = True
        event.fake_confidence = 1.0

    await db.commit()
    await db.refresh(event)
    return event.to_dict()


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WeatherEvent).where(WeatherEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return None
