/**
 * dateUtils.js
 * Central date/time formatting utilities enforcing Australian English standards.
 * Standard: DD MMM YYYY (e.g. 21 Sep 2026)  |  Time: 12-hour hh:mm A AEST/AEDT
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)

/** Australian Eastern timezone identifier */
export const AU_TZ = 'Australia/Sydney'

/**
 * Returns the current AEST/AEDT offset label.
 * Daylight saving: last Sun Oct → first Sun Apr → AEDT (+11)
 * Standard:        first Sun Apr → last Sun Oct → AEST (+10)
 */
export const getAuTimezoneLabel = () => {
  const offset = dayjs().tz(AU_TZ).utcOffset()
  return offset === 660 ? 'AEDT' : 'AEST'
}

/**
 * Format a date value as DD MMM YYYY  (e.g. "21 Sep 2026")
 * @param {string|Date|dayjs.Dayjs|null} value
 * @param {string} [fallback='—']
 */
export const formatDate = (value, fallback = '—') => {
  if (!value) return fallback
  const d = dayjs(value)
  if (!d.isValid()) return fallback
  return d.format('DD MMM YYYY')
}

/**
 * Format a date+time value as DD MMM YYYY, h:mm A AEST/AEDT
 * @param {string|Date|dayjs.Dayjs|null} value
 * @param {string} [fallback='—']
 */
export const formatDateTime = (value, fallback = '—') => {
  if (!value) return fallback
  const d = dayjs(value)
  if (!d.isValid()) return fallback
  return `${d.format('DD MMM YYYY')}, ${d.format('h:mm A')} ${getAuTimezoneLabel()}`
}

/**
 * Format a time-only string (HH:mm or h:mm A) as 12-hour h:mm A AEST/AEDT
 * @param {string|null} value  e.g. "14:30" or "2:30 PM"
 * @param {string} [fallback='—']
 */
export const formatTime = (value, fallback = '—') => {
  if (!value) return fallback
  const parsed = dayjs(value, ['HH:mm', 'h:mm A', 'hh:mm A'])
  if (!parsed.isValid()) return value
  return `${parsed.format('h:mm A')} ${getAuTimezoneLabel()}`
}

/**
 * Format date relative label: "Today", "Yesterday", "21 Sep 2026"
 * @param {string|Date|dayjs.Dayjs|null} value
 */
export const formatRelativeDate = (value, fallback = '—') => {
  if (!value) return fallback
  const d = dayjs(value)
  if (!d.isValid()) return fallback
  const today = dayjs().startOf('day')
  if (d.isSame(today, 'day')) return 'Today'
  if (d.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday'
  return d.format('DD MMM YYYY')
}

/**
 * Returns an ISO date string for today (YYYY-MM-DD) — safe for DB/API use
 */
export const todayISO = () => dayjs().format('YYYY-MM-DD')

/**
 * Returns a dayjs object for use in Ant Design DatePicker defaultValue
 */
export const dayjsNow = () => dayjs()

export default dayjs
