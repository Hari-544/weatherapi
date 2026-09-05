const severityStyles = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700',
}

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  needs_review: 'bg-sky-100 text-sky-700',
}

const sourceStyles = {
  social: 'bg-violet-100 text-violet-700',
  web: 'bg-sky-100 text-sky-700',
  api: 'bg-teal-100 text-teal-700',
  citizen: 'bg-fuchsia-100 text-fuchsia-700',
  other: 'bg-slate-100 text-slate-600',
}

export function SeverityBadge({ value }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityStyles[value] || 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  )
}

export function StatusBadge({ value }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[value] || 'bg-slate-100 text-slate-600'}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

export function SourceBadge({ value }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sourceStyles[value] || 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  )
}
