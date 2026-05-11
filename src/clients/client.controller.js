const { validationResult } = require('express-validator')
const service = require('./client.service')

async function createClient(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg, statusCode: 400 })
    }
    const client = await service.create(req.body)
    res.status(201).json({ data: client })
  } catch (err) {
    next(err)
  }
}

async function listClients(req, res, next) {
  try {
    const clients = await service.findAll()
    res.json({ data: clients, total: clients.length })
  } catch (err) {
    next(err)
  }
}

async function getClient(req, res, next) {
  try {
    const client = await service.findById(req.params.id)
    if (!client) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: client })
  } catch (err) {
    next(err)
  }
}

async function updateClient(req, res, next) {
  try {
    const client = await service.update(req.params.id, req.body)
    if (!client) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    res.json({ data: client })
  } catch (err) {
    next(err)
  }
}

async function deleteClient(req, res, next) {
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

async function getClientProjects(req, res, next) {
  try {
    const client = await service.findById(req.params.id)
    if (!client) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    const projects = await service.findProjects(req.params.id)
    res.json({ data: projects, total: projects.length })
  } catch (err) {
    next(err)
  }
}

module.exports = { createClient, listClients, getClient, updateClient, deleteClient, getClientProjects }
