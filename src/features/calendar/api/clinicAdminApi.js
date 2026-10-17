import api from '../../../api/axios'

const getRole = () => (typeof window !== 'undefined' ? (localStorage.getItem('userRole') || '').toLowerCase() : '')
const isPatientContext = () => getRole() === 'patient' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/patient'))
const isPractitionerContext = () => getRole() === 'practitioner' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/practitioner'))

export const getAppointments = async (params) => {
  const endpoint = isPatientContext() ? '/api/patient/appointments' : (isPractitionerContext() ? '/api/practitioner/appointments' : '/api/clinic-admin/appointments')
  const res = await api.get(endpoint, { params })
  return res.data
}

export const createAppointment = async (apptData) => {
  const endpoint = isPatientContext() ? '/api/patient/appointments' : (isPractitionerContext() ? '/api/practitioner/appointments' : '/api/clinic-admin/appointments')
  const res = await api.post(endpoint, apptData)
  return res.data
}

export const updateAppointment = async (id, apptData) => {
  const endpoint = isPatientContext() ? `/api/patient/appointments/${id}/reschedule` : (isPractitionerContext() ? `/api/practitioner/appointments/${id}` : `/api/clinic-admin/appointments/${id}`)
  const res = await api.put(endpoint, apptData)
  return res.data
}

export const deleteAppointment = async (id) => {
  if (isPatientContext()) {
    const res = await api.put(`/api/patient/appointments/${id}/cancel`)
    return res.data
  }
  const endpoint = isPractitionerContext() ? `/api/practitioner/appointments/${id}` : `/api/clinic-admin/appointments/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const getPatients = async (params) => {
  const endpoint = isPractitionerContext() ? '/api/practitioner/patients' : '/api/clinic-admin/patients'
  const res = await api.get(endpoint, { params })
  return res.data
}

export const getPatientById = async (id) => {
  const endpoint = isPractitionerContext() ? `/api/practitioner/patients/${id}` : `/api/clinic-admin/patients/${id}`
  const res = await api.get(endpoint)
  return res.data
}

export const createPatient = async (patientData) => {
  const endpoint = isPractitionerContext() ? '/api/practitioner/patients' : '/api/clinic-admin/patients'
  const res = await api.post(endpoint, patientData)
  return res.data
}

export const updatePatient = async (id, patientData) => {
  const endpoint = isPractitionerContext() ? `/api/practitioner/patients/${id}` : `/api/clinic-admin/patients/${id}`
  const res = await api.put(endpoint, patientData)
  return res.data
}

export const deletePatient = async (id) => {
  const endpoint = isPractitionerContext() ? `/api/practitioner/patients/${id}` : `/api/clinic-admin/patients/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const getContacts = async (params) => {
  const res = await api.get('/api/clinic-admin/contacts', { params })
  return res.data
}

export const getContactById = async (id) => {
  const res = await api.get(`/api/clinic-admin/contacts/${id}`)
  return res.data
}

export const createContact = async (contactData) => {
  const res = await api.post('/api/clinic-admin/contacts', contactData)
  return res.data
}

export const updateContact = async (id, contactData) => {
  const res = await api.put(`/api/clinic-admin/contacts/${id}`, contactData)
  return res.data
}

export const deleteContact = async (id) => {
  const res = await api.delete(`/api/clinic-admin/contacts/${id}`)
  return res.data
}

export const getWaitlist = async (params) => {
  const res = await api.get('/api/clinic-admin/waitlist', { params })
  return res.data
}

export const createWaitlist = async (waitlistData) => {
  const res = await api.post('/api/clinic-admin/waitlist', waitlistData)
  return res.data
}

export const updateWaitlist = async (id, waitlistData) => {
  const res = await api.put(`/api/clinic-admin/waitlist/${id}`, waitlistData)
  return res.data
}

export const getInvoices = async (params) => {
  const res = await api.get('/api/clinic-admin/invoices', { params })
  return res.data
}

export const createInvoice = async (invoiceData) => {
  const headers = invoiceData?.idempotencyKey ? { 'x-idempotency-key': invoiceData.idempotencyKey } : {}
  const res = await api.post('/api/clinic-admin/invoices', invoiceData, { headers })
  return res.data
}

export const updateInvoice = async (id, invoiceData) => {
  const res = await api.put(`/api/clinic-admin/invoices/${id}`, invoiceData)
  return res.data
}

export const deleteInvoice = async (id) => {
  const res = await api.delete(`/api/clinic-admin/invoices/${id}`)
  return res.data
}

export const getPayments = async (params) => {
  const role = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || 'clinic') : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/payments' : '/api/clinic-admin/payments'
  const res = await api.get(endpoint, { params })
  return res.data
}

export const createPayment = async (paymentData, config = {}) => {
  const role = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || 'clinic') : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/payments' : '/api/clinic-admin/payments'
  const headers = paymentData?.idempotencyKey
    ? { 'x-idempotency-key': paymentData.idempotencyKey, ...(config.headers || {}) }
    : (config.headers || {})
  const res = await api.post(endpoint, paymentData, { ...config, headers })
  return res.data
}

export const updatePayment = async (id, paymentData) => {
  const role = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || 'clinic') : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/payments/${id}` : `/api/clinic-admin/payments/${id}`
  const res = await api.put(endpoint, paymentData)
  return res.data
}

export const deletePayment = async (id) => {
  const role = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || 'clinic') : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/payments/${id}` : `/api/clinic-admin/payments/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const getProducts = async (params) => {
  const res = await api.get('/api/clinic-admin/products', { params })
  return res.data
}

export const createProduct = async (productData) => {
  const res = await api.post('/api/clinic-admin/products', productData)
  return res.data
}

export const updateProduct = async (id, productData) => {
  const res = await api.put(`/api/clinic-admin/products/${id}`, productData)
  return res.data
}

export const deleteProduct = async (id) => {
  const res = await api.delete(`/api/clinic-admin/products/${id}`)
  return res.data
}

export const getReports = async (params) => {
  const res = await api.get('/api/clinic-admin/reports', { params })
  return res.data
}

export const getDocuments = async (params) => {
  const endpoint = isPractitionerContext() ? '/api/practitioner/documents' : '/api/clinic-admin/documents'
  const res = await api.get(endpoint, { params })
  return res.data
}

export const createDocument = async (docData) => {
  const endpoint = isPractitionerContext() ? '/api/practitioner/documents' : '/api/clinic-admin/documents'
  const res = await api.post(endpoint, docData)
  return res.data
}

export const updateDocument = async (id, docData) => {
  const endpoint = isPractitionerContext() ? `/api/practitioner/documents/${id}` : `/api/clinic-admin/documents/${id}`
  const res = await api.put(endpoint, docData)
  return res.data
}

export const deleteDocument = async (id) => {
  const endpoint = isPractitionerContext() ? `/api/practitioner/documents/${id}` : `/api/clinic-admin/documents/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const getClinicAdminProfile = async () => {
  const res = await api.get('/api/clinic-admin/profile')
  return res.data
}

export const updateClinicAdminProfile = async (profileData) => {
  const res = await api.put('/api/clinic-admin/profile', profileData)
  return res.data
}

export const getClinicDetails = async () => {
  const res = await api.get('/api/clinic-admin/details')
  return res.data
}

export const updateClinicDetails = async (detailsData) => {
  const res = await api.put('/api/clinic-admin/details', detailsData)
  return res.data
}

export const getBranches = async (params) => {
  const res = await api.get('/api/clinic-admin/branches', { params })
  return res.data
}

export const createBranch = async (branchData) => {
  const res = await api.post('/api/clinic-admin/branches', branchData)
  return res.data
}

