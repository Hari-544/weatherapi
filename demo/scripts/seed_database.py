"""Standalone database seeder for the National Weather Platform demo.

Creates weather.db with users and a batch of simulated #IMD weather events,
running the same ML pipeline (categorize / fake-detect / dedup) used at ingest.

Usage:
    cd demo/backend
    .\\.venv\\Scripts\\python.exe ..\\scripts\\seed_database.py        # default 120 events
    .\\.venv\\Scripts\\python.exe ..\\scripts\\seed_database.py 300    # custom count
"""
import asyncio
import os
import sys

# Make `app` importable when run from scripts/ or anywhere else.
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))


async def run(count: int, wipe: bool = True):
    from sqlalchemy import select, func, delete
    from app.core.database import init_db, async_session_factory
    from app.models.weather_event import WeatherEvent
    from app.models.user import User, UserRole
    from app.ingest.simulator import simulator
    from app.services.weather_service import weather_service
    from app.api.auth import get_password_hash

    await init_db()

    async with async_session_factory() as db:
        if wipe:
            await db.execute(delete(WeatherEvent))

        existing = (await db.execute(select(User).where(User.username.in_(["admin", "analyst"])))).scalars().all()
        if len(existing) < 2:
            users = [
                User(username="admin", email="admin@weather.gov.in",
                     hashed_password=get_password_hash("admin123"),
                     full_name="Platform Admin", role=UserRole.ADMIN),
                User(username="analyst", email="analyst@weather.gov.in",
                     hashed_password=get_password_hash("analyst123"),
                     full_name="Weather Analyst", role=UserRole.ANALYST),
            ]
            db.add_all(users)
            await db.flush()

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
            except Exception as e:
                print(f"  skipped {p['source_url']}: {e}")
        await db.commit()

        total = (await db.execute(select(func.count()).select_from(WeatherEvent))).scalar()
        print(f"Seeded {stored} weather events. Total in DB: {total}")
        print("Users: admin/admin123 (ADMIN), analyst/analyst123 (ANALYST)")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 120
    asyncio.run(run(n))