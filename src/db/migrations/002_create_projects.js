exports.up = function (knex) {
  return knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE').index()
    t.string('name', 255).notNullable()
    t.text('description')
    t.string('status', 50).defaultTo('active')
    t.date('deadline')
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('projects')
}
