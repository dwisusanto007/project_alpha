import React from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/clients', label: 'Clients' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/invoices', label: 'Invoices' },
]

export default function Sidebar() {
  return (
    <aside style={{ width: '200px', background: '#1e293b', minHeight: '100vh', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 700 }}>Project Alpha</h1>
        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Developer Dashboard</p>
      </div>
      <nav style={{ padding: '16px 0' }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} style={({ isActive }) => ({
            display: 'block',
            padding: '10px 20px',
            color: isActive ? '#f8fafc' : '#94a3b8',
            background: isActive ? '#334155' : 'transparent',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: isActive ? 600 : 400,
          })}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
