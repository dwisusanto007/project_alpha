const knex = require('../db/knex')

async function listProjects(req, res, next) {
  try {
    const projects = await knex('projects')
      .where({ client_id: req.client.clientId })
      .orderBy('created_at', 'desc')

    const withProgress = await Promise.all(projects.map(async (p) => {
      const tasks = await knex('tasks').where({ project_id: p.id })
      const total = tasks.length
      const done = tasks.filter(t => t.status === 'done').length
      return {
        ...p,
        task_count: total,
        completed_task_count: done,
        progress_percent: total > 0 ? Math.round((done / total) * 100) : 0
      }
    }))

    res.json({ data: withProgress, total: withProgress.length })
  } catch (err) {
    next(err)
  }
}

async function getProject(req, res, next) {
  try {
    const project = await knex('projects')
      .where({ id: req.params.id, client_id: req.client.clientId })
      .first()
    if (!project) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    const tasks = await knex('tasks')
      .where({ project_id: project.id })
      .select('id', 'title', 'status', 'priority', 'due_date')
      .orderBy('created_at', 'asc')
    res.json({ data: { ...project, tasks } })
  } catch (err) {
    next(err)
  }
}

async function approveProject(req, res, next) {
  try {
    const project = await knex('projects')
      .where({ id: req.params.id, client_id: req.client.clientId })
      .first()
    if (!project) {
      return res.status(404).json({ error: true, message: 'Not found', statusCode: 404 })
    }
    const [updated] = await knex('projects')
      .where({ id: req.params.id })
      .update({ approved_at: knex.fn.now(), approved_by: req.client.clientId })
      .returning('*')
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
}

module.exports = { listProjects, getProject, approveProject }
