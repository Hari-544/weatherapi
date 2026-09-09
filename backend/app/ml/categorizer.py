"""
Hybrid Weather Event Categorizer
---------------------------------
Classifies weather reports into:
    rainfall
    thunderstorm
    flooding
    heatwave
    fog
    dust_storm
    strong_winds
    cyclone
    other

Designed for:
- Social media reports
- IMD-related posts
- OpenWeather observations
- Citizen reports
- English + common Hindi/Hinglish weather terms
- Hashtags
"""

import re
import logging
from typing import Tuple, Optional, List

logger = logging.getLogger(__name__)


# ============================================================
# WEATHER PHRASES
# ============================================================

WEATHER_PATTERNS = {
    "rainfall": [
        # English
        "rain",
        "rainfall",
        "raining",
        "rainy",
        "heavy rain",
        "heavy rainfall",
        "light rain",
        "moderate rain",
        "continuous rain",
        "intense rain",
        "downpour",
        "showers",
        "rain showers",
        "precipitation",
        "monsoon",
        "cloudburst",
        "rain alert",
        "rain warning",
        "rainfall recorded",
        "mm rainfall",
        "waterlogging",
        "water logged",
        "waterlogged",

        # Hinglish / common Indian usage
        "baarish",
        "barish",
        "tez baarish",
        "tez barish",
        "bhari baarish",
        "bhari barish",
        "musaldhar baarish",
        "musaldhar barish",
        "lagatar baarish",
        "lagatar barish",

        # Hindi
        "बारिश",
        "वर्षा",
        "भारी बारिश",
        "तेज बारिश",
        "मूसलाधार बारिश",
        "लगातार बारिश",
        "वर्षा की संभावना",
        "भारी वर्षा",
    ],

    "thunderstorm": [
        "thunderstorm",
        "thunder storm",
        "thunder",
        "lightning",
        "electrical storm",
        "thunder and lightning",
        "lightning strike",
        "thunder clap",
        "thunderclap",
        "storm lightning",
        "thunderstorm warning",
        "thunderstorm alert",

        # Hindi / Hinglish
        "आंधी तूफान",
        "बिजली गिरने",
        "आकाशीय बिजली",
        "गरज",
        "गरज के साथ",
        "बिजली चमक",
        "गरज चमक",
        "aandhi",
        "andhi",
        "bijli girne",
        "bijli chamak",
        "garaj",
    ],

    "flooding": [
        "flood",
        "flooding",
        "flooded",
        "flash flood",
        "flash flooding",
        "flood water",
        "floodwater",
        "inundated",
        "inundation",
        "submerged",
        "overflow",
        "river overflow",
        "water level rising",
        "water level increased",
        "roads flooded",
        "road flooded",
        "streets flooded",
        "flood affected",
        "flood warning",
        "flood alert",
        "relief camp",
        "embankment breach",
        "dam overflow",

        # Hindi / Hinglish
        "बाढ़",
        "बाढ़ का पानी",
        "बाढ़ की स्थिति",
        "जलभराव",
        "पानी भर गया",
        "सड़क पर पानी",
        "नदी का जलस्तर",
        "baadh",
        "baadh ka paani",
        "jalbharav",
        "paani bhar gaya",
    ],

    "heatwave": [
        "heatwave",
        "heat wave",
        "extreme heat",
        "severe heat",
        "intense heat",
        "scorching heat",
        "blistering heat",
        "temperature rise",
        "temperature soared",
        "temperature exceeded",
        "record temperature",
        "highest temperature",
        "heat alert",
        "heat warning",
        "heatwave warning",
        "heat stroke",
        "heatstroke",
        "dehydration",
        "very hot",
        "extremely hot",

        # Hindi / Hinglish
        "लू",
        "हीटवेव",
        "भीषण गर्मी",
        "तेज गर्मी",
        "गर्मी की लहर",
        "गर्मी बढ़ी",
        "लू का प्रकोप",
        "loo",
        "garmi",
        "bhishan garmi",
        "tez garmi",
    ],

    "fog": [
        "fog",
        "foggy",
        "dense fog",
        "thick fog",
        "heavy fog",
        "mist",
        "misty",
        "reduced visibility",
        "low visibility",
        "poor visibility",
        "zero visibility",
        "visibility dropped",
        "fog warning",
        "fog advisory",
        "dense fog warning",

        # Hindi / Hinglish
        "कोहरा",
        "घना कोहरा",
        "धुंध",
        "दृश्यता कम",
        "कम दृश्यता",
        "kohra",
        "ghana kohra",
        "dhund",
        "kam drishyata",
    ],

    "dust_storm": [
        "dust storm",
        "duststorm",
        "sandstorm",
        "sand storm",
        "blowing dust",
        "dust haze",
        "dust cloud",
        "dust devil",
        "windblown dust",
        "dust storm warning",
        "dust storm alert",

        # Hindi / Hinglish
        "धूल भरी आंधी",
        "धूल का तूफान",
        "धूल भरी हवा",
        "रेतीला तूफान",
        "धूल उड़ना",
        "dhool bhari aandhi",
        "dhool bhari andhi",
        "dhool ka toofan",
    ],

    "strong_winds": [
        # IMPORTANT:
        # Do NOT include generic "wind".
        # "Wind: 2.06 m/s" is normal weather data.
        "strong wind",
        "strong winds",
        "high wind",
        "high winds",
        "gust",
        "gusts",
        "strong gust",
        "strong gusts",
        "gusty winds",
        "very strong winds",
        "powerful winds",
        "damaging winds",
        "wind damage",
        "windstorm",
        "gale",
        "gale force",
        "squall",
        "storm force winds",
        "uprooted trees",
        "trees uprooted",
        "roofs blown",
        "wind warning",
        "high wind warning",

        # Hindi / Hinglish
        "तेज हवाएं",
        "तेज हवा",
        "आंधी",
        "जोरदार हवाएं",
        "जोरदार हवा",
        "हवा की रफ्तार तेज",
        "तेज रफ्तार हवाएं",
        "tez hawa",
        "tez hawayein",
        "aandhi",
        "andhi",
    ],

    "cyclone": [
        "cyclone",
        "cyclonic storm",
        "severe cyclonic storm",
        "tropical cyclone",
        "tropical storm",
        "hurricane",
        "typhoon",
        "deep depression",
        "cyclone warning",
        "cyclone alert",
        "cyclone landfall",
        "storm surge",
        "eye of the storm",
        "landfall",
        "cyclonic circulation",

        # Hindi / Hinglish
        "चक्रवात",
        "चक्रवाती तूफान",
        "चक्रवात की चेतावनी",
        "चक्रवात का खतरा",
        "chakravaat",
        "chakravat",
        "cyclone alert",
    ],
}


