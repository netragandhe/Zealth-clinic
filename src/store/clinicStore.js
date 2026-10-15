import { create } from 'zustand'
import dayjs from 'dayjs'
import api from '../api/axios'
import { 
  getIntegrations, updateIntegration, createIntegration, deleteIntegration,
  getClinicSettingsTemplates, createClinicSettingsTemplate, updateClinicSettingsTemplate, deleteClinicSettingsTemplate,
  getClinicClientTags, getClinicCancellationReasons, getPaymentTerms,
  getClinicServices, createClinicService, updateClinicService, deleteClinicService
} from '../features/settings/api/settingsApi'
import { getPatients, getPractitioners, getProducts, createProduct, updateProduct, deleteProduct, getBranches, getClinicDetails } from '../features/calendar/api/clinicAdminApi'

export const useClinicStore = create((set, get) => ({
  darkMode: typeof window !== 'undefined' ? localStorage.getItem('darkMode') === 'true' : false,
  toggleDarkMode: () => {
    const next = !get().darkMode
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(next))
    }
    set({ darkMode: next })
  },

  branches: [],
  setBranches: (branches) => set({ branches: Array.isArray(branches) ? branches : [] }),

  patients: [],
  setPatients: (patients) => set({ patients: Array.isArray(patients) ? patients : [] }),

  clinicDetails: null,
  setClinicDetails: (clinicDetails) => set({ clinicDetails }),

  /* Fetch all dynamic settings data on app load */
  initStoreData: async () => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null
      const publicPaths = ['/', '/login', '/register', '/forgot-password']

      if (!token && publicPaths.includes(path)) {
        return
      }

      const role = (get().userRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : '') || '').toLowerCase()

      // Sales and Patient roles have their own API fetchers — skip clinic-admin APIs entirely
      const isSalesRole = role === 'sales' || path.startsWith('/sales')
      const isPatientRole = role === 'patient' || path.startsWith('/patient')
      const isPractitionerRole = role === 'practitioner' || path.startsWith('/practitioner')
      const isClinicRole = role === 'clinic' || role === 'head_admin' || role === 'super_admin' || path.startsWith('/clinic-admin') || path.startsWith('/head-admin')

      // Sales portal specific init
      if (isSalesRole) {
        const [plansRes, commissionsRes] = await Promise.allSettled([
          api.get('/api/sales/subscription-plans').catch(() => null),
          api.get('/api/sales/commissions').catch(() => null)
        ])
        
        const updates = {}
        if (plansRes.status === 'fulfilled' && plansRes.value?.data?.success && Array.isArray(plansRes.value.data.data)) {
          updates.subscriptionPlans = plansRes.value.data.data
        }
        if (commissionsRes.status === 'fulfilled' && commissionsRes.value?.data?.success && Array.isArray(commissionsRes.value.data.data)) {
          updates.salesCommissions = commissionsRes.value.data.data
        }
        
        if (Object.keys(updates).length > 0) {
          set(updates)
        }
        return
      }

      // Patient portal specific init
      if (isPatientRole) {
        return
      }

      // Practitioner: fetch consultations + practitioners + patients + appointments
      if (isPractitionerRole) {
        const [practitionersRes, consultationsRes, patientsRes, clinicDetailsRes] = await Promise.allSettled([
          getPractitioners(),
          api.get('/api/practitioner/consultations').then(r => r.data).catch(() => null),
          getPatients(),
          getClinicDetails()
        ])
        if (practitionersRes.status === 'fulfilled' && practitionersRes.value?.success) {
          set({ practitioners: practitionersRes.value.data })
        }
        if (consultationsRes.status === 'fulfilled' && consultationsRes.value?.success) {
          set({ consultations: consultationsRes.value.data })
        }
        if (patientsRes.status === 'fulfilled' && patientsRes.value?.success && Array.isArray(patientsRes.value.data)) {
          set({ patients: patientsRes.value.data })
        }
        if (clinicDetailsRes.status === 'fulfilled' && clinicDetailsRes.value?.success && clinicDetailsRes.value?.data) {
          set({ clinicDetails: clinicDetailsRes.value.data })
        }
        await get().fetchAppointments().catch(() => null)
        return
      }

      // Clinic Admin / Head Admin: fetch full clinic-admin data suite
      if (isClinicRole) {
        const [tagsRes, reasonsRes, termsRes, patientsRes, practitionersRes, productsRes, servicesRes, branchesRes, integrationsRes, clinicDetailsRes] = await Promise.allSettled([
          getClinicClientTags(),
          getClinicCancellationReasons(),
          getPaymentTerms(),
          getPatients(),
          getPractitioners(),
          getProducts(),
          getClinicServices(),
          getBranches(),
          getIntegrations(),
          getClinicDetails(),
        ])

        if (clinicDetailsRes.status === 'fulfilled' && clinicDetailsRes.value?.success && clinicDetailsRes.value?.data) {
          set({ clinicDetails: clinicDetailsRes.value.data })
        }
        if (tagsRes.status === 'fulfilled' && tagsRes.value?.success && Array.isArray(tagsRes.value.data)) {
          set({ clientTags: tagsRes.value.data })
        }
        if (integrationsRes.status === 'fulfilled' && integrationsRes.value?.success && Array.isArray(integrationsRes.value.data)) {
          set({ integrations: integrationsRes.value.data })
        }
        if (reasonsRes.status === 'fulfilled' && reasonsRes.value?.success && Array.isArray(reasonsRes.value.data)) {
          set({ cancellationReasons: reasonsRes.value.data })
        }
        if (termsRes.status === 'fulfilled' && termsRes.value?.success && Array.isArray(termsRes.value.data)) {
          set((state) => ({
            invoiceTemplates: {
              ...state.invoiceTemplates,
              paymentTermsList: termsRes.value.data
            }
          }))
        }
        if (patientsRes.status === 'fulfilled' && patientsRes.value?.success && Array.isArray(patientsRes.value.data)) {
          const mapped = patientsRes.value.data.map(p => ({
            ...p,
            name: p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Unnamed Client'
          }))
          set({ patients: mapped })
        }
        if (practitionersRes.status === 'fulfilled' && practitionersRes.value?.success && Array.isArray(practitionersRes.value.data)) {
          set({ practitioners: practitionersRes.value.data })
        }
        if (productsRes.status === 'fulfilled' && productsRes.value?.success && Array.isArray(productsRes.value.data)) {
          set({ products: productsRes.value.data })
        }
        if (servicesRes.status === 'fulfilled' && servicesRes.value?.success && Array.isArray(servicesRes.value.data)) {
          set({ services: servicesRes.value.data })
        }
        if (branchesRes.status === 'fulfilled' && branchesRes.value?.success && Array.isArray(branchesRes.value.data)) {
          set({ branches: branchesRes.value.data })
        }
        await get().fetchAppointments().catch(() => null)
      }
    } catch (err) {
      console.error('❌ Error initializing store dynamic data:', err)
    }
  },

  /* Active practitioners */
  practitioners: [],
  setPractitioners: (practitioners) => set({ practitioners: Array.isArray(practitioners) ? practitioners : [] }),

  /* Active services setter */
  setServices: (services) => set({ services: Array.isArray(services) ? services : [] }),

  /* Custom client tags */
  clientTags: [
    { id: 't1', name: 'NDIS', color: '#30D2BE', icon: 'SafetyCertificateOutlined' },
    { id: 't2', name: 'Private', color: '#64748B', icon: 'LockOutlined' },
    { id: 't3', name: 'Medicare', color: '#8C4BFF', icon: 'HeartOutlined' },
    { id: 't4', name: 'WorkCover', color: '#F59E0B', icon: 'AuditOutlined' },
    { id: 't5', name: 'High Priority', color: '#EF4444', icon: 'WarningOutlined' },
    { id: 't6', name: 'Falls Risk', color: '#F97316', icon: 'InfoCircleOutlined' },
    { id: 't7', name: 'Telehealth', color: '#06B6D4', icon: 'ApiOutlined' },
  ],

  /* Active branches list */
  branches: [],

  /* Admin users */
  admins: [],

  /* Third-party integrations */
  integrations: [
    { id: 'xero', name: 'Xero', type: 'Accounting', connected: false, lastSync: null },
    { id: 'myob', name: 'MYOB', type: 'Accounting', connected: false, lastSync: null },
    { id: 'physitrack', name: 'Physitrack', type: 'Exercise Prescription', connected: false, lastSync: null },
    { id: 'vald', name: 'VALD HUB', type: 'Exercise Prescription', connected: false, lastSync: null },
    { id: 'stripe', name: 'Stripe', type: 'Payments', connected: false, lastSync: null },
    { id: 'zoom', name: 'Zoom', type: 'Video Consultations', connected: false, lastSync: null },
    { id: 'gmeet', name: 'Google Meet', type: 'Video Consultations', connected: false, lastSync: null },
    { id: 'hicaps', name: 'HICAPS', type: 'Health Claiming', connected: false, lastSync: null },
    { id: 'tyro', name: 'Tyro Health', type: 'Health Claiming', connected: false, lastSync: null },
  ],

  /* Form templates */
  formTemplates: [],

  /* Letter templates */
  letterTemplates: [],

  /* Note templates */
  noteTemplates: [],

  /* Clinical Documents */
  documents: [],
  setDocuments: (documents) => set({ documents: Array.isArray(documents) ? documents : [] }),
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  updateDocument: (doc) => set((state) => ({ documents: state.documents.map((d) => (d.id === doc.id ? doc : d)) })),
  deleteDocument: (id) => set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

  /* Clinical Tasks & Custom Categories (Requirement 2) */
  tasks: [
    {
      id: 't_1',
      title: 'Prepare Initial Functional Capacity Assessment Report',
      patientName: 'John Miller',
      type: 'Report Due',
      dueDate: '2026-06-20',
      status: 'Pending'
    },
    {
      id: 't_2',
      title: 'NDIS Plan Funding Review and Budget Check',
      patientName: 'Emma Watson',
      type: 'Funding Review Due',
      dueDate: '2026-06-22',
      status: 'In Progress'
    },
    {
      id: 't_3',
      title: 'GP Medical Referral Letter Follow-Up',
      patientName: 'David Lee',
      type: 'Referral Required',
      dueDate: '2026-06-25',
      status: 'Pending'
    },
    {
      id: 't_4',
      title: 'Post-Op Rehabilitation Milestone Review',
      patientName: 'Sophia Taylor',
      type: 'Follow-Up Required',
      dueDate: '2026-06-28',
      status: 'Completed'
    }
  ],
  taskCategories: [
    'Report Due',
    'Funding Review Due',
    'Referral Required',
    'Follow-Up Required',
    'General Assessment',
    'Discharge Note'
  ],
  addTaskCategory: (categoryName) => {
    const trimmed = (categoryName || '').trim()
    if (!trimmed) return
    const current = get().taskCategories || []
    if (!current.includes(trimmed)) {
      set({ taskCategories: [...current, trimmed] })
    }
  },
  updateTaskCategory: (oldName, newName) => {
    const trimmed = (newName || '').trim()
    if (!trimmed || trimmed === oldName) return
    const current = get().taskCategories || []
    set({
      taskCategories: current.map(c => (c === oldName ? trimmed : c)),
      tasks: (get().tasks || []).map(t => (t.type === oldName ? { ...t, type: trimmed } : t))
    })
  },
  deleteTaskCategory: (categoryName) => {
    set({
      taskCategories: (get().taskCategories || []).filter(c => c !== categoryName)
    })
  },
  setTasks: (tasks) => set({ tasks: Array.isArray(tasks) ? tasks : [] }),
  addTask: (task) => {
    if (task.type) get().addTaskCategory(task.type)
    set((state) => ({ tasks: [task, ...(state.tasks || [])] }))
  },
  updateTask: (task) => {
    if (task.type) get().addTaskCategory(task.type)
    set((state) => ({
      tasks: (state.tasks || []).map((t) => (t.id === task.id ? { ...t, ...task } : t))
    }))
  },
  updateTaskStatus: (id, newStatus) => {
    set((state) => ({
      tasks: (state.tasks || []).map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    }))
  },
  deleteTask: (id) => {
    set((state) => ({
      tasks: (state.tasks || []).filter((t) => t.id !== id)
    }))
  },

  /* Invoice layout preferences */
  invoiceTemplates: {
    logoUrl: null,
    paymentTerms: '7 Days',
    footerText: 'Thank you for choosing ZealthOS practice network.',
    layouts: [
      { id: 'inv1', type: 'Private Client Invoice', desc: 'Auto-applies standard service price.' },
      { id: 'inv2', type: 'NDIS Invoice', desc: 'Adds line codes and nominee fields.' },
      { id: 'inv3', type: 'DVA Invoice', desc: 'Formatted with Veteran file reference.' },
      { id: 'inv4', type: 'WorkCover Invoice', desc: 'Includes Injury Case identifiers.' },
    ],
  },

  /* Services offered */
  services: [],

  /* Services Actions with live MySQL DB API Sync */
  addService: async (data) => {
    try {
      const payload = {
        name: data.name,
        category: data.category || 'Therapeutic Supports',
        price: parseFloat(data.price) || 0,
        duration: parseInt(data.duration, 10) || 60,
        ndisCode: data.ndisCode || '',
        color: data.color || '#8C4BFF',
        gst: data.gst || false,
        taxable: data.taxable || false,
        description: data.description || ''
      }
      const res = await createClinicService(payload)
      if (res && res.success && res.data) {
        const newService = res.data
        set((state) => ({
          services: [newService, ...state.services]
        }))
        return newService
      }
    } catch (err) {
      console.error('❌ Error creating service in DB:', err)
    }
    const fallbackService = {
      id: `s_${Date.now()}`,
      name: data.name,
      duration: parseInt(data.duration, 10) || 60,
      ndisCode: data.ndisCode || '',
      price: parseFloat(data.price) || 0,
      color: data.color || '#8C4BFF',
      archived: false
    }
    set((state) => ({ services: [fallbackService, ...state.services] }))
    return fallbackService
  },

  editService: async (service) => {
    try {
      const payload = {
        name: service.name,
        category: service.category || 'Therapeutic Supports',
        price: parseFloat(service.price) || 0,
        duration: parseInt(service.duration, 10) || 60,
        ndisCode: service.ndisCode || '',
        color: service.color || '#8C4BFF',
        archived: service.archived || false
      }
      await updateClinicService(service.id, payload).catch(() => null)
    } catch (err) {
      console.error('❌ Error updating service in DB:', err)
    }
    set((state) => ({
      services: state.services.map((s) => (s.id === service.id ? { ...s, ...service } : s))
    }))
  },

  archiveService: async (id) => {
    try {
      await updateClinicService(id, { archived: true }).catch(() => null)
    } catch (err) {
      console.error('❌ Error archiving service in DB:', err)
    }
    set((state) => ({
      services: state.services.map((s) => (s.id === id ? { ...s, archived: true } : s))
    }))
  },

  removeService: async (id) => {
    try {
      await deleteClinicService(id).catch(() => null)
    } catch (err) {
      console.error('❌ Error deleting service from DB:', err)
    }
    set((state) => ({
      services: state.services.filter((s) => s.id !== id)
    }))
  },

  /* Cancellation reasons */
  cancellationReasons: [
    { id: 'cr1', reason: 'Client Cancelled', archived: false },
    { id: 'cr2', reason: 'Practitioner Cancelled', archived: false },
    { id: 'cr3', reason: 'Sick', archived: false },
    { id: 'cr4', reason: 'Hospital Admission', archived: false },
    { id: 'cr5', reason: 'No Show', archived: false },
  ],

  /* Calendar settings */
  workHours: { startTime: '09:00', endTime: '17:00' },
  visibleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  calendarInterval: 30,

  /* Primary patients registry */
  patients: [],
  setPatients: (patients) => set({ patients: Array.isArray(patients) ? patients : [] }),
  fetchPatients: async () => {
    try {
      const res = await getPatients()
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(p => ({
          ...p,
          name: p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Unnamed Client'
        }))
        set({ patients: mapped })
        return mapped
      }
    } catch (err) {
      console.error('❌ Error fetching patients in store:', err)
    }
  },

  /* Waitlist data */
  waitlist: [],

  /* Contacts */
  contacts: [],

  /* Invoices list */
  invoices: [],

  /* Documents center */
  documents: [],
  addDocModalOpen: false,
  salesLeadModalOpen: false,
  salesDemoModalOpen: false,
  salesTaskModalOpen: false,
  salesProposalModalOpen: false,
  salesConvertModalOpen: false,
  salesSelectedLeadId: null,

  /* Import & Export logs */
  importExportLogs: [],

  /* User role state */
  userRole: typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'clinic' : 'clinic',
  setUserRole: (role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role)
    }
    set({ userRole: role })
  },

  /* Appointments schedule list */
  appointments: [],

  /* Message board */
  messageBoard: [],

  /* Settings Actions */
  integrationsLoading: false,
  updateSettings: (key, value) => {
    set((state) => ({ [key]: value }))
  },
  fetchIntegrations: async () => {
    set({ integrationsLoading: true })
    try {
      const res = await getIntegrations()
      if (res && res.success && Array.isArray(res.data)) {
        set({ integrations: res.data })
        return res.data
      }
    } catch (err) {
      console.error('❌ Error fetching integrations from DB:', err)
    } finally {
      set({ integrationsLoading: false })
    }
  },
  templatesLoading: false,
  fetchSettingsTemplates: async () => {
    set({ templatesLoading: true })
    try {
      const res = await getClinicSettingsTemplates()
      if (res && res.success) {
        const { forms, letters, notes, invoiceTemplates } = res.data
        set({
          formTemplates: forms || [],
          letterTemplates: letters || [],
          noteTemplates: notes || [],
          invoiceTemplates: invoiceTemplates || get().invoiceTemplates
        })
      }
    } catch (err) {
      console.error('❌ Error fetching templates from DB:', err)
    } finally {
      set({ templatesLoading: false })
    }
  },
  addSettingsTemplate: async (type, template) => {
    try {
      const res = await createClinicSettingsTemplate({ type, ...template })
      if (res && res.success) {
         await get().fetchSettingsTemplates()
         return { success: true }
      }
      return { success: false }
    } catch (err) {
      console.error('❌ Error adding template:', err)
      return { success: false }
    }
  },
  updateSettingsTemplate: async (type, id, template) => {
    try {
      const res = await updateClinicSettingsTemplate(type, id, template)
      if (res && res.success) {
         await get().fetchSettingsTemplates()
         return { success: true }
      }
      return { success: false }
    } catch (err) {
      console.error('❌ Error updating template:', err)
      return { success: false }
    }
  },
  removeSettingsTemplate: async (type, id) => {
    try {
      const res = await deleteClinicSettingsTemplate(type, id)
      if (res && res.success) {
         await get().fetchSettingsTemplates()
         return { success: true }
      }
      return { success: false }
    } catch (err) {
      console.error('❌ Error deleting template:', err)
      return { success: false }
    }
  },
  toggleIntegration: async (id, overrideConnected) => {
    try {
      const current = get().integrations.find((item) => item.id === id)
      const nextConnected = overrideConnected !== undefined ? overrideConnected : !(current?.connected)
      const res = await updateIntegration(id, { connected: nextConnected })
      if (res && res.success && Array.isArray(res.data)) {
        set({ integrations: res.data })
        return res.data
      }
    } catch (err) {
      console.error('❌ Error toggling integration in DB:', err)
    }
    set((state) => ({
      integrations: state.integrations.map((item) => {
        if (item.id === id) {
          const nowConnected = overrideConnected !== undefined ? overrideConnected : !item.connected
          return {
            ...item,
            connected: nowConnected,
            lastSync: nowConnected ? new Date().toLocaleString() : null,
          }
        }
        return item
      }),
    }))
  },
  syncIntegration: async (id) => {
    try {
      const now = new Date().toLocaleString()
      const res = await updateIntegration(id, { connected: true, lastSync: now })
      if (res && res.success && Array.isArray(res.data)) {
        set({ integrations: res.data })
        return res.data
      }
    } catch (err) {
      console.error('❌ Error syncing integration in DB:', err)
    }
    set((state) => ({
      integrations: state.integrations.map((item) =>
        item.id === id ? { ...item, lastSync: new Date().toLocaleString() } : item
      ),
    }))
  },
  addIntegration: async (data) => {
    try {
      const res = await createIntegration(data)
      if (res && res.success && Array.isArray(res.data)) {
        set({ integrations: res.data })
        return res.data
      }
    } catch (err) {
      console.error('❌ Error creating integration in DB:', err)
    }
    const newInt = {
      id: `custom_${Date.now()}`,
      name: data.name,
      type: data.type || 'Custom Integration',
      connected: Boolean(data.connected),
      lastSync: data.connected ? new Date().toLocaleString() : null,
      description: data.description || 'Custom software integration.',
      isCustom: true
    }
    set((state) => ({ integrations: [newInt, ...state.integrations] }))
    return newInt
  },
  deleteIntegration: async (id) => {
    try {
      const res = await deleteIntegration(id)
      if (res && res.success && Array.isArray(res.data)) {
        set({ integrations: res.data })
        return res.data
      }
    } catch (err) {
      console.error('❌ Error deleting integration from DB:', err)
    }
    set((state) => ({
      integrations: state.integrations.filter((item) => item.id !== id),
    }))
  },
  messageBoardLoading: false,
  fetchMessageBoardItems: async () => {
    set({ messageBoardLoading: true })
    try {
      const res = await api.get('/api/message-board')
      if (res.data?.success && Array.isArray(res.data.data)) {
        set({ messageBoard: res.data.data })
      }
    } catch (err) {
      console.error('❌ Error loading message board from DB:', err)
    } finally {
      set({ messageBoardLoading: false })
    }
  },
  addMessageBoardItem: async (msg) => {
    try {
      const res = await api.post('/api/message-board', msg)
      if (res.data?.success && res.data.data) {
        set((state) => ({
          messageBoard: [res.data.data, ...state.messageBoard]
        }))
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error posting message board item to DB:', err)
      const fallbackMsg = {
        id: `mb_${Date.now()}`,
        ...msg,
        timestamp: new Date().toLocaleString(),
      }
      set((state) => ({
        messageBoard: [fallbackMsg, ...state.messageBoard],
      }))
      return fallbackMsg
    }
  },
  deleteMessageBoardItem: async (id) => {
    try {
      await api.delete(`/api/message-board/${id}`)
    } catch (err) {
      console.error('❌ Error deleting message board item from DB:', err)
    }
    set((state) => ({
      messageBoard: state.messageBoard.filter((item) => item.id !== id)
    }))
  },

  /* Services CRUD */
  addService: (service) => {
    const newService = {
      id: `s_${Date.now()}`,
      archived: false,
      ndisCode: '',
      gst: false,
      ...service,
    }
    set((state) => ({ services: [...state.services, newService] }))
  },
  editService: (service) => {
    set((state) => ({
      services: state.services.map((s) => (s.id === service.id ? service : s)),
    }))
  },
  archiveService: (id) => {
    set((state) => ({
      services: state.services.map((s) => (s.id === id ? { ...s, archived: true } : s)),
    }))
  },
  removeService: (id) => {
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    }))
  },

  /* Cancellation reasons CRUD */
  addCancellationReason: (reasonText) => {
    const newReason = { id: `cr_${Date.now()}`, reason: reasonText, archived: false }
    set((state) => ({ cancellationReasons: [...state.cancellationReasons, newReason] }))
  },
  editCancellationReason: (id, text) => {
    set((state) => ({
      cancellationReasons: state.cancellationReasons.map((item) =>
        item.id === id ? { ...item, reason: text } : item
      ),
    }))
  },
  archiveCancellationReason: (id) => {
    set((state) => ({
      cancellationReasons: state.cancellationReasons.map((item) =>
        item.id === id ? { ...item, archived: true } : item
      ),
    }))
  },

  /* Client tags CRUD */
  addClientTag: (tag) => {
    const newTag = { id: `t_${Date.now()}`, ...tag }
    set((state) => ({ clientTags: [...state.clientTags, newTag] }))
  },
  editClientTag: (tag) => {
    set((state) => ({
      clientTags: state.clientTags.map((t) => (t.id === tag.id ? tag : t)),
    }))
  },
  deleteClientTag: (id) => {
    set((state) => ({
      clientTags: state.clientTags.filter((t) => t.id !== id),
    }))
  },

  /* Branches CRUD */
  addBranch: (branch) => {
    const newBranch = {
      id: `b_${Date.now()}`,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active',
      phone: '',
      address: '',
      timezone: 'AEST',
      businessHours: { startTime: '09:00', endTime: '17:00' },
      ...branch,
    }
    set((state) => ({ branches: [...state.branches, newBranch] }))
  },
  editBranch: (branch) => {
    set((state) => ({
      branches: state.branches.map((b) => (b.id === branch.id ? branch : b)),
    }))
  },
  deleteBranch: (id) => {
    set((state) => ({
      branches: state.branches.filter((b) => b.id !== id),
    }))
  },

  /* Import & Export Logs */
  addImportExportLog: (log) => {
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      errors: [],
      ...log,
    }
    set((state) => ({ importExportLogs: [newLog, ...state.importExportLogs] }))
  },

  /* Patient CRUD */
  setPatients: (patients) => set({ patients: Array.isArray(patients) ? patients : [] }),
  addPatient: async (patientData) => {
    if (!patientData) return
    if (patientData.id && !String(patientData.id).startsWith('p_')) {
      set((state) => {
        const list = state.patients || []
        const exists = list.some(p => p && p.id === patientData.id)
        if (exists) return { patients: list }
        return { patients: [patientData, ...list] }
      })
      return patientData
    }
    try {
      const payload = {
        fullName: patientData.fullName || patientData.name || 'New Client',
        email: patientData.email || null,
        phone: patientData.phone || null,
        dob: patientData.dob || null,
        gender: patientData.gender || 'Other',
        status: patientData.status || 'Active'
      }
      const res = await api.post('/api/clinic-admin/patients', payload)
      if (res?.data?.success && res.data.data) {
        const created = {
          ...res.data.data,
          name: res.data.data.fullName || res.data.data.name
        }
        set((state) => ({ patients: [created, ...(state.patients || []).filter(p => p.id !== created.id)] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error saving patient to DB:', err?.message)
    }
    const fallback = {
      id: `p_${Date.now()}`,
      sessionsUsed: 0,
      sessionsAllocated: 10,
      status: 'active',
      tags: [],
      diagnosis: [],
      alerts: '',
      ...patientData,
    }
    set((state) => ({ patients: [fallback, ...(state.patients || [])] }))
    return fallback
  },
  updatePatient: (updatedPatient) => {
    set((state) => ({
      patients: state.patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
    }))
  },
  deletePatient: (patientId) => {
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== patientId),
      appointments: state.appointments.filter((a) => a.patientId !== patientId),
    }))
  },

  /* Waitlist Actions */
  setWaitlist: (waitlist) => set({ waitlist: Array.isArray(waitlist) ? waitlist : [] }),
  addToWaitlist: (entry) => {
    set((state) => ({ waitlist: [entry, ...(state.waitlist || [])] }))
  },
  updateWaitlistStatus: (id, status) => {
    set((state) => ({
      waitlist: (state.waitlist || []).map((w) => (w && w.id === id ? { ...w, status } : w)),
    }))
  },
  removeFromWaitlist: (id) => {
    set((state) => ({
      waitlist: (state.waitlist || []).filter((w) => w && w.id !== id),
    }))
  },


  /* Contacts Actions */
  setContacts: (contacts) => set({ contacts: Array.isArray(contacts) ? contacts : [] }),
  fetchContacts: async () => {
    try {
      const res = await api.get('/api/clinic-admin/contacts')
      if (res?.data?.success && Array.isArray(res.data.data)) {
        set({ contacts: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching contacts from DB:', err?.message)
    }
  },
  addContact: async (contactData) => {
    if (!contactData) return
    // If object is already created in backend (has real UUID id), update store state directly without 2nd POST request
    if (contactData.id && !String(contactData.id).startsWith('cnt_')) {
      set((state) => {
        const list = state.contacts || []
        const exists = list.some(c => c && c.id === contactData.id)
        if (exists) return { contacts: list }
        return { contacts: [contactData, ...list] }
      })
      return contactData
    }
    try {
      const res = await api.post('/api/clinic-admin/contacts', contactData)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => {
          const list = state.contacts || []
          const exists = list.some(c => c && c.id === created.id)
          if (exists) return { contacts: list }
          return { contacts: [created, ...list] }
        })
        return created
      }
    } catch (err) {
      console.error('❌ Error saving contact to DB:', err?.message)
    }
    const fallback = { id: `cnt_${Date.now()}`, ...contactData }
    set((state) => ({ contacts: [fallback, ...(state.contacts || [])] }))
    return fallback
  },
  updateContact: (updatedContact) => {
    set((state) => ({
      contacts: (state.contacts || []).map((c) => (c && c.id === updatedContact?.id ? updatedContact : c)),
    }))
  },
  deleteContact: (id) => {
    set((state) => ({
      contacts: (state.contacts || []).filter((c) => c && c.id !== id),
    }))
  },


  /* Invoice management Actions */
  setInvoices: (invoices) => set({ invoices: Array.isArray(invoices) ? invoices : [] }),
  fetchInvoices: async () => {
    try {
      const res = await api.get('/api/practitioner/invoices')
      if (res?.data?.success) {
        set({ invoices: res.data.data })
      }
    } catch (err) {
      console.error('❌ Error fetching invoices:', err?.message)
    }
  },
  addInvoice: async (invoice) => {
    try {
      const res = await api.post('/api/practitioner/invoices', invoice)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ invoices: [created, ...(state.invoices || [])] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error creating invoice:', err?.message)
    }
    // Fallback if API fails
    set((state) => ({ invoices: [invoice, ...(state.invoices || [])] }))
  },
  updateInvoiceStatus: async (id, status, dueVal) => {
    try {
      const res = await api.put(`/api/practitioner/invoices/${id}`, { status, due: dueVal })
      if (res?.data?.success) {
        const updated = res.data.data
        set((state) => ({
          invoices: (state.invoices || []).map((inv) => (inv.id === id ? updated : inv)),
        }))
        return updated
      }
    } catch (err) {
      console.error('❌ Error updating invoice:', err?.message)
    }
    // Fallback
    set((state) => ({
      invoices: (state.invoices || []).map((inv) =>
        inv.id === id ? { ...inv, status, due: dueVal !== undefined ? dueVal : inv.due } : inv
      ),
    }))
  },
  updateInvoice: async (updatedInv) => {
    try {
      const res = await api.put(`/api/practitioner/invoices/${updatedInv.id}`, updatedInv)
      if (res?.data?.success) {
        const updated = res.data.data
        set((state) => ({
          invoices: (state.invoices || []).map((inv) => (inv.id === updatedInv.id ? updated : inv)),
        }))
        return updated
      }
    } catch (err) {
      console.error('❌ Error updating invoice:', err?.message)
    }
    // Fallback
    set((state) => ({
      invoices: (state.invoices || []).map((inv) => (inv.id === updatedInv.id ? { ...inv, ...updatedInv } : inv)),
    }))
  },
  deleteInvoice: async (id) => {
    try {
      await api.delete(`/api/practitioner/invoices/${id}`)
    } catch (err) {
      console.error('❌ Error deleting invoice:', err?.message)
    }
    set((state) => ({ invoices: (state.invoices || []).filter((inv) => inv.id !== id) }))
  },


  /* Documents Actions */
  setAddDocModalOpen: (isOpen) => set({ addDocModalOpen: isOpen }),
  setSalesLeadModalOpen: (isOpen) => set({ salesLeadModalOpen: isOpen }),
  setSalesDemoModalOpen: (isOpen) => set({ salesDemoModalOpen: isOpen }),
  setSalesTaskModalOpen: (isOpen) => set({ salesTaskModalOpen: isOpen }),
  setSalesProposalModalOpen: (isOpen) => set({ salesProposalModalOpen: isOpen }),
  setSalesConvertModalOpen: (isOpen) => set({ salesConvertModalOpen: isOpen }),
  setSalesSelectedLeadId: (id) => set({ salesSelectedLeadId: id }),

  addDocument: async (doc) => {
    try {
      const role = (get().userRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : '') || '').toLowerCase()
      const isPatient = role === 'patient' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/patient'))
      const endpoint = isPatient ? '/api/patient/documents' : (role === 'practitioner' ? '/api/practitioner/documents' : '/api/clinic-admin/documents')
      const res = await api.post(endpoint, doc)
      if (res?.data?.success && res.data.data) {
        const created = res.data.data
        set((state) => ({ documents: [created, ...(state.documents || []).filter(d => d.id !== created.id)] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error saving document to DB:', err?.message)
    }
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: doc.name || 'Docname.doc',
      date: doc.date || dayjs().format('D MMM YYYY'),
      uploadBy: doc.uploadBy || 'Admin',
      ...doc,
    }
    set((state) => ({ documents: [newDoc, ...(state.documents || []).filter(d => d.id !== newDoc.id)] }))
    return newDoc
  },
  updateDocument: (updatedDoc) => {
    set((state) => ({
      documents: state.documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)),
    }))
  },
  deleteDocument: (id) => {
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }))
  },

  /* Appointment Actions */
  fetchAppointments: async (params = {}) => {
    try {
      const role = (get().userRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : '') || '').toLowerCase()
      if (role === 'sales' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/sales'))) {
        // Sales executive uses sales calendar events (/api/sales/calendar), skip clinic-admin appointments call
        return
      }
      const isPatient = role === 'patient' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/patient'))
      const endpoint = isPatient ? '/api/patient/appointments' : role === 'practitioner' ? '/api/practitioner/appointments' : '/api/clinic-admin/appointments'
      const res = await api.get(endpoint, { params })
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const normalized = res.data.data.map(a => {
          let tObj = a.travel || a.travelDetails || null
          if (typeof tObj === 'string') {
            try { tObj = JSON.parse(tObj) } catch (e) {}
          }
          return {
            ...a,
            time: a.time || a.startTime || '09:00',
            startTime: a.startTime || a.time || '09:00',
            patientName: a.patientName || a.clientName || 'Client',
            travel: tObj,
            travelDetails: tObj,
          }
        })
        set({ appointments: normalized })
        return normalized
      }
    } catch (err) {
      console.error('❌ Error fetching appointments from DB:', err?.response?.status, err?.message)
    }
  },
  addAppointment: async (appointment) => {
    let tObj = appointment.travel || appointment.travelDetails || null
    if (typeof tObj === 'string') {
      try { tObj = JSON.parse(tObj) } catch (e) {}
    }
    try {
      const role = (get().userRole || '').toLowerCase()
      const isPatient = role === 'patient' || window.location.pathname.startsWith('/patient')
      const endpoint = isPatient ? '/api/patient/appointments' : role === 'practitioner' ? '/api/practitioner/appointments' : '/api/clinic-admin/appointments'
      const res = await api.post(endpoint, appointment)
      if (res?.data?.success && res.data.data) {
        const created = res.data.data
        let retTravel = created.travel || created.travelDetails || tObj
        if (typeof retTravel === 'string') {
          try { retTravel = JSON.parse(retTravel) } catch (e) {}
        }
        const normalized = {
          ...created,
          time: created.time || created.startTime || appointment.time || '09:00',
          startTime: created.startTime || created.time || appointment.startTime || '09:00',
          patientName: created.patientName || created.clientName || appointment.patientName || 'Client',
          travel: retTravel,
          travelDetails: retTravel,
        }
        set((state) => ({ appointments: [normalized, ...(state.appointments || []).filter(a => a.id !== normalized.id)] }))
        return normalized
      }
    } catch (err) {
      console.error('❌ Error saving appointment to DB:', err?.response?.status, err?.message)
    }
    const newAppt = {
      id: `a_${Date.now()}`,
      location: 'Melbourne Clinic',
      room: 'Room A',
      ...appointment,
      travel: tObj,
      travelDetails: tObj,
    }
    set((state) => ({ appointments: [newAppt, ...(state.appointments || []).filter(a => a.id !== newAppt.id)] }))
    return newAppt
  },
  updateAppointment: async (updated) => {
    let tObj = updated.travel || updated.travelDetails || null
    if (typeof tObj === 'string') {
      try { tObj = JSON.parse(tObj) } catch (e) {}
    }
    const normalized = {
      ...updated,
      time: updated.time || updated.startTime || '09:00',
      startTime: updated.startTime || updated.time || '09:00',
      travel: tObj,
      travelDetails: tObj,
    }
    try {
      if (updated.id && !String(updated.id).startsWith('a_')) {
        const role = (get().userRole || '').toLowerCase()
        const isPatient = role === 'patient' || window.location.pathname.startsWith('/patient')
        const endpoint = isPatient ? `/api/patient/appointments/${updated.id}/reschedule` : role === 'practitioner' ? `/api/practitioner/appointments/${updated.id}` : `/api/clinic-admin/appointments/${updated.id}`
        await api.put(endpoint, normalized)
      }
    } catch (err) {
      console.error('❌ Error updating appointment in DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      appointments: (state.appointments || []).map((a) => (a.id === updated.id ? { ...a, ...normalized } : a)),
    }))
  },
  deleteAppointment: async (id) => {
    try {
      if (id && !String(id).startsWith('a_')) {
        const role = (get().userRole || '').toLowerCase()
        const isPatient = role === 'patient' || window.location.pathname.startsWith('/patient')
        if (isPatient) {
          await api.put(`/api/patient/appointments/${id}/cancel`)
        } else {
          const endpoint = role === 'practitioner' ? `/api/practitioner/appointments/${id}` : `/api/clinic-admin/appointments/${id}`
          await api.delete(endpoint)
        }
      }
    } catch (err) {
      console.error('❌ Error deleting appointment from DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      appointments: (state.appointments || []).filter((a) => a.id !== id),
    }))
  },

  /* Consultations / Clinical Notes State */
  consultations: [],
  setConsultations: (consultations) => set({ consultations: Array.isArray(consultations) ? consultations : [] }),
  fetchConsultations: async (params = {}) => {
    try {
      const res = await api.get('/api/practitioner/consultations', { params })
      if (res?.data?.success && Array.isArray(res.data.data)) {
        set({ consultations: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching consultations from DB:', err?.message)
    }
  },
  addConsultation: async (note) => {
    try {
      const res = await api.post('/api/practitioner/consultations', note)
      if (res?.data?.success && res.data.data) {
        const created = res.data.data
        set((state) => ({ consultations: [created, ...(state.consultations || []).filter(c => c.id !== created.id)] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error saving consultation to DB:', err?.message)
    }
    const newNote = { id: `cn_${Date.now()}`, date: new Date().toISOString().split('T')[0], ...note }
    set((state) => ({ consultations: [newNote, ...(state.consultations || []).filter(c => c.id !== newNote.id)] }))
    return newNote
  },
  updateConsultation: async (id, updated) => {
    try {
      if (id && !String(id).startsWith('cn_')) {
        await api.put(`/api/practitioner/consultations/${id}`, updated)
      }
    } catch (err) {
      console.error('❌ Error updating consultation in DB:', err?.message)
    }
    set((state) => ({
      consultations: (state.consultations || []).map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }))
  },

  /* Subscription State */
  subscription: {
    plan: 'Growth',
    billingCycle: 'Monthly',
    mrr: 349,
    smsCredits: { total: 500, used: 0 },
    planLimits: {
      Starter: { price: 199, smsCredits: 200 },
      Growth: { price: 349, smsCredits: 500 },
      Enterprise: { price: 799, smsCredits: 1500 },
    },
    billingHistory: [],
  },
  updateSubscription: (data) => {
    set((state) => ({ subscription: { ...state.subscription, ...data } }))
  },
  updateSmsCredits: (used) => {
    set((state) => ({
      subscription: {
        ...state.subscription,
        smsCredits: { ...state.subscription.smsCredits, used },
      },
    }))
  },
  upgradePlan: (plan) => {
    const planLimits = get().subscription.planLimits
    const limits = planLimits[plan] || {}
    set((state) => ({
      subscription: {
        ...state.subscription,
        plan,
        mrr: limits.price || state.subscription.mrr,
      },
    }))
  },

  /* AI Notes State */
  aiNotes: {
    plan: 'Growth',
    limits: {
      Starter: { monthlyGenerations: 50, tokensPerNote: 500, historyDays: 7 },
      Growth: { monthlyGenerations: 300, tokensPerNote: 1500, historyDays: 30 },
      Enterprise: { monthlyGenerations: -1, tokensPerNote: 4000, historyDays: -1 },
    },
    usage: { generationsUsed: 0, tokensUsed: 0, resetDate: '2026-07-01' },
    analyticsHistory: [],
    topTemplates: [],
    restrictionEnabled: true,
    warningThreshold: 80,
  },
  updateAiNotesUsage: (data) => {
    set((state) => ({ aiNotes: { ...state.aiNotes, usage: { ...state.aiNotes.usage, ...data } } }))
  },
  setAiNotesPlan: (plan) => {
    set((state) => ({ aiNotes: { ...state.aiNotes, plan } }))
  },

  /* Multi-tenant Workspace Controls */
  tenants: [],
  addTenant: (tenant) => {
    const newTenant = {
      id: `tn_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Trial',
      quotas: { practitioners: 3, patients: 100, storage: 2, branches: 1 },
      usage: { practitioners: 0, patients: 0, storage: 0, branches: 0 },
      ...tenant,
    }
    set((state) => ({ tenants: [...state.tenants, newTenant] }))
  },
  editTenant: (updated) => {
    set((state) => ({ tenants: state.tenants.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) }))
  },
  deleteTenant: (id) => {
    set((state) => ({ tenants: state.tenants.filter((t) => t.id !== id) }))
  },
  setTenantStatus: (id, status) => {
    set((state) => ({ tenants: state.tenants.map((t) => (t.id === id ? { ...t, status } : t)) }))
  },

  /* Custom Payment Terms */
  paymentTerms: [
    { id: 'pt1', name: 'Immediate', days: 0, isDefault: false, description: 'Payment due immediately upon receipt.' },
    { id: 'pt2', name: 'Net 7', days: 7, isDefault: true, description: 'Payment due within 7 days of invoice date.' },
    { id: 'pt3', name: 'Net 14', days: 14, isDefault: false, description: 'Payment due within 14 days of invoice date.' },
    { id: 'pt4', name: 'Net 30', days: 30, isDefault: false, description: 'Payment due within 30 days of invoice date.' },
  ],
  addPaymentTerm: (term) => {
    const newTerm = { id: `pt_${Date.now()}`, isDefault: false, ...term }
    set((state) => ({ paymentTerms: [...state.paymentTerms, newTerm] }))
  },
  editPaymentTerm: (updated) => {
    set((state) => ({ paymentTerms: state.paymentTerms.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)) }))
  },
  deletePaymentTerm: (id) => {
    set((state) => ({ paymentTerms: state.paymentTerms.filter((p) => p.id !== id) }))
  },
  setDefaultPaymentTerm: (id) => {
    set((state) => ({
      paymentTerms: state.paymentTerms.map((p) => ({ ...p, isDefault: p.id === id })),
    }))
  },

  /* Template Management */
  allTemplates: [],
  addTemplate: (template) => {
    const newT = {
      id: `tmpl_${Date.now()}`,
      lastModified: new Date().toISOString().split('T')[0],
      status: 'Active',
      ...template,
    }
    set((state) => ({ allTemplates: [newT, ...state.allTemplates] }))
  },
  editTemplate: (updated) => {
    set((state) => ({
      allTemplates: state.allTemplates.map((t) =>
        t.id === updated.id ? { ...t, ...updated, lastModified: new Date().toISOString().split('T')[0] } : t
      ),
    }))
  },
  deleteTemplate: (id) => {
    set((state) => ({ allTemplates: state.allTemplates.filter((t) => t.id !== id) }))
  },
  cloneTemplate: (id) => {
    const state = get()
    const original = state.allTemplates.find((t) => t.id === id)
    if (!original) return
    const clone = {
      ...original,
      id: `tmpl_${Date.now()}`,
      name: `${original.name} (Copy)`,
      lastModified: new Date().toISOString().split('T')[0],
    }
    set((s) => ({ allTemplates: [clone, ...s.allTemplates] }))
  },
  archiveTemplate: (id) => {
    set((state) => ({
      allTemplates: state.allTemplates.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Archived' ? 'Active' : 'Archived' } : t
      ),
    }))
  },

  /* Sales CRM State */
  clinics: [],
  setClinics: (clinicsList) => set({ clinics: clinicsList }),
  salesList: [],
  leads: [],
  salesTasks: [],
  salesCalendarEvents: [],
  salesMessages: [],
  salesProfile: null,

  /* Sales Profile Live API */
  fetchSalesProfile: async () => {
    try {
      const res = await api.get('/api/sales/profile')
      if (res?.data?.success) {
        set({ salesProfile: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching sales profile:', err?.response?.status, err?.message)
    }
  },

  updateSalesProfile: async (data) => {
    try {
      const res = await api.put('/api/sales/profile', data)
      if (res?.data?.success) {
        set({ salesProfile: res.data.data })
        return { success: true, data: res.data.data }
      }
      return { success: false, message: res?.data?.message || 'Update failed' }
    } catch (err) {
      console.error('❌ Error updating sales profile:', err?.response?.status, err?.message)
      return { success: false, message: err?.response?.data?.message || 'Update failed' }
    }
  },

  changeSalesPassword: async ({ currentPassword, newPassword }) => {
    try {
      const res = await api.put('/api/sales/profile/password', { currentPassword, newPassword })
      if (res?.data?.success) {
        return { success: true }
      }
      return { success: false, message: res?.data?.message || 'Password change failed' }
    } catch (err) {
      console.error('❌ Error changing sales password:', err?.response?.status, err?.message)
      const msg = err?.response?.data?.message || 'Password change failed'
      return { success: false, message: msg }
    }
  },

  fetchLeads: async () => {
    if (get()._leadsFetchingPromise) return get()._leadsFetchingPromise
    const promise = (async () => {
      try {
        const res = await api.get('/api/sales/leads')
        if (res?.data?.success) {
          set({ leads: res.data.data })
          return res.data.data
        }
      } catch (err) {
        console.error('❌ Failed to fetch /api/sales/leads:', err?.response?.status, err?.response?.data || err.message)
        // Fallback try
        try {
          const fallback = await api.get('/api/super-admin/sales-leads')
          if (fallback?.data?.success) {
            set({ leads: fallback.data.data })
            return fallback.data.data
          }
        } catch (fbErr) {
          console.error('❌ Fallback /api/super-admin/sales-leads error:', fbErr?.response?.status, fbErr?.message)
        }
      } finally {
        set({ _leadsFetchingPromise: null })
      }
    })()
    set({ _leadsFetchingPromise: promise })
    return promise
  },

  addLead: async (lead) => {
    try {
      const payload = {
        name: lead.name || lead.companyName,
        contactPerson: lead.contactPerson,
        contact: lead.contact || lead.phone,
        email: lead.email,
        location: lead.location || lead.territory,
        value: lead.value,
        stage: lead.stage || 'New Lead',
        notes: lead.notes,
        source: lead.source || 'Web Form',
      }
      console.log('📡 POSTing new lead to /api/sales/leads:', payload)
      const res = await api.post('/api/sales/leads', payload)
      if (res?.data?.success) {
        const created = res.data.data
        console.log('✅ Lead created in MySQL database:', created)
        set((state) => ({ leads: [created, ...state.leads] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error adding lead to DB:', err?.response?.status, err?.response?.data || err.message)
    }
    const newLead = {
      id: `lead_${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0],
      history: [{ time: new Date().toLocaleString(), text: 'Lead registered.' }],
      notes: '',
      ...lead,
    }
    set((state) => ({ leads: [newLead, ...state.leads] }))
    return newLead
  },

  updateLead: async (updated) => {
    try {
      if (updated.id && !String(updated.id).startsWith('lead_')) {
        console.log(`📡 PUT updating lead ${updated.id} in DB...`)
        const res = await api.put(`/api/sales/leads/${updated.id}`, updated)
        console.log('✅ Lead updated in DB:', res?.data)
      }
    } catch (err) {
      console.error('❌ Error updating lead in DB:', err?.response?.status, err?.response?.data || err.message)
    }
    set((state) => ({
      leads: state.leads.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)),
    }))
  },

  deleteLead: async (id) => {
    try {
      if (id && !String(id).startsWith('lead_')) {
        console.log(`📡 DELETE deleting lead ${id} from DB...`)
        const res = await api.delete(`/api/sales/leads/${id}`)
        console.log('✅ Lead deleted from DB:', res?.data)
      }
    } catch (err) {
      console.error('❌ Error deleting lead from DB:', err?.response?.status, err?.response?.data || err.message)
    }
    set((state) => ({ leads: state.leads.filter((l) => l.id !== id) }))
  },

  moveLeadStage: async (id, newStage) => {
    try {
      if (id && !String(id).startsWith('lead_')) {
        console.log(`📡 PATCH stage update for lead ${id} to ${newStage}...`)
        const res = await api.patch(`/api/sales/leads/${id}/status`, { stage: newStage, status: newStage })
        console.log('✅ Stage updated in DB:', res?.data)
      }
    } catch (err) {
      console.error('❌ Error moving lead stage in DB:', err?.response?.status, err?.response?.data || err.message)
    }
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id === id) {
          const oldStage = l.stage
          return {
            ...l,
            stage: newStage,
            history: [
              ...(l.history || []),
              { time: new Date().toLocaleString(), text: `Moved stage from "${oldStage}" to "${newStage}"` },
            ],
          }
        }
        return l
      }),
    }))
  },
  addLeadActivity: async (leadId, activityText) => {
    try {
      if (leadId && !String(leadId).startsWith('lead_')) {
        const res = await api.post(`/api/sales/leads/${leadId}/activity`, { text: activityText })
        if (res?.data?.success) {
          const updated = res.data.data
          set((state) => ({
            leads: state.leads.map((l) => (l.id === leadId ? updated : l)),
          }))
          return updated
        }
      }
    } catch (err) {
      console.error('❌ Error saving lead activity to DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            history: [...(l.history || []), { time: new Date().toLocaleString(), text: activityText }],
          }
        }
        return l
      }),
    }))
  },
  convertLeadToClinic: async (leadId, tier, value, salesperson) => {
    try {
      if (leadId && !String(leadId).startsWith('lead_')) {
        const res = await api.post('/api/sales/clinics/convert', { leadId, tier, value, salesperson })
        if (res?.data?.success) {
          const { clinic, lead } = res.data.data
          set((state) => ({
            clinics: [clinic, ...state.clinics],
            leads: state.leads.map(l => l.id === leadId ? lead : l)
          }))
          return { success: true, data: res.data.data }
        }
      }
    } catch (err) {
      console.error('❌ Error converting lead to clinic in DB:', err?.response?.status, err?.message)
      return { success: false, message: err?.response?.data?.message || 'Conversion failed' }
    }
  },

  /* Sales Tasks Live API */
  fetchSalesTasks: async () => {
    try {
      const res = await api.get('/api/sales/tasks')
      if (res?.data?.success) {
        set({ salesTasks: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching sales tasks:', err?.response?.status, err?.message)
    }
  },
  addSalesTask: async (task) => {
    try {
      const res = await api.post('/api/sales/tasks', task)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ salesTasks: [created, ...state.salesTasks] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error adding sales task to DB:', err?.response?.status, err?.message)
    }
    const newTask = { id: `task_${Date.now()}`, status: 'Pending', ...task }
    set((state) => ({ salesTasks: [...state.salesTasks, newTask] }))
    return newTask
  },
  updateSalesTask: async (id, updates) => {
    try {
      if (id && !String(id).startsWith('task_')) {
        await api.put(`/api/sales/tasks/${id}`, updates)
      }
    } catch (err) {
      console.error('❌ Error updating sales task in DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      salesTasks: state.salesTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },
  deleteSalesTask: async (id) => {
    try {
      if (id && !String(id).startsWith('task_')) {
        await api.delete(`/api/sales/tasks/${id}`)
      }
    } catch (err) {
      console.error('❌ Error deleting sales task from DB:', err?.response?.status, err?.message)
    }
    set((state) => ({ salesTasks: state.salesTasks.filter((t) => t.id !== id) }))
  },

  /* Sales Calendar Events Live API */
  fetchSalesCalendarEvents: async () => {
    try {
      const res = await api.get('/api/sales/calendar-events')
      if (res?.data?.success) {
        set({ salesCalendarEvents: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching sales calendar events:', err?.response?.status, err?.message)
    }
  },
  addSalesCalendarEvent: async (evt) => {
    try {
      const res = await api.post('/api/sales/calendar-events', evt)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ salesCalendarEvents: [created, ...state.salesCalendarEvents] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error adding sales calendar event to DB:', err?.response?.status, err?.message)
    }
    const newEvt = { id: `evt_${Date.now()}`, ...evt }
    set((state) => ({ salesCalendarEvents: [...state.salesCalendarEvents, newEvt] }))
    return newEvt
  },

  /* Sales Messages Live API */
  fetchSalesMessages: async () => {
    try {
      const res = await api.get('/api/sales/messages')
      if (res?.data?.success) {
        set({ salesMessages: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching sales messages:', err?.response?.status, err?.message)
    }
  },
  addSalesMessage: async (msg) => {
    try {
      const res = await api.post('/api/sales/messages', msg)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ salesMessages: [...state.salesMessages, created] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error sending sales message to DB:', err?.response?.status, err?.message)
    }
    const newMsg = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...msg,
    }
    set((state) => ({ salesMessages: [...state.salesMessages, newMsg] }))
  },

  /* Sales Commissions Live API */
  salesCommissions: [],
  fetchCommissions: async () => {
    try {
      const res = await api.get('/api/sales/commissions')
      if (res?.data?.success) {
        set({ salesCommissions: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching sales commissions:', err?.response?.status, err?.message)
    }
  },
  requestCommissionPayout: async (clinicId, clinicName, amount) => {
    try {
      const res = await api.post('/api/sales/commissions/request', { clinicId, clinicName, amount })
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ salesCommissions: [created, ...state.salesCommissions] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error requesting commission payout:', err?.response?.status, err?.message)
    }
  },

  /* Sales Clinics Live API */
  fetchSalesClinics: async () => {
    try {
      const res = await api.get('/api/sales/clinics')
      if (res?.data?.success) {
        set({ clinics: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching sales clinics:', err?.response?.status, err?.message)
    }
  },
  setClinicStatus: (clinicId, status) => {
    set((state) => ({
      clinics: state.clinics.map((c) => (c.id === clinicId ? { ...c, status } : c)),
    }))
  },
  addClinic: (newClinic) => {
    set((state) => ({ clinics: [newClinic, ...state.clinics] }))
  },
  editClinic: async (updated) => {
    try {
      if (updated.id && !String(updated.id).startsWith('clinic_')) {
        await api.put(`/api/sales/clinics/${updated.id}`, updated)
      }
    } catch (err) {
      console.error('❌ Error updating clinic in DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      clinics: state.clinics.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    }))
  },
  updateClinicOnboarding: async (clinicId, steps) => {
    // Optimistic UI update
    set((state) => ({
      clinics: state.clinics.map((c) => (c.id === clinicId ? { ...c, onboardingSteps: steps } : c)),
    }))
    try {
      if (clinicId && !String(clinicId).startsWith('clinic_')) {
        await api.put(`/api/sales/clinics/${clinicId}`, { onboardingSteps: steps })
      }
    } catch (err) {
      console.error('❌ Error updating onboarding steps in DB:', err?.response?.status, err?.message)
    }
  },
  deleteClinic: async (id) => {
    try {
      if (id && !String(id).startsWith('clinic_')) {
        await api.delete(`/api/sales/clinics/${id}`)
      }
    } catch (err) {
      console.error('❌ Error deleting clinic from DB:', err?.response?.status, err?.message)
    }
    set((state) => ({ clinics: state.clinics.filter((c) => c.id !== id) }))
  },
  setSalesList: (newList) => {
    set({ salesList: newList })
  },

  /* Practitioner Workspace State */
  simulatedSpecialty: undefined,
  setSimulatedSpecialty: (spec) => set({ simulatedSpecialty: spec }),
  getActiveSpecialty: () => {
    const simulated = get().simulatedSpecialty
    if (simulated) return simulated

    try {
      const storedSpec = typeof window !== 'undefined' ? localStorage.getItem('practitionerSpecialty') : null
      if (storedSpec) return storedSpec
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (uStr) {
        const u = JSON.parse(uStr)
        if (u.specialty) return u.specialty
      }
    } catch (_) {}

    const uId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    const uEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null
    const practitioners = get().practitioners || []
    const matchedPrac = practitioners.find(p => (uId && p.id === uId) || (uEmail && p.email?.toLowerCase() === uEmail?.toLowerCase()))
    if (matchedPrac?.specialty) return matchedPrac.specialty

    const appts = get().appointments || []
    const apptWithSpec = appts.find(a => a.specialty || a.practitionerSpecialty)
    if (apptWithSpec?.specialty) return apptWithSpec.specialty
    if (apptWithSpec?.practitionerSpecialty) return apptWithSpec.practitionerSpecialty

    if (practitioners.length > 0 && practitioners[0]?.specialty) {
      return practitioners[0].specialty
    }

    return 'Physiotherapist'
  },
  practitionerBillingEnabled: true,
  setPractitionerBillingEnabled: (enabled) => set({ practitionerBillingEnabled: enabled }),

  /* Consultations */
  consultations: [],
  fetchConsultations: async (patientId) => {
    try {
      const res = await api.get('/api/practitioner/consultations', { params: patientId ? { patientId } : {} })
      if (res?.data?.success && Array.isArray(res.data.data)) {
        set({ consultations: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching consultations from DB:', err?.response?.status, err?.message)
    }
  },
  addConsultation: async (cons) => {
    try {
      const res = await api.post('/api/practitioner/consultations', cons)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ consultations: [created, ...state.consultations] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error saving consultation note to DB:', err?.response?.status, err?.message)
    }
    const fallback = { id: `cons_${Date.now()}`, date: new Date().toISOString().split('T')[0], status: 'Draft', ...cons }
    set((state) => ({ consultations: [fallback, ...state.consultations] }))
    return fallback
  },
  updateConsultation: async (id, updated) => {
    try {
      const res = await api.put(`/api/practitioner/consultations/${id}`, updated)
      if (res?.data?.success) {
        const updatedData = res.data.data
        set((state) => ({
          consultations: state.consultations.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
        }))
        return updatedData
      }
    } catch (err) {
      console.error('❌ Error updating consultation note in DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      consultations: state.consultations.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }))
  },
  deleteConsultation: async (id) => {
    try {
      await api.delete(`/api/practitioner/consultations/${id}`)
    } catch (err) {
      console.error('❌ Error deleting consultation note from DB:', err?.response?.status, err?.message)
    }
    set((state) => ({
      consultations: state.consultations.filter((c) => c.id !== id),
    }))
  },

  /* Prescribed Exercises */
  prescribedExercises: [],
  fetchPrescribedExercises: async () => {
    try {
      const res = await api.get('/api/practitioner/exercises')
      if (res?.data?.success && Array.isArray(res.data.data)) {
        set({ prescribedExercises: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching prescribed exercises from DB:', err?.message)
    }
  },
  addPrescribedExercise: async (prog) => {
    try {
      const res = await api.post('/api/practitioner/exercises', prog)
      if (res?.data?.success) {
        const created = res.data.data
        set((state) => ({ prescribedExercises: [created, ...state.prescribedExercises] }))
        return created
      }
    } catch (err) {
      console.error('❌ Error saving prescribed exercise to DB:', err?.message)
    }
    const fallback = { id: `ex_${Date.now()}`, date: new Date().toISOString().split('T')[0], compliance: { viewed: false, started: false, completed: false }, ...prog }
    set((state) => ({ prescribedExercises: [fallback, ...state.prescribedExercises] }))
    return fallback
  },
  updatePrescribedExerciseCompliance: async (id, compliance) => {
    try {
      await api.put(`/api/practitioner/exercises/${id}/compliance`, { compliance })
    } catch (err) {
      console.error('❌ Error updating exercise compliance in DB:', err?.message)
    }
    set((state) => ({
      prescribedExercises: state.prescribedExercises.map((e) =>
        e.id === id ? { ...e, compliance: { ...e.compliance, ...compliance } } : e
      ),
    }))
  },
  updatePrescribedExercise: async (id, updated) => {
    try {
      const res = await api.put(`/api/practitioner/exercises/${id}`, updated)
      if (res?.data?.success) {
        const updatedData = res.data.data
        set((state) => ({
          prescribedExercises: state.prescribedExercises.map((e) => (e.id === id ? { ...e, ...updatedData } : e))
        }))
        return updatedData
      }
    } catch (err) {
      console.error('❌ Error updating prescribed exercise in DB:', err?.message)
    }
    set((state) => ({
      prescribedExercises: state.prescribedExercises.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    }))
  },
  deletePrescribedExercise: async (id) => {
    try {
      await api.delete(`/api/practitioner/exercises/${id}`)
    } catch (err) {
      console.error('❌ Error deleting prescribed exercise from DB:', err?.message)
    }
    set((state) => ({
      prescribedExercises: state.prescribedExercises.filter((e) => e.id !== id),
    }))
  },

  /* Referrals */
  referrals: [],
  addReferral: (ref) =>
    set((state) => ({
      referrals: [{ id: `ref_${Date.now()}`, date: new Date().toISOString().split('T')[0], status: 'Draft', ...ref }, ...state.referrals],
    })),
  updateReferral: (id, updated) =>
    set((state) => ({
      referrals: state.referrals.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    })),

  /* Practitioner Tasks */
  tasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [{ id: `t_${Date.now()}`, status: 'Pending', ...task }, ...state.tasks],
    })),
  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  /* Communication Messages */
  messages: { internal: [], patient: [] },
  addMessage: (type, msg) =>
    set((state) => {
      const list = state.messages[type] || []
      return {
        messages: {
          ...state.messages,
          [type]: [...list, { timestamp: 'Just now', ...msg }],
        },
      }
    }),

  /* Documents & Reports */
  documents: [],
  fetchDocuments: async () => {
    try {
      const role = (get().userRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : '') || '').toLowerCase()
      const isPatient = role === 'patient' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/patient'))
      const endpoint = isPatient ? '/api/patient/documents' : (role === 'practitioner' ? '/api/practitioner/documents' : '/api/clinic-admin/documents')
      const res = await api.get(endpoint)
      if (res?.data?.success && Array.isArray(res.data.data)) {
        set({ documents: res.data.data })
        return res.data.data
      }
    } catch (err) {
      console.error('❌ Error fetching documents from DB:', err?.message)
    }
  },
}))

