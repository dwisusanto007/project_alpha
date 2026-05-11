import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'

const btn = (color = '#2563eb') => ({
  padding: '7px 16px', background: color, color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
})
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px' }
const statusColor = { active: '#2563eb', completed: '#16a34a', on_hold: '#d97706' }

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ client_id: '', name: '', description: '', status: 'active', deadline: '' })
  const navigate = useNavigate()

  const load = () => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data))
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.data))
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ client_id: '', name: '', description: '', status: 'active', deadline: '' }); setModal('create') }
  function openEdit(p) {
    setForm({ client_id: p.client_id, name: p.name, description: p.description || '', status: p.status, deadline: p.deadline ? p.deadline.split('T')[0] : '' })
    setModal(p)
  }

  async function save() {
    const isEdit = modal !== 'create'
    const body = { ...form }
    if (!body.deadline) delete body.deadline
    await fetch(isEdit ? `/api/projects/${modal.id}` : '/api/projects', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setModal(null); load()
  }

  async function del(id) {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    load()
  }

  const clientName = id => clients.find(c => c.id === id)?.name || '—'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Projects</h1>
        <button style={btn()} onClick={openCreate}>+ New Project</button>
      </div>

      {projects.length === 0 && <p style={{ color: '#64748b' }}>No projects yet.</p>}

      {projects.map(p => (
        <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 600 }}>{p.name}</p>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                {clientName(p.client_id)}{p.deadline ? ` · Due ${p.deadline.split('T')[0]}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: statusColor[p.status] || '#6b7280', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>{p.status}</span>
              <button style={btn('#0ea5e9')} onClick={() => navigate(`/projects/${p.id}/summary`)}>Summary</button>
              <button style={btn('#475569')} onClick={() => openEdit(p)}>Edit</button>
              <button style={btn('#dc2626')} onClick={() => del(p.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={modal === 'create' ? 'New Project' : 'Edit Project'} onClose={() => setModal(null)}>
          <select style={{ ...inp }} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Select client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input style={inp} placeholder="Project name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inp} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <select style={{ ...inp }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
          <input style={inp} type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={btn('#475569')} onClick={() => setModal(null)}>Cancel</button>
            <button style={btn()} onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
