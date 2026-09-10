# National Weather Big Data Analytics Platform

A National Weather Big Data Analytics Platform for India. It centrally stores weather observations from #IMD/social posts, weather-news sites, public APIs, and citizen reports, then applies automated categorization, fake-report scoring, duplicate detection, and human verification.

## Architecture

```
national-weather-platform/
├── backend/              # FastAPI backend (Python)
│   ├── app/
│   │   ├── api/          # REST API routes
│   │   ├── core/         # Config, database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Business logic
│   │   ├── collectors/   # Data collectors
│   │   ├── ml/           # ML modules
│   │   └── utils/        # Utilities
│   └── alembic/          # Database migrations
├── frontend/             # React + Vite frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Page components
│       ├── services/     # API client
│       └── hooks/        # Custom hooks
├── ml_pipeline/          # ML training pipelines
├── docker/               # Docker configurations
├── scripts/              # Utility scripts
└── data/                 # Data storage
```

## Tech Stack

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy 2.0 (async) + PostgreSQL
- Alembic for migrations
- scikit-learn for ML models

**Frontend:**
- React 18 + Vite
- Tailwind CSS (dark theme)
- Leaflet for interactive maps
- Recharts for visualizations
- Axios for API communication

**Infrastructure:**
- Docker + Docker Compose
- PostgreSQL 16

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
cd national-weather-platform

# Build and start the complete application (PostgreSQL + FastAPI + React)
cd docker
docker compose up --build

# The single application will be available at:
# App and API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Set OPENWEATHER_API_KEY and TWITTER_BEARER_TOKEN when live collection is required.
# Without them, the Admin panel marks those sources as skipped; sample data remains opt-in.

# Apply database migrations (idempotent: safe on fresh and existing databases).
# ALWAYS run this before starting the app, especially on an existing database.
alembic upgrade head

# Seed the database with sample data
python ../scripts/seed_database.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend (development server)

```bash
cd frontend
npm install
npm run dev
```

The Vite development server at `http://localhost:5173` proxies every `/api` request to
the FastAPI backend at `http://localhost:8000`. In Docker, FastAPI serves the compiled
React application and API together on port `8000`.

### Database Seeding

```bash
# Seed with 250+ realistic weather events across Indian states
cd scripts
python seed_database.py
```

## Features

### Ingestion and verification workflow
- Admin-triggered collection from configured Twitter/X, web-news, and OpenWeather sources
- Explicit sample-data mode for demonstrations; sample records are not represented as live data
- Authenticated citizen reports with optional photo/video evidence and location metadata
- Central PostgreSQL event store with source, timestamp, city/state, coordinates, media references, and review status
- Rule/ML-assisted event categorization, suspicious-report scoring, and duplicate linking before human review

