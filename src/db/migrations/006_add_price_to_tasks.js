exports.up = function (knex) {
  return knex.schema.alterTable('tasks', (t) => {
    t.decimal('price', 12, 2).defaultTo(0).notNullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('tasks', (t) => {
    t.dropColumn('price')
  })
}
