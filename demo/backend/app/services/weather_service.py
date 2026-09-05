from typing import Optional, List
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weather_event import (
    WeatherEvent, EventType, SeverityLevel, EventSource, VerificationStatus,
)
from app.ml.categorizer import categorizer
from app.ml.fake_detector import fake_detector
from app.ml.deduplicator import deduplicator


class WeatherService:
    async def ingest_event(
        self,
        db: AsyncSession,
        title: str,
        description: str,
        source: EventSource,
        source_url: Optional[str] = None,
        source_handle: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        photos: Optional[List[str]] = None,
        videos: Optional[List[str]] = None,
        metadata: Optional[dict] = None,
        reported_by_id: Optional[int] = None,
        reported_at: Optional[datetime] = None,
        bypass_fake: bool = False,
    ) -> WeatherEvent:
        category, cat_conf = categorizer.categorize(title, description)
        event_type = EventType(category) if category in [t.value for t in EventType] else EventType.OTHER
        severity = SeverityLevel(categorizer.get_severity(title, description))

        is_fake, fake_conf = fake_detector.predict(title, description)

        event = WeatherEvent(
            title=title,
            description=description,
            event_type=event_type,
            severity=severity,
            source=source,
            source_url=source_url,
            source_handle=source_handle,
            hashtags=hashtags or [],
            city=city,
            state=state,
            latitude=latitude,
            longitude=longitude,
            photos=photos or [],
            videos=videos or [],
            metadata_json=metadata or {},
            verification_status=VerificationStatus.PENDING,
            is_fake=is_fake or bypass_fake,
            fake_confidence=fake_conf,
            category_confidence=cat_conf,
            reported_by_id=reported_by_id,
            reported_at=reported_at or datetime.utcnow(),
        )

        duplicate = await deduplicator.find_duplicate(db, event)
        if duplicate:
            event.duplicate_of_id = duplicate.id

        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event


weather_service = WeatherService()
