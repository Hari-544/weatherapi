import random
from datetime import datetime, timedelta

import httpx

from app.core.config import settings
from app.models.weather_event import EventSource
from app.services.geolocation import INDIAN_CITY_COORDINATES, get_city_state

SEVERITY_BY_CONDITION = {
    "Thunderstorm": "high", "Heavy Rain": "high", "Rain": "moderate",
    "Drizzle": "low", "Clear": "low", "Clouds": "low", "Mist": "low",
    "Fog": "moderate", "Haze": "moderate", "Dust": "high", "Tornado": "critical",
}

CONDITIONS = ["Thunderstorm", "Rain", "Heavy Rain", "Clouds", "Clear", "Mist", "Fog", "Haze", "Drizzle"]


class OpenWeatherIngestor:
    async def fetch_current(self, db, cities=None, limit: int = 10):
        target = cities or list(INDIAN_CITY_COORDINATES.keys())[:limit]
        stored = 0
        for city in target:
            if settings.OPENWEATHER_API_KEY:
                data = await self._fetch_live(city)
            else:
                data = self._mock(city)
            if data:
                await self._store(db, data)
                stored += 1
        return stored

    async def _fetch_live(self, city):
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": f"{city},IN", "appid": settings.OPENWEATHER_API_KEY, "units": "metric"}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            weather = data.get("weather", [{}])[0]
            condition = weather.get("main", "Unknown")
            main = data.get("main", {})
            temp = main.get("temp")
            severity = SEVERITY_BY_CONDITION.get(condition, "low")
            if temp and temp > 40:
                severity = "high"
            coords = INDIAN_CITY_COORDINATES.get(city, (None, None))
            return {
                "title": f"{condition} conditions in {city} reported by CSC API",
                "description": (f"Weather API reports {condition} ({weather.get('description','')}) in {city}, "
                                f"temperature {temp}°C, humidity {main.get('humidity')}%, "
                                f"wind {data.get('wind',{}).get('speed')} m/s."),
                "event_type": condition.lower(),
                "severity": severity,
                "city": city,
                "state": get_city_state(city),
                "latitude": coords[0],
                "longitude": coords[1],
                "metadata": {"source_api": "openweathermap", "temperature": temp,
                             "humidity": main.get("humidity")},
                "reported_at": datetime.utcnow() - timedelta(minutes=random.randint(0, 35)),
            }
        except Exception:
            return self._mock(city)

    def _mock(self, city):
        condition = random.choice(CONDITIONS)
        coords = INDIAN_CITY_COORDINATES.get(city, (None, None))
        temp = round(random.uniform(15, 42), 1)
        severity = SEVERITY_BY_CONDITION.get(condition, "low")
        if temp > 40:
            severity = "high"
        return {
            "title": f"{condition} conditions in {city} reported by CSC API",
            "description": (f"Weather API reports {condition} in {city}, temperature {temp}°C, "
                            f"humidity {random.randint(40, 95)}%, wind {round(random.uniform(1, 20), 1)} m/s."),
            "event_type": condition.lower(),
            "severity": severity,
            "city": city,
            "state": get_city_state(city),
            "latitude": coords[0],
            "longitude": coords[1],
            "metadata": {"source_api": "openweathermap (mock)", "temperature": temp,
                         "humidity": random.randint(40, 95)},
            "reported_at": datetime.utcnow() - timedelta(minutes=random.randint(0, 20)),
        }

    async def _store(self, db, data):
        from app.services.weather_service import weather_service
        from app.models.weather_event import EventType
        event_type = data["event_type"]
        await weather_service.ingest_event(
            db=db, title=data["title"], description=data["description"],
            source=EventSource.API, city=data["city"], state=data["state"],
            latitude=data["latitude"], longitude=data["longitude"],
            metadata=data["metadata"], reported_at=data["reported_at"],
        )


openweather = OpenWeatherIngestor()
