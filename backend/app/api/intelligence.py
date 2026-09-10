"""
Intelligence & Explainability API.

Endpoints:
  GET  /events/{event_id}           → full AI intelligence panel for an event
  GET  /events/{event_id}/audit     → classification / review audit trail
  POST /events/{event_id}/classify  → admin classification override (human-in-the-loop)
  GET  /sources                     → source health & trust table

Every intelligence block is versioned and reconstructable. History is stored
in event metadata so nothing is ever lost when the pipeline is improved.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.weather_event import WeatherEvent, EventType, EventSource, VerificationStatus
from app.models.user import User
from app.api.auth import get_current_user, get_current_admin
from app.services.intelligence_service import intelligence_service
from app.ml.source_trust import get_all_source_trusts
from app.ml.classifier_engine import classifier_engine

router = APIRouter()


class ClassificationOverride(BaseModel):
    event_type: EventType
    reason: str
    note: Optional[str] = None


def _get_intelligence(event) -> dict:
    metadata = event.metadata_ or {}
    return metadata.get("intelligence", {}) if isinstance(metadata, dict) else {}


@router.get("/events/{event_id}", response_model=dict)
async def event_intelligence(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the complete intelligence panel for an event.

    Lazy-computes the pipeline if the event predates the intelligence
    engine, so every historical event gets a score without a migration.
    """
    result = await db.execute(
        select(WeatherEvent).where(WeatherEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Weather event not found")

    intelligence = _get_intelligence(event)
    if not intelligence:
        intelligence = await intelligence_service.process_event(db, event)
        await db.commit()
        await db.refresh(event)
        intelligence = _get_intelligence(event)

    return {
        "event": event.to_dict(),
        "intelligence": intelligence,
    }


@router.get("/events/{event_id}/audit", response_model=dict)
async def event_audit_trail(
    event_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WeatherEvent)
        .options(
            selectinload(WeatherEvent.reported_by),
            selectinload(WeatherEvent.verified_by),
        )
        .where(WeatherEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Weather event not found")

    metadata = event.metadata_ or {}
    intelligence = metadata.get("intelligence", {}) if isinstance(metadata, dict) else {}
    classification_history = intelligence.get("classification_history", []) or []

    return {
        "event_id": event.id,
        "reported_at": event.reported_at.isoformat() if event.reported_at else None,
        "reported_by": (event.reported_by.username if event.reported_by else None),
        "verified_by": (event.verified_by.username if event.verified_by else None),
        "audit_entries": list(classification_history),
    }


def _ensure_classification_history(metadata: dict) -> list:
    intelligence = metadata.setdefault("intelligence", {})
    history = intelligence.setdefault("classification_history", [])
    return history


@router.post("/events/{event_id}/classify", response_model=dict)
async def classify_override(
    event_id: int,
    override: ClassificationOverride,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Human-in-the-loop classification override.

    Keeps the original AI decision + the manual decision + who/when/why in
    the audit trail. Marks the classification state MANUALLY_CLASSIFIED.
    """
    result = await db.execute(select(WeatherEvent).where(WeatherEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Weather event not found")

    metadata = event.metadata_ or {}
    if not isinstance(metadata, dict):
        metadata = {}

    intelligence = metadata.get("intelligence", {})
    if not isinstance(intelligence, dict):
        intelligence = {"version": "intelligence-pipeline-v1"}

    original = {
        "event_type": event.event_type.value if event.event_type else None,
        "confidence": getattr(event, "category_confidence", 0.0) or 0.0,
        "state": intelligence.get("classification", {}).get("state", "AUTO_CLASSIFIED"),
        "version": intelligence.get("classification", {}).get("version", classifier_engine.version),
    }

    history = _ensure_classification_history(metadata)
    history.append({
        "action": "manual_override",
        "timestamp": datetime.utcnow().isoformat(),
        "admin_id": current_user.id,
        "admin_username": current_user.username,
        "original": original,
        "new": {
            "event_type": override.event_type.value,
        },
        "reason": override.reason,
        "note": override.note,
    })

    classification = intelligence.setdefault("classification", {})
    classification["category"] = override.event_type.value
    classification["state"] = "MANUALLY_CLASSIFIED"
    classification["manual_override"] = {
        "approved_by": current_user.username,
        "approved_at": datetime.utcnow().isoformat(),
        "reason": override.reason,
    }

    intelligence["classification_history"] = history
    metadata["intelligence"] = intelligence
    event.metadata_ = metadata
    event.event_type = override.event_type

    await db.commit()
    await db.refresh(event)

    return {
        "event_id": event.id,
        "event_type": override.event_type.value,
        "state": "MANUALLY_CLASSIFIED",
        "ai_original": original,
        "approved_by": current_user.username,
    }


@router.get("/sources", response_model=dict)
async def source_health(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Source health & trust table for data provenance transparency."""
    trusts = await get_all_source_trusts(db)
    return {
        "version": "source-trust-v1",
        "min_samples_for_statistics": 10,
        "sources": trusts,
    }