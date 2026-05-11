exports.up = async function (knex) {
  await knex.schema.createTable('invoices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('RESTRICT').index()
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('RESTRICT').index()
    t.string('invoice_number', 50).notNullable().unique()
    t.string('status', 50).defaultTo('draft')
    t.date('issued_at').defaultTo(knex.fn.now())
    t.date('due_at').notNullable()
    t.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
    t.decimal('total', 12, 2).notNullable().defaultTo(0)
    t.text('notes')
    t.timestamp('sent_at', { useTz: true }).nullable()
    t.timestamp('paid_at', { useTz: true }).nullable()
    t.timestamp('last_reminded_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('invoice_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE').index()
    t.uuid('task_id').nullable().references('id').inTable('tasks').onDelete('SET NULL')
    t.text('description').notNullable()
    t.decimal('amount', 12, 2).notNullable()
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTable('invoice_items')
  await knex.schema.dropTable('invoices')
}
