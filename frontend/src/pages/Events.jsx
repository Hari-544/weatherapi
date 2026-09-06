import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Plus, Send } from 'lucide-react';
import EventTable from '../components/EventTable.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import { api } from '../services/api.js';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    event_type: '',
    severity: '',
    state: '',
    city: '',
    verification_status: '',
    source: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportStatus, setReportStatus] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('per_page', pagination.per_page);

      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });

      const response = await api.get(`/api/weather?${params.toString()}`);
      setEvents(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    setLoading(false);
  }, [pagination.page, pagination.per_page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleFilterReset = () => {
    setFilters({
      event_type: '', severity: '', state: '', city: '',
      verification_status: '', source: '', start_date: '', end_date: '', search: '',
    });
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleVerify = async (eventId, status) => {
    try {
      await api.post(`/api/weather/${eventId}/verify`, { verification_status: status });
      fetchEvents();
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(p => ({ ...p, page: newPage }));
  };

  const handleExport = () => {
    const csvHeaders = ['ID', 'Title', 'Type', 'Severity', 'City', 'State', 'Source', 'Status', 'Reported At'];
    const rows = events.map(e => [
      e.id, `"${e.title}"`, e.event_type, e.severity, e.city || '', e.state || '',
      e.source, e.verification_status, e.reported_at,
    ]);
    const csvContent = [csvHeaders.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_events_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitCitizenReport = async (event) => {
    event.preventDefault();
    setSubmittingReport(true);
    setReportStatus('');
    try {
      const formData = new FormData(event.currentTarget);
      await api.post('/api/weather/citizen-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      event.currentTarget.reset();
      setReportStatus('Report submitted. It is now pending AI and administrator verification.');
      fetchEvents();
    } catch (err) {
      setReportStatus(err.response?.data?.detail || 'Unable to submit the report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Weather Events</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse and manage all collected weather events
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReportForm(value => !value)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Report weather event
          </button>
          <button onClick={handleExport} className="btn-secondary inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {showReportForm && (
        <form onSubmit={submitCitizenReport} className="card grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-white">Citizen weather report</h2>
          </div>
          <input required name="title" minLength="5" className="input" placeholder="What happened?" />
          <input name="city" className="input" placeholder="City" />
          <input name="state" className="input" placeholder="State" />
          <input name="files" type="file" multiple accept="image/*,video/*" className="input" />
          <textarea required name="description" minLength="10" className="input min-h-24 md:col-span-2" placeholder="Describe the weather event, impact, and any safety concern." />
          <div className="md:col-span-2 flex items-center gap-3">
            <button disabled={submittingReport} className="btn-primary disabled:opacity-50">
              {submittingReport ? 'Submitting…' : 'Submit for verification'}
            </button>
            {reportStatus && <span className="text-xs text-primary-300">{reportStatus}</span>}
          </div>
        </form>
      )}

      <FilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={handleFilterReset} />

      <EventTable events={events} onVerify={handleVerify} loading={loading} />

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary p-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => {
              let pageNum;
              if (pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="btn-secondary p-2 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
