import React, { useEffect, useState } from 'react'

const statusColor = {
  draft: '#94a3b8',
  sent: '#2563eb',
  paid: '#16a34a',
  overdue: '#dc2626',
  void: '#6b7280'
}

const btn = (color = '#2563eb') => ({
  padding: '6px 14px', background: color, color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
})

function fmt(amount) {
  return `Rp ${parseFloat(amount || 0).toLocaleString('id-ID')}`
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [detail, setDetail] = useState(null)

  const load = () => {
    Promise.all([
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/projects').then(r => r.json())
    ]).then(([inv, proj]) => {
      setInvoices(inv.data || [])
      setProjects(proj.data || [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function createInvoice() {
    if (!selectedProject) return
    setCreating(true)
    const res = await fetch(`/api/invoices/from-project/${selectedProject}`, { method: 'POST' })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) { alert(data.message); return }
    setSelectedProject('')
    load()
  }

  async function updateStatus(id, status) {
    await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    load()
    if (detail?.id === id) {
      const res = await fetch(`/api/invoices/${id}`)
      const d = await res.json()
      setDetail(d.data)
    }
  }

  async function sendInvoice(id) {
    const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { alert(data.message); return }
    load()
    if (detail?.id === id) setDetail(data.data)
  }

  async function openDetail(id) {
    const res = await fetch(`/api/invoices/${id}`)
    const d = await res.json()
    setDetail(d.data)
  }

  if (loading) return <p style={{ color: '#64748b' }}>Loading...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Invoices</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button style={btn()} onClick={createInvoice} disabled={!selectedProject || creating}>
            {creating ? 'Creating...' : '+ Create Invoice'}
          </button>
        </div>
      </div>

      {invoices.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: '60px', color: '#64748b' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No invoices yet</p>
          <p style={{ fontSize: '13px' }}>Select a project above and click "Create Invoice" to generate one from completed tasks.</p>
        </div>
      )}

      {invoices.map(inv => (
        <div key={inv.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => openDetail(inv.id)}>
              <p style={{ fontWeight: 600, color: '#2563eb' }}>{inv.invoice_number}</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {inv.client_name} · {inv.project_name}
              </p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Due {inv.due_at}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '15px' }}>{fmt(inv.total)}</p>
              <span style={{ background: statusColor[inv.status] || '#6b7280', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>
                {inv.status}
              </span>
              {inv.status === 'draft' && (
                <button style={btn('#0ea5e9')} onClick={() => sendInvoice(inv.id)}>Send</button>
              )}
              {inv.status === 'sent' && (
                <button style={btn('#16a34a')} onClick={() => updateStatus(inv.id, 'paid')}>Mark Paid</button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{detail.invoice_number}</h2>
                <p style={{ color: '#64748b', fontSize: '13px' }}>{detail.project_name} · {detail.client_name}</p>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Status</span>
                <span style={{ background: statusColor[detail.status], color: '#fff', borderRadius: '4px', padding: '1px 8px' }}>{detail.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Issued</span><span>{detail.issued_at}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Due</span><span>{detail.due_at}</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '13px' }}>Description</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{item.description}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px' }}>{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: '12px 8px', fontWeight: 700 }}>Total</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: '#2563eb' }}>{fmt(detail.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <a
                href={`/api/invoices/${detail.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                style={{ ...btn('#475569'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                ↓ PDF
              </a>
              {detail.status === 'draft' && (
                <button style={btn('#0ea5e9')} onClick={() => sendInvoice(detail.id)}>Send to Client</button>
              )}
              {detail.status === 'sent' && (
                <button style={btn('#16a34a')} onClick={() => updateStatus(detail.id, 'paid')}>Mark as Paid</button>
              )}
              {!['void', 'paid'].includes(detail.status) && (
                <button style={btn('#dc2626')} onClick={() => { updateStatus(detail.id, 'void'); setDetail(null) }}>Void</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
