const knex = require('../db/knex')

const TABLE = 'tasks'

async function create(data) {
  const [task] = await knex(TABLE).insert(data).returning('*')
  return task
}

async function findAll() {
  return knex(TABLE).select('*').orderBy('created_at', 'desc')
}

async function findById(id) {
  const task = await knex(TABLE).where({ id }).first()
  return task || null
}

async function update(id, data) {
  const [task] = await knex(TABLE)
    .where({ id })
    .update({ ...data, updated_at: knex.fn.now() })
    .returning('*')
  return task || null
}

async function remove(id) {
  const count = await knex(TABLE).where({ id }).del()
  return count > 0
}

module.exports = { create, findAll, findById, update, remove }
