import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import { dashboardApi } from '../services/api'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#f97316', '#64748b']

export default function Analytics() {
  const [byType, setByType] = useState([])
  const [byState, setByState] = useState([])
  const [overTime, setOverTime] = useState([])
  const [severity, setSeverity] = useState([])
  const [verification, setVerification] = useState([])
  const [sources, setSources] = useState([])
  const [granularity, setGranularity] = useState('day')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.eventsByType(),
      dashboardApi.eventsByState(),
      dashboardApi.eventsOverTime(granularity),
      dashboardApi.severityDistribution(),
      dashboardApi.verificationStats(),
      dashboardApi.sourceBreakdown(),
    ])
      .then(([t, s, o, sev, ver, src]) => {
        setByType(t.data)
        setByState(s.data)
        setOverTime(o.data)
        setSeverity(sev.data)
        setVerification(ver.data)
        setSources(src.data)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [granularity])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm">Aggregated insights from collected weather events</p>
      </div>

      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {loading && <div className="text-center text-slate-500 py-10">Loading analytics...</div>}

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Granularity:</span>
        {['day', 'month'].map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${granularity === g ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Events by Type">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="event_type" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Events Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Severity Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={severity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={90} label>
                {severity.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Verification Status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={verification} dataKey="count" nameKey="verification_status" cx="50%" cy="50%" outerRadius={90} label>
                {verification.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top States">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byState.slice(0, 12)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="state" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Source Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={90} label>
                {sources.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="font-semibold text-slate-800 mb-3">{title}</h2>
      {children}
    </div>
  )
}