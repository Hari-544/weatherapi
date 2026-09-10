import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Download, Plus, LogIn, Send,
  MapPin, FileText, Camera, X, CheckCircle2, AlertTriangle,
  Loader2, Image, FileVideo,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventTable from '../components/EventTable.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm';

function parse422Detail(detail) {
  if (!detail) return 'Please check the report details and try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .filter((d) => d && d.msg)
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((l) => typeof l === 'string').join(' ') : '';
        const label = field ? field.charAt(0).toUpperCase() + field.slice(1) + ': ' : '';
        return label + d.msg;
      });
    return msgs.length ? msgs.join('; ') : 'Please check the report details and try again.';
  }
  return 'Please check the report details and try again.';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function CitizenReportForm({ onSuccess }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const formRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Unsupported file type. Please upload JPG, PNG, WEBP, GIF, MP4 or WEBM.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File is too large. Maximum size is 10 MB.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    if (selectedFile) {
      formData.set('files', selectedFile);
    } else {
      formData.delete('files');
    }

    try {
      const response = await api.post('/api/weather/citizen-report', formData);
      setSuccess(true);
      removeFile();
      formRef.current?.reset();
      onSuccess?.();
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (status === 413) {
        setError('The selected file is too large.');
      } else if (status === 415) {
        setError(detail || 'Unsupported file type. Please upload JPG, PNG, WEBP, GIF, MP4 or WEBM.');
      } else if (status === 422) {
        setError(parse422Detail(detail));
      } else if (status >= 500) {
        setError('The weather service is temporarily unavailable. Please try again.');
      } else if (!err.response) {
        setError('Unable to connect to the weather service. Please try again.');
      } else {
        setError(detail || 'Unable to submit the report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (success) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 className="h-7 w-7 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Report submitted successfully</h3>
          <p className="text-sm text-gray-400 max-w-md mb-4">
            Your weather report has been received and submitted for verification.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-medium text-yellow-400">Pending verification</span>
          </div>
          <button
            onClick={() => { setSuccess(false); }}
            className="mt-6 btn-primary"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/15">
            <Send className="h-4 w-4 text-primary-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Citizen Weather Report</h2>
            <p className="text-xs text-gray-500">Help the platform understand weather conditions in your area</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3" role="alert">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="report-city" className="block text-xs font-medium text-gray-400 mb-1.5">
                <MapPin className="inline h-3 w-3 mr-1" />
                City
              </label>
              <input
                id="report-city"
                name="city"
                className="input"
                placeholder="e.g. Bhimavaram"
              />
            </div>
            <div>
              <label htmlFor="report-state" className="block text-xs font-medium text-gray-400 mb-1.5">
                <MapPin className="inline h-3 w-3 mr-1" />
                State
              </label>
              <input
                id="report-state"
                name="state"
                className="input"
                placeholder="e.g. Andhra Pradesh"
              />
            </div>
          </div>

          <div>
            <label htmlFor="report-title" className="block text-xs font-medium text-gray-400 mb-1.5">
              <FileText className="inline h-3 w-3 mr-1" />
              Report title <span className="text-red-400">*</span>
            </label>
            <input
              id="report-title"
              name="title"
              required
              minLength={5}
              maxLength={500}
              className="input"
              placeholder="e.g. Heavy rainfall in Bhimavaram"
            />
          </div>

          <div>
            <label htmlFor="report-description" className="block text-xs font-medium text-gray-400 mb-1.5">
              <FileText className="inline h-3 w-3 mr-1" />
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="report-description"
              name="description"
              required
              minLength={10}
              className="input min-h-[100px]"
              placeholder="Describe the weather condition you observed, including impact and any safety concerns..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              <Camera className="inline h-3 w-3 mr-1" />
              Media evidence <span className="text-gray-600">(optional)</span>
            </label>

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-dark-600 bg-dark-900/40 px-6 py-8 text-center transition-colors hover:border-primary-500/40 hover:bg-dark-800/60 cursor-pointer"
              >
                <Camera className="h-8 w-8 text-gray-600 mb-3" />
                <p className="text-sm text-gray-300 font-medium">Upload visual evidence</p>
                <p className="text-xs text-gray-500 mt-1">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-600 mt-2">JPG, PNG, WEBP, GIF, MP4, WEBM — Max 10 MB</p>
              </button>
            ) : (
              <div className="flex items-center gap-4 rounded-lg border border-dark-600 bg-dark-900/40 px-4 py-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected evidence"
                    className="h-16 w-16 rounded-lg object-cover border border-dark-600"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-dark-700">
                    <FileVideo className="h-7 w-7 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ready to upload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-dark-700 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {fileError && (
              <p className="mt-2 text-xs text-red-400">{fileError}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              name="files"
              accept={ALLOWED_EXTENSIONS}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-dark-700/50">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    event_type: '', severity: '', state: '', city: '',
    verification_status: '', source: '', start_date: '', end_date: '', search: '',
  });
  const [showReportForm, setShowReportForm] = useState(false);

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

  const handleReportClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?return=${encodeURIComponent('/events')}`);
      return;
    }
    setShowReportForm((v) => !v);
  };

  const handleViewIntelligence = (eventId) => {
    navigate(`/events/${eventId}/intelligence`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Weather Events</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse and manage all collected weather events
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReportClick} className="btn-primary inline-flex items-center gap-2">
            {isAuthenticated ? <Plus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isAuthenticated ? 'Report weather event' : 'Sign in to report'}
          </button>
          <button onClick={handleExport} className="btn-secondary inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {showReportForm && (
        <CitizenReportForm onSuccess={fetchEvents} />
      )}

      <FilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={handleFilterReset} />

      <EventTable
          events={events}
          onVerify={isAdmin ? handleVerify : undefined}
          onViewIntelligence={handleViewIntelligence}
          loading={loading}
        />

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