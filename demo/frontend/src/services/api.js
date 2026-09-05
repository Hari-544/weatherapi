const API_BASE = '/api'

const TOKEN_KEY = 'nw_token'
const USER_KEY = 'nw_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request(path, { method = 'GET', body, auth = true, params } = {}) {
  let url = `${API_BASE}${path}`
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    })
    url += `?${qs.toString()}`
  }
  const headers = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : 'Request failed'
    throw new Error(detail)
  }
  return data
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Login failed')
  }
  return data
}

export const authApi = {
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
}

export const weatherApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    })
    return request(`/weather?${qs.toString()}`)
  },
  get: (id) => request(`/weather/${id}`),
  create: (payload) => request('/weather', { method: 'POST', body: payload }),
  verify: (id, verification_status) =>
    request(`/weather/${id}/verify`, {
      method: 'POST',
      body: { verification_status },
    }),
  remove: (id) => request(`/weather/${id}`, { method: 'DELETE' }),
  stats: () => request('/weather/stats/general'),
}

export const dashboardApi = {
  eventsByType: () => request('/dashboard/events-by-type'),
  eventsByState: () => request('/dashboard/events-by-state'),
  eventsOverTime: (granularity = 'day') =>
    request(`/dashboard/events-over-time?granularity=${granularity}`),
  severityDistribution: () => request('/dashboard/severity-distribution'),
  verificationStats: () => request('/dashboard/verification-stats'),
  sourceBreakdown: () => request('/dashboard/source-breakdown'),
  recentEvents: (limit = 10) => request(`/dashboard/recent-events?limit=${limit}`),
  topCities: (limit = 10) => request(`/dashboard/top-cities?limit=${limit}`),
}

export const ingestApi = {
  simulateSocial: (count = 20) =>
    request('/ingest/simulate-social', { method: 'POST', params: { count } }),
  ingestApi: (count = 10) =>
    request('/ingest/ingest-api', { method: 'POST', params: { count } }),
}
