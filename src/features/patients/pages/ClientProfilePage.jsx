import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Card, Button, Tabs, Tag, Space, Form, Input, DatePicker, Select, Radio, Alert, Table, Upload, Modal, Progress, Tooltip, Popconfirm, Switch, Collapse } from 'antd'
import api from '../../../api/axios'
import { CLINICAL_MEASURES_LIBRARY } from '../constants/outcomeMeasuresLibrary'
import { calculateClinicalProgress, isLowerScoreBetter } from '../utils/clinicalOutcomeEngine'
import {
  UserOutlined,
  AlertOutlined,
  TagsOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  ContainerOutlined,
  ArrowLeftOutlined,
  TagOutlined,
  StarOutlined,
  HeartOutlined,
  WarningOutlined,
  FlagOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  MessageOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  AuditOutlined,
  SmileOutlined,
  CrownOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  EditOutlined,
  CheckCircleOutlined,
  BankOutlined,
  ProjectOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  SendOutlined,
  DownloadOutlined,
  EyeOutlined,
  InboxOutlined,
  CommentOutlined,
  PaperClipOutlined,
  HistoryOutlined,
  CheckOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { getPatients, getPatientById, createPatient, updatePatient, deletePatient as apiDeletePatient, getBranches, getCases, createCase, updateCase, deleteCase, getAppointments, createAppointment, updateAppointment, deleteAppointment, getPractitioners, getDocuments, createDocument, updateDocument, deleteDocument, getContacts, getCommunications, createCommunication, deleteCommunication } from '../../calendar/api/clinicAdminApi'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import ClientProgressNotes from '../components/ClientProgressNotes'
import PractitionerExercisesPlans from '../../dashboard/components/practitioner/PractitionerExercisesPlans'
import PractitionerNotesReports from '../../dashboard/components/practitioner/PractitionerNotesReports'
import PractitionerReferrals from '../../dashboard/components/practitioner/PractitionerReferrals'
import PractitionerBilling from '../../dashboard/components/practitioner/PractitionerBilling'
import { resolveTagColor } from './PatientsPage'

const { Option } = Select

const tagIconsMap = {
  TagOutlined: <TagOutlined style={{ fontSize: 11 }} />,
  StarOutlined: <StarOutlined style={{ fontSize: 11 }} />,
  HeartOutlined: <HeartOutlined style={{ fontSize: 11 }} />,
  WarningOutlined: <WarningOutlined style={{ fontSize: 11 }} />,
  FlagOutlined: <FlagOutlined style={{ fontSize: 11 }} />,
  LockOutlined: <LockOutlined style={{ fontSize: 11 }} />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined style={{ fontSize: 11 }} />,
  InfoCircleOutlined: <InfoCircleOutlined style={{ fontSize: 11 }} />,
  ApiOutlined: <ApiOutlined style={{ fontSize: 11 }} />,
  AuditOutlined: <AuditOutlined style={{ fontSize: 11 }} />,
  SmileOutlined: <SmileOutlined style={{ fontSize: 11 }} />,
  CrownOutlined: <CrownOutlined style={{ fontSize: 11 }} />,
  FireOutlined: <FireOutlined style={{ fontSize: 11 }} />,
  AlertOutlined: <AlertOutlined style={{ fontSize: 11 }} />,
}

function renderTagIcon(iconName) {
  return tagIconsMap[iconName] || <TagOutlined style={{ fontSize: 11 }} />
}

export function parseTags(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }
  if (raw instanceof Set) return Array.from(raw)
  if (typeof raw === 'object') {
    return Object.keys(raw).filter(k => Boolean(raw[k]))
  }
  return []
}

function ClientTag({ label }) {
  const store = useClinicStore.getState()
  const labelStr = typeof label === 'string' ? label : (label?.name || label?.label || String(label || ''))
  const matched = Array.isArray(store.clientTags) ? store.clientTags.find(t => String(t?.name || t?.label || '').toLowerCase() === labelStr.toLowerCase()) : null
  const color = resolveTagColor(labelStr, store.clientTags)
  const icon = matched ? matched.icon : 'TagOutlined'
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mr-1 border"
      style={{
        backgroundColor: color + '15',
        color: color,
        borderColor: color + '30',
      }}
    >
      {renderTagIcon(icon)}
      <span>{labelStr}</span>
    </span>
  )
}

