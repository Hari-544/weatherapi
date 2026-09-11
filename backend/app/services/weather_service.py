import logging
from typing import Optional, List
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weather_event import (
    WeatherEvent,
    EventType,
    SeverityLevel,
    EventSource,
    VerificationStatus,
)
from app.ml.categorizer import Categorizer
from app.ml.fake_detector import FakeDetector
from app.ml.deduplicator import Deduplicator
from app.services.notification_service import notify_affected_citizens

logger = logging.getLogger(__name__)


class WeatherService:
    """
    Core weather event processing service.

    Pipeline:
        Ingestion
          ↓
        Weather classification
          ↓
        Fake/misleading detection
          ↓
        Severity detection
          ↓
        Duplicate detection
          ↓
        Database
          ↓
        Citizen notification

    The separate AI Intelligence pipeline is intentionally not used here.
    """

    def __init__(self):
        self.categorizer = Categorizer()
        self.fake_detector = FakeDetector()
        self.deduplicator = Deduplicator()

    async def ingest_event(
        self,
        db: AsyncSession,
        title: str,
        description: str,
        source: EventSource,
        source_url: Optional[str] = None,
        source_id: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        photos: Optional[List[str]] = None,
        videos: Optional[List[str]] = None,
        metadata: Optional[dict] = None,
        reported_by_id: Optional[int] = None,
        reported_at: Optional[datetime] = None,
    ) -> WeatherEvent:

        # ---------------------------------------------------------
        # 1. WEATHER EVENT CLASSIFICATION
        # ---------------------------------------------------------
        category_label, confidence = self.categorizer.categorize(
            title,
            description,
        )

        event_type = category_label or EventType.OTHER

        # ---------------------------------------------------------
        # 2. FAKE / MISLEADING REPORT DETECTION
        # ---------------------------------------------------------
        is_fake, fake_confidence = self.fake_detector.predict(
            title,
            description,
        )

        # ---------------------------------------------------------
        # 3. SEVERITY
        # ---------------------------------------------------------
        severity = self._determine_severity(
            title,
            description,
            event_type,
        )

        # ---------------------------------------------------------
        # 4. CREATE EVENT
        # ---------------------------------------------------------
        event = WeatherEvent(
            title=title,
            description=description,
            event_type=event_type,
            severity=severity,
            source=source,
            source_url=source_url,
            source_id=source_id,
            city=city,
            state=state,
            latitude=latitude,
            longitude=longitude,
            photos=photos or [],
            videos=videos or [],
            metadata_=metadata or {},
            verification_status=VerificationStatus.PENDING,
            is_fake=is_fake,
            fake_confidence=float(fake_confidence),
            category_confidence=float(confidence),
            reported_by_id=reported_by_id,
            reported_at=reported_at or datetime.utcnow(),
        )

        # ---------------------------------------------------------
        # 5. DUPLICATE DETECTION
        # ---------------------------------------------------------
        duplicate = await self.deduplicator.find_duplicate(
            db,
            event,
        )

        if duplicate:
            event.duplicate_of_id = duplicate.id

        # ---------------------------------------------------------
        # 6. SAVE EVENT
        # ---------------------------------------------------------
        db.add(event)
        await db.commit()
        await db.refresh(event)

        # ---------------------------------------------------------
        # 7. CITIZEN NOTIFICATIONS
        # ---------------------------------------------------------
        try:
            await notify_affected_citizens(db, event)
        except Exception as exc:
            logger.warning(
                "Location-based notification failed for event %s: %s",
                getattr(event, "id", "?"),
                exc,
            )

        return event

    def _determine_severity(
        self,
        title: str,
        description: str,
        event_type: EventType,
    ) -> SeverityLevel:

        text = f"{title} {description}".lower()

        critical_keywords = [
            "severe",
            "extreme",
            "catastrophic",
            "disaster",
            "massive",
            "emergency",
            "evacuation",
            "devastating",
            "worst",
            "historic",
            "death",
            "kill",
            "destroy",
            "submerge",
        ]

        high_keywords = [
            "heavy",
            "intense",
            "flooding",
            "cyclone",
            "storm surge",
            "landfall",
            "major",
            "significant",
            "warning",
            "red alert",
            "dangerous",
            "threatening",
        ]

        moderate_keywords = [
            "moderate",
            "advisory",
            "watch",
            "affected",
            "damage",
            "disrupt",
            "impact",
            "heavy rain",
            "strong wind",
        ]

        if any(kw in text for kw in critical_keywords):
            return SeverityLevel.CRITICAL

        if any(kw in text for kw in high_keywords):
            return SeverityLevel.HIGH

        if any(kw in text for kw in moderate_keywords):
            return SeverityLevel.MODERATE

        return SeverityLevel.LOW

    async def get_event_stats(
        self,
        db: AsyncSession,
    ) -> dict:

        total = (
            await db.execute(
                select(func.count()).select_from(WeatherEvent)
            )
        ).scalar() or 0

        today = datetime.utcnow().replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        today_count = (
            await db.execute(
                select(func.count())
                .select_from(WeatherEvent)
                .where(
                    WeatherEvent.reported_at >= today
                )
            )
        ).scalar() or 0

        verified = (
            await db.execute(
                select(func.count())
                .select_from(WeatherEvent)
                .where(
                    WeatherEvent.verification_status
                    == VerificationStatus.VERIFIED
                )
            )
        ).scalar() or 0

        pending = (
            await db.execute(
                select(func.count())
                .select_from(WeatherEvent)
                .where(
                    WeatherEvent.verification_status
                    == VerificationStatus.PENDING
                )
            )
        ).scalar() or 0

        fake = (
            await db.execute(
                select(func.count())
                .select_from(WeatherEvent)
                .where(
                    WeatherEvent.is_fake == True
                )
            )
        ).scalar() or 0

        return {
            "total_events": total,
            "today_events": today_count,
            "verified_events": verified,
            "pending_review": pending,
            "detected_fake": fake,
            "verification_rate": (
                verified / total * 100
            ) if total > 0 else 0,
        }


weather_service = WeatherService()