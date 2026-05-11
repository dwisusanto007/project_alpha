const { validationResult } = require('express-validator')
const service = require('./task.service')

async function createTask(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg, statusCode: 400 })
    }
    const task = await service.create(req.body)
    res.status(201).json({ data: task })
  } catch (err) {
    next(err)
  }
}

async function listTasks(req, res, next) {
  try {
    const tasks = await service.findAll()
    res.json({ data: tasks, total: tasks.length })
  } catch (err) {
    next(err)
  }
}

async function getTask(req, res, next) {
  try {
    const task = await service.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: task })
  } catch (err) {
    next(err)
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await service.update(req.params.id, req.body)
    if (!task) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: task })
  } catch (err) {
    next(err)
  }
}

async function deleteTask(req, res, next) {
  try {
    const deleted = await service.remove(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask }
