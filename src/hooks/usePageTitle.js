/**
 * usePageTitle.js
 * Hook to dynamically set browser tab title based on clinic name + current page.
 * Usage: usePageTitle('Appointments') → "Sunrise Physio — Appointments | ZealthOS"
 */
import { useEffect } from 'react'
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

  useEffect(() => {
    const label = pageLabel || (() => {
      const parts = window.location.pathname.split('/').filter(Boolean)
      const last = parts[parts.length - 1] || ''
      return PAGE_LABEL_MAP[last] || PAGE_LABEL_MAP[parts[0]] || 'Dashboard'
    })()

    const clinic = clinicName || 'ZealthOS'
    document.title = clinicName
      ? `${clinic} — ${label} | ZealthOS`
      : `${label} | ZealthOS`
  }, [pageLabel, clinicName])
}

export default usePageTitle
