/**
 * progressUtils.js
 *
 * Shared utilities for computing patient progress and exercise compliance
 * percentages used across the patient portal:
 *
 *   - PatientDashboard    : overallProgress  (stored on treatment plan record)
 *   - PatientTreatmentPlans: liveDailyPracticePercent (computed from exercises)
 *   - PatientProgressOutcomes: complianceCompleted    (same exercise computation)
 *
 * Having a single authoritative formula here prevents the fallback values from
 * diverging across components (the root cause of Task 5).
 */

/**
 * Computes the exercise compliance percentage for a list of prescribed exercises.
 *
 * @param {Array} exercises  - Array of exercise objects with a truthy `done` field.
 * @returns {number}  Integer 0-100. Returns 0 (not a fabricated number) when the
 *                    exercise list is empty or absent — consistent with all other
 *                    progress fallbacks in the portal.
 */
export function computeExerciseCompliancePercent(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return 0
  const done = exercises.filter(e => !!e.done).length
  return Math.round((done / exercises.length) * 100)
}

/**
 * Derives the Dashboard "Active Plan Adherence" percentage from a list of
 * treatment plans. Returns the `overallProgress` field of the first active
 * plan, falling back to 0 when absent.
 *
 * @param {Array}  treatmentPlans - Array of treatment plan objects.
 * @returns {number} Integer 0-100.
 */
export function computeActivePlanAdherence(treatmentPlans) {
  if (!Array.isArray(treatmentPlans)) return 0
  const activePlan = treatmentPlans.find(
    p => (p.status || 'Active').toLowerCase() === 'active'
  )
  if (!activePlan) return 0
  const val = activePlan.overallProgress
  if (val === undefined || val === null) return 0
  const num = Number(val)
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num)))
}

/**
 * Parses a compliance string like "88% Completed" back to an integer percent.
 * Returns null if the string is not in the expected format.
 *
 * Used to extract the numeric value from backend metric strings for display
 * or further comparison.
 *
 * @param {string} complianceString  e.g. "88% Completed"
 * @returns {number|null}
 */
export function parseComplianceString(complianceString) {
  if (typeof complianceString !== 'string') return null
  const match = complianceString.match(/^(\d+)%/)
  if (!match) return null
  const num = parseInt(match[1], 10)
  return isNaN(num) ? null : num
}