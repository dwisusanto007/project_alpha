import React, { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/portal/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Something went wrong'); setStatus('error'); return }
      setStatus('sent')
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ textAlign: 'center', paddingTop: '80px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Check your email</h1>
        <p style={{ color: '#666' }}>We sent a magic link to <strong>{email}</strong>. Click it to access your portal.</p>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '80px', maxWidth: '360px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Client Portal</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Enter your email to receive a login link.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required
          style={{ width: '100%', padding: '10px 14px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '12px' }}
        />
        {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
        <button type="submit" disabled={status === 'loading'}
          style={{ width: '100%', padding: '10px', fontSize: '16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {status === 'loading' ? 'Sending...' : 'Send magic link'}
        </button>
      </form>
    </div>
  )
}
