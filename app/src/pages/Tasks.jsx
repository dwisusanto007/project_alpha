import React, { useEffect, useState, useRef } from 'react'
import Modal from '../components/Modal'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
  { id: 'in_progress', label: 'In Progress',  color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { id: 'blocked',     label: 'Blocked',      color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { id: 'done',        label: 'Done',         color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
]

const PRIORITY_COLOR = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444' }

function fmt(price) {
  const n = parseFloat(price || 0)
  if (n === 0) return null
  return `Rp ${n.toLocaleString('id-ID')}`
}

function TaskCard({ task, projectName, onEdit, onDragStart, onDragEnd }) {
  const price = fmt(task.price)
  const isDone = task.status === 'done'
  const [hovered, setHovered] = useState(false)

  const due = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const isOverdue = task.due_date && task.status !== 'done' && task.status !== 'blocked' && new Date(task.due_date) < new Date()

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#cbd5e1' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        marginBottom: '8px',
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: hovered ? '0 2px 10px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.12s, border-color 0.12s, transform 0.1s',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <p style={{
          fontWeight: 500,
          fontSize: '13.5px',
          color: isDone ? '#94a3b8' : '#1e293b',
          textDecoration: isDone ? 'line-through' : 'none',
          lineHeight: 1.4,
          flex: 1,
          margin: 0,
        }}>
          {task.title}
        </p>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: PRIORITY_COLOR[task.priority],
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          flexShrink: 0,
          marginTop: '2px',
        }}>
          {task.priority}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '11px',
          color: '#94a3b8',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '120px',
        }}>
          {projectName}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {due && (
            <span style={{ fontSize: '11px', color: isOverdue ? '#ef4444' : '#94a3b8' }}>
              {isOverdue ? '⚠ ' : ''}{due}
            </span>
          )}
          {price && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: isDone ? '#16a34a' : '#475569' }}>
              {price}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks]                 = useState([])
  const [projects, setProjects]           = useState([])
  const [filterProject, setFilterProject] = useState('all')
  const [modal, setModal]                 = useState(null)
  const [form, setForm]                   = useState({
    project_id: '', title: '', status: 'todo', priority: 'medium', due_date: '', price: '',
  })
  const [dragOverCol, setDragOverCol]     = useState(null)
  const [dragging, setDragging]           = useState(false)
  const dragTaskId                        = useRef(null)

  const load = () => {
    fetch('/api/tasks').then(r => r.json()).then(d => setTasks(d.data || []))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data || []))
  }
  useEffect(() => { load() }, [])

  function openCreate(status = 'todo') {
    setForm({ project_id: '', title: '', status, priority: 'medium', due_date: '', price: '' })
    setModal('create')
  }

  function openEdit(t) {
    setForm({
      project_id: t.project_id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ? t.due_date.split('T')[0] : '',
      price: t.price ?? '',
    })
    setModal(t)
  }

  async function save() {
    const isEdit = modal !== 'create'
    const body = { ...form, price: form.price === '' ? 0 : parseFloat(form.price) }
    if (!body.due_date) delete body.due_date
    await fetch(isEdit ? `/api/tasks/${modal.id}` : '/api/tasks', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setModal(null)
    load()
  }

  async function del() {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${modal.id}`, { method: 'DELETE' })
    setModal(null)
    load()
  }

  async function moveTask(taskId, newStatus) {
    // Optimistic update so board feels instant
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const projectName = id => projects.find(p => p.id === id)?.name || '—'
  const visible     = filterProject === 'all' ? tasks : tasks.filter(t => t.project_id === filterProject)
  const byCol       = colId => visible.filter(t => t.status === colId)

  const inp = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box',
  }
  const btn = (color = '#2563eb') => ({
    padding: '7px 14px', background: color, color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Tasks</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#475569', background: '#fff' }}
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button style={btn()} onClick={() => openCreate()}>+ New Task</button>
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{ display: 'flex', gap: '14px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {COLUMNS.map(col => {
          const colTasks = byCol(col.id)
          const isOver   = dragOverCol === col.id && dragging

          return (
            <div
              key={col.id}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id) }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null)
              }}
              onDrop={async e => {
                e.preventDefault()
                setDragOverCol(null)
                setDragging(false)
                if (dragTaskId.current) {
                  await moveTask(dragTaskId.current, col.id)
                  dragTaskId.current = null
                }
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: col.bg,
                borderRadius: '8px 8px 0 0',
                borderTop: `3px solid ${col.color}`,
                borderLeft: `1px solid ${col.border}`,
                borderRight: `1px solid ${col.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '11px',
                    color: col.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}>
                    {col.label}
                  </span>
                  <span style={{
                    background: col.color,
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 7px',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openCreate(col.id)}
                  style={{
                    background: 'none',
                    border: `1px solid ${col.border}`,
                    borderRadius: '4px',
                    color: col.color,
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                    padding: '1px 6px',
                  }}
                  title={`Add to ${col.label}`}
                >
                  +
                </button>
              </div>

              {/* Drop zone */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 10px 16px',
                background: isOver ? '#e0f2fe' : '#f1f5f9',
                border: `1px solid ${isOver ? '#38bdf8' : col.border}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                transition: 'background 0.15s, border-color 0.15s',
              }}>
                {colTasks.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    paddingTop: '28px',
                    color: isOver ? '#0ea5e9' : '#cbd5e1',
                    fontSize: '13px',
                    pointerEvents: 'none',
                  }}>
                    {isOver ? '↓ Drop here' : 'No tasks'}
                  </div>
                )}
                {colTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    projectName={projectName(t.project_id)}
                    onEdit={openEdit}
                    onDragStart={() => { dragTaskId.current = t.id; setDragging(true) }}
                    onDragEnd={() => { setDragging(false); setDragOverCol(null) }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'New Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <select style={inp} value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
            <option value="">Select project *</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <input
            style={inp}
            placeholder="Task title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />

          <input
            style={inp}
            placeholder="Price (e.g. 500000)"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select style={{ ...inp, marginBottom: 0, flex: 1 }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
            <select style={{ ...inp, marginBottom: 0, flex: 1 }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <input
            style={inp}
            type="date"
            value={form.due_date}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
            <div>
              {modal !== 'create' && (
                <button style={btn('#dc2626')} onClick={del}>Delete</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={btn('#475569')} onClick={() => setModal(null)}>Cancel</button>
              <button
                style={{ ...btn(), opacity: (!form.title || !form.project_id) ? 0.5 : 1 }}
                onClick={save}
                disabled={!form.title || !form.project_id}
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
