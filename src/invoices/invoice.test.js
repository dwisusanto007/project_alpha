// Mock Puppeteer-based PDF renderer so tests run without Chrome
jest.mock('./invoice.pdf', () => ({
  renderInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-mock'))
}))

const request = require('supertest')
const app = require('../app')
const knex = require('../db/knex')

let _testClient, testProject, _testTasks

beforeEach(async () => {
  await knex('invoice_items').del()
  await knex('invoices').del()
  await knex('time_entries').del()
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()

  const [client] = await knex('clients')
    .insert({ name: 'Invoice Client', email: 'invoice@test.com', company: 'Test Co' })
    .returning('*')
  const [project] = await knex('projects')
    .insert({ client_id: client.id, name: 'Invoice Project' })
    .returning('*')
  const tasks = await knex('tasks').insert([
    { project_id: project.id, title: 'Design', status: 'done', priority: 'high', price: 1000000 },
    { project_id: project.id, title: 'Development', status: 'done', priority: 'high', price: 3000000 },
    { project_id: project.id, title: 'Testing', status: 'todo', priority: 'medium', price: 500000 },
  ]).returning('*')

  _testClient = client
  testProject = project
  _testTasks = tasks
})

describe('POST /api/invoices/from-project/:projectId', () => {
  it('creates invoice from completed tasks', async () => {
    const res = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)
    expect(res.status).toBe(201)
    expect(res.body.data.invoice_number).toMatch(/^INV-\d{6}-\d{3}$/)
    expect(res.body.data.status).toBe('draft')
    expect(parseFloat(res.body.data.total)).toBe(4000000)
    expect(res.body.data.items).toHaveLength(2)
  })

  it('returns 400 when no completed tasks', async () => {
    await knex('tasks').where({ project_id: testProject.id }).update({ status: 'todo' })
    const res = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .post('/api/invoices/from-project/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/invoices', () => {
  it('returns list of invoices', async () => {
    await request(app).post(`/api/invoices/from-project/${testProject.id}`)
    const res = await request(app).get('/api/invoices')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].client_name).toBe('Invoice Client')
  })
})

describe('GET /api/invoices/:id', () => {
  it('returns invoice with items', async () => {
    const { body: { data: created } } = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)
    const res = await request(app).get(`/api/invoices/${created.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.items).toHaveLength(2)
    expect(res.body.data.client_company).toBe('Test Co')
  })

  it('returns 404 for non-existent invoice', async () => {
    const res = await request(app).get('/api/invoices/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/invoices/:id/status', () => {
  it('updates invoice status to paid', async () => {
    const { body: { data: created } } = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)
    const res = await request(app)
      .patch(`/api/invoices/${created.id}/status`)
      .send({ status: 'paid' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('paid')
    expect(res.body.data.paid_at).not.toBeNull()
  })

  it('returns 400 for invalid status', async () => {
    const { body: { data: created } } = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)
    const res = await request(app)
      .patch(`/api/invoices/${created.id}/status`)
      .send({ status: 'invalid' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/invoices/:id/send', () => {
  it('sends invoice and updates status to sent', async () => {
    const { body: { data: created } } = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)
    const res = await request(app).post(`/api/invoices/${created.id}/send`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('sent')
    expect(res.body.data.sent_at).not.toBeNull()
  })
})

describe('GET /api/invoices/:id/pdf', () => {
  it('returns PDF with correct content-type and filename', async () => {
    const { body: { data: created } } = await request(app)
      .post(`/api/invoices/from-project/${testProject.id}`)

    const res = await request(app)
      .get(`/api/invoices/${created.id}/pdf`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => callback(null, Buffer.concat(chunks)))
      })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/pdf/)
    expect(res.headers['content-disposition']).toMatch(/INV-.*\.pdf/)
  })

  it('returns 404 for non-existent invoice', async () => {
    const res = await request(app)
      .get('/api/invoices/00000000-0000-0000-0000-000000000000/pdf')
    expect(res.status).toBe(404)
  })
})
