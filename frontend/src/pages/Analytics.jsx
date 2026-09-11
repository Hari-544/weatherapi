import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  RefreshCw,
} from 'lucide-react';

import WeatherMap from '../components/WeatherMap.jsx';

import {
  EventsByTypeBarChart,
  EventsOverTimeChart,
  EventsByStatePieChart,
  SeverityDistributionChart,
  VerificationStatsChart,
  SourceBreakdownChart,
} from '../components/Charts.jsx';

import { api } from '../services/api.js';

export default function Analytics() {
  const [byType, setByType] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [byState, setByState] = useState([]);
  const [severity, setSeverity] = useState([]);
  const [verification, setVerification] = useState([]);
  const [sourceBreakdown, setSourceBreakdown] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [topCities, setTopCities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [granularity, setGranularity] = useState('day');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const days = parseInt(timeRange, 10);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const start = startDate.toISOString();

      const results = await Promise.allSettled([
        api.get(`/api/dashboard/events-by-type?start_date=${start}`),
        api.get(
          `/api/dashboard/events-over-time?start_date=${start}&granularity=${granularity}`
        ),
        api.get('/api/dashboard/events-by-state'),
        api.get('/api/dashboard/severity-distribution'),
        api.get('/api/dashboard/verification-stats'),
        api.get('/api/dashboard/source-breakdown'),
        api.get('/api/dashboard/recent-events?limit=5'),
        api.get('/api/dashboard/top-cities?limit=10'),
        api.get('/api/weather?per_page=100'),
      ]);

      const resolve = (result) =>
        result.status === 'fulfilled'
          ? result.value.data.data || []
          : [];

      setByType(resolve(results[0]));
      setOverTime(resolve(results[1]));
      setByState(resolve(results[2]));
      setSeverity(resolve(results[3]));
      setVerification(resolve(results[4]));
      setSourceBreakdown(resolve(results[5]));
      setRecentEvents(resolve(results[6]));
      setTopCities(resolve(results[7]));

      if (results[8].status === 'fulfilled') {
        setRecentEvents(results[8].value.data.data || []);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }

    setLoading(false);
  }, [timeRange, granularity]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Analytics
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Weather event patterns and statistics across India
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="select text-sm w-40"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            className="select text-sm w-32"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>

          <button
            onClick={fetchAnalytics}
            className="btn-secondary inline-flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Event Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventsByTypeBarChart data={byType} />
        <EventsOverTimeChart data={overTime} />
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden p-0">
            <div className="p-4 border-b border-dark-700/30">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                Geographic Distribution
              </h3>
            </div>

            <WeatherMap
              events={recentEvents}
              height="350px"
            />
          </div>
        </div>

        <EventsByStatePieChart data={byState} />
      </div>

      {/* Core Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SeverityDistributionChart data={severity} />
        <VerificationStatsChart data={verification} />
        <SourceBreakdownChart data={sourceBreakdown} />
      </div>

      {/* Top Cities + Event Type Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            Top Cities by Event Count
          </h3>

          <div className="space-y-2">
            {topCities.map((city, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30"
              >
                <span className="text-xs text-gray-500 w-6 text-right">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {city.city}
                  </p>

                  <p className="text-xs text-gray-500">
                    {city.state}
                  </p>
                </div>

                <div className="w-24 bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{
                      width: `${
                        topCities.length > 0
                          ? (city.count / topCities[0].count) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <span className="text-sm font-semibold text-white w-8 text-right">
                  {city.count}
                </span>
              </div>
            ))}

            {topCities.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No city data available
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            Event Type Comparison
          </h3>

          <div className="space-y-3">
            {byType.map((item, idx) => {
              const maxCount =
                byType.length > 0
                  ? Math.max(...byType.map((b) => b.count))
                  : 1;

              const pct = (item.count / maxCount) * 100;

              const colors = [
                '#3b82f6',
                '#8b5cf6',
                '#06b6d4',
                '#ef4444',
                '#f59e0b',
                '#10b981',
                '#ec4899',
                '#6366f1',
                '#d946ef',
              ];

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 capitalize">
                      {item.event_type?.replace('_', ' ')}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {item.count}
                    </span>
                  </div>

                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          colors[idx % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {byType.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}