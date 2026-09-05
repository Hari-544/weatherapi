import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, BarChart3, Settings, LogOut,
  CloudSun, Menu, X, Bell, ChevronDown, User
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/events', label: 'Weather Events', icon: CloudSun },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin', label: 'Admin Panel', icon: Settings },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col bg-dark-900/95 border-r border-dark-700/50 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                <CloudSun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Weather</h1>
                <p className="text-xs text-gray-400">Analytics Platform</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'sidebar-link',
                  isActive && 'active'
                )}
              >
                <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-400' : 'text-gray-400')} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-700/50">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-700/50 z-50">
            <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                  <CloudSun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Weather</h1>
                  <p className="text-xs text-gray-400">Analytics Platform</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={clsx('sidebar-link', isActive && 'active')}
                  >
                    <Icon className={clsx('w-5 h-5', isActive ? 'text-primary-400' : 'text-gray-400')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-dark-900/60 backdrop-blur-md border-b border-dark-700/30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-dark-700 text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search events, cities..."
                className="input pl-10 w-80"
              />
              <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-dark-700 text-gray-400 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                {user.full_name?.[0] || user.username?.[0] || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user.full_name || user.username || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role || 'analyst'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
