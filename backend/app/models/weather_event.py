import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime,
    Enum, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class EventType(str, enum.Enum):
    RAINFALL = "rainfall"
    THUNDERSTORM = "thunderstorm"
    FLOODING = "flooding"
    HEATWAVE = "heatwave"
    FOG = "fog"
    DUST_STORM = "dust_storm"
    STRONG_WINDS = "strong_winds"
    CYCLONE = "cyclone"
    OTHER = "other"


class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class EventSource(str, enum.Enum):
    TWITTER = "twitter"
    WEB = "web"
    API = "api"
    CITIZEN_REPORT = "citizen_report"
    OTHER = "other"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class WeatherEvent(Base):
    __tablename__ = "weather_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=False)

    event_type = Column(Enum(EventType), nullable=False, index=True)
    severity = Column(Enum(SeverityLevel), nullable=False, index=True)
    source = Column(Enum(EventSource), nullable=False, index=True)
    source_url = Column(String(2000), nullable=True)
    source_id = Column(String(500), nullable=True, index=True)

    city = Column(String(200), nullable=True, index=True)
    state = Column(String(200), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    photos = Column(JSON, default=list)
    videos = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)

    verification_status = Column(Enum(VerificationStatus), nullable=False, default=VerificationStatus.PENDING, index=True)
    is_fake = Column(Boolean, default=False, index=True)
    fake_confidence = Column(Float, default=0.0)
    category_confidence = Column(Float, default=0.0)

    duplicate_of_id = Column(Integer, ForeignKey("weather_events.id"), nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    reported_by = relationship("User", foreign_keys=[reported_by_id], back_populates="reported_events")
    verified_by = relationship("User", foreign_keys=[verified_by_id], back_populates="verified_events")
    duplicate_of = relationship("WeatherEvent", remote_side=[id], backref="duplicates")

    __table_args__ = (
        Index("ix_weather_events_location", "latitude", "longitude"),
        Index("ix_weather_events_type_severity", "event_type", "severity"),
        Index("ix_weather_events_state_type", "state", "event_type"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "event_type": self.event_type.value if self.event_type else None,
            "severity": self.severity.value if self.severity else None,
            "source": self.source.value if self.source else None,
            "source_url": self.source_url,
            "source_id": self.source_id,
            "city": self.city,
            "state": self.state,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "photos": self.photos or [],
            "videos": self.videos or [],
            "metadata": self.metadata_ or {},
            "verification_status": self.verification_status.value if self.verification_status else None,
            "is_fake": self.is_fake,
            "fake_confidence": self.fake_confidence,
            "category_confidence": self.category_confidence,
            "duplicate_of_id": self.duplicate_of_id,
            "reported_by_id": self.reported_by_id,
            "verified_by_id": self.verified_by_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "reported_at": self.reported_at.isoformat() if self.reported_at else None,
        }
