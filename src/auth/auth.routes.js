const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { body, validationResult } = require('express-validator')

const router = express.Router()

const DEV_EMAIL = process.env.DEV_EMAIL
const DEV_PASSWORD = process.env.DEV_PASSWORD
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Constant-time comparison to prevent timing attacks
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg, statusCode: 400 })
    }

    const { email, password } = req.body

    if (!DEV_EMAIL || !DEV_PASSWORD) {
      return res.status(500).json({ error: true, message: 'Auth not configured — set DEV_EMAIL and DEV_PASSWORD in .env', statusCode: 500 })
    }

    const emailMatch = safeCompare(email.toLowerCase(), DEV_EMAIL.toLowerCase())
    const passwordMatch = safeCompare(password, DEV_PASSWORD)

    if (!emailMatch || !passwordMatch) {
      return res.status(401).json({ error: true, message: 'Invalid email or password', statusCode: 401 })
    }

    const token = jwt.sign({ email: DEV_EMAIL, role: 'developer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.cookie('dev_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({ data: { email: DEV_EMAIL } })
  }
)

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('dev_token')
  res.json({ message: 'Logged out' })
})

// GET /api/auth/me — returns current user or 401
router.get('/me', (req, res) => {
  const token = req.cookies.dev_token
  if (!token) {
    return res.status(401).json({ error: true, message: 'Not authenticated', statusCode: 401 })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ data: { email: payload.email, role: payload.role } })
  } catch {
    res.clearCookie('dev_token')
    res.status(401).json({ error: true, message: 'Session expired', statusCode: 401 })
  }
})

module.exports = router
