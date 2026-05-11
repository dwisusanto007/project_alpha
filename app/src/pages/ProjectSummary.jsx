import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ProjectSummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${id}/summary`)
      .then(r => r.json())
      .then(d => setSummary(d.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p style={{ color: '#64748b' }}>Loading...</p>
  if (!summary) return <p style={{ color: '#dc2626' }}>Project not found.</p>

  return (
    <div>
      <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', padding: '0 0 20px 0' }}>
        ← Back to Projects
      </button>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{summary.project_name}</h1>
      <p style={{ color: '#64748b', marginBottom: '28px' }}>Project Summary</p>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px 24px', flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#16a34a' }}>{summary.task_count}</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Completed Tasks</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px 24px', flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#2563eb' }}>${summary.total_value.toLocaleString()}</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Total Value</p>
        </div>
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Completed Tasks</h2>
      {summary.completed_tasks.length === 0 && <p style={{ color: '#64748b' }}>No completed tasks yet.</p>}
      {summary.completed_tasks.map(t => (
        <div key={t.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 500 }}>{t.title}</p>
          <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '15px' }}>
            {parseFloat(t.price) > 0 ? `$${parseFloat(t.price).toLocaleString()}` : '—'}
          </p>
        </div>
      ))}
    </div>
  )
}
