import { jsPDF } from 'jspdf'

/**
 * Calculates the true outstanding balance for an invoice according to financial rules:
 * - Fully paid invoices ALWAYS have an outstanding balance of 0.00.
 * - Partially paid invoices display only the remaining unpaid amount.
 * - Unpaid / processing / overdue invoices display their remaining unpaid due amount.
 *
 * @param {Object} invoice
 * @returns {number}
 */
export function getInvoiceOutstandingBalance(invoice) {
  if (!invoice) return 0

  const status = String(invoice.status || '').trim().toLowerCase()

  // Business Rule: Fully paid invoices have exactly $0.00 balance due
  if (status === 'paid') {
    return 0.0
  }

  // Check explicit outstanding due fields from backend / database
  if (invoice.outstandingDue !== undefined && invoice.outstandingDue !== null && !isNaN(Number(invoice.outstandingDue))) {
    return Math.max(0, Number(Number(invoice.outstandingDue).toFixed(2)))
  }

  if (invoice.balanceDue !== undefined && invoice.balanceDue !== null && !isNaN(Number(invoice.balanceDue))) {
    return Math.max(0, Number(Number(invoice.balanceDue).toFixed(2)))
  }

  if (typeof invoice.due === 'number' && !isNaN(invoice.due)) {
    return Math.max(0, Number(Number(invoice.due).toFixed(2)))
  }

  // Fallback to original total amount if no payment has been applied
  const original = Number(invoice.amount || 0)
  return isNaN(original) ? 0.0 : Math.max(0, Number(original.toFixed(2)))
}

/**
 * Returns the total amount paid toward an invoice.
 *
 * @param {Object} invoice
 * @returns {number}
 */
export function getInvoiceAmountPaid(invoice) {
  if (!invoice) return 0
  const original = Number(invoice.amount || 0)
  const safeOriginal = isNaN(original) ? 0 : original

  const status = String(invoice.status || '').trim().toLowerCase()
  if (status === 'paid') {
    return safeOriginal
  }

  const outstanding = getInvoiceOutstandingBalance(invoice)
  return Math.max(0, Number((safeOriginal - outstanding).toFixed(2)))
}

/**
 * Generates an official, high-contrast, fully readable clinical receipt PDF document.
 * Includes complete invoice metadata, itemized breakdown, and distinct totals.
 *
 * @param {Object} invoice
 * @param {Object} [options={}]
 * @returns {jsPDF}
 */
