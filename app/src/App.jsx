import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import ProjectSummary from './pages/ProjectSummary'
import Invoices from './pages/Invoices'
import Login from './pages/Login'

function AuthGuard({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
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

  if (checking) return <div style={{ padding: '40px', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
  if (!authed) return null
  return children
}

function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', maxWidth: '900px' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <AuthGuard>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/clients" replace />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/projects/:id/summary" element={<ProjectSummary />} />
                <Route path="/invoices" element={<Invoices />} />
              </Routes>
            </DashboardLayout>
          </AuthGuard>
        } />
      </Routes>
    </BrowserRouter>
  )
}
