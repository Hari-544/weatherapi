import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudSun, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', form.username);
      formData.append('password', form.password);

      const response = await api.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      });

      const loginFormData = new URLSearchParams();
      loginFormData.append('username', form.username);
      loginFormData.append('password', form.password);

      const loginResponse = await api.post('/api/auth/login', loginFormData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, user } = loginResponse.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <CloudSun className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">National Weather Platform</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Big Data Analytics for Indian Weather Events
          </p>
        </div>

        <div className="card">
          <div className="flex mb-6 border-b border-dark-700/50">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                !isRegister
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isRegister
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="your_username"
                required
                className="input"
              />
            </div>

            {isRegister && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRegister ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-dark-700/30">
            <p className="text-xs text-gray-500 text-center">
              Demo: Use any username/password to login, or register a new account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
