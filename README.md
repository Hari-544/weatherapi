# National Weather Big Data Analytics Platform

A comprehensive real-time weather event tracking, verification, and analytics platform for India. This platform collects weather data from multiple sources including Twitter/X, news websites, public APIs (IMD, OpenWeather), and citizen reports, then applies ML-based analysis for fake detection, event categorization, and deduplication.

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
- Celery + Redis for async tasks
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
- Redis 7
- Elasticsearch 8

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
cd national-weather-platform

# Start all services
cd docker
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
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
# Edit .env with your database credentials and API keys

# Seed the database with sample data
python ../scripts/seed_database.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Seeding

```bash
# Seed with 250+ realistic weather events across Indian states
cd scripts
python seed_database.py
```

## Features

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
| POST | `/api/weather/{id}/verify` | Verify/reject event |
| GET | `/api/weather/stats/general` | Event statistics |

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

## Sample Users

After seeding, the following users are available:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| analyst | analyst123 | Analyst |
| citizen1 | citizen123 | Citizen |
| citizen2 | citizen123 | Citizen |

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