### Data Collection
- **Twitter/X Collector**: Monitors weather-related hashtags (#IMD, #Weather, #IndiaWeather, etc.)
- **Web Scraper**: Scrapes weather news from major Indian news sites (NDTV, The Hindu, India Today, etc.)
- **API Collector**: Fetches real-time data from OpenWeatherMap API
- **Citizen Reports**: Handles file uploads with metadata from citizens

### ML Modules
- **Fake Detector**: NLP-based fake report detection using keyword analysis, sentiment analysis, and structural features
- **Categorizer**: Classifies events into categories (rainfall, thunderstorm, flooding, heatwave, etc.)
- **Deduplicator**: Finds duplicate events using location proximity, time window, and text similarity

### Frontend Dashboard
- Interactive Leaflet map with color-coded event markers
- Real-time analytics with Recharts (bar, line, pie, radar charts)
- Event table with sorting, filtering, and pagination
- Filter panel for event type, severity, state, verification status
- Admin panel with verification workflow
- Dark theme with Tailwind CSS
- Responsive design

### Analytics
- Events by type, state, severity, and source
- Events over time with configurable granularity
- Geographic distribution heatmap
- Verification pipeline statistics
- Top cities by event count

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Weather Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather` | List events (with filters & pagination) |
| POST | `/api/weather` | Create new event |
| GET | `/api/weather/{id}` | Get event details |
| PUT | `/api/weather/{id}` | Update event (admin) |
| DELETE | `/api/weather/{id}` | Delete event (admin) |
| POST | `/api/weather/{id}/verify` | Verify/reject event (admin only) |
| POST | `/api/weather/citizen-report` | Submit a citizen report with optional photo/video evidence (authenticated) |
| GET | `/api/weather/stats/general` | Event statistics |

### Media Evidence (DB-backed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media/{id}` | Evidence metadata (authenticated) |
| GET | `/api/media/{id}/content` | Streamed image/video bytes (authenticated) |

Evidence uploaded with citizen reports is stored in PostgreSQL (`report_media` table) and
served only to authenticated users — it is never publicly accessible. Event responses
reference it as `"media": [{"id", "kind", "url"}]`. The legacy `/uploads` mount is kept
only for pre-existing filesystem files.

### Notifications & Location-Based Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List the caller's notifications |
| GET | `/api/notifications/unread-count` | Unread badge count |
| POST | `/api/notifications/{id}/read` | Mark one notification as read |
| POST | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/notifications/preferences` | Get alert preferences |
| PUT | `/api/notifications/preferences` | Save consent + location + alert radius |

Citizens can opt in with their location (lat/lng) and a radius (10–100 km). When a
HIGH/CRITICAL event is ingested with coordinates, everyone opted in within that radius
receives a notification, regardless of ingestion source (Twitter/X, web, API, citizen).

### Dashboard Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/events-by-type` | Events grouped by type |
| GET | `/api/dashboard/events-by-state` | Events grouped by state |
| GET | `/api/dashboard/events-over-time` | Events over time |
| GET | `/api/dashboard/verification-stats` | Verification statistics |
| GET | `/api/dashboard/severity-distribution` | Severity breakdown |
| GET | `/api/dashboard/top-cities` | Top cities by events |
| GET | `/api/dashboard/recent-events` | Recent events |
| GET | `/api/dashboard/source-breakdown` | Data source breakdown |

## Testing

DB-free unit tests run anywhere (including environments where the full ML stack cannot
be installed, e.g. Python 3.14):

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
python -m unittest discover tests -v
```

The same suite includes opt-in integration tests that exercise the real app + PostgreSQL
(public browsing, admin-only enforcement, DB-backed media, notification preferences).
Run them only where the database is reachable:

```bash
# PowerShell
$env:RUN_API_INTEGRATION = "1"
pytest tests/test_api_integration.py -q
```

## Deployment (Render / Vercel)

- **PostgreSQL**: use Render Postgres or Neon; put the connection string in `DATABASE_URL`.
- **Backend**: Web Service with start command
  `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
  (the Docker image does this automatically). Migrations are idempotent
  (`IF NOT EXISTS`), so upgrading an existing database preserves all current data.
- **Frontend**: Vercel stores built output directly; the Vercel build (`npm run build`)
  already runs via the framework preset.

## Sample Users

After seeding, the following users are available:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| analyst | analyst123 | Analyst |
| citizen1 | citizen123 | Citizen |
| citizen2 | citizen123 | Citizen |

Note: verification, moderation, ingestion, and event modification endpoints are
`admin`-only. Analyst accounts retain read/analytics access only.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/weather_platform

# JWT
JWT_SECRET_KEY=your-secret-key

# External APIs (optional)
OPENWEATHER_API_KEY=your-api-key
TWITTER_BEARER_TOKEN=your-token
```

## Data Collection

```bash
# Run all collectors
cd scripts
python collect_data.py
```

This will:
1. Collect tweets from Twitter/X (or use mock data if API not configured)
2. Scrape weather news from Indian news sites
3. Fetch data from OpenWeatherMap API
4. Generate mock citizen reports

## ML Model Training

```bash
cd scripts
python train_models.py
```

This trains:
- **Fake Detector**: Gradient Boosting classifier for identifying fake reports
- **Event Categorizer**: Naive Bayes classifier for weather event categorization

## License

This project is for educational and research purposes.
