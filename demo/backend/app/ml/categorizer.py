import re

WEATHER_CATEGORY_KEYWORDS = {
    "rainfall": [
        "rain", "rainfall", "downpour", "monsoon", "shower", "precipitation",
        "waterlogging", "waterlogged", "cloudburst", "heavy rain", "mm rainfall",
        "rain gauge", "drizzle",
    ],
    "thunderstorm": [
        "thunderstorm", "thunder", "lightning", "electrical storm", "flash",
        "lightning strike", "thunder clap", "hail",
    ],
    "flooding": [
        "flood", "flooding", "flooded", "inundated", "submerged", "overflow",
        "flash flood", "river overflow", "breach", "embankment", "flood water",
        "evacuat", "relief camp", "water level rising",
    ],
    "heatwave": [
        "heatwave", "heat wave", "extreme heat", "high temperature", "scorching",
        "blistering", "temperature rise", "heat stroke", "dehydration", "45", "46", "47", "48",
    ],
    "fog": [
        "fog", "foggy", "mist", "haze", "smog", "reduced visibility",
        "low visibility", "zero visibility", "dense fog", "visibility dropped",
    ],
    "dust_storm": [
        "dust storm", "sandstorm", "dust", "sand", "dust devil", "blowing dust",
        "dust haze", "windblown sand",
    ],
    "strong_winds": [
        "wind", "gust", "gusty", "strong wind", "high wind", "wind speed",
        "wind damage", "windy", "uproot", "gale", "squall",
    ],
    "cyclone": [
        "cyclone", "tropical storm", "cyclonic storm", "deep depression",
        "storm surge", "landfall", "low pressure area", "evacuation order",
        "bay of bengal", "arabian sea", "coastal",
    ],
}


class Categorizer:
    def __init__(self):
        self.keywords = WEATHER_CATEGORY_KEYWORDS

    def categorize(self, title: str, description: str):
        text = f"{title} {description}".lower()
        scores = {}
        for category, keywords in self.keywords.items():
            score = 0
            for keyword in keywords:
                kw = keyword.lower()
                if kw in text:
                    score += 1 if len(kw.split()) == 1 else 1.5
            if score > 0:
                scores[category] = score

        if not scores:
            return "other", 0.0

        best = max(scores, key=scores.get)
        total = sum(scores.values())
        confidence = round(min(scores[best] / max(total, 1) * 1.3, 1.0), 3)
        return best, max(confidence, 0.3)

    def get_severity(self, title: str, description: str):
        text = f"{title} {description}".lower()
        critical = ["catastrophic", "disaster", "massive", "extreme", "devastating",
                    "emergency", "evacuat", "worst", "historic", "death", "kill",
                    "submerg", "red alert", "critical"]
        high = ["heavy", "intense", "severe", "major", "dangerous", "warning",
                "advisory", "threat", "flooding", "cyclone", "storm surge", "landfall"]
        moderate = ["moderate", "affected", "disrupt", "damage", "watch", "caution"]

        if any(k in text for k in critical):
            return "critical"
        if any(k in text for k in high):
            return "high"
        if any(k in text for k in moderate):
            return "moderate"
        return "low"


categorizer = Categorizer()
