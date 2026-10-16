import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Select, Checkbox, Space, Card, Radio, Table, Modal, Button, Tag, Divider, Tabs, Tooltip } from 'antd'
import {
  ApiOutlined,
  FileTextOutlined,
  MailOutlined,
  FormOutlined,
  AuditOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
  TagOutlined,
  DatabaseOutlined,
  LockOutlined,
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  PictureOutlined,
  StarOutlined,
  HeartOutlined,
  WarningOutlined,
  FlagOutlined,
  SmileOutlined,
  CrownOutlined,
  FireOutlined,
  AlertOutlined,
  SettingOutlined,
  MobileOutlined,
  ApartmentOutlined,
  UserAddOutlined,
  FolderOutlined,
  DownOutlined,
  RightOutlined,
  SearchOutlined
} from '@ant-design/icons'
import api from '../../../api/axios'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import {
  getIntegrations as getIntegrationsApi,
  updateIntegration as updateIntegrationApi,
  testIntegration as testIntegrationApi,
  getClinicSettingsTemplates,
  createClinicSettingsTemplate,
  updateClinicSettingsTemplate,
  deleteClinicSettingsTemplate,
  updateInvoiceTemplates as updateInvoiceTemplatesApi,
  getClinicServices,
  createClinicService,
  updateClinicService,
  deleteClinicService,
  getClinicCancellationReasons,
  createClinicCancellationReason,
  updateClinicCancellationReason,
  deleteClinicCancellationReason,
  getClinicClientTags,
  createClinicClientTag,
  updateClinicClientTag,
  deleteClinicClientTag,
  clearSampleTestData
} from '../api/settingsApi'
import PatientSettings from '../../dashboard/components/patient/PatientSettings'
import ClinicDetailsTab from '../components/ClinicDetailsTab'
import SubscriptionPage from './SubscriptionPage'
import RolesPermissionsTab from '../components/RolesPermissionsTab'
import AdminPage from './AdminPage'
import BranchPage from './BranchPage'
import DoctorsManagePage from './DoctorsManagePage'

export const tagIconsMap = {
  TagOutlined: <TagOutlined />,
  StarOutlined: <StarOutlined />,
  HeartOutlined: <HeartOutlined />,
  WarningOutlined: <WarningOutlined />,
  FlagOutlined: <FlagOutlined />,
  LockOutlined: <LockOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  InfoCircleOutlined: <InfoCircleOutlined />,
  ApiOutlined: <ApiOutlined />,
  AuditOutlined: <AuditOutlined />,
  SmileOutlined: <SmileOutlined />,
  CrownOutlined: <CrownOutlined />,
  FireOutlined: <FireOutlined />,
  AlertOutlined: <AlertOutlined />,
}

export function renderTagIcon(iconName) {
  return tagIconsMap[iconName] || <TagOutlined />
}

