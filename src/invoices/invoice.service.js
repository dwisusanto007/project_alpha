const knex = require('../db/knex')

async function generateInvoiceNumber() {
  const now = new Date()
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const count = await knex('invoices')
    .whereRaw(`invoice_number LIKE ?`, [`INV-${yyyymm}-%`])
    .count('id as n')
    .first()
  const seq = String(parseInt(count.n) + 1).padStart(3, '0')
  return `INV-${yyyymm}-${seq}`
}

async function createFromProject(projectId) {
  const project = await knex('projects').where({ id: projectId }).first()
  if (!project) return { notFound: true }

  const completedTasks = await knex('tasks')
    .where({ project_id: projectId, status: 'done' })
    .select('id', 'title', 'price')

  if (completedTasks.length === 0) return { empty: true }

  const subtotal = completedTasks.reduce((sum, t) => sum + parseFloat(t.price || 0), 0)
  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + 14)

  const invoiceNumber = await generateInvoiceNumber()

  const [invoice] = await knex('invoices').insert({
    client_id: project.client_id,
    project_id: projectId,
    invoice_number: invoiceNumber,
    status: 'draft',
    due_at: dueAt.toISOString().split('T')[0],
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100
  }).returning('*')

  const items = completedTasks.map(t => ({
    invoice_id: invoice.id,
    task_id: t.id,
    description: t.title,
    amount: parseFloat(t.price || 0)
  }))
  await knex('invoice_items').insert(items)

  return { invoice: await findById(invoice.id) }
}

async function findAll() {
  return knex('invoices')
    .join('clients', 'clients.id', 'invoices.client_id')
    .join('projects', 'projects.id', 'invoices.project_id')
    .select(
      'invoices.*',
      'clients.name as client_name',
      'clients.email as client_email',
      'projects.name as project_name'
    )
    .orderBy('invoices.created_at', 'desc')
}

async function findById(id) {
  const invoice = await knex('invoices')
    .join('clients', 'clients.id', 'invoices.client_id')
    .join('projects', 'projects.id', 'invoices.project_id')
    .where('invoices.id', id)
    .select(
      'invoices.*',
      'clients.name as client_name',
      'clients.email as client_email',
      'clients.company as client_company',
      'projects.name as project_name'
    )
    .first()
  if (!invoice) return null

  const items = await knex('invoice_items').where({ invoice_id: id }).orderBy('created_at', 'asc')
  return { ...invoice, items }
}

async function updateStatus(id, status) {
  const invoice = await knex('invoices').where({ id }).first()
  if (!invoice) return null

  const updates = { status, updated_at: knex.fn.now() }
  if (status === 'paid') updates.paid_at = knex.fn.now()

  const [updated] = await knex('invoices').where({ id }).update(updates).returning('*')
  return updated
}

async function sendInvoice(id, { sendMagicLink: _send, sendInvoiceEmail }) {
  const invoice = await findById(id)
  if (!invoice) return { notFound: true }
  if (invoice.status === 'void') return { voided: true }

  await sendInvoiceEmail(invoice)

  const [updated] = await knex('invoices').where({ id })
    .update({ status: 'sent', sent_at: knex.fn.now(), updated_at: knex.fn.now() })
    .returning('*')
  return { invoice: { ...updated, items: invoice.items } }
}

async function getOverdueForReminder() {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  return knex('invoices')
    .join('clients', 'clients.id', 'invoices.client_id')
    .join('projects', 'projects.id', 'invoices.project_id')
    .where('invoices.status', 'sent')
    .where('invoices.due_at', '<', new Date().toISOString().split('T')[0])
    .where(function () {
      this.whereNull('invoices.last_reminded_at')
        .orWhere('invoices.last_reminded_at', '<', threeDaysAgo)
    })
    .select(
      'invoices.*',
      'clients.name as client_name',
      'clients.email as client_email',
      'projects.name as project_name'
    )
}

async function markReminded(id) {
  await knex('invoices').where({ id }).update({
    last_reminded_at: knex.fn.now(),
    status: 'overdue',
    updated_at: knex.fn.now()
  })
}

module.exports = { createFromProject, findAll, findById, updateStatus, sendInvoice, getOverdueForReminder, markReminded }