export const updateBranch = async (id, branchData) => {
  const res = await api.put(`/api/clinic-admin/branches/${id}`, branchData)
  return res.data
}

export const deleteBranch = async (id) => {
  const res = await api.delete(`/api/clinic-admin/branches/${id}`)
  return res.data
}

export const getAdmins = async (params) => {
  const res = await api.get('/api/clinic-admin/admins', { params })
  return res.data
}

export const createAdmin = async (adminData) => {
  const res = await api.post('/api/clinic-admin/admins', adminData)
  return res.data
}

export const updateAdmin = async (id, adminData) => {
  const res = await api.put(`/api/clinic-admin/admins/${id}`, adminData)
  return res.data
}

export const deleteAdmin = async (id) => {
  const res = await api.delete(`/api/clinic-admin/admins/${id}`)
  return res.data
}

export const getPractitioners = async (params) => {
  const res = await api.get('/api/clinic-admin/practitioners', { params })
  return res.data
}

export const createPractitioner = async (practitionerData) => {
  const res = await api.post('/api/clinic-admin/practitioners', practitionerData)
  return res.data
}

export const updatePractitioner = async (id, practitionerData) => {
  const res = await api.put(`/api/clinic-admin/practitioners/${id}`, practitionerData)
  return res.data
}

export const deletePractitioner = async (id) => {
  const res = await api.delete(`/api/clinic-admin/practitioners/${id}`)
  return res.data
}

export const getPractitionerProfile = async () => {
  const res = await api.get('/api/practitioner/profile')
  return res.data
}

export const updatePractitionerProfile = async (profileData) => {
  const res = await api.put('/api/practitioner/profile', profileData)
  return res.data
}

export const getBodyChartTemplates = async () => {
  const res = await api.get('/api/practitioner/body-chart-templates')
  return res.data
}

export const createBodyChartTemplate = async (data) => {
  const res = await api.post('/api/practitioner/body-chart-templates', data)
  return res.data
}

export const updateBodyChartTemplate = async (id, data) => {
  const res = await api.put(`/api/practitioner/body-chart-templates/${id}`, data)
  return res.data
}

export const deleteBodyChartTemplate = async (id) => {
  const res = await api.delete(`/api/practitioner/body-chart-templates/${id}`)
  return res.data
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getClinicDashboardStats = async () => {
  const res = await api.get('/api/clinic-admin/dashboard/stats')
  return res.data
}

export const getPractitionerDashboardStats = async () => {
  const res = await api.get('/api/practitioner/dashboard/stats')
  return res.data
}

export const getApiKeys = async () => {
  const res = await api.get('/api/practitioner/settings/api-keys')
  return res.data
}

export const createApiKey = async (name) => {
  const res = await api.post('/api/practitioner/settings/api-keys', { name })
  return res.data
}

export const deleteApiKey = async (id) => {
  const res = await api.delete(`/api/practitioner/settings/api-keys/${id}`)
  return res.data
}

// ─── Dynamic Clinical Cases API ─────────────────────────────────────────────
export const getCases = async (params) => {
  const res = await api.get('/api/practitioner/cases', { params })
  return res.data
}

export const createCase = async (caseData) => {
  const res = await api.post('/api/practitioner/cases', caseData)
  return res.data
}

export const updateCase = async (id, caseData) => {
  const res = await api.put(`/api/practitioner/cases/${id}`, caseData)
  return res.data
}

export const deleteCase = async (id) => {
  const res = await api.delete(`/api/practitioner/cases/${id}`)
  return res.data
}

// ─── Dynamic Client Communications API ──────────────────────────────────────
export const getCommunications = async (params) => {
  const res = await api.get('/api/clinic-admin/communications', { params })
  return res.data
}

export const createCommunication = async (commData) => {
  const res = await api.post('/api/clinic-admin/communications', commData)
  return res.data
}

export const deleteCommunication = async (id) => {
  const res = await api.delete(`/api/clinic-admin/communications/${id}`)
  return res.data
}

