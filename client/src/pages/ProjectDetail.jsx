import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const statusColor = { todo: '#6b7280', in_progress: '#2563eb', done: '#16a34a' }
const priorityColor = { low: '#6b7280', medium: '#d97706', high: '#dc2626' }

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    fetch(`/portal/projects/${id}`)
      .then(res => {
        if (res.status === 401) { navigate('/login'); return null }
        if (res.status === 404) { navigate('/projects'); return null }
        return res.json()
      })
      .then(data => { if (data) setProject(data.data) })
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await fetch(`/portal/projects/${id}/approve`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setProject(data.data)
    } finally {
      setApproving(false)
    }
  }

  if (loading) return <p style={{ color: '#666', paddingTop: '40px' }}>Loading...</p>
  if (!project) return null

  const tasks = project.tasks || []
  const done = tasks.filter(t => t.status === 'done').length
  const percent = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
  const totalValue = parseFloat(project.total_value || 0)
  const completedValue = parseFloat(project.completed_value || 0)
  const fmt = (n) => n > 0 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : null

  return (
    <div>
      <button onClick={() => navigate('/projects')}
        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '0 0 20px 0', fontSize: '14px' }}>
        ← Back to projects
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px' }}>{project.name}</h1>
        {!project.approved_at ? (
          <button onClick={handleApprove} disabled={approving}
            style={{ padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            {approving ? 'Approving...' : 'Approve project'}
          </button>
        ) : (
          <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Approved</span>
        )}
      </div>
      {project.description && <p style={{ color: '#666', marginBottom: '16px' }}>{project.description}</p>}
      <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', margin: '16px 0 4px', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, background: '#2563eb', height: '100%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{done}/{tasks.length} tasks done</p>
        {totalValue > 0 && (
          <p style={{ fontSize: '13px', margin: 0, color: '#374151' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(completedValue)}</span>
            <span style={{ color: '#9ca3af' }}> / {fmt(totalValue)}</span>
          </p>
        )}
      </div>
      <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Tasks</h2>
      {tasks.length === 0 && <p style={{ color: '#666' }}>No tasks yet.</p>}
      {tasks.map(t => (
        <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: t.status === 'done' ? 400 : 500, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#9ca3af' : '#1a1a1a', marginBottom: t.due_date ? '4px' : 0 }}>{t.title}</p>
            {t.due_date && <p style={{ color: '#9ca3af', fontSize: '12px' }}>Due {t.due_date}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {fmt(parseFloat(t.price || 0)) && (
              <span style={{ fontSize: '13px', fontWeight: 500, color: t.status === 'done' ? '#16a34a' : '#374151' }}>
                {fmt(parseFloat(t.price || 0))}
              </span>
            )}
            <span style={{ fontSize: '12px', color: priorityColor[t.priority] || '#6b7280' }}>{t.priority}</span>
            <span style={{ fontSize: '12px', background: statusColor[t.status] || '#6b7280', color: '#fff', borderRadius: '4px', padding: '2px 6px' }}>{t.status}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
