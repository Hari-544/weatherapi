import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Shield, Settings, CheckCircle, XCircle, Clock,
  AlertTriangle, Database, Trash2, Eye, RefreshCw, Plus
} from 'lucide-react';
import EventTable from '../components/EventTable.jsx';
import { api } from '../services/api.js';

export default function AdminPanel() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.allSettled([
        api.get('/api/weather?per_page=50'),
        api.get('/api/weather/stats/general'),
      ]);

      if (eventsRes.status === 'fulfilled') {
        const data = eventsRes.value.data.data;
        setEvents(data);
        setPendingCount(data.filter(e => e.verification_status === 'pending').length);
        setVerifiedCount(data.filter(e => e.verification_status === 'verified').length);
        setRejectedCount(data.filter(e => e.verification_status === 'rejected').length);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (eventId, status) => {
    try {
      await api.post(`/api/weather/${eventId}/verify`, { verification_status: status });
      fetchData();
    } catch (err) {
      console.error('Verify error:', err);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/api/weather/${eventId}`);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const bulkVerify = async (status) => {
    const pendingEvents = events.filter(e => e.verification_status === 'pending');
    if (pendingEvents.length === 0) return;
    if (!confirm(`Verify all ${pendingEvents.length} pending events as ${status}?`)) return;

    for (const event of pendingEvents) {
      try {
        await api.post(`/api/weather/${event.id}/verify`, { verification_status: status });
      } catch (err) {
        console.error(`Bulk verify error for event ${event.id}:`, err);
      }
    }
    fetchData();
  };

  const tabs = [
    { id: 'events', label: 'Event Management', icon: Database },
    { id: 'verification', label: 'Verification Queue', icon: Shield },
    { id: 'fake', label: 'Fake Detection', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage events, verification, and platform settings
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary inline-flex items-center gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold text-white">{stats?.pending_review || pendingCount}</p>
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
              <p className="text-2xl font-bold text-white">{stats?.verified_events || verifiedCount}</p>
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
              <p className="text-2xl font-bold text-white">{stats?.rejected_events || rejectedCount}</p>
              <p className="text-xs text-gray-400">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-dark-700/50 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'events' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
          <EventTable
            events={events}
            onVerify={handleVerify}
            loading={loading}
          />
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => bulkVerify('verified')} className="btn-primary inline-flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Verify All Pending
            </button>
            <button onClick={() => bulkVerify('rejected')} className="btn-danger inline-flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Reject All Pending
            </button>
          </div>
          <EventTable
            events={events.filter(e => e.verification_status === 'pending')}
            onVerify={handleVerify}
            loading={loading}
          />
          {events.filter(e => e.verification_status === 'pending').length === 0 && (
            <div className="card text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-400">All events have been reviewed!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fake' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Fake Detection Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-dark-700/30 rounded-lg">
                <p className="text-3xl font-bold text-red-400">{stats?.detected_fake || events.filter(e => e.is_fake).length}</p>
                <p className="text-xs text-gray-400 mt-1">Detected as Fake</p>
              </div>
              <div className="p-4 bg-dark-700/30 rounded-lg">
                <p className="text-3xl font-bold text-yellow-400">
                  {events.filter(e => e.fake_confidence > 0.5 && !e.is_fake).length}
                </p>
                <p className="text-xs text-gray-400 mt-1">High Confidence Suspicious</p>
              </div>
              <div className="p-4 bg-dark-700/30 rounded-lg">
                <p className="text-3xl font-bold text-green-400">
                  {events.filter(e => e.fake_confidence < 0.3).length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Likely Authentic</p>
              </div>
            </div>
          </div>
          <EventTable
            events={events.filter(e => e.is_fake || e.fake_confidence > 0.5)}
            onVerify={handleVerify}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
