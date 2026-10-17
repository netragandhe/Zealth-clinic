/**
 * progressUtils.js
 *
 * Shared authoritative utilities for computing patient progress, treatment plan
 * adherence, and exercise compliance percentages used across the ZealthOS patient portal:
 *
 *   - PatientDashboard    : Active Plan Adherence & treatment progress
 *   - PatientTreatmentPlans: Multidisciplinary goals & live practice routine
 *   - PatientProgressOutcomes: Active care compliance & clinical outcome tracking
 *   - PatientExercises    : Daily prescribed routine adherence
 *
 * Provides a single authoritative calculation source to guarantee consistency across
 * components while respecting distinct clinical metrics and reporting periods.
 */

/**
 * Checks whether a treatment goal is a daily practice / exercise adherence goal.
 *
 * @param {Object} goal - Goal object with a title property.
 * @returns {boolean}
 */
export function isPracticeGoal(goal) {
  if (!goal || typeof goal.title !== 'string') return false
  const t = goal.title.toLowerCase()
  return (
    t.includes('daily practice') ||
    t.includes('milestone routine') ||
    t.includes('practice') ||
    t.includes('exercise')
  )
}

/**
 * Computes the exercise compliance percentage for a list of prescribed exercises.
 * Formula: Math.round((completed / total) * 100).
 *
 * @param {Array} exercises - Array of exercise objects with a truthy `done` field.
 * @returns {number} Integer 0-100. Returns 0 when empty, null, or invalid.
 */
export function computeExerciseCompliancePercent(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return 0
  const done = exercises.filter(e => !!e.done).length
  return Math.min(100, Math.max(0, Math.round((done / exercises.length) * 100)))
}

/**
 * Computes the progress of an individual treatment plan goal.
 * For daily practice goals, dynamically incorporates the live exercise compliance
 * when an exercise list is provided.
 *
 * @param {Object} goal - Goal object with title and optional percent.
 * @param {Array}  [exercises] - Optional current prescribed exercises list.
 * @returns {number} Integer 0-100.
 */
export function computePlanGoalProgress(goal, exercises = []) {
  if (!goal) return 0
  if (isPracticeGoal(goal) && Array.isArray(exercises) && exercises.length > 0) {
    return computeExerciseCompliancePercent(exercises)
  }
  const raw = goal.percent
  if (raw === undefined || raw === null) return 0
  const num = Number(raw)
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num)))
}

/**
 * Computes the overall progress percentage for a treatment plan.
 * If the plan has defined goals, the overall progress is the arithmetic mean
 * of its goals' percentages. If no goals are defined, falls back to the plan's
 * stored `overallProgress` field (defaulting to 0 if absent/invalid).
 *
 * @param {Object} plan - Treatment plan object.
 * @param {Array}  [exercises] - Optional current prescribed exercises list.
 * @returns {number} Integer 0-100.
 */
export function computePlanOverallProgress(plan, exercises = []) {
  if (!plan) return 0

  if (Array.isArray(plan.goals) && plan.goals.length > 0) {
    const sum = plan.goals.reduce((acc, g) => {
      return acc + computePlanGoalProgress(g, exercises)
    }, 0)
    return Math.min(100, Math.max(0, Math.round(sum / plan.goals.length)))
  }

  const raw = plan.overallProgress
  if (raw === undefined || raw === null) return 0
  const num = Number(raw)
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num)))
}

/**
 * Derives the Dashboard "Active Plan Adherence" percentage from treatment plans
 * and optional exercises. Uses the first active plan found.
 *
 * @param {Array} treatmentPlans - Array of treatment plan objects.
 * @param {Array} [exercises]    - Optional current prescribed exercises list.
 * @returns {number} Integer 0-100. Returns 0 when no active plan exists.
 */
export function computeActivePlanAdherence(treatmentPlans, exercises = []) {
  if (!Array.isArray(treatmentPlans) || treatmentPlans.length === 0) return 0
  const activePlan = treatmentPlans.find(
    p => (p.status || 'Active').toLowerCase() === 'active'
  )
  if (!activePlan) return 0
  return computePlanOverallProgress(activePlan, exercises)
}

/**
 * Formats a numeric compliance percentage into an authoritative display string.
 * e.g., 88 -> "88% Completed"
 *
 * @param {number|string} percent
 * @param {string} [unit="Completed"] e.g. "Completed", "Worn"
 * @returns {string} e.g. "50% Completed"
 */
export function formatComplianceString(percent, unit = 'Completed') {
  if (percent === null || percent === undefined) return `0% ${unit}`
  const num = Number(percent)
  if (isNaN(num)) return `0% ${unit}`
  const clamped = Math.min(100, Math.max(0, Math.round(num)))
  return `${clamped}% ${unit}`
}

/**
 * Parses a compliance string like "88% Completed" back to an integer percent.
 * Returns null if the string is not in the expected format.
 *
 * @param {string} complianceString - e.g. "88% Completed" or "88%"
 * @returns {number|null}
 */
export function parseComplianceString(complianceString) {
  if (typeof complianceString !== 'string') return null
  const match = complianceString.match(/^(\d+)%/)
  if (!match) return null
  const num = parseInt(match[1], 10)
  return isNaN(num) ? null : num
}

/**
 * Isolates records by patient ID to prevent cross-patient data leakage.
 *
 * @param {Array}  records   - Array of objects with patientId property.
 * @param {string} patientId - Target patient identifier.
 * @returns {Array}
 */
export function isolatePatientRecords(records, patientId) {
  if (!Array.isArray(records)) return []
  if (!patientId) return []
  return records.filter(r => r && (r.patientId === patientId || String(r.patientId) === String(patientId)))
}

/**
 * Filters and aggregates records within a specific reporting period window.
 * Avoids treating different reporting periods as identical.
 *
 * @param {Array}  records   - Array of records with a date/sessionDate property.
 * @param {string} startDate - Inclusive start date (YYYY-MM-DD).
 * @param {string} endDate   - Inclusive end date (YYYY-MM-DD).
 * @returns {Array}
 */
export function filterRecordsByPeriod(records, startDate, endDate) {
  if (!Array.isArray(records)) return []
  return records.filter(r => {
    const rawDate = r.sessionDate || r.date || r.createdAt
    if (!rawDate) return false
    const d = new Date(rawDate).toISOString().slice(0, 10)
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })
}