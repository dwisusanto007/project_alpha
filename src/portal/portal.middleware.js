const jwt = require('jsonwebtoken')

function portalAuth(req, res, next) {
  const token = req.cookies && req.cookies.portal_token
  if (!token) {
    return res.status(401).json({ error: true, message: 'Unauthorized', statusCode: 401 })
  }
  try {
    req.client = jwt.verify(token, process.env.PORTAL_JWT_SECRET || 'dev-secret')
    next()
  } catch {
    return res.status(401).json({ error: true, message: 'Unauthorized', statusCode: 401 })
  }
}

module.exports = { portalAuth }
