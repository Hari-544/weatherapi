import React, { useState } from 'react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { ChevronUp, ChevronDown, ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const SEVERITY_STYLES = {
  low: 'badge-low',
  moderate: 'badge-moderate',
  high: 'badge-high',
  critical: 'badge-critical',
};

const STATUS_ICONS = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
  needs_review: AlertTriangle,
};

const STATUS_STYLES = {
  pending: 'badge-pending',
  verified: 'badge-verified',
  rejected: 'badge-rejected',
  needs_review: 'badge-moderate',
};

const COLUMNS = [
  { key: 'title', label: 'Event', sortable: true, width: 'w-[30%]' },
  { key: 'event_type', label: 'Type', sortable: true, width: 'w-[12%]' },
  { key: 'severity', label: 'Severity', sortable: true, width: 'w-[10%]' },
  { key: 'city', label: 'City', sortable: true, width: 'w-[12%]' },
  { key: 'state', label: 'State', sortable: true, width: 'w-[12%]' },
  { key: 'source', label: 'Source', sortable: true, width: 'w-[10%]' },
  { key: 'verification_status', label: 'Status', sortable: true, width: 'w-[12%]' },
  { key: 'reported_at', label: 'Reported', sortable: true, width: 'w-[12%]' },
];

export default function EventTable({ events = [], onVerify, loading }) {
  const [sortKey, setSortKey] = useState('reported_at');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedRow, setExpandedRow] = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...events].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-dark-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-gray-200 select-none',
                    col.width
                  )}
                >
                  {col.label}
                  {renderSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {sorted.map((event) => {
              const StatusIcon = STATUS_ICONS[event.verification_status] || Clock;
              return (
                <React.Fragment key={event.id}>
                  <tr
                    onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}
                    className="hover:bg-dark-700/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-white truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{event.description?.slice(0, 80)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-300">{event.event_type?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', SEVERITY_STYLES[event.severity])}>
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{event.city || '-'}</td>
                    <td className="px-4 py-3 text-gray-300">{event.state || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-400">{event.source?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge inline-flex items-center gap-1', STATUS_STYLES[event.verification_status])}>
                        <StatusIcon className="w-3 h-3" />
                        {event.verification_status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {dayjs(event.reported_at).format('DD MMM, HH:mm')}
                    </td>
                  </tr>
                  {expandedRow === event.id && (
                    <tr className="bg-dark-800/40">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</h4>
                            <p className="text-sm text-gray-300">{event.description}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Details</h4>
                            <dl className="text-sm space-y-1">
                              <div className="flex gap-2">
                                <dt className="text-gray-500">Coordinates:</dt>
                                <dd className="text-gray-300">{event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)}</dd>
                              </div>
                              <div className="flex gap-2">
                                <dt className="text-gray-500">Fake Score:</dt>
                                <dd className="text-gray-300">{(event.fake_confidence * 100).toFixed(1)}%</dd>
                              </div>
                              <div className="flex gap-2">
                                <dt className="text-gray-500">Category Conf:</dt>
                                <dd className="text-gray-300">{(event.category_confidence * 100).toFixed(1)}%</dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Actions</h4>
                            <div className="flex gap-2 flex-wrap">
                              {event.source_url && (
                                <a
                                  href={event.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary text-xs inline-flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" /> Source
                                </a>
                              )}
                              {onVerify && event.verification_status === 'pending' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onVerify(event.id, 'verified'); }}
                                    className="btn-primary text-xs inline-flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Verify
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onVerify(event.id, 'rejected'); }}
                                    className="btn-danger text-xs inline-flex items-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" /> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-500">No events found</div>
      )}
    </div>
  );
}
