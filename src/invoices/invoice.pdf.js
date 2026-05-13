const PDFDocument = require('pdfkit')

function fmt(amount) {
  return parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function renderInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 72 })
    const chunks = []
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width - 144 // usable width (margins both sides)
    const gray = '#6b7280'
    const dark = '#111827'
    const light = '#9ca3af'
    const blue = '#2563eb'

    // ── Header ──────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').fillColor(dark).text('Project Alpha', 72, 72)
    doc.fontSize(10).font('Helvetica').fillColor(light).text('deliverai.id', 72, 97)

    // Invoice number + status (right-aligned)
    const numStr = invoice.invoice_number || ''
    doc.fontSize(16).font('Helvetica-Bold').fillColor(dark)
    doc.text(numStr, 72, 72, { align: 'right', width: W })

    const statusLabel = (invoice.status || 'draft').toUpperCase()
    doc.fontSize(9).font('Helvetica-Bold').fillColor(blue)
    doc.text(statusLabel, 72, 97, { align: 'right', width: W })

    doc.moveTo(72, 120).lineTo(72 + W, 120).strokeColor('#e5e7eb').lineWidth(1).stroke()

    // ── Bill To + Project ───────────────────────────────────
    let y = 136
    doc.fontSize(8).font('Helvetica-Bold').fillColor(light).text('BILL TO', 72, y)
    doc.fontSize(8).font('Helvetica-Bold').fillColor(light).text('PROJECT', 72 + W / 2, y)

    y += 16
    doc.fontSize(13).font('Helvetica-Bold').fillColor(dark).text(invoice.client_name || '—', 72, y)
    doc.fontSize(13).font('Helvetica-Bold').fillColor(dark).text(invoice.project_name || '—', 72 + W / 2, y)

    y += 18
    if (invoice.client_company) {
      doc.fontSize(10).font('Helvetica').fillColor(gray).text(invoice.client_company, 72, y)
      y += 14
    }
    if (invoice.client_email) {
      doc.fontSize(10).font('Helvetica').fillColor(gray).text(invoice.client_email, 72, y)
      y += 14
    }

    // ── Dates ───────────────────────────────────────────────
    y += 24
    doc.fontSize(8).font('Helvetica-Bold').fillColor(light).text('ISSUED', 72, y)
    doc.fontSize(8).font('Helvetica-Bold').fillColor(light).text('DUE', 72 + 130, y)
    if (invoice.paid_at) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(light).text('PAID', 72 + 260, y)
    }

    y += 14
    doc.fontSize(11).font('Helvetica').fillColor(dark).text(fmtDate(invoice.created_at), 72, y)
    doc.fontSize(11).font('Helvetica').fillColor(dark).text(fmtDate(invoice.due_at), 72 + 130, y)
    if (invoice.paid_at) {
      doc.fontSize(11).font('Helvetica').fillColor('#16a34a').text(fmtDate(invoice.paid_at), 72 + 260, y)
    }

    // ── Line items table ────────────────────────────────────
    y += 40
    doc.moveTo(72, y).lineTo(72 + W, y).strokeColor('#e5e7eb').lineWidth(1).stroke()
    y += 10

    doc.fontSize(8).font('Helvetica-Bold').fillColor(light)
    doc.text('DESCRIPTION', 72, y)
    doc.text('AMOUNT', 72, y, { align: 'right', width: W })

    y += 20
    doc.moveTo(72, y).lineTo(72 + W, y).strokeColor('#e5e7eb').lineWidth(1).stroke()

    const items = invoice.items || []
    items.forEach(item => {
      y += 14
      doc.fontSize(11).font('Helvetica').fillColor(dark).text(item.description || '', 72, y, { width: W * 0.7 })
      doc.fontSize(11).font('Helvetica').fillColor(dark).text(fmt(item.amount), 72, y, { align: 'right', width: W })
      y += 16
      doc.moveTo(72, y).lineTo(72 + W, y).strokeColor('#f3f4f6').lineWidth(0.5).stroke()
    })

    // ── Total ───────────────────────────────────────────────
    y += 20
    const totalX = 72 + W * 0.55
    const totalW = W * 0.45

    doc.moveTo(totalX, y).lineTo(72 + W, y).strokeColor('#e5e7eb').lineWidth(1).stroke()
    y += 12

    doc.fontSize(10).font('Helvetica').fillColor(gray).text('Subtotal', totalX, y, { width: totalW * 0.6 })
    doc.fontSize(10).font('Helvetica').fillColor(gray).text(fmt(invoice.subtotal), totalX, y, { align: 'right', width: totalW })

    y += 18
    doc.moveTo(totalX, y).lineTo(72 + W, y).strokeColor('#e5e7eb').lineWidth(1).stroke()
    y += 12

    doc.fontSize(14).font('Helvetica-Bold').fillColor(dark).text('Total', totalX, y, { width: totalW * 0.6 })
    doc.fontSize(14).font('Helvetica-Bold').fillColor(dark).text(fmt(invoice.total), totalX, y, { align: 'right', width: totalW })

    // ── PAID stamp ──────────────────────────────────────────
    if (invoice.status === 'paid') {
      doc.save()
      doc.rotate(-15, { origin: [72 + W * 0.25, y - 10] })
      doc.rect(72 + W * 0.05, y - 30, 120, 36).strokeColor('#16a34a').lineWidth(3).stroke()
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#16a34a').opacity(0.7)
      doc.text('PAID', 72 + W * 0.05, y - 22, { width: 120, align: 'center' })
      doc.restore()
    }

    // ── Footer ──────────────────────────────────────────────
    const footerY = doc.page.height - 72
    doc.moveTo(72, footerY - 16).lineTo(72 + W, footerY - 16).strokeColor('#e5e7eb').lineWidth(1).stroke()
    doc.fontSize(10).font('Helvetica').fillColor(light).opacity(1).text('Thank you for your business.', 72, footerY)

    doc.end()
  })
}

module.exports = { renderInvoicePdf }
