import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (u, p) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-storm via-brand-900 to-storm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌧️</div>
          <h1 className="text-2xl font-bold text-white">National Weather Platform</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to access the dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm rounded-lg px-4 py-3 border border-rose-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => quickFill('admin', 'admin123')}
              className="text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 text-slate-700"
            >
              👤 admin / admin123
            </button>
            <button
              type="button"
              onClick={() => quickFill('analyst', 'analyst123')}
              className="text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 text-slate-700"
            >
              🧑 analyst / analyst123
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
