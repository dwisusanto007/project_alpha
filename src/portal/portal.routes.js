const router = require('express').Router()
const { requestMagicLink, verifyMagicLink } = require('./portal.auth')
const { portalAuth } = require('./portal.middleware')
const ctrl = require('./portal.controller')

router.post('/auth/send-link', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: true, message: 'email is required', statusCode: 400 })
    }
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`
    const result = await requestMagicLink(email, baseUrl)
    if (!result) {
      return res.status(404).json({ error: true, message: 'No client found with that email', statusCode: 404 })
    }
    res.json({ message: 'Magic link sent' })
  } catch (err) {
    next(err)
  }
})

router.get('/auth/verify', async (req, res, next) => {
  try {
    const { token } = req.query
    if (!token) {
      return res.status(400).json({ error: true, message: 'token is required', statusCode: 400 })
    }
    const result = await verifyMagicLink(token)
    if (result.error) {
      const messages = {
        invalid: 'Invalid token',
        used: 'Token already used',
        expired: 'Token has expired'
      }
      return res.status(result.status).json({
        error: true,
        message: messages[result.error],
        statusCode: result.status
      })
    }
    res.cookie('portal_token', result.jwtToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.redirect('/portal')
  } catch (err) {
    next(err)
  }
})

router.get('/auth/me', portalAuth, (req, res) => {
  res.json({ data: { clientId: req.client.clientId, email: req.client.email } })
})

router.post('/auth/logout', (req, res) => {
  res.clearCookie('portal_token', { httpOnly: true, sameSite: 'lax' })
  res.json({ message: 'Logged out' })
})

router.get('/projects', portalAuth, ctrl.listProjects)
router.get('/projects/:id', portalAuth, ctrl.getProject)
router.post('/projects/:id/approve', portalAuth, ctrl.approveProject)

module.exports = router
