const { randomUUID } = require('crypto')
const jwt = require('jsonwebtoken')
const knex = require('../db/knex')
const { sendMagicLink } = require('../emails/mailer')

async function requestMagicLink(email, baseUrl) {
  const client = await knex('clients').where({ email }).first()
  if (!client) return null

  const token = randomUUID()
  const minutes = parseInt(process.env.MAGIC_LINK_EXPIRES_MINUTES || '1440')
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000)

  await knex('magic_link_tokens').insert({
    client_id: client.id,
    token,
    expires_at: expiresAt,
    used: false
  })

  const magicUrl = `${baseUrl}/portal/auth/verify?token=${token}`
  await sendMagicLink(email, magicUrl)
  return true
}

async function verifyMagicLink(token) {
  const record = await knex('magic_link_tokens').where({ token }).first()
  if (!record) return { error: 'invalid', status: 400 }
  if (record.used) return { error: 'used', status: 400 }
  if (new Date(record.expires_at) < new Date()) return { error: 'expired', status: 410 }

  await knex('magic_link_tokens').where({ token }).update({ used: true })

  const client = await knex('clients').where({ id: record.client_id }).first()
  const jwtToken = jwt.sign(
    { clientId: client.id, email: client.email },
    process.env.PORTAL_JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.PORTAL_JWT_EXPIRES_IN || '7d' }
  )

  return { jwtToken, client }
}

module.exports = { requestMagicLink, verifyMagicLink }