export function createReceiptPdf(invoice, options = {}) {
  if (!invoice || !invoice.id) {
    throw new Error('Invalid invoice record: missing required invoice identifier')
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const invoiceId = String(invoice.displayId || invoice.id)
  const receiptNum = options.receiptNumber || invoice.receiptNumber || `RCPT-${invoiceId.replace(/^INV-/, '')}`
  const clinicName = options.clinicName || invoice.clinicName || 'ZEALTH HEALTHCARE CLINIC'
  const serviceName = invoice.service || 'Clinical Consultation Service'
  const practitionerName = invoice.practitioner || invoice.practitionerName || 'Attending Healthcare Practitioner'
  const issueDate = invoice.issueDate || (typeof invoice.due === 'string' && invoice.due !== 'Net 7' ? invoice.due : 'Recorded on File')
  const statusStr = String(invoice.status || 'Paid').toUpperCase()
  const isPaid = statusStr === 'PAID'

  const originalTotal = Number(invoice.amount || 0)
  const outstandingBal = getInvoiceOutstandingBalance(invoice)
  const amountPaid = getInvoiceAmountPaid(invoice)

  // 1. Primary Navy Header Banner
  doc.setFillColor(14, 27, 51)
  doc.rect(0, 0, 210, 30, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(clinicName, 15, 14)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text('Official Clinical Tax Receipt & Statement of Account', 15, 22)

  // Status Badge in Header
  if (isPaid) {
    doc.setFillColor(16, 185, 129) // Emerald
    doc.roundedRect(152, 9, 43, 12, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('PAID IN FULL', 157, 17)
  } else {
    doc.setFillColor(245, 158, 11) // Amber
    doc.roundedRect(150, 9, 45, 12, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text(`STATUS: ${statusStr}`, 154, 17)
  }

  // 2. Receipt & Invoice Details Box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('RECEIPT & INVOICE DETAILS', 15, 42)

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(15, 46, 180, 32, 2, 2, 'FD')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('INVOICE NUMBER:', 20, 53)
  doc.text('RECEIPT REFERENCE:', 75, 53)
  doc.text('ISSUE / DUE DATE:', 135, 53)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(invoiceId, 20, 60)
  doc.text(receiptNum, 75, 60)
  doc.text(String(issueDate), 135, 60)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('CLINIC SERVICE:', 20, 68)
  doc.text('PRACTITIONER:', 75, 68)
  doc.text('PAYMENT STATUS:', 135, 68)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(serviceName, 20, 74)
  doc.text(practitionerName, 75, 74)
  doc.text(invoice.status || 'Paid', 135, 74)

  // 3. Line Items Table
  let y = 88
  doc.setFillColor(241, 245, 249)
  doc.rect(15, y, 180, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('ITEM DESCRIPTION', 20, y + 5.5)
  doc.text('QTY', 125, y + 5.5)
  doc.text('RATE (AUD)', 145, y + 5.5)
  doc.text('TOTAL (AUD)', 175, y + 5.5)

  y += 12
  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ description: serviceName, quantity: 1, rate: originalTotal, total: originalTotal }]

  for (const item of items) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    const desc = String(item.description || serviceName)
    doc.text(desc.length > 50 ? desc.substring(0, 48) + '...' : desc, 20, y)
    doc.text(String(item.quantity || 1), 127, y)
    doc.text(`$${Number(item.rate || 0).toFixed(2)}`, 147, y)
    doc.text(`$${Number(item.total || 0).toFixed(2)}`, 177, y)
    y += 8
  }

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.line(15, y + 2, 195, y + 2)
  y += 10

  // 4. Financial Summary Box (Distinguishes Original Total vs Paid vs Outstanding)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(105, y, 90, 36, 2, 2, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(105, y, 90, 36, 2, 2, 'D')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text('Original Invoice Total:', 110, y + 8)
  doc.text(`$${originalTotal.toFixed(2)} AUD`, 165, y + 8)

  doc.text('Total Amount Paid:', 110, y + 18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(16, 185, 129)
  doc.text(`$${amountPaid.toFixed(2)} AUD`, 165, y + 18)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Balance Outstanding:', 110, y + 28)
  doc.setFont('helvetica', 'bold')
  if (outstandingBal === 0) {
    doc.setTextColor(16, 185, 129) // Emerald for $0.00
  } else {
    doc.setTextColor(140, 75, 255) // Purple for pending balance
  }
  doc.text(`$${outstandingBal.toFixed(2)} AUD`, 165, y + 28)

  // 5. Professional Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('This document confirms that payment has been recorded against the referenced clinical invoice.', 15, 270)
  doc.text('ZealthOS Healthcare Practice | Registered Healthcare Provider | Page 1 of 1', 15, 275)

  return doc
}

/**
 * Downloads the receipt PDF via a reliable binary Blob URL to prevent blank/unreadable downloads.
 *
 * @param {Object} invoice
 * @param {Object} [options={}]
 * @returns {{ doc: jsPDF, blob?: Blob, fileName: string }}
 */
export function downloadReceiptPdf(invoice, options = {}) {
  const doc = createReceiptPdf(invoice, options)
  const invoiceId = String(invoice.displayId || invoice.id || 'INV')
  const fileName = `Receipt_${invoiceId}.pdf`

  if (typeof window !== 'undefined' && window.URL && window.document) {
    const blob = doc.output('blob')
    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = fileName
    window.document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 200)
    return { doc, blob, fileName }
  }

  return { doc, fileName }
}
