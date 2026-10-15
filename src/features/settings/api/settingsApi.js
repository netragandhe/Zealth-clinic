import api from '../../../api/axios'

export const getSuperAdminProfile = async () => {
  const res = await api.get('/api/super-admin/profile')
  return res.data
}

export const updateSuperAdminProfile = async (profileData) => {
  const res = await api.put('/api/super-admin/profile', profileData)
  return res.data
}

export const getSettingsTemplates = async () => {
  const res = await api.get('/api/super-admin/settings/templates')
  return res.data
}

export const createSettingsTemplate = async (templateData) => {
  const res = await api.post('/api/super-admin/settings/templates', templateData)
  return res.data
}

export const updateSettingsTemplate = async (type, id, templateData) => {
  const res = await api.put(`/api/super-admin/settings/templates/${type}/${id}`, templateData)
  return res.data
}

export const deleteSettingsTemplate = async (type, id) => {
  const res = await api.delete(`/api/super-admin/settings/templates/${type}/${id}`)
  return res.data
}

export const getServices = async () => {
  const res = await api.get('/api/super-admin/settings/services')
  return res.data
}

export const createService = async (serviceData) => {
  const res = await api.post('/api/super-admin/settings/services', serviceData)
  return res.data
}

export const updateService = async (id, serviceData) => {
  const res = await api.put(`/api/super-admin/settings/services/${id}`, serviceData)
  return res.data
}

export const deleteService = async (id) => {
  const res = await api.delete(`/api/super-admin/settings/services/${id}`)
  return res.data
}

export const getClientTags = async () => {
  const res = await api.get('/api/super-admin/settings/tags')
  return res.data
}

export const createClientTag = async (tagData) => {
  const res = await api.post('/api/super-admin/settings/tags', tagData)
  return res.data
}

export const updateClientTag = async (id, tagData) => {
  const res = await api.put(`/api/super-admin/settings/tags/${id}`, tagData)
  return res.data
}

export const deleteClientTag = async (id) => {
  const res = await api.delete(`/api/super-admin/settings/tags/${id}`)
  return res.data
}

export const getCancellationReasons = async () => {
  const res = await api.get('/api/super-admin/settings/cancellation-reasons')
  return res.data
}

export const createCancellationReason = async (reasonData) => {
  const res = await api.post('/api/super-admin/settings/cancellation-reasons', reasonData)
  return res.data
}

export const updateCancellationReason = async (id, reasonData) => {
  const res = await api.put(`/api/super-admin/settings/cancellation-reasons/${id}`, reasonData)
  return res.data
}

export const deleteCancellationReason = async (id) => {
  const res = await api.delete(`/api/super-admin/settings/cancellation-reasons/${id}`)
  return res.data
}

export const processDataImport = async (importData) => {
  const res = await api.post('/api/super-admin/settings/import', importData)
  return res.data
}

export const logDataExport = async (exportData) => {
  const res = await api.post('/api/super-admin/settings/export', exportData)
  return res.data
}

export const getDataLogs = async (params) => {
  const res = await api.get('/api/super-admin/settings/data-logs', { params })
  return res.data
}

export const changeSuperAdminPassword = async (passwords) => {
  const res = await api.post('/api/super-admin/change-password', passwords)
  return res.data
}

export const getLoginHistoryLogs = async (params) => {
  const res = await api.get('/api/super-admin/login-history', { params })
  return res.data
}

export const revokeDeviceSession = async (id) => {
  const res = await api.delete(`/api/super-admin/sessions/${id}`)
  return res.data
}

export const getPractitionerLoginHistory = async (params) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/login-history' : '/api/super-admin/login-history'
  const res = await api.get(endpoint, { params })
  return res.data
}

export const recordPractitionerLoginLog = async (data) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/login-history' : '/api/super-admin/login-history'
  const res = await api.post(endpoint, data)
  return res.data
}

export const revokePractitionerSession = async (id) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/login-history/${id}` : `/api/super-admin/sessions/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const changePractitionerPassword = async (passwords) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/change-password' : '/api/super-admin/change-password'
  const res = await api.post(endpoint, passwords)
  return res.data
}

export const getPractitionerSecuritySettings = async () => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/security-settings' : '/api/super-admin/security-settings'
  const res = await api.get(endpoint).catch(() => ({ success: true, data: { tfaEnabled: true, tfaMethod: 'app' } }))
  return res.data
}

