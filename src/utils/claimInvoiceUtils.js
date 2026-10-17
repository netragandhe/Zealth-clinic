/**
 * claimInvoiceUtils.js
 * Business logic and validation utilities for insurance claim-to-invoice linking,
 * patient data isolation, relationship validation, and remediation planning.
 */

/**
 * Validates that a claim's referenced invoice exists and belongs to the same patient.
 * Rejects invalid cross-patient associations.
 *
 * @param {Object} claimData - The claim data submitted or being updated
 * @param {Object|null} referencedInvoice - The invoice looked up from database/store
 * @param {Object} patient - The current authenticated patient { id, fullName, ... }
 * @returns {{ valid: boolean, error?: string, invoiceId?: string, invoiceNumber?: string }}
 */
export function validateClaimInvoiceAssociation(claimData = {}, referencedInvoice = null, patient = {}) {
  const invoiceId = claimData.invoiceId || claimData.referencedInvoiceId
  const invoiceNumber = claimData.invoiceNumber || claimData.referencedInvoiceNumber

  // If no invoice is linked, the claim is standalone
  if (!invoiceId && !invoiceNumber) {
    return {
      valid: true,
      invoiceId: null,
      invoiceNumber: null
    }
  }

  // Invoice was referenced but could not be found
  if (!referencedInvoice) {
    return {
      valid: false,
      error: 'The referenced invoice does not exist in clinic records.'
    }
  }

  // Cross-patient validation: invoice must strictly belong to the same patient
  if (referencedInvoice.patientId && patient.id && referencedInvoice.patientId !== patient.id) {
    return {
      valid: false,
      error: 'Unauthorized: Cannot link insurance claim to an invoice belonging to another patient.'
    }
  }

  const resolvedId = referencedInvoice.id || referencedInvoice.rawId || invoiceId
  const resolvedNumber = referencedInvoice.displayId || referencedInvoice.invoiceNumber || invoiceNumber || resolvedId

  return {
    valid: true,
    invoiceId: resolvedId,
    invoiceNumber: resolvedNumber
  }
}

/**
 * Validates whether a patient has authorization to read or modify a claim or invoice record.
 *
 * @param {string} loggedInPatientId - The authenticated patient's ID
 * @param {string|null} recordPatientId - The patient ID on the target record
 * @returns {boolean}
 */
export function canAccessPatientRecord(loggedInPatientId, recordPatientId) {
  if (!loggedInPatientId || !recordPatientId) return false
  return String(loggedInPatientId).trim() === String(recordPatientId).trim()
}

/**
 * Filters claims to strictly belong to the specified patient ID.
 * Prevents multi-tenant leakage where clinicId OR conditions would expose other patients' claims.
 *
 * @param {Array} claims - Raw claims array
 * @param {string} patientId - The patient ID to isolate to
 * @returns {Array}
 */
export function isolatePatientClaims(claims = [], patientId = '') {
  if (!Array.isArray(claims) || !patientId) return []
  return claims.filter(c => c && c.patientId && String(c.patientId) === String(patientId))
}

/**
 * Filters invoices to strictly belong to the specified patient ID.
 * Replaces loose substring matching with stable database foreign key matching.
 *
 * @param {Array} invoices - Raw invoices array
 * @param {string} patientId - The patient ID to isolate to
 * @returns {Array}
 */
export function isolatePatientInvoices(invoices = [], patientId = '') {
  if (!Array.isArray(invoices) || !patientId) return []
  return invoices.filter(inv => inv && inv.patientId && String(inv.patientId) === String(patientId))
}

/**
 * Formats and derives a synthesized claim remittance item from an authentic patient invoice.
 * Adheres strictly to the 1-to-1 invoice remittance cardinality and preserves status.
 *
 * @param {Object} invoice - The authentic patient invoice
 * @param {string} patientId - The patient ID
 * @returns {Object}
 */
