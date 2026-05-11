const request = require('supertest')
const app = require('../app')
const knex = require('../db/knex')

let testClient

beforeEach(async () => {
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()
  const [client] = await knex('clients')
    .insert({ name: 'Test Client', email: 'tc@test.com' })
    .returning('*')
  testClient = client
})

describe('POST /api/projects', () => {
  it('creates a project with valid data', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ client_id: testClient.id, name: 'Website Redesign' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ name: 'Website Redesign', client_id: testClient.id })
    expect(res.body.data.status).toBe('active')
  })

  it('returns 400 when client_id is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Project X' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ client_id: testClient.id })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/projects', () => {
  it('returns list of projects', async () => {
    await knex('projects').insert([
      { client_id: testClient.id, name: 'Project A' },
      { client_id: testClient.id, name: 'Project B' }
    ])
    const res = await request(app).get('/api/projects')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(2)
  })

  it('returns empty list when no projects', async () => {
    const res = await request(app).get('/api/projects')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })
})

describe('GET /api/projects/:id', () => {
  it('returns a project by id', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'P1' })
      .returning('*')
    const res = await request(app).get(`/api/projects/${project.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(project.id)
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app).get('/api/projects/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('PUT /api/projects/:id', () => {
  it('updates a project', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'Old' })
      .returning('*')
    const res = await request(app)
      .put(`/api/projects/${project.id}`)
      .send({ name: 'New Name', status: 'completed' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('New Name')
    expect(res.body.data.status).toBe('completed')
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .put('/api/projects/00000000-0000-0000-0000-000000000000')
      .send({ name: 'X' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('DELETE /api/projects/:id', () => {
  it('deletes a project', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'Del' })
      .returning('*')
    const res = await request(app).delete(`/api/projects/${project.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app).delete('/api/projects/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/projects/:id/tasks', () => {
  it('returns tasks for a project', async () => {
    const [project] = await knex('projects')
      .insert({ client_id: testClient.id, name: 'P' })
      .returning('*')
    await knex('tasks').insert([
      { project_id: project.id, title: 'Task 1' },
      { project_id: project.id, title: 'Task 2' }
    ])
    const res = await request(app).get(`/api/projects/${project.id}/tasks`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(2)
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app).get('/api/projects/00000000-0000-0000-0000-000000000000/tasks')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})
