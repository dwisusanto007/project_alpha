exports.up = function (knex) {
  return knex.schema.createTable('tasks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE').index()
    t.string('title', 255).notNullable()
    t.text('description')
    t.string('status', 50).defaultTo('todo')
    t.string('priority', 50).defaultTo('medium')
    t.date('due_date')
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('tasks')
}
