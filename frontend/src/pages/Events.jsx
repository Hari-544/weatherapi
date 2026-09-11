import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  CloudRain,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  Video,
} from "lucide-react";
import api from "../services/api";
import EventTable from "../components/EventTable";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const fetchEvents = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = {
        per_page: 100,
      };

      if (eventType) {
        params.event_type = eventType;
      }

      if (verificationStatus) {
        params.verification_status = verificationStatus;
      }

      if (search) {
        params.search = search;
      }

      const response = await api.get("/api/weather", {
        params,
      });

      const data = response.data;

      setEvents(data.data || []);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventType, verificationStatus, search]);

  const handleRefresh = () => {
    fetchEvents(false);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    const validFiles = [];
    const errors = [];

    for (const file of selectedFiles) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type) &&
        !ALLOWED_VIDEO_TYPES.includes(file.type)
      ) {
        errors.push(`${file.name}: unsupported file type.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: maximum size is 10 MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length) {
      setSubmitError(errors.join(" "));
    } else {
      setSubmitError("");
    }

    setFiles(validFiles);
  };

  const removeFile = (index) => {
    setFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCity("");
    setState("");
    setLatitude("");
    setLongitude("");
    setFiles([]);

    const fileInput = document.getElementById("citizen-media");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitMessage("");
    setSubmitError("");

    if (!title.trim()) {
      setSubmitError("Please enter a report title.");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Please describe the weather event.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());

      if (city.trim()) {
        formData.append("city", city.trim());
      }

      if (state.trim()) {
        formData.append("state", state.trim());
      }

      if (latitude.trim()) {
        formData.append("latitude", latitude.trim());
      }

      if (longitude.trim()) {
        formData.append("longitude", longitude.trim());
      }

      files.forEach((file) => {
        formData.append("media", file);
      });

      const response = await api.post(
        "/api/weather/citizen-report",
        formData
      );

      if (response.status >= 200 && response.status < 300) {
        setSubmitMessage(
          "Citizen weather report submitted successfully."
        );

        resetForm();

        await fetchEvents(false);
      }
    } catch (error) {
      console.error("Citizen report submission failed:", error);

      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;

      if (status === 401) {
        setSubmitError(
          "Please log in before submitting a citizen report."
        );
      } else if (status === 413) {
        setSubmitError(
          "The uploaded media is too large. Maximum file size is 10 MB."
        );
      } else if (status === 415) {
        setSubmitError(
          "One or more uploaded files are not supported."
        );
      } else if (status === 422) {
        if (Array.isArray(detail)) {
          setSubmitError(
            detail
              .map((item) => item?.msg || "Invalid form data.")
              .join(" ")
          );
        } else {
          setSubmitError(
            detail || "Some submitted fields are invalid."
          );
        }
      } else {
        setSubmitError(
          detail ||
            "Unable to submit the report. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (eventId, status) => {
    try {
      await api.post(`/api/weather/${eventId}/verify`, {
        verification_status: status,
      });

      await fetchEvents(false);
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const filteredEvents = useMemo(() => events, [events]);

  const selectedMediaPreview = files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  }));

  useEffect(() => {
    return () => {
      selectedMediaPreview.forEach((item) => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, [files]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Weather Events
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse weather reports and submit citizen observations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh Events
        </button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <CloudRain className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Submit Citizen Weather Report
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Report rainfall, flooding, storms and other local weather
              conditions.
            </p>
          </div>
        </div>

        {submitMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        )}

        {submitError && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmitReport}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Report Title
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Heavy rainfall in Vijayawada"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what you observed..."
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              City
            </label>

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              State
            </label>

            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Latitude
            </label>

            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Optional"
              inputMode="decimal"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Longitude
            </label>

            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Optional"
              inputMode="decimal"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Photo / Video Evidence
            </label>

            <label
              htmlFor="citizen-media"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 dark:border-gray-600"
            >
              <div className="mb-2 flex items-center gap-3">
                <ImageIcon className="h-6 w-6 text-gray-400" />
                <Video className="h-6 w-6 text-gray-400" />
              </div>

              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Click to upload evidence
              </div>

              <div className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP, GIF, MP4, WEBM or MOV · Max 10 MB each
              </div>

              <input
                id="citizen-media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {selectedMediaPreview.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {ALLOWED_VIDEO_TYPES.includes(item.file.type) ? (
                      <video
                        src={item.url}
                        className="h-32 w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="h-32 w-full object-cover"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Weather Event Reports
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review reports, verification status and evidence.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-56 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="rainfall">Rainfall</option>
              <option value="thunderstorm">Thunderstorm</option>
              <option value="flooding">Flooding</option>
              <option value="heatwave">Heatwave</option>
              <option value="fog">Fog</option>
              <option value="dust_storm">Dust Storm</option>
              <option value="strong_winds">Strong Winds</option>
              <option value="cyclone">Cyclone</option>
            </select>

            <select
              value={verificationStatus}
              onChange={(e) =>
                setVerificationStatus(e.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="p-4">
          <EventTable
            events={filteredEvents}
            loading={loading}
            onVerify={handleVerify}
          />
        </div>
      </section>
    </div>
  );
}