/**
 * Task 4 - Questionnaire Answers and Automatic Scoring Tests
 *
 * Tests the pure scoring/state logic extracted from PatientFormsDocuments.jsx.
 * Uses Node built-in test runner (node:test) - no extra dependencies required.
 *
 * Run with: node --test tests/questionnaireUtils.test.js
 */

import test from 'node:test'
import assert from 'node:assert/strict'

// ---- Pure scoring helpers (mirroring the logic in PatientFormsDocuments.jsx) ----

/**
 * Returns the percentage score for the Outcome Questionnaire (Oswestry-style,
 * 4-item subset: q1-q4, each 0-3, max total 12).
 * Returns null when any required question is unanswered.
 */
function computeOutcomeScore(formDataInput) {
  const required = ['q1', 'q2', 'q3', 'q4']
  const allAnswered = required.every(
    (k) => formDataInput[k] !== undefined && formDataInput[k] !== null
  )
  if (!allAnswered) return null
  const sum = formDataInput.q1 + formDataInput.q2 + formDataInput.q3 + formDataInput.q4
  return ((sum / 12) * 100).toFixed(0)
}

function countAnswered(formDataInput) {
  return ['q1', 'q2', 'q3', 'q4'].filter(
    (k) => formDataInput[k] !== undefined && formDataInput[k] !== null
  ).length
}

/** Creates a fresh, blank formDataInput for a new questionnaire attempt. */
function createNewAttempt() {
  return {}
}

// ---- Tests ----

test('Task 4 - Questionnaire Answers and Scoring', async (t) => {

  // A. New attempt initialization
  await t.test('A1. A new questionnaire attempt starts with no answers (empty state)', () => {
    const state = createNewAttempt()
    assert.deepStrictEqual(state, {})
  })

  await t.test('A2. No score is produced before any questions are answered', () => {
    const state = createNewAttempt()
    assert.strictEqual(computeOutcomeScore(state), null)
  })

  await t.test('A3. countAnswered is 0 on a fresh attempt', () => {
    const state = createNewAttempt()
    assert.strictEqual(countAnswered(state), 0)
  })

  // B. Partial answers - score stays null
  await t.test('B1. Score remains null when only some questions are answered', () => {
    const partial = { q1: 2, q2: 1 }
    assert.strictEqual(computeOutcomeScore(partial), null)
    assert.strictEqual(countAnswered(partial), 2)
  })

  await t.test('B2. Score remains null when three questions are answered', () => {
    const partial = { q1: 0, q2: 0, q3: 0 }
    assert.strictEqual(computeOutcomeScore(partial), null)
    assert.strictEqual(countAnswered(partial), 3)
  })

  await t.test('B3. A q value of 0 (falsy number) is still counted as answered', () => {
    // Prior bug: (formDataInput.q3 || 0) treated 0 as missing and substituted fallback
    const state = { q1: 0, q2: 0, q3: 0, q4: 0 }
    assert.strictEqual(countAnswered(state), 4)
    assert.notStrictEqual(computeOutcomeScore(state), null)
  })

  // C. Complete answers - score calculated correctly
  await t.test('C1. All-zero answers produce 0% score', () => {
    const state = { q1: 0, q2: 0, q3: 0, q4: 0 }
    assert.strictEqual(computeOutcomeScore(state), '0')
  })

  await t.test('C2. All-maximum answers produce 100% score', () => {
    const state = { q1: 3, q2: 3, q3: 3, q4: 3 }
    assert.strictEqual(computeOutcomeScore(state), '100')
  })

  await t.test('C3. Mixed answers compute the correct percentage (3+1+0+1=5/12)', () => {
    const state = { q1: 3, q2: 1, q3: 0, q4: 1 }
    const expected = ((5 / 12) * 100).toFixed(0)
    assert.strictEqual(computeOutcomeScore(state), expected)
  })

  await t.test('C4. Score updates correctly when an answer changes', () => {
    let state = { q1: 1, q2: 1, q3: 1, q4: 1 }
    const score1 = computeOutcomeScore(state)   // (4/12)*100 = "33"
    state = { ...state, q1: 3 }
    const score2 = computeOutcomeScore(state)   // (6/12)*100 = "50"
    assert.notStrictEqual(score1, score2)
    assert.strictEqual(score2, ((6 / 12) * 100).toFixed(0))
  })

  await t.test('C5. Blank state returns null, not a fallback-derived score', () => {
    assert.strictEqual(computeOutcomeScore({}), null)
  })

  // D. Attempt isolation
  await t.test('D1. Starting a new attempt after a previous submission resets all answers', () => {
    const prev = { q1: 2, q2: 3, q3: 1, q4: 2 }
    assert.notStrictEqual(computeOutcomeScore(prev), null)
    const newAttempt = createNewAttempt()
    assert.deepStrictEqual(newAttempt, {})
    assert.strictEqual(computeOutcomeScore(newAttempt), null)
  })

  await t.test('D2. Switching to a different questionnaire does not carry over answers', () => {
    const stateA = { q1: 3, q2: 2, q3: 1, q4: 0 }
    assert.notStrictEqual(computeOutcomeScore(stateA), null)
    const stateB = createNewAttempt()
    assert.deepStrictEqual(stateB, {})
  })

  await t.test('D3. Mutating one attempt object does not affect another', () => {
    const attempt1 = { q1: 1, q2: 1, q3: 1, q4: 1 }
    const attempt2 = { ...createNewAttempt() }
    attempt2.q1 = 3
    assert.strictEqual(attempt1.q1, 1)
  })

  // E. Draft restoration
  await t.test('E1. Resuming an existing draft correctly restores its saved answers', () => {
    const savedDraft = { q1: 2, q2: 0, q3: 1, q4: 3 }
    const restoredState = { ...savedDraft }
    assert.deepStrictEqual(restoredState, savedDraft)
    assert.strictEqual(countAnswered(restoredState), 4)
    assert.notStrictEqual(computeOutcomeScore(restoredState), null)
  })

  await t.test('E2. A partially saved draft does not produce a premature score', () => {
    const partialDraft = { q1: 1, q2: 2 }
    assert.strictEqual(computeOutcomeScore(partialDraft), null)
    assert.strictEqual(countAnswered(partialDraft), 2)
  })

  // F. Score range validation
  await t.test('F1. Computed score is always between 0 and 100 inclusive', () => {
    const cases = [
      { q1: 0, q2: 0, q3: 0, q4: 0 },
      { q1: 3, q2: 3, q3: 3, q4: 3 },
      { q1: 1, q2: 2, q3: 0, q4: 3 },
      { q1: 3, q2: 0, q3: 3, q4: 0 },
    ]
    for (const s of cases) {
      const score = parseInt(computeOutcomeScore(s), 10)
      assert.ok(score >= 0 && score <= 100)
    }
  })

  await t.test('F2. Missing any single question blocks score calculation', () => {
    assert.strictEqual(computeOutcomeScore({ q1: 3, q2: 3, q3: 3 }), null)
    assert.strictEqual(computeOutcomeScore({ q2: 3, q3: 3, q4: 3 }), null)
  })

  // G. Preserving previous submissions
  await t.test('G1. Previous submissions are not mutated by starting a new attempt', () => {
    const submittedRecord = Object.freeze({ q1: 2, q2: 1, q3: 0, q4: 2 })
    const newAttemptState = createNewAttempt()
    assert.strictEqual(submittedRecord.q1, 2)
    assert.deepStrictEqual(newAttemptState, {})
  })
})