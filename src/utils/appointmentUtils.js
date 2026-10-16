import dayjs from './dateUtils.js'

/**
 * Parses appointment date and time into a valid dayjs object representing the scheduled start datetime.
 * Handles both 12-hour ("10:00 AM", "2:30 PM") and 24-hour ("11:00", "06:00", "14:30") formats,
 * as well as ISO dates.
 *
 * @param {string} dateStr e.g. "2026-08-21" or ISO timestamp
 * @param {string} [timeStr] e.g. "10:00 AM" or "11:00"
 * @returns {dayjs.Dayjs|null}
 */
export function getAppointmentStartDateTime(dateStr, timeStr) {
  if (!dateStr) return null

  const cleanDate = String(dateStr).trim().split('T')[0]
  if (!cleanDate) return null

  if (!timeStr || String(timeStr).trim() === '') {
    const d = dayjs(cleanDate)
    return d.isValid() ? d : null
  }

  const cleanTime = String(timeStr).trim()
  const combined = `${cleanDate} ${cleanTime}`

  const parseFormats = [
    'YYYY-MM-DD h:mm A',
    'YYYY-MM-DD hh:mm A',
    'YYYY-MM-DD h:mma',
    'YYYY-MM-DD hh:mma',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD H:mm',
    'YYYY-MM-DD HH:mm:ss',
  ]

  const parsed = dayjs(combined, parseFormats)
  if (parsed.isValid()) return parsed

  const fallback = dayjs(combined)
  if (fallback.isValid()) return fallback

  const dateOnly = dayjs(cleanDate)
  return dateOnly.isValid() ? dateOnly : null
}

/**
 * Active statuses that can be considered upcoming if scheduled start datetime is in the future.
 */
export const UPCOMING_STATUSES = ['scheduled', 'confirmed', 'upcoming', 'pending', 'active']

/**
 * Statuses that are explicitly excluded from upcoming appointments.
 */
export const EXCLUDED_UPCOMING_STATUSES = ['completed', 'cancelled', 'missed', 'did not attend', 'no-show']

/**
 * Checks if an appointment is upcoming according to business rules:
 * 1. Must NOT have an excluded status (completed, cancelled, missed, no-show).
 * 2. Must have an active appointment status (scheduled, confirmed, upcoming, pending).
 * 3. Scheduled start datetime must NOT be in the past compared to reference time (now).
 *
 * @param {Object} appointment
 * @param {dayjs.Dayjs} [now=dayjs()]
 * @returns {boolean}
 */
export function isAppointmentUpcoming(appointment, now = dayjs()) {
  if (!appointment) return false

  const rawStatus = String(appointment.status || appointment.rawStatus || '').trim().toLowerCase()
  if (!rawStatus) return false

  if (EXCLUDED_UPCOMING_STATUSES.includes(rawStatus)) {
    return false
  }

  if (!UPCOMING_STATUSES.includes(rawStatus)) {
    return false
  }

  const startDateTime = getAppointmentStartDateTime(
    appointment.date,
    appointment.startTime || appointment.time
  )
  if (!startDateTime || !startDateTime.isValid()) {
    return false
  }

  // Not in the past: startDateTime is equal to or after now
  return !startDateTime.isBefore(now)
}

/**
 * Checks if an appointment is considered past / history:
 * - Any appointment that is not upcoming according to isAppointmentUpcoming.
 *
 * @param {Object} appointment
 * @param {dayjs.Dayjs} [now=dayjs()]
 * @returns {boolean}
 */
export function isAppointmentPast(appointment, now = dayjs()) {
  return !isAppointmentUpcoming(appointment, now)
}

/**
 * Sorts upcoming appointments soonest first (ascending by start datetime).
 *
 * @param {Array<Object>} appointments
 * @returns {Array<Object>}
 */
export function sortAppointmentsUpcoming(appointments = []) {
  return [...appointments].sort((a, b) => {
    const tA = getAppointmentStartDateTime(a.date, a.startTime || a.time)
    const tB = getAppointmentStartDateTime(b.date, b.startTime || b.time)
    const valA = tA && tA.isValid() ? tA.valueOf() : Infinity
    const valB = tB && tB.isValid() ? tB.valueOf() : Infinity
    return valA - valB
  })
}

/**
 * Sorts past appointments most recent first (descending by start datetime).
 *
 * @param {Array<Object>} appointments
 * @returns {Array<Object>}
 */
export function sortAppointmentsHistory(appointments = []) {
  return [...appointments].sort((a, b) => {
    const tA = getAppointmentStartDateTime(a.date, a.startTime || a.time)
    const tB = getAppointmentStartDateTime(b.date, b.startTime || b.time)
    const valA = tA && tA.isValid() ? tA.valueOf() : -Infinity
    const valB = tB && tB.isValid() ? tB.valueOf() : -Infinity
    return valB - valA
  })
}

/**
 * Filters and categorizes appointments into upcoming and past sections.
 *
 * @param {Array<Object>} appointments
 * @param {Object} [options={}]
 * @param {string} [options.searchTerm='']
 * @param {string} [options.statusFilter='ALL']
 * @param {dayjs.Dayjs} [options.now=dayjs()]
 * @returns {{ upcomingApps: Array<Object>, pastApps: Array<Object> }}
 */
export function categorizeAppointments(
  appointments = [],
  { searchTerm = '', statusFilter = 'ALL', now = dayjs() } = {}
) {
  const term = searchTerm.trim().toLowerCase()
  const filter = statusFilter.trim()

  const matchesSearch = (a) => {
    if (!term) return true
    const prac = String(a.practitioner || a.practitionerName || '').toLowerCase()
    const typ = String(a.type || a.serviceName || '').toLowerCase()
    const cln = String(a.clinic || a.branchName || '').toLowerCase()
    return prac.includes(term) || typ.includes(term) || cln.includes(term)
  }

  const matching = appointments.filter(matchesSearch)

  if (filter.toUpperCase() === 'UPCOMING') {
    const upcoming = sortAppointmentsUpcoming(matching.filter((a) => isAppointmentUpcoming(a, now)))
    return {
      upcomingApps: upcoming,
      pastApps: [],
    }
  }

  if (filter.toUpperCase() !== 'ALL') {
    // Explicit past status filter (e.g. Completed, Cancelled, Missed)
    const pastFiltered = matching.filter(
      (a) =>
        String(a.status || a.rawStatus || '').toLowerCase() === filter.toLowerCase() &&
        isAppointmentPast(a, now)
    )
    return {
      upcomingApps: [],
      pastApps: sortAppointmentsHistory(pastFiltered),
    }
  }

  // ALL status: upcoming sessions in upcoming, everything else in history
  const upcoming = sortAppointmentsUpcoming(matching.filter((a) => isAppointmentUpcoming(a, now)))
  const past = sortAppointmentsHistory(matching.filter((a) => isAppointmentPast(a, now)))

  return {
    upcomingApps: upcoming,
    pastApps: past,
  }
}
