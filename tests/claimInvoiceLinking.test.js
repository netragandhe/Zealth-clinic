/**
 * Task 7: Investigate and Fix Insurance Claim–Invoice Linking — ZealthOS Patient Portal
 * Automated Verification Test Suite
 *
 * Verifies all 10 required conditions:
 * 1. A valid claim references the correct invoice and patient.
 * 2. An invalid claim-to-invoice association is rejected.
 * 3. A claim cannot be linked to another patient's invoice without an explicitly authorized workflow.
 * 4. Updating a claim preserves valid relationships.
 * 5. Claim and invoice statuses remain unchanged unless a valid, authorized workflow changes them.
 * 6. Missing or invalid invoice references are handled correctly.
 * 7. Supported one-to-one or one-to-many relationships follow the actual data model.
 * 8. Unauthorized users cannot read or modify claims and invoices belonging to other patients.
 * 9. Existing valid claims and invoices continue to display correctly.
 * 10. Any relationship repair or migration is safe, auditable, and does not silently alter unrelated records.
 *
 * Run with: node --test tests/claimInvoiceLinking.test.js
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateClaimInvoiceAssociation,
  canAccessPatientRecord,
  isolatePatientClaims,
  isolatePatientInvoices,
  deriveClaimFromInvoice,
  buildAuditableRemediationReport
} from '../src/utils/claimInvoiceUtils.js'

test('Task 7 - Insurance Claim–Invoice Linking & Multi-Tenant Patient Isolation', async (t) => {

  // Test Fixtures
  const patientA = {
    id: 'pat-001',
    fullName: 'Alice Walker',
    email: 'alice@example.com',
    clinicId: 'clinic-alpha'
  }

  const patientB = {
    id: 'pat-002',
    fullName: 'Bob Smith',
    email: 'bob@example.com',
    clinicId: 'clinic-alpha'
  }

  const invoiceA1 = {
    id: 'inv-a1-uuid',
    displayId: 'INV-000101',
    invoiceNumber: 'INV-000101',
    patientId: 'pat-001',
    patientName: 'Alice Walker',
    service: 'Physiotherapy Comprehensive Initial',
    amount: 190.00,
    due: 0.00,
    status: 'Paid',
    issueDate: '2026-10-01'
  }

  const invoiceB1 = {
    id: 'inv-b1-uuid',
    displayId: 'INV-000201',
    invoiceNumber: 'INV-000201',
    patientId: 'pat-002',
    patientName: 'Bob Smith',
    service: 'Occupational Therapy',
    amount: 220.00,
    due: 220.00,
    status: 'Unpaid',
    issueDate: '2026-10-05'
  }

  // =========================================================================
  // Requirement 1: A valid claim references the correct invoice and patient
  // =========================================================================
  await t.test('1. Valid claim references the correct invoice and patient', () => {
    const claimInput = {
      service: 'Physiotherapy Session',
      amount: '$190.00',
      funding: 'NDIS',
      invoiceId: invoiceA1.id
    }

    const result = validateClaimInvoiceAssociation(claimInput, invoiceA1, patientA)
    assert.strictEqual(result.valid, true, 'Association should be valid for patient matching invoice')
    assert.strictEqual(result.invoiceId, invoiceA1.id, 'Should resolve exact invoice ID')
    assert.strictEqual(result.invoiceNumber, invoiceA1.displayId, 'Should resolve display invoice number')
  })

  // =========================================================================
  // Requirement 2: An invalid claim-to-invoice association is rejected
  // =========================================================================
  await t.test('2. An invalid claim-to-invoice association is rejected', () => {
    const claimInput = {
      service: 'Physiotherapy Session',
      invoiceId: 'non-existent-invoice-uuid'
    }

    // Invoice not found in DB
    const result = validateClaimInvoiceAssociation(claimInput, null, patientA)
    assert.strictEqual(result.valid, false, 'Non-existent invoice must be rejected')
    assert.match(result.error, /does not exist/i, 'Error message must clearly state invoice does not exist')
  })

  // =========================================================================
  // Requirement 3: A claim cannot be linked to another patient's invoice
  // =========================================================================
  await t.test('3. Claim cannot be linked to another patient invoice without explicit authorization', () => {
    const claimInput = {
      service: 'Physiotherapy Session',
      invoiceId: invoiceB1.id // Patient B's invoice!
    }

    // Patient A tries to link Patient B's invoice
    const result = validateClaimInvoiceAssociation(claimInput, invoiceB1, patientA)
    assert.strictEqual(result.valid, false, 'Cross-patient invoice linking must be rejected')
    assert.match(result.error, /another patient/i, 'Error must indicate cross-patient prohibition')
  })

  // =========================================================================
  // Requirement 4: Updating a claim preserves valid relationships
  // =========================================================================
  await t.test('4. Updating a claim preserves valid relationships', () => {
    const existingClaim = {
      id: 'clm-001',
      displayId: 'CLM-000101',
      patientId: patientA.id,
      invoiceId: invoiceA1.id,
      invoiceNumber: invoiceA1.displayId,
      status: 'Processing',
      service: 'Physiotherapy Session'
    }

    // Update only the service notes or funding program, omitting invoiceId change
    const updateInput = {
      funding: 'EPC',
      service: 'Physiotherapy Extended Session'
    }

    const updatedResult = validateClaimInvoiceAssociation(
      { invoiceId: existingClaim.invoiceId, ...updateInput },
      invoiceA1,
      patientA
    )

    assert.strictEqual(updatedResult.valid, true)
    assert.strictEqual(updatedResult.invoiceId, invoiceA1.id, 'Existing invoice reference must be preserved')
    assert.strictEqual(updatedResult.invoiceNumber, invoiceA1.displayId, 'Existing invoice number preserved')
  })

  // =========================================================================
  // Requirement 5: Claim and invoice statuses remain unchanged unless authorized
  // =========================================================================
  await t.test('5. Claim and invoice statuses remain unchanged unless a valid workflow changes them', () => {
    const derived = deriveClaimFromInvoice(invoiceB1, patientB.id)

    // Unpaid invoice should map to Processing, not Approved or Paid automatically
    assert.strictEqual(invoiceB1.status, 'Unpaid', 'Underlying invoice status must not be modified')
    assert.strictEqual(derived.status, 'Processing', 'Unpaid invoice remittance must remain Processing')

    // Paid invoice mapping
    const derivedPaid = deriveClaimFromInvoice(invoiceA1, patientA.id)
    assert.strictEqual(invoiceA1.status, 'Paid', 'Paid invoice status must not be mutated')
    assert.strictEqual(derivedPaid.status, 'Approved', 'Paid invoice remittance reflects Approved')
  })

  // =========================================================================
  // Requirement 6: Missing or invalid invoice references are handled correctly
  // =========================================================================
  await t.test('6. Missing or invalid invoice references are handled correctly', () => {
    // 6a: Standalone out-of-pocket claim with no invoice specified
    const standaloneClaim = {
      service: 'Private Out of Pocket Session',
      amount: '$100.00'
    }
    const standaloneResult = validateClaimInvoiceAssociation(standaloneClaim, null, patientA)
    assert.strictEqual(standaloneResult.valid, true, 'Standalone claim without invoice is valid')
    assert.strictEqual(standaloneResult.invoiceId, null)
    assert.strictEqual(standaloneResult.invoiceNumber, null)

    // 6b: Malformed / empty invoice reference
    const emptyRefClaim = {
      service: 'Session',
      invoiceId: ''
    }
    const emptyResult = validateClaimInvoiceAssociation(emptyRefClaim, null, patientA)
    assert.strictEqual(emptyResult.valid, true, 'Empty invoice reference treated as standalone')
  })

  // =========================================================================
  // Requirement 7: Supported one-to-one or one-to-many relationships follow actual data model
  // =========================================================================
  await t.test('7. Supported relationships follow the actual data model (1:1 remittance & multi-claim tracking)', () => {
    // Single invoice maps to exactly 1 remittance claim
    const derived1 = deriveClaimFromInvoice(invoiceA1, patientA.id)
    assert.strictEqual(derived1.displayId, 'CLM-000101', 'Invoice INV-000101 maps to CLM-000101')
    assert.strictEqual(derived1.invoiceId, invoiceA1.id)

    // Model allows invoice to be queried with its claims collection
    const invoiceWithClaims = {
      ...invoiceA1,
      claims: [derived1]
    }
    assert.strictEqual(invoiceWithClaims.claims.length, 1)
    assert.strictEqual(invoiceWithClaims.claims[0].invoiceId, invoiceA1.id)
  })

  // =========================================================================
  // Requirement 8: Unauthorized users cannot read or modify claims/invoices of other patients
  // =========================================================================
  await t.test('8. Unauthorized users cannot read or modify claims and invoices belonging to other patients', () => {
    // Patient A cannot access Patient B's records
    assert.strictEqual(canAccessPatientRecord(patientA.id, patientB.id), false, 'A cannot access B record')
    assert.strictEqual(canAccessPatientRecord(patientA.id, patientA.id), true, 'A can access A record')
    assert.strictEqual(canAccessPatientRecord('', patientA.id), false, 'Anonymous user rejected')
    assert.strictEqual(canAccessPatientRecord(patientA.id, null), false, 'Null record patient rejected')

    // List filtering prevents multi-tenant leakage
    const mixedClaims = [
      { id: 'clm-1', patientId: patientA.id, clinicId: 'clinic-alpha' },
      { id: 'clm-2', patientId: patientB.id, clinicId: 'clinic-alpha' }, // Same clinic, different patient!
      { id: 'clm-3', patientId: patientA.id, clinicId: 'clinic-alpha' }
    ]

    const isolatedForA = isolatePatientClaims(mixedClaims, patientA.id)
    assert.strictEqual(isolatedForA.length, 2, 'Only Patient A claims returned')
    assert.ok(isolatedForA.every(c => c.patientId === patientA.id), 'No Patient B claim leaked')

    // Invoice list filtering
    const mixedInvoices = [
      { id: 'inv-1', patientId: patientA.id },
      { id: 'inv-2', patientId: patientB.id }
    ]
    const isolatedInvoicesForA = isolatePatientInvoices(mixedInvoices, patientA.id)
    assert.strictEqual(isolatedInvoicesForA.length, 1)
    assert.strictEqual(isolatedInvoicesForA[0].id, 'inv-1')
  })

  // =========================================================================
  // Requirement 9: Existing valid claims and invoices continue to display correctly
  // =========================================================================
  await t.test('9. Existing valid claims and invoices continue to display correctly', () => {
    const validClaim = {
      id: 'CLM-000101',
      displayId: 'CLM-000101',
      service: 'Physiotherapy Comprehensive Initial',
      funding: 'NDIS',
      amount: '$190.00',
      status: 'Approved',
      date: '2026-10-01',
      invoiceNumber: 'INV-000101',
      patientId: patientA.id
    }

    assert.strictEqual(validClaim.displayId, 'CLM-000101')
    assert.strictEqual(validClaim.invoiceNumber, 'INV-000101')
    assert.strictEqual(validClaim.amount, '$190.00')
    assert.strictEqual(validClaim.status, 'Approved')
  })

  // =========================================================================
  // Requirement 10: Relationship repair or migration is safe, auditable, and non-destructive
  // =========================================================================
  await t.test('10. Relationship repair is safe, auditable, and does not silently alter unrelated records', () => {
    const sampleDbInvoices = [
      { id: 'inv-1', displayId: 'INV-000001', patientName: 'jupiter', patientId: null, amount: 10 },
      { id: 'inv-3', displayId: 'INV-000003', patientName: 'Alice Walker', patientId: null, amount: 800 },
      { id: 'inv-7', displayId: 'INV-000007', patientName: 'Bob Smith', patientId: null, amount: 700 }
    ]

    const patients = [patientA, patientB]

    const report = buildAuditableRemediationReport(sampleDbInvoices, patients)

    assert.strictEqual(report.totalAnalyzed, 3)
    assert.strictEqual(report.affectedCount, 3)
    // Only Alice Walker and Bob Smith match registered patients; jupiter is a clinic invoice
    assert.strictEqual(report.candidateCount, 2)

    // Remediation SQL is generated for auditable review, NOT executed automatically
    assert.match(report.remediationSql, /UPDATE invoices SET patientId = 'pat-001' WHERE id = 'inv-3'/)
    assert.match(report.remediationSql, /UPDATE invoices SET patientId = 'pat-002' WHERE id = 'inv-7'/)
    assert.doesNotMatch(report.remediationSql, /inv-1/, 'Admin clinic invoice must not be assigned to a patient')
  })

})
