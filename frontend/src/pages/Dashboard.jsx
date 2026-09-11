import React, { useEffect, useState, useCallback } from 'react';
import {
  CloudRain,
  CloudLightning,
  Zap,
  AlertTriangle,
  MapPin,
  Clock,
  TrendingUp,
  Eye,
  RefreshCw,
  Activity,
  Plus,
  Database,
  Twitter,
  Globe,
  Users,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import StatsCard from '../components/StatsCard.jsx';
import WeatherMap from '../components/WeatherMap.jsx';
import EventTable from '../components/EventTable.jsx';

import {
  EventsByTypeBarChart,
  EventsOverTimeChart,
  EventsByStatePieChart,
  SeverityDistributionChart,
  VerificationStatsChart,
} from '../components/Charts.jsx';

import { api } from '../services/api.js';
import { useNavigate } from 'react-router-dom';

const SOURCE_ICONS = {
  twitter: Twitter,
  web: Globe,
  api: Database,
  citizen_report: Users,
  other: Globe,
};

const SOURCE_COLORS = {
  twitter: 'text-cyan-400 bg-cyan-500/20',
  web: 'text-blue-400 bg-blue-500/20',
  api: 'text-green-400 bg-green-500/20',
  citizen_report: 'text-purple-400 bg-purple-500/20',
  other: 'text-gray-400 bg-gray-500/20',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [byType, setByType] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [byState, setByState] = useState([]);
  const [severity, setSeverity] = useState([]);
  const [verification, setVerification] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [sourceBreakdown, setSourceBreakdown] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        statsRes,
        eventsRes,
        typeRes,
        timeRes,
        stateRes,
        sevRes,
        verRes,
      ] = await Promise.allSettled([
        api.get('/api/weather/stats/general'),
        api.get('/api/weather?per_page=20'),
        api.get('/api/dashboard/events-by-type'),
        api.get('/api/dashboard/events-over-time?granularity=day'),
        api.get('/api/dashboard/events-by-state'),
        api.get('/api/dashboard/severity-distribution'),
        api.get('/api/dashboard/verification-stats'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (eventsRes.status === 'fulfilled') {
        const eventData = eventsRes.value.data.data || [];

        setEvents(eventData);

        const sourceCounts = {};

        eventData.forEach((event) => {
          const src = event.source || 'other';
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });

        setSourceBreakdown(
          Object.entries(sourceCounts).map(([name, count]) => ({
            name,
            count,
          }))
        );
      }

      if (typeRes.status === 'fulfilled') {
        setByType(typeRes.value.data.data || []);
      }

      if (timeRes.status === 'fulfilled') {
        setOverTime(timeRes.value.data.data || []);
      }

      if (stateRes.status === 'fulfilled') {
        setByState(stateRes.value.data.data || []);
      }

      if (sevRes.status === 'fulfilled') {
        setSeverity(sevRes.value.data.data || []);
      }

      if (verRes.status === 'fulfilled') {
        setVerification(verRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }

    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => fetchData();

  return (
    <div className="space-y-6" role="main" aria-label="Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Real-time weather event monitoring across India
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs text-gray-500 flex items-center gap-1"
            aria-live="polite"
          >
            <Clock className="w-3 h-3" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>

          <button
            onClick={handleRefresh}
            className="btn-secondary inline-flex items-center gap-2"
            disabled={loading}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={stats?.total_events || 0}
          subtitle="All recorded weather events"
          icon={Activity}
          variant="primary"
        />

        <StatsCard
          title="Today's Events"
          value={stats?.today_events || 0}
          subtitle="Reported in the last 24 hours"
          icon={Zap}
          variant="info"
        />

        <StatsCard
          title="Pending Review"
          value={stats?.pending_review || 0}
          subtitle="Awaiting verification"
          icon={Eye}
          variant="warning"
        />

        <StatsCard
          title="Detection Accuracy"
          value={`${(stats?.verification_rate || 0).toFixed(1)}%`}
          subtitle="Events verified"
          icon={AlertTriangle}
          variant="success"
        />
      </div>

      {/* Live Map + Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card overflow-hidden p-0 lg:col-span-2">
          <div className="p-4 border-b border-dark-700/30">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-400" />
              Live Event Map
            </h3>
          </div>

          <WeatherMap events={events} height="400px" />
        </div>

        <div className="space-y-4">
          {/* Source Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">
              Source Breakdown
            </h3>

            <div className="space-y-3">
              {sourceBreakdown.map(({ name, count }) => {
                const Icon = SOURCE_ICONS[name] || Globe;
                const colorClass =
                  SOURCE_COLORS[name] || SOURCE_COLORS.other;

                const total = events.length || 1;
                const percentage = ((count / total) * 100).toFixed(1);

                return (
                  <div
                    key={name}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300 capitalize">
                          {name.replace('_', ' ')}
                        </span>

                        <span className="text-xs text-gray-500">
                          {count} ({percentage}%)
                        </span>
                      </div>

                      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {sourceBreakdown.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  No source data available
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/events')}
                className="w-full flex items-center justify-between p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-lg transition-colors text-left"
                aria-label="Report new weather event"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-gray-300">
                    Report Event
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-between p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-lg transition-colors text-left"
                aria-label="Open admin panel"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    Admin Panel
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center justify-between p-3 bg-dark-700/30 hover:bg-dark-700/50 rounded-lg transition-colors text-left"
                aria-label="View analytics"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">
                    Analytics
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventsByTypeBarChart data={byType} />
        <SeverityDistributionChart data={severity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventsOverTimeChart data={overTime} />
        <EventsByStatePieChart data={byState} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VerificationStatsChart data={verification} />

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
            Verification Status
          </h3>

          <p className="text-sm text-gray-400">
            Review and verification status of collected weather events.
          </p>

          <div className="mt-4">
            <button
              onClick={() => navigate('/admin')}
              className="btn-secondary inline-flex items-center gap-2"
            >
              Open Verification Queue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <section aria-label="Recent Events">
        <h3 className="text-sm font-semibold text-white mb-3">
          Recent Events
        </h3>

        <EventTable
          events={events.slice(0, 10)}
          loading={loading}
        />
      </section>
    </div>
  );
}