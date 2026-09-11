import re
import logging
from typing import Tuple, List, Dict
from collections import Counter

logger = logging.getLogger(__name__)

# High-confidence suspicious signals - these strongly indicate misleading content
HIGH_RISK_PATTERNS = [
    (r"forward\s+(this\s+)?to\s+\d+\s+people", 0.5, "forwarding_chain"),
    (r"share\s+(this|it)\s+(before|now|widely|everyone|immediately)", 0.4, "forwarding_chain"),
    (r"click\s+(here|this\s+link|link)", 0.3, "suspicious_link"),
    (r"send\s+(money|rs|₹|\$)", 0.6, "financial_scam"),
    (r"won\s+(a\s+)?(prize|lottery|money|cash)", 0.6, "financial_scam"),
    (r"claim\s+(free|your)\s+(money|cash|prize)", 0.5, "financial_scam"),
    (r"miracle\s+(cure|method|solution|way)", 0.5, "miracle_claim"),
    (r"secret\s+(method|formula|trick|way)", 0.4, "miracle_claim"),
    (r"hidden\s+truth", 0.3, "conspiracy_claim"),
    (r"government\s+(hiding|cover.?up|lying|suppressing)", 0.4, "fabricated_authority"),
    (r"(they|authorities?)\s+(are\s+)?(hiding|covering\s+up|suppressing)\b", 0.6, "fabricated_authority"),
    (r"they\s+(don't|do not)\s+want\s+you\s+to\s+know", 0.4, "conspiracy_claim"),
    (r"\d+%\s+(true|real|confirmed|verified|accurate)", 0.4, "fabricated_certainty"),
    (r"100%\s+(true|real|confirmed|verified|accurate)", 0.5, "fabricated_certainty"),
    (r"deleted\s+(soon|today|tomorrow|immediately)", 0.4, "urgency_manipulation"),
    (r"share\s+before\s+(deleted|removed|banned)", 0.4, "urgency_manipulation"),
    (r"act\s+(now|immediately|fast)\s+or", 0.3, "urgency_manipulation"),
]

# Medium-risk suspicious patterns
MEDIUM_RISK_PATTERNS = [
    (r"conspiracy", 0.2, "conspiracy_claim"),
    (r"cover.?up", 0.2, "conspiracy_claim"),
    (r"exposed", 0.15, "sensational_claim"),
    (r"act\s+now", 0.15, "urgency_manipulation"),
    (r"limited\s+time", 0.15, "urgency_manipulation"),
    (r"don't\s+miss", 0.15, "urgency_manipulation"),
    (r"urgent.*share", 0.2, "forwarding_chain"),
]

# Legitimate weather context indicators - these REDUCE risk
CREDIBLE_WEATHER_INDICATORS = [
    "imd", "india meteorological department", "weather department",
    "national disaster", "ndrf", "sdrf", "disaster management",
    "official", "confirmed", "measured", "recorded",
    "alert issued", "warning issued", "advisory",
    "government", "state government", "district administration",
    "rainfall recorded", "temperature recorded",
    "flood warning", "evacuation order",
    "according to data", "weather stations", "radar",
    "satellite imagery", "forecast model",
    "emergency services", "relief operations",
    "weather station", "observed", "monitored",
    "meteorological", "hydrological", "seismological",
]

# Citizen report indicators - these should NOT increase risk
CITIZEN_REPORT_INDICATORS = [
    "reported", "observed", "saw", "seen", "noticed",
    "near my", "in my area", "around here", "local",
    "my village", "my town", "my city", "our area",
]

# Keywords that are NEUTRAL in weather context (often misclassified as suspicious)
NEUTRAL_IN_WEATHER_CONTEXT = {
    "urgent", "breaking", "alert", "warning", "emergency",
    "heavy", "severe", "extreme", "intense", "major",
    "immediate", "now", "today", "tonight", "currently",
}


