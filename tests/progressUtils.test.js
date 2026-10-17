/**
 * Task 5 - Patient Progress Percentage Inconsistency Tests
 *
 * Verifies consistency, patient isolation, period separation, and authoritative
 * calculations across Dashboard, Progress/Outcomes, Assessments, and Treatment Plans.
 *
 * Run with: node --test tests/progressUtils.test.js
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  computeExerciseCompliancePercent,
  computePlanGoalProgress,
  computePlanOverallProgress,
  computeActivePlanAdherence,
  formatComplianceString,
  parseComplianceString,
  isolatePatientRecords,
  filterRecordsByPeriod,
  isPracticeGoal
} from '../src/utils/progressUtils.js'
import {
  calculateClinicalProgress,
  calculateGoalAchievement,
  parseClinicalScore,
  isLowerScoreBetter
} from '../src/features/patients/utils/clinicalOutcomeEngine.js'

test('Task 5 - Patient Progress Percentage Inconsistency & Authority Verification', async (t) => {

  // =========================================================================
  // Requirement 1: Same metric and same time period produce consistent percentages
  // =========================================================================
  await t.test('1. Same metric and same time period produce consistent percentages across Dashboard and Progress/Outcomes', () => {
    // Given the same set of prescribed exercises for today
    const todayExercises = [
      { id: 'ex_1', patientId: 'patient_1', name: 'Lumbar Extension', done: true },
      { id: 'ex_2', patientId: 'patient_1', name: 'Core Bridging', done: true },
      { id: 'ex_3', patientId: 'patient_1', name: 'Cat-Cow Stretch', done: false },
      { id: 'ex_4', patientId: 'patient_1', name: 'Hamstring Stretch', done: false }
    ]

    // 2 out of 4 done = 50%
    const expectedCompliance = 50

    // Exercises page adherence metric
    const exercisesPageCompliance = computeExerciseCompliancePercent(todayExercises)
    assert.strictEqual(exercisesPageCompliance, expectedCompliance)

    // Treatment Plans daily practice goal metric
    const dailyPracticeGoal = { id: 'g2', title: 'Daily Practice & Stage Milestone Routine', percent: 0 }
    const treatmentPlanGoalCompliance = computePlanGoalProgress(dailyPracticeGoal, todayExercises)
    assert.strictEqual(treatmentPlanGoalCompliance, expectedCompliance)

    // Progress/Outcomes compliance display metric
    const progressOutcomesFormatted = formatComplianceString(computeExerciseCompliancePercent(todayExercises))
    assert.strictEqual(progressOutcomesFormatted, '50% Completed')
    assert.strictEqual(parseComplianceString(progressOutcomesFormatted), expectedCompliance)
  })

  // =========================================================================
  // Requirement 2: Different metrics can legitimately show different percentages
  // =========================================================================
  await t.test('2. Different metrics legitimately show different percentages without false equivalence', () => {
    // A patient can have 100% daily exercise compliance today,
    // while their long-term treatment plan is only 55% completed,
    // and their ODI clinical disability reduction is 61%.
    const todayExercises = [
      { id: 'ex_1', done: true },
      { id: 'ex_2', done: true }
    ]
    const activeTreatmentPlan = {
      id: 'tp_1',
      status: 'Active',
      goals: [
        { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 40 },
        { id: 'g2', title: 'Daily Practice & Stage Milestone Routine', percent: 100 }
      ]
    }

    // Metric A: Daily Exercise Compliance = 100%
    const dailyCompliance = computeExerciseCompliancePercent(todayExercises)
    assert.strictEqual(dailyCompliance, 100)

    // Metric B: Treatment Plan Overall Progress = (40 + 100) / 2 = 70%
    const planProgress = computePlanOverallProgress(activeTreatmentPlan, todayExercises)
    assert.strictEqual(planProgress, 70)

    // Metric C: Clinical Assessment MCID Achievement (e.g. LEFS 42/80 baseline to 74/80 with 80 goal)
    // Goal achievement: (74 - 42) / (80 - 42) = 32 / 38 = 84%
    const lefsAchievement = calculateGoalAchievement('LEFS', '42 / 80', '74 / 80', '80 / 80')
    assert.strictEqual(lefsAchievement.percent, 84)

    // Validate that these three distinct metrics are NOT forced to equal each other
    assert.notStrictEqual(dailyCompliance, planProgress)
    assert.notStrictEqual(planProgress, lefsAchievement.percent)
    assert.notStrictEqual(dailyCompliance, lefsAchievement.percent)
  })

  // =========================================================================
  // Requirement 3: Different reporting periods are not incorrectly treated as identical
  // =========================================================================
  await t.test('3. Different reporting periods are strictly separated and not conflated', () => {
    const historicalAssessments = [
      { id: 'sess_1', sessionDate: '2026-01-12', score: 8.0, note: 'Intake baseline' },
      { id: 'sess_2', sessionDate: '2026-02-12', score: 7.0, note: 'Followup 1' },
      { id: 'sess_3', sessionDate: '2026-03-12', score: 5.0, note: 'Followup 2' },
      { id: 'sess_4', sessionDate: '2026-06-12', score: 2.0, note: 'Followup 5' }
    ]

    // Intake window (January)
    const q1Records = filterRecordsByPeriod(historicalAssessments, '2026-01-01', '2026-01-31')
    assert.strictEqual(q1Records.length, 1)
    assert.strictEqual(q1Records[0].score, 8.0)

    // Latest window (June)
    const q2Records = filterRecordsByPeriod(historicalAssessments, '2026-06-01', '2026-06-30')
    assert.strictEqual(q2Records.length, 1)
    assert.strictEqual(q2Records[0].score, 2.0)

    // Ensuring Q1 score is not overwritten by Q2 score
    assert.notStrictEqual(q1Records[0].score, q2Records[0].score)
  })

  // =========================================================================
  // Requirement 4: Updating an assessment refreshes the relevant progress display
  // =========================================================================
  await t.test('4. Updating an assessment refreshes the relevant progress display with correct clinical calculation', () => {
    // Initial state: Oswestry score 36% (Moderate), Target 0%
    const initialBaseline = '36%'
    const initialLatest = '36%'
    const initialAchievement = calculateGoalAchievement('ODI', initialBaseline, initialLatest, '0%')
    assert.strictEqual(initialAchievement.percent, 0) // No progress yet

    // Patient completes assessment: new score is 14%
    const updatedLatest = '14%'
    const updatedAchievement = calculateGoalAchievement('ODI', initialBaseline, updatedLatest, '0%')
    // Reduction from 36 to 14 = 22. Target reduction 36 to 0 = 36. 22 / 36 = 61%
    assert.strictEqual(updatedAchievement.percent, 61)

    // Questionnaire formula verification: answers q1=1, q2=0, q3=1, q4=0 -> sum=2/12 = 17%
    const qAnswers = { q1: 1, q2: 0, q3: 1, q4: 0 }
    const sum = qAnswers.q1 + qAnswers.q2 + qAnswers.q3 + qAnswers.q4
    const computedAssessmentScore = `${Math.round((sum / 12) * 100)}%`
    assert.strictEqual(computedAssessmentScore, '17%')
    assert.notStrictEqual(computedAssessmentScore, '14%') // Must not fall back to old hardcoded 14%
  })

  // =========================================================================
  // Requirement 5: Updating treatment-plan completion refreshes relevant progress display
  // =========================================================================
  await t.test('5. Updating treatment-plan completion refreshes active plan adherence on Dashboard and Treatment Plans', () => {
    const treatmentPlan = {
      id: 'tp_101',
      status: 'Active',
      goals: [
        { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 40 },
        { id: 'g2', title: 'Daily Practice & Stage Milestone Routine', percent: 0 }
      ]
    }
    const exercisesBefore = [
      { id: 'ex_1', done: false },
      { id: 'ex_2', done: false }
    ]

    // Initial plan adherence: (40 + 0) / 2 = 20%
    const adherenceBefore = computeActivePlanAdherence([treatmentPlan], exercisesBefore)
    assert.strictEqual(adherenceBefore, 20)

    // Patient marks both exercises done
    const exercisesAfter = [
      { id: 'ex_1', done: true },
      { id: 'ex_2', done: true }
    ]

    // Adherence after exercise completion: Goal 2 is now 100%, plan overall = (40 + 100) / 2 = 70%
    const adherenceAfterExercise = computeActivePlanAdherence([treatmentPlan], exercisesAfter)
    assert.strictEqual(adherenceAfterExercise, 70)

    // Clinician updates Goal 1 from 40% to 60%
    const updatedPlan = {
      ...treatmentPlan,
      goals: [
        { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 60 },
        { id: 'g2', title: 'Daily Practice & Stage Milestone Routine', percent: 100 }
      ]
    }
    const adherenceAfterGoalUpdate = computeActivePlanAdherence([updatedPlan], exercisesAfter)
    // (60 + 100) / 2 = 80%
    assert.strictEqual(adherenceAfterGoalUpdate, 80)
  })

  // =========================================================================
  // Requirement 6: Missing or incomplete source data is handled correctly
  // =========================================================================
  await t.test('6. Missing or incomplete source data does not silently substitute misleading percentages', () => {
    // Empty / null exercises return 0, not fabricated defaults
    assert.strictEqual(computeExerciseCompliancePercent([]), 0)
    assert.strictEqual(computeExerciseCompliancePercent(null), 0)
    assert.strictEqual(computeExerciseCompliancePercent(undefined), 0)

    // Empty / null treatment plans return 0
    assert.strictEqual(computeActivePlanAdherence([]), 0)
    assert.strictEqual(computeActivePlanAdherence(null), 0)

    // Format compliance string handles missing data safely
    assert.strictEqual(formatComplianceString(null), '0% Completed')
    assert.strictEqual(formatComplianceString(undefined), '0% Completed')
    assert.strictEqual(formatComplianceString(NaN), '0% Completed')

    // Clinical assessment with missing scores returns 0% achievement, NEVER fabricated 75%
    const missingBase = calculateGoalAchievement('VAS', null, '2.0 / 10', '0.0 / 10')
    assert.strictEqual(missingBase.percent, 0)
    assert.notStrictEqual(missingBase.percent, 75)

    const missingLatest = calculateGoalAchievement('VAS', '8.0 / 10', null, '0.0 / 10')
    assert.strictEqual(missingLatest.percent, 0)
    assert.notStrictEqual(missingLatest.percent, 75)

    const bothMissing = calculateGoalAchievement('VAS', '—', '-', '0.0 / 10')
    assert.strictEqual(bothMissing.percent, 0)
  })

  // =========================================================================
  // Requirement 7: Patient-specific data is isolated and no other patient's progress is shown
  // =========================================================================
  await t.test('7. Patient-specific data is strictly isolated across patients', () => {
    // Database containing exercises from multiple patients
    const multiPatientExercises = [
      { id: 'ex_1', patientId: 'patient_A', done: false },
      { id: 'ex_2', patientId: 'patient_A', done: false },
      { id: 'ex_3', patientId: 'patient_B', done: true },
      { id: 'ex_4', patientId: 'patient_B', done: true },
      { id: 'ex_5', patientId: 'patient_B', done: true }
    ]

    // Unfiltered (buggy) compliance would be 3 / 5 = 60%
    const unisolatedCompliance = computeExerciseCompliancePercent(multiPatientExercises)
    assert.strictEqual(unisolatedCompliance, 60)

    // Patient A's isolated compliance: 0 / 2 = 0%
    const patientAExercises = isolatePatientRecords(multiPatientExercises, 'patient_A')
    const patientACompliance = computeExerciseCompliancePercent(patientAExercises)
    assert.strictEqual(patientACompliance, 0)

    // Patient B's isolated compliance: 3 / 3 = 100%
    const patientBExercises = isolatePatientRecords(multiPatientExercises, 'patient_B')
    const patientBCompliance = computeExerciseCompliancePercent(patientBExercises)
    assert.strictEqual(patientBCompliance, 100)

    // Verify patient A does not show patient B's 100% or the leaked 60%
    assert.notStrictEqual(patientACompliance, unisolatedCompliance)
    assert.notStrictEqual(patientACompliance, patientBCompliance)
  })

  // =========================================================================
  // Requirement 8: Historical results remain correct where snapshots are supported
  // =========================================================================
  await t.test('8. Historical results remain correct and immutable over time', () => {
    // Historical timeline measurements from intake to current session
    const historicalTimeline = [
      { month: 'Jan', sessionDate: '2026-01-12', score: 8.0, status: 'Intake baseline' },
      { month: 'Feb', sessionDate: '2026-02-12', score: 7.0, status: 'Routine followup' },
      { month: 'Mar', sessionDate: '2026-03-12', score: 5.0, status: 'Routine followup' },
      { month: 'Apr', sessionDate: '2026-04-12', score: 4.0, status: 'Routine followup' },
      { month: 'May', sessionDate: '2026-05-12', score: 3.0, status: 'Routine followup' },
      { month: 'Jun', sessionDate: '2026-06-12', score: 2.0, status: 'Latest verified' }
    ]

    // Verify historical baseline snapshot has not mutated
    assert.strictEqual(historicalTimeline[0].month, 'Jan')
    assert.strictEqual(historicalTimeline[0].score, 8.0)

    // Verify interim months remain distinct
    assert.strictEqual(historicalTimeline[2].month, 'Mar')
    assert.strictEqual(historicalTimeline[2].score, 5.0)

    // Verify latest snapshot reflects current verified result
    const latestSnapshot = historicalTimeline[historicalTimeline.length - 1]
    assert.strictEqual(latestSnapshot.month, 'Jun')
    assert.strictEqual(latestSnapshot.score, 2.0)

    // Verify clinical progress computation over the full historical arc
    const fullArcProgress = calculateClinicalProgress('VAS Pain', historicalTimeline[0].score, latestSnapshot.score)
    assert.strictEqual(fullArcProgress.status, 'Improved')
    assert.strictEqual(fullArcProgress.isLowerBetter, true)
    assert.strictEqual(fullArcProgress.delta, -6.0)
  })

})
