import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#d946ef'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-gray-200 mb-1">{label}</p>
      {payload.map((item, idx) => (
        <p key={idx} className="text-xs" style={{ color: item.color }}>
          {item.name}: <span className="font-semibold">{item.value}</span>
        </p>
      ))}
    </div>
  );
};

export function EventsByTypeBarChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Events by Type</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="event_type" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Events" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventsOverTimeChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Events Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
            name="Events"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventsByStatePieChart({ data = [] }) {
  const chartData = data.slice(0, 10);
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Top States</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={3}
            dataKey="count"
            nameKey="state"
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeverityDistributionChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Severity Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis
            dataKey="severity"
            type="category"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Events" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => {
              const colorMap = { low: '#22c55e', moderate: '#f59e0b', high: '#f97316', critical: '#ef4444' };
              return <Cell key={idx} fill={colorMap[entry.severity] || COLORS[idx]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VerificationStatsChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Verification Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={3}
            dataKey="count"
            nameKey="verification_status"
            label={({ verification_status, count }) => `${verification_status}: ${count}`}
          >
            {data.map((entry, idx) => {
              const colorMap = {
                pending: '#3b82f6',
                verified: '#22c55e',
                rejected: '#ef4444',
                needs_review: '#f59e0b'
              };
              return <Cell key={idx} fill={colorMap[entry.verification_status] || COLORS[idx]} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceBreakdownChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Data Sources</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="source" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Radar
            name="Events"
            dataKey="count"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