class FakeDetector:
    def __init__(self):
        self.confidence_threshold = 0.7

    def predict(self, title: str, description: str) -> Tuple[bool, float]:
        text = f"{title} {description}".lower()
        score = 0.0
        signals = []

        # Analyze high-risk patterns FIRST
        risk_score, risk_signals = self._analyze_high_risk_patterns(text)
        score += risk_score
        signals.extend(risk_signals)
        has_high_risk = risk_score > 0

        # Analyze medium-risk patterns
        medium_score, medium_signals = self._analyze_medium_risk_patterns(text)
        score += medium_score
        signals.extend(medium_signals)

        # Analyze structure
        structural_score, structural_signals = self._analyze_structure(title, description)
        score += structural_score
        signals.extend(structural_signals)

        # Analyze source credibility ONLY if no high-risk patterns
        if not has_high_risk:
            source_score, source_signals = self._analyze_source_credibility(text)
            score += source_score
            signals.extend(source_signals)
        else:
            # Still check for social media mentions even with high-risk
            # but skip the credibility boost from official sources
            social_media_score, social_media_signals = self._analyze_social_media_only(text)
            score += social_media_score
            signals.extend(social_media_signals)

        # Analyze sentiment
        sentiment_score, sentiment_signal = self._analyze_sentiment(text)
        score += sentiment_score
        if sentiment_signal:
            signals.append(sentiment_signal)

        # Apply credibility reduction for legitimate weather context
        # BUT NOT if high-risk patterns were detected (those override credibility)
        if not has_high_risk:
            credibility_score, credibility_signals = self._analyze_credibility(text)
            score += credibility_score
            signals.extend(credibility_signals)

        # Detect citizen reports - these should not be penalized
        citizen_score, citizen_signals = self._analyze_citizen_report(text)
        score += citizen_score
        signals.extend(citizen_signals)

        confidence = self._normalize_score(score)

        is_fake = confidence >= self.confidence_threshold

        logger.debug(f"FakeDetector score: {confidence:.3f}, is_fake: {is_fake}, signals: {signals}")
        return is_fake, confidence

    def _analyze_high_risk_patterns(self, text: str) -> Tuple[float, List[str]]:
        score = 0.0
        signals = []
        for pattern, weight, signal_type in HIGH_RISK_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                score += weight
                signals.append(f"pattern:{signal_type}")
        return score, signals

    def _analyze_medium_risk_patterns(self, text: str) -> Tuple[float, List[str]]:
        score = 0.0
        signals = []
        for pattern, weight, signal_type in MEDIUM_RISK_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                score += weight
                signals.append(f"pattern:{signal_type}")
        return score, signals

    def _analyze_structure(self, title: str, description: str) -> Tuple[float, List[str]]:
        score = 0.0
        signals = []

        if len(title) > 150:
            score += 0.1
            signals.append("long_title")
        if title.isupper() and len(title) > 20:
            score += 0.15
            signals.append("all_caps_title")

        exclamation_count = (title + description).count('!')
        if exclamation_count > 3:
            score += 0.1
            signals.append("excessive_exclamation")

        question_marks = (title + description).count('?')
        if question_marks > 2:
            score += 0.05
            signals.append("excessive_questions")

        url_count = len(re.findall(r'https?://\S+', description))
        if url_count > 2:
            score += 0.15
            signals.append("multiple_urls")

        has_emoji = bool(re.search(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF]', title + description))
        if has_emoji:
            score += 0.05
            signals.append("has_emoji")

        return score, signals

    def _analyze_source_credibility(self, text: str) -> Tuple[float, List[str]]:
        score = 0.0
        signals = []

        # Check for credible weather sources
        for source in CREDIBLE_WEATHER_INDICATORS:
            if source in text:
                score -= 0.15
                signals.append(f"credible_weather_reference:{source}")
                break

        # Social media mentions slightly increase risk
        social_media_mentions = [
            "whatsapp", "facebook", "telegram", "instagram",
            "twitter", "forwarded", "shared",
        ]
        for mention in social_media_mentions:
            if mention in text:
                score += 0.05
                signals.append(f"social_media_mention:{mention}")
                break

        return score, signals

    def _analyze_social_media_only(self, text: str) -> Tuple[float, List[str]]:
        """Only check social media mentions, skip credibility boost."""
        score = 0.0
        signals = []

        social_media_mentions = [
            "whatsapp", "facebook", "telegram", "instagram",
            "twitter", "forwarded", "shared",
        ]
        for mention in social_media_mentions:
            if mention in text:
                score += 0.05
                signals.append(f"social_media_mention:{mention}")
                break

        return score, signals

    def _analyze_sentiment(self, text: str) -> Tuple[float, str]:
        fear_words = [
            "scary", "terrifying", "horrifying", "catastrophic",
            "apocalyptic", "end of the world", "biblical",
            "unprecedented", "never before", "worst ever",
        ]
        urgency_words = [
            "urgent", "immediately", "right now", "don't wait",
            "before it's too late", "last chance",
        ]

        fear_count = sum(1 for w in fear_words if w in text)
        urgency_count = sum(1 for w in urgency_words if w in text)

        score = 0.0
        signal = None
        if fear_count > 2:
            score += 0.2
            signal = f"high_fear_sentiment:{fear_count}"
        if urgency_count > 2:
            score += 0.15
            signal = signal or f"high_urgency_sentiment:{urgency_count}"

        return score, signal

    def _analyze_credibility(self, text: str) -> Tuple[float, List[str]]:
        """Reduce risk for legitimate weather reporting language."""
        score = 0.0
        signals = []

        credible_count = 0
        for indicator in CREDIBLE_WEATHER_INDICATORS:
            if indicator in text:
                credible_count += 1

        if credible_count >= 3:
            score -= 0.3
            signals.append("strong_credible_weather_context")
        elif credible_count >= 1:
            score -= 0.15
            signals.append("credible_weather_context")

        return score, signals

    def _analyze_citizen_report(self, text: str) -> Tuple[float, List[str]]:
        """Citizen reports should not be penalized for observational language."""
        score = 0.0
        signals = []

        citizen_count = 0
        for indicator in CITIZEN_REPORT_INDICATORS:
            if indicator in text:
                citizen_count += 1

        if citizen_count >= 2:
            score -= 0.1
            signals.append("citizen_observation_language")

        return score, signals

    def _normalize_score(self, raw_score: float) -> float:
        import math
        normalized = 1 / (1 + math.exp(-raw_score * 2))
        return max(0.0, min(1.0, normalized))

    def batch_predict(self, events: List[dict]) -> List[dict]:
        results = []
        for event in events:
            is_fake, confidence = self.predict(
                event.get("title", ""),
                event.get("description", ""),
            )
            results.append({
                "is_fake": is_fake,
                "confidence": confidence,
            })
        return results


fake_detector = FakeDetector()