export const TAG_COLOR_PALETTE = [
  { name: 'Royal Purple', hex: '#8C4BFF' },
  { name: 'Deep Violet', hex: '#7C3AED' },
  { name: 'Lavender', hex: '#A855F7' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Ocean Blue', hex: '#3B82F6' },
  { name: 'Cobalt', hex: '#2563EB' },
  { name: 'Sky Blue', hex: '#0EA5E9' },
  { name: 'Cyan Blue', hex: '#0284C7' },
  { name: 'Teal Green', hex: '#30D2BE' },
  { name: 'Mint Emerald', hex: '#14B8A6' },
  { name: 'Vibrant Green', hex: '#10B981' },
  { name: 'Forest Green', hex: '#059669' },
  { name: 'Amber Glow', hex: '#F59E0B' },
  { name: 'Warm Orange', hex: '#F97316' },
  { name: 'Tangerine', hex: '#EA580C' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Ruby Red', hex: '#DC2626' },
  { name: 'Rose Coral', hex: '#F43F5E' },
  { name: 'Hot Pink', hex: '#EC4899' },
  { name: 'Magenta', hex: '#DB2777' },
  { name: 'Slate Gray', hex: '#64748B' },
  { name: 'Cool Steel', hex: '#475569' },
  { name: 'Charcoal Dark', hex: '#1E293B' },
  { name: 'Midnight Navy', hex: '#0E1B33' }
]

const { Option } = Select
const SHOW_2FA = true

// ── Utility: parse browser + OS from userAgent ───────────────────────────────
function parseUserAgent(ua = navigator.userAgent) {
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'
  // Browser detection
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer'
  // OS detection
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1'
  else if (/Windows NT 6\.1/.test(ua)) os = 'Windows 7'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = 'macOS'
  else if (/iPhone/.test(ua)) os = 'iPhone'
  else if (/iPad/.test(ua)) os = 'iPad'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Linux/.test(ua)) os = 'Linux'
  return `${browser} / ${os}`
}

function buildCurrentSessionRows() {
  const deviceLabel = parseUserAgent()
  const now = new Date()
  const fmt = (d) => d.toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  // Try to get a stored prior login time from localStorage
  const stored = localStorage.getItem('zhealth_last_login_ts')
  const rows = [
    { key: '1', device: `${deviceLabel} (Current)`, ip: '—', time: fmt(now), location: 'Current Session', status: 'Active Session' },
  ]
  if (stored) {
    const prev = new Date(Number(stored))
    rows.push({ key: '2', device: deviceLabel, ip: '—', time: fmt(prev), location: 'Previous Session', status: 'Expired' })
  }
  // Record this visit
  localStorage.setItem('zhealth_last_login_ts', String(now.getTime()))
  return rows
}

export default function ClinicAdminSettingsPage() {
  const [activeTemplateTab, setActiveTemplateTab] = useState('forms');
  const store = useClinicStore()
  const navigate = useNavigate()
  const userRole = store.userRole

  if (userRole === 'patient') {
    return <PatientSettings />
  }

  // Filter tabs by user role (memoized to prevent infinite useEffect loops)
  const tabs = React.useMemo(() => {
    switch (userRole) {
      case 'patient':
        return [
          { key: 'security', label: 'Security', icon: <LockOutlined /> }
        ]
      case 'sales':
        return [
          { key: 'security', label: 'Security', icon: <LockOutlined /> }
        ]
      case 'practitioner':
        return [
          { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
          { key: 'security', label: 'Security', icon: <LockOutlined /> },
          { key: 'templates', label: 'Templates', icon: <FolderOutlined /> }
        ]
      case 'clinic':
      case 'clinic-admin':
      case 'clinic_admin':
      case 'head_admin':
      default:
        return [
          { key: 'clinic_details', label: 'Clinic Details', icon: <BankOutlined /> },
          { key: 'branch', label: 'Branch', icon: <ApartmentOutlined /> },
          { key: 'admin', label: 'Admin', icon: <UserOutlined /> },
          { key: 'practitioners', label: 'Practitioners', icon: <UserAddOutlined /> },
          { key: 'integrations', label: 'Integrations', icon: <ApiOutlined /> },
          { key: 'templates', label: 'Templates', icon: <FolderOutlined /> },
          { key: 'services', label: 'Services', icon: <AppstoreOutlined /> },
          { key: 'cancellation', label: 'Cancellation Reasons', icon: <CloseCircleOutlined /> },
          { key: 'tags', label: 'Client Tags', icon: <TagOutlined /> },
          { key: 'import_export', label: 'Import Export', icon: <DatabaseOutlined /> },
          { key: 'security', label: 'Security', icon: <LockOutlined /> }
        ]
    }
  }, [userRole])

  // Initialize activeTab according to role defaults to avoid showing unauthorized tabs on mount
  const [activeTab, setActiveTab] = useState(() => {
    switch (userRole) {
      case 'patient':
      case 'sales':
        return 'security'
      case 'practitioner':
        return 'profile'
      case 'clinic':
      case 'head_admin':
      default:
        return 'clinic_details'
    }
  })

  // Sync activeTab state when userRole changes
  React.useEffect(() => {
    const allowedKeys = tabs.flatMap((t) => t.subItems ? [t.key, ...t.subItems.map(s => s.key)] : [t.key])
    if (!allowedKeys.includes(activeTab)) {
      setActiveTab(tabs[0]?.key || 'clinic_details')
    }
  }, [tabs, activeTab])

  // Integrations DB State & Handlers
  const [integrationsList, setIntegrationsList] = useState([])
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)
  const [integrationsSearch, setIntegrationsSearch] = useState('')
  const [integrationsCategoryFilter, setIntegrationsCategoryFilter] = useState('All')
  const [integrationsStatusFilter, setIntegrationsStatusFilter] = useState('All')
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [testingIntegrationId, setTestingIntegrationId] = useState(null)
  const [configForm] = Form.useForm()

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true)
    try {
      const res = await getIntegrationsApi()
      if (res && res.success && Array.isArray(res.data)) {
        setIntegrationsList(res.data)
        useClinicStore.setState({ integrations: res.data })
      }
    } catch (err) {
      console.error("Failed to fetch live database integrations:", err)
    } finally {
      setLoadingIntegrations(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrations()
    }
  }, [activeTab])

  const handleOpenConfigure = (item) => {
    setSelectedIntegration(item)
    configForm.resetFields()
    configForm.setFieldsValue({
      ...(item.config || {}),
      name: item.name
    })
    setConfigModalVisible(true)
  }

  const handleSaveIntegrationConfig = async (values) => {
    if (!selectedIntegration) return
    try {
      const res = await updateIntegrationApi(selectedIntegration.id, {
        config: values,
        connected: true,
        status: 'Connected',
        lastSync: new Date().toLocaleString()
      })
      if (res && res.success && Array.isArray(res.data)) {
        setIntegrationsList(res.data)
        useClinicStore.setState({ integrations: res.data })
        toast.success(`${selectedIntegration.name} configuration saved & connected successfully!`)
        setConfigModalVisible(false)
      } else {
        toast.error('Failed to save integration configuration')
      }
    } catch (err) {
      console.error("Error saving integration config:", err)
      toast.error('Failed to save integration settings')
    }
  }

  const handleTestIntegration = async (item, currentFormValues = null) => {
    setTestingIntegrationId(item.id)
    try {
      const payloadConfig = currentFormValues || item.config || {}
      const res = await testIntegrationApi(item.id, { config: payloadConfig })
      if (res && res.success) {
        if (res.data) {
          setIntegrationsList(res.data)
          useClinicStore.setState({ integrations: res.data })
        }
        toast.success(res.message || `Test connection to ${item.name} succeeded (${res.latency || '35ms'})!`)
      } else {
        toast.error(res.message || `Test connection to ${item.name} failed`)
      }
    } catch (err) {
      const errDetail = err?.response?.data?.message || err?.message || 'Connection timeout or invalid API credentials'
      toast.error(errDetail)
      // Update status to Error in state
      setIntegrationsList(prev => prev.map(i => i.id === item.id ? { ...i, status: 'Error', errorMessage: errDetail } : i))
    } finally {
      setTestingIntegrationId(null)
    }
  }

  const handleToggleIntegration = async (item) => {
    const nextStatus = item.status === 'Connected' ? 'Disconnected' : 'Connected'
    const nextConnected = nextStatus === 'Connected'
    try {
      const res = await updateIntegrationApi(item.id, {
        connected: nextConnected,
        status: nextStatus,
        lastSync: nextConnected ? new Date().toLocaleString() : item.lastSync
      })
      if (res && res.success && Array.isArray(res.data)) {
        setIntegrationsList(res.data)
        useClinicStore.setState({ integrations: res.data })
        toast.success(`${item.name} is now ${nextStatus} in live database!`)
      } else {
        toast.error('Failed to update integration in database')
      }
    } catch (err) {
      console.error("Error updating integration in database:", err)
      toast.error('Error updating integration in live database')
    }
  }

  const handleSyncIntegration = async (item) => {
    try {
      const nowStr = new Date().toLocaleString()
      const res = await updateIntegrationApi(item.id, { connected: true, status: 'Connected', lastSync: nowStr })
      if (res && res.success && Array.isArray(res.data)) {
        setIntegrationsList(res.data)
        useClinicStore.setState({ integrations: res.data })
        toast.success(`Synced details from ${item.name} into live database!`)
      }
    } catch (err) {
      console.error("Error syncing integration:", err)
      toast.error('Failed to sync integration with live database')
    }
  }

  // Templates Live DB State & Handlers
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [formsSearch, setFormsSearch] = useState('')
  const [formsCategoryFilter, setFormsCategoryFilter] = useState('All')
  const [lettersSearch, setLettersSearch] = useState('')
  const [lettersStatusFilter, setLettersStatusFilter] = useState('All')

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await getClinicSettingsTemplates()
      if (res && res.success && res.data) {
        const { forms, letters, notes, invoiceTemplates } = res.data
        useClinicStore.setState({
          ...(forms && { formTemplates: forms }),
          ...(letters && { letterTemplates: letters }),
          ...(notes && { noteTemplates: notes }),
          ...(invoiceTemplates && { invoiceTemplates: invoiceTemplates })
        })
        if (notes && notes.length > 0 && !selectedNote) {
          setSelectedNote(notes[0])
        }
      }
    } catch (err) {
      console.error("Failed to fetch live database templates:", err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  React.useEffect(() => {
    if (['templates', 'forms', 'letters', 'notes'].includes(activeTab)) {
      fetchTemplates()
    }
  }, [activeTab])

  // Services Live DB State & Handlers
  const [loadingServices, setLoadingServices] = useState(false)
  const [servicesSearch, setServicesSearch] = useState('')

  const fetchServices = async () => {
    setLoadingServices(true)
    try {
      const res = await getClinicServices()
      if (res && res.success && res.data) {
        useClinicStore.setState({ services: res.data })
      }
    } catch (err) {
      console.error("Failed to fetch live database services:", err)
    } finally {
      setLoadingServices(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'services') {
      fetchServices()
    }
  }, [activeTab])

  const handleSaveServiceDB = async (values) => {
    try {
      if (editingService) {
        const res = await updateClinicService(editingService.id, values)
        if (res && res.success && res.data) {
          useClinicStore.setState((state) => ({
            services: state.services.map((s) => (s.id === editingService.id ? res.data : s))
          }))
          toast.success('Service updated in live database!')
        }
      } else {
        const res = await createClinicService(values)
        if (res && res.success && res.data) {
          useClinicStore.setState((state) => ({
            services: [res.data, ...state.services]
          }))
          toast.success('New service added to live database!')
        }
      }
      setServiceModalOpen(false)
    } catch (err) {
      console.error("Service save error:", err)
      toast.error('Failed to save service to live database')
    }
  }

  const handleArchiveServiceDB = async (record) => {
    try {
      const newArchivedState = !record.archived
      const res = await updateClinicService(record.id, { archived: newArchivedState })
      if (res && res.success && res.data) {
        useClinicStore.setState((state) => ({
          services: state.services.map((s) => (s.id === record.id ? res.data : s))
        }))
        toast.success(`Service "${record.name}" ${newArchivedState ? 'archived' : 'activated'} in live database!`)
      }
    } catch (err) {
      console.error("Service archive error:", err)
      toast.error('Failed to update service status')
    }
  }

  const handleDeleteServiceDB = async (id, name) => {
    try {
      const res = await deleteClinicService(id)
      if (res && res.success) {
        useClinicStore.setState((state) => ({
          services: state.services.filter((s) => s.id !== id)
        }))
        toast.success(`Removed service "${name}" from live database!`)
      }
    } catch (err) {
      console.error("Service delete error:", err)
      toast.error('Failed to delete service from live database')
    }
  }

  // Cancellation Reasons Live DB State & Handlers
  const [loadingCancellations, setLoadingCancellations] = useState(false)
  const [cancellationSearch, setCancellationSearch] = useState('')

  const fetchCancellationReasons = async () => {
    setLoadingCancellations(true)
    try {
      const res = await getClinicCancellationReasons()
      if (res && res.success && res.data) {
        useClinicStore.setState({ cancellationReasons: res.data })
      }
    } catch (err) {
      console.error("Failed to fetch live database cancellation reasons:", err)
    } finally {
      setLoadingCancellations(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'cancellation') {
      fetchCancellationReasons()
    }
  }, [activeTab])

  const handleSaveCancellationReasonDB = async (text) => {
    try {
      if (editingCancellation) {
        const res = await updateClinicCancellationReason(editingCancellation.id, { reason: text })
        if (res && res.success && res.data) {
          useClinicStore.setState((state) => ({
            cancellationReasons: state.cancellationReasons.map((r) =>
              r.id === editingCancellation.id ? res.data : r
            )
          }))
          toast.success('Cancellation reason updated in live database!')
        }
      } else {
        const res = await createClinicCancellationReason({ reason: text })
        if (res && res.success && res.data) {
          useClinicStore.setState((state) => ({
            cancellationReasons: [res.data, ...state.cancellationReasons]
          }))
          toast.success(`New cancellation reason "${text}" added to live database!`)
        }
      }
      setEditingCancellation(null)
      setCancellationText('')
    } catch (err) {
      console.error("Cancellation reason save error:", err)
      toast.error('Failed to save cancellation reason to live database')
    }
  }

  const handleArchiveCancellationReasonDB = async (record) => {
    try {
      const newArchived = !record.archived
      const res = await updateClinicCancellationReason(record.id, { archived: newArchived })
      if (res && res.success && res.data) {
        useClinicStore.setState((state) => ({
          cancellationReasons: state.cancellationReasons.map((r) => (r.id === record.id ? res.data : r))
        }))
        toast.success(`Reason "${record.reason}" ${newArchived ? 'archived' : 'activated'} in live database!`)
      }
    } catch (err) {
      console.error("Cancellation reason archive error:", err)
      toast.error('Failed to update reason status')
    }
  }

  const handleDeleteCancellationReasonDB = async (id, reason) => {
    try {
      const res = await deleteClinicCancellationReason(id)
      if (res && res.success) {
        useClinicStore.setState((state) => ({
          cancellationReasons: state.cancellationReasons.filter((r) => r.id !== id)
        }))
        toast.success(`Removed cancellation reason "${reason}" from live database!`)
      }
    } catch (err) {
      console.error("Cancellation reason delete error:", err)
      toast.error('Failed to delete cancellation reason from live database')
    }
  }

  // Client Tags Live DB State & Handlers
  const [loadingTags, setLoadingTags] = useState(false)
  const [tagsSearch, setTagsSearch] = useState('')
  const [activeColorHex, setActiveColorHex] = useState('#8C4BFF')

  const fetchClientTags = async () => {
    setLoadingTags(true)
    try {
      const res = await getClinicClientTags()
      if (res && res.success && res.data) {
        const mappedTags = res.data.map(t => ({
          ...t,
          icon: t.iconName || t.icon || 'TagOutlined'
        }))
        useClinicStore.setState({ clientTags: mappedTags })
      }
    } catch (err) {
      console.error("Failed to fetch live database client tags:", err)
    } finally {
      setLoadingTags(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'tags') {
      fetchClientTags()
    }
  }, [activeTab])

  const handleSaveTagDB = async (values) => {
    try {
      const payload = {
        name: values.name,
        color: values.color || '#8C4BFF',
        iconName: values.icon || values.iconName || 'TagOutlined'
      }
      if (editingTag) {
        const res = await updateClinicClientTag(editingTag.id, payload)
        if (res && res.success && res.data) {
          const updatedTag = {
            ...res.data,
            icon: res.data.iconName || res.data.icon || 'TagOutlined'
          }
          useClinicStore.setState((state) => ({
            clientTags: state.clientTags.map((t) => (t.id === editingTag.id ? updatedTag : t))
          }))
          toast.success('Client tag updated in live database!')
        }
      } else {
        const res = await createClinicClientTag(payload)
        if (res && res.success && res.data) {
          const newTag = {
            ...res.data,
            icon: res.data.iconName || res.data.icon || 'TagOutlined'
          }
          useClinicStore.setState((state) => ({
            clientTags: [newTag, ...state.clientTags]
          }))
          toast.success(`New tag "${values.name}" created in live database!`)
        }
      }
      setTagModalOpen(false)
    } catch (err) {
      console.error("Tag save error:", err)
      toast.error('Failed to save client tag to live database')
    }
  }

  const handleDeleteTagDB = async (id, name) => {
    try {
      const res = await deleteClinicClientTag(id)
      if (res && res.success) {
        useClinicStore.setState((state) => ({
          clientTags: state.clientTags.filter((t) => t.id !== id)
        }))
        toast.success(`Removed tag "${name}" from live database!`)
      }
    } catch (err) {
      console.error("Tag delete error:", err)
      toast.error('Failed to delete tag from live database')
    }
  }

  // Forms CRUD
  const handleSaveFormDB = async (values) => {
    try {
      if (editingForm) {
        const res = await updateClinicSettingsTemplate('form', editingForm.id, values)
        if (res && res.success) {
          useClinicStore.setState((state) => ({
            formTemplates: state.formTemplates.map((f) =>
              f.id === editingForm.id ? { ...f, ...values, lastModified: new Date().toISOString().split('T')[0] } : f
            ),
          }))
          toast.success('Form template updated in live database!')
        }
      } else {
        const res = await createClinicSettingsTemplate({ type: 'form', ...values })
        if (res && res.success && res.data) {
          useClinicStore.setState((state) => ({
            formTemplates: [res.data, ...state.formTemplates],
          }))
          toast.success('New form template added to live database!')
        }
      }
      setFormModalOpen(false)
    } catch (err) {
      console.error("Form save error:", err)
      toast.error('Failed to save form template to live database')
    }
  }

  const handleDuplicateFormDB = async (record) => {
    try {
      const res = await createClinicSettingsTemplate({
        type: 'form',
        name: `${record.name} (Copy)`,
        category: record.category
      })
      if (res && res.success && res.data) {
        useClinicStore.setState((state) => ({
          formTemplates: [res.data, ...state.formTemplates],
        }))
        toast.success(`Duplicated: ${record.name} in live database!`)
      }
    } catch (err) {
      toast.error('Failed to duplicate form template')
    }
  }

  const handleDeleteFormDB = async (id, name) => {
    try {
      await deleteClinicSettingsTemplate('form', id)
      useClinicStore.setState((state) => ({
        formTemplates: state.formTemplates.filter((f) => f.id !== id),
      }))
      toast.success(`Deleted: ${name} from live database!`)
    } catch (err) {
      toast.error('Failed to delete form template')
    }
  }

  // Letters CRUD
  const handleSaveLetterDB = async (values) => {
    try {
      if (editingLetter) {
        const res = await updateClinicSettingsTemplate('letter', editingLetter.id, values)
        if (res && res.success) {
          useClinicStore.setState((state) => ({
            letterTemplates: state.letterTemplates.map((l) =>
              l.id === editingLetter.id ? { ...l, ...values } : l
            ),
          }))
          toast.success('Letter template updated in live database!')
        }
      } else {
        const res = await createClinicSettingsTemplate({ type: 'letter', ...values, status: 'active' })
        if (res && res.success && res.data) {
          useClinicStore.setState((state) => ({
            letterTemplates: [res.data, ...state.letterTemplates],
          }))
          toast.success('Letter template created in live database!')
        }
      }
      setLetterModalOpen(false)
    } catch (err) {
      toast.error('Failed to save letter template')
    }
  }

  const handleToggleLetterStatusDB = async (record) => {
    const nextStatus = record.status === 'active' ? 'archived' : 'active'
    try {
      await updateClinicSettingsTemplate('letter', record.id, { status: nextStatus })
      useClinicStore.setState((state) => ({
        letterTemplates: state.letterTemplates.map((l) =>
          l.id === record.id ? { ...l, status: nextStatus } : l
        ),
      }))
      toast.success(`Letter marked as ${nextStatus} in live database!`)
    } catch (err) {
      toast.error('Failed to update letter status')
    }
  }

  const handleDuplicateLetterDB = async (record) => {
    try {
      const res = await createClinicSettingsTemplate({
        type: 'letter',
        name: `${record.name} (Copy)`,
        category: record.category,
        status: 'active'
      })
      if (res && res.success && res.data) {
        useClinicStore.setState((state) => ({
          letterTemplates: [res.data, ...state.letterTemplates],
        }))
        toast.success(`Duplicated Letter: ${record.name} in live database!`)
      }
    } catch (err) {
      toast.error('Failed to duplicate letter template')
    }
  }

  const handleDeleteLetterDB = async (id, name) => {
    try {
      await deleteClinicSettingsTemplate('letter', id)
      useClinicStore.setState((state) => ({
        letterTemplates: state.letterTemplates.filter((l) => l.id !== id),
      }))
      toast.success(`Deleted letter template from live database!`)
    } catch (err) {
      toast.error('Failed to delete letter template')
    }
  }

  // Notes CRUD
  const handleSaveNoteDB = async (name) => {
    try {
      const res = await createClinicSettingsTemplate({
        type: 'note',
        name,
        content: 'Write notes structure details here...'
      })
      if (res && res.success && res.data) {
        useClinicStore.setState((state) => ({
          noteTemplates: [...state.noteTemplates, res.data],
        }))
        setSelectedNote(res.data)
        toast.success('Note template created in live database!')
      }
      setNoteModalOpen(false)
    } catch (err) {
      toast.error('Failed to create note template')
    }
  }

  const handleUpdateNoteContentDB = async (noteObj, newContent) => {
    const updated = { ...noteObj, content: newContent }
    setSelectedNote(updated)
    useClinicStore.setState((state) => ({
      noteTemplates: state.noteTemplates.map((n) => (n.id === noteObj.id ? updated : n)),
    }))
    try {
      await updateClinicSettingsTemplate('note', noteObj.id, { content: newContent })
    } catch (err) {
      console.error("Note content sync error:", err)
    }
  }

  const handleSaveNotesLayoutDB = async () => {
    if (!selectedNote) return
    try {
      await updateClinicSettingsTemplate('note', selectedNote.id, {
        name: selectedNote.name,
        content: selectedNote.content
      })
      toast.success('Note templates settings saved to live database!')
    } catch (err) {
      toast.error('Failed to save note template layout')
    }
  }

  const handleDeleteNoteDB = async (noteObj) => {
    if (store.noteTemplates.length <= 1) {
      toast.error('At least one note template must be kept!')
      return
    }
    try {
      await deleteClinicSettingsTemplate('note', noteObj.id)
      const updatedList = store.noteTemplates.filter((n) => n.id !== noteObj.id)
      useClinicStore.setState({ noteTemplates: updatedList })
      if (selectedNote?.id === noteObj.id) {
        setSelectedNote(updatedList[0])
      }
      toast.success('Note template deleted from live database!')
    } catch (err) {
      toast.error('Failed to delete note template')
    }
  }

  // Invoice Templates DB
  const handleSaveInvoiceTemplatesDB = async (values) => {
    try {
      const res = await updateInvoiceTemplatesApi({
        paymentTerms: values.terms,
        footerText: values.footer
      })
      if (res && res.success) {
        useClinicStore.setState({
          invoiceTemplates: {
            logoUrl: res.data?.logoUrl || null,
            paymentTerms: values.terms,
            footerText: values.footer,
          },
        })
        toast.success('Invoicing configurations saved to live database!')
      }
    } catch (err) {
      toast.error('Failed to save invoicing configurations')
    }
  }

  const [form] = Form.useForm()

  // Forms Template State
  const [editingForm, setEditingForm] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formEdit] = Form.useForm()

  // Letters Template State
  const [editingLetter, setEditingLetter] = useState(null)
  const [letterModalOpen, setLetterModalOpen] = useState(false)
  const [letterEdit] = Form.useForm()
  const [letterPreviewOpen, setLetterPreviewOpen] = useState(false)
  const [letterPreviewText, setLetterPreviewText] = useState({ title: '', body: '' })

  const [formPreviewOpen, setFormPreviewOpen] = useState(false)
  const [formPreviewText, setFormPreviewText] = useState({ title: '', body: '' })

  const handlePreviewLetter = () => {
    const raw = letterEdit.getFieldValue('content') || ''
    const title = letterEdit.getFieldValue('name') || 'Clinical Communication Letter'
    if (!raw.trim()) {
      toast.error('Please enter letter template content before previewing')
      return
    }
    const today = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })
    const resolved = raw
      .replace(/\{\{client_name\}\}/gi, 'Jane Miller')
      .replace(/\{\{client name\}\}/gi, 'Jane Miller')
      .replace(/\{\{dob\}\}/gi, '24/08/1991 (Age: 34)')
      .replace(/\{\{practitioner_name\}\}/gi, 'Dr. Sarah Jenkins')
      .replace(/\{\{doctor_name\}\}/gi, 'Dr. Robert Vance (Referring GP)')
      .replace(/\{\{specialty\}\}/gi, 'Physiotherapy')
      .replace(/\{\{diagnosis\}\}/gi, 'Cervical Spine Radiculopathy & Right Trapezius Muscle Spasm')
      .replace(/\{\{date\}\}/gi, today)
      .replace(/\{\{clinic_name\}\}/gi, 'Zealth Health Centre & Allied Health Suites')

    setLetterPreviewText({ title, body: resolved })
    setLetterPreviewOpen(true)
  }

  const handlePreviewForm = () => {
    const raw = formEdit.getFieldValue('content') || ''
    const title = formEdit.getFieldValue('name') || 'Clinical Intake Form'
    if (!raw.trim()) {
      toast.error('Please enter form template structure before previewing')
      return
    }
    const today = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })
    const resolved = raw
      .replace(/\{\{client_name\}\}/gi, 'Jane Miller')
      .replace(/\{\{dob\}\}/gi, '24/08/1991')
      .replace(/\{\{date\}\}/gi, today)
      .replace(/\{\{clinic_name\}\}/gi, 'Zealth Health Centre & Allied Health Suites')
      .replace(/\{\{emergency_contact\}\}/gi, 'Mark Miller (+61 412 345 678)')

    setFormPreviewText({ title, body: resolved })
    setFormPreviewOpen(true)
  }

  // Notes Template State
  const [selectedNote, setSelectedNote] = useState(store.noteTemplates ? store.noteTemplates[0] : null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [notePreviewModalOpen, setNotePreviewModalOpen] = useState(false)

  // Services State
  const [editingService, setEditingService] = useState(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [serviceForm] = Form.useForm()
  const [cancellationText, setCancellationText] = useState('')
  const [editingCancellation, setEditingCancellation] = useState(null)

  // Client Tags State
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [tagForm] = Form.useForm()

  // Security Toggles & Password Form
  const [passwordForm] = Form.useForm()
  const [tfaMethod, setTfaMethod] = useState(() => localStorage.getItem('zhealth_tfa_method') || 'app')
  const [tfaEnabled, setTfaEnabled] = useState(() => localStorage.getItem('zhealth_tfa_enabled') !== 'false')
  const [trustedDevices, setTrustedDevices] = useState(() => buildCurrentSessionRows())

  // Profile Tab State
  const [providerNumbers, setProviderNumbers] = useState([
    { id: 1, type: 'AHPRA', num: 'PHY000278016', loc: 'NDIS' },
    { id: 2, type: 'AHPRA', num: 'PHY000278016', loc: 'CEO Therapy Mobile' },
    { id: 3, type: 'Medicare', num: '6683896B', loc: 'CEO Therapy Mobile' }
  ])
  
  const handleAddProviderNumber = () => {
    setProviderNumbers([...providerNumbers, { id: Date.now(), type: '', num: '', loc: 'NDIS' }])
    toast.success('Provider number added')
  }

  const handleDeleteProviderNumber = (id) => {
    setProviderNumbers(providerNumbers.filter(pn => pn.id !== id))
    toast.success('Provider number removed')
  }

  const [apiKeys, setApiKeys] = useState([
    { key: '1', name: 'Production App', created: '2026-01-10', lastUsed: '2026-07-03', token: 'sk_live_12345...89' },
    { key: '2', name: 'Zapier Integration', created: '2026-03-15', lastUsed: '2026-07-01', token: 'sk_live_98765...21' },
  ])

  const handleGenerateApiKey = () => {
    setApiKeys([...apiKeys, { key: Date.now().toString(), name: 'New API Key', created: new Date().toISOString().split('T')[0], lastUsed: 'Never', token: `sk_live_${Math.floor(Math.random()*1000000000)}` }])
    toast.success('New API Key generated successfully')
  }
  // Data Import / Export State
  const [importFile, setImportFile] = useState(null)
  const [importTarget, setImportTarget] = useState('clients')
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedErrors, setSelectedErrors] = useState([])
  const [selectedLogFileName, setSelectedLogFileName] = useState('')

  // Render content logic
  const renderTabContent = () => {
    // Security check to guarantee no unauthorized settings can be rendered for this role
    const allowedKeys = tabs.flatMap((t) => t.subItems ? [t.key, ...t.subItems.map(s => s.key)] : [t.key])
    if (!allowedKeys.includes(activeTab)) {
      return (
        <div className="p-8 text-center text-slate-400 text-sm font-semibold">
          You do not have permission to view these settings.
        </div>
      )
    }

    switch (activeTab) {
      case 'admin':
        return <AdminPage />

      case 'branch':
        return <BranchPage />

      case 'practitioners':
        return <DoctorsManagePage />

      case 'profile':
        return (
          <Form 
            layout="vertical" 
            onFinish={() => toast.success('Profile settings updated successfully!')}
            className="space-y-6 max-w-4xl pb-10 animate-fade-in"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[22px] font-bold text-slate-800 dark:text-white m-0">My Profile Settings</h2>
              <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-9 px-6 shadow-sm">
                Save Changes
              </Button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm mb-6">
              <Tabs
                defaultActiveKey="details"
                className="px-6 pt-2"
                tabBarStyle={{ marginBottom: 0, borderBottom: '1px solid #f1f5f9' }}
                items={[
                  {
                    key: 'details',
                    label: <span className="font-bold text-[#8C4BFF]">Details</span>,
                    children: (
                      <div className="py-6 space-y-6">
                        {/* Details Section */}
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-4">
                            <div className="flex gap-4">
                              <Form.Item label={<span className="font-semibold text-xs">Title</span>} className="w-24 mb-0">
                                <Select defaultValue="Mr">
                                  <Option value="Mr">Mr</Option>
                                  <Option value="Ms">Ms</Option>
                                  <Option value="Dr">Dr</Option>
                                </Select>
                              </Form.Item>
                              <Form.Item label={<span className="font-semibold text-xs">First name <span className="text-red-500">*</span></span>} className="flex-1 mb-0">
                                <Input defaultValue="Colin" />
                              </Form.Item>
                              <Form.Item label={<span className="font-semibold text-xs">Last name <span className="text-red-500">*</span></span>} className="flex-1 mb-0">
                                <Input defaultValue="Edegbe" />
                              </Form.Item>
                            </div>
                            
                            <Form.Item label={<span className="font-semibold text-xs">Gender</span>} className="mb-0">
                              <Select defaultValue="Male">
                                <Option value="Male">Male</Option>
                                <Option value="Female">Female</Option>
                                <Option value="Other">Other</Option>
                              </Select>
                            </Form.Item>

                            <Form.Item label={<span className="font-semibold text-xs">Email <span className="text-red-500">*</span></span>} className="mb-0">
                              <Input defaultValue="colin.edegbe@ceotherapy.com" />
                            </Form.Item>

                            <Form.Item label={<span className="font-semibold text-xs">Date of birth</span>} className="mb-0">
                              <div className="flex gap-2">
                                <Select defaultValue="15" className="flex-1" showSearch>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <Option key={d} value={d.toString()}>{d}</Option>
                                  ))}
                                </Select>
                                <Select defaultValue="August" className="flex-1" showSearch>
                                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <Option key={m} value={m}>{m}</Option>
                                  ))}
                                </Select>
                                <Select defaultValue="1990" className="flex-1" showSearch>
                                  {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <Option key={y} value={y.toString()}>{y}</Option>
                                  ))}
                                </Select>
                              </div>
                            </Form.Item>

                            <Form.Item label={<span className="font-semibold text-xs">Phone numbers</span>} className="mb-0 mt-2">
                              <div className="flex flex-col gap-2">
                                <Input defaultValue="+61 412 345 678" />
                                <div>
                                  <Button icon={<PlusOutlined />} className="text-xs" onClick={() => toast.success('Phone number field added')}>Add new phone number</Button>
                                </div>
                              </div>
                            </Form.Item>

                            <Form.Item label={<span className="font-semibold text-xs mt-2">Professional title (Occupational Therapist, Physiotherapist, etc.) <span className="text-red-500">*</span></span>} className="mb-0">
                              <Input defaultValue="Physiotherapist" />
                            </Form.Item>

                            <Form.Item label={<span className="font-semibold text-xs mt-2">Groups</span>} className="mb-0">
                              <Select defaultValue="Senior Practitioner">
                                <Option value="Senior Practitioner">Senior Practitioner</Option>
                                <Option value="Standard Practitioner">Standard Practitioner</Option>
                              </Select>
                            </Form.Item>
                          </div>
                          
                          {/* Profile Picture */}
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-48 h-48 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 relative">
                              <UserOutlined className="text-[80px] text-slate-300" />
                            </div>
                            <Button className="font-semibold" onClick={() => toast.success('Upload dialog opened')}>Upload</Button>
                          </div>
                        </div>

                        <Divider className="my-2" />

                        {/* Practitioner Settings Section */}
                        <div>
                          <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white">Practitioner settings</h3>
                          <div className="space-y-8">
                            <div>
                              <h4 className="font-semibold text-sm mb-3">Locations you work at</h4>
                              <div className="flex flex-col gap-2">
                                <Checkbox defaultChecked>NDIS</Checkbox>
                                <Checkbox defaultChecked>CEO Therapy Mobile</Checkbox>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-3">Services provided by you</h4>
                              <Input placeholder="Search options" className="mb-3 max-w-sm rounded-lg" />
                              <div className="mb-3">
                                <Checkbox className="font-semibold text-slate-500 text-xs">Check all</Checkbox>
                              </div>
                              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 text-sm">
                                <Checkbox defaultChecked>Physiotherapy Subsequent Session (Therapeutic Supports)</Checkbox>
                                <Checkbox defaultChecked>Progress report (Non-Face-to-Face Services)</Checkbox>
                                <Checkbox defaultChecked>Initial Physiotherapy Session (Therapeutic Supports)</Checkbox>
                                <Checkbox defaultChecked>Creation of resources (e.g. exercise program) (Therapeutic Supports)</Checkbox>
                                <Checkbox defaultChecked>(ECS) Subsequent Physiotherapy Session (Early Childhood Supports)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Initial (0-10km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Follow-Up (0-10km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Correspondence (inc phone calls and emails) (Physiotherapy) (Therapeutic Supports)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Initial (20-30km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Initial (30-40km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Initial (10-20km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Follow-Up (10-20km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Follow-Up (30-40km) (Private)</Checkbox>
                                <Checkbox defaultChecked>Mobile Physio - Follow-Up (20-30km) (Private)</Checkbox>
                                <Checkbox>Copy of Progress report (Non-Face-to-Face Services)</Checkbox>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-3">Signature</h4>
                              <div className="mb-4 text-3xl text-slate-400 italic border-b border-slate-200 inline-block px-4 py-2" style={{ fontFamily: 'cursive' }}>
                                Colin Edegbe
                              </div>
                              <div className="flex gap-3">
                                <Button onClick={() => toast.success('Signature pad opened')}>Re-sign</Button>
                                <Button icon={<CloseCircleOutlined />} onClick={() => toast.success('Signature cleared')}>Clear signature</Button>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-3 mt-4">Provider numbers</h4>
                              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-12 gap-4 mb-3 font-bold text-xs text-slate-500 uppercase">
                                  <div className="col-span-3">Type</div>
                                  <div className="col-span-4">Number</div>
                                  <div className="col-span-4">Location</div>
                                  <div className="col-span-1"></div>
                                </div>
                                {providerNumbers.map(row => (
                                  <div key={row.id} className="grid grid-cols-12 gap-4 items-center mb-3">
                                    <div className="col-span-3">
                                      <Input defaultValue={row.type} className="rounded-lg" />
                                    </div>
                                    <div className="col-span-4">
                                      <Input defaultValue={row.num} className="rounded-lg" />
                                    </div>
                                    <div className="col-span-4">
                                      <Select defaultValue={row.loc} className="w-full rounded-lg">
                                        <Option value="NDIS">NDIS</Option>
                                        <Option value="CEO Therapy Mobile">CEO Therapy Mobile</Option>
                                      </Select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                      <DeleteOutlined className="text-red-500 cursor-pointer text-base hover:text-red-600" onClick={() => handleDeleteProviderNumber(row.id)} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button icon={<PlusOutlined />} className="text-xs font-semibold" onClick={handleAddProviderNumber}>Add a provider number</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  { 
                    key: 'availability', 
                    label: <span className="font-semibold text-slate-500">Availability</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Weekly Schedule</h3>
                          <Button type="primary" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg" onClick={() => toast.success('Availability updated')}>Save Schedule</Button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                            <div key={day} className="flex items-center gap-4">
                              <div className="w-24 font-semibold text-slate-700 dark:text-slate-300">{day}</div>
                              <Select defaultValue="09:00 AM" className="w-32">
                                <Option value="09:00 AM">09:00 AM</Option>
                                <Option value="10:00 AM">10:00 AM</Option>
                              </Select>
                              <span className="text-slate-400">to</span>
                              <Select defaultValue="05:00 PM" className="w-32">
                                <Option value="05:00 PM">05:00 PM</Option>
                                <Option value="06:00 PM">06:00 PM</Option>
                              </Select>
                            </div>
                          ))}
                          <div className="flex items-center gap-4 opacity-50">
                            <div className="w-24 font-semibold text-slate-700 dark:text-slate-300">Saturday</div>
                            <Select defaultValue="Closed" className="w-32" disabled />
                          </div>
                          <div className="flex items-center gap-4 opacity-50">
                            <div className="w-24 font-semibold text-slate-700 dark:text-slate-300">Sunday</div>
                            <Select defaultValue="Closed" className="w-32" disabled />
                          </div>
                        </div>
                      </div>
                    ) 
                  },
                  { 
                    key: 'body_charts', 
                    label: <span className="font-semibold text-slate-500">Body chart templates</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">My Body Charts</h3>
                          <Button icon={<PlusOutlined />} className="rounded-lg font-semibold" onClick={() => toast.success('New template created')}>New Template</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.info('Opening chart template')}>
                              <div className="h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                                <span className="text-slate-400 font-bold text-xl">Template {i}</span>
                              </div>
                              <div className="p-4 bg-white dark:bg-slate-900">
                                <h4 className="font-bold text-sm m-0">Physiotherapy Full Body</h4>
                                <p className="text-xs text-slate-500 m-0 mt-1">Updated 2 days ago</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) 
                  },
                  { 
                    key: 'integrations', 
                    label: <span className="font-semibold text-slate-500">Integrations</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0 mb-4">Connected Apps</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['Xero', 'Mailchimp', 'Physitrack', 'Stripe'].map(app => (
                            <div key={app} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400">{app[0]}</div>
                                <div>
                                  <h4 className="font-bold text-sm m-0">{app}</h4>
                                  <p className="text-xs text-slate-500 m-0">Not connected</p>
                                </div>
                              </div>
                              <Button className="rounded-lg font-semibold" onClick={() => toast.success(`Connected to ${app}`)}>Connect</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) 
                  },
                  { 
                    key: 'login_history', 
                    label: <span className="font-semibold text-slate-500">Login history</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0 mb-4">Recent Logins</h3>
                        <Table 
                          dataSource={trustedDevices.map(r => ({ key: r.key, date: r.time, ip: r.ip, location: r.location, device: r.device.replace(' (Current)', '') }))}
                          columns={[
                            { title: 'Date & Time', dataIndex: 'date', key: 'date', className: 'font-semibold text-xs' },
                            { title: 'IP Address', dataIndex: 'ip', key: 'ip', render: v => <span className="font-mono text-xs text-slate-500">{v}</span> },
                            { title: 'Location', dataIndex: 'location', key: 'location', render: v => <span className="text-xs">{v}</span> },
                            { title: 'Device', dataIndex: 'device', key: 'device', render: v => <span className="text-xs font-semibold">{v}</span> },
                          ]}
                          pagination={false}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                        />
                      </div>
                    ) 
                  },
                  { 
                    key: 'account_security', 
                    label: <span className="font-semibold text-slate-500">Account security</span>, 
                    children: (
                      <div className="py-6 space-y-8">
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0 mb-4">Change Password</h3>
                          <div className="max-w-md space-y-4">
                            <Input.Password placeholder="Current Password" size="large" className="rounded-lg" />
                            <Input.Password placeholder="New Password" size="large" className="rounded-lg" />
                            <Input.Password placeholder="Confirm New Password" size="large" className="rounded-lg" />
                            <Button type="primary" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-semibold" onClick={() => toast.success('Password updated successfully')}>Update Password</Button>
                          </div>
                        </div>
                        {SHOW_2FA && (
                          <>
                            <Divider />
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Two-Factor Authentication (2FA)</h3>
                                <p className="text-slate-500 text-sm mt-1">Add an extra layer of security. Requires a one-time code at sign-in.</p>
                                <Tag color={tfaEnabled ? 'success' : 'default'} className="rounded-full border-none font-bold text-[10px] uppercase px-3 mt-2">
                                  {tfaEnabled ? '✓ Enabled' : 'Disabled'}
                                </Tag>
                              </div>
                              <Button
                                type={tfaEnabled ? 'default' : 'primary'}
                                className="rounded-lg font-semibold"
                                style={!tfaEnabled ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                                onClick={() => {
                                  const next = !tfaEnabled
                                  setTfaEnabled(next)
                                  localStorage.setItem('zhealth_tfa_enabled', String(next))
                                  toast.success(`2FA ${next ? 'enabled' : 'disabled'} successfully`)
                                }}
                              >
                                {tfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ) 
                  },
                  { 
                    key: 'api_keys', 
                    label: <span className="font-semibold text-slate-500">API keys</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Active API Keys</h3>
                          <Button type="primary" icon={<PlusOutlined />} className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-semibold" onClick={handleGenerateApiKey}>Generate New Key</Button>
                        </div>
                        <Table 
                          dataSource={apiKeys} 
                          columns={[
                            { title: 'Name', dataIndex: 'name', key: 'name', className: 'font-semibold' },
                            { title: 'Token', dataIndex: 'token', key: 'token', render: (text) => <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{text}</span> },
                            { title: 'Created', dataIndex: 'created', key: 'created' },
                            { title: 'Last Used', dataIndex: 'lastUsed', key: 'lastUsed' },
                            { 
                              title: 'Action', 
                              key: 'action', 
                              render: (_, record) => <Button danger type="text" icon={<DeleteOutlined />} onClick={() => { setApiKeys(apiKeys.filter(k => k.key !== record.key)); toast.success('API Key revoked'); }} />
                            }
                          ]}
                          pagination={false}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                        />
                      </div>
                    ) 
                  }
                ]}
              />
            </div>
            
            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-10 px-8 shadow-sm">
                Save Changes
              </Button>
            </div>
          </Form>
        )
      case 'clinic_details':
        return <ClinicDetailsTab />
      case 'roles_permissions':
        return <RolesPermissionsTab />
      case 'subscription':
        return <SubscriptionPage />
      case 'global_settings':
        return (
          <div className="space-y-6 max-w-4xl pb-10">
            <h2 className="text-[22px] font-bold text-[#1a1a1a] dark:text-white mb-6">Global Settings</h2>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm"><p className="text-slate-500 font-semibold">System-wide configurations apply here.</p></Card>
          </div>
        )
      case 'mobile_app':
        return (
          <div className="space-y-6 max-w-4xl pb-10">
            <h2 className="text-[22px] font-bold text-[#1a1a1a] dark:text-white mb-6">Mobile App Configuration</h2>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm"><p className="text-slate-500 font-semibold">Configure mobile application settings and branding.</p></Card>
          </div>
        )
      case 'legal':
        return (
          <div className="space-y-6 max-w-4xl pb-10">
            <h2 className="text-[22px] font-bold text-[#1a1a1a] dark:text-white mb-6">Legal & Information</h2>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4"><h3 className="font-bold">About Us</h3><p className="text-slate-500 text-sm">Configure clinic description.</p></Card>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4"><h3 className="font-bold">Terms & Conditions</h3><p className="text-slate-500 text-sm">Clinic terms document.</p></Card>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm"><h3 className="font-bold">Privacy Policy</h3><p className="text-slate-500 text-sm">Clinic privacy policy document.</p></Card>
          </div>
        )
      case 'clinic_details':
        return <ClinicDetailsTab />
      case 'roles_permissions':
        return <RolesPermissionsTab />
      case 'subscription':
        return <SubscriptionPage />
      case 'integrations':
        const currentList = integrationsList.length > 0 ? integrationsList : store.integrations
        const displayIntegrations = currentList.filter(item => {
          const matchesSearch = !integrationsSearch.trim() ||
            item.name.toLowerCase().includes(integrationsSearch.toLowerCase()) ||
            (item.type && item.type.toLowerCase().includes(integrationsSearch.toLowerCase()))
          const matchesCategory = integrationsCategoryFilter === 'All' || item.type === integrationsCategoryFilter || item.category === integrationsCategoryFilter
          const matchesStatus = integrationsStatusFilter === 'All' ||
            (integrationsStatusFilter === 'Authorised' && item.status === 'Authorised') ||
            (integrationsStatusFilter === 'Configured' && item.status === 'Configured') ||
            (integrationsStatusFilter === 'Failed' && item.status === 'Failed') ||
            (integrationsStatusFilter === 'Not Configured' && (item.status === 'Not Configured' || (!item.status))) ||
            (integrationsStatusFilter === 'Not Connected' && item.status === 'Not Connected')
          return matchesSearch && matchesCategory && matchesStatus
        })

        return (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Integrations & Connected Services</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  Connect and configure third-party service credentials. Use &ldquo;Test Connection&rdquo; to verify each integration before activating it.
                </p>
              </div>
              <Button
                icon={<SyncOutlined spin={loadingIntegrations} />}
                onClick={fetchIntegrations}
                className="rounded-xl font-semibold border-slate-200 h-9"
              >
                Refresh Status
              </Button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
              <Input
                placeholder="Search integrations by name, service type..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={integrationsSearch}
                onChange={(e) => setIntegrationsSearch(e.target.value)}
                className="w-full md:w-64 rounded-xl border-slate-200 h-9"
                allowClear
              />
              <Select
                value={integrationsCategoryFilter}
                onChange={setIntegrationsCategoryFilter}
                className="w-48 rounded-xl h-9"
              >
                <Option value="All">All Categories</Option>
                <Option value="Payments">Payments & Billing</Option>
                <Option value="Health Claiming">Health Claiming (Medicare)</Option>
                <Option value="Accounting">Accounting (Xero / MYOB)</Option>
                <Option value="Calendar & Video">Calendar & Video (Google / Zoom)</Option>
                <Option value="Communications">SMS & Communications (Twilio)</Option>
                <Option value="Exercise Prescription">Exercise Prescription</Option>
              </Select>
              <Select
                value={integrationsStatusFilter}
                onChange={setIntegrationsStatusFilter}
                className="w-48 rounded-xl h-9"
              >
                <Option value="All">All Statuses</Option>
                <Option value="Authorised">✅ Authorised</Option>
                <Option value="Configured">🟡 Configured (Unverified)</Option>
                <Option value="Failed">🔴 Failed</Option>
                <Option value="Not Configured">⚫ Not Configured</Option>
                <Option value="Not Connected">⚪ Not Connected</Option>
              </Select>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayIntegrations.map((item) => {
                // Evidence-based status flags
                const isAuthorised = item.status === 'Authorised'
                const isConfigured = item.status === 'Configured'
                const isFailed = item.status === 'Failed'
                const isNotConnected = item.status === 'Not Connected'
                const isNotConfigured = !item.status || item.status === 'Not Configured'
                const isActiveConnection = isAuthorised || isConfigured
                const isTesting = testingIntegrationId === item.id

                return (
                  <Card
                    key={item.id}
                    className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
                    styles={{ body: { padding: '22px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                            {item.type || 'Connected Tool'}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-800 dark:text-white m-0 mt-0.5">{item.name}</h4>
                        </div>

                        {/* Status Badge — evidence-based 5-state system */}
                        {isAuthorised && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Authorised
                          </span>
                        )}
                        {isConfigured && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Configured
                          </span>
                        )}
                        {isFailed && (
                          <Tooltip title={item.errorMessage || 'Connection test failed. Check API credentials and try again.'}>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 cursor-pointer">
                              <WarningOutlined />
                              Failed
                            </span>
                          </Tooltip>
                        )}
                        {isNotConnected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Not Connected
                          </span>
                        )}
                        {isNotConfigured && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-50 text-slate-400 border border-slate-150 dark:bg-slate-800/60 dark:text-slate-500 dark:border-slate-700">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            Not Configured
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed min-h-[42px]">
                        {item.description || 'Configure credentials to connect this service to your clinic workflow.'}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Last Verified:</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">{item.lastSync || (isAuthorised ? 'Session active' : '—')}</span>
                      </div>

                      {/* Action Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          icon={<SettingOutlined />}
                          onClick={() => handleOpenConfigure(item)}
                          className="rounded-xl text-xs font-bold h-9"
                        >
                          Configure
                        </Button>

                        <Button
                          icon={<CheckCircleOutlined />}
                          loading={isTesting}
                          onClick={() => handleTestIntegration(item)}
                          className="rounded-xl text-xs font-bold h-9 text-[#8C4BFF] border-purple-200 hover:border-purple-400"
                        >
                          Test Connection
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type={isActiveConnection ? 'default' : 'primary'}
                          onClick={() => handleToggleIntegration(item)}
                          className="flex-1 rounded-xl text-xs font-bold h-9"
                          style={!isActiveConnection ? { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' } : {}}
                        >
                          {isActiveConnection ? 'Disconnect' : 'Connect Service'}
                        </Button>
                        {isAuthorised && (
                          <Tooltip title="Sync Now">
                            <Button
                              icon={<SyncOutlined />}
                              onClick={() => handleSyncIntegration(item)}
                              className="rounded-xl border border-slate-200 dark:border-slate-700 h-9 w-9 flex items-center justify-center p-0 text-emerald-600"
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Integration Configuration Modal */}
            <Modal
              title={
                <div className="flex items-center gap-2">
                  <ApiOutlined style={{ color: '#8C4BFF' }} />
                  <span className="font-extrabold text-base text-slate-800 dark:text-white">
                    Configure {selectedIntegration?.name || 'Integration'}
                  </span>
                </div>
              }
              open={configModalVisible}
              onCancel={() => setConfigModalVisible(false)}
              footer={null}
              destroyOnHidden
              width={560}
            >
              {selectedIntegration && (
                <Form
                  form={configForm}
                  layout="vertical"
                  onFinish={handleSaveIntegrationConfig}
                  className="mt-4 font-sans space-y-3"
                >
                  <p className="text-xs text-slate-400 mb-4">
                    Enter your authentication credentials and preferences. Settings are encrypted and stored in your live clinic database.
                  </p>

                  {/* Tailored fields per integration */}
                  {selectedIntegration.id === 'stripe' && (
                    <>
                      <Form.Item name="publishableKey" label={<span className="text-xs font-semibold text-slate-500">Stripe Publishable Key</span>} rules={[{ required: true }]}>
                        <Input placeholder="pk_live_... or pk_test_..." className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="secretKey" label={<span className="text-xs font-semibold text-slate-500">Stripe Restricted Secret Key</span>} rules={[{ required: true }]}>
                        <Input.Password placeholder="sk_live_... or rk_live_..." className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="webhookSecret" label={<span className="text-xs font-semibold text-slate-500">Webhook Signing Secret</span>}>
                        <Input placeholder="whsec_..." className="rounded-xl h-10" />
                      </Form.Item>
                    </>
                  )}

                  {selectedIntegration.id === 'medicare' && (
                    <>
                      <Form.Item name="providerNumber" label={<span className="text-xs font-semibold text-slate-500">Medicare Provider Number</span>} rules={[{ required: true }]}>
                        <Input placeholder="e.g. PHY000278016" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="locationId" label={<span className="text-xs font-semibold text-slate-500">Minor Location ID</span>} rules={[{ required: true }]}>
                        <Input placeholder="e.g. LOC-1002" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="claimingChannel" label={<span className="text-xs font-semibold text-slate-500">Claiming Channels</span>} initialValue="Medicare & DVA Bulk Bill">
                        <Select className="rounded-xl h-10">
                          <Option value="Medicare & DVA Bulk Bill">Medicare & DVA Bulk Bill</Option>
                          <Option value="ECLIPSE In-hospital Claiming">ECLIPSE In-hospital Claiming</Option>
                          <Option value="Private Health Funds & Medicare">Private Health Funds & Medicare</Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}

                  {selectedIntegration.id === 'twilio' && (
                    <>
                      <Form.Item name="accountSid" label={<span className="text-xs font-semibold text-slate-500">Twilio Account SID</span>} rules={[{ required: true }]}>
                        <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="authToken" label={<span className="text-xs font-semibold text-slate-500">Auth Token</span>} rules={[{ required: true }]}>
                        <Input.Password placeholder="Your Twilio Auth Token" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="senderId" label={<span className="text-xs font-semibold text-slate-500">Sender Phone Number or Alphanumeric Sender ID</span>} rules={[{ required: true }]}>
                        <Input placeholder="e.g. ZealthClinic or +61400123456" className="rounded-xl h-10" />
                      </Form.Item>
                    </>
                  )}

                  {selectedIntegration.id === 'xero' && (
                    <>
                      <Form.Item name="tenantId" label={<span className="text-xs font-semibold text-slate-500">Xero Organization / Tenant ID</span>} rules={[{ required: true }]}>
                        <Input placeholder="e.g. xero_tenant_9941" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="clientId" label={<span className="text-xs font-semibold text-slate-500">Xero App Client ID</span>} rules={[{ required: true }]}>
                        <Input placeholder="e.g. xero_client_live_key" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="invoiceSync" label={<span className="text-xs font-semibold text-slate-500">Auto-Sync Invoices</span>} initialValue="Immediate on Issue">
                        <Select className="rounded-xl h-10">
                          <Option value="Immediate on Issue">Immediate on Issue</Option>
                          <Option value="Daily Batch Sync">Daily Batch Sync (End of Day)</Option>
                          <Option value="Manual Trigger Only">Manual Trigger Only</Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}

                  {selectedIntegration.id === 'google_calendar' && (
                    <>
                      <Form.Item name="calendarId" label={<span className="text-xs font-semibold text-slate-500">Google Calendar ID</span>} rules={[{ required: true }]} initialValue="primary">
                        <Input placeholder="primary or your-clinic-email@gmail.com" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="syncDirection" label={<span className="text-xs font-semibold text-slate-500">Synchronization Direction</span>} initialValue="two_way">
                        <Select className="rounded-xl h-10">
                          <Option value="two_way">Two-Way (Appointments & Google Calendar events)</Option>
                          <Option value="export_only">Export Only (Zealth OS &rarr; Google Calendar)</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item name="autoCreateMeet" label={<span className="text-xs font-semibold text-slate-500">Telehealth Meet Links</span>} initialValue="Auto-generate for Telehealth sessions">
                        <Select className="rounded-xl h-10">
                          <Option value="Auto-generate for Telehealth sessions">Auto-generate for Telehealth sessions</Option>
                          <Option value="Disabled">Disabled</Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}

                  {/* Generic fallback fields for other integrations */}
                  {!['stripe', 'medicare', 'twilio', 'xero', 'google_calendar'].includes(selectedIntegration.id) && (
                    <>
                      <Form.Item name="apiKey" label={<span className="text-xs font-semibold text-slate-500">API Key / Access Token</span>}>
                        <Input.Password placeholder="Enter API Key" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="clinicKey" label={<span className="text-xs font-semibold text-slate-500">Partner / Organization Identifier</span>}>
                        <Input placeholder="e.g. ORG-1092" className="rounded-xl h-10" />
                      </Form.Item>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      icon={<CheckCircleOutlined />}
                      loading={testingIntegrationId === selectedIntegration.id}
                      onClick={() => handleTestIntegration(selectedIntegration, configForm.getFieldsValue())}
                      className="rounded-xl text-xs font-bold h-10 text-[#8C4BFF] border-purple-200 hover:border-purple-400"
                    >
                      Test Credentials
                    </Button>

                    <div className="flex gap-2">
                      <Button onClick={() => setConfigModalVisible(false)} className="rounded-xl h-10">
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                        className="rounded-xl font-bold h-10 px-5 text-white shadow"
                      >
                        Save & Connect
                      </Button>
                    </div>
                  </div>
                </Form>
              )}
            </Modal>
          </div>
        )

      case 'templates':
      case 'notes':
      case 'letters': {
        const displayFormTemplates = store.formTemplates.filter((item) => {
          const matchesSearch = !formsSearch.trim() ||
            item.name.toLowerCase().includes(formsSearch.toLowerCase()) ||
            (item.category && item.category.toLowerCase().includes(formsSearch.toLowerCase()))
          const matchesCategory = formsCategoryFilter === 'All' || item.category === formsCategoryFilter
          return matchesSearch && matchesCategory
        })

        const displayLetterTemplates = store.letterTemplates.filter((item) => {
          const matchesSearch = !lettersSearch.trim() ||
            item.name.toLowerCase().includes(lettersSearch.toLowerCase()) ||
            (item.category && item.category.toLowerCase().includes(lettersSearch.toLowerCase()))
          const matchesStatus = lettersStatusFilter === 'All' || item.status === lettersStatusFilter
          return matchesSearch && matchesStatus
        })

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
                {[
                  { id: 'forms', label: 'Forms Templates' },
                  { id: 'letters', label: 'Letter Templates' },
                  { id: 'notes', label: 'Note Templates' },
                  { id: 'invoices', label: 'Invoice Templates' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTemplateTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${activeTemplateTab === tab.id ? 'bg-white dark:bg-slate-700 shadow-sm text-[#8C4BFF]' : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Button
                icon={<SyncOutlined spin={loadingTemplates} />}
                onClick={fetchTemplates}
                className="rounded-xl font-semibold border-slate-200 h-9"
              >
                Refresh Templates
              </Button>
            </div>

            {activeTemplateTab === 'forms' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Forms Templates</h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">
                      Manage Intake, Assessment, and Consent forms filled by clients prior to consultations.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingForm(null)
                      formEdit.resetFields()
                      formEdit.setFieldsValue({
                        category: 'Intake',
                        content: `1. Patient Full Legal Name: {{client_name}}\n2. Date of Birth: {{dob}}\n3. Primary Presenting Symptoms / Medical History:\n4. Emergency Contact Person & Phone: {{emergency_contact}}\n5. Consent & Privacy Declaration:\nI hereby consent to allied health evaluation and treatment at {{clinic_name}}.\n\nParticipant Signature: ____________________ Date: {{date}}`
                      })
                      setFormModalOpen(true)
                    }}
                    className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
                  >
                    <PlusOutlined />
                    <span>Create Form</span>
                  </button>
                </div>

                {/* Filter Toolbar for Forms */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
                  <Input
                    placeholder="Search form templates..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={formsSearch}
                    onChange={(e) => setFormsSearch(e.target.value)}
                    className="w-full md:w-64 rounded-xl border-slate-200 h-9"
                    allowClear
                  />
                  <Select
                    value={formsCategoryFilter}
                    onChange={setFormsCategoryFilter}
                    className="w-48 rounded-xl h-9"
                  >
                    <Option value="All">All Categories</Option>
                    <Option value="Intake">Intake</Option>
                    <Option value="Assessment">Assessment</Option>
                    <Option value="Consent">Consent</Option>
                    <Option value="Clinical">Clinical</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <Table
                    dataSource={displayFormTemplates}
                    pagination={false}
                    rowKey="id"
                    columns={[
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Form Name</span>,
                        dataIndex: 'name',
                        render: (text) => <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>,
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Category</span>,
                        dataIndex: 'category',
                        render: (text) => <Tag color="blue" className="rounded-full border-none font-bold text-[10px] px-2.5 py-0.5">{text}</Tag>,
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Last Modified</span>,
                        dataIndex: 'lastModified',
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Actions</span>,
                        key: 'actions',
                        align: 'right',
                        render: (_, record) => (
                          <Space size="middle">
                            <button
                              onClick={() => handleDuplicateFormDB(record)}
                              className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                              title="Duplicate"
                            >
                              <CopyOutlined />
                            </button>
                            <button
                              onClick={() => {
                                setEditingForm(record)
                                formEdit.setFieldsValue({
                                  ...record,
                                  content: record.content || `1. Patient Full Legal Name: {{client_name}}\n2. Date of Birth: {{dob}}\n3. Primary Presenting Symptoms / Medical History:\n4. Emergency Contact Person & Phone: {{emergency_contact}}\n5. Consent & Privacy Declaration:\nI hereby consent to allied health evaluation and treatment at {{clinic_name}}.\n\nParticipant Signature: ____________________ Date: {{date}}`
                                })
                                setFormModalOpen(true)
                              }}
                              className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                              title="Edit"
                            >
                              <EditOutlined />
                            </button>
                            <button
                              onClick={() => handleDeleteFormDB(record.id, record.name)}
                              className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Delete"
                            >
                              <DeleteOutlined />
                            </button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>

                {/* Form Modal */}
                <Modal
                  open={formModalOpen}
                  onCancel={() => setFormModalOpen(false)}
                  footer={null}
                  destroyOnHidden
                  width={680}
                  title={<span className="font-extrabold text-base text-slate-800 dark:text-slate-200">{editingForm ? 'Edit Form Template' : 'Create Form Template'}</span>}
                >
                  <Form
                    layout="vertical"
                    form={formEdit}
                    onFinish={handleSaveFormDB}
                    className="mt-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item name="name" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Form Template Title</span>} rules={[{ required: true, message: 'Please enter form name' }]}>
                        <Input placeholder="e.g. Falls Risk Assessment & Intake" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="category" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Form Category</span>} rules={[{ required: true }]}>
                        <Select placeholder="Select category" className="rounded-xl h-10 flex items-center">
                          <Option value="Intake">Intake Form</Option>
                          <Option value="Assessment">Clinical Assessment</Option>
                          <Option value="Consent">Consent & Declaration</Option>
                          <Option value="Clinical">Clinical Evaluation</Option>
                          <Option value="Other">General / Other</Option>
                        </Select>
                      </Form.Item>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                        Click to Insert Placeholders
                      </span>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {['{{client_name}}', '{{dob}}', '{{date}}', '{{clinic_name}}', '{{emergency_contact}}'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const cur = formEdit.getFieldValue('content') || ''
                              formEdit.setFieldsValue({ content: `${cur} ${tag} ` })
                              toast.success(`Inserted ${tag}`)
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-[#8C4BFF]/10 text-slate-600 dark:text-slate-300 hover:text-[#8C4BFF] border-none px-2 py-0.5 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Form.Item name="content" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Form Questions, Declarations & Field Structure</span>}>
                      <Input.TextArea
                        rows={8}
                        placeholder="Enter form intake questions, health declarations, and field sections..."
                        className="rounded-xl font-mono text-xs p-3.5 leading-relaxed bg-slate-50/50 dark:bg-slate-950/60"
                      />
                    </Form.Item>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-150 dark:border-slate-800">
                      <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={handlePreviewForm}
                        className="rounded-xl font-bold text-xs h-9"
                      >
                        Preview Form
                      </Button>
                      <div className="flex gap-2">
                        <Button onClick={() => setFormModalOpen(false)} className="rounded-xl font-bold h-9">
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                          className="rounded-xl font-bold h-9 text-white"
                        >
                          Save & Publish Form
                        </Button>
                      </div>
                    </div>
                  </Form>
                </Modal>
              </div>
            )}

            {activeTemplateTab === 'letters' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Letter Templates</h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">
                      Manage clinical templates for referral letters, discharge plans, and GPs.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLetter(null)
                      letterEdit.resetFields()
                      setLetterModalOpen(true)
                    }}
                    className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
                  >
                    <PlusOutlined />
                    <span>Create Letter</span>
                  </button>
                </div>

                {/* Filter Toolbar for Letters */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
                  <Input
                    placeholder="Search letter templates..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={lettersSearch}
                    onChange={(e) => setLettersSearch(e.target.value)}
                    className="w-full md:w-64 rounded-xl border-slate-200 h-9"
                    allowClear
                  />
                  <Select
                    value={lettersStatusFilter}
                    onChange={setLettersStatusFilter}
                    className="w-40 rounded-xl h-9"
                  >
                    <Option value="All">All Statuses</Option>
                    <Option value="active">Active</Option>
                    <Option value="archived">Archived</Option>
                  </Select>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <Table
                    dataSource={displayLetterTemplates}
                    pagination={false}
                    rowKey="id"
                    columns={[
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Letter Title</span>,
                        dataIndex: 'name',
                        render: (text) => <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>,
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Category</span>,
                        dataIndex: 'category',
                        render: (text) => <Tag color="purple" className="rounded-full border-none font-bold text-[10px] px-2.5 py-0.5">{text}</Tag>,
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Status</span>,
                        dataIndex: 'status',
                        render: (status) => (
                          <Tag color={status === 'active' ? 'success' : 'default'} className="rounded-full border-none font-bold uppercase text-[9px] px-2.5">
                            {status}
                          </Tag>
                        ),
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Actions</span>,
                        key: 'actions',
                        align: 'right',
                        render: (_, record) => (
                          <Space size="middle">
                            <button
                              onClick={() => handleToggleLetterStatusDB(record)}
                              className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                              title="Archive / Activate"
                            >
                              <CloseCircleOutlined />
                            </button>
                            <button
                              onClick={() => handleDuplicateLetterDB(record)}
                              className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                              title="Duplicate"
                            >
                              <CopyOutlined />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLetter(record)
                                letterEdit.setFieldsValue({
                                  ...record,
                                  content: record.content || `Dear Dr. {{doctor_name}},\n\nRe: {{client_name}} (DOB: {{dob}})\n\nThank you for referring {{client_name}} to Zealth Allied Health for clinical assessment and management.\n\nClinical Summary:\n{{diagnosis}}\n\nTreatment & Recommendations:\nPatient has commenced active rehabilitation. Further progress update will follow in 6 weeks.\n\nYours sincerely,\n\n{{practitioner_name}}\n{{specialty}}\n{{clinic_name}}`
                                })
                                setLetterModalOpen(true)
                              }}
                              className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                              title="Edit"
                            >
                              <EditOutlined />
                            </button>
                            <button
                              onClick={() => handleDeleteLetterDB(record.id, record.name)}
                              className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Delete"
                            >
                              <DeleteOutlined />
                            </button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>

                {/* Letter Modal */}
                <Modal
                  open={letterModalOpen}
                  onCancel={() => setLetterModalOpen(false)}
                  footer={null}
                  destroyOnHidden
                  width={750}
                  title={<span className="font-extrabold text-base text-slate-800 dark:text-slate-200">{editingLetter ? 'Edit Letter Template' : 'Create Letter Template'}</span>}
                >
                  <Form
                    layout="vertical"
                    form={letterEdit}
                    onFinish={handleSaveLetterDB}
                    className="mt-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item name="name" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Letter Template Title</span>} rules={[{ required: true, message: 'Please enter letter title' }]}>
                        <Input placeholder="e.g. GP Referral & Discharge Summary Letter" className="rounded-xl h-10" />
                      </Form.Item>
                      <Form.Item name="category" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Category</span>} rules={[{ required: true }]}>
                        <Select placeholder="Select category" className="rounded-xl h-10 flex items-center">
                          <Option value="GP Communication">GP Communication / Referral</Option>
                          <Option value="Discharge">Discharge Summary</Option>
                          <Option value="NDIS Medical Summary">NDIS Medical Summary</Option>
                          <Option value="Insurance / WorkCover">Insurance / WorkCover</Option>
                          <Option value="General">General Correspondence</Option>
                        </Select>
                      </Form.Item>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                        Click to Insert Clinical Placeholders
                      </span>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {['{{client_name}}', '{{dob}}', '{{practitioner_name}}', '{{doctor_name}}', '{{specialty}}', '{{diagnosis}}', '{{date}}', '{{clinic_name}}'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const cur = letterEdit.getFieldValue('content') || ''
                              letterEdit.setFieldsValue({ content: `${cur} ${tag} ` })
                              toast.success(`Inserted ${tag}`)
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-[#8C4BFF]/10 text-slate-600 dark:text-slate-300 hover:text-[#8C4BFF] border-none px-2 py-0.5 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Form.Item name="content" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Letter Body Content & Placeholder Layout</span>}>
                      <Input.TextArea
                        rows={11}
                        placeholder="Write letter template body using placeholders above..."
                        className="rounded-xl font-mono text-xs p-4 leading-relaxed bg-slate-50/50 dark:bg-slate-950/60"
                      />
                    </Form.Item>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-150 dark:border-slate-800">
                      <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={handlePreviewLetter}
                        className="rounded-xl font-bold text-xs h-9"
                      >
                        Preview Letter
                      </Button>
                      <div className="flex gap-2">
                        <Button onClick={() => setLetterModalOpen(false)} className="rounded-xl font-bold h-9">
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                          className="rounded-xl font-bold h-9 text-white"
                        >
                          Save & Publish Letter
                        </Button>
                      </div>
                    </div>
                  </Form>
                </Modal>
              </div>
            )}

            {activeTemplateTab === 'notes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Note Templates</h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">
                      Configure notes models. Note templates support placeholders that auto-populate active patient metadata.
                    </p>
                  </div>
                  <button
                    onClick={() => setNoteModalOpen(true)}
                    className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
                  >
                    <PlusOutlined />
                    <span>Create Template</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1 space-y-2">
                    <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block mb-2">Note Profiles</span>
                    {store.noteTemplates.map((t) => (
                      <div
                        key={t.id}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${selectedNote?.id === t.id
                            ? 'border-[#8C4BFF] bg-[#8C4BFF]/5 text-[#8C4BFF]'
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <button
                          onClick={() => setSelectedNote(t)}
                          className={`text-left bg-transparent border-none font-bold text-xs cursor-pointer truncate flex-1 ${selectedNote?.id === t.id ? 'text-[#8C4BFF]' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          {t.name}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNoteDB(t)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer p-0.5 ml-1"
                          title="Delete Template"
                        >
                          <DeleteOutlined style={{ fontSize: 12 }} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-3">
                    {selectedNote ? (
                      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Template Title</span>
                            <h3 className="text-base font-extrabold text-slate-800 dark:text-white m-0 mt-0.5">{selectedNote.name}</h3>
                          </div>
                        </div>

                        <div>
                          <div className="mb-4">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-2">
                              Placeholders (Click to insert at cursor position)
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {['{{Client Name}}', '{{DOB}}', '{{NDIS Number}}', '{{Diagnosis}}', '{{Practitioner Name}}'].map((pl) => (
                                <button
                                  key={pl}
                                  type="button"
                                  onClick={() => {
                                    const newContent = selectedNote.content + ` ${pl} `
                                    handleUpdateNoteContentDB(selectedNote, newContent)
                                    toast.success(`Inserted ${pl}`)
                                  }}
                                  className="bg-slate-100 dark:bg-slate-800 hover:bg-[#8C4BFF]/10 dark:hover:bg-[#8C4BFF]/20 text-slate-600 dark:text-slate-300 hover:text-[#8C4BFF] border-none px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer transition-colors"
                                >
                                  {pl}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mb-5 flex-1 flex flex-col">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                              Notes Structure / Text Content
                            </span>
                            <Input.TextArea
                              value={selectedNote.content}
                              onChange={(e) => {
                                handleUpdateNoteContentDB(selectedNote, e.target.value)
                              }}
                              autoSize={{ minRows: 18, maxRows: 35 }}
                              style={{ minHeight: '480px' }}
                              className="w-full text-slate-700 dark:text-slate-200 text-xs leading-relaxed font-mono rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:bg-white"
                              placeholder="Write clinical notes template structure and placeholders here..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800 mt-2">
                          <Button
                            onClick={() => setNotePreviewModalOpen(true)}
                            className="rounded-xl font-bold h-10 text-xs px-5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                            icon={<EyeOutlined />}
                          >
                            Preview Template
                          </Button>
                          <Button
                            type="primary"
                            onClick={handleSaveNotesLayoutDB}
                            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                            className="rounded-xl font-bold h-10 text-xs px-5 border-none"
                          >
                            Save Notes Layout
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 font-semibold">
                        Select a note template profile from the left list.
                      </div>
                    )}
                  </div>
                </div>

                {/* Note Template Modal */}
                <Modal
                  open={noteModalOpen}
                  onCancel={() => setNoteModalOpen(false)}
                  footer={null}
                  destroyOnHidden
                  width={400}
                  title={<span className="font-bold text-slate-800 dark:text-slate-200">Create Note Template</span>}
                >
                  <Form
                    layout="vertical"
                    onFinish={(values) => handleSaveNoteDB(values.name)}
                    className="mt-4"
                  >
                    <Form.Item name="name" label="Template name" rules={[{ required: true, message: 'Please enter template name' }]}>
                      <Input placeholder="e.g. Daily Check-in Note" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button onClick={() => setNoteModalOpen(false)}>Cancel</Button>
                      <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}>
                        Create
                      </Button>
                    </div>
                  </Form>
                </Modal>

                {/* Note Preview Modal */}
                <Modal
                  open={notePreviewModalOpen}
                  onCancel={() => setNotePreviewModalOpen(false)}
                  footer={null}
                  destroyOnHidden
                  width={600}
                  title={<span className="font-bold text-slate-800 dark:text-slate-200">Template Preview: {selectedNote?.name}</span>}
                  className="dark:bg-slate-900 rounded-2xl"
                >
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-xl whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed max-h-[60vh] overflow-y-auto mt-4 shadow-inner">
                    {selectedNote?.content ? selectedNote.content.split(/(\{\{[^}]+\}\})/).map((part, i) => {
                      if (part.startsWith('{{') && part.endsWith('}}')) {
                        return <span key={i} className="text-[#8C4BFF] font-bold bg-[#8C4BFF]/10 px-1 rounded">{part}</span>;
                      }
                      return part;
                    }) : 'No content...'}
                  </div>
                </Modal>
              </div>
            )}

            {activeTemplateTab === 'invoices' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Invoice Templates</h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">
                    Set billing terms, payment rules, custom logos, and different layouts based on funding schemas.
                  </p>
                </div>

                <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                  <Form
                    layout="vertical"
                    initialValues={{
                      terms: store.invoiceTemplates.paymentTerms,
                      footer: store.invoiceTemplates.footerText,
                    }}
                    onFinish={handleSaveInvoiceTemplatesDB}
                  >
                    {/* Upload logo */}
                    <div className="mb-6">
                      <span className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2">Upload Clinic Logo</span>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                          {store.invoiceTemplates.logoUrl ? (
                            <img src={store.invoiceTemplates.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <PictureOutlined style={{ fontSize: 20 }} />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              const file = e.target.files[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = async (readerEvent) => {
                                  const base64 = readerEvent.target.result
                                  useClinicStore.setState(state => ({
                                    invoiceTemplates: {
                                      ...state.invoiceTemplates,
                                      logoUrl: base64
                                    }
                                  }))
                                  await updateInvoiceTemplatesApi({ logoUrl: base64 })
                                  toast.success('Clinic logo uploaded and saved to live database!')
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
                        >
                          Choose Image...
                        </button>
                        {store.invoiceTemplates.logoUrl && (
                          <button
                            type="button"
                            onClick={async () => {
                              useClinicStore.setState(state => ({
                                invoiceTemplates: {
                                  ...state.invoiceTemplates,
                                  logoUrl: null
                                }
                              }))
                              await updateInvoiceTemplatesApi({ logoUrl: null })
                              toast.success('Logo removed from live database!')
                            }}
                            className="bg-transparent border-none text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item name="terms" label="Standard Payment Terms" rules={[{ required: true }]}>
                        <Select className="w-full flex items-center">
                          <Option value="Due on Receipt">Due on Receipt</Option>
                          <Option value="7 Days">7 Days</Option>
                          <Option value="14 Days">14 Days</Option>
                          <Option value="30 Days">30 Days</Option>
                        </Select>
                      </Form.Item>
                    </div>

                    <Form.Item name="footer" label="Invoice Footer Information" rules={[{ required: true }]}>
                      <Input.TextArea rows={3} placeholder="Thank you for choosing our practice." />
                    </Form.Item>

                    <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                      <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-10 px-8 shadow-sm">
                        Save Invoicing Configurations
                      </Button>
                    </div>
                  </Form>
                </Card>
              </div>
            )}
          </div>
        )
      }

      case 'services': {
        const displayServices = store.services.filter((item) => {
          if (item.archived) return false
          if (!servicesSearch.trim()) return true
          const q = servicesSearch.toLowerCase()
          return (
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.ndisCode && item.ndisCode.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q))
          )
        })

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Services</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Configure services offered by practitioners. Service entries display within the calendar and invoice selectors.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  icon={<SyncOutlined spin={loadingServices} />}
                  onClick={fetchServices}
                  className="rounded-xl font-semibold border-slate-200 h-9"
                >
                  Refresh Services DB
                </Button>
                <button
                  onClick={() => {
                    setEditingService(null)
                    serviceForm.resetFields()
                    setServiceModalOpen(true)
                  }}
                  className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
                >
                  <PlusOutlined />
                  <span>Add Service</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar for Services */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
              <Input
                placeholder="Search services by name, NDIS code..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={servicesSearch}
                onChange={(e) => setServicesSearch(e.target.value)}
                className="w-full md:w-80 rounded-xl border-slate-200 h-9"
                allowClear
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={displayServices}
                pagination={false}
                rowKey="id"
                columns={[
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Service Name</span>,
                    dataIndex: 'name',
                    render: (text, record) => (
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: record.color || '#8C4BFF' }} />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>
                      </div>
                    ),
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Duration</span>,
                    dataIndex: 'duration',
                    render: (text) => <span className="font-semibold text-slate-600">{text} min</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Price (Excl. GST)</span>,
                    dataIndex: 'price',
                    render: (text) => <span className="font-extrabold text-[#8C4BFF]">${text}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">NDIS Code</span>,
                    dataIndex: 'ndisCode',
                    render: (text) => <span className="font-mono text-xs text-slate-400">{text || '—'}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Actions</span>,
                    key: 'actions',
                    align: 'right',
                    render: (_, record) => (
                      <Space size="middle">
                        <button
                          onClick={() => {
                            setEditingService(record)
                            serviceForm.setFieldsValue({
                              ...record,
                              invoiceDescription: record.description || record.invoiceDescription
                            })
                            setServiceModalOpen(true)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Edit"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={() => handleArchiveServiceDB(record)}
                          className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                          title={record.archived ? "Unarchive" : "Archive"}
                        >
                          <CloseCircleOutlined />
                        </button>
                        <button
                          onClick={() => handleDeleteServiceDB(record.id, record.name)}
                          className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Remove"
                        >
                          <DeleteOutlined />
                        </button>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>

            {/* Service Modal */}
            <Modal
              open={serviceModalOpen}
              onCancel={() => setServiceModalOpen(false)}
              footer={null}
              destroyOnHidden
              width={520}
              title={<span className="font-bold text-slate-800 dark:text-slate-200">{editingService ? 'Edit Service' : 'Add Service'}</span>}
            >
              <Form
                layout="vertical"
                form={serviceForm}
                onFinish={handleSaveServiceDB}
                className="mt-4"
              >
                <Form.Item name="name" label="Service name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Hydrotherapy Treatment" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item name="duration" label="Duration (minutes)" rules={[{ required: true }]}>
                    <Select>
                      <Option value={15}>15 mins</Option>
                      <Option value={30}>30 mins</Option>
                      <Option value={45}>45 mins</Option>
                      <Option value={60}>60 mins</Option>
                      <Option value={90}>90 mins</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="price" label="Standard Price ($)" rules={[{ required: true }]}>
                    <Input type="number" placeholder="150" />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item name="ndisCode" label="NDIS Line Code">
                    <Input placeholder="e.g. 01_760_0128_1_3" />
                  </Form.Item>
                  <Form.Item name="color" label="Calendar Color Highlight" rules={[{ required: true }]}>
                    <Select>
                      <Option value="#30D2BE">Teal</Option>
                      <Option value="#8C4BFF">Purple</Option>
                      <Option value="#3B82F6">Blue</Option>
                      <Option value="#10B981">Green</Option>
                      <Option value="#F59E0B">Yellow</Option>
                      <Option value="#EF4444">Red</Option>
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item name="invoiceDescription" label="Invoice Description">
                  <Input.TextArea placeholder="Default description to appear on invoices" rows={2} />
                </Form.Item>

                <Form.Item name="gst" valuePropName="checked">
                  <Checkbox className="text-slate-500 font-semibold text-xs">GST Applies to this service rate</Checkbox>
                </Form.Item>

                <div className="flex justify-end gap-2 mt-6">
                  <Button onClick={() => setServiceModalOpen(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}>
                    Save Service
                  </Button>
                </div>
              </Form>
            </Modal>
          </div>
        )
      }

      case 'cancellation': {
        const displayCancellationReasons = store.cancellationReasons.filter((r) => {
          if (r.archived) return false
          if (!cancellationSearch.trim()) return true
          return r.reason && r.reason.toLowerCase().includes(cancellationSearch.toLowerCase())
        })

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Cancellation Reasons</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Configure reasons selected by practitioners when cancelling booked appointments.
                </p>
              </div>
              <Button
                icon={<SyncOutlined spin={loadingCancellations} />}
                onClick={fetchCancellationReasons}
                className="rounded-xl font-semibold border-slate-200 h-9"
              >
                Refresh Reasons DB
              </Button>
            </div>

            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-3">
                {editingCancellation ? 'Edit Cancellation Reason' : 'Add Cancellation Reason'}
              </span>
              <div className="flex gap-3 max-w-lg mb-6">
                <Input
                  value={cancellationText}
                  onChange={(e) => setCancellationText(e.target.value)}
                  onPressEnter={() => {
                    const text = cancellationText.trim()
                    if (!text) {
                      toast.error('Please enter a reason description.')
                      return
                    }
                    handleSaveCancellationReasonDB(text)
                  }}
                  placeholder="e.g. Weather Issues"
                  className="rounded-xl h-10 flex-1"
                />
                <Button
                  onClick={() => {
                    const text = cancellationText.trim()
                    if (!text) {
                      toast.error('Please enter a reason description.')
                      return
                    }
                    handleSaveCancellationReasonDB(text)
                  }}
                  type="primary"
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                  className="rounded-xl h-10 font-bold"
                >
                  {editingCancellation ? 'Update' : 'Add Reason'}
                </Button>
                {editingCancellation && (
                  <Button
                    onClick={() => {
                      setEditingCancellation(null)
                      setCancellationText('')
                    }}
                    className="rounded-xl h-10"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Filter Toolbar */}
              <div className="mb-4 max-w-2xl">
                <Input
                  placeholder="Search cancellation reasons..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={cancellationSearch}
                  onChange={(e) => setCancellationSearch(e.target.value)}
                  className="w-full rounded-xl border-slate-200 h-9"
                  allowClear
                />
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-w-2xl">
                <Table
                  dataSource={displayCancellationReasons}
                  pagination={false}
                  rowKey="id"
                  showHeader={false}
                  columns={[
                    {
                      title: 'ReasonText',
                      dataIndex: 'reason',
                      render: (text) => <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{text}</span>,
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      align: 'right',
                      render: (_, record) => (
                        <Space>
                          <button
                            onClick={() => {
                              setEditingCancellation(record)
                              setCancellationText(record.reason)
                            }}
                            className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                            title="Edit"
                          >
                            <EditOutlined style={{ fontSize: 13 }} />
                          </button>
                          <button
                            onClick={() => handleArchiveCancellationReasonDB(record)}
                            className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                            title={record.archived ? "Unarchive" : "Archive"}
                          >
                            <CloseCircleOutlined style={{ fontSize: 13 }} />
                          </button>
                          <button
                            onClick={() => handleDeleteCancellationReasonDB(record.id, record.reason)}
                            className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Delete"
                          >
                            <DeleteOutlined style={{ fontSize: 13 }} />
                          </button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          </div>
        )
      }

      case 'tags': {
        const displayTags = store.clientTags.filter((item) => {
          if (!tagsSearch.trim()) return true
          const q = tagsSearch.toLowerCase()
          return (
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.color && item.color.toLowerCase().includes(q)) ||
            (item.icon && item.icon.toLowerCase().includes(q))
          )
        })

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Client Tags</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Create and color-code client classification tags used throughout profile sheets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  icon={<SyncOutlined spin={loadingTags} />}
                  onClick={fetchClientTags}
                  className="rounded-xl font-semibold border-slate-200 h-9"
                >
                  Refresh Tags DB
                </Button>
                <button
                  onClick={() => {
                    setEditingTag(null)
                    tagForm.resetFields()
                    setActiveColorHex('#8C4BFF')
                    tagForm.setFieldsValue({
                      color: '#8C4BFF',
                      icon: 'TagOutlined'
                    })
                    setTagModalOpen(true)
                  }}
                  className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
                >
                  <PlusOutlined />
                  <span>Create Tag</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar for Client Tags */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
              <Input
                placeholder="Search client tags by identifier, color..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={tagsSearch}
                onChange={(e) => setTagsSearch(e.target.value)}
                className="w-full md:w-80 rounded-xl border-slate-200 h-9"
                allowClear
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={displayTags}
                pagination={false}
                rowKey="id"
                columns={[
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Tag Identifier</span>,
                    dataIndex: 'name',
                    render: (text, record) => (
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: record.color }} />
                        <span className="text-slate-500 flex items-center justify-center">
                          {renderTagIcon(record.icon)}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>
                      </div>
                    ),
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Color Dot</span>,
                    dataIndex: 'color',
                    render: (color) => (
                      <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {color}
                      </span>
                    ),
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Assigned Icon</span>,
                    dataIndex: 'icon',
                    render: (icon) => (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-slate-600 dark:text-slate-300">
                        {renderTagIcon(icon)}
                        <span className="font-mono text-[10px] text-slate-400">{icon || 'TagOutlined'}</span>
                      </span>
                    ),
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Actions</span>,
                    key: 'actions',
                    align: 'right',
                    render: (_, record) => (
                      <Space size="middle">
                        <button
                          onClick={() => {
                            setEditingTag(record)
                            setActiveColorHex(record.color || '#8C4BFF')
                            tagForm.setFieldsValue({
                              ...record,
                              color: record.color || '#8C4BFF',
                              icon: record.icon || 'TagOutlined',
                            })
                            setTagModalOpen(true)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Edit"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={() => handleDeleteTagDB(record.id, record.name)}
                          className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Delete"
                        >
                          <DeleteOutlined />
                        </button>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>

            {/* Tag Modal with Broad 24+ Color-Block Palette & Custom Color Picker */}
            <Modal
              open={tagModalOpen}
              onCancel={() => setTagModalOpen(false)}
              footer={null}
              destroyOnHidden
              width={520}
              title={
                <div className="flex items-center gap-2">
                  <TagOutlined style={{ color: activeColorHex }} />
                  <span className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    {editingTag ? 'Edit Client Tag' : 'Create New Client Tag'}
                  </span>
                </div>
              }
            >
              <Form
                layout="vertical"
                form={tagForm}
                onFinish={handleSaveTagDB}
                className="mt-4 font-sans space-y-4"
              >
                <Form.Item
                  name="name"
                  label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tag Name / Identifier</span>}
                  rules={[{ required: true, message: 'Please enter a tag name' }]}
                >
                  <Input placeholder="e.g. Falls Risk, VIP, NDIS, Medicare..." className="rounded-xl h-10" />
                </Form.Item>

                {/* Broad Color Palette Section */}
                <Form.Item
                  name="color"
                  label={
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Select Tag Color (24+ Curated Swatches & Custom Picker)
                      </span>
                      <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800" style={{ color: activeColorHex }}>
                        {activeColorHex}
                      </span>
                    </div>
                  }
                  rules={[{ required: true, message: 'Please select a color' }]}
                  initialValue={activeColorHex}
                >
                  <div className="space-y-3 pt-1">
                    {/* 24 Curated Color Blocks Grid */}
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      {TAG_COLOR_PALETTE.map((swatch) => {
                        const isSelected = activeColorHex?.toLowerCase() === swatch.hex.toLowerCase()
                        return (
                          <Tooltip key={swatch.hex} title={`${swatch.name} (${swatch.hex})`}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveColorHex(swatch.hex)
                                tagForm.setFieldsValue({ color: swatch.hex })
                              }}
                              style={{ backgroundColor: swatch.hex }}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer transition-all border-none ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 ring-[#8C4BFF] scale-110 shadow'
                                  : 'hover:scale-105 opacity-90 hover:opacity-100'
                              }`}
                            >
                              {isSelected && <CheckOutlined style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }} />}
                            </button>
                          </Tooltip>
                        )
                      })}
                    </div>

                    {/* Custom Color Input & Live Preview */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input
                          type="color"
                          value={activeColorHex || '#8C4BFF'}
                          onChange={(e) => {
                            setActiveColorHex(e.target.value)
                            tagForm.setFieldsValue({ color: e.target.value })
                          }}
                          className="w-7 h-7 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                        />
                        <Input
                          value={activeColorHex}
                          onChange={(e) => {
                            setActiveColorHex(e.target.value)
                            tagForm.setFieldsValue({ color: e.target.value })
                          }}
                          placeholder="#8C4BFF"
                          className="font-mono text-xs uppercase bg-transparent border-none p-0 focus:ring-0"
                        />
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: activeColorHex + '18',
                          borderColor: activeColorHex + '40',
                          color: activeColorHex
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColorHex }} />
                        <span>Live Tag Preview</span>
                      </div>
                    </div>
                  </div>
                </Form.Item>

                <Form.Item
                  name="icon"
                  label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Icon</span>}
                  rules={[{ required: true }]}
                  initialValue="TagOutlined"
                >
                  <Select className="rounded-xl h-10 flex items-center">
                    {Object.keys(tagIconsMap).map((iconKey) => (
                      <Option key={iconKey} value={iconKey}>
                        <span className="inline-flex items-center gap-2 text-xs">
                          {tagIconsMap[iconKey]}
                          <span className="font-semibold">{iconKey.replace('Outlined', '')}</span>
                        </span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button onClick={() => setTagModalOpen(false)} className="rounded-xl h-10">
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                    className="rounded-xl font-bold h-10 px-6 text-white shadow"
                  >
                    Save Tag to Database
                  </Button>
                </div>
              </Form>
            </Modal>
          </div>
        )
      }

      case 'import_export':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Data Management</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Import or export clinic directories including client registers, practitioner timetables, and billing details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Import Card */}
              <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <UploadOutlined className="text-[#8C4BFF]" style={{ fontSize: 20 }} />
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">Import Clinic Data</h3>
                </div>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed font-semibold">
                  Upload CSV spreadsheets. Make sure column headers align with fields (name, email, phone, etc.).
                </p>

                <Form
                  layout="vertical"
                  onFinish={() => {
                    if (!importFile) {
                      toast.error('Please select a CSV file first!')
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      try {
                        const text = e.target.result
                        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
                        if (lines.length <= 1) {
                          toast.error('The selected CSV file has no records!')
                          return
                        }
                        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))

                        // Header check: require a 'name' column case-insensitively
                        const nameColIdx = headers.findIndex(h => h.toLowerCase() === 'name')
                        if (nameColIdx === -1) {
                          const errorsList = [{ row: 1, field: 'headers', message: "CSV is missing the required 'name' column header." }]
                          store.addImportExportLog({
                            type: 'Import',
                            fileName: importFile.name,
                            target: importTarget === 'clients' ? 'Clients Register' : 'Contacts Directory',
                            status: 'Failed',
                            recordsProcessed: 0,
                            errors: errorsList,
                          })
                          setSelectedErrors(errorsList)
                          setSelectedLogFileName(importFile.name)
                          setErrorModalOpen(true)
                          toast.error('Import failed: Missing name column header.')
                          setImportFile(null)
                          return
                        }

                        const errorsList = []
                        const parsedRecords = []

                        for (let i = 1; i < lines.length; i++) {
                          const rowValues = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
                          const record = {}
                          headers.forEach((h, idx) => {
                            record[h.toLowerCase()] = rowValues[idx] || ''
                          })

                          const rowNum = i + 1
                          const rowName = record['name'] ? record['name'].trim() : ''

                          // Validate Name
                          if (!rowName) {
                            errorsList.push({
                              row: rowNum,
                              field: 'name',
                              message: 'Name is required'
                            })
                          }

                          // Validate Email
                          const emailVal = record['email'] ? record['email'].trim() : ''
                          if (emailVal && !emailVal.includes('@')) {
                            errorsList.push({
                              row: rowNum,
                              field: 'email',
                              message: 'Email address format is invalid: missing @ symbol'
                            })
                          }

                          parsedRecords.push(record)
                        }

                        if (errorsList.length > 0) {
                          store.addImportExportLog({
                            type: 'Import',
                            fileName: importFile.name,
                            target: importTarget === 'clients' ? 'Clients Register' : 'Contacts Directory',
                            status: 'Failed',
                            recordsProcessed: 0,
                            errors: errorsList,
                          })
                          setSelectedErrors(errorsList)
                          setSelectedLogFileName(importFile.name)
                          setErrorModalOpen(true)
                          toast.error('Import failed with validation errors. Please check the error report.')
                          setImportFile(null)
                          return
                        }

                        // Process import records
                        parsedRecords.forEach((record) => {
                          if (importTarget === 'clients') {
                            store.addPatient({
                              name: record.name,
                              dob: record.dob || '1990-01-01',
                              gender: record.gender || 'Other',
                              email: record.email || '',
                              phone: record.phone || '',
                              primaryPractitioner: record.primarypractitioner || record.practitioner || 'Dr. Sarah Jenkins',
                              status: record.status || 'active'
                            })
                          } else if (importTarget === 'contacts') {
                            store.addContact({
                              name: record.name,
                              type: record.type || 'Other',
                              company: record.company || '',
                              email: record.email || '',
                              mobileNumber: record.mobilenumber || record.phone || ''
                            })
                          } else if (importTarget === 'appointments') {
                            store.addAppointment({
                              id: `a_${Date.now()}_${Math.random()}`,
                              patientName: record.patientname || record.patient || 'Unknown Client',
                              patientId: 'N/A',
                              practitionerName: record.practitionername || record.practitioner || 'Dr. Sarah Jenkins',
                              practitionerId: '1',
                              date: record.date || dayjs().format('YYYY-MM-DD'),
                              time: record.time || '10:00',
                              status: record.status || 'Active',
                              appointmentType: record.appointmenttype || record.type || 'Consultation'
                            })
                          } else if (importTarget === 'invoices') {
                            store.addInvoice({
                              id: `INV-${Date.now()}`,
                              patientName: record.patientname || record.clientname || 'Unknown Client',
                              practitioner: record.practitioner || 'Dr. Sarah Jenkins',
                              issueDate: record.issuedate || dayjs().format('YYYY-MM-DD'),
                              dueDate: record.duedate || dayjs().add(14, 'day').format('YYYY-MM-DD'),
                              amount: parseFloat(record.amount) || 150,
                              due: parseFloat(record.due) || 150,
                              status: record.status || 'Draft',
                              sentStatus: record.sentstatus || 'Not Sent'
                            })
                          } else if (importTarget === 'services') {
                            store.addService({
                              id: `s_${Date.now()}_${Math.random()}`,
                              name: record.name || 'New Service',
                              duration: parseInt(record.duration) || 60,
                              price: parseFloat(record.price) || 150,
                              ndisCode: record.ndiscode || record.ndis || '',
                              color: record.color || '#8C4BFF',
                              archived: false,
                              gst: record.gst === 'true' || record.gst === '1'
                            })
                          }
                        })

                        store.addImportExportLog({
                          type: 'Import',
                          fileName: importFile.name,
                          target: importTarget === 'clients'
                            ? 'Clients Register'
                            : importTarget === 'contacts'
                              ? 'Contacts Directory'
                              : importTarget === 'appointments'
                                ? 'Appointments Log'
                                : importTarget === 'invoices'
                                  ? 'Invoice Ledgers'
                                  : 'Services Directory',
                          status: 'Success',
                          recordsProcessed: parsedRecords.length,
                          errors: [],
                        })
                        toast.success(`Successfully imported ${parsedRecords.length} records into the Zustand store!`)
                        setImportFile(null)
                      } catch (err) {
                        toast.error('Failed to parse CSV file. Check formatting!')
                        console.error(err)
                      }
                    }
                    reader.readAsText(importFile)
                  }}
                >
                  <Form.Item label={<span className="text-slate-500 font-bold text-[11px] uppercase">Import Target</span>}>
                    <Select value={importTarget} onChange={setImportTarget} className="w-full flex items-center">
                      <Option value="clients">Clients Register</Option>
                      <Option value="contacts">Contacts Directory</Option>
                      <Option value="appointments">Appointments Log</Option>
                      <Option value="invoices">Invoice Ledgers</Option>
                      <Option value="services">Services Directory</Option>
                    </Select>
                  </Form.Item>

                  {/* CSV Template Download */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 m-0">Download Column Template</p>
                      <p className="text-[10px] text-blue-500 dark:text-blue-400 m-0 mt-0.5">Use this template to ensure your CSV columns match required fields.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const templates = {
                          clients: { name: 'Clients_Template.csv', headers: 'name,dob,gender,email,phone,primaryPractitioner,status' },
                          contacts: { name: 'Contacts_Template.csv', headers: 'name,type,company,email,phone' },
                          appointments: { name: 'Appointments_Template.csv', headers: 'patientName,practitionerName,date,time,status,appointmentType' },
                          invoices: { name: 'Invoices_Template.csv', headers: 'patientName,practitioner,issueDate,dueDate,amount,due,status' },
                          services: { name: 'Services_Template.csv', headers: 'name,duration,price,ndisCode,color,gst' },
                        }
                        const tpl = templates[importTarget] || templates.clients
                        const blob = new Blob([tpl.headers + '\n'], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = tpl.name
                        a.click()
                        URL.revokeObjectURL(url)
                        toast.success(`Downloaded ${tpl.name}`)
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                      <DownloadOutlined style={{ fontSize: 12 }} /> Download
                    </button>
                  </div>

                  <div
                    onClick={() => document.getElementById('csv-file-input').click()}
                    className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50 dark:bg-slate-800 mb-5 cursor-pointer hover:border-[#8C4BFF] transition-all"
                  >
                    <DatabaseOutlined className="text-slate-400 mb-2" style={{ fontSize: 24 }} />
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {importFile ? `Selected: ${importFile.name}` : 'Click to select CSV file'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">Accepts CSV files (Max 20MB)</span>
                    <input
                      type="file"
                      id="csv-file-input"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImportFile(e.target.files[0])
                        }
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer w-full transition-colors"
                  >
                    Process Import
                  </button>
                </Form>
              </Card>

              {/* Export Card */}
              <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <DownloadOutlined className="text-[#8C4BFF]" style={{ fontSize: 20 }} />
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">Export Clinic Data</h3>
                </div>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed font-semibold">
                  Export platform records as structured files. Ideal for backups, reporting audits, or migration packages.
                </p>

                <Form
                  layout="vertical"
                  onFinish={(values) => {
                    const target = values.target || 'clients'
                    const format = values.format || 'csv'
                    let dataToExport = []
                    let headers = []
                    const fileName = `${target}_export_${Date.now()}.csv`

                    if (target === 'clients') {
                      dataToExport = store.patients
                      headers = ['id', 'name', 'dob', 'gender', 'email', 'phone', 'primaryPractitioner', 'status']
                    } else if (target === 'contacts') {
                      dataToExport = store.contacts
                      headers = ['id', 'name', 'type', 'company', 'email', 'mobileNumber']
                    } else if (target === 'appointments') {
                      dataToExport = store.appointments
                      headers = ['id', 'patientName', 'practitionerName', 'date', 'time', 'status', 'appointmentType']
                    } else if (target === 'invoices') {
                      dataToExport = store.invoices
                      headers = ['id', 'patientName', 'practitioner', 'issueDate', 'dueDate', 'amount', 'status']
                    } else if (target === 'financial') {
                      dataToExport = store.invoices
                      headers = ['id', 'amount', 'due', 'status']
                    }

                    let targetName = 'Clients Register'
                    if (target === 'contacts') targetName = 'Contacts Directory'
                    else if (target === 'appointments') targetName = 'Appointments Log'
                    else if (target === 'invoices') targetName = 'Invoice Ledgers'
                    else if (target === 'financial') targetName = 'Financial Performance Overview'

                    if (format === 'csv') {
                      const csvRows = []
                      csvRows.push(headers.join(','))
                      dataToExport.forEach(item => {
                        const row = headers.map(header => {
                          const val = item[header] !== undefined ? item[header] : ''
                          const stringVal = typeof val === 'string' ? val : String(val)
                          const cleanVal = stringVal.replace(/"/g, '""')
                          return cleanVal.includes(',') || cleanVal.includes('"') ? `"${cleanVal}"` : cleanVal
                        })
                        csvRows.push(row.join(','))
                      })
                      const csvString = csvRows.join('\n')

                      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
                      const link = document.createElement('a')
                      link.href = URL.createObjectURL(blob)
                      link.setAttribute('download', fileName)
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)

                      store.addImportExportLog({
                        type: 'Export',
                        fileName,
                        target: targetName,
                        status: 'Success',
                        recordsProcessed: dataToExport.length,
                        errors: []
                      })
                      toast.success(`Successfully exported ${dataToExport.length} records to ${fileName}!`)
                    } else {
                      const ext = format === 'xlsx' ? 'xlsx' : 'pdf'
                      const otherFileName = `${target}_export_${Date.now()}.${ext}`
                      store.addImportExportLog({
                        type: 'Export',
                        fileName: otherFileName,
                        target: targetName,
                        status: 'Success',
                        recordsProcessed: dataToExport.length,
                        errors: []
                      })
                      toast.success(`Exporting ${target} details as ${format.toUpperCase()}!`)
                    }
                  }}
                >
                  <Form.Item name="target" label={<span className="text-slate-500 font-bold text-[11px] uppercase">Export Target</span>} initialValue="clients">
                    <Select className="w-full flex items-center">
                      <Option value="clients">Clients Register</Option>
                      <Option value="contacts">Contacts Directory</Option>
                      <Option value="appointments">Appointments Log</Option>
                      <Option value="invoices">Invoice Ledgers</Option>
                      <Option value="financial">Financial Performance Overview</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="format" label={<span className="text-slate-500 font-bold text-[11px] uppercase">File Format</span>} initialValue="csv">
                    <Radio.Group className="w-full flex gap-3">
                      <Radio.Button value="csv" className="flex-1 text-center font-bold text-xs h-9 flex items-center justify-center rounded-lg">CSV</Radio.Button>
                      <Radio.Button value="xlsx" className="flex-1 text-center font-bold text-xs h-9 flex items-center justify-center rounded-lg">Excel</Radio.Button>
                      <Radio.Button value="pdf" className="flex-1 text-center font-bold text-xs h-9 flex items-center justify-center rounded-lg">PDF</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <button
                    type="submit"
                    className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/95 text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer w-full transition-colors mt-4"
                  >
                    Export Data
                  </button>
                </Form>
              </Card>

              {/* Clear Sample / Test Data Card */}
              <Card className="border border-red-100 dark:border-red-950/40 bg-red-50/30 dark:bg-red-950/10 rounded-2xl shadow-sm col-span-1 md:col-span-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center flex-shrink-0">
                      <DeleteOutlined style={{ fontSize: 18 }} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white m-0">Clear Sample Test Data</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-1">
                        Purge temporary test data, repetitive dummy messages, and unneeded junk records from your database.
                      </p>
                    </div>
                  </div>
                  <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Purge Sample & Test Data?',
                        content: 'Are you sure you want to clean up dummy test data from the database? Real clinic records will remain safe.',
                        okText: 'Yes, Clear Test Data',
                        okType: 'danger',
                        onOk: async () => {
                          try {
                            const res = await clearSampleTestData()
                            if (res && res.success) {
                              toast.success(res.message || 'Sample test data cleared successfully!')
                              if (store.fetchLiveWaitlist) store.fetchLiveWaitlist()
                            }
                          } catch (err) {
                            toast.error('Failed to clear sample data')
                          }
                        }
                      })
                    }}
                    className="rounded-xl font-bold h-10 px-5 text-xs shadow-sm flex-shrink-0"
                  >
                    Clear Sample Test Data
                  </Button>
                </div>
              </Card>
            </div>

            {/* Activity History Logs */}
            <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">Activity History Logs</h3>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">
                    Complete registry of database import and export actions executed on the platform.
                  </p>
                </div>
              </div>

              <Table
                dataSource={store.importExportLogs}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Type</span>,
                    dataIndex: 'type',
                    render: (type) => (
                      <Tag
                        color={type === 'Import' ? 'emerald' : 'purple'}
                        className="rounded-full border-none font-bold text-[10px] px-2.5 py-0.5"
                      >
                        {type}
                      </Tag>
                    ),
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">File Name</span>,
                    dataIndex: 'fileName',
                    render: (text) => <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{text}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Target Section</span>,
                    dataIndex: 'target',
                    render: (text) => <span className="font-bold text-slate-500 text-xs">{text}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Timestamp</span>,
                    dataIndex: 'timestamp',
                    render: (text) => <span className="text-slate-400 text-xs font-medium">{text}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Status</span>,
                    dataIndex: 'status',
                    render: (status) => (
                      <Tag
                        color={status === 'Success' ? 'success' : 'error'}
                        className="rounded-full border-none font-bold text-[9px] uppercase px-2.5"
                      >
                        {status}
                      </Tag>
                    ),
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Records</span>,
                    dataIndex: 'recordsProcessed',
                    align: 'center',
                    render: (count) => <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{count}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Actions</span>,
                    key: 'actions',
                    align: 'right',
                    render: (_, record) => {
                      if (record.status === 'Failed' || (record.errors && record.errors.length > 0)) {
                        return (
                          <Button
                            type="link"
                            onClick={() => {
                              setSelectedErrors(record.errors || [])
                              setSelectedLogFileName(record.fileName)
                              setErrorModalOpen(true)
                            }}
                            className="text-red-500 hover:text-red-700 font-bold text-xs p-0 border-none bg-transparent cursor-pointer"
                          >
                            View Errors
                          </Button>
                        )
                      }
                      return (
                        <span className="text-slate-300 text-xs font-semibold">—</span>
                      )
                    },
                  },
                ]}
              />
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Security Settings</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Enable multi-factor protection, manage connected device logs, and reset secure passwords.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2FA Card */}
              {SHOW_2FA && (
                <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <SafetyCertificateOutlined className="text-[#8C4BFF]" style={{ fontSize: 20 }} />
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">Two-Factor Authentication (2FA)</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed font-semibold">
                    Add an extra layer of protection to your clinician accounts. Requires a one-time passcode at sign-in.
                  </p>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-5 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">2FA Status</span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Protects clinic administration</span>
                    </div>
                    <Tag color={tfaEnabled ? 'success' : 'default'} className="rounded-full border-none font-bold text-[10px] uppercase px-3">
                      {tfaEnabled ? 'Enabled' : 'Disabled'}
                    </Tag>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-slate-600 block mb-2">Select Method</span>
                      <Radio.Group
                        value={tfaMethod}
                        onChange={(e) => {
                          setTfaMethod(e.target.value)
                          localStorage.setItem('zhealth_tfa_method', e.target.value)
                        }}
                        className="w-full flex flex-col gap-2"
                      >
                        <Radio value="app" className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          Authenticator App (Recommended)
                        </Radio>
                        <Radio value="sms" className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          SMS Verification Code
                        </Radio>
                        <Radio value="email" className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          Email OTP Code
                        </Radio>
                      </Radio.Group>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <Button
                        onClick={() => {
                          const next = !tfaEnabled
                          setTfaEnabled(next)
                          localStorage.setItem('zhealth_tfa_enabled', String(next))
                          toast.success(`2FA turned ${next ? 'ON' : 'OFF'} successfully!`)
                        }}
                        type={tfaEnabled ? 'default' : 'primary'}
                        className="rounded-xl font-bold h-9"
                        style={!tfaEnabled ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                      >
                        {tfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </Button>
                      {tfaEnabled && (
                        <Button
                          onClick={() => {
                            Modal.info({
                              title: 'Backup Codes Generated',
                              content: (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-slate-400 font-semibold mb-3">
                                    Save these codes securely. Each can be used once if you lose device access:
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-center font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-sm font-bold text-[#8C4BFF]">
                                    <span>4812-9921</span>
                                    <span>3821-4902</span>
                                    <span>2891-3829</span>
                                    <span>1829-4821</span>
                                  </div>
                                </div>
                              ),
                            })
                          }}
                          className="rounded-xl h-9"
                        >
                          Backup Codes
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Password change card */}
              <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <LockOutlined className="text-[#8C4BFF]" style={{ fontSize: 20 }} />
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">Password Change</h3>
                </div>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={async (values) => {
                    try {
                      const res = await api.put('/api/clinic-admin/profile', {
                        currentPassword: values.oldPass,
                        newPassword: values.newPass
                      })
                      if (res.data && res.data.success) {
                        toast.success('Your account password updated successfully in live database!')
                        passwordForm.resetFields()
                      } else {
                        toast.error(res.data?.message || 'Failed to update password')
                      }
                    } catch (err) {
                      console.error('Error changing password:', err)
                      const errMsg = err?.response?.data?.message || 'Failed to update password'
                      toast.error(errMsg)
                    }
                  }}
                  className="space-y-3"
                >
                  <Form.Item name="oldPass" label="Current Password" rules={[{ required: true, message: 'Please enter your current password' }]}>
                    <Input.Password className="rounded-xl h-9 text-xs" />
                  </Form.Item>
                  <Form.Item name="newPass" label="New Secure Password" rules={[{ required: true, message: 'Please enter a new password' }]}>
                    <Input.Password className="rounded-xl h-9 text-xs" />
                  </Form.Item>

                  <button
                    type="submit"
                    className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer w-full transition-colors mt-3"
                  >
                    Change Account Password
                  </button>
                </Form>
              </Card>
            </div>

            {/* Trusted Devices and Log */}
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 px-6 py-4 border-b border-slate-50 m-0">
                Login History & Connected Devices
              </h3>
              <Table
                dataSource={trustedDevices}
                pagination={false}
                columns={[
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">Connected Device</span>,
                    dataIndex: 'device',
                    render: (text) => <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{text}</span>,
                  },
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">IP Address</span>,
                    dataIndex: 'ip',
                    render: (text) => <span className="font-mono text-xs text-slate-500">{text}</span>,
                  },
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">Timestamp</span>,
                    dataIndex: 'time',
                  },
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>,
                    dataIndex: 'location',
                  },
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
                    dataIndex: 'status',
                    render: (status) => (
                      <Tag color={status.includes('Active') ? 'purple' : 'default'} className="rounded-full border-none font-bold text-[9px] uppercase px-2.5">
                        {status}
                      </Tag>
                    ),
                  },
                  {
                    title: '',
                    key: 'actions',
                    align: 'right',
                    render: (_, record) => (
                      record.status.includes('Active') && record.key !== '1' ? (
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            setTrustedDevices(trustedDevices.filter(d => d.key !== record.key))
                            toast.success('Device session revoked successfully!')
                          }}
                          className="rounded-lg text-[10px] font-bold"
                        >
                          Revoke
                        </Button>
                      ) : null
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="py-2 space-y-6">
      <button
        onClick={() => navigate('/clinic')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer mb-2 transition-colors w-fit"
      >
        <span className="text-sm">←</span>
        <span>Back to Dashboard</span>
      </button>

      {/* Settings Container with Left Side Vertical Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[650px]">
          {/* Left Vertical Navigation Menu */}
          <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-950/40 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              SETTINGS MENU
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[700px]">
              {tabs.map((tab) => {
                if (tab.subItems) {
                  const isChildActive = tab.subItems.some(sub => sub.key === activeTab)
                  const isParentOpen = activeTab === tab.key || isChildActive
                  return (
                    <div key={tab.key} className="space-y-1">
                      <button
                        onClick={() => {
                          if (activeTab === tab.key || isChildActive) {
                            setActiveTab(tab.subItems[0].key)
                          } else {
                            setActiveTab(tab.subItems[0].key)
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all ${
                          isChildActive || activeTab === tab.key
                            ? 'bg-[#8C4BFF]/15 text-[#8C4BFF] font-bold dark:bg-[#8C4BFF]/25 dark:text-[#A875FF]'
                            : 'text-slate-650 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className={`text-sm ${isChildActive || activeTab === tab.key ? 'text-[#8C4BFF] dark:text-[#A875FF]' : 'text-slate-400 dark:text-slate-500'}`}>
                            {tab.icon}
                          </span>
                          <span className="truncate">{tab.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isParentOpen ? <DownOutlined /> : <RightOutlined />}
                        </span>
                      </button>

                      {isParentOpen && (
                        <div className="pl-4 space-y-1 border-l-2 border-[#8C4BFF]/30 ml-3.5 my-1">
                          {tab.subItems.map((sub) => {
                            const isSubActive = activeTab === sub.key
                            return (
                              <button
                                key={sub.key}
                                onClick={() => setActiveTab(sub.key)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-all ${
                                  isSubActive
                                    ? 'bg-[#8C4BFF] text-white shadow-sm font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 bg-transparent'
                                }`}
                              >
                                <span className={`text-xs ${isSubActive ? 'text-white' : 'text-slate-400'}`}>
                                  {sub.icon}
                                </span>
                                <span className="truncate">{sub.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (tab.isNavigation && tab.path) {
                        navigate(tab.path)
                      } else {
                        setActiveTab(tab.key)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#8C4BFF] text-white shadow-md font-bold'
                        : 'text-slate-650 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 bg-transparent'
                    }`}
                  >
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Tab Content */}
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Error Report Modal */}
      <Modal
        open={errorModalOpen}
        onCancel={() => setErrorModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setErrorModalOpen(false)} style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold h-9">
            Close Report
          </Button>
        ]}
        destroyOnHidden
        width={600}
        title={
          <div className="flex items-center gap-2 text-red-600 font-extrabold text-base">
            <CloseCircleOutlined style={{ fontSize: 20 }} />
            <span>CSV Import Error Report</span>
          </div>
        }
      >
        <div className="mt-4 space-y-3">
          <div className="p-3.5 bg-red-50 rounded-xl border border-red-100 text-xs font-semibold text-red-700">
            <p className="m-0 font-bold">File: <span className="font-mono">{selectedLogFileName}</span></p>
            <p className="m-0 mt-1 text-[11px] opacity-80">
              The import was aborted to protect database integrity. Please resolve the following validation issues and re-upload the file.
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <Table
              dataSource={selectedErrors}
              pagination={false}
              size="small"
              rowKey={(record, idx) => `${record.row}-${record.field}-${idx}`}
              columns={[
                {
                  title: <span className="font-extrabold text-[10px] uppercase text-slate-500">Row</span>,
                  dataIndex: 'row',
                  width: 70,
                  align: 'center',
                  render: (row) => <span className="font-mono font-bold text-slate-600 text-xs">{row}</span>,
                },
                {
                  title: <span className="font-extrabold text-[10px] uppercase text-slate-500">Field</span>,
                  dataIndex: 'field',
                  width: 120,
                  render: (field) => (
                    <Tag color="red" className="rounded-full border-none font-bold uppercase text-[9px] px-2 py-0.5 font-mono">
                      {field}
                    </Tag>
                  ),
                },
                {
                  title: <span className="font-extrabold text-[10px] uppercase text-slate-500">Error Description</span>,
                  dataIndex: 'message',
                  render: (msg) => <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs leading-relaxed">{msg}</span>,
                },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Live Letterhead Preview Modal */}
      <Modal
        open={letterPreviewOpen}
        onCancel={() => setLetterPreviewOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setLetterPreviewOpen(false)} style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-9">
            Close Preview
          </Button>
        ]}
        width={650}
        destroyOnHidden
        title={
          <div className="flex items-center gap-2">
            <MailOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-bold text-sm">Live Document Preview: {letterPreviewText.title}</span>
          </div>
        }
      >
        <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[450px] overflow-y-auto">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <div>
              <span className="font-extrabold text-sm text-[#8C4BFF] block">ZEALTH HEALTHCARE</span>
              <span className="text-[10px] text-slate-400 font-semibold">Allied Health Clinical Letters & Communications</span>
            </div>
            <Tag color="green" className="font-bold text-[9px] uppercase border-none rounded-full">Preview Mode</Tag>
          </div>
          {letterPreviewText.body}
        </div>
      </Modal>

      {/* Live Form Preview Modal */}
      <Modal
        open={formPreviewOpen}
        onCancel={() => setFormPreviewOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setFormPreviewOpen(false)} style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-9">
            Close Preview
          </Button>
        ]}
        width={650}
        destroyOnHidden
        title={
          <div className="flex items-center gap-2">
            <FormOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-bold text-sm">Live Form Preview: {formPreviewText.title}</span>
          </div>
        }
      >
        <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[450px] overflow-y-auto">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <div>
              <span className="font-extrabold text-sm text-[#8C4BFF] block">{formPreviewText.title}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Patient Intake & Clinical Form Structure</span>
            </div>
            <Tag color="blue" className="font-bold text-[9px] uppercase border-none rounded-full">Form Preview</Tag>
          </div>
          {formPreviewText.body}
        </div>
      </Modal>

    </div>
  )
}
