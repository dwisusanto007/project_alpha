exports.up = async function (knex) {
  await knex.schema.createTable('magic_link_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE').index()
    t.string('token', 255).notNullable()
    t.unique('token')
    t.timestamp('expires_at', { useTz: true }).notNullable()
    t.boolean('used').defaultTo(false)
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
  })

  await knex.schema.alterTable('projects', (t) => {
    t.timestamp('approved_at', { useTz: true }).nullable()
    t.uuid('approved_by').nullable().references('id').inTable('clients')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('projects', (t) => {
    t.dropColumn('approved_at')
    t.dropColumn('approved_by')
  })
  await knex.schema.dropTable('magic_link_tokens')
}
