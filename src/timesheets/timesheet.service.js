const knex = require('../db/knex')

const TABLE = 'time_entries'

async function getRunning() {
  const entry = await knex(TABLE).whereNull('stopped_at').first()
  return entry || null
}

async function start(data) {
  const running = await getRunning()
  if (running) return { conflict: true }

  const [entry] = await knex(TABLE)
    .insert({ ...data, started_at: knex.fn.now() })
    .returning('*')
  return { entry }
}

async function stop(id) {
  const entry = await knex(TABLE).where({ id }).first()
  if (!entry) return { notFound: true }
  if (entry.stopped_at) return { notRunning: true }

  const stoppedAt = new Date()
  const durationMin = Math.round((stoppedAt - new Date(entry.started_at)) / 60000)

  const [updated] = await knex(TABLE)
    .where({ id })
    .update({ stopped_at: stoppedAt, duration_min: durationMin })
    .returning('*')
  return { entry: updated }
}

async function createManual(data) {
  const stoppedAt = new Date(new Date(data.started_at).getTime() + data.duration_min * 60000)
  const [entry] = await knex(TABLE)
    .insert({ ...data, stopped_at: stoppedAt })
    .returning('*')
  return entry
}

async function findAll({ project_id, from, to } = {}) {
  let q = knex(TABLE).orderBy('started_at', 'desc')
  if (project_id) q = q.where({ project_id })
  if (from) q = q.where('started_at', '>=', from)
  if (to) q = q.where('started_at', '<=', to)
  return q
}

async function update(id, data) {
  const entry = await knex(TABLE).where({ id }).first()
  if (!entry) return { notFound: true }
  if (!entry.stopped_at) return { running: true }

  const [updated] = await knex(TABLE).where({ id }).update(data).returning('*')
  return { entry: updated }
}

async function remove(id) {
  const count = await knex(TABLE).where({ id }).del()
  return count > 0
}

async function projectSummary(projectId) {
  const entries = await knex(TABLE)
    .where({ project_id: projectId })
    .whereNotNull('stopped_at')

  const totalMin = entries.reduce((sum, e) => sum + (e.duration_min || 0), 0)
  const billableMin = entries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + (e.duration_min || 0), 0)

  return {
    project_id: projectId,
    total_minutes: totalMin,
    total_hours: Math.round((totalMin / 60) * 100) / 100,
    billable_minutes: billableMin,
    billable_hours: Math.round((billableMin / 60) * 100) / 100
  }
}

module.exports = { getRunning, start, stop, createManual, findAll, update, remove, projectSummary }
