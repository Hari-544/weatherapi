# National Weather Big Data Analytics Platform — Working Demo

A simplified, self-contained demo of the SIH problem statement: **collecting, deduplicating,
verifying, and visualizing weather events across India** using a fake-detection ML pipeline
and a real-time dashboard.

Tech: **FastAPI + SQLite (async) + React (Vite/Tailwind/Leaflet/Recharts)**. No Docker required.

---

## Quick Start (Windows)

From the `demo/` directory:

```powershell
.\run_demo.ps1
```

The script will:
1. Create a Python venv at `backend/.venv` and install backend deps.
2. `npm install` frontend deps (if needed).
3. Start **backend** at http://127.0.0.1:8000 (FastAPI + auto-seed of `weather.db`).
4. Start **frontend** at http://127.0.0.1:5173 (Vite dev server, proxies `/api` → backend).

### Log in

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | `admin`  | `admin123` |
| Analyst| `analyst`| `analyst123`|

---

## Manual start

```powershell
# Terminal 1 — backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
# Swagger docs: http://127.0.0.1:8000/docs

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
# App: http://127.0.0.1:5173
```

---

## What's implemented

### Backend (`backend/app`)
- **Auth** — register/login, JWT, roles (`citizen`, `analyst`, `admin`). Passwords hashed with bcrypt (pinned to `4.0.1` — 5.x breaks passlib).
- **Weather events** — CRUD + filtering by event type, severity, state, city, verification status, source, date range, free-text search. Paginated.
- **Analytics** — events by type, by state, over time (day/month), severity distribution, verification status, source breakdown, top cities, recent events.
- **ML pipeline (rule-based)** applied at ingest:
  - `categorizer` — classifies free text → event type + severity.
  - `fake_detector` — keyword/pattern/emoji/all-caps scoring → fake confidence (sigmoid).
  - `deduplicator` — flags duplicate reports (same place/time/text) via haversine distance.
- **Ingestion** (live, via Admin panel):
  - Simulated `#IMD` social stream (Twitter-style posts about rain/flood/heatwave/etc., ~12% fake posts, 25 Indian cities, real coordinates).
  - OpenWeatherMap collector — uses your free API key if `OPENWEATHER_API_KEY` is set, otherwise falls back to realistic mock data.
- **Auto-seed** on first startup: 2 users + ~120 realistic events (timestamps spread over 14 days for meaningful time charts).

### Frontend (`frontend`)
- **Dashboard** — stat cards (total/pending/verified/fake, verification rate), interactive Leaflet map of India with severity-colored + dashed-fake markers, recent events feed.
- **Events** — filterable/searchable paginated table; citizens can "Report an Event" (goes through the ML pipeline as a `citizen` source event).
- **Analytics** — Recharts visualizations (bar/line/pie) with day/month granularity toggle.
- **Admin** — verify/reject/review/delete events, one-click live ingestion (simulate #IMD posts, fetch API weather).
- Login page with quick-fill credentials.

---

## Project layout

```
demo/
├── backend/
│   ├── app/
│   │   ├── main.py          # app entry + startup seeding
│   │   ├── api/             # auth, weather, dashboard, ingest routers
│   │   ├── core/            # config, async database
│   │   ├── models/          # SQLAlchemy models (events, users)
│   │   ├── ml/              # categorizer, fake_detector, deduplicator
│   │   ├── services/        # ingestion pipeline, geolocation (Indian cities)
│   │   └── ingest/          # #IMD simulator, OpenWeatherMap collector
│   ├── requirements.txt
│   └── weather.db           # created + seeded automatically
├── frontend/                # Vite + React + Tailwind + Leaflet + Recharts
├── scripts/                 # (optional) standalone utilities
├── run_demo.ps1
└── README.md
```

---

## Optional: real OpenWeatherMap data

1. Get a free key at https://openweathermap.org.
2. Set it before starting the backend:

```powershell
$env:OPENWEATHER_API_KEY = "your_key_here"
.\run_demo.ps1 -NoInstall
```

Without a key the collector returns realistic mock conditions per city, so the demo always works offline.

---

## API endpoints (Swagger at `/docs`)

- `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me`
- `GET/POST /api/weather` · `GET /api/weather/stats/general` · `GET /api/weather/{id}`
- `POST /api/weather/{id}/verify` (staff) · `DELETE /api/weather/{id}` (staff)
- `GET /api/dashboard/*` (6 analytics endpoints)
- `POST /api/ingest/simulate-social?count=N` (staff)
- `POST /api/ingest/ingest-api?count=N` (staff)

## Important pins

- `bcrypt==4.0.1` — passlib 1.7.4 does not work with bcrypt 5.x (`module 'bcrypt' has no attribute '__about__'`). Do not upgrade.