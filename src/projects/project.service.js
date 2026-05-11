const knex = require('../db/knex')

const TABLE = 'projects'

async function create(data) {
  const [project] = await knex(TABLE).insert(data).returning('*')
  return project
}

async function findAll() {
  return knex(TABLE).select('*').orderBy('created_at', 'desc')
}

async function findById(id) {
  const project = await knex(TABLE).where({ id }).first()
  return project || null
}

async function update(id, data) {
  const [project] = await knex(TABLE)
    .where({ id })
    .update({ ...data, updated_at: knex.fn.now() })
    .returning('*')
  return project || null
}

async function remove(id) {
  const count = await knex(TABLE).where({ id }).del()
  return count > 0
}

async function findTasks(projectId) {
  return knex('tasks').where({ project_id: projectId }).orderBy('created_at', 'desc')
}

async function getSummary(projectId) {
  const project = await knex('projects').where({ id: projectId }).first()
  if (!project) return null

  const completedTasks = await knex('tasks')
    .where({ project_id: projectId, status: 'done' })
    .select('id', 'title', 'price', 'due_date')
    .orderBy('created_at', 'asc')

  const total = completedTasks.reduce((sum, t) => sum + parseFloat(t.price || 0), 0)

  return {
    project_id: projectId,
    project_name: project.name,
    completed_tasks: completedTasks,
    total_value: Math.round(total * 100) / 100,
    task_count: completedTasks.length
  }
}

module.exports = { create, findAll, findById, update, remove, findTasks, getSummary }
