const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const { devAuth } = require('./auth/auth.middleware')

const app = express()
app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Auth routes (public — no devAuth middleware)
app.use('/api/auth', require('./auth/auth.routes'))

// API routes (protected by devAuth)
app.use('/api/clients', devAuth, require('./clients/client.routes'))
app.use('/api/projects', devAuth, require('./projects/project.routes'))
app.use('/api/tasks', devAuth, require('./tasks/task.routes'))
app.use('/api/timesheets', devAuth, require('./timesheets/timesheet.routes'))
app.use('/api/invoices', devAuth, require('./invoices/invoice.routes'))

// Portal API routes (must come before static file serving)
app.use('/portal', require('./portal/portal.routes'))

// Serve client portal SPA (client/dist/)
const clientDist = path.join(__dirname, '..', 'client', 'dist')
app.use('/portal', express.static(clientDist))
app.get('/portal/*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

// Serve developer dashboard SPA (app/dist/)
const appDist = path.join(__dirname, '..', 'app', 'dist')
app.use('/app', express.static(appDist))
app.get(['/app', '/app/*'], (req, res) => {
  res.sendFile(path.join(appDist, 'index.html'))
})

app.use((err, req, res, _next) => {
  const status = err.statusCode || 500
  const message = status < 500 ? err.message : 'Internal server error'
  res.status(status).json({ error: true, message, statusCode: status })
})

module.exports = app
