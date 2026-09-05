import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/events', label: 'Events' },
  { to: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-storm text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🌧️</span>
            <span>National Weather Platform</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {(user?.role === 'admin' || user?.role === 'analyst') && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="font-medium">{user?.full_name || user?.username}</div>
            <div className="text-slate-400 capitalize">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md text-sm bg-slate-700 hover:bg-slate-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
