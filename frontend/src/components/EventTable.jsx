import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Trash2,
  Shield,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { api, getToken } from "../services/api.js";

function MediaEvidence({ event }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const media = event.media || [];

    if (!media.length) {
      setLoaded(true);
      return;
    }

    let cancelled = false;

    const fetchMedia = async () => {
      const token = getToken();
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const results = await Promise.all(
        media.map(async (m) => {
          try {
            const res = await fetch(m.url, { headers });

            if (res.ok) {
              const blob = await res.blob();

              return {
                ...m,
                objectUrl: URL.createObjectURL(blob),
              };
            }

            return {
              ...m,
              failed: true,
            };
          } catch {
            return {
              ...m,
              failed: true,
            };
          }
        })
      );

      if (cancelled) return;

      setItems(results.filter(Boolean));
      setLoaded(true);
    };

    fetchMedia();

    return () => {
      cancelled = true;
    };
  }, [event]);

  useEffect(() => {
    return () => {
      items.forEach((m) => {
        if (m.objectUrl) {
          URL.revokeObjectURL(m.objectUrl);
        }
      });
    };
  }, [items]);

  return (
    <div className="mt-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <ImageIcon className="h-4 w-4" />
        Media Evidence
      </h4>

      {!loaded ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading media...
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No media evidence attached.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m, index) => (
            <div
              key={m.id ?? index}
              className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
            >
              {m.failed ? (
                <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                  Media unavailable
                </div>
              ) : m.kind === "video" ? (
                <video
                  src={m.objectUrl}
                  controls
                  className="h-48 w-full object-cover"
                />
              ) : (
                <img
                  src={m.objectUrl}
                  alt={m.filename || "Weather evidence"}
                  className="h-48 w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceBlock({ event }) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Source
          </div>

          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {event.source || "Unknown source"}
          </div>
        </div>

        {event.verification_status && (
          <div
            className={clsx(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
              event.verification_status === "verified"
                ? "bg-green-100 text-green-700"
                : event.verification_status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            )}
          >
            <Shield className="h-3.5 w-3.5" />

            {String(event.verification_status).replaceAll("_", " ")}
          </div>
        )}
      </div>

      {event.source_url && (
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
        >
          View Original Source
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {event.duplicate_of_id && (
        <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          This report is a duplicate of event #{event.duplicate_of_id}.
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ value, label }) {
  if (value == null) return null;

  const percentage = Math.round(Number(value) * 100);

  let className =
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  if (percentage >= 80) {
    className = "bg-green-100 text-green-700";
  } else if (percentage >= 60) {
    className = "bg-yellow-100 text-yellow-700";
  } else {
    className = "bg-red-100 text-red-700";
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>

      <span
        className={clsx(
          "rounded-full px-2 py-1 text-xs font-semibold",
          className
        )}
      >
        {percentage}%
      </span>
    </div>
  );
}

export default function EventTable({
  events = [],
  onVerify,
  onDelete,
  loading,
  selectable,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const allSelected =
    events.length > 0 &&
    events.every((event) => selectedIds.includes(event.id));

  const toggleExpanded = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading weather events...
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No weather events found.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
              )}

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Event
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Location
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Category
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Severity
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Verification
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => {
              const expanded = expandedId === event.id;

              return (
                <React.Fragment key={event.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    {selectable && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(event.id)}
                          onChange={() => onToggleSelect?.(event.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    )}

                    <td className="max-w-md px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(event.id)}
                        className="flex items-start gap-2 text-left"
                      >
                        {expanded ? (
                          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        )}

                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {event.title || "Untitled event"}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {event.created_at
                              ? dayjs(event.created_at).format(
                                  "DD MMM YYYY, HH:mm"
                                )
                              : "Unknown time"}
                          </div>
                        </div>
                      </button>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {[event.city, event.state]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                        {String(event.event_type || "other").replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                          event.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : event.severity === "high"
                            ? "bg-orange-100 text-orange-700"
                            : event.severity === "moderate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {event.severity || "low"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                          event.verification_status === "verified"
                            ? "bg-green-100 text-green-700"
                            : event.verification_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        )}
                      >
                        {String(
                          event.verification_status || "unverified"
                        ).replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(event.id)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                          title="View details"
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>

                        {onVerify && (
                          <>
                            <button
                              type="button"
                              onClick={() => onVerify(event.id, "verified")}
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                              title="Verify event"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onVerify(event.id, "rejected")}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Reject event"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(event.id)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expanded && (
                    <tr>
                      <td
                        colSpan={selectable ? 7 : 6}
                        className="bg-gray-50 px-6 py-5 dark:bg-gray-900/40"
                      >
                        <div className="grid gap-5 lg:grid-cols-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Event Description
                            </h3>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                              {event.description ||
                                "No description available."}
                            </p>

                            <div className="mt-5 space-y-2">
                              <ConfidenceBadge
                                value={event.fake_confidence}
                                label="Fake / Misleading Risk"
                              />

                              <ConfidenceBadge
                                value={event.category_confidence}
                                label="Category Confidence"
                              />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                              <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-xs text-gray-500">
                                  Source
                                </div>
                                <div className="mt-1 font-medium text-gray-900 dark:text-white">
                                  {event.source || "Unknown"}
                                </div>
                              </div>

                              <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-xs text-gray-500">
                                  Event ID
                                </div>
                                <div className="mt-1 font-medium text-gray-900 dark:text-white">
                                  #{event.id}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <SourceBlock event={event} />

                            <MediaEvidence event={event} />

                            {event.latitude != null &&
                              event.longitude != null && (
                                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Location Coordinates
                                  </h4>

                                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    {event.latitude}, {event.longitude}
                                  </div>
                                </div>
                              )}
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
    </div>
  );
}