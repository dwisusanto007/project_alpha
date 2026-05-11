const { validationResult } = require('express-validator')
const service = require('./project.service')

async function createProject(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg, statusCode: 400 })
    }
    const project = await service.create(req.body)
    res.status(201).json({ data: project })
  } catch (err) {
    next(err)
  }
}

async function listProjects(req, res, next) {
  try {
    const projects = await service.findAll()
    res.json({ data: projects, total: projects.length })
  } catch (err) {
    next(err)
  }
}

async function getProject(req, res, next) {
  try {
    const project = await service.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: project })
  } catch (err) {
    next(err)
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await service.update(req.params.id, req.body)
    if (!project) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: project })
  } catch (err) {
    next(err)
  }
}

async function deleteProject(req, res, next) {
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

async function getProjectTasks(req, res, next) {
  try {
    const project = await service.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    const tasks = await service.findTasks(req.params.id)
    res.json({ data: tasks, total: tasks.length })
  } catch (err) {
    next(err)
  }
}

async function getProjectSummary(req, res, next) {
  try {
    const summary = await service.getSummary(req.params.id)
    if (!summary) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: summary })
  } catch (err) {
    next(err)
  }
}

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject, getProjectTasks, getProjectSummary }
