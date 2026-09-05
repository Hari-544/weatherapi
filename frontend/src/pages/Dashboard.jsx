import React, { useEffect, useState, useCallback } from 'react';
import {
  CloudRain, CloudLightning, Zap, AlertTriangle, MapPin,
  Clock, TrendingUp, Eye, RefreshCw, Activity
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [byType, setByType] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [byState, setByState] = useState([]);
  const [severity, setSeverity] = useState([]);
  const [verification, setVerification] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes, typeRes, timeRes, stateRes, sevRes, verRes] = await Promise.allSettled([
        api.get('/api/weather/stats/general'),
        api.get('/api/weather?per_page=20'),
        api.get('/api/dashboard/events-by-type'),
        api.get('/api/dashboard/events-over-time?granularity=day'),
        api.get('/api/dashboard/events-by-state'),
        api.get('/api/dashboard/severity-distribution'),
        api.get('/api/dashboard/verification-stats'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data.data);
      if (typeRes.status === 'fulfilled') setByType(typeRes.value.data.data);
      if (timeRes.status === 'fulfilled') setOverTime(timeRes.value.data.data);
      if (stateRes.status === 'fulfilled') setByState(stateRes.value.data.data);
      if (sevRes.status === 'fulfilled') setSeverity(sevRes.value.data.data);
      if (verRes.status === 'fulfilled') setVerification(verRes.value.data.data);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time weather event monitoring across India
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button onClick={handleRefresh} className="btn-secondary inline-flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Events"
          value={stats?.total_events || 0}
          subtitle="All recorded weather events"
          icon={Activity}
          variant="primary"
          trend="up"
          trendValue="+12.5%"
        />
        <StatsCard
          title="Today's Events"
          value={stats?.today_events || 0}
          subtitle="Reported in the last 24 hours"
          icon={Zap}
          variant="info"
          trend="up"
          trendValue="+5 today"
        />
        <StatsCard
          title="Pending Review"
          value={stats?.pending_review || 0}
          subtitle="Awaiting verification"
          icon={Eye}
          variant="warning"
          trend="neutral"
          trendValue="No change"
        />
        <StatsCard
          title="Detection Accuracy"
          value={`${(stats?.verification_rate || 0).toFixed(1)}%`}
          subtitle="Events verified"
          icon={AlertTriangle}
          variant="success"
          trend="up"
          trendValue="+2.3%"
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-dark-700/30">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-400" />
            Live Event Map
          </h3>
        </div>
        <WeatherMap events={events} height="400px" />
      </div>

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
          <h3 className="text-sm font-semibold text-white mb-4">Quick Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
              <span className="text-sm text-gray-400">Detected as Fake</span>
              <span className="text-sm font-semibold text-red-400">{stats?.detected_fake || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
              <span className="text-sm text-gray-400">Verified Events</span>
              <span className="text-sm font-semibold text-green-400">{stats?.verified_events || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
              <span className="text-sm text-gray-400">Total Events</span>
              <span className="text-sm font-semibold text-primary-400">{stats?.total_events || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
              <span className="text-sm text-gray-400">Pending Review</span>
              <span className="text-sm font-semibold text-yellow-400">{stats?.pending_review || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Recent Events</h3>
        <EventTable events={events.slice(0, 10)} loading={loading} />
      </div>
    </div>
  );
}
