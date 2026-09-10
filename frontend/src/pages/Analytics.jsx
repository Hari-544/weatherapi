import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, MapPin, RefreshCw, ShieldCheck, Layers, AlertTriangle, Fingerprint } from 'lucide-react';
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
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [granularity, setGranularity] = useState('day');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString();

      const results = await Promise.allSettled([
        api.get(`/api/dashboard/events-by-type?start_date=${start}`),
        api.get(`/api/dashboard/events-over-time?start_date=${start}&granularity=${granularity}`),
        api.get('/api/dashboard/events-by-state'),
        api.get('/api/dashboard/severity-distribution'),
        api.get('/api/dashboard/verification-stats'),
        api.get('/api/dashboard/source-breakdown'),
        api.get('/api/dashboard/recent-events?limit=5'),
        api.get('/api/dashboard/top-cities?limit=10'),
        api.get('/api/weather?per_page=100'),
        api.get('/api/dashboard/intelligence-summary'),
      ]);

      const resolve = (r) => r.status === 'fulfilled' ? r.value.data.data : [];
      setByType(resolve(results[0]));
      setOverTime(resolve(results[1]));
      setByState(resolve(results[2]));
      setSeverity(resolve(results[3]));
      setVerification(resolve(results[4]));
      setSourceBreakdown(resolve(results[5]));
      setRecentEvents(resolve(results[6]));
      setTopCities(resolve(results[7]));
      if (results[8].status === 'fulfilled') {
        setRecentEvents(results[8].value.data.data);
      }
      if (results[9].status === 'fulfilled') setIntel(results[9].value.data);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Deep insights into weather event patterns across India
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <button onClick={fetchAnalytics} className="btn-secondary inline-flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <section
        className="card border-primary-500/20"
        aria-label="AI Intelligence Insights"
        style={{ background: 'linear-gradient(to bottom right, rgba(99,102,241,0.08), transparent)' }}
      >
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-primary-400" />
          AI Intelligence Insights
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verification
            </div>
            <p className="text-2xl font-bold text-emerald-400">{(intel?.verification_rate || 0).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {intel?.verified || 0} verified of {intel?.total || 0} · avg score {intel?.avg_verification_score || 0}/100
            </p>
          </div>
          <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Corroboration
            </div>
            <p className="text-2xl font-bold text-sky-400">{(intel?.corroboration_rate || 0).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">events grouped into incidents</p>
          </div>
          <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Misinformation Risk
            </div>
            <p className="text-2xl font-bold text-rose-400">
              {intel?.detected_misinfo || 0}
              <span className="text-sm font-normal text-gray-500 ml-1">({(intel?.misinfo_rate || 0).toFixed(1)}%)</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">flagged as possible fake</p>
          </div>
          <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
              Priority Load
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {(intel?.priority?.critical || 0) + (intel?.priority?.high || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {intel?.priority?.critical || 0} critical · {intel?.priority?.high || 0} high
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventsByTypeBarChart data={byType} />
        <EventsOverTimeChart data={overTime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden p-0">
            <div className="p-4 border-b border-dark-700/30">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                Geographic Distribution
              </h3>
            </div>
            <WeatherMap events={recentEvents} height="350px" />
          </div>
        </div>
        <EventsByStatePieChart data={byState} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SeverityDistributionChart data={severity} />
        <VerificationStatsChart data={verification} />
        <SourceBreakdownChart data={sourceBreakdown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            Top Cities by Event Count
          </h3>
          <div className="space-y-2">
            {topCities.map((city, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30">
                <span className="text-xs text-gray-500 w-6 text-right">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{city.city}</p>
                  <p className="text-xs text-gray-500">{city.state}</p>
                </div>
                <div className="w-24 bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{
                      width: `${topCities.length > 0 ? (city.count / topCities[0].count) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-white w-8 text-right">{city.count}</span>
              </div>
            ))}
            {topCities.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No city data available</p>
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
              const maxCount = byType.length > 0 ? Math.max(...byType.map(b => b.count)) : 1;
              const pct = (item.count / maxCount) * 100;
              const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#d946ef'];
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 capitalize">{item.event_type?.replace('_', ' ')}</span>
                    <span className="text-sm font-semibold text-white">{item.count}</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {byType.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
