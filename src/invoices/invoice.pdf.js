const puppeteer = require('puppeteer')

/**
 * Renders an invoice object to a PDF Buffer using Puppeteer.
 * @param {object} invoice - Full invoice object including items, client_name, etc.
 * @returns {Promise<Buffer>} PDF bytes
 */
async function renderInvoicePdf(invoice) {
  const html = buildHtml(invoice)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return pdf
  } finally {
    await browser.close()
  }
}

function fmt(amount) {
  const n = parseFloat(amount || 0)
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function statusBadge(status) {
  const map = {
    draft:   { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
    sent:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Sent' },
    paid:    { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
    overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
    void:    { bg: '#f3f4f6', color: '#9ca3af', label: 'Void' },
  }
  const s = map[status] || map.draft
  return `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${s.label}</span>`
}

function buildHtml(inv) {
  const items = (inv.items || []).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px">${item.description || ''}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;font-size:14px;font-weight:500">${fmt(item.amount)}</td>
    </tr>
  `).join('')

  const issuedDate = fmtDate(inv.created_at)
  const dueDate = fmtDate(inv.due_at)
  const paidDate = inv.paid_at ? fmtDate(inv.paid_at) : null

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice ${inv.invoice_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #111827;
    background: #fff;
    font-size: 14px;
    line-height: 1.5;
  }
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 64px 72px;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 56px;
  }
  .brand {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.5px;
  }
  .brand-sub {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 3px;
  }
  .inv-meta {
    text-align: right;
  }
  .inv-number {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.3px;
  }
  .inv-status {
    margin-top: 6px;
  }
  .section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    margin-bottom: 6px;
  }
  .info-grid {
    display: flex;
    gap: 64px;
    margin-bottom: 48px;
  }
  .info-block {
    flex: 1;
  }
  .info-value {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
  }
  .info-sub {
    font-size: 13px;
    color: #6b7280;
  }
  .dates-grid {
    display: flex;
    gap: 48px;
    margin-bottom: 48px;
  }
  .date-block {}
  .date-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    margin-bottom: 4px;
  }
  .date-value {
    font-size: 14px;
    color: #374151;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead th {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    padding: 0 0 12px;
    border-bottom: 2px solid #e5e7eb;
    text-align: left;
  }
  thead th:last-child { text-align: right; }
  .total-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
  .total-box {
    min-width: 240px;
  }
  .total-line {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
    color: #6b7280;
    border-bottom: 1px solid #f3f4f6;
  }
  .total-final {
    display: flex;
    justify-content: space-between;
    padding: 12px 0 0;
    font-size: 17px;
    font-weight: 700;
    color: #111827;
  }
  .footer {
    margin-top: auto;
    padding-top: 48px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-note {
    font-size: 12px;
    color: #9ca3af;
  }
  .paid-stamp {
    transform: rotate(-12deg);
    border: 3px solid #16a34a;
    color: #16a34a;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 2px;
    padding: 6px 18px;
    border-radius: 6px;
    opacity: 0.7;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">Project Alpha</div>
      <div class="brand-sub">deliverai.id</div>
    </div>
    <div class="inv-meta">
      <div class="inv-number">${inv.invoice_number}</div>
      <div class="inv-status">${statusBadge(inv.status)}</div>
    </div>
  </div>

  <!-- Bill To + Project -->
  <div class="info-grid">
    <div class="info-block">
      <div class="section-label">Bill To</div>
      <div class="info-value">${inv.client_name || '—'}</div>
      ${inv.client_company ? `<div class="info-sub">${inv.client_company}</div>` : ''}
      ${inv.client_email ? `<div class="info-sub">${inv.client_email}</div>` : ''}
    </div>
    <div class="info-block">
      <div class="section-label">Project</div>
      <div class="info-value">${inv.project_name || '—'}</div>
    </div>
  </div>

  <!-- Dates -->
  <div class="dates-grid">
    <div class="date-block">
      <div class="date-label">Issued</div>
      <div class="date-value">${issuedDate}</div>
    </div>
    <div class="date-block">
      <div class="date-label">Due</div>
      <div class="date-value">${dueDate}</div>
    </div>
    ${paidDate ? `
    <div class="date-block">
      <div class="date-label">Paid</div>
      <div class="date-value" style="color:#16a34a;font-weight:600">${paidDate}</div>
    </div>` : ''}
  </div>

  <!-- Line Items -->
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items}
    </tbody>
  </table>

  <!-- Total -->
  <div class="total-row">
    <div class="total-box">
      <div class="total-line">
        <span>Subtotal</span>
        <span>${fmt(inv.subtotal)}</span>
      </div>
      <div class="total-final">
        <span>Total</span>
        <span>${fmt(inv.total)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-note">Thank you for your business.</div>
    ${inv.status === 'paid' ? '<div class="paid-stamp">Paid</div>' : ''}
  </div>

</div>
</body>
</html>`
}

module.exports = { renderInvoicePdf }
