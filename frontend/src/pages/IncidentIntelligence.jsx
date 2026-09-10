import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  Activity,
  BarChart3,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  ExternalLink,
  Filter,
} from 'lucide-react';

const STATUS_META = {
  VERIFIED: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle2 },
  PROBABLE: { color: 'text-sky-400 bg-sky-400/10 border-sky-400/30', icon: CheckCircle2 },
  NEEDS_REVIEW: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: AlertTriangle },
  UNVERIFIED: { color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', icon: AlertTriangle },
  REJECTED: { color: 'text-rose-400 bg-rose-400/10 border-rose-400/30', icon: XCircle },
};

const TYPE_LABELS = {
  rainfall: 'Rainfall',
  thunderstorm: 'Thunderstorm',
  flooding: 'Flooding',
  heatwave: 'Heatwave',
  fog: 'Fog',
  dust_storm: 'Dust Storm',
  strong_winds: 'Strong Winds',
  cyclone: 'Cyclone',
  other: 'Other',
};

const SEVERITY_LABELS = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

function Badge({ status, label }) {
  const meta = STATUS_META[status] || STATUS_META.UNVERIFIED;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${meta.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label || status}
    </span>
  );
}

function ScoreRing({ score }) {
  const clamped = Math.max(0, Math.min(100, score || 0));
  const color = clamped >= 75 ? '#34d399' : clamped >= 50 ? '#38bdf8' : clamped >= 25 ? '#fbbf24' : '#f87171';
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(clamped)}</span>
        <span className="text-[10px] uppercase tracking-wide text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-dark-800 bg-dark-900/70 p-5 ${className}`}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
        {Icon && <Icon className="h-4 w-4 text-primary-400" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function BreakdownBar({ label, value, max = 25 }) {
  const v = Math.max(0, Math.min(max, value || 0));
  const pct = (v / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium text-gray-200">{v.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-dark-700">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function IncidentIntelligence() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/intelligence/events/${eventId}`);
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError('Unable to load intelligence data for this event.');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-center py-24 text-gray-500">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary-400" />
          Loading intelligence panel...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <div className="rounded-2xl border border-dark-800 bg-dark-900/70 p-6 text-center text-sm text-rose-400">
          {error || 'No intelligence data available.'}
        </div>
      </div>
    );
  }

  const event = data.event;
  const intel = data.intelligence || {};
  const classification = intel.classification || {};
  const verification = intel.verification || {};
  const severityData = intel.severity || {};
  const sourceTrust = intel.source_trust || {};
  const corroboration = intel.corroboration || {};
  const contradiction = intel.contradiction || {};
  const dataQuality = intel.data_quality || {};
  const priority = intel.priority || {};
  const lifecycle = intel.lifecycle || {};
  const explanation = intel.explanation || {};
  const timeline = intel.timeline || [];
  const candidates = classification.candidates || [];
  const breakdown = verification.breakdown || {};
  const relatedReports = corroboration.related_reports || [];
  const sourceDetails = event.source_details || {};

  const verificationStatus = event.verification_status || 'unverified';
  const verifyStatusUpper = String(verificationStatus).toUpperCase().replace('_', ' ');

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={verificationStatus} label={verifyStatusUpper} />
          <span className="rounded-full border border-dark-700 px-3 py-1 text-xs font-medium text-gray-400">
            {TYPE_LABELS[event.event_type] || event.event_type}
          </span>
        </div>
      </div>

      <header className="rounded-2xl border border-dark-800 bg-dark-900/70 p-6">
        <h1 className="text-2xl font-bold text-white">{event.title}</h1>
        <p className="mt-1 text-sm text-gray-400">{event.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>📍 {event.city || 'Unknown city'}{event.state ? `, ${event.state}` : ''}</span>
          <span>🕒 Reported {fmtTime(event.reported_at)}</span>
          {event.latitude != null && (
            <span>🧭 {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
          )}
        </div>
      </header>

      {/* AI Decision / WHY TRUST THIS EVENT */}
      <Card title="AI Decision — Why trust this event?" icon={ShieldCheck}
            className="border-primary-500/30 bg-gradient-to-br from-primary-500/5 to-transparent">
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={verification.score} />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Verification Score
            </span>
            <span className="text-xs text-gray-500">v{verification.version || '—'}</span>
          </div>
          <div className="space-y-4">
            {verification.reasoning && (
              <p className="rounded-xl border border-dark-700 bg-dark-800/60 px-4 py-3 text-sm text-gray-200">
                {verification.reasoning}
              </p>
            )}
            {explanation.verification_reason && (
              <p className="text-sm text-gray-300">{explanation.verification_reason}</p>
            )}
            {verification.evidence?.length > 0 && (
              <ul className="space-y-1">
                {verification.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Verification Breakdown" icon={BarChart3}>
          {Object.keys(breakdown).length > 0 ? (
            <div className="space-y-3">
              <BreakdownBar label="Source reliability" value={breakdown.source_reliability} />
              <BreakdownBar label="Cross-source corroboration" value={breakdown.cross_source_corroboration} />
              <BreakdownBar label="Geographic consistency" value={breakdown.geographic_consistency} max={20} />
              <BreakdownBar label="Temporal consistency" value={breakdown.temporal_consistency} max={10} />
              <BreakdownBar label="Official evidence" value={breakdown.official_evidence} max={10} />
              <BreakdownBar label="Media evidence" value={breakdown.media_evidence} max={5} />
              {breakdown.misinformation_penalty != null && breakdown.misinformation_penalty !== 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  Misinformation risk penalty: {breakdown.misinformation_penalty} point(s)
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Insufficient data</p>
          )}
        </Card>

        <Card title="Classification" icon={Fingerprint}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-white">
              {TYPE_LABELS[classification.category] || classification.category || '—'}
            </span>
            <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-300">
              {(classification.confidence || 0) * 100}% confidence
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              classification.state === 'AUTO_CLASSIFIED'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : classification.state === 'MANUALLY_CLASSIFIED'
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}>
              {classification.state || '—'}
            </span>
          </div>
          {explanation.classification_reason && (
            <p className="mt-3 text-sm text-gray-300">{explanation.classification_reason}</p>
          )}
          {classification.matched_patterns?.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Matched signals</p>
              <div className="flex flex-wrap gap-1.5">
                {(classification.matched_patterns || []).slice(0, 8).map((p, i) => (
                  <span key={i} className="rounded-md bg-dark-700 px-2 py-0.5 text-xs text-gray-300">{p}</span>
                ))}
              </div>
            </div>
          )}
          {candidates.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Alternative candidates</p>
              {candidates.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-dark-800/50 px-3 py-1.5 text-sm">
                  <span className="text-gray-300">{TYPE_LABELS[c.category] || c.category}</span>
                  <span className="text-xs text-gray-500">{((c.confidence || 0) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
          {explanation.why_not_alternatives?.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              {explanation.why_not_alternatives.map((w, i) => (
                <li key={i}>— {w}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Severity" icon={Activity}>
          <div className="flex items-center gap-4">
            <div className={`h-11 w-11 rounded-2xl border ${
              severityData.severity === 'CRITICAL'
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                : severityData.severity === 'HIGH'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : severityData.severity === 'MODERATE'
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            } flex items-center justify-center text-lg font-bold`}>
              {SEVERITY_LABELS[severityData.severity]?.[0] || '—'}
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {SEVERITY_LABELS[severityData.severity] || severityData.severity || '—'}
              </p>
              <p className="text-xs text-gray-500">
                {((severityData.confidence || 0) * 100).toFixed(0)}% confidence · v{event.severity ? '' : ''}
              </p>
            </div>
          </div>
          {explanation.severity_reason && (
            <p className="mt-3 text-sm text-gray-300">{explanation.severity_reason}</p>
          )}
        </Card>

        <Card title="Source Trust" icon={ShieldCheck}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{sourceTrust.source_name || '—'}</p>
              <p className="text-xs text-gray-500">{sourceTrust.source_type || '—'} source</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-400">
                {sourceTrust.trust_score != null ? Math.round(sourceTrust.trust_score) : '—'}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Trust / 100</p>
            </div>
          </div>
          {sourceTrust.reliability_reason && (
            <p className="mt-2 text-xs text-gray-400">{sourceTrust.reliability_reason}</p>
          )}
          {sourceTrust.total_reports != null && (
            <p className="mt-1 text-xs text-gray-500">
              {sourceTrust.total_reports} report(s) observed ·{' '}
              {sourceTrust.has_sufficient_data ? 'sufficient history' : 'insufficient history for statistical trust'}
            </p>
          )}
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300"
            >
              View original source <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {sourceDetails.display && (
            <p className="mt-2 text-xs text-gray-500">Platform: {sourceDetails.platform || sourceDetails.display}</p>
          )}
        </Card>

        <Card title="Corroboration" icon={Layers}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-dark-800/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">{corroboration.related_report_count ?? 0}</p>
              <p className="text-xs text-gray-500">Related reports</p>
            </div>
            <div className="rounded-xl bg-dark-800/50 p-3 text-center">
              <p className={`text-2xl font-bold ${corroboration.is_corroborated ? 'text-emerald-400' : 'text-gray-500'}`}>
                {corroboration.source_count ?? 0}
              </p>
              <p className="text-xs text-gray-500">Independent sources</p>
            </div>
          </div>
          {!corroboration.is_corroborated && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              <Info className="h-3.5 w-3.5" /> Single-source report — treat with caution.
            </p>
          )}
          {corroboration.is_corroborated && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Multiple independent sources corroborate this event.
            </p>
          )}
          {relatedReports.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {relatedReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-dark-800/40 px-3 py-1.5 text-xs">
                  <span className="truncate text-gray-300">{r.title}</span>
                  <span className="ml-2 shrink-0 text-gray-500">{r.similarity && `${(r.similarity * 100).toFixed(0)}% match`}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {contradiction.has_conflict && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-300">Contradictory reporting detected</p>
            <p className="text-sm text-rose-200/80">{contradiction.description}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Priority" icon={BarChart3}>
          <p className={`text-2xl font-bold ${
            priority.priority_level === 'CRITICAL'
              ? 'text-rose-400'
              : priority.priority_level === 'HIGH'
                ? 'text-amber-400'
                : priority.priority_level === 'MODERATE'
                  ? 'text-sky-400'
                  : 'text-emerald-400'
          }`}>
            {priority.priority_score != null ? Math.round(priority.priority_score) : '—'}
          </p>
          <p className="text-xs text-gray-500">score · {priority.priority_level || '—'} priority</p>
        </Card>

        <Card title="Lifecycle" icon={Clock}>
          <p className="text-lg font-semibold text-white">{lifecycle.lifecycle || '—'}</p>
          <p className="text-xs text-gray-500">{lifecycle.reason || 'Insufficient data'}</p>
        </Card>

        <Card title="Data Quality" icon={Filter}>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${
              dataQuality.data_quality === 'EXCELLENT'
                ? 'text-emerald-400'
                : dataQuality.data_quality === 'GOOD'
                  ? 'text-sky-400'
                  : dataQuality.data_quality === 'FAIR'
                    ? 'text-amber-400'
                    : 'text-rose-400'
            }`}>
              {dataQuality.data_quality_score ?? '—'}
            </p>
            <span className="text-xs text-gray-500">{dataQuality.data_quality || ''}</span>
          </div>
          <p className="text-xs text-gray-500">completeness of the report</p>
        </Card>
      </div>

      {timeline.length > 0 && (
        <Card title="Processing Timeline" icon={Clock}>
          <ol className="relative ml-4 space-y-5 border-l-2 border-dark-700 pl-6">
            {timeline.map((step, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-dark-700 bg-primary-500" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-gray-200">{step.label}</p>
                  <span className="text-xs text-gray-500">{fmtTime(step.time)}</span>
                </div>
                {step.detail && <p className="text-xs text-gray-500">{step.detail}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}