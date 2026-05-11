const service = require('./invoice.service')
const { sendInvoiceEmail } = require('../emails/mailer')

async function createFromProject(req, res, next) {
  try {
    const result = await service.createFromProject(req.params.projectId)
    if (result.notFound) {
      return res.status(404).json({ error: true, message: 'Project not found', statusCode: 404 })
    }
    if (result.empty) {
      return res.status(400).json({ error: true, message: 'No completed tasks found for this project', statusCode: 400 })
    }
    res.status(201).json({ data: result.invoice })
  } catch (err) { next(err) }
}

async function listInvoices(req, res, next) {
  try {
    const invoices = await service.findAll()
    res.json({ data: invoices, total: invoices.length })
  } catch (err) { next(err) }
}

async function getInvoice(req, res, next) {
  try {
    const invoice = await service.findById(req.params.id)
    if (!invoice) return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    res.json({ data: invoice })
  } catch (err) { next(err) }
}

async function patchStatus(req, res, next) {
  try {
    const { status } = req.body
    const allowed = ['draft', 'sent', 'paid', 'overdue', 'void']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: true, message: `status must be one of: ${allowed.join(', ')}`, statusCode: 400 })
    }
    const invoice = await service.updateStatus(req.params.id, status)
    if (!invoice) return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    res.json({ data: invoice })
  } catch (err) { next(err) }
}

async function sendInvoice(req, res, next) {
  try {
    const result = await service.sendInvoice(req.params.id, { sendInvoiceEmail })
    if (result.notFound) return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    if (result.voided) return res.status(400).json({ error: true, message: 'Cannot send a voided invoice', statusCode: 400 })
    res.json({ data: result.invoice })
  } catch (err) { next(err) }
}

module.exports = { createFromProject, listInvoices, getInvoice, patchStatus, sendInvoice }
