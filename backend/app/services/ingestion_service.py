import logging
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from app.collectors.api_collector import api_collector
from app.collectors.citizen_report import citizen_report_handler
from app.collectors.apify_x_collector import apify_x_collector
from app.collectors.web_scraper import web_scraper

logger = logging.getLogger(__name__)

AVAILABLE_SOURCES = {
    "social",
    "web",
    "public_api",
    "sample_citizen_reports",
}


async def run_ingestion(
    db: AsyncSession,
    sources: Iterable[str],
    use_sample_data: bool = False
) -> dict:
    """Collect selected sources and return a transparent per-source result.

    Sample records are opt-in, so they are never presented as live external data.
    """

    requested = set(sources)
    results: dict[str, dict] = {}

    # SOCIAL / X via Apify
    if "social" in requested:
        if apify_x_collector.client:
            records = await apify_x_collector.collect_posts(
                max_pages=1
            )

            results["social"] = {
                "stored": await apify_x_collector.store_posts(
                    db,
                    records,
                ),
                "mode": "live",
            }
        else:
            results["social"] = {
                "stored": 0,
                "mode": "skipped",
                "reason": "APIFY_API_TOKEN is not configured",
            }

    # WEB
    if "web" in requested:
        records = await web_scraper.scrape_all_sources()

        if not records and use_sample_data:
            records = web_scraper._mock_articles()

        results["web"] = {
            "stored": await web_scraper.store_scraped_articles(
                db,
                records
            ),
            "mode": "live" if records else "no_records",
        }

    # PUBLIC API / OpenWeather
    if "public_api" in requested:
        from app.core.config import settings

        if settings.OPENWEATHER_API_KEY or use_sample_data:
            records = await api_collector.fetch_openweather_bulk()

            results["public_api"] = {
                "stored": await api_collector.store_api_events(
                    db,
                    records
                ),
                "mode": (
                    "live"
                    if settings.OPENWEATHER_API_KEY
                    else "sample"
                ),
            }
        else:
            results["public_api"] = {
                "stored": 0,
                "mode": "skipped",
                "reason": "OPENWEATHER_API_KEY is not configured",
            }

    # SAMPLE CITIZEN REPORTS
    if "sample_citizen_reports" in requested:
        if use_sample_data:
            records = (
                citizen_report_handler
                ._mock_citizen_reports()
            )

            results["sample_citizen_reports"] = {
                "stored": (
                    await citizen_report_handler
                    .store_citizen_reports(
                        db,
                        records
                    )
                ),
                "mode": "sample",
            }
        else:
            results["sample_citizen_reports"] = {
                "stored": 0,
                "mode": "skipped",
                "reason": "Sample data is disabled",
            }

    return {
        "sources": results,
        "total_stored": sum(
            result["stored"]
            for result in results.values()
        ),
    }