export function deriveClaimFromInvoice(invoice, patientId) {
  if (!invoice) return null
  const invRef = invoice.displayId || invoice.invoiceNumber || invoice.id || ''
  const clmDisplayId = `CLM-${String(invRef).replace(/^INV-/, '')}`
  const amt = Number(invoice.amount != null ? invoice.amount : (invoice.due != null ? invoice.due : 0))

  let resolvedFunding = invoice.funding || invoice.claimType || invoice.fundingType || null
  if (!resolvedFunding && invoice.items) {
    try {
      const parsed = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
      if (Array.isArray(parsed) && parsed[0]?.funding) resolvedFunding = parsed[0].funding
      else if (typeof parsed === 'object' && parsed?.funding) resolvedFunding = parsed.funding
    } catch (e) {}
  }
  if (!resolvedFunding) {
    const svc = (invoice.service || '').toLowerCase()
    if (svc.includes('ndis')) resolvedFunding = 'NDIS'
    else if (svc.includes('epc') || svc.includes('medicare')) resolvedFunding = 'EPC'
    else if (svc.includes('workcover')) resolvedFunding = 'WorkCover'
    else if (svc.includes('private')) resolvedFunding = 'Private'
    else resolvedFunding = 'Medicare / Health Cover'
  }

  return {
    id: clmDisplayId,
    displayId: clmDisplayId,
    patientId: invoice.patientId || patientId,
    clinicId: invoice.clinicId || null,
    invoiceId: invoice.id,
    invoiceNumber: invRef,
    invoiceStatus: invoice.status,
    invoiceAmount: `$${amt.toFixed(2)}`,
    service: invoice.service || 'Clinical Services Consultation',
    funding: resolvedFunding,
    amount: `$${amt.toFixed(2)}`,
    // Status preservation: reflects invoice payment status without mutating the underlying invoice
    status: (invoice.status || '').toLowerCase() === 'paid' ? 'Approved' : 'Processing',
    date: invoice.issueDate || invoice.dueDate || new Date().toISOString().split('T')[0],
    isInvoiceRemittance: true
  }
}

/**
 * Builds an auditable remediation proposal for mismatched or unlinked records.
 * Does NOT execute mutations directly, ensuring safe, authorized migration planning.
 *
 * @param {Array} invoices - All existing invoices to analyze
 * @param {Array} patients - Registered patients
 * @returns {{ affectedRecords: Array, totalAnalyzed: number, cleanCount: number, remediationSql: string }}
 */
export function buildAuditableRemediationReport(invoices = [], patients = []) {
  const affected = []

  for (const inv of invoices) {
    if (!inv.patientId) {
      // Find candidate match based on EXACT patient name
      const exactMatch = patients.find(p => (p.fullName || '').trim() === (inv.patientName || '').trim())
      affected.push({
        invoiceId: inv.id,
        displayId: inv.displayId || inv.invoiceNumber,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        status: inv.status,
        rawPatientName: inv.patientName,
        recipient: inv.recipient,
        proposedPatientId: exactMatch ? exactMatch.id : null,
        proposedPatientName: exactMatch ? exactMatch.fullName : null,
        issueType: exactMatch ? 'MISSING_FOREIGN_KEY_CANDIDATE' : 'ADMIN_OR_ORPHAN_INVOICE'
      })
    }
  }

  const candidateUpdates = affected.filter(a => a.proposedPatientId)
  const remediationSql = candidateUpdates.map(u => 
    `-- Verification required for Invoice ${u.displayId} (${u.rawPatientName}):\n` +
    `UPDATE invoices SET patientId = '${u.proposedPatientId}' WHERE id = '${u.invoiceId}' AND patientId IS NULL;\n`
  ).join('\n')

  return {
    totalAnalyzed: invoices.length,
    affectedCount: affected.length,
    candidateCount: candidateUpdates.length,
    affectedRecords: affected,
    remediationSql
  }
}
