const request = require('supertest')
const app = require('../app')
const knex = require('../db/knex')
const jwt = require('jsonwebtoken')

let testClient

beforeEach(async () => {
  await knex('magic_link_tokens').del()
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()
  const [client] = await knex('clients')
    .insert({ name: 'Portal Client', email: 'portal@test.com' })
    .returning('*')
  testClient = client
})

function makePortalCookie(clientId, email) {
  const token = jwt.sign(
    { clientId, email },
    process.env.PORTAL_JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  )
  return `portal_token=${token}`
}

describe('POST /portal/auth/send-link', () => {
  it('returns 200 for existing client email', async () => {
    const res = await request(app)
      .post('/portal/auth/send-link')
      .send({ email: 'portal@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Magic link sent')
  })

  it('returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/portal/auth/send-link')
      .send({ email: 'nobody@test.com' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/portal/auth/send-link')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /portal/auth/verify', () => {
  it('sets cookie and redirects for valid token', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await knex('magic_link_tokens').insert({
      client_id: testClient.id,
      token: 'valid-test-token',
      expires_at: expiresAt,
      used: false
    })
    const res = await request(app).get('/portal/auth/verify?token=valid-test-token')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/portal')
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 400 for already used token', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await knex('magic_link_tokens').insert({
      client_id: testClient.id,
      token: 'used-token',
      expires_at: expiresAt,
      used: true
    })
    const res = await request(app).get('/portal/auth/verify?token=used-token')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 410 for expired token', async () => {
    const expiresAt = new Date(Date.now() - 1000)
    await knex('magic_link_tokens').insert({
      client_id: testClient.id,
      token: 'expired-token',
      expires_at: expiresAt,
      used: false
    })
    const res = await request(app).get('/portal/auth/verify?token=expired-token')
    expect(res.status).toBe(410)
  })

  it('returns 400 for invalid token', async () => {
    const res = await request(app).get('/portal/auth/verify?token=does-not-exist')
    expect(res.status).toBe(400)
  })
})

describe('GET /portal/projects', () => {
  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/portal/projects')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe(true)
  })

  it('returns client projects with progress stats', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'Test Project' })
      .returning('*')
    await knex('tasks').insert([
      { project_id: project.id, title: 'Task 1', status: 'done' },
      { project_id: project.id, title: 'Task 2', status: 'todo' }
    ])
    const res = await request(app)
      .get('/portal/projects')
      .set('Cookie', makePortalCookie(testClient.id, testClient.email))
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].progress_percent).toBe(50)
    expect(res.body.data[0].task_count).toBe(2)
    expect(res.body.data[0].completed_task_count).toBe(1)
  })
})

describe('POST /portal/projects/:id/approve', () => {
  it('approves a project and returns updated data', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'To Approve' })
      .returning('*')
    const res = await request(app)
      .post(`/portal/projects/${project.id}/approve`)
      .set('Cookie', makePortalCookie(testClient.id, testClient.email))
    expect(res.status).toBe(200)
    expect(res.body.data.approved_at).not.toBeNull()
    expect(res.body.data.approved_by).toBe(testClient.id)
  })

  it('returns 401 without cookie', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'No Auth' })
      .returning('*')
    const res = await request(app).post(`/portal/projects/${project.id}/approve`)
    expect(res.status).toBe(401)
  })
})
