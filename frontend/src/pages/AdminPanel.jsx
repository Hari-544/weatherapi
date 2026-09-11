import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  Database,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import api from "../services/api";
import EventTable from "../components/EventTable";

export default function AdminPanel() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [eventsResponse, statsResponse] = await Promise.all([
        api.get("/api/weather?per_page=100"),
        api.get("/api/weather/stats/general"),
      ]);

      const eventData = eventsResponse.data;

      setEvents(eventData.data || []);
      setStats(statsResponse.data || null);
    } catch (err) {
      console.error("Failed to load admin data:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load weather events. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    await fetchData(false);
  };

  const handleIngest = async () => {
    try {
      setIngesting(true);
      setMessage("");
      setError("");

      const response = await api.post("/api/ingest/run");

      const stored =
        response?.data?.total_stored ??
        response?.data?.stored ??
        response?.data?.total ??
        0;

      setMessage(
        `Data ingestion completed successfully. ${stored} new records stored.`
      );

      await fetchData(false);
    } catch (err) {
      console.error("Ingestion failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Data ingestion failed. Please try again."
      );
    } finally {
      setIngesting(false);
    }
  };

  const handleVerify = async (eventId, status) => {
    try {
      setError("");
      setMessage("");

      await api.post(`/api/weather/${eventId}/verify`, {
        verification_status: status,
      });

      setMessage(
        status === "verified"
          ? `Event #${eventId} verified successfully.`
          : `Event #${eventId} rejected successfully.`
      );

      await fetchData(false);
    } catch (err) {
      console.error("Verification failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to update verification status."
      );
    }
  };

  const handleDelete = async (eventId) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete event #${eventId}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/api/weather/${eventId}`);

      setMessage(`Event #${eventId} deleted successfully.`);

      setSelectedIds((current) =>
        current.filter((id) => id !== eventId)
      );

      await fetchData(false);
    } catch (err) {
      console.error("Delete failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to delete the selected event."
      );
    }
  };

  const handleToggleSelect = (eventId) => {
    setSelectedIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredEvents.map((event) => event.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkVerify = async (status) => {
    if (!selectedIds.length) return;

    const confirmed = window.confirm(
      `Apply "${status}" to ${selectedIds.length} selected event(s)?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await Promise.all(
        selectedIds.map((id) =>
          api.post(`/api/weather/${id}/verify`, {
            verification_status: status,
          })
        )
      );

      setMessage(
        `${selectedIds.length} event(s) updated successfully.`
      );

      setSelectedIds([]);

      await fetchData(false);
    } catch (err) {
      console.error("Bulk verification failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Some events could not be updated."
      );

      await fetchData(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          event.title,
          event.description,
          event.city,
          event.state,
          event.source,
          event.event_type,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      if (!matchesSearch) return false;

      if (activeTab === "verification") {
        return (
          event.verification_status !== "verified" &&
          event.verification_status !== "rejected"
        );
      }

      if (activeTab === "suspicious") {
        return Number(event.fake_confidence || 0) >= 0.6;
      }

      if (activeTab === "verified") {
        return event.verification_status === "verified";
      }

      return true;
    });
  }, [events, activeTab, search]);

  const counts = useMemo(() => {
    // Use stats for total counts (from full database), fallback to events array for filtered views
    const totalEvents = stats?.total_events ?? events.length;
    const verifiedEvents = stats?.verified_events ?? events.filter(e => e.verification_status === "verified").length;
    const pendingEvents = stats?.pending_review ?? events.filter(e => e.verification_status === "pending").length;
    const needsReviewEvents = stats?.needs_review ?? events.filter(e => e.verification_status === "needs_review").length;
    const rejectedEvents = stats?.rejected_events ?? events.filter(e => e.verification_status === "rejected").length;
    const detectedFake = stats?.detected_fake ?? events.filter(e => Number(e.fake_confidence || 0) >= 0.6).length;

    return {
      all: totalEvents,
      verification: pendingEvents + needsReviewEvents, // pending + needs_review
      suspicious: detectedFake,
      verified: verifiedEvents,
    };
  }, [events, stats]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review, verify and manage incoming weather reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleIngest}
            disabled={ingesting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />

            {ingesting ? "Collecting..." : "Run Data Collection"}
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Events</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total_events ?? counts.all}
              </div>
            </div>

            <Database className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">
                Verification Queue
              </div>

              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {counts.verification}
              </div>
            </div>

            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">
                Suspicious Reports
              </div>

              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {counts.suspicious}
              </div>
            </div>

            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">
                Verified Reports
              </div>

              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {counts.verified}
              </div>
            </div>

            <ShieldCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All Events"],
              ["verification", "Verification Queue"],
              ["suspicious", "Suspicious"],
              ["verified", "Verified"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {label}

                <span className="ml-2 opacity-75">
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-blue-900/20">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {selectedIds.length} event(s) selected
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleBulkVerify("verified")}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Verify Selected
              </button>

              <button
                type="button"
                onClick={() => handleBulkVerify("rejected")}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" />
                Reject Selected
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="p-4">
          <EventTable
            events={filteredEvents}
            loading={loading}
            onVerify={handleVerify}
            onDelete={handleDelete}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>
    </div>
  );
}