const request = require('supertest')
const app = require('../app')
const knex = require('../db/knex')

beforeEach(async () => {
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()
})

describe('POST /api/clients', () => {
  it('creates a client with valid data', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ name: 'Acme Corp', email: 'acme@example.com', company: 'Acme' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ name: 'Acme Corp', email: 'acme@example.com' })
    expect(res.body.data.id).toBeDefined()
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ email: 'test@example.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ name: 'Test Client' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/clients', () => {
  it('returns list of clients', async () => {
    await knex('clients').insert([
      { name: 'Client A', email: 'a@test.com' },
      { name: 'Client B', email: 'b@test.com' }
    ])
    const res = await request(app).get('/api/clients')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(2)
  })

  it('returns empty list when no clients', async () => {
    const res = await request(app).get('/api/clients')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })
})

describe('GET /api/clients/:id', () => {
  it('returns a client by id', async () => {
    const [client] = await knex('clients')
      .insert({ name: 'Test', email: 't@test.com' })
      .returning('*')
    const res = await request(app).get(`/api/clients/${client.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(client.id)
  })

  it('returns 404 for non-existent client', async () => {
    const res = await request(app).get('/api/clients/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('PUT /api/clients/:id', () => {
  it('updates a client', async () => {
    const [client] = await knex('clients')
      .insert({ name: 'Old Name', email: 'old@test.com' })
      .returning('*')
    const res = await request(app)
      .put(`/api/clients/${client.id}`)
      .send({ name: 'New Name' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('New Name')
  })

  it('returns 404 when updating non-existent client', async () => {
    const res = await request(app)
      .put('/api/clients/00000000-0000-0000-0000-000000000000')
      .send({ name: 'X' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('DELETE /api/clients/:id', () => {
  it('deletes a client', async () => {
    const [client] = await knex('clients')
      .insert({ name: 'Del Client', email: 'del@test.com' })
      .returning('*')
    const res = await request(app).delete(`/api/clients/${client.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 when deleting non-existent client', async () => {
    const res = await request(app).delete('/api/clients/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/clients/:id/projects', () => {
  it('returns projects for a client', async () => {
    const [client] = await knex('clients')
      .insert({ name: 'Client P', email: 'cp@test.com' })
      .returning('*')
    await knex('projects').insert([
      { client_id: client.id, name: 'Project 1' },
      { client_id: client.id, name: 'Project 2' }
    ])
    const res = await request(app).get(`/api/clients/${client.id}/projects`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(2)
  })

  it('returns 404 for non-existent client', async () => {
    const res = await request(app).get('/api/clients/00000000-0000-0000-0000-000000000000/projects')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})
