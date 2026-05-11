import React, { useEffect, useState } from 'react'
import Modal from '../components/Modal'

const btn = (color = '#2563eb') => ({
  padding: '7px 14px', background: color, color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
})
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px' }
const statusColor = { todo: '#6b7280', in_progress: '#2563eb', done: '#16a34a' }
const priorityColor = { low: '#6b7280', medium: '#d97706', high: '#dc2626' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ project_id: '', title: '', status: 'todo', priority: 'medium', due_date: '', price: '' })

  const load = () => {
    fetch('/api/tasks').then(r => r.json()).then(d => setTasks(d.data))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data))
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ project_id: '', title: '', status: 'todo', priority: 'medium', due_date: '', price: '' }); setModal('create') }
  function openEdit(t) {
    setForm({ project_id: t.project_id, title: t.title, status: t.status, priority: t.priority, due_date: t.due_date ? t.due_date.split('T')[0] : '', price: t.price ?? '' })
    setModal(t)
  }

  async function save() {
    const isEdit = modal !== 'create'
    const body = { ...form, price: form.price === '' ? 0 : parseFloat(form.price) }
    if (!body.due_date) delete body.due_date
    await fetch(isEdit ? `/api/tasks/${modal.id}` : '/api/tasks', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setModal(null); load()
  }

  async function markDone(t) {
    await fetch(`/api/tasks/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) })
    load()
  }

  async function del(id) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    load()
  }

  const projectName = id => projects.find(p => p.id === id)?.name || '—'
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Tasks</h1>
        <button style={btn()} onClick={openCreate}>+ New Task</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'todo', 'in_progress', 'done'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: filter === s ? '#1e293b' : '#fff', color: filter === s ? '#fff' : '#475569', cursor: 'pointer', fontSize: '13px' }}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p style={{ color: '#64748b' }}>No tasks.</p>}

      {filtered.map(t => (
        <div key={t.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#94a3b8' : '#1a1a1a' }}>{t.title}</p>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>
              {projectName(t.project_id)} · <span style={{ color: priorityColor[t.priority] }}>{t.priority}</span>
              {parseFloat(t.price) > 0 ? ` · $${parseFloat(t.price).toLocaleString()}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', background: statusColor[t.status], color: '#fff', borderRadius: '4px', padding: '2px 7px' }}>{t.status}</span>
            {t.status !== 'done' && <button style={btn('#16a34a')} onClick={() => markDone(t)}>✓ Done</button>}
            <button style={btn('#475569')} onClick={() => openEdit(t)}>Edit</button>
            <button style={btn('#dc2626')} onClick={() => del(t.id)}>Del</button>
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={modal === 'create' ? 'New Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <select style={{ ...inp }} value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
            <option value="">Select project *</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input style={inp} placeholder="Task title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input style={inp} placeholder="Price (e.g. 500)" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select style={{ ...inp, marginBottom: 0, flex: 1 }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select style={{ ...inp, marginBottom: 0, flex: 1 }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <input style={inp} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={btn('#475569')} onClick={() => setModal(null)}>Cancel</button>
            <button style={btn()} onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
