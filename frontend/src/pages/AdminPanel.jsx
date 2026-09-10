import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users, Shield, Settings, CheckCircle, XCircle, Clock,
  AlertTriangle, Database, Trash2, Eye, RefreshCw, Plus,
  Keyboard, Filter, ChevronDown, Brain, ListChecks, Loader2
} from 'lucide-react';
import EventTable from '../components/EventTable.jsx';
import { api } from '../services/api.js';

const EVENT_TYPES = [
  'rainfall', 'thunderstorm', 'flooding', 'heatwave', 'fog',
  'dust_storm', 'strong_winds', 'cyclone', 'other',
];

export default function AdminPanel() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [ingesting, setIngesting] = useState(false);
  const [ingestionMessage, setIngestionMessage] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [overrideEvent, setOverrideEvent] = useState(null);
  const [overrideType, setOverrideType] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideDone, setOverrideDone] = useState(null);

  const openOverride = (event) => {
    setOverrideEvent(event);
    setOverrideType(event.event_type || 'other');
    setOverrideReason('');
    setOverrideDone(null);
  };

  const closeOverride = () => {
    setOverrideEvent(null);
    setOverrideDone(null);
  };

  const submitOverride = async () => {
    if (!overrideEvent || !overrideReason.trim() || overrideSaving) return;
    setOverrideSaving(true);
    try {
      const res = await api.post(`/api/intelligence/events/${overrideEvent.id}/classify`, {
        event_type: overrideType,
        reason: overrideReason.trim(),
      });
      const audit = await api.get(`/api/intelligence/events/${overrideEvent.id}/audit`);
      setOverrideDone({
        summary: res.data,
        audit_entries: audit.data?.audit_entries || [],
      });
      fetchData();
    } catch (err) {
      setOverrideDone({ error: err.response?.data?.detail || 'Override failed.' });
    }
    setOverrideSaving(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.allSettled([
        api.get('/api/weather?per_page=100'),
        api.get('/api/weather/stats/general'),
      ]);

      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return events;
    return events.filter(e => e.verification_status === statusFilter);
  }, [events, statusFilter]);

  const statusCounts = useMemo(() => ({
    all: events.length,
    pending: events.filter(e => e.verification_status === 'pending').length,
    verified: events.filter(e => e.verification_status === 'verified').length,
    rejected: events.filter(e => e.verification_status === 'rejected').length,
    needs_review: events.filter(e => e.verification_status === 'needs_review').length,
  }), [events]);

  const handleVerify = async (eventId, status) => {
    try {
      await api.post(`/api/weather/${eventId}/verify`, { verification_status: status });
      fetchData();
    } catch (err) {
      console.error('Verify error:', err);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Delete Weather Event?\n\nAre you sure you want to permanently delete this weather event?\nThis action cannot be undone.')) return;
    try {
      await api.delete(`/api/weather/${eventId}`);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const bulkVerify = async (status) => {
    const targets = events.filter(e => selectedIds.has(e.id) && e.verification_status === 'pending');
    if (targets.length === 0) return;
    if (!confirm(`Verify ${targets.length} selected event(s) as ${status}?`)) return;

    for (const event of targets) {
      try {
        await api.post(`/api/weather/${event.id}/verify`, { verification_status: status });
      } catch (err) {
        console.error(`Bulk verify error for event ${event.id}:`, err);
      }
    }
    setSelectedIds(new Set());
    fetchData();
  };

  const bulkDelete = async () => {
    const targets = events.filter(e => selectedIds.has(e.id));
    if (targets.length === 0) return;
    if (!confirm(`Permanently delete ${targets.length} selected event(s)?`)) return;

    for (const event of targets) {
      try {
        await api.delete(`/api/weather/${event.id}`);
      } catch (err) {
        console.error(`Bulk delete error for event ${event.id}:`, err);
      }
    }
    setSelectedIds(new Set());
    fetchData();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        bulkVerify('verified');
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        bulkVerify('rejected');
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(s => !s);
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, filteredEvents]);

  const runIngestion = async (useSampleData = false) => {
    setIngesting(true);
    setIngestionMessage('Collecting selected weather sources...');
    try {
      const response = await api.post('/api/ingest/run', {
        sources: ['social', 'web', 'public_api'],
        use_sample_data: useSampleData,
      });
      setIngestionMessage(`Ingestion complete: ${response.data.total_stored} events stored.`);
      await fetchData();
    } catch (err) {
      setIngestionMessage(err.response?.data?.detail || 'Ingestion failed. Check configured API credentials.');
    } finally {
      setIngesting(false);
    }
  };

  const tabs = [
    { id: 'events', label: 'All Events', icon: Database, count: statusCounts.all },
    { id: 'verification', label: 'Verification Queue', icon: Shield, count: statusCounts.pending },
    { id: 'fake', label: 'Suspicious', icon: AlertTriangle, count: events.filter(e => e.is_fake || e.fake_confidence > 0.5).length },
  ];

  return (
    <div className="space-y-6" role="main" aria-label="Admin Panel">
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowShortcuts(false)}>
          <div className="card max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary-400" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Verify selected</span><kbd className="px-2 py-0.5 bg-dark-700 rounded text-gray-300">V</kbd></div>
              <div className="flex justify-between"><span className="text-gray-400">Reject selected</span><kbd className="px-2 py-0.5 bg-dark-700 rounded text-gray-300">R</kbd></div>
              <div className="flex justify-between"><span className="text-gray-400">Deselect all / Close</span><kbd className="px-2 py-0.5 bg-dark-700 rounded text-gray-300">Esc</kbd></div>
              <div className="flex justify-between"><span className="text-gray-400">Show shortcuts</span><kbd className="px-2 py-0.5 bg-dark-700 rounded text-gray-300">?</kbd></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage events, verification, and platform settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcuts(true)}
            className="btn-secondary inline-flex items-center gap-2 text-xs"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
            Shortcuts
          </button>
          <button onClick={fetchData} className="btn-secondary inline-flex items-center gap-2" disabled={loading} aria-label="Refresh data">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.total_events || events.length}</p>
              <p className="text-xs text-gray-400">Total Events</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts.pending}</p>
              <p className="text-xs text-gray-400">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts.verified}</p>
              <p className="text-xs text-gray-400">Verified</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts.rejected}</p>
              <p className="text-xs text-gray-400">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card border border-primary-500/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Data Ingestion</h2>
            <p className="mt-1 text-xs text-gray-400">Collect #IMD/social posts, weather news, and configured public API observations.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => runIngestion(false)} disabled={ingesting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${ingesting ? 'animate-spin' : ''}`} /> Run live collection
            </button>
            <button onClick={() => runIngestion(true)} disabled={ingesting} className="btn-secondary disabled:opacity-50">
              Load sample data
            </button>
          </div>
        </div>
        {ingestionMessage && (
          <p className="mt-3 text-xs text-primary-300" role="status" aria-live="polite">{ingestionMessage}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dark-700/50 pb-0">
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Event view tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-400 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="admin-status-filter" className="text-xs text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </label>
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds(new Set()); }}
            className="select text-sm py-1.5"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="card bg-primary-500/10 border border-primary-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm text-primary-300">
            {selectedIds.size} event(s) selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => bulkVerify('verified')} className="btn-primary text-sm inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Verify
            </button>
            <button onClick={() => bulkVerify('rejected')} className="btn-danger text-sm inline-flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button onClick={bulkDelete} className="btn-danger text-sm inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="btn-secondary text-sm">
              Clear
            </button>
          </div>
        </div>
      )}

      {(activeTab === 'events' || activeTab === 'verification' || activeTab === 'fake') && (
        <EventTable
          events={activeTab === 'verification' ? filteredEvents.filter(e => e.verification_status === 'pending') : activeTab === 'fake' ? filteredEvents.filter(e => e.is_fake || e.fake_confidence > 0.5) : filteredEvents}
          onVerify={handleVerify}
          onDelete={handleDelete}
          onClassify={openOverride}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
        />
      )}

      {activeTab === 'verification' && filteredEvents.filter(e => e.verification_status === 'pending').length === 0 && (
        <div className="card text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-400">All events have been reviewed!</p>
        </div>
      )}

      {overrideEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeOverride}>
          <div className="card max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="AI classification override">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-400" />
                AI Classification Override
              </h3>
              <button onClick={closeOverride} className="text-gray-400 hover:text-white" aria-label="Close">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Human decision overrides the AI classifier for{' '}
              <span className="text-gray-200">“{overrideEvent.title}”</span>. The original AI
              decision is preserved in the audit trail.
            </p>

            {!overrideDone ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="override-type" className="mb-1 block text-xs font-medium text-gray-400">
                    New event type
                  </label>
                  <select
                    id="override-type"
                    value={overrideType}
                    onChange={(e) => setOverrideType(e.target.value)}
                    className="select w-full text-sm"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="override-reason" className="mb-1 block text-xs font-medium text-gray-400">
                    Reason (required)
                  </label>
                  <textarea
                    id="override-reason"
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., IMD confirmed cyclone landfall; author is a verified meteorology account."
                    className="w-full rounded-lg border border-dark-600 bg-dark-950 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={submitOverride}
                  disabled={!overrideReason.trim() || overrideSaving}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {overrideSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Override classification
                </button>
              </div>
            ) : overrideDone.error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {overrideDone.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  Event reclassified as <strong>{overrideDone.summary.event_type}</strong> — state{' '}
                  <strong>{overrideDone.summary.state}</strong> by {overrideDone.summary.approved_by}.
                </div>
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <ListChecks className="w-3.5 h-3.5" /> Audit trail
                  </h4>
                  <ul className="space-y-1.5">
                    {overrideDone.audit_entries.map((entry, i) => (
                      <li key={i} className="rounded-lg bg-dark-800/50 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">{entry.action}</span>
                          <span className="text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="mt-0.5 text-gray-500">
                          {entry.admin_username} · {entry.original?.event_type} → {entry.new?.event_type}
                        </p>
                        <p className="mt-0.5 text-gray-400">"{entry.reason}"</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={closeOverride} className="btn-secondary w-full">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
