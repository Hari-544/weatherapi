import { useEffect, useState, useCallback } from 'react'
import { weatherApi } from '../services/api'
import { SeverityBadge, StatusBadge, SourceBadge } from '../components/Badges'

const EVENT_TYPES = [
  'rainfall', 'thunderstorm', 'flooding', 'heatwave', 'fog',
  'dust_storm', 'strong_winds', 'cyclone', 'other',
]
const SEVERITIES = ['low', 'moderate', 'high', 'critical']
const STATUSES = ['pending', 'verified', 'rejected', 'needs_review']
const SOURCES = ['social', 'web', 'api', 'citizen']
const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Patna', 'Guwahati', 'Kochi',
  'Indore', 'Nagpur', 'Thiruvananthapuram', 'Visakhapatnam', 'Varanasi',
  'Amritsar', 'Bhubaneswar', 'Chandigarh', 'Shimla', 'Dehradun', 'Raipur',
]

export default function Events() {
  const [data, setData] = useState({ data: [], pagination: { total: 0 } })
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportResult, setReportResult] = useState('')
  const [selected, setSelected] = useState(null)

  const perPage = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await weatherApi.list({ ...filters, page, per_page: perPage })
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    load()
  }, [load])

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters({})
    setPage(1)
  }

  const submitReport = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = {
      title: fd.get('title'),
      description: fd.get('description'),
      event_type: fd.get('event_type'),
      city: fd.get('city'),
      state: fd.get('state'),
    }
    try {
      await weatherApi.create(payload)
      setReportResult('Your report was submitted successfully.')
      e.target.reset()
      load()
    } catch (err) {
      setReportResult(`Error: ${err.message}`)
    }
  }

  const hasFilters = Object.values(filters).some((v) => v)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weather Events</h1>
          <p className="text-slate-500 text-sm">Search and filter events by type, location, and status</p>
        </div>
        <button
          onClick={() => setShowReport((s) => !s)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {showReport ? 'Close' : '+ Report an Event'}
        </button>
      </div>

      {showReport && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Report a Weather Event</h2>
          <form onSubmit={submitReport} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input name="title" required placeholder="e.g. Heavy rainfall in Mumbai" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea name="description" required rows={2} placeholder="Describe what you observed..." className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
              <select name="event_type" className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input name="city" list="city-list" placeholder="Mumbai" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              <datalist id="city-list">
                {CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input name="state" placeholder="Maharashtra" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm">Submit Report</button>
            </div>
            {reportResult && (
              <div className={`md:col-span-2 text-sm rounded-lg px-4 py-3 ${reportResult.startsWith('Error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {reportResult}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={filters.event_type || ''}
            onChange={(e) => updateFilter('event_type', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All types</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <select
            value={filters.severity || ''}
            onChange={(e) => updateFilter('severity', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.verification_status || ''}
            onChange={(e) => updateFilter('verification_status', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select
            value={filters.source || ''}
            onChange={(e) => updateFilter('source', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            value={filters.city || ''}
            onChange={(e) => updateFilter('city', e.target.value)}
            placeholder="City"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search text"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filters.is_fake === 'true'}
              onChange={(e) => updateFilter('is_fake', e.target.checked ? 'true' : '')}
            />
            Show only flagged fake
          </label>
          {hasFilters && (
            <button onClick={resetFilters} className="text-sm text-brand-600 hover:underline">Reset filters</button>
          )}
          <span className="ml-auto text-sm text-slate-500">
            {data.pagination.total} events
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="font-medium text-slate-800 line-clamp-1">{e.title}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{e.description}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.city && `${e.city}, `}{e.state}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{e.event_type}</td>
                  <td className="px-4 py-3"><SeverityBadge value={e.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge value={e.verification_status} /></td>
                  <td className="px-4 py-3"><SourceBadge value={e.source} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(e.reported_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No events match the current filters</td></tr>
              )}
            </tbody>
          </table>
          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page} of {data.pagination.total_pages}</span>
              <button
                disabled={page >= data.pagination.total_pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function EventDetail({ event, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold text-lg text-slate-900">{event.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-slate-600">{event.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge value={event.severity} />
          <StatusBadge value={event.verification_status} />
          <SourceBadge value={event.source} />
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{event.event_type}</span>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <div>📍 {event.city}, {event.state}</div>
          {typeof event.latitude === 'number' && (
            <div className="text-xs text-slate-400">Lat {event.latitude.toFixed(4)}, Lng {event.longitude.toFixed(4)}</div>
          )}
          <div>🕒 {new Date(event.reported_at).toLocaleString()}</div>
        </div>
        {event.is_fake && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
            <div className="font-semibold">⚠ Flagged as potentially fake</div>
            <div className="text-xs mt-1">Confidence: {(event.fake_confidence * 100).toFixed(1)}%</div>
          </div>
        )}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="text-xs text-slate-500">
            <div className="font-medium mb-1">Source metadata</div>
            <pre className="bg-slate-50 rounded-lg p-3 overflow-x-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
          </div>
        )}
        <button onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 rounded-lg py-2 text-sm font-medium">Close</button>
      </div>
    </div>
  )
}