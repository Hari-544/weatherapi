import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import EventMap from '../components/EventMap'
import { SeverityBadge, StatusBadge, SourceBadge } from '../components/Badges'
import { weatherApi, dashboardApi } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [mapEvents, setMapEvents] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([weatherApi.stats(), dashboardApi.recentEvents(100)])
      .then(([s, r]) => {
        setStats(s)
        setRecent(r.data)
        setMapEvents(r.data)
      })
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">
          Real-time overview of weather events, verification and AI-based flagging
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon="🌦️" label="Total Events" value={stats.total_events} accent="brand" />
          <StatCard icon="📅" label="Today" value={stats.today_events} accent="blue" />
          <StatCard icon="⏳" label="Pending Review" value={stats.pending_review} accent="amber" />
          <StatCard icon="✅" label="Verified" value={stats.verified_events} accent="green" />
          <StatCard icon="🚫" label="Detected Fake" value={stats.detected_fake} accent="red" />
          <StatCard
            icon="📊"
            label="Verification Rate"
            value={`${stats.verification_rate}%`}
            accent="brand"
            sub={`${stats.duplicates} duplicate`}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-3">Live Weather Event Map</h2>
            <EventMap events={mapEvents} onSelect={(e) => navigate(`/events`)} />
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Moderate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500" /> Critical</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-dashed border-slate-500 rounded-full" /> Possible fake</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-3">Recent Events</h2>
          {recent.length === 0 ? (
            <p className="text-slate-400 text-sm">No recent events</p>
          ) : (
            <ul className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
              {recent.map((e) => (
                <li key={e.id} className="border border-slate-100 rounded-lg p-3 space-y-1">
                  <div className="text-sm font-medium text-slate-800 line-clamp-2">{e.title}</div>
                  <div className="text-xs text-slate-500">
                    {e.city}, {e.state}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SeverityBadge value={e.severity} />
                    <StatusBadge value={e.verification_status} />
                    <SourceBadge value={e.source} />
                  </div>
                  {e.is_fake && (
                    <div className="text-xs font-semibold text-rose-600">⚠ Flagged as fake</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
