exports.up = function (knex) {
  return knex.schema.createTable('time_entries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE').index()
    t.uuid('task_id').nullable().references('id').inTable('tasks').onDelete('SET NULL').index()
    t.text('description')
    t.timestamp('started_at', { useTz: true }).notNullable()
    t.timestamp('stopped_at', { useTz: true }).nullable()
    t.integer('duration_min').nullable()
    t.boolean('billable').defaultTo(true)
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('time_entries')
}