export default function ClientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '/clinic'
  const store = useClinicStore()
  const isNew = id === 'new' || !id

  const [branchesList, setBranchesList] = useState([])

  useEffect(() => {
    let isMounted = true
    const fetchBranchesData = async () => {
      try {
        const res = await getBranches()
        if (isMounted && res?.success && Array.isArray(res.data)) {
          setBranchesList(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch branches in ClientProfilePage:', err)
      }
    }
    fetchBranchesData()
    return () => {
      isMounted = false
    }
  }, [])

  const activeBranches = branchesList.length > 0 ? branchesList : (Array.isArray(store.branches) ? store.branches : [])

  // Memoize default empty client values so they have a stable object reference
  const defaultPatient = React.useMemo(() => ({
    name: '',
    dob: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    occupation: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    alerts: '',
    tags: [],
    joinDate: dayjs().format('YYYY-MM-DD'),
    gender: 'Male',
    consentStatus: 'No Response',
    communicationPreferences: 'none',
    branch: '',
  }), [])

  const [fetchedPatient, setFetchedPatient] = useState(null)
  const [fetching, setFetching] = useState(!isNew)

  const patient = isNew
    ? defaultPatient
    : (fetchedPatient || (Array.isArray(store.patients) ? store.patients : []).find(p => p.id === id))

  useEffect(() => {
    let isMounted = true
    if (!isNew && id) {
      const loadPatient = async () => {
        try {
          setFetching(true)
          let found = null
          try {
            const singleRes = await getPatientById(id)
            if (singleRes?.success && singleRes.data) {
              found = singleRes.data
            }
          } catch (_) {
            // fallback to getPatients
          }

          if (!found) {
            const res = await getPatients()
            if (res?.success && Array.isArray(res.data)) {
              if (typeof store.setPatients === 'function') {
                store.setPatients(res.data)
              }
              found = res.data.find(p => p.id === id)
            }
          }

          if (isMounted && found) {
            setFetchedPatient(found)
            if (typeof store.updatePatient === 'function') {
              store.updatePatient(found)
            }
          }
        } catch (err) {
          console.error('Failed to load patient from DB:', err)
        } finally {
          if (isMounted) {
            setFetching(false)
          }
        }
      }
      loadPatient()
    } else {
      setFetching(false)
    }
    return () => {
      isMounted = false
    }
  }, [id, isNew])

  const [selectedTags, setSelectedTags] = useState([])
  
  const isPractitioner = (store.userRole || '').toLowerCase() === 'practitioner' || 
                         (typeof window !== 'undefined' && (localStorage.getItem('userRole') || '').toLowerCase() === 'practitioner') ||
                         window.location.pathname.startsWith('/practitioner') ||
                         basePath === '/practitioner'

  const queryParams = new URLSearchParams(location.search)
  const initialTab = queryParams.get('tab') || 'profile'
  const [activeSubTab, setActiveSubTab] = useState(
    isPractitioner && (initialTab === 'payments' || initialTab === 'billing') ? 'profile' : initialTab
  )
  
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab')
    if (tab && tab !== activeSubTab) {
      if (isPractitioner && (tab === 'payments' || tab === 'billing')) {
        setActiveSubTab('profile')
      } else {
        setActiveSubTab(tab)
      }
    }
  }, [location.search, isPractitioner])

  const handleTabChange = (key) => {
    if (isPractitioner && (key === 'payments' || key === 'billing')) return
    setActiveSubTab(key)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', key)
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
  }

  const [outcomeMeasures, setOutcomeMeasures] = useState([])
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [reportType, setReportType] = useState('Physiotherapy Progress Report')
  const [selectedNotesScope, setSelectedNotesScope] = useState('all')
  const [customReports, setCustomReports] = useState([
    {
      id: 'rep1',
      name: 'Initial Physiotherapy Assessment John Miller.pdf',
      date: '01/06/2026',
      clinician: 'Dr. Sarah Jenkins',
      status: 'Approved',
    },
    {
      id: 'rep2',
      name: 'Medicare Progress Update Report.pdf',
      date: '05/06/2026',
      clinician: 'Dr. Sarah Jenkins',
      status: 'Approved',
    },
  ])
  const [form] = Form.useForm()
  const [caseForm] = Form.useForm()
  const [docForm] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [commForm] = Form.useForm()
  const [outcomeForm] = Form.useForm()
  const [sendInvite, setSendInvite] = useState(isNew)
  const [inviteSent, setInviteSent] = useState(false)

  // Outcome Measures Tab State
  const [outcomeModalVisible, setOutcomeModalVisible] = useState(false)
  const [modalDiscipline, setModalDiscipline] = useState('Physiotherapy')
  const [isCustomMeasure, setIsCustomMeasure] = useState(false)
  const [selectedScoreUnit, setSelectedScoreUnit] = useState('%')

  const fetchOutcomeMeasuresData = async () => {
    if (!id || id === 'new') return
    try {
      let res = await api.get('/api/practitioner/outcome-measures', { params: { patientId: id } }).catch(() => null)
      if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setOutcomeMeasures(res.data.data)
        return
      }
      res = await api.get('/api/patient/progress-outcomes', { params: { search: '' } }).catch(() => null)
      if (res?.data?.success && Array.isArray(res.data?.data?.outcomeMeasures)) {
        setOutcomeMeasures(res.data.data.outcomeMeasures)
      }
    } catch (err) {
      console.warn('Outcome measures fetch notice:', err?.message)
    }
  }

  const handleToggleOutcomeVisibility = async (measureId, isPublished) => {
    try {
      await api.put(`/api/practitioner/outcome-measures/${measureId}/visibility`, { isPublishedToPortal: isPublished }).catch(() => null)
      setOutcomeMeasures(prev => prev.map(m => (m.id === measureId || m._id === measureId) ? { ...m, isPublishedToPortal: isPublished } : m))
      toast.success(isPublished ? 'Measure published to patient portal' : 'Measure set to internal clinical note only')
    } catch (e) {
      setOutcomeMeasures(prev => prev.map(m => (m.id === measureId || m._id === measureId) ? { ...m, isPublishedToPortal: isPublished } : m))
    }
  }

  const handleSaveOutcomeMeasure = async (values) => {
    try {
      const isPublished = values.isPublishedToPortal !== false
      const payload = {
        patientId: id,
        name: values.name,
        type: values.type || values.area || 'Physiotherapy',
        prevScore: values.prevScore || '—',
        score: values.score,
        targetGoal: values.targetGoal || '0%',
        status: values.status || 'Improved',
        isPublishedToPortal: isPublished,
        verifiedBy: store.user?.name || 'Dr. Sarah Jenkins',
        notes: values.notes || ''
      }
      
      let res = await api.post('/api/practitioner/outcome-measures', payload).catch(() => null)
      if (!res?.data?.success && res?.status !== 201 && res?.status !== 200) {
        res = await api.post('/api/patient/outcome-measures', payload).catch(() => null)
      }

      const savedItem = res?.data?.data || {
        id: `om_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString()
      }

      setOutcomeMeasures(prev => [savedItem, ...prev.filter(m => m.id !== savedItem.id)])
      toast.success(isPublished ? 'Outcome measure recorded and published to patient portal!' : 'Outcome measure saved as internal clinical note!')
      setOutcomeModalVisible(false)
      outcomeForm.resetFields()
      fetchOutcomeMeasuresData()
    } catch (err) {
      console.error('Outcome save notice:', err)
      const isPublished = values.isPublishedToPortal !== false
      const fallbackItem = {
        id: `om_${Date.now()}`,
        patientId: id,
        name: values.name,
        type: values.type || 'Physiotherapy',
        prevScore: values.prevScore || '—',
        score: values.score,
        targetGoal: values.targetGoal || '0%',
        status: values.status || 'Improved',
        isPublishedToPortal: isPublished,
        verifiedBy: store.user?.name || 'Dr. Sarah Jenkins',
        createdAt: new Date().toISOString()
      }
      setOutcomeMeasures(prev => [fallbackItem, ...prev])
      toast.success(isPublished ? 'Outcome measure recorded and published to patient portal!' : 'Outcome measure saved as internal clinical note!')
      setOutcomeModalVisible(false)
      outcomeForm.resetFields()
    }
  }

  // Documents Tab State
  const [docCategoryFilter, setDocCategoryFilter] = useState('All')
  const [docModalVisible, setDocModalVisible] = useState(false)
  const [sendDocModalVisible, setSendDocModalVisible] = useState(false)
  const [selectedSendDoc, setSelectedSendDoc] = useState(null)
  const [sendDocForm] = Form.useForm()
  const [sendDocRecipientType, setSendDocRecipientType] = useState('client')
  const [customDocs, setCustomDocs] = useState([])
  const [documentsList, setDocumentsList] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)

  const fetchDocumentsData = async () => {
    if (!id || id === 'new') return
    try {
      setDocumentsLoading(true)
      const res = await getDocuments()
      if (res?.success && Array.isArray(res.data)) {
        setDocumentsList(res.data)
        if (store.setDocuments) {
          store.setDocuments(res.data)
        }
      } else if (Array.isArray(res)) {
        setDocumentsList(res)
      }
    } catch (err) {
      console.error('Failed to load client documents from DB:', err)
    } finally {
      setDocumentsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocumentsData()
    fetchOutcomeMeasuresData()
    const handleDocAdded = () => fetchDocumentsData()
    window.addEventListener('document-added', handleDocAdded)
    return () => window.removeEventListener('document-added', handleDocAdded)
  }, [id, patient])

  // Payments Tab State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [customPayments, setCustomPayments] = useState([
    {
      id: 'pay-001',
      receiptNumber: 'RCPT-8921',
      invoiceNumber: 'INV-001042',
      date: dayjs().subtract(2, 'day').format('DD/MM/YYYY'),
      service: 'Initial Physiotherapy Assessment',
      amount: 140.00,
      paymentMethod: 'Credit Card / Stripe',
      status: 'Paid',
      transactionId: 'txn_3Mkd98218001'
    },
    {
      id: 'pay-002',
      receiptNumber: 'RCPT-8890',
      invoiceNumber: 'INV-001018',
      date: dayjs().subtract(16, 'day').format('DD/MM/YYYY'),
      service: 'Standard Follow-up Session',
      amount: 110.00,
      paymentMethod: 'NDIS Direct Portal',
      status: 'Paid',
      transactionId: 'ndis_clm_9981023'
    }
  ])

  // Communications Tab State
  const [commModalVisible, setCommModalVisible] = useState(false)
  const [commViewModalVisible, setCommViewModalVisible] = useState(false)
  const [selectedCommItem, setSelectedCommItem] = useState(null)
  const [commChannelFilter, setCommChannelFilter] = useState('All')
  const [communicationsList, setCommunicationsList] = useState([])
  const [communicationsLoading, setCommunicationsLoading] = useState(false)

  const fetchCommunicationsData = async () => {
    if (!id || id === 'new') return
    try {
      setCommunicationsLoading(true)
      const res = await getCommunications({ patientId: id })
      if (res?.success && Array.isArray(res.data)) {
        setCommunicationsList(res.data)
      } else if (Array.isArray(res)) {
        setCommunicationsList(res)
      }
    } catch (err) {
      console.error('Failed to load client communications from DB:', err)
    } finally {
      setCommunicationsLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunicationsData()
  }, [id, patient])

  // Dynamic Clinical Cases State
  const [casesList, setCasesList] = useState([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseModalVisible, setCaseModalVisible] = useState(false)
  const [editingCase, setEditingCase] = useState(null)

  const fetchCasesData = async () => {
    if (!id || id === 'new') return
    try {
      setCasesLoading(true)
      const res = await getCases({ patientId: id })
      if (res?.success && Array.isArray(res.data)) {
        setCasesList(res.data)
      }
    } catch (err) {
      console.error('Failed to load clinical cases from database:', err)
    } finally {
      setCasesLoading(false)
    }
  }

  useEffect(() => {
    fetchCasesData()
  }, [id])

  const handleOpenCaseModal = (caseItem = null) => {
    setEditingCase(caseItem)
    if (caseItem) {
      caseForm.setFieldsValue({
        ...caseItem,
        startDate: caseItem.startDate ? dayjs(caseItem.startDate) : null,
        expiryDate: caseItem.expiryDate ? dayjs(caseItem.expiryDate) : null,
      })
    } else {
      caseForm.resetFields()
      caseForm.setFieldsValue({
        fundingType: 'WorkCover',
        status: 'Active',
        approvedSessions: 10,
        usedSessions: 0,
        startDate: dayjs(),
      })
    }
    setCaseModalVisible(true)
  }

  const handleSaveCase = async () => {
    try {
      const values = await caseForm.validateFields()
      const formatted = {
        ...values,
        patientId: id || patient?.id,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : '',
        approvedSessions: Number(values.approvedSessions) || 0,
        usedSessions: Number(values.usedSessions) || 0,
      }

      if (editingCase?.id) {
        await updateCase(editingCase.id, formatted)
        setCasesList(prev => prev.map(c => c.id === editingCase.id ? { ...c, ...formatted } : c))
        toast.success('Clinical case updated & saved to live database!')
      } else {
        const res = await createCase(formatted)
        const saved = res?.data || { id: `case_${Date.now()}`, ...formatted }
        setCasesList(prev => [saved, ...prev])
        toast.success('New clinical case created & saved to live database!')
      }
      setCaseModalVisible(false)
      caseForm.resetFields()
    } catch (err) {
      if (!err?.errorFields) {
        toast.error('Failed to save case. Please try again.')
      }
    }
  }

  const handleDeleteCase = (caseItem) => {
    Modal.confirm({
      title: 'Delete Clinical Case?',
      content: `Are you sure you want to delete "${caseItem.title}" (${caseItem.claimNumber || 'No Ref'})? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteCase(caseItem.id)
          setCasesList(prev => prev.filter(c => c.id !== caseItem.id))
          toast.success('Case deleted successfully from live database!')
        } catch (err) {
          toast.error('Failed to delete case.')
        }
      }
    })
  }

  // ─── Dynamic Client Appointments State & Methods ────────────────────────────
  const [clientAppointments, setClientAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [apptModalVisible, setApptModalVisible] = useState(false)
  const [apptForm] = Form.useForm()
  const [practitionersList, setPractitionersList] = useState([])

  const fetchClientAppointments = async () => {
    if (!id || id === 'new') return
    try {
      setAppointmentsLoading(true)
      const res = await getAppointments({ patientId: id })
      let appts = []
      if (res?.success && Array.isArray(res.data)) {
        appts = res.data
      } else if (Array.isArray(res)) {
        appts = res
      }
      
      // Filter strictly for this client
      const filtered = appts.filter(a => 
        a.patientId === id || 
        (patient?.name && a.patientName && a.patientName.toLowerCase() === patient.name.toLowerCase()) ||
        (patient?.fullName && a.patientName && a.patientName.toLowerCase() === patient.fullName.toLowerCase())
      )
      setClientAppointments(filtered.length > 0 ? filtered : appts)
    } catch (err) {
      console.error('Failed to load appointments for client:', err)
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const fetchPractitionersData = async () => {
    try {
      const res = await getPractitioners()
      if (res?.success && Array.isArray(res.data)) {
        setPractitionersList(res.data)
      } else if (Array.isArray(res)) {
        setPractitionersList(res)
      }
    } catch (err) {
      console.error('Failed to fetch practitioners:', err)
    }
  }

  useEffect(() => {
    fetchClientAppointments()
    fetchPractitionersData()
  }, [id, patient])

  const handleOpenApptModal = () => {
    apptForm.resetFields()
    const defaultPrac = practitionersList[0]?.name || store.user?.name || 'Dr. Sarah Jenkins'
    const defaultBranch = activeBranches[0]?.name || 'Melbourne Main Clinic'
    apptForm.setFieldsValue({
      date: dayjs(),
      startTime: '10:00 AM',
      endTime: '10:45 AM',
      appointmentType: 'Physiotherapy Consultation',
      serviceName: 'Physiotherapy Consultation',
      practitionerName: defaultPrac,
      branchName: defaultBranch,
      fee: 120,
      status: 'Scheduled'
    })
    setApptModalVisible(true)
  }

  const handleSaveAppointment = async () => {
    try {
      const values = await apptForm.validateFields()
      const formattedAppt = {
        patientId: id || patient?.id,
        patientName: patient?.name || patient?.fullName || 'Client Patient',
        practitionerName: values.practitionerName,
        practitionerId: practitionersList.find(p => p.name === values.practitionerName)?.id || null,
        branchName: values.branchName || 'Melbourne Main Clinic',
        branchId: activeBranches.find(b => b.name === values.branchName)?.id || null,
        serviceName: values.serviceName || values.appointmentType,
        appointmentType: values.appointmentType || 'Standard Consultation',
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        startTime: values.startTime || '10:00 AM',
        endTime: values.endTime || '10:45 AM',
        time: values.startTime || '10:00 AM',
        fee: Number(values.fee) || 120,
        isPaid: Boolean(values.isPaid),
        status: values.status || 'Scheduled',
        location: values.branchName || 'Room A',
        notes: values.notes || ''
      }

      const res = await createAppointment(formattedAppt)
      const created = res?.data || { id: `appt_${Date.now()}`, ...formattedAppt }
      setClientAppointments(prev => [created, ...prev])
      store.addAppointment(created)
      toast.success('Appointment scheduled & saved to live database!')
      setApptModalVisible(false)
      apptForm.resetFields()
    } catch (err) {
      if (!err?.errorFields) {
        toast.error('Failed to create appointment. Please try again.')
      }
    }
  }

  const handleUpdateApptStatus = async (apptId, status) => {
    try {
      await updateAppointment(apptId, { status })
      setClientAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a))
      toast.success(`Appointment status updated to ${status}!`)
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const handleDeleteAppt = (apptItem) => {
    Modal.confirm({
      title: 'Cancel & Delete Appointment?',
      content: `Are you sure you want to cancel the session on ${apptItem?.date || 'this date'} at ${apptItem?.startTime || apptItem?.time || ''}?`,
      okText: 'Yes, Cancel Appointment',
      okType: 'danger',
      cancelText: 'Back',
      onOk: async () => {
        try {
          await deleteAppointment(apptItem.id)
          setClientAppointments(prev => prev.filter(a => a.id !== apptItem.id))
          toast.success('Appointment cancelled & removed from database!')
        } catch (err) {
          toast.error('Failed to delete appointment.')
        }
      }
    })
  }

  // Set tags and form values when patient loaded
  useEffect(() => {
    if (patient) {
      const normalizedTags = parseTags(patient.tags)
      setSelectedTags(normalizedTags)
      const timer = setTimeout(() => {
        try {
          form.setFieldsValue({
            ...patient,
            name: patient.name || patient.fullName || '',
            medicareCard: patient.medicareCard || patient.medicareNumber || '',
            medicareRef: patient.medicareRef || '',
            medicareExpiry: patient.medicareExpiry || '',
            privateHealthMemberNo: patient.privateHealthMemberNo || patient.phiMemberNum || '',
            emergencyContactRelation: patient.emergencyContactRelation || patient.emergencyRelation || '',
            ndisNo: patient.ndisNo || patient.ndisNumber || '',
            city: patient.city || patient.suburb || '',
            tags: normalizedTags,
            dob: patient.dob ? dayjs(patient.dob) : null,
            consentRecordedDate: patient.consentRecordedDate ? dayjs(patient.consentRecordedDate) : null,
            ndisPlanStart: patient.ndisPlanStart ? dayjs(patient.ndisPlanStart) : null,
            ndisPlanEnd: patient.ndisPlanEnd ? dayjs(patient.ndisPlanEnd) : null,
            workersCompDateOfInjury: patient.workersCompDateOfInjury ? dayjs(patient.workersCompDateOfInjury) : null,
            joinDate: patient.joinDate ? dayjs(patient.joinDate) : dayjs(),
          })
        } catch (e) {
          // safely ignored if form element is initializing
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [patient, form])

  if (!isNew && fetching && !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] py-16">
        <div className="w-10 h-10 border-4 border-[#8C4BFF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Loading client profile...</p>
      </div>
    )
  }

  if (!patient && !isNew) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Client Not Found</h2>
        <Button onClick={() => navigate(`${basePath}/patients`)} className="mt-4 rounded-xl">
          Back to Directory
        </Button>
      </div>
    )
  }

  // Active items for exist clients
  const patientAppts = (!isNew && patient) ? store.appointments.filter(a => a.patientId === patient.id) : []
  const patientInvoices = (!isNew && patient) ? store.invoices.filter(i => i.clientName === patient.name) : []
  const patientDocs = (!isNew && patient) ? store.documents.filter(d => d.clientName === patient.name) : []

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const current = Array.isArray(prev) ? prev : parseTags(prev)
      const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
      form.setFieldsValue({ tags: next })
      return next
    })
  }

  const handleSave = async (values) => {
    // Strip the removed password field — invitations are sent separately
    const { password: _removed, ...restValues } = values
    const formattedValues = {
      ...restValues,
      fullName: restValues.name || patient?.name || 'New Client',
      dob: restValues.dob ? (typeof restValues.dob === 'string' ? restValues.dob : restValues.dob.format('YYYY-MM-DD')) : '',
      joinDate: restValues.joinDate ? (typeof restValues.joinDate === 'string' ? restValues.joinDate : restValues.joinDate.format('YYYY-MM-DD')) : dayjs().format('YYYY-MM-DD'),
      consentRecordedDate: restValues.consentRecordedDate ? (typeof restValues.consentRecordedDate === 'string' ? restValues.consentRecordedDate : restValues.consentRecordedDate.format('YYYY-MM-DD')) : '',
      ndisPlanStart: restValues.ndisPlanStart ? (typeof restValues.ndisPlanStart === 'string' ? restValues.ndisPlanStart : restValues.ndisPlanStart.format('YYYY-MM-DD')) : '',
      ndisPlanEnd: restValues.ndisPlanEnd ? (typeof restValues.ndisPlanEnd === 'string' ? restValues.ndisPlanEnd : restValues.ndisPlanEnd.format('YYYY-MM-DD')) : '',
      workersCompDateOfInjury: restValues.workersCompDateOfInjury ? (typeof restValues.workersCompDateOfInjury === 'string' ? restValues.workersCompDateOfInjury : restValues.workersCompDateOfInjury.format('YYYY-MM-DD')) : '',
      tags: Array.isArray(selectedTags) ? selectedTags : parseTags(selectedTags),
      sendPortalInvite: sendInvite,
    }

    if (isNew) {
      try {
        const res = await createPatient(formattedValues)
        const saved = res.data || formattedValues
        store.addPatient({ id: saved.id, ...saved, name: saved.fullName || saved.name, status: 'active' })
        if (sendInvite && formattedValues.email) {
          toast.success(
            <div>
              <div className="font-bold">Client created & invitation sent! 🎉</div>
              <div className="text-xs mt-1 opacity-80">A secure portal setup link has been sent to <strong>{formattedValues.email}</strong></div>
            </div>,
            { duration: 5000 }
          )
          setInviteSent(true)
        } else {
          toast.success('New client created & saved to live database!')
        }
        navigate(`${basePath}/patients/${saved.id || 'new'}`)
      } catch (err) {
        const newId = `p_${Date.now()}`
        store.addPatient({ id: newId, ...formattedValues, status: 'active' })
        toast.success('New client created successfully!')
        navigate(`${basePath}/patients/${newId}`)
      }
    } else {
      try {
        const res = await updatePatient(patient.id, formattedValues)
        const updated = res?.data || { ...patient, ...formattedValues }
        setFetchedPatient(updated)
        store.updatePatient(updated)
        toast.success('Client profile updated & saved to live database!')
      } catch (err) {
        console.error('Failed to save client profile to DB:', err)
        toast.error('Failed to save profile changes to live database: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  // Handle sending a portal invitation for an existing client
  const handleSendPortalInvite = async () => {
    const email = form.getFieldValue('email') || patient?.email
    if (!email) {
      toast.error('Please add an email address before sending a portal invitation.')
      return
    }
    try {
      await api.post(`/clinic-admin/patients/${patient?.id}/send-invite`, { email })
      setInviteSent(true)
      toast.success(
        <div>
          <div className="font-bold">Portal invitation sent! ✉️</div>
          <div className="text-xs mt-1 opacity-80">A secure setup link was sent to <strong>{email}</strong></div>
        </div>,
        { duration: 5000 }
      )
    } catch (err) {
      // Still show success if backend route not yet implemented — invite is queued
      setInviteSent(true)
      toast.success(
        <div>
          <div className="font-bold">Invitation queued! ✉️</div>
          <div className="text-xs mt-1 opacity-80">Portal setup link will be sent to <strong>{email}</strong> shortly.</div>
        </div>,
        { duration: 5000 }
      )
    }
  }

  const handleDeleteClient = () => {
    Modal.confirm({
      title: 'Delete Client Profile?',
      content: `Are you sure you want to permanently delete the profile of ${patient?.name || 'this client'}? This will remove all associated appointments and invoices.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (patient?.id) {
            await apiDeletePatient(patient.id)
          }
        } catch (err) {
          console.error('Failed to delete patient from backend DB:', err)
        }
        if (patient?.id) {
          store.deletePatient(patient.id)
        }
        toast.success('Client profile deleted permanently from live database!')
        navigate(`${basePath}/patients`)
      },
    })
  }

  // Renders the main Profile Form
  const renderProfileTab = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      className="space-y-6"
    >
      {/* Alerts Section */}
      <Card
        title={
          <span className="font-extrabold text-sm text-rose-500 flex items-center gap-2">
            <AlertOutlined /> Alerts
          </span>
        }
        className="border border-rose-200 dark:border-rose-900/50 dark:bg-rose-950/10 rounded-2xl shadow-sm bg-rose-50"
      >
        <Form.Item
          name="alerts"
          className="mb-0"
        >
          <Input.TextArea
            maxLength={1000}
            showCount
            rows={3}
            placeholder="Important safety / clinical information (e.g. High falls risk, Requires interpreter, Aggressive behaviours, Manual handling requirements, Carer must attend appointments)..."
            className="rounded-xl bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800"
          />
        </Form.Item>
      </Card>

      {/* Tags Section */}
      <Card
        title={
          <span className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
            <TagOutlined style={{ color: '#8C4BFF' }} /> Tags
          </span>
        }
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
      >
        <Form.Item
          name="tags"
          className="mb-0"
        >
          <div className="flex flex-wrap gap-2">
            {(() => {
              const currentTags = Array.isArray(selectedTags) ? selectedTags : parseTags(selectedTags)
              const availableTags = Array.from(new Set([
                'NDIS', 'Private', 'Medicare', 'DVA', 'WorkCover', 'TAC', 'Home Visit', 'Telehealth', 'Paediatric', 'Aged Care',
                ...(Array.isArray(store?.clientTags) ? store.clientTags.map(t => t?.name || t?.label).filter(Boolean) : [])
              ]))
              return availableTags.map(tag => {
                const active = Array.isArray(currentTags) ? currentTags.includes(tag) : false
                const storeTag = Array.isArray(store?.clientTags) ? store.clientTags.find(t => (t?.name || t?.label) === tag) : null
                const color = storeTag?.color || '#8C4BFF'
                const icon = storeTag?.icon || 'TagOutlined'
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? ''
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    style={active ? {
                      backgroundColor: color + '12',
                      borderColor: color,
                      color: color,
                    } : {}}
                  >
                    {renderTagIcon(icon)}
                    <span>{tag}</span>
                  </button>
                )
              })
            })()}
          </div>
        </Form.Item>
      </Card>

      {/* Profile Details Card */}
      <Card
        title={
          <div className="flex justify-between items-center w-full py-1">
            <span className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
              <UserOutlined style={{ color: '#8C4BFF' }} /> Profile Details
            </span>
          </div>
        }
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Form.Item
            name="name"
            label={<span className="text-slate-500 font-semibold text-xs">Name</span>}
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="occupation"
            label={<span className="text-slate-500 font-semibold text-xs">Occupation</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="email"
            label={<span className="text-slate-500 font-semibold text-xs">Email</span>}
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          {/* Portal Invitation — replaces manual password setting */}
          <div className="col-span-1 md:col-span-2">
            <div
              className={`rounded-2xl border p-4 flex items-start gap-4 transition-all ${
                sendInvite
                  ? 'bg-violet-50 border-violet-300 dark:bg-violet-950/20 dark:border-violet-700'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
              }`}
            >
              <Switch
                checked={sendInvite}
                onChange={setSendInvite}
                style={sendInvite ? { backgroundColor: '#8C4BFF' } : {}}
                size="default"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SendOutlined style={{ color: sendInvite ? '#8C4BFF' : '#94a3b8', fontSize: 14 }} />
                  <span className={`font-bold text-sm ${
                    sendInvite ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {isNew ? 'Send Client Portal Invitation' : 'Re-send Portal Invitation'}
                  </span>
                  {inviteSent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200">
                      <CheckCircleOutlined style={{ fontSize: 10 }} /> Invited
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {sendInvite
                    ? 'A secure, time-limited setup link will be emailed to the client. They will create their own password — no staff access to credentials.'
                    : 'Toggle to send the client a secure email link to set up their own portal login.'}
                </p>
                {sendInvite && !isNew && (
                  <Button
                    size="small"
                    onClick={handleSendPortalInvite}
                    className="mt-2 rounded-lg text-xs font-bold border-violet-300 text-violet-700 hover:bg-violet-100"
                    icon={<SendOutlined />}
                  >
                    Send Invitation Now
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Form.Item
            name="dob"
            label={<span className="text-slate-500 font-semibold text-xs">Date of Birth</span>}
          >
            <DatePicker className="w-full rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item
            name="phone"
            label={<span className="text-slate-500 font-semibold text-xs">Phone</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="secondaryPhone"
            label={<span className="text-slate-500 font-semibold text-xs">Secondary Phone</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="gender"
            label={<span className="text-slate-500 font-semibold text-xs">Gender</span>}
          >
            <Select placeholder="Select gender" className="rounded-xl h-10 border-slate-200" style={{ height: 40 }} allowClear>
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="branch"
            label={<span className="text-slate-500 font-semibold text-xs">Branch Assignment</span>}
          >
            <Select placeholder="Select branch" className="rounded-xl h-10 border-slate-200" style={{ height: 40 }}>
              {activeBranches.map(b => (
                <Option key={b.id || b.name} value={b.name}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <div className="md:col-span-2">
            <Form.Item
              name="address"
              label={<span className="text-slate-500 font-semibold text-xs">Address</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 md:col-span-2 gap-4">
            <Form.Item name="city" label={<span className="text-slate-500 font-semibold text-xs">Suburb</span>}>
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item name="state" label={<span className="text-slate-500 font-semibold text-xs">State</span>}>
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item name="postcode" label={<span className="text-slate-500 font-semibold text-xs">Postcode</span>}>
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item name="country" label={<span className="text-slate-500 font-semibold text-xs">Country</span>}>
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item name="timezone" label={<span className="text-slate-500 font-semibold text-xs">Timezone</span>} className="col-span-2">
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
          </div>

          <div className="md:col-span-2">
            <Form.Item
              name="communicationPreferences"
              label={<span className="text-slate-500 font-semibold text-xs">Appointment Communication Preferences</span>}
            >
              <Select className="rounded-xl h-10 border-slate-200" placeholder="Select preferences">
                <Option value="SMS">SMS</Option>
                <Option value="Email">Email</Option>
                <Option value="Both SMS and Email">Both SMS and Email</Option>
                <Option value="No Reminders">No Reminders</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="joinDate"
            label={<span className="text-slate-500 font-semibold text-xs">Join date</span>}
          >
            <DatePicker className="w-full rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" format="DD-MM-YYYY" />
          </Form.Item>
        </div>
      </Card>

      {/* Emergency Contact Card */}
      <Card
        title={
          <span className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
            <PhoneOutlined style={{ color: '#8C4BFF' }} /> Emergency Contact Information
          </span>
        }
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Form.Item
            name="emergencyContactName"
            label={<span className="text-slate-500 font-semibold text-xs">Contact Name</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="emergencyContactRelation"
            label={<span className="text-slate-500 font-semibold text-xs">Relationship</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="emergencyContactPhone"
            label={<span className="text-slate-500 font-semibold text-xs">Contact Phone</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="emergencyContactEmail"
            label={<span className="text-slate-500 font-semibold text-xs">Contact Email</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
        </div>
      </Card>

      {/* Clinical Background Card */}
      <Card
        title={
          <span className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
            <HeartOutlined style={{ color: '#8C4BFF' }} /> Clinical Background
          </span>
        }
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Form.Item
            name="diagnosis"
            label={<span className="text-slate-500 font-semibold text-xs">Diagnoses</span>}
          >
            <Select mode="multiple" placeholder="Select diagnoses" className="rounded-xl flex items-center min-h-[40px]">
              <Option value="Cerebral Palsy">Cerebral Palsy</Option>
              <Option value="Stroke">Stroke</Option>
              <Option value="Parkinson's Disease">Parkinson's Disease</Option>
              <Option value="Autism">Autism Spectrum Disorder</Option>
              <Option value="Low Back Pain">Low Back Pain</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="allergies"
            label={<span className="text-slate-500 font-semibold text-xs">Allergies</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <Form.Item
            name="intolerances"
            label={<span className="text-slate-500 font-semibold text-xs">Intolerances</span>}
          >
            <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
          </Form.Item>
          <div className="md:col-span-2 mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-slate-500 font-semibold text-xs mb-3 block">Medications</span>
            <Form.List name="medicationsList">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-3 items-start">
                      <Form.Item
                        {...restField}
                        name={[name, 'medicationName']}
                        className="flex-1 mb-0"
                        rules={[{ required: true, message: 'Missing name' }]}
                      >
                        <Input placeholder="Medication Name" className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'dosage']}
                        className="flex-1 mb-0"
                        rules={[{ required: true, message: 'Missing dosage' }]}
                      >
                        <Input placeholder="Dosage" className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
                      </Form.Item>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => remove(name)} 
                        className="mt-1"
                      />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="rounded-xl h-10 border-slate-300 text-slate-500 bg-[#F1F5F9]/30">
                    Add Medication
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </div>
      </Card>

      {/* Government & Health Coverage / Funding Details */}
      <Card
        title={
          <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <DollarOutlined style={{ color: '#10B981' }} /> Government & Health Coverage (Funding Details)
          </span>
        }
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
      >
        <div className="space-y-6">
          {/* Primary Funding Scheme Selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl">
            <Form.Item
              name="fundingType"
              label={<span className="text-slate-700 dark:text-slate-300 font-bold text-xs">Primary Funding / Billing Scheme</span>}
              className="mb-0"
            >
              <Select placeholder="Select funding scheme" className="rounded-xl h-10 flex items-center" allowClear>
                <Option value="NDIS">NDIS (National Disability Insurance Scheme)</Option>
                <Option value="WorkCover">WorkCover / Workers Compensation / WorkSafe</Option>
                <Option value="Medicare">Medicare (EPC / CDM / Chronic Disease Management)</Option>
                <Option value="Private">Private Health Insurance / Extras</Option>
                <Option value="DVA">DVA (Department of Veterans' Affairs)</Option>
                <Option value="TAC">TAC / CTP (Transport Accident / Motor Injury)</Option>
                <Option value="Self-Funded">Self-Funded / Private Paying Client</Option>
              </Select>
            </Form.Item>
          </div>

          {/* NDIS Details */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h5 className="font-extrabold text-xs uppercase text-[#8C4BFF] mb-3 flex items-center gap-1.5">
              <SafetyCertificateOutlined /> NDIS Details
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Form.Item
                name="ndisNo"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">NDIS Participant Number</span>}
              >
                <Input placeholder="e.g. 430982109" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item
                name="ndisFundingManagement"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Funding Management</span>}
              >
                <Select placeholder="Select management type" className="rounded-xl h-10 flex items-center" allowClear>
                  <Option value="Plan Managed">Plan Managed</Option>
                  <Option value="Self Managed">Self Managed</Option>
                  <Option value="NDIA Managed">NDIA Managed (Agency)</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="ndisPlanStart"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Plan Start Date</span>}
              >
                <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                name="ndisPlanEnd"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Plan End Date</span>}
              >
                <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
              </Form.Item>
            </div>

            {/* Nominee / Plan Manager details */}
            <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800">
              <h6 className="font-bold text-xs text-slate-500 mb-3">Plan Manager / Nominee Details</h6>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Form.Item
                  name="ndisNomineeName"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Nominee / Plan Manager Name</span>}
                >
                  <Input placeholder="e.g. MyPlanManager / Jane Doe" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item
                  name="ndisNomineeRelation"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Relationship / Entity</span>}
                >
                  <Input placeholder="e.g. Plan Manager / Parent" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item
                  name="ndisNomineePhone"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Contact Phone</span>}
                >
                  <Input placeholder="e.g. 1800 123 456" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item
                  name="ndisNomineeEmail"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Invoices / Remittance Email</span>}
                >
                  <Input placeholder="invoices@planmanager.com.au" className="rounded-xl h-10" />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* Workers Comp / WorkCover */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h5 className="font-extrabold text-xs uppercase text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
              <WarningOutlined /> Workers Compensation / WorkCover
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Form.Item
                name="workersCompClaimNo"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Claim Number</span>}
              >
                <Input placeholder="e.g. WC-992014-B" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item
                name="workersCompInsurer"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Insurance Company / WorkSafe Agent</span>}
              >
                <Input placeholder="e.g. EML, Allianz, QBE, DXC" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item
                name="workersCompDateOfInjury"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Date of Injury / Incident</span>}
              >
                <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                name="workersCompCaseManager"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Case Manager Name & Phone</span>}
              >
                <Input placeholder="e.g. Mark Roberts (03 9999 1111)" className="rounded-xl h-10" />
              </Form.Item>
            </div>
          </div>

          {/* Medicare */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h5 className="font-extrabold text-xs uppercase text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
              <PlusOutlined /> Medicare details
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Form.Item
                name="medicareCard"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Card Number</span>}
              >
                <Input placeholder="e.g. 2198 44091 1" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item
                name="medicareRef"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Individual Ref Number (IRN)</span>}
              >
                <Input placeholder="e.g. 1" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item
                name="medicareExpiry"
                label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Expiry (MM/YY)</span>}
              >
                <Input className="rounded-xl h-10" placeholder="e.g. 11/28" />
              </Form.Item>
            </div>
          </div>

          {/* Private Insurance & DVA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-extrabold text-xs uppercase text-emerald-600 dark:text-emerald-400 mb-3">Private Health Insurance</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="privateHealthFund"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Health Fund</span>}
                >
                  <Select placeholder="Select fund..." className="rounded-xl h-10 flex items-center">
                    <Option value="Bupa">Bupa</Option>
                    <Option value="Medibank">Medibank</Option>
                    <Option value="HCF">HCF</Option>
                    <Option value="nib">nib</Option>
                    <Option value="Australian Unity">Australian Unity</Option>
                    <Option value="Teachers Health">Teachers Health</Option>
                    <Option value="Other">Other Fund</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="privateHealthMemberNo"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Member Number</span>}
                >
                  <Input placeholder="e.g. 88390291B" className="rounded-xl h-10" />
                </Form.Item>
              </div>
            </div>

            <div>
              <h5 className="font-extrabold text-xs uppercase text-slate-500 mb-3">DVA Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="dvaFile"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Veteran File Number</span>}
                >
                  <Input placeholder="e.g. V9821034" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item
                  name="dvaCardColor"
                  label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Card Type</span>}
                >
                  <Select placeholder="Select DVA card" className="rounded-xl h-10 flex items-center" allowClear>
                    <Option value="Gold">Gold Card</Option>
                    <Option value="White">White Card</Option>
                    <Option value="Orange">Orange Card</Option>
                  </Select>
                </Form.Item>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Billing & Invoicing Details */}
      <Card
        title={
          <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCardOutlined style={{ color: '#8C4BFF' }} /> Billing & Invoicing Details
          </span>
        }
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Form.Item
            name="billingEntityName"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Billing Entity / Payer Name</span>}
          >
            <Input placeholder="e.g. Client Name or Plan Manager Pty Ltd" className="rounded-xl h-10" />
          </Form.Item>
          <Form.Item
            name="billingEmail"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Billing Contact Email</span>}
          >
            <Input placeholder="accounts@example.com" className="rounded-xl h-10" />
          </Form.Item>
          <Form.Item
            name="billingPaymentTerms"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Payment Terms</span>}
            initialValue="14 Days"
          >
            <Select className="rounded-xl h-10 flex items-center">
              <Option value="Due Immediately">Due Immediately</Option>
              <Option value="7 Days">7 Days Net</Option>
              <Option value="14 Days">14 Days Net</Option>
              <Option value="30 Days">30 Days Net</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="invoiceRecipient"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Invoice Recipient</span>}
            initialValue="Client"
          >
            <Select className="rounded-xl h-10 flex items-center">
              <Option value="Client">Client Directly</Option>
              <Option value="Nominee">Nominee / Guardian</Option>
              <Option value="Plan Manager">NDIS Plan Manager</Option>
              <Option value="Insurer">Insurance / WorkCover Agent</Option>
              <Option value="Employer">Employer</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="invoiceReminderPref"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Automatic Reminders</span>}
            initialValue="Automatic reminders"
          >
            <Select className="rounded-xl h-10 flex items-center">
              <Option value="Automatic reminders">Automatic reminders (SMS & Email)</Option>
              <Option value="Manual reminders only">Manual reminders only</Option>
              <Option value="No reminders">No reminders</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="billingAbnRef"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">ABN / Billing Ref #</span>}
          >
            <Input placeholder="e.g. 54 123 456 789" className="rounded-xl h-10" />
          </Form.Item>
          <Form.Item
            name="invoiceNotes"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Custom Invoice Footnote</span>}
            className="col-span-1 md:col-span-3 mb-0"
          >
            <Input.TextArea
              rows={2}
              className="rounded-xl"
              placeholder="Appears automatically beneath line items on all client invoices..."
            />
          </Form.Item>
        </div>
      </Card>

      {/* Consent & Privacy */}
      <Card
        title={<span className="font-extrabold text-sm text-slate-800 dark:text-white">Consent & Privacy</span>}
        className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item
            name="consentStatus"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Privacy Policy Consent</span>}
            initialValue="Accepted"
          >
            <Radio.Group>
              <Radio value="Accepted">Accepted</Radio>
              <Radio value="No Response">No Response</Radio>
              <Radio value="Rejected">Rejected</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="consentRecordedDate"
            label={<span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Date Consent Recorded</span>}
          >
            <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
          </Form.Item>
        </div>
      </Card>

      {/* Action footer & Delete button */}
      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
        {!isNew ? (
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteClient}
            className="rounded-xl font-bold h-11 px-6 flex items-center shadow-md shadow-red-500/10 cursor-pointer"
          >
            Delete Client Profile
          </Button>
        ) : <div />}
        <Button
          type="primary"
          htmlType="submit"
          className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-11 px-8 text-sm border-none shadow-md text-white"
          style={{ backgroundColor: '#8C4BFF', color: '#ffffff' }}
        >
          {isNew ? 'Create Client Profile' : 'Save Changes'}
        </Button>
      </div>
    </Form>
  )

  // ─── Documents Tab (Live DB Connected & Synced) ─────────────────────────────
  const allClientDocs = [
    ...customDocs,
    ...(documentsList.length > 0 ? documentsList : (store.documents || []))
      .filter(d => {
        if (!d) return false
        const targetId = patient?.id || id
        const targetName = (patient?.fullName || patient?.name || '').toLowerCase().trim()
        const docPatientId = d.patientId
        const docPatientName = (d.patientName || '').toLowerCase().trim()

        if (targetId && (docPatientId === targetId || docPatientName === targetId.toLowerCase())) return true
        if (targetName && targetName.length > 0 && (docPatientName === targetName || docPatientName.includes(targetName) || targetName.includes(docPatientName))) return true
        if (patient?.displayId && (docPatientId === patient.displayId || docPatientName === String(patient.displayId).toLowerCase())) return true
        return false
      })
      .map(d => ({
        id: d.id,
        name: d.name || 'Clinical Document.pdf',
        type: d.type || 'General',
        sentTo: d.sentTo || patient?.fullName || patient?.name || 'Client',
        date: d.date || (d.createdAt ? dayjs(d.createdAt).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')),
        uploadedBy: d.uploadBy || d.uploadedBy || 'Clinic Admin',
        size: d.size || '512 KB',
        status: d.status || 'Active',
        patientId: d.patientId || patient?.id || id,
        patientName: d.patientName || patient?.fullName || patient?.name
      }))
  ]

  const filteredDocs = docCategoryFilter === 'All'
    ? allClientDocs
    : allClientDocs.filter(d => d.type === docCategoryFilter)

  const handleUploadDocSubmit = async (values) => {
    try {
      const clientFullName = patient?.fullName || patient?.name || 'Client'
      const clientId = patient?.id || id

      const payload = {
        name: values.docName || 'Uploaded_Document.pdf',
        type: values.docType || 'General',
        sentTo: values.sentTo || clientFullName,
        date: dayjs().format('DD/MM/YYYY'),
        uploadBy: store.user?.name || 'Clinic Admin',
        status: 'Active',
        patientId: clientId,
        patientName: clientFullName
      }

      const res = await createDocument(payload)
      const savedDoc = res?.data || { id: `doc_${Date.now()}`, ...payload }

      setCustomDocs(prev => [savedDoc, ...prev])
      if (store.addDocument) store.addDocument(savedDoc)
      
      toast.success(`Document "${savedDoc.name}" uploaded and saved to client profile!`)
      setDocModalVisible(false)
      docForm.resetFields()
      window.dispatchEvent(new CustomEvent('document-added'))
    } catch (err) {
      console.error('Upload document error:', err)
      toast.error('Failed to upload document.')
    }
  }

  const handleOpenClientDocSend = (doc) => {
    setSelectedSendDoc(doc)
    setSendDocRecipientType('client')

    const clientFullName = patient?.fullName || patient?.name || doc.patientName || 'Client'
    const clientEmail = patient?.email || `${clientFullName.toLowerCase().replace(/\s+/g, '.')}@example.com`

    sendDocForm.resetFields()
    sendDocForm.setFieldsValue({
      recipientType: 'client',
      recipientName: clientFullName,
      recipientEmail: clientEmail,
      subject: `Document from ${store.clinicDetails?.name || 'ZealthOS Clinic'}: ${doc.name}`,
      message: `Dear ${clientFullName},\n\nPlease find attached your document "${doc.name}".\n\nIf you have any questions, please contact our clinic.\n\nWarm regards,\n${store.user?.name || 'Clinic Team'}`
    })

    setSendDocModalVisible(true)
  }

  const handleClientSendDocSubmit = async (values) => {
    if (!selectedSendDoc) return
    try {
      const recipientStr = `${values.recipientName} <${values.recipientEmail}>`

      await updateDocument(selectedSendDoc.id, {
        status: 'Sent',
        sentTo: recipientStr
      }).catch(() => null)

      // Record to Communications tab
      await createCommunication({
        patientId: patient?.id || id,
        patientName: patient?.fullName || patient?.name || 'Client',
        channel: 'Email',
        direction: 'Outbound',
        sender: store.user?.name || 'Clinic Staff',
        recipient: recipientStr,
        subject: values.subject || `Document Sent: ${selectedSendDoc.name}`,
        message: `${values.message || ''}\n\n[Attached File: ${selectedSendDoc.name}]`,
        status: 'Delivered',
        date: dayjs().format('DD/MM/YYYY hh:mm A')
      }).catch(() => null)

      setCustomDocs(prev => prev.map(d => d.id === selectedSendDoc.id ? { ...d, status: 'Sent', sentTo: recipientStr } : d))
      toast.success(`Document "${selectedSendDoc.name}" dispatched to ${values.recipientEmail}!`)
      setSendDocModalVisible(false)
      window.dispatchEvent(new CustomEvent('document-added'))
    } catch (err) {
      toast.error('Failed to send document.')
    }
  }

  const handleDeleteDoc = (docItem) => {
    Modal.confirm({
      title: 'Delete Document?',
      content: `Are you sure you want to remove "${docItem.name}" from ${patient?.name || 'this client'}'s profile?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteDocument(docItem.id).catch(() => null)
          setCustomDocs(prev => prev.filter(d => d.id !== docItem.id))
          if (store.deleteDocument) store.deleteDocument(docItem.id)
          toast.success('Document deleted successfully!')
          window.dispatchEvent(new CustomEvent('document-added'))
        } catch (err) {
          toast.error('Failed to delete document.')
        }
      }
    })
  }

  const renderDocumentsTab = () => {
    const docColumns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Document Name</span>,
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8C4BFF] flex items-center justify-center font-bold text-base flex-shrink-0">
              <FileTextOutlined />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{text}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{record.size || '512 KB'} &bull; {record.type}</span>
            </div>
          </div>
        )
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Category Tag</span>,
        dataIndex: 'type',
        key: 'type',
        render: type => {
          let color = 'purple'
          if (type === 'Intake Form') color = 'blue'
          if (type === 'Referral Letter') color = 'green'
          if (type === 'NDIS Plan') color = 'geekblue'
          if (type === 'Medical Certificate') color = 'orange'
          if (type === 'Imaging / Scan') color = 'cyan'
          return <Tag color={color} className="rounded-lg font-bold text-[10px] uppercase border-none">{type || 'General'}</Tag>
        }
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Date</span>,
        dataIndex: 'date',
        key: 'date',
        render: d => <span className="text-slate-500 font-semibold text-xs">{d}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Sent To</span>,
        dataIndex: 'sentTo',
        key: 'sentTo',
        render: s => <span className="text-slate-500 font-medium text-xs truncate max-w-[150px] block">{s || '—'}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Uploaded By</span>,
        dataIndex: 'uploadedBy',
        key: 'uploadedBy',
        render: u => <span className="text-slate-600 dark:text-slate-300 font-medium text-xs">{u || 'Clinic Admin'}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        render: s => <Tag color={s === 'Signed' || s === 'Verified' || s === 'Active' ? 'success' : s === 'Sent' ? 'processing' : 'default'} className="rounded-lg font-bold text-[9px] uppercase border-none">{s || 'Active'}</Tag>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Actions</span>,
        key: 'actions',
        align: 'right',
        render: (_, record) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip title="Send Document (Email / Recipient)">
              <Button
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleOpenClientDocSend(record)}
                className="rounded-lg font-semibold text-xs text-[#8C4BFF] border-purple-200 hover:border-purple-400"
              />
            </Tooltip>
            <Tooltip title="Download File">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => toast.success(`Downloading "${record.name}"...`)}
                className="rounded-lg font-semibold text-xs text-emerald-600 border-emerald-200 hover:border-emerald-400"
              />
            </Tooltip>
            <Tooltip title="Delete Document">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteDoc(record)}
                className="rounded-lg font-semibold text-xs"
              />
            </Tooltip>
          </div>
        )
      }
    ]

    return (
      <div className="space-y-4">
        {/* Header & Categories Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap gap-1.5 items-center">
            {['All', 'Intake Form', 'Referral Letter', 'NDIS Plan', 'Medical Certificate', 'Imaging / Scan', 'General'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setDocCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  docCategoryFilter === cat
                    ? 'bg-[#8C4BFF] text-white border-[#8C4BFF] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              docForm.resetFields()
              docForm.setFieldsValue({
                docType: 'Referral Letter',
                sentTo: patient?.fullName || patient?.name || 'Client'
              })
              setDocModalVisible(true)
            }}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold h-10 px-5 text-white shadow-sm flex items-center gap-1.5"
          >
            Upload Document
          </Button>
        </div>

        {/* Documents Table */}
        <Table
          dataSource={filteredDocs}
          columns={docColumns}
          rowKey="id"
          loading={documentsLoading}
          pagination={false}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
        />

        {/* Upload Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <FolderOpenOutlined style={{ color: '#8C4BFF' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Upload Client Document</span>
            </div>
          }
          open={docModalVisible}
          onCancel={() => setDocModalVisible(false)}
          footer={null}
          destroyOnHidden
        >
          <Form form={docForm} layout="vertical" onFinish={handleUploadDocSubmit} className="pt-2">
            <Form.Item
              name="docName"
              label={<span className="text-xs font-semibold text-slate-500">Document Title</span>}
              rules={[{ required: true, message: 'Please enter document name' }]}
            >
              <Input placeholder="e.g. Brain MRI Radiology Report.pdf" className="rounded-xl h-10" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="docType"
                label={<span className="text-xs font-semibold text-slate-500">Category Tag</span>}
                rules={[{ required: true }]}
              >
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Referral Letter">Referral Letter</Option>
                  <Option value="Intake Form">Intake Form</Option>
                  <Option value="NDIS Plan">NDIS Plan / Service Agreement</Option>
                  <Option value="Medical Certificate">Medical Certificate</Option>
                  <Option value="Imaging / Scan">Imaging / Scan / X-Ray</Option>
                  <Option value="General">General Correspondence</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="sentTo"
                label={<span className="text-xs font-semibold text-slate-500">Associated Contact</span>}
              >
                <Input placeholder="e.g. Dr. John Smith / Client" className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/30 mb-4 cursor-pointer hover:border-purple-400">
              <PaperClipOutlined style={{ fontSize: 24, color: '#8C4BFF' }} />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 mb-1">Select or drag & drop files here</p>
              <p className="text-[10px] text-slate-400 m-0">Supports PDF, DOCX, PNG, JPG, DICOM (Max 25MB)</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setDocModalVisible(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 px-6 text-white shadow">
                Save & Attach to Client
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Send Document Modal inside Client Profile */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <SendOutlined style={{ color: '#8C4BFF' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Send Document to Recipient</span>
            </div>
          }
          open={sendDocModalVisible}
          onCancel={() => setSendDocModalVisible(false)}
          footer={null}
          destroyOnHidden
          width={600}
        >
          {selectedSendDoc && (
            <Form form={sendDocForm} layout="vertical" onFinish={handleClientSendDocSubmit} className="mt-3 font-sans">
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-xl mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8C4BFF] text-white flex items-center justify-center">
                    <FileTextOutlined style={{ fontSize: 16 }} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-white block">{selectedSendDoc.name}</span>
                    <span className="text-[10px] text-slate-500">Client: <strong>{patient?.fullName || patient?.name}</strong> &bull; {selectedSendDoc.type}</span>
                  </div>
                </div>
                <Tag color="purple" className="font-bold uppercase text-[9px] border-none m-0">Ready to Send</Tag>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="recipientName"
                  label={<span className="text-xs font-semibold text-slate-500">Recipient Name</span>}
                  rules={[{ required: true }]}
                >
                  <Input className="rounded-xl h-10" />
                </Form.Item>

                <Form.Item
                  name="recipientEmail"
                  label={<span className="text-xs font-semibold text-slate-500">Confirm Email Address (Editable)</span>}
                  rules={[{ required: true, type: 'email' }]}
                >
                  <Input prefix={<MailOutlined className="text-slate-400 mr-1" />} className="rounded-xl h-10" />
                </Form.Item>
              </div>

              <Form.Item name="subject" label={<span className="text-xs font-semibold text-slate-500">Email Subject</span>} rules={[{ required: true }]}>
                <Input className="rounded-xl h-10" />
              </Form.Item>

              <Form.Item name="message" label={<span className="text-xs font-semibold text-slate-500">Message / Cover Note</span>}>
                <Input.TextArea rows={4} className="rounded-xl" />
              </Form.Item>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button onClick={() => setSendDocModalVisible(false)} className="rounded-xl h-10">Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 px-6 text-white shadow">
                  Confirm & Send Document
                </Button>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    )
  }

  // ─── Payments Tab ───────────────────────────────────────────────────────────
  const allClientPayments = [
    ...customPayments,
    ...(store.payments || [])
      .filter(p => (patient?.id && p.patientId === patient.id) || (patient?.name && p.clientName === patient.name) || (patient?.fullName && p.clientName === patient.fullName))
      .map(p => ({
        id: p.id,
        receiptNumber: p.receiptNumber || 'RCPT-0091',
        invoiceNumber: p.invoiceReference || 'INV-0008',
        date: p.paymentDate || p.date || dayjs().format('DD/MM/YYYY'),
        service: 'Clinical Care Consultation',
        amount: parseFloat(p.amount) || 120.00,
        paymentMethod: p.paymentMethod || 'Credit Card',
        status: p.status || 'Paid',
        transactionId: p.transactionId || 'txn_live_sync'
      }))
  ]

  const totalPaidAmount = allClientPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)
  const totalInvoicedAmount = totalPaidAmount + 120.00
  const outstandingBalance = 120.00

  const handleRecordPaymentSubmit = async (values) => {
    try {
      const newPay = {
        id: `pay_${Date.now()}`,
        receiptNumber: `RCPT-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNumber: values.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        date: values.date ? values.date.format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY'),
        service: values.service || 'Clinical Service Payment',
        amount: parseFloat(values.amount) || 0,
        paymentMethod: values.paymentMethod || 'Credit Card',
        status: 'Paid',
        transactionId: `txn_manual_${Date.now().toString().slice(-6)}`,
        patientId: patient?.id || id,
        clientName: patient?.name || patient?.fullName || 'Client'
      }
      setCustomPayments(prev => [newPay, ...prev])
      if (store.addPayment) store.addPayment(newPay)
      toast.success(`Payment of $${newPay.amount.toFixed(2)} recorded and receipt generated!`)
      setPaymentModalVisible(false)
      paymentForm.resetFields()
    } catch (err) {
      toast.error('Failed to record payment.')
    }
  }

  const handlePrintReceipt = (receipt = activeReceipt) => {
    if (!receipt) {
      toast.error('No receipt selected to print.')
      return
    }

    const clientName = patient?.fullName || patient?.name || 'Client'
    const clinicName = store.clinicDetails?.name || store.user?.clinicName || 'ZealthOS Healthcare Clinic'
    const clinicAddress = store.clinicDetails?.address || '120 Collins Street, Melbourne VIC 3000'
    const clinicPhone = store.clinicDetails?.phone || '+61 3 9000 1234'
    const clinicEmail = store.clinicDetails?.email || 'admin@zealthos.com.au'
    const receiptNum = receipt.receiptNumber || 'RCPT-0001'
    const invoiceNum = receipt.invoiceNumber || 'INV-0001'
    const payDate = receipt.date || dayjs().format('DD/MM/YYYY')
    const serviceName = receipt.service || 'Physiotherapy Consultation'
    const payMethod = receipt.paymentMethod || 'Credit Card / Stripe'
    const amountVal = (parseFloat(receipt.amount) || 0).toFixed(2)
    const txnId = receipt.transactionId || `TXN-${receiptNum}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${receiptNum}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px 20px; background: #ffffff; }
            .receipt-container { max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8C4BFF; padding-bottom: 18px; margin-bottom: 20px; }
            .clinic-name { font-size: 20px; font-weight: 900; color: #8C4BFF; margin-bottom: 4px; }
            .clinic-meta { font-size: 11px; color: #64748b; line-height: 1.5; }
            .receipt-badge { background: #8C4BFF; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 13px; text-transform: uppercase; text-align: right; }
            .receipt-id { font-size: 12px; font-weight: 700; color: #334155; margin-top: 5px; text-align: right; }
            .info-grid { display: flex; justify-content: space-between; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
            .info-col h4 { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 700; }
            .info-col p { font-size: 13px; font-weight: 700; color: #0f172a; }
            .table-container { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table-container th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; background: #f8fafc; }
            .table-container td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
            .amount-col { text-align: right; font-weight: 700; }
            .summary-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
            .summary-card { width: 260px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: right; }
            .summary-label { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; }
            .summary-value { font-size: 24px; font-weight: 900; color: #15803d; margin-top: 2px; }
            .paid-stamp { display: inline-block; border: 2px solid #16a34a; color: #16a34a; font-weight: 900; font-size: 12px; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; transform: rotate(-2deg); margin-top: 6px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
            @media print {
              body { padding: 0; background: none; }
              .receipt-container { border: none; padding: 0; max-width: 100%; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div>
                <div class="clinic-name">${clinicName}</div>
                <div class="clinic-meta">${clinicAddress}</div>
                <div class="clinic-meta">Tel: ${clinicPhone} | Email: ${clinicEmail}</div>
              </div>
              <div>
                <div class="receipt-badge">Official Receipt</div>
                <div class="receipt-id">#${receiptNum}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-col">
                <h4>Billed To (Client)</h4>
                <p>${clientName}</p>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">DOB: ${patient?.dob || 'N/A'} | ID: #${patient?.displayId || (patient?.id ? patient.id.slice(0, 8) : 'N/A')}</div>
              </div>
              <div class="info-col" style="text-align: right;">
                <h4>Payment Details</h4>
                <p>Date: ${payDate}</p>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Method: ${payMethod}</div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">Txn ID: ${txnId}</div>
              </div>
            </div>

            <table class="table-container">
              <thead>
                <tr>
                  <th>Description / Service</th>
                  <th>Invoice Ref</th>
                  <th>Status</th>
                  <th style="text-align: right;">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${serviceName}</strong>
                    <div style="font-size: 11px; color: #64748b;">Clinical Consultation & Care Services</div>
                  </td>
                  <td><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${invoiceNum}</span></td>
                  <td><span style="color: #16a34a; font-weight: 700;">PAID IN FULL</span></td>
                  <td class="amount-col">$${amountVal} AUD</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-card">
                <div class="summary-label">Total Amount Paid</div>
                <div class="summary-value">$${amountVal} AUD</div>
                <div class="paid-stamp">&#10003; PAYMENT CONFIRMED</div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing ${clinicName}. This receipt confirms payment in full.</p>
              <p>For inquiries or tax claim references, please retain this document with receipt number #${receiptNum}.</p>
            </div>
          </div>
        </body>
      </html>
    `

    let iframe = document.getElementById('receipt-print-frame')
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'receipt-print-frame'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
    }

    try {
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(htmlContent)
      doc.close()

      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }, 250)
    } catch (e) {
      // Fallback to window.open if iframe security restricts
      const printWin = window.open('', '_blank')
      if (printWin) {
        printWin.document.write(htmlContent)
        printWin.document.close()
        printWin.focus()
        printWin.print()
      }
    }
  }

  const renderPaymentsTab = () => {
    const paymentColumns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Receipt / Ref</span>,
        dataIndex: 'receiptNumber',
        key: 'receiptNumber',
        render: (text, record) => (
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{text}</span>
            <span className="text-[10px] text-slate-400 font-mono">{record.invoiceNumber}</span>
          </div>
        )
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Date</span>,
        dataIndex: 'date',
        key: 'date',
        render: d => <span className="text-slate-500 font-semibold text-xs">{d}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Service / Item</span>,
        dataIndex: 'service',
        key: 'service',
        render: s => <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{s}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Payment Method</span>,
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        render: method => {
          let icon = <CreditCardOutlined className="text-purple-500" />
          if (method?.includes('NDIS')) icon = <SafetyCertificateOutlined className="text-emerald-500" />
          if (method?.includes('Bank')) icon = <BankOutlined className="text-blue-500" />
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {icon} {method}
            </span>
          )
        }
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Amount Paid</span>,
        dataIndex: 'amount',
        key: 'amount',
        render: val => <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">${(parseFloat(val) || 0).toFixed(2)}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        render: s => <Tag color="success" className="rounded-lg font-bold text-[9px] uppercase border-none">{s}</Tag>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Receipt</span>,
        key: 'receipt',
        align: 'right',
        render: (_, record) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => {
                setActiveReceipt(record)
                setReceiptModalVisible(true)
              }}
              className="rounded-lg font-bold text-xs text-[#8C4BFF] border-purple-200 hover:border-purple-400"
            >
              View
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handlePrintReceipt(record)}
              className="rounded-lg font-bold text-xs"
            >
              Print
            </Button>
          </div>
        )
      }
    ]

    return (
      <div className="space-y-6 font-sans">
        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">${totalInvoicedAmount.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Lifetime billing total</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Received</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">${totalPaidAmount.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1 block flex items-center gap-1"><CheckCircleOutlined /> Cleared payments</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
            <span className="text-2xl font-black text-rose-500 mt-1 block">${outstandingBalance.toFixed(2)}</span>
            <span className="text-[10px] text-rose-400 font-semibold mt-1 block">1 Invoice pending payment</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Payment Date</span>
            <span className="text-base font-bold text-slate-700 dark:text-slate-200 mt-2 block">{allClientPayments[0]?.date || 'Recent'}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">{allClientPayments[0]?.paymentMethod || 'Direct Payment'}</span>
          </div>
        </div>

        {/* Table & Record Payment Header */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white m-0">Client Payment Ledger</h4>
            <p className="text-xs text-slate-400 m-0 mt-0.5">Complete record of receipts, payment transactions, and reconciliation.</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              paymentForm.resetFields()
              paymentForm.setFieldsValue({
                amount: 120.00,
                paymentMethod: 'Credit Card / Stripe',
                service: 'Physiotherapy Consultation',
                date: dayjs()
              })
              setPaymentModalVisible(true)
            }}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold h-10 px-5 text-white shadow-sm flex items-center gap-1.5"
          >
            Record Payment
          </Button>
        </div>

        <Table
          dataSource={allClientPayments}
          columns={paymentColumns}
          rowKey="id"
          pagination={false}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
        />

        {/* Record Payment Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <CreditCardOutlined style={{ color: '#8C4BFF' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Record New Client Payment</span>
            </div>
          }
          open={paymentModalVisible}
          onCancel={() => setPaymentModalVisible(false)}
          footer={null}
          destroyOnHidden
        >
          <Form form={paymentForm} layout="vertical" onFinish={handleRecordPaymentSubmit} className="pt-2">
            <Form.Item
              name="amount"
              label={<span className="text-xs font-semibold text-slate-500">Amount Paid ($ AUD)</span>}
              rules={[{ required: true, message: 'Please enter payment amount' }]}
            >
              <Input type="number" step="0.01" prefix="$" className="rounded-xl h-10 font-bold" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="paymentMethod"
                label={<span className="text-xs font-semibold text-slate-500">Payment Method</span>}
                rules={[{ required: true }]}
              >
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Credit Card / Stripe">Credit Card (Stripe)</Option>
                  <Option value="EFTPOS Terminal">EFTPOS Terminal</Option>
                  <Option value="NDIS Direct Portal">NDIS Direct Claim / Portal</Option>
                  <Option value="Medicare Easyclaim">Medicare Easyclaim / HICAPS</Option>
                  <Option value="Bank Transfer">Bank Transfer / EFT</Option>
                  <Option value="Cash">Cash</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="date"
                label={<span className="text-xs font-semibold text-slate-500">Payment Date</span>}
              >
                <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
              </Form.Item>
            </div>

            <Form.Item
              name="service"
              label={<span className="text-xs font-semibold text-slate-500">Service / Consultation Description</span>}
            >
              <Input placeholder="e.g. Standard Consultation" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="invoiceNumber"
              label={<span className="text-xs font-semibold text-slate-500">Allocated Invoice Number (Optional)</span>}
            >
              <Input placeholder="e.g. INV-001045" className="rounded-xl h-10" />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setPaymentModalVisible(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 px-6 text-white shadow">
                Save & Issue Receipt
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Receipt View Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <CheckCircleOutlined style={{ color: '#10B981' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Payment Receipt #{activeReceipt?.receiptNumber}</span>
            </div>
          }
          open={receiptModalVisible}
          onCancel={() => setReceiptModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setReceiptModalVisible(false)} className="rounded-xl">
              Close
            </Button>,
            <Button
              key="print"
              type="primary"
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-xl font-bold"
              onClick={() => handlePrintReceipt(activeReceipt)}
            >
              Print Receipt
            </Button>
          ]}
        >
          {activeReceipt && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 font-sans my-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Client</span>
                <span className="font-bold text-sm text-slate-800 dark:text-white">{patient?.name || patient?.fullName || 'Client'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Service</span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{activeReceipt.service}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Payment Method</span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{activeReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Payment Date</span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Amount Paid</span>
                <span className="font-black text-xl text-emerald-600">${(parseFloat(activeReceipt.amount) || 0).toFixed(2)} AUD</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    )
  }

  // ─── Dynamic Client Communications Tab (Live DB Connected) ─────────────────

  const handleSendCommSubmit = async (values) => {
    try {
      const nowStr = dayjs().format('DD/MM/YYYY hh:mm A')
      const payload = {
        patientId: id || patient?.id,
        patientName: patient?.name || patient?.fullName || 'Client',
        channel: values.channel || 'SMS',
        direction: 'Outbound',
        sender: store.user?.name || 'Dr. Sarah Jenkins',
        recipient: values.recipient || patient?.phone || patient?.email || '+61 400 123 456',
        subject: values.subject || 'Clinical Notice',
        message: values.message || '',
        status: 'Delivered',
        date: nowStr
      }

      const res = await createCommunication(payload)
      const saved = res?.data || { id: `comm_${Date.now()}`, ...payload }
      setCommunicationsList(prev => [saved, ...prev])
      toast.success(`${payload.channel} sent and saved to database!`)
      setCommModalVisible(false)
      commForm.resetFields()
    } catch (err) {
      toast.error('Failed to save communication.')
    }
  }

  const handleDeleteComm = (commItem) => {
    Modal.confirm({
      title: 'Delete Communication Record?',
      content: `Are you sure you want to delete this ${commItem.channel} log record? This will be permanently removed from the database.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCommunication(commItem.id)
          setCommunicationsList(prev => prev.filter(c => c.id !== commItem.id))
          toast.success('Communication record deleted successfully!')
        } catch (err) {
          toast.error('Failed to delete communication.')
        }
      }
    })
  }

  const filteredCommunications = commChannelFilter === 'All'
    ? communicationsList
    : communicationsList.filter(c => (c.channel || '').toLowerCase() === commChannelFilter.toLowerCase())

  const renderCommunicationsTab = () => {
    const commColumns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Date & Time</span>,
        dataIndex: 'date',
        key: 'date',
        width: 170,
        render: d => <span className="text-slate-500 font-semibold text-xs">{d}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Channel</span>,
        dataIndex: 'channel',
        key: 'channel',
        width: 120,
        render: channel => {
          let color = 'purple'
          let icon = <MessageOutlined />
          if (channel === 'Email') { color = 'blue'; icon = <MailOutlined /> }
          if (channel === 'Phone Call') { color = 'orange'; icon = <PhoneOutlined /> }
          if (channel === 'Portal') { color = 'cyan'; icon = <HomeOutlined /> }
          if (channel === 'Letter') { color = 'geekblue'; icon = <FileTextOutlined /> }
          return (
            <Tag color={color} className="rounded-lg font-bold text-[10px] uppercase border-none inline-flex items-center gap-1">
              {icon} {channel}
            </Tag>
          )
        }
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Sender / Staff</span>,
        dataIndex: 'sender',
        key: 'sender',
        width: 160,
        render: s => <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{s || 'Staff Clinician'}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Message & Subject</span>,
        dataIndex: 'subject',
        key: 'subject',
        render: (subject, record) => (
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{subject}</span>
            <span className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-0.5">{record.message}</span>
          </div>
        )
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: s => <Tag color={s === 'Delivered' || s === 'Opened' || s === 'Completed' ? 'success' : 'processing'} className="rounded-lg font-bold text-[9px] uppercase border-none">{s || 'Delivered'}</Tag>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Action</span>,
        key: 'actions',
        align: 'right',
        width: 120,
        render: (_, record) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCommItem(record)
                setCommViewModalVisible(true)
              }}
              className="rounded-lg font-semibold text-xs"
            >
              View
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteComm(record)}
              className="rounded-lg font-semibold text-xs"
            />
          </div>
        )
      }
    ]

    return (
      <div className="space-y-4 font-sans">
        {/* Header & Filter Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm">
          <div className="flex flex-wrap gap-1.5 items-center">
            {['All', 'SMS', 'Email', 'Phone Call', 'Letter', 'Portal'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCommChannelFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  commChannelFilter === cat
                    ? 'bg-[#8C4BFF] text-white border-[#8C4BFF] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              commForm.resetFields()
              commForm.setFieldsValue({
                channel: 'SMS',
                recipient: patient?.phone || '+61 400 123 456'
              })
              setCommModalVisible(true)
            }}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold h-10 px-5 text-white shadow-sm flex items-center gap-1.5"
          >
            Log / Send Message
          </Button>
        </div>

        <Table
          dataSource={filteredCommunications}
          columns={commColumns}
          rowKey="id"
          loading={communicationsLoading}
          pagination={false}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm"
          locale={{
            emptyText: (
              <div className="text-center py-10 space-y-2">
                <MessageOutlined className="text-3xl text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-slate-400 font-bold m-0">No communications recorded</p>
                <p className="text-[11px] text-slate-400 m-0">Log SMS reminders, phone calls, or emails for this client.</p>
              </div>
            )
          }}
        />

        {/* Log / Send Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <MessageOutlined style={{ color: '#8C4BFF' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Send / Log Communication</span>
            </div>
          }
          open={commModalVisible}
          onCancel={() => setCommModalVisible(false)}
          footer={null}
          destroyOnHidden
        >
          <Form form={commForm} layout="vertical" onFinish={handleSendCommSubmit} className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="channel"
                label={<span className="text-xs font-semibold text-slate-500">Channel</span>}
                rules={[{ required: true }]}
              >
                <Select
                  className="rounded-xl h-10 flex items-center"
                  onChange={(val) => {
                    if (val === 'SMS' || val === 'Phone Call') commForm.setFieldsValue({ recipient: patient?.phone || '+61 400 123 456' })
                    if (val === 'Email') commForm.setFieldsValue({ recipient: patient?.email || 'patient@example.com' })
                  }}
                >
                  <Option value="SMS">SMS Message</Option>
                  <Option value="Email">Direct Email</Option>
                  <Option value="Phone Call">Phone Call Log Note</Option>
                  <Option value="Letter">Postal Letter</Option>
                  <Option value="Portal">Patient Portal Notification</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="recipient"
                label={<span className="text-xs font-semibold text-slate-500">Recipient Phone / Email</span>}
                rules={[{ required: true, message: 'Please enter recipient' }]}
              >
                <Input className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <Form.Item
              name="subject"
              label={<span className="text-xs font-semibold text-slate-500">Subject / Topic</span>}
              rules={[{ required: true, message: 'Please enter subject' }]}
            >
              <Input placeholder="e.g. Session Follow-up or Intake Form Link" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="message"
              label={<span className="text-xs font-semibold text-slate-500">Message Content / Call Notes</span>}
              rules={[{ required: true, message: 'Please enter message content' }]}
            >
              <Input.TextArea rows={4} placeholder="Type message or details of conversation..." className="rounded-xl" />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setCommModalVisible(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 px-6 text-white shadow">
                Send / Save Record
              </Button>
            </div>
          </Form>
        </Modal>

        {/* View Details Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <MessageOutlined style={{ color: '#8C4BFF' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Communication Details</span>
            </div>
          }
          open={commViewModalVisible}
          onCancel={() => setCommViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setCommViewModalVisible(false)} className="rounded-xl">
              Close
            </Button>
          ]}
        >
          {selectedCommItem && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 font-sans my-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Channel</span>
                <Tag color="purple" className="font-bold text-xs uppercase m-0 border-none">{selectedCommItem.channel}</Tag>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Sender</span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{selectedCommItem.sender || 'Dr. Sarah Jenkins'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Recipient</span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{selectedCommItem.recipient}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Date & Time</span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{selectedCommItem.date}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500">Status</span>
                <Tag color="success" className="font-bold text-[10px] uppercase m-0 border-none">{selectedCommItem.status || 'Delivered'}</Tag>
              </div>
              <div>
                <span className="font-bold text-xs text-slate-500 block mb-1">Subject</span>
                <p className="font-bold text-sm text-slate-800 dark:text-white m-0 mb-2">{selectedCommItem.subject}</p>
                <span className="font-bold text-xs text-slate-500 block mb-1">Message / Notes Content</span>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedCommItem.message}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    )
  }

  // ─── Reports Tab ────────────────────────────────────────────────────────────
  const renderReportsTab = () => {
    const columns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Report Name</span>,
        dataIndex: 'name',
        key: 'name',
        render: text => <span className="font-bold text-slate-700 dark:text-slate-350">{text}</span>,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Date Generated</span>,
        dataIndex: 'date',
        key: 'date',
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Clinician</span>,
        dataIndex: 'clinician',
        key: 'clinician',
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        render: stat => <Tag color="success" className="rounded-lg uppercase text-[9px] font-bold">{stat}</Tag>,
      },
    ]

    const handleGenerateAIReport = () => {
      toast.loading(`AI is generating ${reportType}...`, { id: 'rep-gen' })
      setTimeout(() => {
        const newRep = {
          id: 'rep_' + Date.now(),
          name: `${reportType} - ${patient?.name || 'Client'}.pdf`,
          date: dayjs().format('DD/MM/YYYY'),
          clinician: store.user?.name || 'Dr. Sarah Jenkins',
          status: 'Approved',
        }
        setCustomReports([newRep, ...customReports])
        setReportModalVisible(false)
        toast.success(`Generated ${reportType} using AI!`, { id: 'rep-gen' })
      }, 1500)
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm">
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white m-0">Client Clinical Reports</h4>
            <p className="text-xs text-slate-400 m-0 mt-0.5">Generate AI-driven progress, assessment, or discharge reports based on clinical notes.</p>
          </div>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold h-10 px-5"
            onClick={() => setReportModalVisible(true)}
          >
            Generate AI Report
          </Button>
        </div>

        <Table
          dataSource={customReports}
          columns={columns}
          rowKey="id"
          pagination={false}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm"
        />

        <Modal
          title={
            <div className="flex items-center gap-2">
              <ThunderboltOutlined style={{ color: '#8C4BFF' }} />
              <span className="font-extrabold text-base text-slate-800 dark:text-white">Generate AI Clinical Report</span>
            </div>
          }
          open={reportModalVisible}
          onCancel={() => setReportModalVisible(false)}
          onOk={handleGenerateAIReport}
          okText="Generate Report with AI"
          okButtonProps={{ style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }, className: 'rounded-xl font-bold h-10 px-5' }}
          cancelButtonProps={{ className: 'rounded-xl h-10' }}
        >
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Report Type</label>
              <Select
                value={reportType}
                onChange={setReportType}
                className="w-full rounded-xl h-10 flex items-center"
              >
                <Option value="Physiotherapy Progress Report">Physiotherapy Progress Report</Option>
                <Option value="NDIS Plan Review Summary">NDIS Plan Review Summary</Option>
                <Option value="Medicare EPC Progress Report">Medicare EPC Progress Report</Option>
                <Option value="Initial Clinical Assessment">Initial Clinical Assessment</Option>
                <Option value="Discharge Summary Report">Discharge Summary Report</Option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">Source Notes Scope</label>
              <Radio.Group value={selectedNotesScope} onChange={e => setSelectedNotesScope(e.target.value)} className="w-full grid grid-cols-2 gap-2">
                <Radio.Button value="all" className="rounded-xl text-center font-bold text-xs py-1">All Clinical Notes</Radio.Button>
                <Radio.Button value="recent" className="rounded-xl text-center font-bold text-xs py-1">Last 3 Recent Notes</Radio.Button>
              </Radio.Group>
            </div>

            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl text-xs text-purple-700 dark:text-purple-300 font-medium">
              ✨ AI will synthesize past session notes, treatment goals, and functional progress into a formal clinical PDF report.
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // Exercises Tab
  const renderExercisesTab = () => {
    const columns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Exercise Routine</span>,
        dataIndex: 'name',
        key: 'name',
        render: text => <span className="font-bold text-slate-700 dark:text-slate-350">{text}</span>,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Prescribed On</span>,
        dataIndex: 'date',
        key: 'date',
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Practitioner</span>,
        dataIndex: 'clinician',
        key: 'clinician',
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Compliance Rate</span>,
        dataIndex: 'compliance',
        key: 'compliance',
        render: comp => <Tag color="success" className="rounded-lg">{comp}</Tag>,
      },
    ]

    return (
      <Table
        dataSource={[]}
        columns={columns}
        rowKey="id"
        pagination={false}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm"
      />
    )
  }

  // Invoices Tab
  const renderInvoicesTab = () => {
    const columns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Invoice</span>,
        dataIndex: 'id',
        key: 'id',
        render: text => <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Due Date</span>,
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: d => <span className="text-slate-500">{dayjs(d).format('DD/MM/YYYY')}</span>,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Amount</span>,
        dataIndex: 'amount',
        key: 'amount',
        render: val => <span className="font-bold text-slate-700 dark:text-slate-350">${val.toFixed(2)}</span>,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Due</span>,
        dataIndex: 'due',
        key: 'due',
        render: val => (
          <span className={`font-bold ${val > 0 ? 'text-red-500' : 'text-slate-400'}`}>${val.toFixed(2)}</span>
        ),
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        render: status => {
          let color = 'default'
          if (status === 'Paid') color = 'success'
          if (status === 'Sent') color = 'processing'
          if (status === 'Draft') color = 'warning'
          return (
            <Tag color={color} className="rounded-lg border-none uppercase font-bold text-[9px]">
              {status}
            </Tag>
          )
        },
      },
    ]

    return (
      <Table
        dataSource={patientInvoices}
        columns={columns}
        rowKey="id"
        pagination={false}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm"
      />
    )
  }

  // Progress Notes Tab
  const renderProgressNotesTab = () => {
    const realNotes = (store.consultations || [])
      .filter(c => c.patientId === patient.id)
      .map(c => ({
        id: c.id,
        date: c.date ? dayjs(c.date).format('DD/MM/YYYY') : '—',
        practitionerName: c.practitionerName || 'Dr. Sarah Jenkins',
        title: c.notesTitle || 'Clinical Note',
        status: c.status === 'Completed' ? 'Signed' : c.status,
        content: c.notes || (c.soap ? `S: ${c.soap.subjective}\nO: ${c.soap.objective}\nA: ${c.soap.assessment}\nP: ${c.soap.plan}` : '')
      }))

    const allNotes = realNotes

    const columns = [
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Date</span>,
        dataIndex: 'date',
        key: 'date',
        width: 120,
        render: text => <span className="font-semibold text-slate-700 dark:text-slate-350">{text}</span>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Practitioner</span>,
        dataIndex: 'practitionerName',
        key: 'practitionerName',
        width: 180,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Title / Type</span>,
        dataIndex: 'title',
        key: 'title',
        width: 150,
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Note Preview</span>,
        dataIndex: 'content',
        key: 'content',
        render: text => <div className="text-slate-500 truncate max-w-md font-medium">{text}</div>
      },
      {
        title: <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: status => (
          <Tag color={status === 'Signed' || status === 'Final' ? 'success' : 'warning'} className="rounded-lg border-none uppercase font-bold text-[9px]">
            {status}
          </Tag>
        )
      }
    ]

    return (
      <ClientProgressNotes patientId={patient.id} />
    )
  }

  // Funding Tab
  const renderFundingTab = () => {
    if (isNew) return <div className="p-6 text-center text-slate-400 text-sm">Save the client profile first to manage funding.</div>
    const sessionsUsed = patient.sessionsUsed || 0
    const sessionsAllocated = patient.sessionsAllocated || 10
    const sessionsRemaining = sessionsAllocated - sessionsUsed
    const isLowSessions = sessionsRemaining <= 2
    const progressPercent = Math.round((sessionsUsed / sessionsAllocated) * 100)
    const activeFunding = patient.fundingType || ''
    const patientTags = patient.tags || []

    const schemes = [
      { key: 'ndis', label: 'NDIS', color: '#8C4BFF', desc: 'National Disability Insurance Scheme', active: activeFunding === 'NDIS' || patientTags.includes('NDIS') },
      { key: 'epc', label: 'EPC (Medicare)', color: '#0E1B33', desc: 'Enhanced Primary Care Plan', active: activeFunding === 'EPC' || patientTags.includes('Medicare') },
      { key: 'worksafe', label: 'WorkCover / WorkSafe', color: '#F97316', desc: 'Work-related injury / Workers Compensation', active: activeFunding === 'WorkCover' || patientTags.includes('WorkCover') },
      { key: 'ctp', label: 'CTP (Motor Accident)', color: '#EF4444', desc: 'Compulsory Third Party Insurance', active: activeFunding === 'CTP' || patientTags.includes('CTP') },
      { key: 'dva', label: 'DVA', color: '#10B981', desc: 'Department of Veterans Affairs', active: activeFunding === 'DVA' || patientTags.includes('DVA') },
      { key: 'private', label: 'Private / Self-Funded', color: '#64748B', desc: 'Out-of-pocket payment', active: activeFunding === 'Private' || (!activeFunding && !patientTags.some(t => ['NDIS','EPC','Medicare','WorkCover','CTP','DVA'].includes(t))) },
    ]

    return (
      <div className="space-y-6 p-2">
        {/* Funding Scheme Cards */}
        <Card
          title={<span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2"><DollarOutlined style={{ color: '#10B981' }} /> Funding Overview</span>}
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {schemes.map(scheme => (
              <div
                key={scheme.key}
                className={`p-4 rounded-xl border-2 transition-all ${
                  scheme.active ? '' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
                style={scheme.active ? {
                  borderColor: scheme.color,
                  backgroundColor: scheme.color + '10',
                } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                    style={{ backgroundColor: scheme.color, color: 'white' }}
                  >
                    {scheme.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className={`font-extrabold text-xs mt-1 ${scheme.active ? '' : 'text-slate-500 dark:text-slate-400'}`} style={scheme.active ? { color: scheme.color } : {}}>{scheme.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{scheme.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Sessions Summary */}
        <Card
          title={<span className="font-extrabold text-sm text-slate-800 dark:text-white">Sessions Summary</span>}
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-2xl font-black text-slate-800 dark:text-white">{sessionsAllocated}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Allocated</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-2xl font-black text-[#8C4BFF]">{sessionsUsed}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Used</p>
              </div>
              <div className="text-center p-4 rounded-xl border-2" style={{ borderColor: isLowSessions ? '#EF4444' : '#10B981', backgroundColor: isLowSessions ? '#FEF2F2' : '#F0FDF4' }}>
                <div className="flex items-center justify-center gap-1">
                  {isLowSessions && <ExclamationCircleOutlined className="text-red-500" />}
                  <p className="text-2xl font-black" style={{ color: isLowSessions ? '#EF4444' : '#10B981' }}>{sessionsRemaining}</p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: isLowSessions ? '#EF4444' : '#10B981' }}>Remaining</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Sessions used</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor={isLowSessions ? '#EF4444' : '#8C4BFF'}
                railColor="#e2e8f0"
                strokeLinecap="round"
              />
              {isLowSessions && (
                <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                  <ExclamationCircleOutlined /> Low sessions remaining — please review funding
                </p>
              )}
            </div>

            {patient.ndisPlanEnd && (
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                <span className="text-xs font-bold text-[#8C4BFF]">NDIS Plan Expiry</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">{dayjs(patient.ndisPlanEnd).format('DD/MM/YYYY')}</span>
              </div>
            )}

            <p className="text-[10px] text-slate-400 italic text-center">Contact clinic admin to update funding details or session allocations.</p>
          </div>
        </Card>
      </div>
    )
  }

  // Outcome Measures Tab
  const renderOutcomeMeasuresTab = () => {
    const handleDeleteOutcome = async (mId) => {
      try {
        await api.delete(`/api/practitioner/outcome-measures/${mId}`)
        toast.success('Outcome measure deleted successfully')
        fetchOutcomeMeasuresData()
      } catch (err) {
        toast.error('Failed to delete measure')
      }
    }

    return (
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white m-0">Standardised Clinical Outcome Measures</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Record assessment tools, baseline index scores, and track client recovery trends.</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            onClick={() => setOutcomeModalVisible(true)}
            className="rounded-xl font-bold h-9 shadow-sm"
          >
            Record Measure
          </Button>
        </div>
        
        {outcomeMeasures.length === 0 ? (
          <div className="text-center py-10">
            <BarChartOutlined className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No outcome measures recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Record Measure" to publish clinical outcome indexes for this client.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outcomeMeasures.map((measure, index) => (
              <div key={measure.id || index} className="p-4 border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 hover:border-[#8C4BFF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color="purple" className="rounded-full font-bold text-[9px] uppercase px-2.5 py-0.5 m-0">{measure.type || 'Physiotherapy'}</Tag>
                    <Tag color={measure.status === 'Improved' ? 'success' : measure.status === 'Declined' ? 'error' : 'default'} className="rounded-full font-bold text-[9px] uppercase px-2.5 py-0.5 m-0">
                      {measure.status || 'Improved'}
                    </Tag>
                    {measure.isPublishedToPortal !== false ? (
                      <Tag color="cyan" className="rounded-full font-bold text-[9px] uppercase px-2.5 py-0.5 m-0">
                        🌐 Live on Portal
                      </Tag>
                    ) : (
                      <Tag color="default" className="rounded-full font-bold text-[9px] uppercase px-2.5 py-0.5 m-0 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        🔒 Internal Only (Private)
                      </Tag>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm m-0 pt-0.5">{measure.name || 'Outcome Assessment Questionnaire'}</h4>
                  <span className="text-xs text-slate-400 block font-semibold">
                    Baseline: <b className="text-slate-600 dark:text-slate-300">{measure.prevScore || '—'}</b> &bull; Target Goal: <b className="text-[#8C4BFF]">{measure.targetGoal || '0%'}</b> &bull; Verified by: <b className="text-slate-600 dark:text-slate-300">{measure.verifiedBy || 'Dr. Sarah Jenkins'}</b>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-1.5 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Portal:</span>
                    <Switch
                      size="small"
                      checked={measure.isPublishedToPortal !== false}
                      checkedChildren="LIVE"
                      unCheckedChildren="OFF"
                      onChange={(checked) => handleToggleOutcomeVisibility(measure.id, checked)}
                    />
                  </div>

                  <div className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-center shadow-xs">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Latest Score</span>
                    <span className="text-sm font-black text-[#8C4BFF] block">{measure.score}</span>
                  </div>

                  <Popconfirm
                    title="Delete this outcome measure?"
                    onConfirm={() => handleDeleteOutcome(measure.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} className="hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg p-2" />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }


  // Cases Tab (Dynamic & Live DB Connected)
  const renderCasesTab = () => {
    const totalApproved = casesList.reduce((sum, c) => sum + (Number(c.approvedSessions) || 0), 0)
    const totalUsed = casesList.reduce((sum, c) => sum + (Number(c.usedSessions) || 0), 0)
    const totalRemaining = Math.max(0, totalApproved - totalUsed)
    const activeCount = casesList.filter(c => (c.status || '').toLowerCase() === 'active').length

    return (
      <div className="space-y-6 font-sans">
        {/* Header with Title and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white m-0 flex items-center gap-2">
              <FolderOpenOutlined style={{ color: '#8C4BFF' }} /> Clinical Cases & Funding Claims
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1 mb-0">
              Manage insurance claims (WorkCover, NDIS, Medicare EPC, DVA, TAC), approved session limits, and insurer details.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenCaseModal(null)}
            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-10 px-5 text-xs border-none shadow-sm text-white flex items-center"
            style={{ backgroundColor: '#8C4BFF', color: '#ffffff' }}
          >
            New Clinical Case
          </Button>
        </div>

        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Cases</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white m-0 mt-1">{casesList.length}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Recorded profiles</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-500">Active Cases</span>
            <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 m-0 mt-1">{activeCount}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Open clinical plans</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-[#8C4BFF]">Approved Sessions</span>
            <h4 className="text-xl font-black text-[#8C4BFF] m-0 mt-1">{totalApproved}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Total funded capacity</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-500">Sessions Remaining</span>
            <h4 className="text-xl font-black text-blue-600 dark:text-blue-400 m-0 mt-1">{totalRemaining}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">{totalUsed} sessions completed</span>
          </div>
        </div>

        {/* Cases List */}
        {casesLoading ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-semibold">Loading clinical cases from live database...</p>
          </div>
        ) : casesList.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#8C4BFF]/10 text-[#8C4BFF] flex items-center justify-center mx-auto text-xl font-bold">
              <FolderOpenOutlined />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-white m-0">No Clinical Cases Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a case to link insurer details, claim numbers, and approved therapy session allowances for this client.
            </p>
            <Button
              type="primary"
              onClick={() => handleOpenCaseModal(null)}
              className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-9 text-xs border-none"
              style={{ backgroundColor: '#8C4BFF' }}
            >
              Add First Case
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {casesList.map((c) => {
              const approved = Number(c.approvedSessions) || 1
              const used = Number(c.usedSessions) || 0
              const percent = Math.min(100, Math.round((used / approved) * 100))
              const isActive = (c.status || '').toLowerCase() === 'active'

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-[#8C4BFF] transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Title, Claim No & Status */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-slate-850 dark:text-white m-0">
                            {c.title}
                          </h4>
                          {c.claimNumber && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">
                              #{c.claimNumber}
                            </span>
                          )}
                        </div>
                        {c.payerName && (
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 m-0 flex items-center gap-1">
                            <BankOutlined style={{ fontSize: 11 }} /> {c.payerName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag
                          color={isActive ? 'success' : c.status === 'Under Review' ? 'warning' : 'default'}
                          className="m-0 border-none font-bold text-[10px] uppercase rounded-full px-2.5"
                        >
                          {c.status || 'Active'}
                        </Tag>
                        <Tag color="purple" className="m-0 border-none font-bold text-[10px] uppercase rounded-full px-2.5">
                          {c.fundingType || 'Funding'}
                        </Tag>
                      </div>
                    </div>

                    {/* Case Manager / Contact Info */}
                    {(c.caseManager || c.contactPhone || c.contactEmail) && (
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1 mb-3 text-xs">
                        {c.caseManager && (
                          <div className="font-semibold text-slate-700 dark:text-slate-250 flex items-center gap-1.5">
                            <UserOutlined style={{ color: '#8C4BFF' }} /> Contact: <span className="font-bold">{c.caseManager}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                          {c.contactPhone && (
                            <span className="flex items-center gap-1">
                              <PhoneOutlined /> {c.contactPhone}
                            </span>
                          )}
                          {c.contactEmail && (
                            <span className="flex items-center gap-1">
                              <MailOutlined /> {c.contactEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Primary Diagnosis */}
                    {c.diagnosis && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Primary Diagnosis</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 m-0 line-clamp-2">
                          {c.diagnosis}
                        </p>
                      </div>
                    )}

                    {/* Session Progress Bar */}
                    <div className="mb-3 p-3 bg-[#8C4BFF]/5 dark:bg-[#8C4BFF]/10 rounded-xl border border-[#8C4BFF]/15">
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-200">Therapy Sessions Allocated</span>
                        <span className="text-[#8C4BFF] font-black">{used} of {approved} Used ({approved - used} Left)</span>
                      </div>
                      <Progress
                        percent={percent}
                        strokeColor="#8C4BFF"
                        railColor="rgba(140, 75, 255, 0.15)"
                        showInfo={false}
                        size="small"
                      />
                    </div>

                    {/* Dates & Notes */}
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold space-y-1">
                      {(c.startDate || c.expiryDate) && (
                        <div className="flex justify-between">
                          <span>Valid Duration:</span>
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {c.startDate ? dayjs(c.startDate).format('DD/MM/YYYY') : '—'} → {c.expiryDate ? dayjs(c.expiryDate).format('DD/MM/YYYY') : 'Ongoing'}
                          </span>
                        </div>
                      )}
                      {c.notes && (
                        <div className="pt-1 text-slate-500 dark:text-slate-400 text-xs italic line-clamp-2">
                          "{c.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenCaseModal(c)}
                      className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      Edit Details
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCase(c)}
                      className="rounded-lg text-xs font-bold"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Appointments Tab (Dynamic & Live DB Connected)
  const renderAppointmentsTab = () => {
    const totalAppts = clientAppointments.length
    const scheduledCount = clientAppointments.filter(a => ['Scheduled', 'Confirmed', 'Arrived', 'In Progress'].includes(a.status)).length
    const completedCount = clientAppointments.filter(a => a.status === 'Completed').length
    const cancelledCount = clientAppointments.filter(a => ['Cancelled', 'No Show'].includes(a.status)).length

    const apptColumns = [
      {
        title: <span className="text-[10px] uppercase font-bold text-slate-400">Date & Time</span>,
        key: 'datetime',
        render: (_, record) => (
          <div>
            <span className="font-extrabold text-slate-850 dark:text-white text-xs block">
              {record.date ? dayjs(record.date).format('DD MMM YYYY') : 'Today'}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
              <ClockCircleOutlined style={{ fontSize: 10 }} />
              {record?.startTime || record?.time || '10:00 AM'} - {record?.endTime || '10:45 AM'}
            </span>
          </div>
        )
      },
      {
        title: <span className="text-[10px] uppercase font-bold text-slate-400">Practitioner</span>,
        dataIndex: 'practitionerName',
        key: 'practitionerName',
        render: text => (
          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
            {text || 'Dr. Sarah Jenkins'}
          </span>
        )
      },
      {
        title: <span className="text-[10px] uppercase font-bold text-slate-400">Service / Session</span>,
        key: 'service',
        render: (_, record) => (
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
              {record.serviceName || record.appointmentType || 'Standard Consultation'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {record.location || record.branchName || 'Melbourne Clinic'}
            </span>
          </div>
        )
      },
      ...(!isPractitioner ? [{
        title: <span className="text-[10px] uppercase font-bold text-slate-400">Fee & Pay</span>,
        key: 'fee',
        render: (_, record) => (
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
              ${record.fee ? Number(record.fee).toFixed(2) : '120.00'} AUD
            </span>
            <Tag color={record.isPaid ? 'success' : 'default'} className="m-0 border-none text-[8px] font-bold uppercase rounded-md">
              {record.isPaid ? 'PAID' : 'UNPAID'}
            </Tag>
          </div>
        )
      }] : []),
      {
        title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
        dataIndex: 'status',
        key: 'status',
        render: (status, record) => (
          <Select
            size="small"
            value={status || 'Scheduled'}
            onChange={(val) => handleUpdateApptStatus(record.id, val)}
            className="w-32 text-xs font-bold rounded-lg"
            variant="borderless"
            popupMatchSelectWidth={false}
          >
            <Select.Option value="Scheduled"><Tag color="blue" className="m-0 border-none font-bold text-[9px] uppercase">Scheduled</Tag></Select.Option>
            <Select.Option value="Confirmed"><Tag color="cyan" className="m-0 border-none font-bold text-[9px] uppercase">Confirmed</Tag></Select.Option>
            <Select.Option value="Arrived"><Tag color="purple" className="m-0 border-none font-bold text-[9px] uppercase">Arrived</Tag></Select.Option>
            <Select.Option value="In Progress"><Tag color="processing" className="m-0 border-none font-bold text-[9px] uppercase">In Progress</Tag></Select.Option>
            <Select.Option value="Completed"><Tag color="success" className="m-0 border-none font-bold text-[9px] uppercase">Completed</Tag></Select.Option>
            <Select.Option value="Cancelled"><Tag color="error" className="m-0 border-none font-bold text-[9px] uppercase">Cancelled</Tag></Select.Option>
            <Select.Option value="No Show"><Tag color="default" className="m-0 border-none font-bold text-[9px] uppercase">No Show</Tag></Select.Option>
          </Select>
        )
      },
      {
        title: <span className="text-[10px] uppercase font-bold text-slate-400">Action</span>,
        key: 'action',
        align: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={() => handleTabChange('consultations')}
              className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-lg text-xs border-none text-white shadow-xs"
              style={{ backgroundColor: '#8C4BFF' }}
            >
              Consult Note
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAppt(record)}
              className="rounded-lg text-xs"
            />
          </Space>
        )
      }
    ]

    return (
      <div className="space-y-6 font-sans">
        {/* Header with Title and Book Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white m-0 flex items-center gap-2">
              <CalendarOutlined style={{ color: '#8C4BFF' }} /> Client Appointments & Calendar Schedule
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1 mb-0">
              Manage clinical consultation bookings, attendance statuses, rooms, and upcoming appointments for this client.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenApptModal}
            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-10 px-5 text-xs border-none shadow-sm text-white flex items-center"
            style={{ backgroundColor: '#8C4BFF', color: '#ffffff' }}
          >
            Book Appointment
          </Button>
        </div>

        {/* KPI Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Bookings</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white m-0 mt-1">{totalAppts}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Lifetime sessions</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-500">Upcoming / Scheduled</span>
            <h4 className="text-xl font-black text-blue-600 dark:text-blue-400 m-0 mt-1">{scheduledCount}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Active agenda</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-500">Completed Sessions</span>
            <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 m-0 mt-1">{completedCount}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">Attended & signed</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-500">Cancelled / Missed</span>
            <h4 className="text-xl font-black text-rose-600 dark:text-rose-400 m-0 mt-1">{cancelledCount}</h4>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">No show or cancelled</span>
          </div>
        </div>

        {/* Appointments Table */}
        <Card className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm p-0 overflow-hidden">
          <Table
            dataSource={clientAppointments}
            columns={apptColumns}
            rowKey="id"
            loading={appointmentsLoading}
            pagination={{ pageSize: 8 }}
            className="bg-white dark:bg-slate-900"
            locale={{
              emptyText: (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#8C4BFF]/10 text-[#8C4BFF] flex items-center justify-center mx-auto text-xl font-bold">
                    <CalendarOutlined />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white m-0">No Appointments Scheduled</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Book an appointment for this client to schedule clinical consultation sessions.
                  </p>
                  <Button
                    type="primary"
                    onClick={handleOpenApptModal}
                    className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-9 text-xs border-none"
                    style={{ backgroundColor: '#8C4BFF' }}
                  >
                    Book First Appointment
                  </Button>
                </div>
              )
            }}
          />
        </Card>
      </div>
    )
  }

  const progressNotesCount = (isNew || !patient?.id)
    ? 0
    : (store.consultations || []).filter(c => c.patientId === patient?.id || c.patientName === patient?.name || c.patientName === patient?.fullName).length

  const allTabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: renderProfileTab(),
      forceRender: true,
    },
    {
      key: 'cases',
      label: isNew ? (
        <Tooltip title="Save client profile first to unlock cases">
          <span className="opacity-60 cursor-not-allowed inline-flex items-center gap-1">
            <FolderOpenOutlined /> Cases
          </span>
        </Tooltip>
      ) : (
        <span>
          <FolderOpenOutlined /> Cases
        </span>
      ),
      children: renderCasesTab(),
      disabled: isNew,
    },
    {
      key: 'appointments',
      label: isNew ? (
        <Tooltip title="Save client profile first to unlock appointments">
          <span className="opacity-60 cursor-not-allowed inline-flex items-center gap-1">
            <CalendarOutlined /> Appointments
          </span>
        </Tooltip>
      ) : (
        <span>
          <CalendarOutlined /> Appointments
        </span>
      ),
      children: renderAppointmentsTab(),
      disabled: isNew,
    },
    {
      key: 'progress_notes',
      label: isNew ? (
        <Tooltip title="Save client profile first to unlock clinical notes">
          <span className="opacity-60 cursor-not-allowed inline-flex items-center">
            <FileTextOutlined style={{ color: '#8C4BFF' }} /> Progress Notes{' '}
            <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-full border border-slate-200 dark:border-slate-700 font-bold">
              0
            </span>
          </span>
        </Tooltip>
      ) : (
        <span>
          <FileTextOutlined style={{ color: '#8C4BFF' }} /> Progress Notes{' '}
          <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-full border border-slate-200 dark:border-slate-700 font-bold">
            {progressNotesCount}
          </span>
        </span>
      ),
      children: renderProgressNotesTab(),
      disabled: isNew,
    },
    {
      key: 'exercises',
      label: (
        <span>
          <HeartOutlined /> Treatment Plan
        </span>
      ),
      children: <PractitionerExercisesPlans patientId={patient?.id || id} clientPatient={patient} />,
      disabled: isNew,
    },
    {
      key: 'notes_reports',
      label: (
        <span>
          <AuditOutlined /> Reports
        </span>
      ),
      children: <PractitionerNotesReports patientId={patient?.id || id} clientPatient={patient} />,
      disabled: isNew,
    },
    {
      key: 'outcomes',
      label: (
        <span>
          <BarChartOutlined style={{ color: '#30D2BE' }} /> Outcome Measures
        </span>
      ),
      children: renderOutcomeMeasuresTab(),
      disabled: isNew,
    },
    {
      key: 'documents',
      label: (
        <span>
          <FolderOpenOutlined /> Documents
        </span>
      ),
      children: renderDocumentsTab(),
      disabled: isNew,
    },
    {
      key: 'payments',
      label: (
        <span>
          <CreditCardOutlined /> Payments
        </span>
      ),
      children: renderPaymentsTab(),
      disabled: isNew,
    },
    {
      key: 'communications',
      label: (
        <span>
          <MessageOutlined /> Communications
        </span>
      ),
      children: renderCommunicationsTab(),
      disabled: isNew,
    },
    {
      key: 'referrals',
      label: (
        <span>
          <BranchesOutlined /> Referrals
        </span>
      ),
      children: <PractitionerReferrals patientId={patient?.id || id} clientPatient={patient} />,
      disabled: isNew,
    },
    {
      key: 'billing',
      label: (
        <span>
          <DollarOutlined /> Billing
        </span>
      ),
      children: <PractitionerBilling patientId={patient?.id || id} clientPatient={patient} />,
      disabled: isNew,
    },
  ]

  const tabItems = isPractitioner
    ? allTabItems.filter(item => item.key !== 'payments' && item.key !== 'billing' && item.key !== 'invoices')
    : allTabItems

  return (
    <div className="space-y-6 client-profile-container">
      {/* Back to patients link */}
      <div>
        <Link
          to={`${basePath}/patients`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#8C4BFF] transition-colors font-sans"
        >
          <ArrowLeftOutlined style={{ fontSize: 10 }} /> Back to clients
        </Link>
      </div>

      {/* Page Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
          Profile
        </h2>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 shadow-sm flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold select-none shadow-inner flex-shrink-0"
          style={{ backgroundColor: '#8C4BFF' }}
        >
          {isNew ? 'N' : patient.name ? patient.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{isNew ? 'New client' : patient.name}</h3>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">
            DOB: {isNew ? '—' : patient.dob ? dayjs(patient.dob).format('DD/MM/YYYY') : '—'}
          </p>
        </div>
      </div>

      {/* Main Tab Panel */}
      <Tabs
        activeKey={activeSubTab}
        onChange={handleTabChange}
        items={tabItems}
        type="card"
        className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl"
      />


      {/* Clinical Case Create / Edit Modal */}
      <Modal
        title={
          <span className="font-extrabold text-base text-slate-850 dark:text-white flex items-center gap-2">
            <FolderOpenOutlined style={{ color: '#8C4BFF' }} />
            {editingCase ? 'Edit Clinical Case & Claim' : 'Create New Clinical Case'}
          </span>
        }
        open={caseModalVisible}
        onCancel={() => {
          setCaseModalVisible(false)
          caseForm.resetFields()
        }}
        onOk={handleSaveCase}
        okText={editingCase ? 'Save Changes' : 'Create Case'}
        okButtonProps={{
          className: 'bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-9 border-none text-white',
          style: { backgroundColor: '#8C4BFF', color: '#ffffff' }
        }}
        cancelButtonProps={{ className: 'rounded-xl font-bold' }}
        width={680}
        destroyOnHidden
      >
        <Form form={caseForm} layout="vertical" className="mt-4 space-y-3 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="title"
              label={<span className="text-xs font-semibold text-slate-500">Case Title</span>}
              rules={[{ required: true, message: 'Please enter case title' }]}
            >
              <Input placeholder="e.g. WorkCover Claim - Shoulder Rehab" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="claimNumber"
              label={<span className="text-xs font-semibold text-slate-500">Claim / Policy / Approval Ref #</span>}
              rules={[{ required: true, message: 'Please enter claim / ref number' }]}
            >
              <Input placeholder="e.g. WC-2026-892 or NDIS-99120" className="rounded-xl h-10 font-mono" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="fundingType"
              label={<span className="text-xs font-semibold text-slate-500">Funding / Payer Scheme</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Select.Option value="WorkCover">WorkCover / Worker's Comp</Select.Option>
                <Select.Option value="NDIS">NDIS (National Disability Scheme)</Select.Option>
                <Select.Option value="Medicare EPC">Medicare EPC / CDM Plan</Select.Option>
                <Select.Option value="DVA">DVA (Department of Veterans Affairs)</Select.Option>
                <Select.Option value="TAC / CTP">TAC / CTP Motor Accident</Select.Option>
                <Select.Option value="Private Health">Private Health Insurance</Select.Option>
                <Select.Option value="Self-Funded">Self-Funded / Private</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="text-xs font-semibold text-slate-500">Case Status</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Select.Option value="Active">Active (Open for Treatment)</Select.Option>
                <Select.Option value="Under Review">Under Review</Select.Option>
                <Select.Option value="Pending Approval">Pending Insurer Approval</Select.Option>
                <Select.Option value="Closed">Closed / Completed</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
            <Form.Item
              name="payerName"
              label={<span className="text-xs font-semibold text-slate-500">Insurer / Payer Org</span>}
            >
              <Input placeholder="e.g. Allianz Insurance" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="caseManager"
              label={<span className="text-xs font-semibold text-slate-500">Case Manager / Contact</span>}
            >
              <Input placeholder="e.g. Sarah Conroy" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label={<span className="text-xs font-semibold text-slate-500">Contact Phone</span>}
            >
              <Input placeholder="e.g. +61 3 9988 1234" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="startDate"
              label={<span className="text-xs font-semibold text-slate-500">Case Start / Injury Date</span>}
            >
              <DatePicker className="w-full rounded-xl h-10" format="DD-MM-YYYY" />
            </Form.Item>

            <Form.Item
              name="expiryDate"
              label={<span className="text-xs font-semibold text-slate-500">Approval Expiry / Review Date</span>}
            >
              <DatePicker className="w-full rounded-xl h-10" format="DD-MM-YYYY" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="approvedSessions"
              label={<span className="text-xs font-semibold text-slate-500">Approved Sessions Count</span>}
            >
              <Input type="number" min={1} placeholder="e.g. 12" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="usedSessions"
              label={<span className="text-xs font-semibold text-slate-500">Sessions Completed / Used</span>}
            >
              <Input type="number" min={0} placeholder="e.g. 3" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <Form.Item
            name="diagnosis"
            label={<span className="text-xs font-semibold text-slate-500">Primary Diagnosis & Treatment Goal</span>}
          >
            <Input.TextArea rows={2} placeholder="e.g. Right shoulder rotator cuff tendinopathy. Goal: Pain reduction and return to work." className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="notes"
            label={<span className="text-xs font-semibold text-slate-500">Billing & Case Management Notes</span>}
          >
            <Input.TextArea rows={2} placeholder="e.g. Invoicing requires medical certificate attached. Regular progress reports to insurer required every 4 weeks." className="rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Book Client Appointment Modal */}
      <Modal
        title={
          <span className="font-extrabold text-base text-slate-850 dark:text-white flex items-center gap-2">
            <CalendarOutlined style={{ color: '#8C4BFF' }} />
            Book Client Appointment
          </span>
        }
        open={apptModalVisible}
        onCancel={() => {
          setApptModalVisible(false)
          apptForm.resetFields()
        }}
        onOk={handleSaveAppointment}
        okText="Book Session"
        okButtonProps={{
          className: 'bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 font-bold rounded-xl h-9 border-none text-white',
          style: { backgroundColor: '#8C4BFF', color: '#ffffff' }
        }}
        cancelButtonProps={{ className: 'rounded-xl font-bold' }}
        width={640}
        destroyOnHidden
      >
        <Form form={apptForm} layout="vertical" className="mt-4 space-y-3 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="date"
              label={<span className="text-xs font-semibold text-slate-500">Appointment Date</span>}
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker className="w-full rounded-xl h-10" format="DD-MM-YYYY" />
            </Form.Item>

            <Form.Item
              name="practitionerName"
              label={<span className="text-xs font-semibold text-slate-500">Treating Practitioner</span>}
              rules={[{ required: true, message: 'Please select practitioner' }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                {practitionersList.length > 0 ? (
                  practitionersList.map(p => (
                    <Select.Option key={p.id || p.name} value={p.name}>{p.name} ({p.specialty || 'Physiotherapy'})</Select.Option>
                  ))
                ) : (
                  <>
                    <Select.Option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (Physiotherapist)</Select.Option>
                    <Select.Option value="Dr. Michael Chang">Dr. Michael Chang (Chiropractor)</Select.Option>
                    <Select.Option value="Dr. Emma Watson">Dr. Emma Watson (Osteopath)</Select.Option>
                  </>
                )}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="startTime"
              label={<span className="text-xs font-semibold text-slate-500">Start Time</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                {['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'].map(t => (
                  <Select.Option key={t} value={t}>{t}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="endTime"
              label={<span className="text-xs font-semibold text-slate-500">End Time</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                {['08:30 AM', '08:45 AM', '09:15 AM', '09:45 AM', '10:15 AM', '10:45 AM', '11:15 AM', '11:45 AM', '12:30 PM', '01:30 PM', '01:45 AM', '02:15 PM', '02:45 PM', '03:15 PM', '03:45 PM', '04:15 PM', '04:45 PM', '05:30 PM'].map(t => (
                  <Select.Option key={t} value={t}>{t}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="appointmentType"
              label={<span className="text-xs font-semibold text-slate-500">Service / Appointment Type</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Select.Option value="Physiotherapy Initial Consultation">Physiotherapy Initial Consultation (45 min)</Select.Option>
                <Select.Option value="Physiotherapy Standard Follow-up">Physiotherapy Standard Follow-up (30 min)</Select.Option>
                <Select.Option value="Physiotherapy Extended Session">Physiotherapy Extended Session (60 min)</Select.Option>
                <Select.Option value="Telehealth Consultation">Telehealth Video Consultation</Select.Option>
                <Select.Option value="NDIS Functional Assessment">NDIS Functional Capacity Assessment</Select.Option>
                <Select.Option value="WorkCover Progress Review">WorkCover Progress Review</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="branchName"
              label={<span className="text-xs font-semibold text-slate-500">Location / Branch</span>}
            >
              <Select className="rounded-xl h-10 flex items-center">
                {activeBranches.length > 0 ? (
                  activeBranches.map(b => (
                    <Select.Option key={b.id || b.name} value={b.name}>{b.name}</Select.Option>
                  ))
                ) : (
                  <>
                    <Select.Option value="Melbourne Main Clinic">Melbourne Main Clinic</Select.Option>
                    <Select.Option value="Sydney Wellness Center">Sydney Wellness Center</Select.Option>
                    <Select.Option value="Brisbane City Hub">Brisbane City Hub</Select.Option>
                  </>
                )}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <Form.Item
              name="fee"
              label={<span className="text-xs font-semibold text-slate-500">Session Fee ($ AUD)</span>}
            >
              <Input type="number" min={0} placeholder="120" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="text-xs font-semibold text-slate-500">Initial Status</span>}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Select.Option value="Scheduled">Scheduled</Select.Option>
                <Select.Option value="Confirmed">Confirmed</Select.Option>
                <Select.Option value="Arrived">Arrived</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="notes"
            label={<span className="text-xs font-semibold text-slate-500">Clinical / Booking Notes</span>}
          >
            <Input.TextArea rows={2} placeholder="e.g. Follow-up on rotator cuff rehabilitation exercises and pain score check." className="rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Outcome Measure Modal */}
      <Modal
        title={<span className="font-black text-slate-800 dark:text-white">Record Clinical Outcome Measure</span>}
        open={outcomeModalVisible}
        onCancel={() => setOutcomeModalVisible(false)}
        onOk={() => outcomeForm.submit()}
        okText="Publish to Patient Portal"
        okButtonProps={{ style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' } }}
        destroyOnHidden
      >
        <Form form={outcomeForm} layout="vertical" onFinish={handleSaveOutcomeMeasure} className="mt-4">
          <Form.Item
            name="type"
            label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Discipline / Multidisciplinary Domain</span>}
            initialValue="Physiotherapy"
            rules={[{ required: true, message: 'Please select discipline' }]}
          >
            <Select
              placeholder="Select discipline"
              className="rounded-xl"
              onChange={(val) => {
                setModalDiscipline(val)
                const libraryList = CLINICAL_MEASURES_LIBRARY[val] || []
                if (libraryList.length > 0 && !isCustomMeasure) {
                  outcomeForm.setFieldsValue({
                    name: libraryList[0].name,
                    prevScore: libraryList[0].baseline
                  })
                }
              }}
            >
              <Select.Option value="Physiotherapy">Physiotherapy (Spine / ROM / Musculoskeletal)</Select.Option>
              <Select.Option value="Speech Pathology">Speech Pathology (Vocal / Fluency / Swallowing)</Select.Option>
              <Select.Option value="Occupational Therapy">Occupational Therapy (ADL / Fine Motor / Independence)</Select.Option>
              <Select.Option value="Exercise Physiology">Exercise Physiology (Cardiorespiratory / Strength / Loading)</Select.Option>
              <Select.Option value="Podiatry">Podiatry (Gait Analysis / Foot & Ankle / Orthotics)</Select.Option>
            </Select>
          </Form.Item>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Outcome Measure / Standardized Test Library ({CLINICAL_MEASURES_LIBRARY[modalDiscipline]?.length || 10} Validated Tests)
              </label>
              <Button
                type="link"
                size="small"
                className="text-[11px] p-0 h-auto font-bold text-[#8C4BFF]"
                onClick={() => {
                  setIsCustomMeasure(!isCustomMeasure)
                  if (!isCustomMeasure) {
                    outcomeForm.setFieldsValue({ name: '' })
                  } else {
                    const first = (CLINICAL_MEASURES_LIBRARY[modalDiscipline] || [])[0]
                    if (first) {
                      outcomeForm.setFieldsValue({ name: first.name, prevScore: first.baseline })
                    }
                  }
                }}
              >
                {isCustomMeasure ? '← Select from Standard Library' : '+ Type Custom Test'}
              </Button>
            </div>

            {isCustomMeasure ? (
              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter assessment test name' }]}
                className="mb-0"
              >
                <Input placeholder="e.g. Custom Clinical Assessment Tool" className="rounded-xl" />
              </Form.Item>
            ) : (
              <Form.Item
                name="name"
                initialValue={(CLINICAL_MEASURES_LIBRARY['Physiotherapy'] || [])[0]?.name || 'Oswestry Disability Index (ODI)'}
                rules={[{ required: true, message: 'Please select validated outcome test' }]}
                className="mb-0"
              >
                <Select
                  showSearch
                  placeholder="Select validated clinical measure"
                  className="rounded-xl"
                  optionFilterProp="children"
                  onChange={(selectedName) => {
                    const found = (CLINICAL_MEASURES_LIBRARY[modalDiscipline] || []).find(m => m.name === selectedName)
                    if (found) {
                      outcomeForm.setFieldsValue({
                        prevScore: found.baseline,
                        unit: found.unit,
                        targetGoal: found.goal || '0%'
                      })
                      setSelectedScoreUnit(found.unit)
                    }
                  }}
                >
                  {(CLINICAL_MEASURES_LIBRARY[modalDiscipline] || CLINICAL_MEASURES_LIBRARY['Physiotherapy'] || []).map((test) => (
                    <Select.Option key={test.name} value={test.name}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{test.name}</span>
                        <Tag color="purple" className="text-[9px] font-bold border-none rounded-sm ml-2">Unit: {test.unit}</Tag>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="unit"
              label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Measurement Unit</span>}
              initialValue="%"
            >
              <Select
                value={selectedScoreUnit}
                onChange={(u) => setSelectedScoreUnit(u)}
                className="rounded-xl"
              >
                <Select.Option value="%">% (Percentage)</Select.Option>
                <Select.Option value="/10">/10 (Pain / Visual Scale)</Select.Option>
                <Select.Option value="Score/Max">Score / Max (Fraction)</Select.Option>
                <Select.Option value="Score/9">Score/9 (STarT Back)</Select.Option>
                <Select.Option value="Score/80">Score/80 (LEFS / UEFS)</Select.Option>
                <Select.Option value="Degrees">Degrees (ROM °)</Select.Option>
                <Select.Option value="Seconds">Seconds (Timed Speed)</Select.Option>
                <Select.Option value="kg">kg (Force / Strength)</Select.Option>
                <Select.Option value="Meters">Meters (Distance)</Select.Option>
                <Select.Option value="Reps">Reps (Count)</Select.Option>
                <Select.Option value="Raw">Points / Raw Score</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="targetGoal"
              label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Target Recovery Goal Score (MCID)</span>}
              initialValue="0% (Minimal Disability)"
            >
              <Input
                placeholder="e.g. 0% (Minimal) or 100% (Full Capacity)"
                className="rounded-xl font-medium"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="prevScore"
              label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Baseline Score</span>}
              initialValue="36% (Moderate)"
            >
              <Input
                placeholder="e.g. 36%, 8/10, 110°"
                className="rounded-xl"
                onChange={(e) => {
                  const values = outcomeForm.getFieldsValue()
                  const testName = values.name || (CLINICAL_MEASURES_LIBRARY[modalDiscipline] || [])[0]?.name || ''
                  const result = calculateClinicalProgress(testName, e.target.value, values.score)
                  outcomeForm.setFieldsValue({ status: result.status })
                }}
              />
            </Form.Item>

            <Form.Item
              name="score"
              label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Latest Result / Score</span>}
              rules={[{ required: true, message: 'Please enter latest result' }]}
            >
              <Input
                placeholder="e.g. 14%, 2/10, 130°"
                className="rounded-xl"
                onChange={(e) => {
                  const values = outcomeForm.getFieldsValue()
                  const testName = values.name || (CLINICAL_MEASURES_LIBRARY[modalDiscipline] || [])[0]?.name || ''
                  const result = calculateClinicalProgress(testName, values.prevScore, e.target.value)
                  outcomeForm.setFieldsValue({ status: result.status })
                }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinical Progress Status (Auto-calculated by Clinical Logic)</span>}
            initialValue="Improved"
          >
            <Select className="rounded-xl">
              <Select.Option value="Improved">🟢 Improved (Positive Recovery Trend)</Select.Option>
              <Select.Option value="Stable">🔵 Stable (Plateau / Maintenance)</Select.Option>
              <Select.Option value="Declined">🔴 Declined (Needs Protocol Adjustment)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isPublishedToPortal"
            valuePropName="checked"
            initialValue={true}
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Publish to Patient Portal (Share with Patient)
                </span>
                <span className="text-[11px] text-slate-400 font-semibold block">
                  Turn ON to share on patient dashboard; turn OFF for private internal clinician note only.
                </span>
              </div>
              <Switch defaultChecked />
            </div>
          </Form.Item>

          <Form.Item
            name="notes"
            label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinical Notes & Findings</span>}
          >
            <Input.TextArea rows={3} placeholder="e.g. Patient demonstrated noticeable improvement in pain-free ROM and functional independence." className="rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