export const updatePractitionerSecuritySettings = async (settings) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/security-settings' : '/api/super-admin/security-settings'
  const res = await api.put(endpoint, settings)
  return res.data
}

export const getIntegrations = async () => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/settings/integrations' : '/api/clinic-admin/settings/integrations'
  const res = await api.get(endpoint)
  return res.data
}

export const updateIntegration = async (id, data) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/settings/integrations/${id}` : `/api/clinic-admin/settings/integrations/${id}`
  const res = await api.put(endpoint, data)
  return res.data
}

export const createIntegration = async (data) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/settings/integrations' : '/api/clinic-admin/settings/integrations'
  const res = await api.post(endpoint, data)
  return res.data
}

export const testIntegration = async (id, data = {}) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/settings/integrations/${id}/test` : `/api/clinic-admin/settings/integrations/${id}/test`
  const res = await api.post(endpoint, data)
  return res.data
}

export const deleteIntegration = async (id) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/settings/integrations/${id}` : `/api/clinic-admin/settings/integrations/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const getClinicSettingsTemplates = async () => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/settings/templates' : '/api/clinic-admin/settings/templates'
  const res = await api.get(endpoint)
  return res.data
}

export const createClinicSettingsTemplate = async (templateData) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? '/api/practitioner/settings/templates' : '/api/clinic-admin/settings/templates'
  const res = await api.post(endpoint, templateData)
  return res.data
}

export const updateClinicSettingsTemplate = async (type, id, templateData) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/settings/templates/${type}/${id}` : `/api/clinic-admin/settings/templates/${type}/${id}`
  const res = await api.put(endpoint, templateData)
  return res.data
}

export const deleteClinicSettingsTemplate = async (type, id) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner' ? `/api/practitioner/settings/templates/${type}/${id}` : `/api/clinic-admin/settings/templates/${type}/${id}`
  const res = await api.delete(endpoint)
  return res.data
}

export const updateInvoiceTemplates = async (invoiceData) => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic'
  const endpoint = role === 'practitioner'
    ? '/api/practitioner/settings/invoice-templates'
    : (role === 'super_admin' ? '/api/super-admin/settings/invoice-templates' : '/api/clinic-admin/settings/invoice-templates')
  const res = await api.put(endpoint, invoiceData)
  return res.data
}

export const getClinicServices = async () => {
  const res = await api.get('/api/clinic-admin/settings/services')
  return res.data
}

export const createClinicService = async (serviceData) => {
  const res = await api.post('/api/clinic-admin/settings/services', serviceData)
  return res.data
}

export const updateClinicService = async (id, serviceData) => {
  const res = await api.put(`/api/clinic-admin/settings/services/${id}`, serviceData)
  return res.data
}

export const deleteClinicService = async (id) => {
  const res = await api.delete(`/api/clinic-admin/settings/services/${id}`)
  return res.data
}

export const getClinicCancellationReasons = async () => {
  const res = await api.get('/api/clinic-admin/settings/cancellation-reasons')
  return res.data
}

export const createClinicCancellationReason = async (data) => {
  const res = await api.post('/api/clinic-admin/settings/cancellation-reasons', data)
  return res.data
}

export const updateClinicCancellationReason = async (id, data) => {
  const res = await api.put(`/api/clinic-admin/settings/cancellation-reasons/${id}`, data)
  return res.data
}

export const deleteClinicCancellationReason = async (id) => {
  const res = await api.delete(`/api/clinic-admin/settings/cancellation-reasons/${id}`)
  return res.data
}

export const getClinicClientTags = async () => {
  const res = await api.get('/api/clinic-admin/settings/tags')
  return res.data
}

export const createClinicClientTag = async (data) => {
  const res = await api.post('/api/clinic-admin/settings/tags', data)
  return res.data
}

export const updateClinicClientTag = async (id, data) => {
  const res = await api.put(`/api/clinic-admin/settings/tags/${id}`, data)
  return res.data
}

export const deleteClinicClientTag = async (id) => {
  const res = await api.delete(`/api/clinic-admin/settings/tags/${id}`)
  return res.data
}

export const getPaymentTerms = async () => {
  const res = await api.get('/api/clinic-admin/settings/payment-terms')
  return res.data
}

export const updatePaymentTerms = async (terms) => {
  const res = await api.put('/api/clinic-admin/settings/payment-terms', { terms })
  return res.data
}

export const clearSampleTestData = async () => {
  const res = await api.post('/api/clinic-admin/settings/clear-test-data')
  return res.data
}





