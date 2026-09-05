import { useEffect, useState, useCallback } from 'react'
import { weatherApi, ingestApi } from '../services/api'
import { SeverityBadge, StatusBadge, SourceBadge } from '../components/Badges'

export default function Admin() {
  const [events, setEvents] = useState({ data: [], pagination: { total: 0 } })
  const [filter, setFilter] = useState({ verification_status: 'pending' })
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [ingestMsg, setIngestMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await weatherApi.list({ ...filter, per_page: 50 })
      setEvents(res)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const verify = async (id, status) => {
    try {
      await weatherApi.verify(id, status)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this event?')) return
    await weatherApi.remove(id)
    load()
  }

  const ingest = async (kind) => {
    setIngesting(true)
    setIngestMsg('')
    try {
      const res =
        kind === 'social' ? await ingestApi.simulateSocial(15) : await ingestApi.ingestApi(10)
      setIngestMsg(res.message)
      load()
    } catch (e) {
      setIngestMsg(`Error: ${e.message}`)
    } finally {
      setIngesting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 text-sm">Verify events, manage data and trigger live ingestion</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Status:</span>
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'needs_review', label: 'Needs Review' },
            { key: 'verified', label: 'Verified' },
            { key: 'rejected', label: 'Rejected' },
            { key: '', label: 'All' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter({ verification_status: s.key })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                filter.verification_status === s.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => ingest('social')}
            disabled={ingesting}
            className="px-3 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
          >
            ⚡ Simulate #IMD posts (+15)
          </button>
          <button
            onClick={() => ingest('api')}
            disabled={ingesting}
            className="px-3 py-2 rounded-lg text-sm bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
          >
            🌐 Fetch API weather (+10)
          </button>
        </div>
      </div>

      {ingestMsg && (
        <div className="text-sm rounded-lg px-4 py-3 bg-slate-100 text-slate-700">{ingestMsg}</div>
      )}

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Fake?</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.data.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 line-clamp-1">{e.title}</div>
                    <div className="text-xs text-slate-400">{e.city ? `${e.city}, ` : ''}{e.state}</div>
                    <div className="text-xs mt-0.5"><StatusBadge value={e.verification_status} /></div>
                  </td>
                  <td className="px-4 py-3"><SeverityBadge value={e.severity} /></td>
                  <td className="px-4 py-3"><SourceBadge value={e.source} /></td>
                  <td className="px-4 py-3">
                    {e.is_fake ? (
                      <div className="text-xs text-rose-600 font-semibold">
                        ⚠ {(e.fake_confidence * 100).toFixed(0)}%
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-600">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => verify(e.id, 'verified')}
                        disabled={e.verification_status === 'verified'}
                        className="px-2 py-1 rounded-md text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => verify(e.id, 'rejected')}
                        disabled={e.verification_status === 'rejected'}
                        className="px-2 py-1 rounded-md text-xs bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => verify(e.id, 'needs_review')}
                        disabled={e.verification_status === 'needs_review'}
                        className="px-2 py-1 rounded-md text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => remove(e.id)}
                        className="px-2 py-1 rounded-md text-xs bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.data.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No events in this category</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}