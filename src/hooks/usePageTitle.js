/**
 * usePageTitle.js
 * Hook to dynamically set browser tab title based on clinic name + current page.
 * Usage: usePageTitle('Appointments') → "Sunrise Physio — Appointments | ZealthOS"
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useClinicStore } from '../store/clinicStore'

const PAGE_LABEL_MAP = {
  // Auth
  login: 'Sign In',
  register: 'Register',
  'forgot-password': 'Reset Password',

  // Dashboard sections
  dashboard: 'Dashboard',
  calendar: 'Calendar',
  patients: 'Clients',
  contacts: 'Contacts',
  waitlist: 'Waitlist',
  invoices: 'Invoices',
  payments: 'Payments',
  'payments-centre': 'Payments',
  products: 'Products',
  reports: 'Reports',
  documents: 'Documents',
  settings: 'Settings',
  'live-chat': 'Live Chat',
  consultations: 'Consultations',
  details: 'Clinic Details',
}

/**
 * @param {string} pageLabel - Human-readable page name (e.g. 'Appointments')
 *                             Pass null/undefined to auto-detect from URL.
 */
export const usePageTitle = (pageLabel) => {
  const clinicName = useClinicStore((state) => state.clinicDetails?.name)
  let location = null
  try {
    location = useLocation()
  } catch (e) {}

  useEffect(() => {
    const label = pageLabel || (() => {
      const pathname = location?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '')
      const parts = pathname.split('/').filter(Boolean)
      const last = parts[parts.length - 1] || ''
      return PAGE_LABEL_MAP[last] || PAGE_LABEL_MAP[parts[0]] || (last ? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ') : 'Dashboard')
    })()

    const clinic = clinicName || 'ZealthOS'
    document.title = clinicName
      ? `${clinic} — ${label} | ZealthOS`
      : `${label} | ZealthOS`
  }, [pageLabel, clinicName, location?.pathname])
}

export default usePageTitle
