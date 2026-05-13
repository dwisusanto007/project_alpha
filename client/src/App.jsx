import React, { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'

function AuthGuard({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/portal/auth/me')
      .then(res => {
        if (res.ok) {
          setAuthed(true)
        } else {
          navigate('/login', { replace: true, state: { from: location.pathname } })
        }
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setChecking(false))
  }, [navigate, location.pathname])

  if (checking) return <div style={{ padding: '80px 0', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
  if (!authed) return null
  return children
}

function PortalLayout({ children }) {
  const navigate = useNavigate()

  const handleLogout = useCallback(async () => {
    await fetch('/portal/auth/logout', { method: 'POST' })
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', letterSpacing: '-0.2px' }}>Client Portal</span>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', fontSize: '13px', color: '#9ca3af', cursor: 'pointer', padding: 0 }}
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  )
}

export default function App() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: '720px', margin: '0 auto', padding: '24px 16px', color: '#1a1a1a' }}>
      <BrowserRouter basename="/portal">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <AuthGuard>
              <PortalLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/projects" replace />} />
                  <Route path="/projects" element={<ProjectList />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                </Routes>
              </PortalLayout>
            </AuthGuard>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
