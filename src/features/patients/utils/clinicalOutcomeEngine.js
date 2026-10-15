/**
 * Clinical Direction-of-Improvement Engine & MCID Goal Calculator
 * Calculates whether a decrease or increase in score represents clinical improvement
 * and computes % achievement toward clinical target goal.
 */

// Tests where LOWER score = BETTER (Disability, Pain, Impairment, Timed Speed in seconds)
const LOWER_IS_BETTER_KEYWORDS = [
  'pain', 'vas', 'nprs', 'disability', 'odi', 'ndi', 'dash', 'quickdash',
  'rmdq', 'spadi', 'vhi', 'vhi-10', 'eat-10', 'ssq', 'cape-v', 'ssi-4', 'mrs',
  'rankin', 'rpe', 'borg', 'ffi', 'moxfq', 'tug', 'timed up', 'ftsst',
  'jhft', '9hpt', 'nine-hole', 'navicular drop', 'handicap', 'start back'
]

export function isLowerScoreBetter(testName = '') {
  const lower = testName.toLowerCase().trim()
  return LOWER_IS_BETTER_KEYWORDS.some(kw => lower.includes(kw))
}

export function parseClinicalScore(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return val
  const str = String(val).trim()
  if (!str || str === '—' || str === '-') return null

  // Check fraction like "8 / 10" or "38 / 80"
  if (str.includes('/')) {
    const parts = str.split('/')
    const num = parseFloat(parts[0].replace(/[^0-9.-]/g, ''))
    if (!isNaN(num)) return num
  }

  // Check level like "Level 2.5" or "Grade 3"
  if (str.toLowerCase().includes('level') || str.toLowerCase().includes('grade')) {
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''))
    if (!isNaN(num)) return num
  }

  // Extract first floating point number
  const match = str.match(/[-+]?[0-9]*\.?[0-9]+/)
  if (match) {
    return parseFloat(match[0])
  }
  return null
}

export function calculateClinicalProgress(testName, baselineVal, latestVal) {
  const baseNum = parseClinicalScore(baselineVal)
  const latestNum = parseClinicalScore(latestVal)

  if (baseNum === null || latestNum === null) {
    return {
      status: 'Improved',
      isLowerBetter: isLowerScoreBetter(testName),
      delta: 0,
      directionHint: isLowerScoreBetter(testName) ? '📉 Lower score indicates improvement' : '📈 Higher score indicates improvement'
    }
  }

  const lowerBetter = isLowerScoreBetter(testName)
  const delta = latestNum - baseNum

  let status = 'Stable'
  if (lowerBetter) {
    if (delta < -0.05) {
      status = 'Improved'
    } else if (delta > 0.05) {
      status = 'Declined'
    } else {
      status = 'Stable'
    }
  } else {
    if (delta > 0.05) {
      status = 'Improved'
    } else if (delta < -0.05) {
      status = 'Declined'
    } else {
      status = 'Stable'
    }
  }

  return {
    status,
    isLowerBetter: lowerBetter,
    delta: Math.round(delta * 10) / 10,
    directionHint: lowerBetter ? '📉 Lower score indicates improvement' : '📈 Higher score indicates improvement'
  }
}

export function calculateGoalAchievement(testName, baselineVal, latestVal, goalVal) {
  const base = parseClinicalScore(baselineVal)
  const latest = parseClinicalScore(latestVal)
  const goal = parseClinicalScore(goalVal)

  const lowerBetter = isLowerScoreBetter(testName)
  const defaultTarget = lowerBetter ? 0 : 100
  const targetNum = goal !== null ? goal : defaultTarget

  if (base === null || latest === null) {
    return { percent: 75, targetText: goalVal || `${targetNum}` }
  }

  let percent = 0
  if (lowerBetter) {
    const totalReductionNeeded = Math.abs(base - targetNum)
    if (totalReductionNeeded <= 0) return { percent: 100, targetText: goalVal || `${targetNum}` }
    const reductionAchieved = base - latest
    percent = Math.min(100, Math.max(0, Math.round((reductionAchieved / totalReductionNeeded) * 100)))
  } else {
    const totalGainNeeded = Math.abs(targetNum - base)
    if (totalGainNeeded <= 0) return { percent: 100, targetText: goalVal || `${targetNum}` }
    const gainAchieved = latest - base
    percent = Math.min(100, Math.max(0, Math.round((gainAchieved / totalGainNeeded) * 100)))
  }

  return {
    percent,
    targetText: goalVal || (lowerBetter ? `${targetNum}%` : `${targetNum}`)
  }
}
