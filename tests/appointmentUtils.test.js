import test from 'node:test'
import assert from 'node:assert/strict'
import dayjs from '../src/utils/dateUtils.js'
import {
  getAppointmentStartDateTime,
  isAppointmentUpcoming,
  isAppointmentPast,
  sortAppointmentsUpcoming,
  sortAppointmentsHistory,
  categorizeAppointments,
} from '../src/utils/appointmentUtils.js'

test('Appointment Utility Tests - Task 1 Verification', async (t) => {
  // Fixed reference point for reproducible testing: 2026-10-15 14:00:00 (AEST/AEDT)
  const testNow = dayjs('2026-10-15T14:00:00')

  await t.test('1. Past appointments should NOT be classified as upcoming', () => {
    const pastAppts = [
      { id: '1', date: '2026-08-21', time: '10:00 AM', status: 'Confirmed' },
      { id: '2', date: '2026-09-21', time: '11:00 AM', status: 'Scheduled' },
      { id: '3', date: '2026-09-24', time: '09:30 AM', status: 'Upcoming' },
      { id: '4', date: '2026-09-29', time: '15:00', status: 'Confirmed' },
      { id: '5', date: '2026-09-30', time: '02:00 PM', status: 'Pending' },
    ]

    for (const app of pastAppts) {
      assert.strictEqual(
        isAppointmentUpcoming(app, testNow),
        false,
        `Expected past appointment on ${app.date} to NOT be upcoming`
      )
      assert.strictEqual(
        isAppointmentPast(app, testNow),
        true,
        `Expected past appointment on ${app.date} to be classified as past`
      )
    }
  })

  await t.test('2. Future appointments with active statuses should be classified as upcoming', () => {
    const futureAppts = [
      { id: '10', date: '2026-10-16', time: '10:00 AM', status: 'Confirmed' },
      { id: '11', date: '2026-10-20', time: '11:30 AM', status: 'Scheduled' },
      { id: '12', date: '2026-11-05', time: '14:00', status: 'Upcoming' },
      { id: '13', date: '2026-12-01', time: '09:00 AM', status: 'Pending' },
    ]

    for (const app of futureAppts) {
      assert.strictEqual(
        isAppointmentUpcoming(app, testNow),
        true,
        `Expected future appointment on ${app.date} to be upcoming`
      )
      assert.strictEqual(
        isAppointmentPast(app, testNow),
        false,
        `Expected future appointment on ${app.date} to NOT be past`
      )
    }
  })

  await t.test('3. Same-day boundary conditions (before vs after current time)', () => {
    // Reference time is 2026-10-15 14:00
    const morningToday = { id: '20', date: '2026-10-15', time: '09:00 AM', status: 'Confirmed' }
    const noonToday = { id: '21', date: '2026-10-15', time: '13:59', status: 'Confirmed' }
    const exactBoundary = { id: '22', date: '2026-10-15', time: '14:00', status: 'Confirmed' }
    const laterToday = { id: '23', date: '2026-10-15', time: '15:30', status: 'Confirmed' }

    assert.strictEqual(isAppointmentUpcoming(morningToday, testNow), false, 'Morning session has passed')
    assert.strictEqual(isAppointmentUpcoming(noonToday, testNow), false, '13:59 session has passed')
    assert.strictEqual(isAppointmentUpcoming(exactBoundary, testNow), true, 'Exact time boundary should remain upcoming')
    assert.strictEqual(isAppointmentUpcoming(laterToday, testNow), true, '15:30 session later today is upcoming')
  })

  await t.test('4. Excluded statuses should NEVER be classified as upcoming even with future dates', () => {
    const excludedAppts = [
      { id: '30', date: '2026-11-15', time: '10:00 AM', status: 'Cancelled' },
      { id: '31', date: '2026-11-15', time: '10:00 AM', status: 'Completed' },
      { id: '32', date: '2026-11-15', time: '10:00 AM', status: 'Missed' },
      { id: '33', date: '2026-11-15', time: '10:00 AM', status: 'No-Show' },
      { id: '34', date: '2026-11-15', time: '10:00 AM', status: 'Did Not Attend' },
    ]

    for (const app of excludedAppts) {
      assert.strictEqual(
        isAppointmentUpcoming(app, testNow),
        false,
        `Status ${app.status} should never be upcoming`
      )
      assert.strictEqual(
        isAppointmentPast(app, testNow),
        true,
        `Status ${app.status} should be in history`
      )
    }
  })

  await t.test('5. Past appointments retain their actual statuses (no auto-mutation to Completed)', () => {
    const rawList = [
      { id: 'p1', date: '2026-08-21', time: '10:00 AM', status: 'Confirmed', practitioner: 'Dr. Sarah' },
      { id: 'p2', date: '2026-09-24', time: '11:00 AM', status: 'Scheduled', practitioner: 'Dr. James' },
      { id: 'p3', date: '2026-09-29', time: '15:00', status: 'Cancelled', practitioner: 'Dr. Emily' },
    ]

    const { pastApps } = categorizeAppointments(rawList, { now: testNow })
    assert.strictEqual(pastApps.length, 3)

    const p1 = pastApps.find(a => a.id === 'p1')
    const p2 = pastApps.find(a => a.id === 'p2')
    const p3 = pastApps.find(a => a.id === 'p3')

    assert.strictEqual(p1.status, 'Confirmed', 'Must retain Confirmed status')
    assert.strictEqual(p2.status, 'Scheduled', 'Must retain Scheduled status')
    assert.strictEqual(p3.status, 'Cancelled', 'Must retain Cancelled status')
  })

  await t.test('6. Upcoming appointments sorted soonest first; Past appointments sorted most recent first', () => {
    const mixed = [
      { id: 'u2', date: '2026-10-25', time: '10:00 AM', status: 'Confirmed' },
      { id: 'u1', date: '2026-10-18', time: '10:00 AM', status: 'Confirmed' },
      { id: 'u3', date: '2026-11-02', time: '10:00 AM', status: 'Confirmed' },
      { id: 'p1', date: '2026-08-10', time: '10:00 AM', status: 'Confirmed' },
      { id: 'p3', date: '2026-10-01', time: '10:00 AM', status: 'Confirmed' },
      { id: 'p2', date: '2026-09-15', time: '10:00 AM', status: 'Confirmed' },
    ]

    const { upcomingApps, pastApps } = categorizeAppointments(mixed, { now: testNow })

    // Upcoming: 18 Oct -> 25 Oct -> 2 Nov
    assert.deepStrictEqual(upcomingApps.map(a => a.id), ['u1', 'u2', 'u3'])

    // Past: 1 Oct (most recent) -> 15 Sep -> 10 Aug (oldest)
    assert.deepStrictEqual(pastApps.map(a => a.id), ['p3', 'p2', 'p1'])
  })

  await t.test('7. Filter and search matching works accurately', () => {
    const data = [
      { id: 'f1', date: '2026-10-20', time: '10:00 AM', status: 'Confirmed', practitioner: 'Dr. Sarah Jenkins', type: 'Physiotherapy', clinic: 'Melbourne' },
      { id: 'f2', date: '2026-10-22', time: '10:00 AM', status: 'Confirmed', practitioner: 'Dr. James Carter', type: 'Podiatry', clinic: 'Sydney' },
      { id: 'p1', date: '2026-09-01', time: '10:00 AM', status: 'Cancelled', practitioner: 'Dr. Sarah Jenkins', type: 'Physiotherapy', clinic: 'Melbourne' },
    ]

    // Search by practitioner
    const res1 = categorizeAppointments(data, { searchTerm: 'Sarah', now: testNow })
    assert.strictEqual(res1.upcomingApps.length, 1)
    assert.strictEqual(res1.upcomingApps[0].id, 'f1')
    assert.strictEqual(res1.pastApps.length, 1)
    assert.strictEqual(res1.pastApps[0].id, 'p1')

    // Filter by 'Upcoming'
    const res2 = categorizeAppointments(data, { statusFilter: 'Upcoming', now: testNow })
    assert.strictEqual(res2.upcomingApps.length, 2)
    assert.strictEqual(res2.pastApps.length, 0)

    // Filter by 'Cancelled'
    const res3 = categorizeAppointments(data, { statusFilter: 'Cancelled', now: testNow })
    assert.strictEqual(res3.upcomingApps.length, 0)
    assert.strictEqual(res3.pastApps.length, 1)
    assert.strictEqual(res3.pastApps[0].id, 'p1')
  })

  await t.test('8. Robust date and time parsing across varied formats', () => {
    assert.ok(getAppointmentStartDateTime('2026-10-15', '10:00 AM')?.isValid())
    assert.ok(getAppointmentStartDateTime('2026-10-15', '14:30')?.isValid())
    assert.ok(getAppointmentStartDateTime('2026-10-15', '06:00')?.isValid())
    assert.ok(getAppointmentStartDateTime('2026-10-15', '5:04 PM')?.isValid())
    assert.ok(getAppointmentStartDateTime('2026-10-15T09:00:00.000Z')?.isValid())
    assert.strictEqual(getAppointmentStartDateTime(null, '10:00 AM'), null)
    assert.strictEqual(getAppointmentStartDateTime('invalid-date', 'invalid-time'), null)
  })
})
