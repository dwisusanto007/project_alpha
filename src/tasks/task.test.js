const request = require('supertest')
const app = require('../app')
const knex = require('../db/knex')

let testProject

beforeEach(async () => {
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()
  const [client] = await knex('clients')
    .insert({ name: 'Test Client', email: 'tc@test.com' })
    .returning('*')
  const [project] = await knex('projects')
    .insert({ client_id: client.id, name: 'Test Project' })
    .returning('*')
  testProject = project
})

describe('POST /api/tasks', () => {
  it('creates a task with valid data', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ project_id: testProject.id, title: 'Design homepage' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ title: 'Design homepage', project_id: testProject.id })
    expect(res.body.data.status).toBe('todo')
    expect(res.body.data.priority).toBe('medium')
  })

  it('returns 400 when project_id is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task X' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ project_id: testProject.id })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/tasks', () => {
  it('returns list of tasks', async () => {
    await knex('tasks').insert([
      { project_id: testProject.id, title: 'Task A' },
      { project_id: testProject.id, title: 'Task B' }
    ])
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(2)
  })

  it('returns empty list when no tasks', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })
})

describe('GET /api/tasks/:id', () => {
  it('returns a task by id', async () => {
    const [task] = await knex('tasks')
      .insert({ project_id: testProject.id, title: 'T1' })
      .returning('*')
    const res = await request(app).get(`/api/tasks/${task.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(task.id)
  })

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).get('/api/tasks/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('PUT /api/tasks/:id', () => {
  it('updates a task', async () => {
    const [task] = await knex('tasks')
      .insert({ project_id: testProject.id, title: 'Old' })
      .returning('*')
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Updated', status: 'in_progress', priority: 'high' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated')
    expect(res.body.data.status).toBe('in_progress')
    expect(res.body.data.priority).toBe('high')
  })

  it('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-0000-0000-000000000000')
      .send({ title: 'X' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task', async () => {
    const [task] = await knex('tasks')
      .insert({ project_id: testProject.id, title: 'Del' })
      .returning('*')
    const res = await request(app).delete(`/api/tasks/${task.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(true)
  })
})
