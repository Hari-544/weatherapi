export default function StatCard({ icon, label, value, sub, accent = 'brand' }) {
  const colors = {
    brand: 'from-brand-500 to-brand-700',
    green: 'from-emerald-500 to-emerald-700',
    red: 'from-rose-500 to-rose-700',
    amber: 'from-amber-500 to-amber-700',
    blue: 'from-sky-500 to-sky-700',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[accent] || colors.brand} text-white flex items-center justify-center text-2xl shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
        <div className="text-sm text-slate-500 truncate">{label}</div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  )
}
