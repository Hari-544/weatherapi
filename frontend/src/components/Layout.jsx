import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, BarChart3, Settings, LogOut,
  CloudSun, Menu, X, Bell, User, LogIn
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import NotificationDrawer from './NotificationDrawer.jsx';
import AlertPreferences from './AlertPreferences.jsx';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/events', label: 'Weather Events', icon: CloudSun },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin', label: 'Admin Panel', icon: Settings, adminOnly: true },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.unread_count || 0);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  // Refresh the badge periodically while the app is open so new
  // location-based alerts and verification updates appear without reloading.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  }, [isAuthenticated, fetchUnread]);

  const handleLogout = () => {
    logout();
    setNotifOpen(false);
    navigate('/');
  };

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const initials = (user?.full_name || user?.username || 'U').slice(0, 1).toUpperCase();

  const renderNav = (isMobile = false) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => isMobile && setMobileOpen(false)}
          className={clsx('sidebar-link', isActive && 'active')}
        >
          <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-400' : 'text-gray-400')} />
          {(sidebarOpen || isMobile) && <span>{item.label}</span>}
        </Link>
      );
    });

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SidebarContent
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logo={renderLogo(sidebarOpen)}
        nav={renderNav(false)}
        footer={isAuthenticated ? (
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        ) : (
          <Link to="/login" className="sidebar-link w-full">
            <LogIn className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sign in</span>}
          </Link>
        )}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-700/50 z-50">
            <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
              {renderLogo(true)}
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-white" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1" aria-label="Main navigation">{renderNav(true)}</nav>
            <div className="p-3 border-t border-dark-700/50">
              {isAuthenticated && (
                <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-dark-900/60 backdrop-blur-md border-b border-dark-700/30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-dark-700 text-gray-400"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-sm text-gray-400">
              Public weather data — no account required to browse.
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button onClick={() => setNotifOpen(true)} className="relative p-2 rounded-lg hover:bg-dark-700 text-gray-400 transition-colors" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center" aria-hidden="true">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</p>
                </div>
                <button
                  onClick={() => setPrefsOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-dark-700 text-gray-300 hover:bg-dark-700 transition-colors"
                  aria-label="Configure weather alert preferences"
                >
                  Alert settings
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 py-2">
                <LogIn className="w-4 h-4" /> Sign in
              </Link>
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-6" tabIndex={-1}>
          {children}
        </main>
      </div>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      <AlertPreferences open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}

function renderLogo(expanded) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
        <CloudSun className="w-6 h-6 text-white" />
      </div>
      {expanded && (
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Weather</h1>
          <p className="text-xs text-gray-400">Analytics Platform</p>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ sidebarOpen, setSidebarOpen, logo, nav, footer }) {
  return (
    <aside
      className={clsx(
        'hidden lg:flex flex-col bg-dark-900/95 border-r border-dark-700/50 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
        {logo}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">{nav}</nav>
      <div className="p-4 border-t border-dark-700/50">{footer}</div>
    </aside>
  );
}

export { SidebarContent };
