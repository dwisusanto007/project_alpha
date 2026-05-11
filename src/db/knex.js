require('dotenv').config()

const env = process.env.NODE_ENV || 'development'

const pool = env === 'production'
  ? { min: 2, max: 10 }
  : { min: 0, max: 3 }

const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool
})

module.exports = knex
