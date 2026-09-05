# National Weather Big Data Analytics Platform — 4-Day Plan

Scope: a **working demo** of the SIH problem statement — collect, deduplicate, verify and
visualize weather events across India. Everything runs locally (Python 3.14, no Docker)
with a rule-based "ML" pipeline so no trained model files are needed.

## Day 1 — Foundation & Backend Core ✔ (done)
- Verify Python 3.14 package compatibility (fastapi, sqlalchemy, aiosqlite, jose, bcrypt).
- **Critical pin:** `bcrypt==4.0.1` — passlib breaks with bcrypt 5.x.
- Project skeleton + config + async SQLite database.
- Models: `WeatherEvent`, `User` (roles citizen/analyst/admin) with indexes.
- Auth API: register/login/me, JWT, bcrypt hashing, staff-role guard.
- Geolocation service: ~55 Indian cities with real lat/lng + state mapping.

## Day 2 — ML Pipeline + Ingestion ✔ (done)
- `categorizer` — rule-based text → event type + severity.
- `fake_detector` — keyword/pattern/emoji/all-caps scoring + sigmoid confidence.
- `deduplicator` — location/time/text similarity (haversine + token overlap).
- `weather_service` — ingestion pipeline wiring ML + dedup.
- Simulated `#IMD` social stream (24 types of posts, ~12% fake, 25 cities).
- OpenWeatherMap collector (free key optional; mock offline fallback).

## Day 3 — API, Analytics + Frontend ✔ (done this build)
- REST API: events CRUD + filters (date/type/state/city/verification/source/search),
  pagination; verify/reject (staff); delete (staff).
- Dashboard analytics endpoints (by-type, by-state, over-time, severity, verification,
  source, top-cities, recent).
- React frontend (Vite + Tailwind):
  - Dashboard: stat cards + Leaflet map (severity colors, dashed-fake markers) + feed.
  - Events: filterable table + citizen report form.
  - Analytics: Recharts (bar/line/pie, day/month).
  - Admin: verify/review/reject/delete + one-click live ingestion.
- Auth UI with quick-fill demo credentials; route guards by role.

## Day 4 — Polish, Fallback-Free & Packaging ✔ (done)
- Auto-seed on startup (users + 120 events spread over 14 days).
- Live e2e verification through the Vite proxy (login → API → DB).
- `run_demo.ps1` launcher (creates venv, installs, starts backend+frontend).
- README, .gitignore, standalone `seed_database.py`.
- OpenWeatherMap key optional; all demo features work 100% offline.

## Verified end-to-end (Sep 2026)
- Backend starts, seeds 120 events, login works, filters/verify/ingest all return correct data.
- Analytics: events spread across 16 days; severity/source/verification distributions populate.
- Frontend builds cleanly and the Vite → FastAPI proxy passes auth + data.

## Extension ideas (if time permits)
- Streaming: real Twitter/X API (paid) or data.gov.in IMD dataset ingestion.
- ML: train a classifier from the labeled seed data (scikit-learn is installable on 3.14).
- Alerting: WebSocket push of newly-flagged critical events to the dashboard.
- Map clustering for thousands of markers; PDF/CSV export of analytics.