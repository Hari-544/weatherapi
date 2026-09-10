import React, { useEffect, useState } from 'react';
import { X, MapPin, LocateFixed, Loader2, AlertCircle } from 'lucide-react';
import { api, getUser, setAuth, getToken } from '../services/api.js';

const RADIUS_OPTIONS = [10, 25, 50, 75, 100];

export default function AlertPreferences({ open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState({
    notification_consent: false,
    notification_lat: null,
    notification_lng: null,
    notification_radius_km: 25,
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    api
      .get('/api/notifications/preferences')
      .then(({ data }) => setPrefs(data))
      .catch(() => setError('Unable to load alert preferences.'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const enableAlerts = async () => {
    setError('');
    if (!prefs.notification_lat || !prefs.notification_lng) {
      setError('Enable location first, then turn on weather alerts.');
      return;
    }
    setPrefs((p) => ({ ...p, notification_consent: true }));
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setError('');
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPrefs((p) => ({
          ...p,
          notification_lat: Number(position.coords.latitude.toFixed(5)),
          notification_lng: Number(position.coords.longitude.toFixed(5)),
        }));
        setLocating(false);
      },
      () => {
        setError('Location access was denied. Allow location to receive nearby weather alerts.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/api/notifications/preferences', {
        notification_consent: prefs.notification_consent,
        notification_lat: prefs.notification_lat,
        notification_lng: prefs.notification_lng,
        notification_radius_km: prefs.notification_radius_km,
      });
      // Keep the stored user dict current so the role/name stay fresh.
      setAuth({ token: getToken(), user: { ...getUser(), ...data } });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-dark-900 border border-dark-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-400" />
            <h2 className="text-sm font-semibold text-white">Weather alert settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-700 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Saved location (used to send nearby severe-weather alerts)
              </label>
              <div className="flex gap-2 items-center">
                <button
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="btn-secondary inline-flex items-center gap-2 text-xs disabled:opacity-50"
                >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  Use my current location
                </button>
                {prefs.notification_lat != null && (
                  <span className="text-xs text-gray-400">
                    {prefs.notification_lat.toFixed(4)}, {prefs.notification_lng.toFixed(4)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Alert radius</label>
              <div className="flex gap-2 flex-wrap">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setPrefs((p) => ({ ...p, notification_radius_km: r }))}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      prefs.notification_radius_km === r
                        ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                        : 'border-dark-700 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Receive weather alerts</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Only high/critical alerts within your radius are sent.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={prefs.notification_consent}
                  onChange={(e) => {
                    if (e.target.checked) enableAlerts();
                    else setPrefs((p) => ({ ...p, notification_consent: false }));
                  }}
                />
                <div className="w-10 h-5 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}