import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ProgressBar({ percent }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
      <div style={{ width: `${percent}%`, background: '#2563eb', height: '100%', transition: 'width 0.3s' }} />
    </div>
  )
}

const statusColors = { active: '#2563eb', completed: '#16a34a', on_hold: '#d97706' }

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/portal/projects')
      .then(res => { if (res.status === 401) { navigate('/login'); return null } return res.json() })
      .then(data => { if (data) setProjects(data.data) })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) return <p style={{ color: '#666', paddingTop: '40px' }}>Loading...</p>

  if (projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</p>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>You're all caught up</h2>
        <p style={{ color: '#666' }}>No active projects right now.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Your Projects</h1>
      {projects.map(p => (
        <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
          style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '18px' }}>{p.name}</h2>
            <span style={{ background: statusColors[p.status] || '#6b7280', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>{p.status}</span>
          </div>
          {p.deadline && <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>Due {p.deadline}</p>}
          <ProgressBar percent={p.progress_percent} />
          <p style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>{p.completed_task_count}/{p.task_count} tasks done — {p.progress_percent}%</p>
          {p.approved_at && <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '4px' }}>✓ Approved</p>}
        </div>
      ))}
    </div>
  )
}
