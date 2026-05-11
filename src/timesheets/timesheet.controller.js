const { validationResult } = require('express-validator')
const service = require('./timesheet.service')

async function startTimer(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg, statusCode: 400 })
    }
    const result = await service.start(req.body)
    if (result.conflict) {
      return res.status(409).json({ error: true, message: 'Timer already running', statusCode: 409 })
    }
    res.status(201).json({ data: result.entry })
  } catch (err) { next(err) }
}

async function stopTimer(req, res, next) {
  try {
    const result = await service.stop(req.params.id)
    if (result.notFound) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    if (result.notRunning) {
      return res.status(400).json({ error: true, message: 'Timer not running', statusCode: 400 })
    }
    res.json({ data: result.entry })
  } catch (err) { next(err) }
}

async function createManual(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg, statusCode: 400 })
    }
    const entry = await service.createManual(req.body)
    res.status(201).json({ data: entry })
  } catch (err) { next(err) }
}

async function listEntries(req, res, next) {
  try {
    const { project_id, from, to } = req.query
    const entries = await service.findAll({ project_id, from, to })
    res.json({ data: entries, total: entries.length })
  } catch (err) { next(err) }
}

async function getRunning(req, res, next) {
  try {
    const entry = await service.getRunning()
    if (!entry) return res.json({ running: false })
    res.json({ running: true, data: entry })
  } catch (err) { next(err) }
}

async function updateEntry(req, res, next) {
  try {
    const result = await service.update(req.params.id, req.body)
    if (result.notFound) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    if (result.running) {
      return res.status(400).json({ error: true, message: 'Cannot edit a running timer', statusCode: 400 })
    }
    res.json({ data: result.entry })
  } catch (err) { next(err) }
}

async function deleteEntry(req, res, next) {
  try {
    const deleted = await service.remove(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.status(204).send()
  } catch (err) { next(err) }
}

async function getProjectSummary(req, res, next) {
  try {
    const summary = await service.projectSummary(req.params.projectId)
    res.json({ data: summary })
  } catch (err) { next(err) }
}

module.exports = {
  startTimer, stopTimer, createManual, listEntries,
  getRunning, updateEntry, deleteEntry, getProjectSummary
}
