const request = require('supertest')
const app = require('../app')

beforeAll(() => {
  process.env.DEV_EMAIL = 'dev@test.com'
  process.env.DEV_PASSWORD = 'testpassword123'
})

describe('POST /api/auth/login', () => {
  it('sets dev_token cookie on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@test.com', password: 'testpassword123' })
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('dev@test.com')
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.headers['set-cookie'][0]).toMatch(/dev_token=/)
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@test.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe(true)
  })

  it('returns 401 for wrong email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'testpassword123' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@test.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns user data with valid cookie', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@test.com', password: 'testpassword123' })
    const cookie = login.headers['set-cookie'][0]

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('dev@test.com')
    expect(res.body.data.role).toBe('developer')
  })
})

describe('POST /api/auth/logout', () => {
  it('clears dev_token cookie', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
    expect(res.headers['set-cookie'][0]).toMatch(/dev_token=;/)
  })
})

describe('API routes protected by devAuth', () => {
  it('GET /api/clients returns 401 without token', async () => {
    const res = await request(app).get('/api/clients')
    expect(res.status).toBe(401)
  })

  it('GET /api/clients returns 200 with valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@test.com', password: 'testpassword123' })
    const cookie = login.headers['set-cookie'][0]

    const res = await request(app)
      .get('/api/clients')
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
  })
})
