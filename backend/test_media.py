import asyncio
from app.core.database import async_session_factory
from sqlalchemy import select
from app.models.weather_event import WeatherEvent
from app.models.report_media import ReportMedia
from app.models.user import User

async def test():
    async with async_session_factory() as db:
        result = await db.execute(select(WeatherEvent).where(WeatherEvent.source == 'citizen_report').limit(5))
        events = result.scalars().all()
        for e in events:
            print(f'Event {e.id}: {e.title[:50]}')
            print(f'  photos: {e.photos}')
            print(f'  videos: {e.videos}')
            d = e.to_dict()
            print(f'  media: {d.get("media", [])}')
        
        result = await db.execute(select(ReportMedia).limit(5))
        media = result.scalars().all()
        for m in media:
            print(f'ReportMedia {m.id}: event_id={m.event_id}, media_type={m.media_type}, filename={m.filename}')

asyncio.run(test())