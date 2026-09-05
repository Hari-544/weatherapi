import React from 'react';
import { Filter, X, Calendar, MapPin, AlertTriangle, Tag } from 'lucide-react';
import clsx from 'clsx';

const EVENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'rainfall', label: 'Rainfall' },
  { value: 'thunderstorm', label: 'Thunderstorm' },
  { value: 'flooding', label: 'Flooding' },
  { value: 'heatwave', label: 'Heatwave' },
  { value: 'fog', label: 'Fog' },
  { value: 'dust_storm', label: 'Dust Storm' },
  { value: 'strong_winds', label: 'Strong Winds' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_LEVELS = [
  { value: '', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const VERIFICATION_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_review', label: 'Needs Review' },
];

const INDIAN_STATES = [
  '', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Chandigarh', 'Jammu and Kashmir', 'Ladakh',
];

const SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'web', label: 'Web Scraping' },
  { value: 'api', label: 'Public API' },
  { value: 'citizen_report', label: 'Citizen Report' },
  { value: 'other', label: 'Other' },
];

export default function FilterPanel({ filters, onFilterChange, onReset }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFilters = Object.entries(filters).filter(
    ([key, val]) => val !== '' && val !== null && val !== undefined
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-white">Filters</h3>
          {activeFilters.length > 0 && (
            <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/20">
              {activeFilters.length} active
            </span>
          )}
        </div>
        {activeFilters.length > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Event Type
          </label>
          <select
            value={filters.event_type || ''}
            onChange={(e) => handleChange('event_type', e.target.value)}
            className="select text-sm"
          >
            {EVENT_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Severity
          </label>
          <select
            value={filters.severity || ''}
            onChange={(e) => handleChange('severity', e.target.value)}
            className="select text-sm"
          >
            {SEVERITY_LEVELS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> State
          </label>
          <select
            value={filters.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            className="select text-sm"
          >
            <option value="">All States</option>
            {INDIAN_STATES.filter(Boolean).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1">Verification</label>
          <select
            value={filters.verification_status || ''}
            onChange={(e) => handleChange('verification_status', e.target.value)}
            className="select text-sm"
          >
            {VERIFICATION_STATUSES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1">Source</label>
          <select
            value={filters.source || ''}
            onChange={(e) => handleChange('source', e.target.value)}
            className="select text-sm"
          >
            {SOURCES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Start Date
          </label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="input text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> End Date
          </label>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
            className="input text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1">Search</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search events..."
            className="input text-sm"
          />
        </div>
      </div>
    </div>
  );
}
