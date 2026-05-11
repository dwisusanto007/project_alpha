const knex = require('../db/knex')

const TABLE = 'clients'

async function create(data) {
  const [client] = await knex(TABLE).insert(data).returning('*')
  return client
}

async function findAll() {
  return knex(TABLE).select('*').orderBy('created_at', 'desc')
}

async function findById(id) {
  const client = await knex(TABLE).where({ id }).first()
  return client || null
}

async function update(id, data) {
  const [client] = await knex(TABLE)
    .where({ id })
    .update({ ...data, updated_at: knex.fn.now() })
    .returning('*')
  return client || null
}

async function remove(id) {
  const count = await knex(TABLE).where({ id }).del()
  return count > 0
}

async function findProjects(clientId) {
  return knex('projects').where({ client_id: clientId }).orderBy('created_at', 'desc')
}

module.exports = { create, findAll, findById, update, remove, findProjects }
