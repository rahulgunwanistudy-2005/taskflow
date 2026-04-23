// In dev: Vite proxies /api → localhost:8000 (vite.config.js)
// In production (Render Static Site): VITE_API_URL is injected at build time
const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1'

function getToken() {
  return localStorage.getItem('access_token')
}

async function req(path, options = {}) {
  const token = getToken()
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw { status: res.status, detail: data.detail || data.error || 'Error' }
  return data
}

export const api = {
  register: (body) => req('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => req('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req('/auth/me'),
  logout: () => req('/auth/logout', { method: 'POST' }),

  getTasks: (page = 1, size = 20, status) => {
    const q = new URLSearchParams({ page, size })
    if (status) q.set('status', status)
    return req(`/tasks/?${q}`)
  },
  createTask: (body) => req('/tasks/', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) => req(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),
}
