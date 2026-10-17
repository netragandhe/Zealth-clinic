/**
 * Task 6: Fix Clinical Goals Permissions — ZealthOS Patient Portal
 * Automated Verification Test Suite
 *
 * Verifies:
 * 1. Patient cannot see unauthorized Edit/Delete actions in UI/permissions model.
 * 2. Patient cannot create a clinical goal if not authorized.
 * 3. Patient cannot edit a clinical goal through a direct API request (403 Forbidden).
 * 4. Patient cannot delete a clinical goal through a direct API request (403 Forbidden).
 * 5. Unauthorized requests leave database records unchanged.
 * 6. A patient cannot modify another patient's goals (cross-patient tampering prevented).
 * 7. An authorized clinician/practitioner can perform permitted actions (create, edit, delete).
 * 8. Unauthenticated requests are rejected (401 Unauthorized).
 * 9. Existing view permissions and unrelated treatment-plan behavior (e.g. exercise toggle) continue to work.
 *
 * Run with: node --test tests/clinicalGoalsPermissions.test.js
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canManageClinicalGoals,
  canViewClinicalGoals,
  isGoalActionPermitted,
  validateGoalMutation,
  isolatePatientPlans,
  normalizeUserRole,
  AUTHORIZED_CLINICAL_ROLES,
  UNAUTHORIZED_MUTATION_ROLES
} from '../src/utils/clinicalGoalUtils.js'
import {
  computeExerciseCompliancePercent,
  computePlanOverallProgress
} from '../src/utils/progressUtils.js'

test('Task 6 - Clinical Goals Permissions & Role-Based Authorization', async (t) => {

  // =========================================================================
  // Requirement 1: Patient cannot see unauthorized Edit/Delete actions
  // =========================================================================
  await t.test('1. Patient cannot see unauthorized Edit/Delete/Create actions in UI permissions model', () => {
    const patientRoles = ['PATIENT', 'patient', 'CLIENT', 'client']

    for (const r of patientRoles) {
      assert.strictEqual(canManageClinicalGoals(r), false, `Role ${r} should not have goal management permission`)
      assert.strictEqual(isGoalActionPermitted(r, 'create'), false, `Role ${r} must not see Create Goal action`)
      assert.strictEqual(isGoalActionPermitted(r, 'edit'), false, `Role ${r} must not see Edit Goal action`)
      assert.strictEqual(isGoalActionPermitted(r, 'delete'), false, `Role ${r} must not see Delete Goal action`)
      assert.strictEqual(isGoalActionPermitted(r, 'adjust_progress'), false, `Role ${r} must not see +/- progress adjustments`)
    }

    // Also verify non-patient, non-clinical roles (e.g. SALES_EXECUTIVE) do not have permission
    assert.strictEqual(canManageClinicalGoals('sales'), false, 'Sales role must not manage clinical goals')
    assert.strictEqual(canManageClinicalGoals('SALES_EXECUTIVE'), false, 'Sales executive must not manage clinical goals')
  })

  // =========================================================================
  // Requirement 2: Patient cannot create a clinical goal if not authorized
  // =========================================================================
  await t.test('2. Patient cannot create a clinical goal if not authorized', () => {
    const payload = {
      condition: 'Lumbar Rehabilitation',
      goals: [
        { id: 'g_new', title: 'Self-created Goal', percent: 100, status: 'Active' }
      ]
    }

    const patientAttempt = validateGoalMutation({
      userRole: 'PATIENT',
      payload
    })

    assert.strictEqual(patientAttempt.allowed, false)
    assert.strictEqual(patientAttempt.statusCode, 403)
    assert.match(patientAttempt.error, /Forbidden/i)

    const salesAttempt = validateGoalMutation({
      userRole: 'SALES_EXECUTIVE',
      payload
    })
    assert.strictEqual(salesAttempt.allowed, false)
    assert.strictEqual(salesAttempt.statusCode, 403)
  })

  // =========================================================================
  // Requirement 3: Patient cannot edit a clinical goal through a direct API request
  // =========================================================================
  await t.test('3. Patient cannot edit a clinical goal through a direct API request', () => {
    const existingPlan = {
      id: 'tp_101',
      patientId: 'patient_1',
      condition: 'Cervical Spine Mobilisation',
      goals: [
        { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 40, status: 'Active' }
      ]
    }

    // Direct API attempt by patient to modify target percent to 100%
    const updatePayload = {
      goals: [
        { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 100, status: 'Completed' }
      ]
    }

    const result = validateGoalMutation({
      userRole: 'patient',
      existingPlan,
      payload: updatePayload
    })

    assert.strictEqual(result.allowed, false)
    assert.strictEqual(result.statusCode, 403)
    assert.match(result.error, /Forbidden/i)
  })

  // =========================================================================
  // Requirement 4: Patient cannot delete a clinical goal through a direct API request
  // =========================================================================
  await t.test('4. Patient cannot delete a clinical goal through a direct API request', () => {
    const isDeleteAllowed = isGoalActionPermitted('patient', 'delete')
    assert.strictEqual(isDeleteAllowed, false, 'Patient must be rejected from deleting clinical goals')

    const mutationCheck = validateGoalMutation({
      userRole: 'PATIENT',
      existingPlan: { id: 'tp_101', patientId: 'patient_1' },
      payload: { deleteGoalId: 'g1' }
    })
    assert.strictEqual(mutationCheck.allowed, false)
    assert.strictEqual(mutationCheck.statusCode, 403)
  })

  // =========================================================================
  // Requirement 5: Unauthorized requests leave database records unchanged
  // =========================================================================
  await t.test('5. Unauthorized requests leave database records unchanged', () => {
    // Simulated persistent DB store
    const dbRecord = {
      id: 'tp_101',
      patientId: 'patient_1',
      overallProgress: 35,
      goals: [
        { id: 'g1', title: 'Target Clinical Goal', percent: 40, status: 'Active' },
        { id: 'g2', title: 'Stage Routine', percent: 25, status: 'Active' }
      ]
    }

    // Deep copy baseline state
    const originalSnapshot = JSON.parse(JSON.stringify(dbRecord))

    // Unauthorized patient mutation attempt
    const patientAttempt = validateGoalMutation({
      userRole: 'PATIENT',
      existingPlan: dbRecord,
      payload: { overallProgress: 100, goals: [] }
    })

    // If unauthorized, database mutation is rejected and dbRecord is untouched
    if (!patientAttempt.allowed) {
      // Record remains exactly as before
      assert.deepStrictEqual(dbRecord, originalSnapshot)
      assert.strictEqual(dbRecord.goals.length, 2)
      assert.strictEqual(dbRecord.goals[0].percent, 40)
      assert.strictEqual(dbRecord.overallProgress, 35)
    } else {
      assert.fail('Patient mutation should have been rejected')
    }
  })

  // =========================================================================
  // Requirement 6: A patient cannot modify another patient's goals
  // =========================================================================
  await t.test("6. A patient cannot modify another patient's goals (cross-patient tampering prevented)", () => {
    const patientAPlan = {
      id: 'tp_a',
      patientId: 'patient_a',
      goals: [{ id: 'g1', title: 'Plan A Goal', percent: 30 }]
    }

    // Patient A tries to mutate Patient B's plan by changing patientId in payload
    const crossPatientPayload = {
      patientId: 'patient_b', // Attempt to reassign / tamper
      goals: [{ id: 'g1', title: 'Tampered Goal', percent: 99 }]
    }

    // 1. Patient role rejected outright
    const patientResult = validateGoalMutation({
      userRole: 'PATIENT',
      existingPlan: patientAPlan,
      payload: crossPatientPayload
    })
    assert.strictEqual(patientResult.allowed, false)
    assert.strictEqual(patientResult.statusCode, 403)

    // 2. Even if an authorized role sends mismatched patientId, tampering is blocked
    const tamperedResult = validateGoalMutation({
      userRole: 'PRACTITIONER',
      existingPlan: patientAPlan,
      payload: crossPatientPayload
    })
    assert.strictEqual(tamperedResult.allowed, false)
    assert.strictEqual(tamperedResult.statusCode, 403)
    assert.match(tamperedResult.error, /another patient/i)

    // 3. Multi-tenant plan isolation check
    const allPlans = [
      { id: 'tp_1', patientId: 'patient_a' },
      { id: 'tp_2', patientId: 'patient_b' },
      { id: 'tp_3', patientId: 'patient_a' }
    ]
    const patientAPlans = isolatePatientPlans(allPlans, 'patient_a')
    assert.strictEqual(patientAPlans.length, 2)
    assert.ok(patientAPlans.every(p => p.patientId === 'patient_a'))
  })

  // =========================================================================
  // Requirement 7: An authorized clinician/practitioner can perform permitted actions
  // =========================================================================
  await t.test('7. An authorized clinician/practitioner can perform permitted actions', () => {
    const authorizedRoles = [
      'PRACTITIONER',
      'practitioner',
      'DOCTOR',
      'doctor',
      'CLINIC_ADMIN',
      'clinic_admin',
      'clinic',
      'SUPER_ADMIN',
      'super_admin',
      'head_admin'
    ]

    for (const r of authorizedRoles) {
      assert.strictEqual(canManageClinicalGoals(r), true, `Role ${r} should be authorized`)
      assert.strictEqual(isGoalActionPermitted(r, 'create'), true, `Role ${r} can create`)
      assert.strictEqual(isGoalActionPermitted(r, 'edit'), true, `Role ${r} can edit`)
      assert.strictEqual(isGoalActionPermitted(r, 'delete'), true, `Role ${r} can delete`)
      assert.strictEqual(isGoalActionPermitted(r, 'adjust_progress'), true, `Role ${r} can adjust progress`)

      const mutation = validateGoalMutation({
        userRole: r,
        existingPlan: { id: 'tp_1', patientId: 'pat_1' },
        payload: { patientId: 'pat_1', goals: [{ id: 'g1', percent: 60 }] }
      })
      assert.strictEqual(mutation.allowed, true, `Role ${r} mutation should be allowed`)
      assert.strictEqual(mutation.statusCode, 200)
      assert.strictEqual(mutation.error, null)
    }
  })

  // =========================================================================
  // Requirement 8: Unauthenticated requests are rejected
  // =========================================================================
  await t.test('8. Unauthenticated requests are rejected', () => {
    const unauthenticatedStates = [null, undefined, '', '   ']

    for (const u of unauthenticatedStates) {
      assert.strictEqual(canManageClinicalGoals(u), false)
      assert.strictEqual(canViewClinicalGoals(u), false)
      assert.strictEqual(isGoalActionPermitted(u, 'view'), false)
      assert.strictEqual(isGoalActionPermitted(u, 'edit'), false)

      const check = validateGoalMutation({ userRole: u })
      assert.strictEqual(check.allowed, false)
      assert.strictEqual(check.statusCode, 401)
      assert.match(check.error, /Authentication required/i)
    }
  })

  // =========================================================================
  // Requirement 9: Existing view permissions and unrelated treatment-plan behavior continue to work
  // =========================================================================
  await t.test('9. Existing view permissions and unrelated treatment-plan behavior continue to work', () => {
    // 1. Patient has valid view access
    assert.strictEqual(canViewClinicalGoals('PATIENT'), true)
    assert.strictEqual(canViewClinicalGoals('patient'), true)
    assert.strictEqual(isGoalActionPermitted('patient', 'view'), true)

    // 2. Patient can mark prescribed exercises as complete
    assert.strictEqual(isGoalActionPermitted('patient', 'toggle_exercise'), true)

    // 3. Prescribed exercise completion updates live adherence dynamically
    const exercises = [
      { id: 'ex_1', done: true },
      { id: 'ex_2', done: true },
      { id: 'ex_3', done: false },
      { id: 'ex_4', done: false }
    ]
    const compliancePercent = computeExerciseCompliancePercent(exercises)
    assert.strictEqual(compliancePercent, 50, '2 out of 4 exercises done = 50%')

    // 4. Overall treatment plan progress incorporates daily practice compliance
    const plan = {
      id: 'tp_test',
      goals: [
        { id: 'g1', title: 'Target Clinical Goal', percent: 60 },
        { id: 'g2', title: 'Daily Practice & Stage Routine', percent: 0 } // dynamically evaluated
      ]
    }
    const computedOverall = computePlanOverallProgress(plan, exercises)
    // Goal 1: 60%, Goal 2: 50% => average is 55%
    assert.strictEqual(computedOverall, 55, 'Overall plan progress should be (60 + 50)/2 = 55%')
  })

})
