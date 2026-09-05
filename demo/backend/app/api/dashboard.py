from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.weather_event import WeatherEvent, VerificationStatus

router = APIRouter()


def _apply_date(query, start_date=None, end_date=None):
    if start_date:
        query = query.where(WeatherEvent.reported_at >= start_date)
    if end_date:
        query = query.where(WeatherEvent.reported_at <= end_date)
    return query


@router.get("/events-by-type")
async def events_by_type(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                         db: AsyncSession = Depends(get_db)):
    query = select(WeatherEvent.event_type, func.count(WeatherEvent.id).label("count"))
    query = _apply_date(query, start_date, end_date)
    query = query.group_by(WeatherEvent.event_type).order_by(func.count(WeatherEvent.id).desc())
    rows = (await db.execute(query)).all()
    return {"data": [{"event_type": r.event_type.value if r.event_type else None, "count": r.count} for r in rows]}


@router.get("/events-by-state")
async def events_by_state(db: AsyncSession = Depends(get_db)):
    query = select(WeatherEvent.state, func.count(WeatherEvent.id).label("count")) \
        .where(WeatherEvent.state.isnot(None)) \
        .group_by(WeatherEvent.state).order_by(func.count(WeatherEvent.id).desc())
    rows = (await db.execute(query)).all()
    return {"data": [{"state": r.state, "count": r.count} for r in rows]}


@router.get("/events-over-time")
async def events_over_time(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    granularity: str = Query("day", pattern="^(day|week|month)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(
        extract('year', WeatherEvent.reported_at).label("year"),
        extract('month', WeatherEvent.reported_at).label("month"),
        extract('day', WeatherEvent.reported_at).label("day"),
        func.count(WeatherEvent.id).label("count"),
    )
    query = _apply_date(query, start_date, end_date)
    if granularity == "month":
        by = [extract('year', WeatherEvent.reported_at), extract('month', WeatherEvent.reported_at)]
    elif granularity == "week":
        by = [extract('year', WeatherEvent.reported_at), extract('week', WeatherEvent.reported_at)]
    else:
        by = [extract('year', WeatherEvent.reported_at), extract('month', WeatherEvent.reported_at),
              extract('day', WeatherEvent.reported_at)]
    query = query.group_by(*by).order_by(*by)
    rows = (await db.execute(query)).all()

    data = []
    for r in rows:
        if granularity == "day":
            label = f"{int(r.year)}-{int(r.month):02d}-{int(r.day):02d}"
        elif granularity == "month":
            label = f"{int(r.year)}-{int(r.month):02d}"
        else:
            label = f"{int(r.year)}-W{int(r[2]):02d}"
        data.append({"date": label, "count": r.count})
    return {"data": data}


@router.get("/verification-stats")
async def verification_stats(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(WeatherEvent.verification_status, func.count(WeatherEvent.id))
        .group_by(WeatherEvent.verification_status))).all()
    return {"data": [{"verification_status": r[0].value if r[0] else None, "count": r[1]} for r in rows]}


@router.get("/severity-distribution")
async def severity_distribution(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(WeatherEvent.severity, func.count(WeatherEvent.id))
        .group_by(WeatherEvent.severity))).all()
    return {"data": [{"severity": r[0].value if r[0] else None, "count": r[1]} for r in rows]}


@router.get("/source-breakdown")
async def source_breakdown(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(WeatherEvent.source, func.count(WeatherEvent.id))
        .group_by(WeatherEvent.source))).all()
    return {"data": [{"source": r[0].value if r[0] else None, "count": r[1]} for r in rows]}


@router.get("/top-cities")
async def top_cities(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(WeatherEvent.city, WeatherEvent.state, func.count(WeatherEvent.id).label("count"))
        .where(WeatherEvent.city.isnot(None))
        .group_by(WeatherEvent.city, WeatherEvent.state)
        .order_by(func.count(WeatherEvent.id).desc())
        .limit(limit))).all()
    return {"data": [{"city": r.city, "state": r.state, "count": r.count} for r in rows]}


@router.get("/recent-events")
async def recent_events(limit: int = Query(10, ge=1, le=50), db: AsyncSession = Depends(get_db)):
    events = (await db.execute(
        select(WeatherEvent).order_by(WeatherEvent.reported_at.desc()).limit(limit))).scalars().all()
    return {"data": [e.to_dict() for e in events]}
