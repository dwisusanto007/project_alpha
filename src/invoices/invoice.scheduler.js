const cron = require('node-cron')
const service = require('./invoice.service')
const { sendReminderEmail } = require('../emails/mailer')

function startScheduler() {
  // Daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[scheduler] Checking overdue invoices...')
    try {
      const overdueInvoices = await service.getOverdueForReminder()
      for (const invoice of overdueInvoices) {
        await sendReminderEmail(invoice)
        await service.markReminded(invoice.id)
        console.log(`[scheduler] Reminder sent for invoice ${invoice.invoice_number} → ${invoice.client_email}`)
      }
      if (overdueInvoices.length === 0) {
        console.log('[scheduler] No overdue invoices to remind.')
      }
    } catch (err) {
      console.error('[scheduler] Error:', err.message)
    }
  })
  console.log('[scheduler] Invoice reminder cron started (daily 9:00 AM)')
}

module.exports = { startScheduler }
