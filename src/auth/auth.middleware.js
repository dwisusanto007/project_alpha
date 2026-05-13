const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'

function devAuth(req, res, next) {
  const token = req.cookies.dev_token
  if (!token) {
    return res.status(401).json({ error: true, message: 'Authentication required', statusCode: 401 })
  }
  try {
    req.developer = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.clearCookie('dev_token')
    return res.status(401).json({ error: true, message: 'Session expired', statusCode: 401 })
  }
}

module.exports = { devAuth }
