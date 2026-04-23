import { useState, useEffect, useCallback } from 'react'
import { api } from './api.js'

// ─── Design tokens ────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #18181f;
    --border: #2a2a35;
    --accent: #7c6af7;
    --accent-dim: rgba(124,106,247,0.15);
    --accent-glow: rgba(124,106,247,0.4);
    --text: #e8e8f0;
    --text-muted: #6b6b80;
    --success: #22d3a0;
    --warning: #f59e0b;
    --danger: #f87171;
    --todo: #7c6af7;
    --in-progress: #f59e0b;
    --done: #22d3a0;
    --low: #6b6b80;
    --medium: #7c6af7;
    --high: #f87171;
  }

  html, body, #root { height: 100%; font-family: 'Syne', sans-serif; background: var(--bg); color: var(--text); }

  /* ─── Layout ─── */
  .layout { display: flex; min-height: 100vh; }
  .sidebar {
    width: 240px; min-height: 100vh; background: var(--surface);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    padding: 28px 20px; position: fixed; top: 0; left: 0; bottom: 0;
  }
  .main { margin-left: 240px; flex: 1; min-height: 100vh; padding: 40px; max-width: calc(100vw - 240px); }

  /* ─── Auth layout ─── */
  .auth-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
  }
  .auth-card {
    width: 400px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 40px; position: relative; overflow: hidden;
  }
  .auth-card::before {
    content: ''; position: absolute; top: -80px; right: -80px;
    width: 200px; height: 200px; background: var(--accent-dim);
    border-radius: 50%; filter: blur(60px);
  }

  /* ─── Logo ─── */
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
  .logo-mark {
    width: 32px; height: 32px; background: var(--accent);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 14px; color: white;
  }
  .logo-text { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }

  /* ─── Nav ─── */
  .nav-section { flex: 1; }
  .nav-label { font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 8px; cursor: pointer; transition: all 0.15s; font-size: 14px;
    font-weight: 600; color: var(--text-muted); margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: var(--accent-dim); color: var(--accent); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }

  /* ─── User info ─── */
  .user-info { border-top: 1px solid var(--border); padding-top: 20px; }
  .user-name { font-size: 13px; font-weight: 700; }
  .user-role {
    display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; padding: 2px 8px; border-radius: 20px;
    background: var(--accent-dim); color: var(--accent); margin-top: 4px;
  }
  .btn-logout {
    margin-top: 12px; width: 100%; padding: 8px; border: 1px solid var(--border);
    background: none; color: var(--text-muted); border-radius: 8px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 13px; transition: all 0.15s;
  }
  .btn-logout:hover { border-color: var(--danger); color: var(--danger); }

  /* ─── Typography ─── */
  h1 { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
  h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 32px; }

  /* ─── Form elements ─── */
  .form-group { margin-bottom: 18px; }
  label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
  input, select, textarea {
    width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px;
    transition: border-color 0.15s; outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  textarea { resize: vertical; min-height: 80px; }
  select option { background: var(--surface2); }

  /* ─── Buttons ─── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 20px; border-radius: 8px; font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #6b5be0; box-shadow: 0 0 20px var(--accent-glow); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
  .btn-ghost { background: none; color: var(--text-muted); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger-ghost { background: none; color: var(--text-muted); border: 1px solid var(--border); }
  .btn-danger-ghost:hover { border-color: var(--danger); color: var(--danger); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-full { width: 100%; }

  /* ─── Toast ─── */
  .toast-wrap { position: fixed; top: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
    animation: slideIn 0.2s ease; display: flex; align-items: center; gap: 8px;
    min-width: 240px; max-width: 360px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .toast-success { background: #0f2a22; border: 1px solid var(--success); color: var(--success); }
  .toast-error { background: #2a0f0f; border: 1px solid var(--danger); color: var(--danger); }
  @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

  /* ─── Cards / Stats ─── */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px 24px;
  }
  .stat-num { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
  .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

  /* ─── Task board area ─── */
  .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-group { display: flex; gap: 6px; }
  .filter-btn {
    padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1px solid var(--border); background: none; color: var(--text-muted);
    font-family: 'Syne', sans-serif; transition: all 0.15s;
  }
  .filter-btn:hover { border-color: var(--accent); color: var(--accent); }
  .filter-btn.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
  .spacer { flex: 1; }

  /* ─── Task list ─── */
  .task-list { display: flex; flex-direction: column; gap: 10px; }
  .task-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px; display: flex; align-items: flex-start; gap: 16px;
    transition: border-color 0.15s, transform 0.1s;
  }
  .task-card:hover { border-color: var(--accent); transform: translateY(-1px); }
  .task-check {
    width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--border);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    flex-shrink: 0; margin-top: 2px; transition: all 0.15s; background: none;
  }
  .task-check.done { background: var(--success); border-color: var(--success); }
  .task-check.in_progress { background: var(--warning); border-color: var(--warning); }
  .task-body { flex: 1; min-width: 0; }
  .task-title { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; }
  .task-title.done-text { text-decoration: line-through; color: var(--text-muted); }
  .task-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }
  .task-meta { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .badge {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    padding: 3px 8px; border-radius: 20px;
  }
  .badge-todo { background: rgba(124,106,247,0.15); color: var(--todo); }
  .badge-in_progress { background: rgba(245,158,11,0.15); color: var(--warning); }
  .badge-done { background: rgba(34,211,160,0.15); color: var(--success); }
  .badge-low { background: rgba(107,107,128,0.15); color: var(--text-muted); }
  .badge-medium { background: rgba(124,106,247,0.15); color: var(--accent); }
  .badge-high { background: rgba(248,113,113,0.15); color: var(--danger); }
  .task-actions { display: flex; gap: 6px; flex-shrink: 0; }

  /* ─── Modal ─── */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 32px; width: 100%; max-width: 480px; position: relative;
  }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 20px; line-height: 1; }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }

  /* ─── Empty state ─── */
  .empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-text { font-size: 15px; font-weight: 600; }
  .empty-sub { font-size: 13px; margin-top: 6px; }

  /* ─── Auth tabs ─── */
  .auth-tabs { display: flex; gap: 0; margin-bottom: 28px; border-bottom: 1px solid var(--border); }
  .auth-tab {
    flex: 1; padding: 10px; text-align: center; cursor: pointer; font-weight: 700;
    font-size: 14px; color: var(--text-muted); border: none; background: none;
    border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: 'Syne', sans-serif;
    transition: all 0.15s;
  }
  .auth-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  /* ─── Pagination ─── */
  .pagination { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 24px; }
  .page-info { font-size: 13px; color: var(--text-muted); font-family: 'DM Mono', monospace; }

  /* ─── Loading ─── */
  .spinner {
    width: 20px; height: 20px; border: 2px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-center { display: flex; align-items: center; justify-content: center; padding: 60px; }
`

// ─── Toast system ────────────────────────────────────────────────────────────
let toastId = 0
function useToasts() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'success') => {
    const id = ++toastId
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return { toasts, toast: add }
}

function Toasts({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─── Auth Page ───────────────────────────────────────────────────────────────
function AuthPage({ onLogin, toast }) {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'login') {
        const data = await api.login({ email: form.email, password: form.password })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        onLogin()
      } else {
        await api.register(form)
        toast('Account created! Please log in.', 'success')
        setTab('login')
      }
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="logo-mark">TF</div>
          <div className="logo-text">TaskFlow</div>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>
        <form onSubmit={submit}>
          {tab === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input id="full_name" value={form.full_name} onChange={set('full_name')} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input id="username" value={form.username} onChange={set('username')} placeholder="your_username" required pattern="[a-zA-Z0-9_]+" />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={8} />
          </div>
          {tab === 'register' && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Password must be 8+ chars with at least one uppercase letter and digit.
            </p>
          )}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose, toast }) {
  const isEdit = !!task?.id
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
  })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = { ...form, due_date: form.due_date ? new Date(form.due_date).toISOString() : null }
      if (!body.description) delete body.description
      if (!body.due_date) delete body.due_date
      if (isEdit) {
        await api.updateTask(task.id, body)
        toast('Task updated', 'success')
      } else {
        await api.createTask(body)
        toast('Task created', 'success')
      }
      onSave()
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Error saving task', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={set('title')} placeholder="What needs to be done?" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={set('description')} placeholder="Optional details..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={set('status')}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date (optional)</label>
            <input type="datetime-local" value={form.due_date} onChange={set('due_date')} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, toast }) {
  const [tasks, setTasks] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 })
  const [filter, setFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | task object

  const load = useCallback(async (page = 1, status = filter) => {
    setLoading(true)
    try {
      const data = await api.getTasks(page, 20, status)
      setTasks(data.items)
      setMeta({ total: data.total, page: data.page, pages: data.pages })
    } catch {
      toast('Failed to load tasks', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { load(1, filter) }, [filter])

  async function toggleStatus(task) {
    const next = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
    try {
      await api.updateTask(task.id, { status: next })
      load(meta.page, filter)
    } catch { toast('Failed to update', 'error') }
  }

  async function deleteTask(task) {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await api.deleteTask(task.id)
      toast('Task deleted', 'success')
      load(meta.page, filter)
    } catch { toast('Failed to delete', 'error') }
  }

  const counts = {
    total: meta.total,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  }

  return (
    <div>
      <h1>My Tasks</h1>
      <p className="subtitle">
        {user.role === 'admin' ? 'Admin view — all users\' tasks' : `Welcome back, ${user.full_name.split(' ')[0]}`}
      </p>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--accent)' }}>{meta.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--warning)' }}>{counts.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--success)' }}>{counts.done}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-group">
          {[null, 'todo', 'in_progress', 'done'].map(s => (
            <button
              key={s ?? 'all'}
              className={`filter-btn ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === null ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>
          + New Task
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No tasks yet</div>
          <div className="empty-sub">Create your first task to get started</div>
        </div>
      ) : (
        <>
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className="task-card">
                <button
                  className={`task-check ${task.status === 'done' ? 'done' : task.status === 'in_progress' ? 'in_progress' : ''}`}
                  onClick={() => toggleStatus(task)}
                  title="Cycle status"
                >
                  {task.status === 'done' && '✓'}
                  {task.status === 'in_progress' && '●'}
                </button>
                <div className="task-body">
                  <div className={`task-title ${task.status === 'done' ? 'done-text' : ''}`}>{task.title}</div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                  <div className="task-meta">
                    <span className={`badge badge-${task.status}`}>
                      {task.status === 'in_progress' ? 'In Progress' : task.status}
                    </span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className="badge" style={{ background: 'rgba(107,107,128,0.1)', color: 'var(--text-muted)' }}>
                        📅 {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="badge" style={{ background: 'rgba(107,107,128,0.1)', color: 'var(--text-muted)' }}>
                        uid:{task.owner_id}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(task)}>Edit</button>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => deleteTask(task)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {meta.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>← Prev</button>
              <span className="page-info">{meta.page} / {meta.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={meta.page >= meta.pages} onClick={() => load(meta.page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onSave={() => { setModal(null); load(meta.page, filter) }}
          onClose={() => setModal(null)}
          toast={toast}
        />
      )}
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user }) {
  return (
    <div>
      <h1>Profile</h1>
      <p className="subtitle">Your account details</p>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 480 }}>
        {[
          ['Full Name', user.full_name],
          ['Username', user.username],
          ['Email', user.email],
          ['Role', user.role],
          ['Member Since', new Date(user.created_at).toLocaleDateString()],
          ['Account Status', user.is_active ? 'Active' : 'Disabled'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ user, page, setPage, onLogout }) {
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-mark">TF</div>
        <div className="logo-text">TaskFlow</div>
      </div>
      <div className="nav-section">
        <div className="nav-label">Menu</div>
        {[
          { id: 'tasks', icon: '▣', label: 'Tasks' },
          { id: 'profile', icon: '◎', label: 'Profile' },
        ].map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <a href="/docs" target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
          <div className="nav-item">
            <span className="nav-icon">⌘</span>
            API Docs
          </div>
        </a>
      </div>
      <div className="user-info">
        <div className="user-name">{user.full_name}</div>
        <div className="user-role">{user.role}</div>
        <button className="btn-logout" onClick={onLogout}>Sign out</button>
      </div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { toasts, toast } = useToasts()
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('tasks')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = CSS
    document.head.appendChild(styleEl)
    return () => document.head.removeChild(styleEl)
  }, [])

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      api.me().then(setUser).catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }).finally(() => setBooting(false))
    } else {
      setBooting(false)
    }
  }, [])

  function handleLogin() {
    api.me().then(u => { setUser(u); toast(`Welcome back, ${u.full_name.split(' ')[0]}!`) })
  }

  function handleLogout() {
    api.logout().catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    toast('Signed out', 'success')
  }

  if (booting) return (
    <div className="loading-center" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <>
      <Toasts toasts={toasts} />
      {!user ? (
        <AuthPage onLogin={handleLogin} toast={toast} />
      ) : (
        <div className="layout">
          <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout} />
          <main className="main">
            {page === 'tasks' && <Dashboard user={user} toast={toast} />}
            {page === 'profile' && <ProfilePage user={user} />}
          </main>
        </div>
      )}
    </>
  )
}
