const request = require('supertest')
const app = require('../app')
const knex = require('../db/knex')

let testProject, testTask

beforeEach(async () => {
  await knex('time_entries').del()
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()

  const [client] = await knex('clients')
    .insert({ name: 'Timer Client', email: 'timer@test.com' })
    .returning('*')
  const [project] = await knex('projects')
    .insert({ client_id: client.id, name: 'Timer Project' })
    .returning('*')
  const [task] = await knex('tasks')
    .insert({ project_id: project.id, title: 'Timer Task' })
    .returning('*')
  testProject = project
  testTask = task
})

describe('POST /api/timesheets/start', () => {
  it('starts a timer', async () => {
    const res = await request(app)
      .post('/api/timesheets/start')
      .send({ project_id: testProject.id, description: 'Working on landing page' })
    expect(res.status).toBe(201)
    expect(res.body.data.stopped_at).toBeNull()
    expect(res.body.data.project_id).toBe(testProject.id)
  })

  it('returns 409 when a timer is already running', async () => {
    await knex('time_entries').insert({
      project_id: testProject.id,
      started_at: new Date(),
      stopped_at: null
    })
    const res = await request(app)
      .post('/api/timesheets/start')
      .send({ project_id: testProject.id })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Timer already running')
  })

  it('returns 400 when project_id is missing', async () => {
    const res = await request(app).post('/api/timesheets/start').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('POST /api/timesheets/:id/stop', () => {
  it('stops a running timer and calculates duration', async () => {
    const startedAt = new Date(Date.now() - 30 * 60 * 1000)
    const [entry] = await knex('time_entries')
      .insert({ project_id: testProject.id, started_at: startedAt })
      .returning('*')
    const res = await request(app).post(`/api/timesheets/${entry.id}/stop`)
    expect(res.status).toBe(200)
    expect(res.body.data.stopped_at).not.toBeNull()
    expect(res.body.data.duration_min).toBeGreaterThanOrEqual(29)
  })

  it('returns 400 when timer is already stopped', async () => {
    const [entry] = await knex('time_entries')
      .insert({
        project_id: testProject.id,
        started_at: new Date(Date.now() - 60000),
        stopped_at: new Date(),
        duration_min: 1
      })
      .returning('*')
    const res = await request(app).post(`/api/timesheets/${entry.id}/stop`)
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Timer not running')
  })
})

describe('POST /api/timesheets/manual', () => {
  it('creates a manual entry', async () => {
    const res = await request(app)
      .post('/api/timesheets/manual')
      .send({
        project_id: testProject.id,
        task_id: testTask.id,
        started_at: '2026-05-11T09:00:00Z',
        duration_min: 90,
        description: 'Design work',
        billable: true
      })
    expect(res.status).toBe(201)
    expect(res.body.data.duration_min).toBe(90)
    expect(res.body.data.stopped_at).not.toBeNull()
  })

  it('returns 400 when duration_min is 0', async () => {
    const res = await request(app)
      .post('/api/timesheets/manual')
      .send({ project_id: testProject.id, started_at: '2026-05-11T09:00:00Z', duration_min: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})

describe('GET /api/timesheets/running', () => {
  it('returns running timer when one exists', async () => {
    await knex('time_entries').insert({ project_id: testProject.id, started_at: new Date() })
    const res = await request(app).get('/api/timesheets/running')
    expect(res.status).toBe(200)
    expect(res.body.running).toBe(true)
    expect(res.body.data).toBeDefined()
  })

  it('returns running: false when no timer running', async () => {
    const res = await request(app).get('/api/timesheets/running')
    expect(res.status).toBe(200)
    expect(res.body.running).toBe(false)
  })
})

describe('GET /api/timesheets/summary/project/:projectId', () => {
  it('returns correct totals', async () => {
    await knex('time_entries').insert([
      { project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 60, billable: true },
      { project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 30, billable: true },
      { project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 45, billable: false }
    ])
    const res = await request(app).get(`/api/timesheets/summary/project/${testProject.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.total_minutes).toBe(135)
    expect(res.body.data.total_hours).toBe(2.25)
    expect(res.body.data.billable_minutes).toBe(90)
    expect(res.body.data.billable_hours).toBe(1.5)
  })
})

describe('GET /api/timesheets', () => {
  it('returns all entries', async () => {
    await knex('time_entries').insert([
      { project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 60 },
      { project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 30 }
    ])
    const res = await request(app).get('/api/timesheets')
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(2)
  })

  it('filters by project_id', async () => {
    const [other] = await knex('clients').insert({ name: 'Other', email: 'other@test.com' }).returning('*')
    const [otherProject] = await knex('projects').insert({ client_id: other.id, name: 'Other' }).returning('*')
    await knex('time_entries').insert([
      { project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 60 },
      { project_id: otherProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 30 }
    ])
    const res = await request(app).get(`/api/timesheets?project_id=${testProject.id}`)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(1)
  })
})

describe('PUT /api/timesheets/:id', () => {
  it('updates a stopped entry', async () => {
    const [entry] = await knex('time_entries')
      .insert({ project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 60 })
      .returning('*')
    const res = await request(app)
      .put(`/api/timesheets/${entry.id}`)
      .send({ description: 'Updated description', duration_min: 90 })
    expect(res.status).toBe(200)
    expect(res.body.data.description).toBe('Updated description')
    expect(res.body.data.duration_min).toBe(90)
  })

  it('returns 400 when trying to edit a running timer', async () => {
    const [entry] = await knex('time_entries')
      .insert({ project_id: testProject.id, started_at: new Date() })
      .returning('*')
    const res = await request(app)
      .put(`/api/timesheets/${entry.id}`)
      .send({ description: 'Cannot edit' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Cannot edit a running timer')
  })
})

describe('DELETE /api/timesheets/:id', () => {
  it('deletes an entry', async () => {
    const [entry] = await knex('time_entries')
      .insert({ project_id: testProject.id, started_at: new Date(), stopped_at: new Date(), duration_min: 30 })
      .returning('*')
    const res = await request(app).delete(`/api/timesheets/${entry.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for non-existent entry', async () => {
    const res = await request(app).delete('/api/timesheets/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