# ============================================================
# SEVERITY KEYWORDS
# ============================================================

SEVERITY_PATTERNS = {
    "critical": [
        "catastrophic",
        "devastating",
        "disaster",
        "massive flooding",
        "extreme flooding",
        "death",
        "deaths",
        "killed",
        "destroyed",
        "submerged completely",
        "evacuation order",
        "emergency",
        "red alert",
        "extremely severe",
        "severe cyclonic storm",
        "unprecedented",
        "historic disaster",
    ],

    "high": [
        "heavy rain",
        "heavy rainfall",
        "intense rain",
        "flood",
        "flooding",
        "flash flood",
        "cyclone",
        "cyclonic storm",
        "storm surge",
        "landfall",
        "strong winds",
        "damaging winds",
        "severe",
        "major",
        "dangerous",
        "warning",
        "red alert",
        "evacuation",
        "significant damage",
    ],

    "moderate": [
        "moderate",
        "affected",
        "impact",
        "damage",
        "disruption",
        "watch",
        "advisory",
        "caution",
        "alert",
        "rain alert",
        "weather warning",
    ],

    "low": [
        "light rain",
        "light rainfall",
        "mild",
        "minor",
        "slight",
        "normal",
        "expected",
        "forecast",
        "possible",
        "chance of rain",
        "partly cloudy",
        "cloudy",
        "clear sky",
    ],
}


# ============================================================
# NON-EVENT / NORMAL WEATHER PHRASES
# ============================================================

