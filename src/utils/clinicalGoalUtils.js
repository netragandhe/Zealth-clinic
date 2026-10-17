/**
 * clinicalGoalUtils.js
 * Utility module for Clinical Goals & Treatment Plans Permissions (Task 6).
 *
 * Enforces role-based authorization rules:
 * - Authorized clinical roles (PRACTITIONER, CLINIC_ADMIN, SUPER_ADMIN) have full management rights (create, edit, delete).
 * - Patients and non-clinical roles (PATIENT, SALES_EXECUTIVE) can VIEW their clinical goals and track daily practice adherence,
 *   but are STRICTLY FORBIDDEN from creating, editing, adjusting, or deleting clinical goals.
 */

export const AUTHORIZED_CLINICAL_ROLES = Object.freeze([
  'PRACTITIONER',
  'CLINIC_ADMIN',
  'SUPER_ADMIN'
])

export const UNAUTHORIZED_MUTATION_ROLES = Object.freeze([
  'PATIENT',
  'SALES_EXECUTIVE'
])

/**
 * Normalizes user role strings across legacy casing and aliases.
 * Matches backend normalizeRole logic.
 *
 * @param {string|null|undefined} role
 * @returns {string} Normalized uppercase role identifier
 */
export function normalizeUserRole(role) {
  if (!role || !String(role).trim()) return ''
  const r = String(role).trim().toUpperCase().replace(/[\s_-]+/g, '_')
  if (r === 'SUPERADMIN' || r === 'HEAD_ADMIN' || r === 'HEADADMIN' || r === 'ADMIN') return 'SUPER_ADMIN'
  if (r === 'CLINICADMIN' || r === 'CLINIC_ADMIN' || r === 'CLINIC') return 'CLINIC_ADMIN'
  if (r === 'DOCTOR' || r === 'PRACTITIONER') return 'PRACTITIONER'
  if (r === 'SALES' || r === 'SALESPERSON' || r === 'SALES_EXECUTIVE' || r === 'SALESEXECUTIVE') return 'SALES_EXECUTIVE'
  if (r === 'PATIENT' || r === 'CLIENT') return 'PATIENT'
  return r
}

/**
 * Evaluates whether a role is authorized to create, edit, or delete clinical goals and treatment plans.
 *
 * @param {string|null|undefined} role
 * @returns {boolean} True if role is authorized clinical role
 */
export function canManageClinicalGoals(role) {
  const normalized = normalizeUserRole(role)
  return AUTHORIZED_CLINICAL_ROLES.includes(normalized)
}

/**
 * Evaluates whether a user role has read-only or viewing access to clinical goals.
 * Authenticated patients and clinicians can view their goals.
 *
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export function canViewClinicalGoals(role) {
  const normalized = normalizeUserRole(role)
  return !!normalized && normalized.length > 0
}

/**
 * Evaluates whether a specific action is permitted on clinical goals for a role.
 * Actions: 'create', 'edit', 'delete', 'adjust_progress', 'view', 'toggle_exercise'
 *
 * @param {string|null|undefined} role
 * @param {string} action
 * @returns {boolean}
 */
export function isGoalActionPermitted(role, action) {
  const normalized = normalizeUserRole(role)
  const act = String(action || '').toLowerCase()

  if (act === 'view') {
    return !!normalized
  }

  // Patients CAN toggle their own exercise compliance to update daily practice adherence
  if (act === 'toggle_exercise') {
    return normalized === 'PATIENT' || AUTHORIZED_CLINICAL_ROLES.includes(normalized)
  }

  // Clinical goal mutations (create, edit, delete, quick adjust) strictly require authorized clinical roles
  if (['create', 'edit', 'delete', 'adjust_progress', 'modify'].includes(act)) {
    return AUTHORIZED_CLINICAL_ROLES.includes(normalized)
  }

  return false
}

/**
 * Validates a treatment plan / goal mutation attempt.
 * Returns an authorization result object.
 *
 * @param {Object} params
 * @param {string} params.userRole
 * @param {Object} [params.existingPlan]
 * @param {Object} [params.payload]
 * @returns {{ allowed: boolean, statusCode: number, error: string|null }}
 */
export function validateGoalMutation({ userRole, existingPlan, payload }) {
  const normalized = normalizeUserRole(userRole)

  if (!normalized) {
    return {
      allowed: false,
      statusCode: 401,
      error: 'Authentication required. Missing user role.'
    }
  }

  if (!AUTHORIZED_CLINICAL_ROLES.includes(normalized)) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Forbidden. Role '${userRole}' is not authorized to create, edit, or delete clinical goals.`
    }
  }

  // Prevent modifying another patient's goals via payload manipulation
  if (existingPlan && payload && payload.patientId) {
    if (String(existingPlan.patientId) !== String(payload.patientId)) {
      return {
        allowed: false,
        statusCode: 403,
        error: "Forbidden. Cannot modify another patient's clinical goals by changing patientId."
      }
    }
  }

  return {
    allowed: true,
    statusCode: 200,
    error: null
  }
}

/**
 * Strictly isolates treatment plans belonging to a given patient.
 *
 * @param {Array<Object>} plans
 * @param {string} patientId
 * @returns {Array<Object>}
 */
export function isolatePatientPlans(plans, patientId) {
  if (!Array.isArray(plans)) return []
  if (!patientId) return []
  return plans.filter(p => p && String(p.patientId) === String(patientId))
}
