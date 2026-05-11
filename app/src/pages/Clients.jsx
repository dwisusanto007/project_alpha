import React, { useEffect, useState } from 'react'
import Modal from '../components/Modal'

const btn = (color = '#2563eb') => ({
  padding: '7px 16px', background: color, color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
})
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', company: '' })

  const load = () => fetch('/api/clients').then(r => r.json()).then(d => setClients(d.data))
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ name: '', email: '', company: '' }); setModal('create') }
  function openEdit(c) { setForm({ name: c.name, email: c.email, company: c.company || '' }); setModal(c) }

  async function save() {
    const isEdit = modal !== 'create'
    await fetch(isEdit ? `/api/clients/${modal.id}` : '/api/clients', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setModal(null); load()
  }

  async function del(id) {
    if (!confirm('Delete this client?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Clients</h1>
        <button style={btn()} onClick={openCreate}>+ New Client</button>
      </div>

      {clients.length === 0 && <p style={{ color: '#64748b' }}>No clients yet.</p>}

      {clients.map(c => (
        <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600 }}>{c.name}</p>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{c.email}{c.company ? ` · ${c.company}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={btn('#475569')} onClick={() => openEdit(c)}>Edit</button>
            <button style={btn('#dc2626')} onClick={() => del(c.id)}>Delete</button>
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={modal === 'create' ? 'New Client' : 'Edit Client'} onClose={() => setModal(null)}>
          <input style={inp} placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inp} placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input style={inp} placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={btn('#475569')} onClick={() => setModal(null)}>Cancel</button>
            <button style={btn()} onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
