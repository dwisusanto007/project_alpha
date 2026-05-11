const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

function createTransport() {
  if (!process.env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

async function sendMagicLink(to, magicUrl) {
  const transport = createTransport()
  if (!transport) {
    console.log(`[DEV] Magic link for ${to}: ${magicUrl}`)
    return
  }
  const templatePath = path.join(__dirname, 'templates', 'magic-link.html')
  const html = fs.readFileSync(templatePath, 'utf8').replace('{{MAGIC_URL}}', magicUrl)
  await transport.sendMail({
    from: process.env.FROM_EMAIL || 'noreply@projectalpha.dev',
    to,
    subject: 'Your magic link to Project Alpha',
    html
  })
}

async function sendInvoiceEmail(invoice) {
  const transport = createTransport()
  const itemRows = (invoice.items || []).map(i =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${i.description}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right">Rp ${parseFloat(i.amount).toLocaleString('id-ID')}</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#1a1a1a">
    <h2 style="margin-bottom:4px">Invoice ${invoice.invoice_number}</h2>
    <p style="color:#64748b;margin-bottom:24px">Project: ${invoice.project_name}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr style="background:#f8fafc"><th style="padding:8px 0;text-align:left">Description</th><th style="padding:8px 0;text-align:right">Amount</th></tr>
      ${itemRows}
    </table>
    <p style="text-align:right;font-size:18px;font-weight:700">Total: Rp ${parseFloat(invoice.total).toLocaleString('id-ID')}</p>
    <p style="color:#64748b;margin-top:16px;font-size:13px">Due date: ${invoice.due_at}</p>
    <p style="color:#64748b;font-size:13px">Please transfer to the account details you have on file.</p>
  </body></html>`

  if (!transport) {
    console.log(`[DEV] Invoice email for ${invoice.client_email}: ${invoice.invoice_number} — Total: ${invoice.total}`)
    return
  }
  await transport.sendMail({
    from: process.env.FROM_EMAIL || 'noreply@projectalpha.dev',
    to: invoice.client_email,
    subject: `Invoice ${invoice.invoice_number} — ${invoice.project_name}`,
    html
  })
}

async function sendReminderEmail(invoice) {
  const transport = createTransport()
  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#1a1a1a">
    <h2 style="color:#dc2626;margin-bottom:8px">Payment Reminder</h2>
    <p>Hi ${invoice.client_name},</p>
    <p style="margin:12px 0">This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> for project <strong>${invoice.project_name}</strong> is overdue.</p>
    <p style="font-size:18px;font-weight:700;margin:16px 0">Amount due: Rp ${parseFloat(invoice.total).toLocaleString('id-ID')}</p>
    <p style="color:#64748b;font-size:13px">Original due date: ${invoice.due_at}</p>
    <p style="margin-top:16px">Please process payment at your earliest convenience. Reply to this email if you have any questions.</p>
  </body></html>`

  if (!transport) {
    console.log(`[DEV] Reminder email for ${invoice.client_email}: ${invoice.invoice_number} overdue`)
    return
  }
  await transport.sendMail({
    from: process.env.FROM_EMAIL || 'noreply@projectalpha.dev',
    to: invoice.client_email,
    subject: `Payment Reminder — Invoice ${invoice.invoice_number}`,
    html
  })
}

module.exports = { sendMagicLink, sendInvoiceEmail, sendReminderEmail }