NORMAL_WEATHER_PATTERNS = [
    "clear sky",
    "clear skies",
    "few clouds",
    "scattered clouds",
    "broken clouds",
    "overcast",
    "cloudy",
    "partly cloudy",
    "mostly cloudy",
    "fair weather",
    "normal weather",
    "temperature",
    "wind speed",
    "humidity",
    "pressure",
    "visibility",
    "feels like",
]


class Categorizer:
    """
    Hybrid rule-based weather event classifier.

    Returns:
        Tuple[event_type, confidence]
    """

    def __init__(self):
        self.patterns = WEATHER_PATTERNS
        self.severity_patterns = SEVERITY_PATTERNS

    # ========================================================
    # PUBLIC API
    # ========================================================

    def categorize(
        self,
        title: str,
        description: str
    ) -> Tuple[Optional[str], float]:

        text = self._normalize_text(
            f"{title or ''} {description or ''}"
        )

        if not text.strip():
            return None, 0.0

        # ----------------------------------------------------
        # 1. Explicit event detection
        # ----------------------------------------------------

        scores = {}

        for category, patterns in self.patterns.items():
            score = self._category_score(text, patterns)

            if score > 0:
                scores[category] = score

        # ----------------------------------------------------
        # 2. No event detected
        # ----------------------------------------------------

        if not scores:
            return None, 0.0

        # ----------------------------------------------------
        # 3. Special handling for cyclone
        # ----------------------------------------------------
        # Cyclone terminology is much more specific than
        # generic storm/wind terminology.

        if self._contains_any(
            text,
            self.patterns["cyclone"]
        ):
            cyclone_score = scores.get("cyclone", 0)

            if cyclone_score > 0:
                confidence = min(
                    0.85 + cyclone_score * 0.05,
                    1.0
                )
                return "cyclone", round(confidence, 3)

        # ----------------------------------------------------
        # 4. Flooding takes priority over rainfall
        # ----------------------------------------------------
        # Example:
        # "Heavy rain caused flooding"
        #
        # The actual incident is flooding.

        if self._contains_any(
            text,
            self.patterns["flooding"]
        ):
            flood_score = scores.get("flooding", 0)

            confidence = self._score_to_confidence(
                flood_score
            )

            return "flooding", round(confidence, 3)

        # ----------------------------------------------------
        # 5. Select highest scoring category
        # ----------------------------------------------------

        best_category = max(
            scores,
            key=scores.get
        )

        best_score = scores[best_category]

        # ----------------------------------------------------
        # 6. Resolve common conflicts
        # ----------------------------------------------------

        best_category = self._resolve_conflicts(
            text,
            best_category,
            scores
        )

        confidence = self._score_to_confidence(
            scores.get(best_category, best_score)
        )

        # ----------------------------------------------------
        # 7. Don't classify normal observations as events
        # ----------------------------------------------------

        if self._is_normal_observation(
            text,
            best_category
        ):
            return None, 0.0

        return best_category, round(confidence, 3)

    # ========================================================
    # SCORING
    # ========================================================

    def _category_score(
        self,
        text: str,
        patterns: List[str]
    ) -> float:

        score = 0.0

        # Long / specific phrases receive higher weight.
        for pattern in patterns:

            pattern_lower = pattern.lower()

            if pattern_lower not in text:
                continue

            words = pattern_lower.split()

            if len(words) >= 3:
                score += 3.0
            elif len(words) == 2:
                score += 2.0
            else:
                score += 1.0

        return score

    def _score_to_confidence(
        self,
        score: float
    ) -> float:

        if score <= 0:
            return 0.0

        if score >= 6:
            return 0.98

        if score >= 4:
            return 0.95

        if score >= 3:
            return 0.90

        if score >= 2:
            return 0.80

        return 0.65

    # ========================================================
    # CONFLICT RESOLUTION
    # ========================================================

    def _resolve_conflicts(
        self,
        text: str,
        best_category: str,
        scores: dict
    ) -> str:

        # ----------------------------------------------------
        # Flood > Rain
        # ----------------------------------------------------

        if (
            scores.get("flooding", 0) > 0
            and scores.get("rainfall", 0) > 0
        ):
            return "flooding"

        # ----------------------------------------------------
        # Cyclone > Strong winds
        # ----------------------------------------------------

        if (
            scores.get("cyclone", 0) > 0
            and scores.get("strong_winds", 0) > 0
        ):
            return "cyclone"

        # ----------------------------------------------------
        # Dust storm > Strong winds
        # ----------------------------------------------------

        if (
            scores.get("dust_storm", 0) > 0
            and scores.get("strong_winds", 0) > 0
        ):
            return "dust_storm"

        # ----------------------------------------------------
        # Thunderstorm > Strong winds
        # ----------------------------------------------------

        if (
            scores.get("thunderstorm", 0) > 0
            and scores.get("strong_winds", 0) > 0
        ):
            return "thunderstorm"

        return best_category

    # ========================================================
    # NORMAL OBSERVATION DETECTION
    # ========================================================

    def _is_normal_observation(
        self,
        text: str,
        category: str
    ) -> bool:

        # Generic wind measurements should NOT become
        # strong-wind events.

        if category == "strong_winds":

            explicit_strong_wind = self._contains_any(
                text,
                [
                    "strong wind",
                    "strong winds",
                    "high wind",
                    "high winds",
                    "strong gust",
                    "strong gusts",
                    "gusty winds",
                    "damaging winds",
                    "wind damage",
                    "gale",
                    "squall",
                    "wind warning",
                    "तेज हवा",
                    "तेज हवाएं",
                    "जोरदार हवा",
                    "आंधी",
                    "tez hawa",
                    "tez hawayein",
                    "aandhi",
                    "andhi",
                ]
            )

            if not explicit_strong_wind:
                return True

        # Clear-sky OpenWeather observations are not events.

        if (
            category == "rainfall"
            and "clear sky" in text
            and not self._contains_any(
                text,
                [
                    "rain",
                    "rainfall",
                    "raining",
                    "baarish",
                    "barish",
                    "बारिश",
                    "वर्षा",
                ]
            )
        ):
            return True

        return False

    # ========================================================
    # TEXT NORMALIZATION
    # ========================================================

    def _normalize_text(self, text: str) -> str:

        text = text.lower()

        # Convert hashtags:
        # #HeavyRain -> heavy rain
        # #RainAlert -> rain alert
        text = re.sub(
            r"#([a-zA-Z]+)",
            r" \1 ",
            text
        )

        # Preserve Unicode characters such as Hindi.

        # Normalize punctuation
        text = re.sub(
            r"[_|/]+",
            " ",
            text
        )

        text = re.sub(
            r"[,:;()\[\]{}]+",
            " ",
            text
        )

        # Normalize whitespace
        text = re.sub(
            r"\s+",
            " ",
            text
        )

        return text.strip()

    # ========================================================
    # HELPERS
    # ========================================================

    def _contains_any(
        self,
        text: str,
        patterns: List[str]
    ) -> bool:

        return any(
            pattern.lower() in text
            for pattern in patterns
        )

    # ========================================================
    # SEVERITY
    # ========================================================

    def get_severity(
        self,
        title: str,
        description: str
    ) -> Tuple[str, float]:

        text = self._normalize_text(
            f"{title or ''} {description or ''}"
        )

        scores = {}

        for severity, patterns in self.severity_patterns.items():

            score = 0

            for pattern in patterns:
                if pattern.lower() in text:
                    score += 1

            if score > 0:
                scores[severity] = score

        if not scores:
            return "low", 0.5

        # Critical always wins.
        if "critical" in scores:
            best = "critical"

        elif "high" in scores:
            best = "high"

        elif "moderate" in scores:
            best = "moderate"

        else:
            best = "low"

        confidence = min(
            scores[best] / 3.0,
            1.0
        )

        return best, round(confidence, 3)

    # ========================================================
    # BATCH API
    # ========================================================

    def batch_categorize(
        self,
        events: List[dict]
    ) -> List[dict]:

        results = []

        for event in events:

            category, confidence = self.categorize(
                event.get("title", ""),
                event.get("description", "")
            )

            severity, severity_confidence = self.get_severity(
                event.get("title", ""),
                event.get("description", "")
            )

            results.append({
                "event_type": category,
                "category_confidence": confidence,
                "severity": severity,
                "severity_confidence": severity_confidence,
            })

        return results


# ============================================================
# GLOBAL INSTANCE
# ============================================================

categorizer = Categorizer()