import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getInvoiceOutstandingBalance,
  getInvoiceAmountPaid,
  createReceiptPdf,
  downloadReceiptPdf,
} from '../src/utils/invoiceUtils.js'

test('Invoice & Receipt Utility Tests - Task 2 Verification', async (t) => {
  await t.test('1. Fully paid invoices must ALWAYS display an outstanding balance of $0.00', () => {
    // Test known problematic invoices from issue report
    const inv20 = {
      id: 20,
      displayId: 'INV-000020',
      amount: 200.0,
      due: 0.0,
      status: 'Paid',
    }
    const inv19 = {
      id: 19,
      displayId: 'INV-000019',
      amount: 120.0,
      due: 0.0,
      status: 'Paid',
    }

    assert.strictEqual(
      getInvoiceOutstandingBalance(inv20),
      0.0,
      'INV-000020 outstanding balance must be 0.00'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(inv20),
      200.0,
      'INV-000020 amount paid must match original amount of 200.00'
    )

    assert.strictEqual(
      getInvoiceOutstandingBalance(inv19),
      0.0,
      'INV-000019 outstanding balance must be 0.00'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(inv19),
      120.0,
      'INV-000019 amount paid must match original amount of 120.00'
    )

    // Case-insensitivity check (e.g. 'paid', 'PAID', ' Paid ')
    assert.strictEqual(getInvoiceOutstandingBalance({ amount: 500, status: 'paid' }), 0.0)
    assert.strictEqual(getInvoiceOutstandingBalance({ amount: 350, status: 'PAID' }), 0.0)
    assert.strictEqual(getInvoiceOutstandingBalance({ amount: 150, status: '  Paid  ' }), 0.0)
  })

  await t.test('2. Unpaid invoices must display their correct unpaid balance', () => {
    const unpaidInvoice = {
      id: 25,
      displayId: 'INV-000025',
      amount: 175.5,
      due: 175.5,
      status: 'Unpaid',
    }
    const overdueInvoice = {
      id: 26,
      displayId: 'INV-000026',
      amount: 250.0,
      due: 250.0,
      status: 'Overdue',
    }

    assert.strictEqual(
      getInvoiceOutstandingBalance(unpaidInvoice),
      175.5,
      'Unpaid invoice balance must equal due amount'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(unpaidInvoice),
      0.0,
      'Unpaid invoice amount paid must be 0.00'
    )

    assert.strictEqual(
      getInvoiceOutstandingBalance(overdueInvoice),
      250.0,
      'Overdue invoice balance must equal due amount'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(overdueInvoice),
      0.0,
      'Overdue invoice amount paid must be 0.00'
    )
  })

  await t.test('3. Partially paid invoices must display only the remaining unpaid amount', () => {
    const partialInvoice = {
      id: 30,
      displayId: 'INV-000030',
      amount: 300.0,
      due: 75.0,
      status: 'Partially Paid',
    }

    assert.strictEqual(
      getInvoiceOutstandingBalance(partialInvoice),
      75.0,
      'Partially paid balance should be the remaining 75.00'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(partialInvoice),
      225.0,
      'Amount paid should be original (300) minus outstanding (75) = 225.00'
    )

    // Using explicit outstandingDue field
    const partialWithField = {
      id: 31,
      displayId: 'INV-000031',
      amount: 150.0,
      outstandingDue: 45.25,
      status: 'Partially Paid',
    }
    assert.strictEqual(
      getInvoiceOutstandingBalance(partialWithField),
      45.25,
      'Should honor outstandingDue property'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(partialWithField),
      104.75,
      'Amount paid should be 150 - 45.25 = 104.75'
    )
  })

  await t.test('4. Processing invoices must preserve pending balance according to business rules', () => {
    const processingInvoice = {
      id: 35,
      displayId: 'INV-000035',
      amount: 90.0,
      due: 90.0,
      status: 'Processing',
    }

    // While payment is still processing and not confirmed as Paid, balance remains outstanding
    assert.strictEqual(
      getInvoiceOutstandingBalance(processingInvoice),
      90.0,
      'Processing invoice retains outstanding balance until settled'
    )
    assert.strictEqual(
      getInvoiceAmountPaid(processingInvoice),
      0.0,
      'Processing invoice does not mark paid amount prematurely'
    )
  })

  await t.test('5. Currency precision, rounding, and null/undefined handling', () => {
    // Fractional cents precision
    const preciseInvoice = {
      id: 40,
      amount: 100.0,
      due: 33.33333333,
      status: 'Partially Paid',
    }
    assert.strictEqual(
      getInvoiceOutstandingBalance(preciseInvoice),
      33.33,
      'Should round to two decimal places'
    )

    // Negative protection
    const negativeAnomaly = {
      id: 41,
      amount: 100.0,
      due: -10.0,
      status: 'Unpaid',
    }
    assert.strictEqual(
      getInvoiceOutstandingBalance(negativeAnomaly),
      0.0,
      'Negative balance should clamp to 0.0'
    )

    // Null and empty handling
    assert.strictEqual(getInvoiceOutstandingBalance(null), 0)
    assert.strictEqual(getInvoiceOutstandingBalance(undefined), 0)
    assert.strictEqual(getInvoiceOutstandingBalance({}), 0)
    assert.strictEqual(getInvoiceAmountPaid(null), 0)
  })

  await t.test('6. Receipt PDF generation with valid invoice data produces a valid, readable PDF', () => {
    const validInvoice = {
      id: 20,
      displayId: 'INV-000020',
      service: 'Cardiology Initial Assessment',
      practitioner: 'Dr. Sarah Jenkins',
      amount: 200.0,
      due: 0.0,
      status: 'Paid',
      issueDate: '2026-10-10',
      receiptNumber: 'RCPT-2026-0020',
      items: [
        { description: 'Cardiology Comprehensive Consultation', quantity: 1, rate: 150.0, total: 150.0 },
        { description: 'ECG Electrocardiogram Test', quantity: 1, rate: 50.0, total: 50.0 },
      ],
    }

    const doc = createReceiptPdf(validInvoice)

    // Document must have at least 1 page
    assert.strictEqual(doc.internal.getNumberOfPages(), 1, 'PDF must generate exactly 1 page')

    // Document binary output must not be empty or truncated
    const arrayBuffer = doc.output('arraybuffer')
    assert.ok(arrayBuffer.byteLength > 2000, `PDF size (${arrayBuffer.byteLength} bytes) indicates valid binary output`)

    // Document header must adhere to PDF standard format (%PDF-)
    const rawPdfString = doc.output()
    assert.ok(rawPdfString.startsWith('%PDF-'), 'Output must start with PDF magic bytes %PDF-')

    // PDF text stream must contain the key clinical and invoice metadata
    assert.ok(rawPdfString.includes('INV-000020'), 'PDF stream must include Invoice ID')
    assert.ok(rawPdfString.includes('RCPT-2026-0020'), 'PDF stream must include Receipt Reference')
    assert.ok(rawPdfString.includes('Cardiology'), 'PDF stream must include Service/Item details')
    assert.ok(rawPdfString.includes('PAID IN FULL'), 'PDF stream must include PAID status badge text')
  })

  await t.test('7. Receipt PDF generation gracefully validates missing or invalid invoice data', () => {
    // Missing invoice parameter
    assert.throws(
      () => createReceiptPdf(null),
      /Invalid invoice record/,
      'Should throw descriptive error when invoice is null'
    )

    // Missing invoice id
    assert.throws(
      () => createReceiptPdf({ amount: 100 }),
      /Invalid invoice record/,
      'Should throw descriptive error when invoice has no identifier'
    )
  })

  await t.test('8. downloadReceiptPdf operates safely in headless/Node environment', () => {
    const invoice = {
      id: 'INV-000019',
      amount: 120.0,
      status: 'Paid',
    }

    // In Node (where window is undefined), downloadReceiptPdf must return doc and fileName gracefully
    const result = downloadReceiptPdf(invoice)
    assert.ok(result.doc, 'Returns valid jsPDF doc')
    assert.strictEqual(result.fileName, 'Receipt_INV-000019.pdf', 'Generates correct file name')
  })
})
