import logging
import re
from typing import List, Dict, Optional
from datetime import datetime
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from app.services.weather_service import weather_service
from app.models.weather_event import EventSource

logger = logging.getLogger(__name__)

INDIAN_NEWS_SOURCES = [
    {
        "name": "NDTV Weather",
        "base_url": "https://www.ndtv.com",
        "weather_path": "/weather",
        "selectors": {
            "article_list": "div.Nwsstrt-sm436_Nwsstrt-sm436__BXIxO, div.story__card, article.cnt-lst-itm",
            "title": "h2 a, h3 a, .story__title a, .nws_title",
            "link": "h2 a, h3 a, .story__title a, .nws_title",
            "description": "p, .story__desc, .nws_desc, .story__content",
        },
    },
    {
        "name": "The Hindu Weather",
        "base_url": "https://www.thehindu.com",
        "weather_path": "/topic/weather",
        "selectors": {
            "article_list": "div.story-card, article.story, div:nth-of-type(1)",
            "title": "h3 a, h2 a, .title",
            "link": "h3 a, h2 a, .title",
            "description": "p.intro, .story-text, .summary",
        },
    },
    {
        "name": "India Today Weather",
        "base_url": "https://www.indiatoday.in",
        "weather_path": "/weather",
        "selectors": {
            "article_list": "div.bx, div.card, article",
            "title": "h2 a, h3 a, .title a, .btm_hed a",
            "link": "h2 a, h3 a, .title a, .btm_hed a",
            "description": "p, .description, .short",
        },
    },
    {
        "name": "Times of India Weather",
        "base_url": "https://timesofindia.indiatimes.com",
        "weather_path": "/topic/weather-news",
        "selectors": {
            "article_list": "div.w_panel div, div[data-articleid], .article-list li",
            "title": "h2 a, h3 a, .w_tit a, .title",
            "link": "h2 a, h3 a, .w_tit a, .title",
            "description": "p, .w_txt, .synopsis",
        },
    },
    {
        "name": "Hindustan Times Weather",
        "base_url": "https://www.hindustantimes.com",
        "weather_path": "/topic/weather",
        "selectors": {
            "article_list": "div.storyGrid, div.article-list div, article",
            "title": "h2 a, h3 a, .headline a",
            "link": "h2 a, h3 a, .headline a",
            "description": "p, .short-desc, .story-excerpt",
        },
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

WEATHER_KEYWORDS = [
    "rain", "rainfall", "storm", "thunderstorm", "flood", "flooding",
    "cyclone", "hurricane", "heatwave", "cold wave", "fog", "dust storm",
    "wind", "heavy rain", "downpour", "monsoon", "drought", "hail",
    "lightning", "landslide", "weather", "IMD", "meteorological",
]


class WebScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _is_weather_related(self, text: str) -> bool:
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in WEATHER_KEYWORDS)

    def _extract_location_from_text(self, text: str) -> Dict:
        from app.collectors.twitter_collector import INDIAN_STATES_AND_CITIES
        text_lower = text.lower()
        for city_key in INDIAN_STATES_AND_CITIES:
            if city_key in text_lower:
                city, state = INDIAN_STATES_AND_CITIES[city_key]
                from app.utils.geolocation import get_city_coordinates
                coords = get_city_coordinates(city)
                return {
                    "city": city,
                    "state": state,
                    "latitude": coords.get("latitude"),
                    "longitude": coords.get("longitude"),
                }
        return {"city": None, "state": None, "latitude": None, "longitude": None}

    def scrape_source(self, source: Dict) -> List[dict]:
        articles = []
        url = urljoin(source["base_url"], source["weather_path"])
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "html.parser")

            article_elements = soup.select(source["selectors"]["article_list"])

            for article_el in article_elements[:15]:
                try:
                    title_el = article_el.select_one(source["selectors"]["title"])
                    if not title_el:
                        continue
                    title = title_el.get_text(strip=True)
                    link = title_el.get("href", "")
                    if link and not link.startswith("http"):
                        link = urljoin(source["base_url"], link)

                    desc_el = article_el.select_one(source["selectors"]["description"])
                    description = desc_el.get_text(strip=True) if desc_el else title

                    if not self._is_weather_related(title + " " + description):
                        continue

                    location = self._extract_location_from_text(title + " " + description)

                    articles.append({
                        "title": title,
                        "description": description,
                        "source_url": link,
                        "source_name": source["name"],
                        "city": location["city"],
                        "state": location["state"],
                        "latitude": location["latitude"],
                        "longitude": location["longitude"],
                        "metadata": {"source_name": source["name"]},
                        "reported_at": datetime.utcnow().isoformat(),
                    })
                except Exception as e:
                    logger.error(f"Error parsing article from {source['name']}: {e}")
                    continue

            logger.info(f"Scraped {len(articles)} articles from {source['name']}")
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {e}")

        return articles

    async def scrape_all_sources(self) -> List[dict]:
        all_articles = []
        for source in INDIAN_NEWS_SOURCES:
            articles = self.scrape_source(source)
            all_articles.extend(articles)
        logger.info(f"Total articles scraped: {len(all_articles)}")
        return all_articles

    async def scrape_url(self, url: str) -> Optional[dict]:
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "html.parser")

            title = soup.find("title")
            title_text = title.get_text(strip=True) if title else "Untitled Article"

            paragraphs = soup.find_all("p")
            description_parts = []
            for p in paragraphs:
                text = p.get_text(strip=True)
                if len(text) > 50:
                    description_parts.append(text)
                if len(" ".join(description_parts)) > 500:
                    break
            description = " ".join(description_parts)

            if not self._is_weather_related(title_text + " " + description):
                return None

            location = self._extract_location_from_text(title_text + " " + description)

            return {
                "title": title_text,
                "description": description,
                "source_url": url,
                "source_name": "Custom URL",
                "city": location["city"],
                "state": location["state"],
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "metadata": {"custom_url": True},
                "reported_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {e}")
            return None

    async def store_scraped_articles(self, db, articles: List[dict]):
        stored_count = 0
        for article in articles:
            try:
                await weather_service.ingest_event(
                    db=db,
                    title=article["title"],
                    description=article["description"],
                    source=EventSource.WEB,
                    source_url=article.get("source_url"),
                    city=article.get("city"),
                    state=article.get("state"),
                    latitude=article.get("latitude"),
                    longitude=article.get("longitude"),
                    metadata=article.get("metadata", {}),
                )
                stored_count += 1
            except Exception as e:
                logger.error(f"Error storing article: {e}")
        logger.info(f"Stored {stored_count} articles in database")
        return stored_count

    def _mock_articles(self) -> List[dict]:
        import random
        from app.collectors.twitter_collector import INDIAN_STATES_AND_CITIES

        mock = []
        headlines = [
            "IMD predicts heavy rainfall in {city} over the next 48 hours",
            "Cyclone alert issued for coastal areas near {city}",
            "Thunderstorm with gusty winds likely in {city}, warns IMD",
            "Heatwave conditions grip {city} as temperatures cross 44°C",
            "Waterlogging reported in low-lying areas of {city}",
            "Dense fog disrupts flight operations at {city} airport",
            "Heavy rains cause flooding in {city}, several roads submerged",
            "Strong winds damage houses in {city}, power supply affected",
        ]
        for _ in range(15):
            city_key = random.choice(list(INDIAN_STATES_AND_CITIES.keys()))
            city, state = INDIAN_STATES_AND_CITIES[city_key]
            headline = random.choice(headlines).format(city=city)
            from app.utils.geolocation import get_city_coordinates
            coords = get_city_coordinates(city)
            mock.append({
                "title": headline,
                "description": headline + " Residents are advised to take necessary precautions.",
                "source_url": f"https://www.example-news.com/weather/{city.lower().replace(' ', '-')}",
                "source_name": "Mock News Source",
                "city": city,
                "state": state,
                "latitude": coords.get("latitude"),
                "longitude": coords.get("longitude"),
                "metadata": {"source_name": "Mock News"},
                "reported_at": datetime.utcnow().isoformat(),
            })
        return mock


web_scraper = WebScraper()