import re
import logging
from typing import Tuple, Optional, List
from collections import Counter

logger = logging.getLogger(__name__)

WEATHER_CATEGORY_KEYWORDS = {
    "rainfall": [
        "rain", "rainfall", "downpour", "monsoon", "showers", "precipitation",
        "wet", "damp", "puddle", "waterlogging", "waterlogged",
        "cloudburst", "heavy rain", "light rain", "continuous rain",
        "rain gauge", "rainfall recorded", "mm rainfall",
    ],
    "thunderstorm": [
        "thunderstorm", "thunder", "lightning", "electrical storm",
        "thunder and lightning", "flash", "bolt", "storm",
        "lightning strike", "thunder clap", "thunder crack",
    ],
    "flooding": [
        "flood", "flooding", "flooded", "inundated", "submerged",
        "overflow", "deluge", "flash flood", "river overflow",
        "breach", "embankment", "water level rising", "drowning",
        "flood water", "flood affected", "relief camp",
    ],
    "heatwave": [
        "heatwave", "heat wave", "extreme heat", "high temperature",
        "scorching", "blistering", "hot", "temperature rise",
        "temperature exceeded", "celsius", "humid", "sweating",
        "heat stroke", "dehydration", "sun stroke", "UV index",
    ],
    "fog": [
        "fog", "foggy", "mist", "haze", "smog", "reduced visibility",
        "low visibility", "zero visibility", "dense fog",
        "visibility dropped", "fog warning", "fog advisory",
    ],
    "dust_storm": [
        "dust storm", "sandstorm", "dust", "sand", "dust devil",
        "blowing dust", "reduced visibility", "windblown",
        "dust haze", "particulate matter", "air quality poor",
    ],
    "strong_winds": [
        "wind", "gust", "gusty", "strong wind", "high wind",
        "wind speed", "wind damage", "windy", "breeze",
        "uprooted", "wind chill", "gale", "squall", "cyclone wind",
    ],
    "cyclone": [
        "cyclone", "hurricane", "typhoon", "tropical storm",
        "cyclonic storm", "deep depression", "low pressure area",
        "eye of the storm", "storm surge", "landfall",
        "cyclone warning", "evacuation", "wind speed km",
    ],
}

SEVERITY_MODIFIERS = {
    "critical": [
        "catastrophic", "disaster", "massive", "extreme", "devastating",
        "severe", "worst", "historic", "unprecedented", "emergency",
        "death", "kill", "destroy", "submerge", "red alert",
    ],
    "high": [
        "heavy", "intense", "major", "significant", "dangerous",
        "severe", "warning", "advisory", "damage", "threat",
        "severe", "cyclone", "storm surge", "landfall",
    ],
    "moderate": [
        "moderate", "affected", "impact", "disrupt", "damage",
        "watch", "warning", "caution", "beware", "advisory",
    ],
    "low": [
        "light", "mild", "minor", "slight", "normal",
        "expected", "typical", "seasonal", "routine",
    ],
}


class Categorizer:
    def __init__(self):
        self.category_weights = self._build_category_weights()

    def _build_category_weights(self) -> dict:
        weights = {}
        for category, keywords in WEATHER_CATEGORY_KEYWORDS.items():
            weights[category] = {}
            for i, keyword in enumerate(keywords):
                weights[category][keyword] = 1.0 - (i * 0.03)
        return weights

    def categorize(self, title: str, description: str) -> Tuple[Optional[str], float]:
        text = f"{title} {description}".lower()

        scores = {}
        for category in WEATHER_CATEGORY_KEYWORDS:
            score = self._calculate_category_score(text, category)
            if score > 0:
                scores[category] = score

        if not scores:
            return None, 0.0

        best_category = max(scores, key=scores.get)
        best_score = scores[best_category]

        confidence = min(best_score / 3.0, 1.0)

        if confidence < 0.2:
            return None, 0.0

        logger.debug(f"Categorizer: {best_category} ({confidence:.3f})")
        return best_category, confidence

    def _calculate_category_score(self, text: str, category: str) -> float:
        score = 0.0
        keywords = WEATHER_CATEGORY_KEYWORDS.get(category, {})
        weights = self.category_weights.get(category, {})

        tokens = re.findall(r'\b\w+\b', text)
        for token in tokens:
            if token in weights:
                score += weights[token]

        bigrams = []
        words = text.split()
        for i in range(len(words) - 1):
            bigrams.append(f"{words[i]} {words[i+1]}")
        for bigram in bigrams:
            if bigram in weights:
                score += weights[bigram] * 1.5

        trigrams = []
        for i in range(len(words) - 2):
            trigrams.append(f"{words[i]} {words[i+1]} {words[i+2]}")
        for trigram in trigrams:
            if trigram in weights:
                score += weights[trigram] * 2.0

        return score

    def get_severity(self, title: str, description: str) -> Tuple[str, float]:
        text = f"{title} {description}".lower()
        severity_scores = {}

        for severity, keywords in SEVERITY_MODIFIERS.items():
            score = 0
            for keyword in keywords:
                if keyword in text:
                    score += 1
            if score > 0:
                severity_scores[severity] = score

        if not severity_scores:
            return "low", 0.5

        best = max(severity_scores, key=severity_scores.get)
        confidence = min(severity_scores[best] / 3.0, 1.0)

        return best, confidence

    def batch_categorize(self, events: List[dict]) -> List[dict]:
        results = []
        for event in events:
            category, confidence = self.categorize(
                event.get("title", ""),
                event.get("description", ""),
            )
            severity, sev_confidence = self.get_severity(
                event.get("title", ""),
                event.get("description", ""),
            )
            results.append({
                "event_type": category,
                "category_confidence": confidence,
                "severity": severity,
                "severity_confidence": sev_confidence,
            })
        return results


categorizer = Categorizer()