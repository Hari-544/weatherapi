import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Bell, CheckCheck, MapPin, ShieldAlert, Info, Settings, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

const TYPE_ICONS = {
  alert: MapPin,
  verification: ShieldAlert,
  system: Info,
};

const TYPE_COLORS = {
  alert: 'text-red-400',
  verification: 'text-yellow-400',
  system: 'text-blue-400',
};

export default function NotificationDrawer({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const drawerRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/api/notifications?per_page=50'),
        api.get('/api/notifications/unread-count'),
      ]);
      setItems(listRes.data.data || []);
      setUnread(countRes.data.unread_count || 0);
    } catch {
      /* logged out / offline */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    refresh();
    const timer = setInterval(refresh, 45000);
    return () => clearInterval(timer);
  }, [open, refresh]);

  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = filter === 'unread'
    ? items.filter((n) => !n.is_read)
    : filter === 'alerts'
    ? items.filter((n) => n.type === 'alert')
    : items;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notifications">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside
        ref={drawerRef}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-dark-900 border-l border-dark-700/50 flex flex-col outline-none"
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
            {unread > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300" aria-label={`${unread} unread`}>
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-300 hover:text-primary-200 inline-flex items-center gap-1 transition-colors"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-700 text-gray-400" aria-label="Close notifications">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-4 py-2 border-b border-dark-700/30" role="tablist" aria-label="Notification filters">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'alerts', label: 'Alerts' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === tab.id
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin ml-auto self-center" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bell className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          )}

          <ul className="divide-y divide-dark-700/30">
            {filtered.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Info;
              const iconColor = TYPE_COLORS[n.type] || 'text-gray-400';
              return (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !n.is_read) markRead(n.id); }}
                  role="button"
                  tabIndex={0}
                  className={`p-4 cursor-pointer transition-colors ${
                    n.is_read ? '' : 'bg-primary-500/5 hover:bg-primary-500/10'
                  }`}
                  aria-label={`${n.is_read ? '' : 'Unread: '}${n.title}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
