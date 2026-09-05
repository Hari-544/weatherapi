import math
import re
from datetime import timedelta
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weather_event import WeatherEvent
from app.core.config import settings
from app.services.geolocation import haversine_distance


class Deduplicator:
    def __init__(self):
        self.dist_km = settings.DUP_DISTANCE_KM
        self.time_window = timedelta(hours=settings.DUP_TIME_WINDOW_HOURS)
        self.text_threshold = settings.DUP_TEXT_SIMILARITY

    async def find_duplicate(self, db: AsyncSession, event: WeatherEvent) -> Optional[WeatherEvent]:
        candidates = await self._get_candidates(db, event)
        for candidate in candidates:
            if self._similarity(event, candidate) >= self.text_threshold:
                return candidate
        return None

    async def _get_candidates(self, db: AsyncSession, event: WeatherEvent) -> List[WeatherEvent]:
        query = select(WeatherEvent).where(
            WeatherEvent.id != (event.id or 0),
            WeatherEvent.is_fake == False,  # noqa: E712
            WeatherEvent.event_type == event.event_type,
        )
        if event.reported_at:
            query = query.where(
                WeatherEvent.reported_at >= event.reported_at - self.time_window,
                WeatherEvent.reported_at <= event.reported_at + self.time_window,
            )
        if event.state:
            query = query.where(WeatherEvent.state == event.state)
        if event.latitude and event.longitude:
            lat_range = self.dist_km / 111.0
            lon_range = self.dist_km / (111.0 * math.cos(math.radians(event.latitude)))
            query = query.where(
                WeatherEvent.latitude.isnot(None),
                WeatherEvent.latitude >= event.latitude - lat_range,
                WeatherEvent.latitude <= event.latitude + lat_range,
                WeatherEvent.longitude >= event.longitude - lon_range,
                WeatherEvent.longitude <= event.longitude + lon_range,
            )
        query = query.limit(20)
        result = await db.execute(query)
        return list(result.scalars().all())

    def _similarity(self, e1: WeatherEvent, e2: WeatherEvent) -> float:
        scores = []

        if e1.latitude and e1.longitude and e2.latitude and e2.longitude:
            dist = haversine_distance(e1.latitude, e1.longitude, e2.latitude, e2.longitude)
            loc = max(0.0, 1 - (dist / self.dist_km))
            scores.append(loc * 0.3)

        if e1.reported_at and e2.reported_at:
            hours = abs((e1.reported_at - e2.reported_at).total_seconds()) / 3600
            time_score = max(0.0, 1 - (hours / settings.DUP_TIME_WINDOW_HOURS))
            scores.append(time_score * 0.2)

        scores.append(self._text_sim(e1.title, e2.title) * 0.3)
        scores.append(self._text_sim(e1.description, e2.description) * 0.2)

        return sum(scores)

    def _text_sim(self, a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        ta = set(self._tokenize(a))
        tb = set(self._tokenize(b))
        if not ta or not tb:
            return 0.0
        inter = len(ta & tb)
        union = len(ta | tb)
        return inter / union if union else 0.0

    @staticmethod
    def _tokenize(text: str):
        text = re.sub(r"[^\w\s]", " ", text.lower())
        stop = {"the", "a", "an", "is", "are", "was", "were", "in", "of", "on",
                "for", "to", "with", "at", "by", "as", "and", "or", "from", "that"}
        return [w for w in text.split() if w not in stop and len(w) > 2]


deduplicator = Deduplicator()
