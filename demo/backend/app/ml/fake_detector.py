import re

FAKE_KEYWORDS = [
    "urgent", "share before", "forward to", "100% true", "conspiracy",
    "exposed", "secret", "miracle", "send money", "click here", "click this link",
    "deleted", "act now", "limited time", "donation", "win", "prize",
    "forward to 10 people", "bad luck", "governments hiding", "cover up",
    "fake", "hoax", "prank", "satire", "forward to everyone",
]

LEGIT_KEYWORDS = [
    "imd", "india meteorological", "weather department", "met department",
    "ndrf", "sdrf", "disaster management", "official", "confirmed",
    "recorded", "measured", "alert issued", "warning issued", "advisory",
    "government", "district administration", "satellite", "radar",
    "relief operations", "per meteorological", "as per", "according to",
]

SUSPICIOUS_PATTERNS = [
    (r"share\s+(this|it)\s+(before|now|widely|everyone)", 0.3),
    (r"forward\s+to\s+\d+\s+people", 0.4),
    (r"send\s+(money|rs|₹|\$)", 0.5),
    (r"(won|win|prize|lottery)", 0.5),
    (r"click\s+(here|this\s+link)", 0.2),
    (r"\d+%\s+true", 0.3),
    (r"deleted\s+(soon|today)", 0.3),
    (r"act\s+now", 0.2),
]


class FakeDetector:
    def __init__(self, threshold=0.7):
        self.threshold = threshold

    def predict(self, title: str, description: str):
        text = f"{title} {description}".lower()
        score = 0.0
        signals = []

        for kw in FAKE_KEYWORDS:
            if kw in text:
                score += 0.14
                signals.append("fake_keyword:" + kw)

        for kw in LEGIT_KEYWORDS:
            if kw in text:
                score -= 0.14
                signals.append("legit_keyword:" + kw)

        for pattern, weight in SUSPICIOUS_PATTERNS:
            if re.search(pattern, text):
                score += weight
                signals.append("pattern")

        if title.isupper() and len(title) > 20:
            score += 0.15
            signals.append("all_caps")

        if (title + description).count("!") > 3:
            score += 0.1
            signals.append("exclamation")

        has_emoji = bool(re.search(r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF]", text))
        if has_emoji:
            score += 0.05
            signals.append("emoji")

        confidence = 1 / (1 + __import__("math").exp(-score * 1.8))
        confidence = max(0.0, min(1.0, confidence))
        is_fake = confidence >= self.threshold
        return is_fake, round(confidence, 3)


fake_detector = FakeDetector()
