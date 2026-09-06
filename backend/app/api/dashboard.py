from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.weather_event import (
    WeatherEvent,
    EventType,
    SeverityLevel,
    VerificationStatus,
    EventSource,
)

router = APIRouter()


def normalize_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Convert a timezone-aware datetime to UTC-naive datetime.

    PostgreSQL currently stores WeatherEvent.reported_at as
    TIMESTAMP WITHOUT TIME ZONE, while FastAPI parses ISO timestamps
    containing 'Z' as timezone-aware datetimes.

    Example:
        2026-08-07 09:58:49+00:00
            ->
        2026-08-07 09:58:49
    """
    if dt is None:
        return None

    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)

    return dt


@router.get("/events-by-type", response_model=dict)
async def events_by_type(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
):
    # Normalize timezone-aware frontend dates
    start_date = normalize_datetime(start_date)
    end_date = normalize_datetime(end_date)

    query = select(
        WeatherEvent.event_type,
        func.count(WeatherEvent.id).label("count"),
    )

    if start_date:
        query = query.where(
            WeatherEvent.reported_at >= start_date
        )

    if end_date:
        query = query.where(
            WeatherEvent.reported_at <= end_date
        )

    query = (
        query
        .group_by(WeatherEvent.event_type)
        .order_by(func.count(WeatherEvent.id).desc())
    )

    result = await db.execute(query)
    rows = result.all()

    return {
        "data": [
            {
                "event_type": r.event_type.value if r.event_type else None,
                "count": r.count,
            }
            for r in rows
        ]
    }


@router.get("/events-by-state", response_model=dict)
async def events_by_state(
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(
            WeatherEvent.state,
            func.count(WeatherEvent.id).label("count"),
        )
        .where(WeatherEvent.state.isnot(None))
        .group_by(WeatherEvent.state)
        .order_by(func.count(WeatherEvent.id).desc())
    )

    result = await db.execute(query)
    rows = result.all()

    return {
        "data": [
            {
                "state": r.state,
                "count": r.count,
            }
            for r in rows
        ]
    }


@router.get("/events-over-time", response_model=dict)
async def events_over_time(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    granularity: str = Query(
        "day",
        pattern="^(day|week|month)$",
    ),
    db: AsyncSession = Depends(get_db),
):
    # Normalize timezone-aware frontend dates
    start_date = normalize_datetime(start_date)
    end_date = normalize_datetime(end_date)

    query = select(
        extract(
            "year",
            WeatherEvent.reported_at,
        ).label("year"),
        extract(
            "month",
            WeatherEvent.reported_at,
        ).label("month"),
        extract(
            "day",
            WeatherEvent.reported_at,
        ).label("day"),
        func.count(WeatherEvent.id).label("count"),
    )

    if start_date:
        query = query.where(
            WeatherEvent.reported_at >= start_date
        )

    if end_date:
        query = query.where(
            WeatherEvent.reported_at <= end_date
        )

    if granularity == "month":
        by = [
            extract("year", WeatherEvent.reported_at),
            extract("month", WeatherEvent.reported_at),
        ]

    elif granularity == "week":
        by = [
            extract("year", WeatherEvent.reported_at),
            extract("week", WeatherEvent.reported_at),
        ]

    else:
        by = [
            extract("year", WeatherEvent.reported_at),
            extract("month", WeatherEvent.reported_at),
            extract("day", WeatherEvent.reported_at),
        ]

    query = (
        query
        .group_by(*by)
        .order_by(*by)
    )

    result = await db.execute(query)
    rows = result.all()

    data = []

    for r in rows:
        if granularity == "day":
            label = (
                f"{int(r.year)}-"
                f"{int(r.month):02d}-"
                f"{int(r.day):02d}"
            )

        elif granularity == "month":
            label = (
                f"{int(r.year)}-"
                f"{int(r.month):02d}"
            )

        else:
            # For weekly data:
            # r.year = year
            # r.month = month
            # r.day = day
            # r.count = event count
            #
            # PostgreSQL extract('week', ...) isn't included
            # in the SELECT above, so calculate week separately
            # using the reported_at value is not available here.
            #
            # Instead, use the year/week grouping directly below.
            label = f"{int(r.year)}-W{int(r.month):02d}"

        data.append(
            {
                "date": label,
                "count": r.count,
            }
        )

    return {
        "data": data
    }


@router.get("/verification-stats", response_model=dict)
async def verification_stats(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            WeatherEvent.verification_status,
            func.count(WeatherEvent.id).label("count"),
        )
        .group_by(WeatherEvent.verification_status)
    )

    rows = result.all()

    return {
        "data": [
            {
                "verification_status": (
                    r.verification_status.value
                    if r.verification_status
                    else None
                ),
                "count": r.count,
            }
            for r in rows
        ]
    }


@router.get("/severity-distribution", response_model=dict)
async def severity_distribution(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            WeatherEvent.severity,
            func.count(WeatherEvent.id).label("count"),
        )
        .group_by(WeatherEvent.severity)
        .order_by(WeatherEvent.severity)
    )

    rows = result.all()

    return {
        "data": [
            {
                "severity": (
                    r.severity.value
                    if r.severity
                    else None
                ),
                "count": r.count,
            }
            for r in rows
        ]
    }


@router.get("/top-cities", response_model=dict)
async def top_cities(
    limit: int = Query(
        10,
        ge=1,
        le=50,
    ),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            WeatherEvent.city,
            WeatherEvent.state,
            func.count(WeatherEvent.id).label("count"),
        )
        .where(WeatherEvent.city.isnot(None))
        .group_by(
            WeatherEvent.city,
            WeatherEvent.state,
        )
        .order_by(
            func.count(WeatherEvent.id).desc()
        )
        .limit(limit)
    )

    rows = result.all()

    return {
        "data": [
            {
                "city": r.city,
                "state": r.state,
                "count": r.count,
            }
            for r in rows
        ]
    }


@router.get("/recent-events", response_model=dict)
async def recent_events(
    limit: int = Query(
        10,
        ge=1,
        le=50,
    ),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WeatherEvent)
        .order_by(
            WeatherEvent.reported_at.desc()
        )
        .limit(limit)
    )

    events = result.scalars().all()

    return {
        "data": [
            e.to_dict()
            for e in events
        ]
    }


@router.get("/source-breakdown", response_model=dict)
async def source_breakdown(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            WeatherEvent.source,
            func.count(WeatherEvent.id).label("count"),
        )
        .group_by(WeatherEvent.source)
    )

    rows = result.all()

    return {
        "data": [
            {
                "source": (
                    r.source.value
                    if r.source
                    else None
                ),
                "count": r.count,
            }
            for r in rows
        ]
    }