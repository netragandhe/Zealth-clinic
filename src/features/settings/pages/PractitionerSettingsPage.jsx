import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Select, Checkbox, Space, Card, Radio, Table, Modal, Button, Tag, Divider, Tabs } from 'antd'
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
  CopyOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
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
  DollarOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import PatientSettings from '../../dashboard/components/patient/PatientSettings'
import ClinicDetailsTab from '../components/ClinicDetailsTab'
import SubscriptionPage from './SubscriptionPage'
import RolesPermissionsTab from '../components/RolesPermissionsTab'
import PractitionerBilling from '../../dashboard/components/practitioner/PractitionerBilling'
import { getBodyChartTemplates, createBodyChartTemplate, deleteBodyChartTemplate, getPractitionerProfile, updatePractitionerProfile, getApiKeys as getApiKeysApi, createApiKey as createApiKeyApi, deleteApiKey as deleteApiKeyApi } from '../../calendar/api/clinicAdminApi'
import { 
  getPractitionerLoginHistory, 
  recordPractitionerLoginLog, 
  revokePractitionerSession,
  changePractitionerPassword,
  getPractitionerSecuritySettings,
  updatePractitionerSecuritySettings,
  updateInvoiceTemplates
} from '../api/settingsApi'

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

const { Option } = Select
const SHOW_2FA = false

export default function PractitionerSettingsPage() {
  const [activeTemplateTab, setActiveTemplateTab] = useState('forms')
  const store = useClinicStore()
  const navigate = useNavigate()
  const userRole = store.userRole

  if (userRole === 'patient') {
    return <PatientSettings />
  }

  // Filter tabs by user role
  const tabs = React.useMemo(() => {
    switch (userRole) {
      case 'patient':
      case 'sales':
        return [
          { key: 'security', label: 'Security', icon: <LockOutlined /> }
        ]
      case 'practitioner':
        return [
          { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
          { key: 'security', label: 'Security', icon: <LockOutlined /> },
          { key: 'templates', label: 'Templates', icon: <FileTextOutlined /> }
        ]
      case 'clinic':
      case 'head_admin':
      default:
        return [
          { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
          { key: 'security', label: 'Security', icon: <LockOutlined /> },
          { key: 'billing', label: 'Billing & Invoicing', icon: <DollarOutlined /> },
          { key: 'templates', label: 'Templates', icon: <FileTextOutlined /> }
        ]
    }
  }, [userRole])

  const [activeTab, setActiveTab] = useState(() => {
    switch (userRole) {
      case 'patient':
      case 'sales':
        return 'security'
      case 'practitioner':
      case 'clinic':
      case 'head_admin':
      default:
        return 'profile'
    }
  })

  React.useEffect(() => {
    const allowedKeys = tabs.map((t) => t.key)
    if (!allowedKeys.includes(activeTab)) {
      setActiveTab(tabs[0]?.key || 'security')
    }
  }, [tabs, activeTab])

  React.useEffect(() => {
    if (activeTab === 'notes') {
      setActiveTemplateTab('notes')
    } else if (activeTab === 'letters') {
      setActiveTemplateTab('letters')
    }
  }, [activeTab])

  const [form] = Form.useForm()
  const [editingForm, setEditingForm] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formEdit] = Form.useForm()

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
      .replace(/\{\{practitioner_name\}\}/gi, store.user?.name ? (store.user.name.startsWith('Dr.') ? store.user.name : `Dr. ${store.user.name}`) : 'Dr. Sarah Jenkins')
      .replace(/\{\{doctor_name\}\}/gi, 'Dr. Robert Vance (Referring GP)')
      .replace(/\{\{specialty\}\}/gi, store.getActiveSpecialty ? store.getActiveSpecialty() : 'Physiotherapy')
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

  const [selectedNote, setSelectedNote] = useState(store.noteTemplates[0] || null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [notePreviewMode, setNotePreviewMode] = useState(false)

  // Client Tags State
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [tagForm] = Form.useForm()

  // Security Toggles
  const [tfaMethod, setTfaMethod] = useState('app')
  const [tfaEnabled, setTfaEnabled] = useState(true)
  const [trustedDevices, setTrustedDevices] = useState([
    { key: '1', device: 'Chrome / Windows (Current)', ip: '103.88.24.12', time: 'Today, 04:30 PM', location: 'Melbourne, VIC', status: 'Active Session' },
    { key: '2', device: 'iPhone App Client', ip: '120.91.4.11', time: 'Today, 10:15 AM', location: 'Sydney, NSW', status: 'Active Session' },
    { key: '3', device: 'Safari / macOS Sierra', ip: '110.12.82.9', time: 'Yesterday, 02:44 PM', location: 'Melbourne, VIC', status: 'Expired' },
  ])

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

  // Availability Live DB State
  const defaultSchedule = [
    { day: 'Monday', startTime: '09:00 AM', endTime: '05:00 PM', closed: false },
    { day: 'Tuesday', startTime: '09:00 AM', endTime: '05:00 PM', closed: false },
    { day: 'Wednesday', startTime: '09:00 AM', endTime: '05:00 PM', closed: false },
    { day: 'Thursday', startTime: '09:00 AM', endTime: '05:00 PM', closed: false },
    { day: 'Friday', startTime: '09:00 AM', endTime: '05:00 PM', closed: false },
    { day: 'Saturday', startTime: '09:00 AM', endTime: '05:00 PM', closed: true },
    { day: 'Sunday', startTime: '09:00 AM', endTime: '05:00 PM', closed: true }
  ]
  const [weeklySchedule, setWeeklySchedule] = useState(defaultSchedule)
  const [scheduleSaving, setScheduleSaving] = useState(false)

  // API Keys Live DB State
  const [apiKeys, setApiKeys] = useState([])
  const [apiKeyLoading, setApiKeyLoading] = useState(false)

  useEffect(() => {
    const loadApiKeys = async () => {
      setApiKeyLoading(true)
      try {
        const res = await getApiKeysApi()
        if (res && res.success && res.data) {
          setApiKeys(res.data.map(k => ({ ...k, key: k.id })))
        }
      } catch (err) {
        console.error('Failed to load API keys from live DB:', err)
      } finally {
        setApiKeyLoading(false)
      }
    }
    loadApiKeys()
  }, [])

  const handleGenerateApiKey = async () => {
    try {
      const res = await createApiKeyApi('Production Integration API Key')
      if (res && res.success && res.data) {
        setApiKeys(prev => [{ ...res.data, key: res.data.id }, ...prev])
        toast.success('New API Key generated and saved to live database!')
      }
    } catch (err) {
      toast.error('Failed to generate API key')
    }
  }

  const handleDeleteApiKey = async (id) => {
    try {
      await deleteApiKeyApi(id)
      setApiKeys(prev => prev.filter(k => k.id !== id && k.key !== id))
      toast.success('API Key revoked from live database!')
    } catch (err) {
      toast.error('Failed to revoke API key')
    }
  }
  // Data Import / Export State
  const [importFile, setImportFile] = useState(null)
  const [importTarget, setImportTarget] = useState('clients')
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedErrors, setSelectedErrors] = useState([])
  const [selectedLogFileName, setSelectedLogFileName] = useState('')

  // Live DB Practitioner Profile State
  const [profileForm] = Form.useForm()
  const [pracProfile, setPracProfile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [invoiceForm] = Form.useForm()
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [enabledFunding, setEnabledFunding] = useState({ private: true, ndis: true, dva: true, workcover: true })

  useEffect(() => {
    store.fetchSettingsTemplates()
    const fetchProfile = async () => {
      try {
        const res = await getPractitionerProfile()
        if (res && res.success && res.data) {
          setPracProfile(res.data)
          if (res.data.avatarUrl) {
            setAvatarUrl(res.data.avatarUrl)
          }
        }
      } catch (err) {
        console.error('Failed to load profile details from live DB:', err)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (pracProfile?.avatarUrl) {
      setAvatarUrl(pracProfile.avatarUrl)
    } else if (store.user?.avatarUrl) {
      setAvatarUrl(store.user.avatarUrl)
    }
  }, [pracProfile, store.user])

  const compressImage = (file, maxWidth = 400, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            } else {
              width = Math.round((width * maxWidth) / height)
              height = maxWidth
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = () => resolve(e.target.result)
        img.src = e.target.result
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file must be smaller than 10MB')
      return
    }

    setAvatarUploading(true)
    try {
      const base64Data = await compressImage(file)
      if (!base64Data) throw new Error('Image compression failed')
      setAvatarUrl(base64Data)
      await updatePractitionerProfile({ avatarUrl: base64Data })
      if (store.setUser && store.user) {
        store.setUser({ ...store.user, avatarUrl: base64Data })
      }
      toast.success('Profile photo uploaded & saved to database!')
    } catch (err) {
      console.error('Failed to save avatar to DB:', err)
      toast.error('Failed to save profile photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handlePhotoRemove = async () => {
    try {
      setAvatarUploading(true)
      await updatePractitionerProfile({ avatarUrl: null })
      setAvatarUrl(null)
      if (store.setUser && store.user) {
        store.setUser({ ...store.user, avatarUrl: null })
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast.success('Profile photo removed from database!')
    } catch (err) {
      toast.error('Failed to remove profile photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  useEffect(() => {
    if (store.invoiceTemplates) {
      invoiceForm.setFieldsValue({
        terms: store.invoiceTemplates.paymentTerms || 'Due on Receipt',
        footer: store.invoiceTemplates.footerText || ''
      })
      if (store.invoiceTemplates.enabledFunding) {
        setEnabledFunding(store.invoiceTemplates.enabledFunding)
      }
    }
  }, [store.invoiceTemplates, invoiceForm])

  useEffect(() => {
    if (pracProfile) {
      if (profileForm) {
        profileForm.setFieldsValue({
          title: pracProfile.title || 'Dr',
          firstName: pracProfile.firstName || '',
          lastName: pracProfile.lastName || '',
          gender: pracProfile.gender || 'Male',
          email: pracProfile.email || '',
          phone: pracProfile.phone || '',
          profTitle: pracProfile.profTitle || 'Practitioner'
        })
      }
      if (pracProfile.availability && Array.isArray(pracProfile.availability)) {
        setWeeklySchedule(pracProfile.availability)
      }
    }
  }, [pracProfile, profileForm])

  const handleSaveSchedule = async () => {
    setScheduleSaving(true)
    try {
      await updatePractitionerProfile({ availability: weeklySchedule })
      toast.success('Availability schedule saved successfully in live database!')
    } catch (err) {
      toast.error('Failed to save availability schedule')
    } finally {
      setScheduleSaving(false)
    }
  }

  // Body Chart Templates State (live DB)
  const [bodyChartTemplates, setBodyChartTemplates] = useState([])
  const [bodyChartLoading, setBodyChartLoading] = useState(false)
  const [bodyChartModalOpen, setBodyChartModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDesc, setNewTemplateDesc] = useState('')
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  useEffect(() => {
    const loadBodyChartTemplates = async () => {
      setBodyChartLoading(true)
      try {
        const res = await getBodyChartTemplates()
        if (res && res.success) {
          setBodyChartTemplates(res.data || [])
        }
      } catch (err) {
        console.error('Failed to load body chart templates from live DB:', err)
      } finally {
        setBodyChartLoading(false)
      }
    }
    loadBodyChartTemplates()
  }, [])

  // Integrations Live DB State & Handlers
  const [integrationSearch, setIntegrationSearch] = useState('')
  const [integrationCategory, setIntegrationCategory] = useState('All')
  const [integrationStatusFilter, setIntegrationStatusFilter] = useState('All')
  const [addIntegrationModalOpen, setAddIntegrationModalOpen] = useState(false)
  const [addIntegrationForm] = Form.useForm()
  const [integrationActionLoading, setIntegrationActionLoading] = useState({})

  useEffect(() => {
    store.fetchIntegrations()
    store.fetchSettingsTemplates()
  }, [])

  const handleToggleIntegrationItem = async (item) => {
    if (item.id === 'myob') {
      toast.error('MYOB integration is coming soon in a future update!')
      return
    }
    setIntegrationActionLoading(prev => ({ ...prev, [item.id]: true }))
    try {
      await store.toggleIntegration(item.id)
      toast.success(`${item.name} status updated in live database!`)
    } catch (err) {
      toast.error(`Failed to update ${item.name}`)
    } finally {
      setIntegrationActionLoading(prev => ({ ...prev, [item.id]: false }))
    }
  }

  const handleSyncIntegrationItem = async (item) => {
    setIntegrationActionLoading(prev => ({ ...prev, [`sync_${item.id}`]: true }))
    try {
      await store.syncIntegration(item.id)
      toast.success(`Synced details from ${item.name} in live database!`)
    } catch (err) {
      toast.error(`Failed to sync ${item.name}`)
    } finally {
      setIntegrationActionLoading(prev => ({ ...prev, [`sync_${item.id}`]: false }))
    }
  }

  const handleCreateCustomIntegrationSubmit = async (values) => {
    try {
      await store.addIntegration({
        name: values.name,
        type: values.type || 'Custom Integration',
        description: values.description,
        connected: Boolean(values.connected)
      })
      toast.success(`Integration "${values.name}" added to live database!`)
      addIntegrationForm.resetFields()
      setAddIntegrationModalOpen(false)
    } catch (err) {
      toast.error('Failed to create custom integration')
    }
  }

  const handleDeleteIntegrationItem = async (id, name) => {
    try {
      await store.deleteIntegration(id)
      toast.success(`Integration "${name}" deleted from live database!`)
    } catch (err) {
      toast.error('Failed to delete integration')
    }
  }

  const filteredIntegrations = React.useMemo(() => {
    return (store.integrations || []).filter((item) => {
      const matchesSearch = !integrationSearch || 
        item.name.toLowerCase().includes(integrationSearch.toLowerCase()) || 
        (item.type && item.type.toLowerCase().includes(integrationSearch.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(integrationSearch.toLowerCase()))
      const matchesCategory = integrationCategory === 'All' || item.type === integrationCategory
      const matchesStatus = integrationStatusFilter === 'All' || 
        (integrationStatusFilter === 'Connected' ? item.connected : !item.connected)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [store.integrations, integrationSearch, integrationCategory, integrationStatusFilter])

  // Login History Live DB State & Handlers
  const [loginLogs, setLoginLogs] = useState([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginSearch, setLoginSearch] = useState('')
  const [loginStatusFilter, setLoginStatusFilter] = useState('All')
  const [recordLoginModalOpen, setRecordLoginModalOpen] = useState(false)
  const [recordLoginForm] = Form.useForm()

  const loadLoginHistoryLogs = async () => {
    setLoginLoading(true)
    try {
      const res = await getPractitionerLoginHistory()
      if (res && res.success && Array.isArray(res.data)) {
        setLoginLogs(res.data)
      }
    } catch (err) {
      console.error('Failed to load login history from DB:', err)
    } finally {
      setLoginLoading(false)
    }
  }

  useEffect(() => {
    loadLoginHistoryLogs()
  }, [])

  const handleRevokeSession = async (id) => {
    try {
      await revokePractitionerSession(id)
      setLoginLogs(prev => prev.map(item => item.id === id ? { ...item, status: 'Revoked' } : item))
      toast.success('Session revoked in live database successfully!')
    } catch (err) {
      toast.error('Failed to revoke session')
    }
  }

  const handleRecordNewLoginSubmit = async (values) => {
    try {
      const res = await recordPractitionerLoginLog({
        device: values.device,
        ip: values.ip,
        location: values.location,
        status: values.status || 'Active Session'
      })
      if (res && res.success && res.data) {
        setLoginLogs(prev => [res.data, ...prev])
        toast.success('New login activity recorded in live database!')
        recordLoginForm.resetFields()
        setRecordLoginModalOpen(false)
      }
    } catch (err) {
      toast.error('Failed to record login activity')
    }
  }

  const filteredLoginLogs = React.useMemo(() => {
    return loginLogs.filter((item) => {
      const matchesSearch = !loginSearch ||
        (item.device && item.device.toLowerCase().includes(loginSearch.toLowerCase())) ||
        (item.ip && item.ip.toLowerCase().includes(loginSearch.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(loginSearch.toLowerCase())) ||
        (item.date && item.date.toLowerCase().includes(loginSearch.toLowerCase()))
      const matchesStatus = loginStatusFilter === 'All' ||
        (item.status && item.status.toLowerCase() === loginStatusFilter.toLowerCase())
      return matchesSearch && matchesStatus
    })
  }, [loginLogs, loginSearch, loginStatusFilter])

  // Account Security Live DB State & Handlers
  const [passwordForm] = Form.useForm()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)

  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const res = await getPractitionerSecuritySettings()
        if (res && res.success && res.data) {
          if (res.data.tfaEnabled !== undefined) setTfaEnabled(Boolean(res.data.tfaEnabled))
          if (res.data.tfaMethod) setTfaMethod(res.data.tfaMethod)
        }
      } catch (err) {
        console.error('Failed to load security settings:', err)
      }
    }
    loadSecuritySettings()
  }, [])

  const handlePasswordChangeSubmit = async (values) => {
    if (!values.currentPassword || !values.newPassword) {
      toast.error('Please enter current and new password')
      return
    }
    if (values.newPassword !== values.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    setPasswordLoading(true)
    try {
      const res = await changePractitionerPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      if (res && res.success) {
        toast.success(res.message || 'Password updated in live database!')
        passwordForm.resetFields()
      } else {
        toast.error(res?.message || 'Failed to update password')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Current password does not match')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleTfaToggleChange = async (enabled) => {
    setSecurityLoading(true)
    try {
      const res = await updatePractitionerSecuritySettings({ tfaEnabled: enabled, tfaMethod })
      if (res && res.success) {
        setTfaEnabled(enabled)
        toast.success(`Two-Factor Authentication ${enabled ? 'enabled' : 'disabled'} in live database!`)
      }
    } catch (err) {
      toast.error('Failed to update 2FA settings')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleOpenBodyChartModal = () => {
    setNewTemplateName('')
    setNewTemplateDesc('')
    setBodyChartModalOpen(true)
  }

  const handleAddBodyChartTemplate = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setCreatingTemplate(true)
    try {
      const res = await createBodyChartTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Custom clinical body chart template'
      })
      if (res && res.success) {
        setBodyChartTemplates(prev => [res.data, ...prev])
        toast.success(`Template "${res.data.name}" created in live database!`)
        setBodyChartModalOpen(false)
        setNewTemplateName('')
        setNewTemplateDesc('')
      }
    } catch (err) {
      toast.error('Failed to create template')
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleDeleteBodyChartTemplate = async (id) => {
    try {
      await deleteBodyChartTemplate(id)
      setBodyChartTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Template deleted from live database!')
    } catch (err) {
      toast.error('Failed to delete template')
    }
  }

  // Render content logic
  const renderTabContent = () => {
    // Security check to guarantee no unauthorized settings can be rendered for this role
    const allowedKeys = tabs.map((t) => t.key)
    if (!allowedKeys.includes(activeTab)) {
      return (
        <div className="p-8 text-center text-slate-400 text-sm font-semibold">
          You do not have permission to view these settings.
        </div>
      )
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 max-w-4xl pb-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[22px] font-bold text-slate-800 dark:text-white m-0">My Profile Settings</h2>
              <Button type="primary" onClick={() => profileForm.submit()} className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-9 px-6 shadow-sm">
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
                      <Form 
                        form={profileForm}
                        key={pracProfile ? (pracProfile.id || pracProfile.email) : 'loading'}
                        initialValues={{
                          title: pracProfile?.title || 'Dr',
                          firstName: pracProfile?.firstName || '',
                          lastName: pracProfile?.lastName || '',
                          gender: pracProfile?.gender || 'Male',
                          email: pracProfile?.email || '',
                          phone: pracProfile?.phone || '',
                          profTitle: pracProfile?.profTitle || 'Practitioner'
                        }}
                        layout="vertical" 
                        onFinish={async (values) => {
                          try {
                            await updatePractitionerProfile({ ...values, avatarUrl })
                            if (store.setUser && store.user) {
                              store.setUser({ ...store.user, avatarUrl })
                            }
                            toast.success('Profile settings updated successfully in live database!')
                          } catch (err) {
                            toast.error('Failed to update profile settings')
                          }
                        }}
                      >
                        <div className="py-6 space-y-6">
                          {/* Details Section */}
                          <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-4">
                            <div className="flex gap-4">
                              <Form.Item name="title" label={<span className="font-semibold text-xs">Title</span>} className="w-24 mb-0">
                                <Select>
                                  <Option value="Mr">Mr</Option>
                                  <Option value="Ms">Ms</Option>
                                  <Option value="Dr">Dr</Option>
                                </Select>
                              </Form.Item>
                              <Form.Item name="firstName" label={<span className="font-semibold text-xs">First name <span className="text-red-500">*</span></span>} className="flex-1 mb-0">
                                <Input />
                              </Form.Item>
                              <Form.Item name="lastName" label={<span className="font-semibold text-xs">Last name <span className="text-red-500">*</span></span>} className="flex-1 mb-0">
                                <Input />
                              </Form.Item>
                            </div>
                            
                            <Form.Item name="gender" label={<span className="font-semibold text-xs">Gender</span>} className="mb-0">
                              <Select>
                                <Option value="Male">Male</Option>
                                <Option value="Female">Female</Option>
                                <Option value="Other">Other</Option>
                              </Select>
                            </Form.Item>

                            <Form.Item name="email" label={<span className="font-semibold text-xs">Email <span className="text-red-500">*</span></span>} className="mb-0">
                              <Input />
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

                            <Form.Item name="phone" label={<span className="font-semibold text-xs">Phone numbers</span>} className="mb-0 mt-2">
                              <div className="flex flex-col gap-2">
                                <Input />
                                <div>
                                  <Button icon={<PlusOutlined />} className="text-xs" onClick={() => toast.success('Phone number field added')}>Add new phone number</Button>
                                </div>
                              </div>
                            </Form.Item>

                            <Form.Item name="profTitle" label={<span className="font-semibold text-xs mt-2">Professional title (Occupational Therapist, Physiotherapist, etc.) <span className="text-red-500">*</span></span>} className="mb-0">
                              <Input />
                            </Form.Item>

                            <Form.Item label={<span className="font-semibold text-xs mt-2">Groups</span>} className="mb-0">
                              <Select defaultValue="Senior Practitioner">
                                <Option value="Senior Practitioner">Senior Practitioner</Option>
                                <Option value="Standard Practitioner">Standard Practitioner</Option>
                              </Select>
                            </Form.Item>
                          </div>
                          
                          {/* Profile Picture */}
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-48 h-48 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 relative shadow-sm">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt="Profile"
                                  className="w-full h-full object-cover rounded-2xl"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                  <UserOutlined className="text-[72px]" />
                                  <span className="text-xs text-slate-400 mt-2 font-medium">No photo uploaded</span>
                                </div>
                              )}
                              {avatarUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                            </div>

                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handlePhotoUpload}
                              accept="image/*"
                              className="hidden"
                            />

                            <div className="flex items-center gap-2">
                              <Button
                                className="font-semibold rounded-xl h-9 px-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#8C4BFF] hover:text-[#8C4BFF]"
                                icon={<UploadOutlined />}
                                loading={avatarUploading}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                {avatarUrl ? 'Change Photo' : 'Upload'}
                              </Button>
                              {avatarUrl && (
                                <Button
                                  danger
                                  type="text"
                                  className="font-semibold text-xs h-9 px-2 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={handlePhotoRemove}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</span>
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
                                {pracProfile?.signature || (pracProfile?.firstName ? `${pracProfile.firstName} ${pracProfile.lastName}` : 'Dr. Signature')}
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
                        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
                          <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-10 px-8 shadow-sm">
                            Save Changes
                          </Button>
                        </div>
                      </Form>
                    )
                  },
                  { 
                    key: 'availability', 
                    label: <span className="font-semibold text-slate-500">Availability</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Weekly Schedule</h3>
                            <p className="text-xs text-slate-400 font-semibold m-0 mt-1">Configure your active working hours saved directly in live database.</p>
                          </div>
                          <Button 
                            type="primary" 
                            loading={scheduleSaving}
                            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-bold" 
                            onClick={handleSaveSchedule}
                          >
                            Save Schedule
                          </Button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                          {weeklySchedule.map((item, idx) => (
                            <div key={item.day} className={`flex items-center gap-4 ${item.closed ? 'opacity-50' : ''}`}>
                              <div className="w-28 font-semibold text-slate-700 dark:text-slate-300">{item.day}</div>
                              <Select 
                                value={item.closed ? 'Closed' : item.startTime} 
                                disabled={item.closed}
                                onChange={val => {
                                  const updated = [...weeklySchedule]
                                  updated[idx].startTime = val
                                  setWeeklySchedule(updated)
                                }}
                                className="w-32"
                              >
                                <Option value="08:00 AM">08:00 AM</Option>
                                <Option value="09:00 AM">09:00 AM</Option>
                                <Option value="10:00 AM">10:00 AM</Option>
                              </Select>
                              <span className="text-slate-400">to</span>
                              <Select 
                                value={item.closed ? 'Closed' : item.endTime} 
                                disabled={item.closed}
                                onChange={val => {
                                  const updated = [...weeklySchedule]
                                  updated[idx].endTime = val
                                  setWeeklySchedule(updated)
                                }}
                                className="w-32"
                              >
                                <Option value="04:00 PM">04:00 PM</Option>
                                <Option value="05:00 PM">05:00 PM</Option>
                                <Option value="06:00 PM">06:00 PM</Option>
                              </Select>
                              <Checkbox
                                checked={item.closed}
                                onChange={e => {
                                  const updated = [...weeklySchedule]
                                  updated[idx].closed = e.target.checked
                                  setWeeklySchedule(updated)
                                }}
                                className="ml-4 font-semibold text-xs text-slate-500"
                              >
                                Closed
                              </Checkbox>
                            </div>
                          ))}
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
                          <Button icon={<PlusOutlined />} className="rounded-lg font-semibold" loading={bodyChartLoading} onClick={handleOpenBodyChartModal}>New Template</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {bodyChartLoading && bodyChartTemplates.length === 0 && (
                            <div className="col-span-3 text-center text-slate-400 py-10">Loading templates from database...</div>
                          )}
                          {!bodyChartLoading && bodyChartTemplates.length === 0 && (
                            <div className="col-span-3 text-center text-slate-400 py-10">No body chart templates found. Click "New Template" to create one.</div>
                          )}
                          {bodyChartTemplates.map((tmpl, i) => (
                            <div key={tmpl.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.success(`Opening: ${tmpl.name}`)}>
                              <div className="h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                                <span className="text-slate-400 font-bold text-xl">Template {i + 1}</span>
                              </div>
                              <div className="p-4 bg-white dark:bg-slate-900 flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-sm m-0">{tmpl.name}</h4>
                                  <p className="text-xs text-slate-500 m-0 mt-1">{tmpl.description || 'No description'}</p>
                                </div>
                                <DeleteOutlined className="text-red-400 hover:text-red-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteBodyChartTemplate(tmpl.id) }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Create Body Chart Template Modal */}
                        <Modal
                          title={<span className="font-bold text-slate-800 dark:text-white">Create New Body Chart Template</span>}
                          open={bodyChartModalOpen}
                          onCancel={() => setBodyChartModalOpen(false)}
                          footer={null}
                          destroyOnHidden
                        >
                          <form onSubmit={handleAddBodyChartTemplate} className="space-y-4 pt-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Template Name *</label>
                              <Input
                                placeholder="e.g. Lumbar Spine & Lower Back Chart"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="rounded-lg text-xs"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category / Description</label>
                              <Input.TextArea
                                placeholder="e.g. Pre-configured anatomy diagram for lower back pain evaluations"
                                value={newTemplateDesc}
                                onChange={(e) => setNewTemplateDesc(e.target.value)}
                                rows={3}
                                className="rounded-lg text-xs"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button onClick={() => setBodyChartModalOpen(false)} className="rounded-lg font-semibold text-xs">
                                Cancel
                              </Button>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={creatingTemplate}
                                style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                                className="rounded-lg font-bold text-xs text-white"
                              >
                                Create Template
                              </Button>
                            </div>
                          </form>
                        </Modal>
                      </div>
                    ) 
                  },
                  { 
                    key: 'integrations', 
                    label: <span className="font-semibold text-slate-500">Integrations</span>, 
                    children: (
                      <div className="py-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Connected Apps</h3>
                          {store.integrationsLoading && <span className="text-xs text-slate-400 font-semibold">Syncing with database...</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(store.integrations || []).slice(0, 6).map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-[#8C4BFF] text-base">
                                  {item.name ? item.name[0] : 'A'}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm m-0 text-slate-800 dark:text-slate-200">{item.name}</h4>
                                  <p className="text-xs text-slate-500 m-0 font-semibold">
                                    {item.connected ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Connected</span>
                                    ) : (
                                      <span className="text-slate-400">Not connected</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                type={item.connected ? 'default' : 'primary'}
                                loading={Boolean(integrationActionLoading[item.id])}
                                onClick={() => handleToggleIntegrationItem(item)}
                                className="rounded-lg font-semibold text-xs"
                                style={!item.connected && item.id !== 'myob' ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                              >
                                {item.connected ? 'Disconnect' : 'Connect'}
                              </Button>
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0 flex items-center gap-2">
                              <span>Recent Logins & Active Sessions</span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#8C4BFF] dark:bg-purple-950/40 dark:text-purple-300">
                                Live Database
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold m-0 mt-1">
                              View recent authentication logs, verify active devices, and revoke unauthorized sessions in real-time.
                            </p>
                          </div>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setRecordLoginModalOpen(true)}
                            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-9 px-4 text-xs"
                          >
                            Record Login Log
                          </Button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <Input
                            placeholder="Filter by Device, IP, Location or Date..."
                            prefix={<SettingOutlined className="text-slate-400 mr-1" />}
                            value={loginSearch}
                            onChange={(e) => setLoginSearch(e.target.value)}
                            allowClear
                            className="rounded-lg h-9 text-xs max-w-md w-full"
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                            <Select
                              value={loginStatusFilter}
                              onChange={(val) => setLoginStatusFilter(val)}
                              className="w-36 rounded-lg text-xs"
                            >
                              <Option value="All">All Status</Option>
                              <Option value="Active Session">Active Session</Option>
                              <Option value="Expired">Expired</Option>
                              <Option value="Revoked">Revoked</Option>
                            </Select>
                          </div>
                        </div>

                        <Table 
                          dataSource={filteredLoginLogs} 
                          loading={loginLoading}
                          columns={[
                            { 
                              title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Date & Time</span>, 
                              dataIndex: 'date', 
                              key: 'date', 
                              className: 'font-semibold text-xs' 
                            },
                            { 
                              title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Device / Client</span>, 
                              dataIndex: 'device', 
                              key: 'device',
                              render: (text) => <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{text}</span>
                            },
                            { 
                              title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">IP Address</span>, 
                              dataIndex: 'ip', 
                              key: 'ip',
                              render: (text) => <span className="font-mono text-slate-600 dark:text-slate-400 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{text}</span>
                            },
                            { 
                              title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Location</span>, 
                              dataIndex: 'location', 
                              key: 'location',
                              className: 'text-xs text-slate-500 font-semibold'
                            },
                            { 
                              title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Status</span>, 
                              dataIndex: 'status', 
                              key: 'status',
                              render: (text) => {
                                let color = 'default'
                                if (text === 'Active Session') color = 'success'
                                else if (text === 'Expired') color = 'warning'
                                else if (text === 'Revoked') color = 'error'
                                return (
                                  <Tag color={color} className="rounded-full border-none font-bold text-[10px] px-2.5 py-0.5">
                                    {text || 'Active Session'}
                                  </Tag>
                                )
                              }
                            },
                            {
                              title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Action</span>,
                              key: 'action',
                              align: 'right',
                              render: (_, record) => (
                                record.status === 'Active Session' ? (
                                  <Button 
                                    danger 
                                    size="small"
                                    onClick={() => handleRevokeSession(record.id)}
                                    className="rounded-lg text-xs font-semibold"
                                  >
                                    Revoke Session
                                  </Button>
                                ) : (
                                  <span className="text-xs text-slate-400 font-semibold italic">Inactive</span>
                                )
                              )
                            }
                          ]}
                          pagination={{ pageSize: 5 }}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
                        />

                        {/* Modal to record/test new login log */}
                        <Modal
                          title={<span className="font-extrabold text-base text-slate-800 dark:text-white">Record Login Activity</span>}
                          open={recordLoginModalOpen}
                          onCancel={() => { recordLoginForm.resetFields(); setRecordLoginModalOpen(false); }}
                          footer={null}
                          destroyOnHidden
                        >
                          <Form
                            form={recordLoginForm}
                            layout="vertical"
                            onFinish={handleRecordNewLoginSubmit}
                            className="mt-4 space-y-4"
                          >
                            <Form.Item
                              name="device"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Device / Browser Name <span className="text-red-500">*</span></span>}
                              rules={[{ required: true, message: 'Please enter device name' }]}
                              initialValue="Chrome / Windows 11"
                            >
                              <Input placeholder="e.g., Chrome / Windows, iPhone App" className="rounded-xl h-10" />
                            </Form.Item>

                            <Form.Item
                              name="ip"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">IP Address</span>}
                              initialValue="192.168.1.105"
                            >
                              <Input placeholder="e.g., 103.88.24.12" className="rounded-xl h-10" />
                            </Form.Item>

                            <Form.Item
                              name="location"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Location</span>}
                              initialValue="Melbourne, VIC"
                            >
                              <Input placeholder="e.g., Melbourne, VIC" className="rounded-xl h-10" />
                            </Form.Item>

                            <Form.Item
                              name="status"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Session Status</span>}
                              initialValue="Active Session"
                            >
                              <Select className="rounded-xl h-10">
                                <Option value="Active Session">Active Session</Option>
                                <Option value="Expired">Expired</Option>
                                <Option value="Revoked">Revoked</Option>
                              </Select>
                            </Form.Item>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <Button onClick={() => setRecordLoginModalOpen(false)} className="rounded-xl font-semibold">
                                Cancel
                              </Button>
                              <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl px-6">
                                Save to Database
                              </Button>
                            </div>
                          </Form>
                        </Modal>
                      </div>
                    ) 
                  },
                  { 
                    key: 'account_security', 
                    label: <span className="font-semibold text-slate-500">Account security</span>, 
                    children: (
                      <div className="py-6 space-y-8 animate-fade-in">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Change Password</h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#8C4BFF] dark:bg-purple-950/40 dark:text-purple-300">
                              Live Database (bcrypt)
                            </span>
                          </div>

                          <Form
                            form={passwordForm}
                            layout="vertical"
                            onFinish={handlePasswordChangeSubmit}
                            className="max-w-md space-y-4"
                          >
                            <Form.Item
                              name="currentPassword"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Current Password <span className="text-red-500">*</span></span>}
                              rules={[{ required: true, message: 'Please enter current password' }]}
                              className="mb-3"
                            >
                              <Input.Password placeholder="Enter current password" size="large" className="rounded-xl text-xs" />
                            </Form.Item>

                            <Form.Item
                              name="newPassword"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">New Password <span className="text-red-500">*</span></span>}
                              rules={[{ required: true, message: 'Please enter new password' }, { min: 6, message: 'Minimum 6 characters' }]}
                              className="mb-3"
                            >
                              <Input.Password placeholder="Enter new password" size="large" className="rounded-xl text-xs" />
                            </Form.Item>

                            <Form.Item
                              name="confirmPassword"
                              label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Confirm New Password <span className="text-red-500">*</span></span>}
                              rules={[{ required: true, message: 'Please confirm new password' }]}
                              className="mb-4"
                            >
                              <Input.Password placeholder="Confirm new password" size="large" className="rounded-xl text-xs" />
                            </Form.Item>

                            <Button 
                              type="primary" 
                              htmlType="submit"
                              loading={passwordLoading}
                              className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-xl font-bold h-10 px-6 shadow-sm"
                            >
                              Update Password
                            </Button>
                          </Form>
                        </div>

                        {SHOW_2FA && (
                          <>
                            <Divider />
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Two-Factor Authentication (2FA)</h3>
                                  <p className="text-slate-500 text-xs mt-1 font-semibold">
                                    Add an extra layer of security to your account saved in the live database.
                                  </p>
                                </div>
                                <Button 
                                  type={tfaEnabled ? 'default' : 'primary'}
                                  loading={securityLoading}
                                  onClick={() => handleTfaToggleChange(!tfaEnabled)}
                                  className="rounded-xl font-bold text-xs h-9 px-4"
                                  style={!tfaEnabled ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                                >
                                  {tfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </Button>
                              </div>

                              {tfaEnabled && (
                                <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 max-w-lg">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Select Primary 2FA Method:</span>
                                  <Radio.Group 
                                    value={tfaMethod} 
                                    onChange={(e) => {
                                      setTfaMethod(e.target.value)
                                      updatePractitionerSecuritySettings({ tfaEnabled: true, tfaMethod: e.target.value })
                                      toast.success(`2FA method updated to ${e.target.value.toUpperCase()} in live database!`)
                                    }}
                                    className="flex flex-col gap-2"
                                  >
                                    <Radio value="app" className="text-xs font-semibold">
                                      <span>Authenticator App (TOTP - Google Authenticator / Authy)</span>
                                    </Radio>
                                    <Radio value="sms" className="text-xs font-semibold">
                                      <span>SMS Verification Code</span>
                                    </Radio>
                                    <Radio value="email" className="text-xs font-semibold">
                                      <span>Email Security Code</span>
                                    </Radio>
                                  </Radio.Group>
                                </div>
                              )}
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
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Active API Keys</h3>
                            <p className="text-xs text-slate-400 font-semibold m-0 mt-1">Manage API tokens for external integrations saved in live database.</p>
                          </div>
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-semibold" 
                            onClick={handleGenerateApiKey}
                          >
                            Generate New Key
                          </Button>
                        </div>
                        <Table 
                          dataSource={apiKeys} 
                          loading={apiKeyLoading}
                          columns={[
                            { title: 'Name', dataIndex: 'name', key: 'name', className: 'font-semibold text-xs' },
                            { title: 'Token', dataIndex: 'token', key: 'token', render: (text) => <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-300">{text}</span> },
                            { title: 'Created', dataIndex: 'created', key: 'created', className: 'text-xs text-slate-500 font-semibold' },
                            { title: 'Last Used', dataIndex: 'lastUsed', key: 'lastUsed', className: 'text-xs text-slate-500 font-semibold' },
                            { 
                              title: 'Action', 
                              key: 'action', 
                              render: (_, record) => <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteApiKey(record.id || record.key)} />
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
          </div>
        )
      case 'security':
        return (
          <div className="space-y-8 animate-fade-in max-w-4xl pb-10">
            <h2 className="text-[22px] font-bold text-slate-800 dark:text-white m-0 mb-6">Security Settings</h2>
            
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Change Password</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#8C4BFF] dark:bg-purple-950/40 dark:text-purple-300">
                  Live Database (bcrypt)
                </span>
              </div>

              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChangeSubmit}
                className="max-w-md space-y-4"
              >
                <Form.Item
                  name="currentPassword"
                  label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Current Password <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: 'Please enter current password' }]}
                  className="mb-3"
                >
                  <Input.Password placeholder="Enter current password" size="large" className="rounded-xl text-xs" />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">New Password <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: 'Please enter new password' }, { min: 6, message: 'Minimum 6 characters' }]}
                  className="mb-3"
                >
                  <Input.Password placeholder="Enter new password" size="large" className="rounded-xl text-xs" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Confirm New Password <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: 'Please confirm new password' }]}
                  className="mb-4"
                >
                  <Input.Password placeholder="Confirm new password" size="large" className="rounded-xl text-xs" />
                </Form.Item>

                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={passwordLoading}
                  className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-xl font-bold h-10 px-6 shadow-sm"
                >
                  Update Password
                </Button>
              </Form>

              {SHOW_2FA && (
                <>
                  <Divider />
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0">Two-Factor Authentication (2FA)</h3>
                        <p className="text-slate-500 text-xs mt-1 font-semibold">
                          Add an extra layer of security to your account saved in the live database.
                        </p>
                      </div>
                      <Button 
                        type={tfaEnabled ? 'default' : 'primary'}
                        loading={securityLoading}
                        onClick={() => handleTfaToggleChange(!tfaEnabled)}
                        className="rounded-xl font-bold text-xs h-9 px-4"
                        style={!tfaEnabled ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                      >
                        {tfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </Button>
                    </div>

                    {tfaEnabled && (
                      <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 max-w-lg">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Select Primary 2FA Method:</span>
                        <Radio.Group 
                          value={tfaMethod} 
                          onChange={(e) => {
                            setTfaMethod(e.target.value)
                            updatePractitionerSecuritySettings({ tfaEnabled: true, tfaMethod: e.target.value })
                            toast.success(`2FA method updated to ${e.target.value.toUpperCase()} in live database!`)
                          }}
                          className="flex flex-col gap-2"
                        >
                          <Radio value="app" className="text-xs font-semibold">
                            <span>Authenticator App (TOTP - Google Authenticator / Authy)</span>
                          </Radio>
                          <Radio value="sms" className="text-xs font-semibold">
                            <span>SMS Verification Code</span>
                          </Radio>
                          <Radio value="email" className="text-xs font-semibold">
                            <span>Email Security Code</span>
                          </Radio>
                        </Radio.Group>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
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
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4"><h3 className="font-bold">FAQ</h3><p className="text-slate-500 text-sm">Configure frequently asked questions.</p></Card>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4"><h3 className="font-bold">About Us</h3><p className="text-slate-500 text-sm">Configure clinic description.</p></Card>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4"><h3 className="font-bold">Terms & Conditions</h3><p className="text-slate-500 text-sm">Clinic terms document.</p></Card>
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm"><h3 className="font-bold">Privacy Policy</h3><p className="text-slate-500 text-sm">Clinic privacy policy document.</p></Card>
          </div>
        )
      case 'integrations':
        return (
          <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0 flex items-center gap-2">
                  <span>Integrations & Connected Apps</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#8C4BFF] dark:bg-purple-950/40 dark:text-purple-300">
                    Live Database
                  </span>
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold m-0">
                  Manage live connections to third-party tools. Connect, sync, filter, or add custom integrations persisted in your database.
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddIntegrationModalOpen(true)}
                className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl h-10 px-5 shadow-sm text-xs"
              >
                Add Custom Integration
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 w-full max-w-md">
                <Input
                  placeholder="Search by name, type, or keyword..."
                  prefix={<SettingOutlined className="text-slate-400 mr-1" />}
                  value={integrationSearch}
                  onChange={(e) => setIntegrationSearch(e.target.value)}
                  allowClear
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
                  <Select
                    value={integrationCategory}
                    onChange={(val) => setIntegrationCategory(val)}
                    className="w-44 rounded-xl text-xs"
                  >
                    <Option value="All">All Categories</Option>
                    <Option value="Accounting">Accounting</Option>
                    <Option value="Exercise Prescription">Exercise Prescription</Option>
                    <Option value="Payments">Payments</Option>
                    <Option value="Video Consultations">Video Consultations</Option>
                    <Option value="Health Claiming">Health Claiming</Option>
                    <Option value="Custom Integration">Custom Integration</Option>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <Select
                    value={integrationStatusFilter}
                    onChange={(val) => setIntegrationStatusFilter(val)}
                    className="w-36 rounded-xl text-xs"
                  >
                    <Option value="All">All Status</Option>
                    <Option value="Connected">Connected</Option>
                    <Option value="Disconnected">Disconnected</Option>
                  </Select>
                </div>

                {(integrationSearch || integrationCategory !== 'All' || integrationStatusFilter !== 'All') && (
                  <Button
                    onClick={() => {
                      setIntegrationSearch('')
                      setIntegrationCategory('All')
                      setIntegrationStatusFilter('All')
                    }}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Integrations Grid */}
            {store.integrationsLoading && store.integrations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                Loading integrations from live database...
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <ApiOutlined className="text-4xl text-slate-300" />
                <p className="m-0 text-sm font-bold text-slate-600 dark:text-slate-400">No integrations found matching your criteria.</p>
                <Button 
                  type="link" 
                  onClick={() => { setIntegrationSearch(''); setIntegrationCategory('All'); setIntegrationStatusFilter('All'); }} 
                  className="text-xs text-[#8C4BFF] font-bold"
                >
                  Clear search and filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((item) => (
                  <Card
                    key={item.id}
                    className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative"
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {item.type || 'Integration'}
                          </span>
                          {item.isCustom && (
                            <Tag color="purple" className="rounded-full text-[9px] font-bold border-none px-2">Custom</Tag>
                          )}
                        </div>
                        <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0 mt-0.5">{item.name}</h4>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.connected
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.connected ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                        {item.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 font-semibold leading-relaxed min-h-[36px]">
                      {item.description || (
                        item.name === 'Xero' ? 'Sync clinical invoicing automatically to your accountancy accounts.' :
                        item.name === 'MYOB' ? 'Alternative corporate accountancy sync.' :
                        item.name === 'Physitrack' ? 'Assign clinical home exercises and monitor participant adherence.' :
                        item.name === 'VALD HUB' ? 'Integrate VALD HUB to assign exercises and track participant progress.' :
                        item.name === 'Stripe' ? 'Accept direct client credit card payments inside practitioner portals.' :
                        item.name === 'Zoom' ? 'Integrate secure clinical video rooms directly inside appointments.' :
                        item.name === 'Google Meet' ? 'Connect calendar appointments automatically with Meet links.' :
                        item.name === 'HICAPS' ? 'Medicare claiming and instant private health insurer rebates.' :
                        item.name === 'Tyro Health' ? 'Integrated Tyro claiming terminal connection and rebates.' :
                        'Connected integration service for clinic operations.'
                      )}
                    </p>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-2">
                      {item.connected && (
                        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                          <span>Last Synced:</span>
                          <span className="font-bold text-slate-600 dark:text-slate-300">{item.lastSync || 'Never'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          type={item.connected ? 'default' : 'primary'}
                          loading={Boolean(integrationActionLoading[item.id])}
                          onClick={() => handleToggleIntegrationItem(item)}
                          className="flex-1 rounded-xl text-xs font-bold h-9"
                          style={!item.connected && item.id !== 'myob' ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                        >
                          {item.connected ? 'Disconnect' : 'Connect'}
                        </Button>

                        {item.connected && (
                          <Button
                            icon={<SyncOutlined />}
                            loading={Boolean(integrationActionLoading[`sync_${item.id}`])}
                            onClick={() => handleSyncIntegrationItem(item)}
                            title="Sync live data now"
                            className="rounded-xl border border-slate-200 h-9 w-9 flex items-center justify-center p-0"
                          />
                        )}

                        {item.isCustom && (
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteIntegrationItem(item.id, item.name)}
                            title="Delete custom integration from live database"
                            className="h-9 w-9 p-0 flex items-center justify-center"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Custom Integration Modal */}
            <Modal
              title={<span className="font-extrabold text-base text-slate-800 dark:text-white">Add Custom Integration</span>}
              open={addIntegrationModalOpen}
              onCancel={() => { addIntegrationForm.resetFields(); setAddIntegrationModalOpen(false); }}
              footer={null}
              destroyOnHidden
            >
              <Form
                form={addIntegrationForm}
                layout="vertical"
                onFinish={handleCreateCustomIntegrationSubmit}
                className="mt-4 space-y-4"
              >
                <Form.Item
                  name="name"
                  label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Integration Name <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: 'Please enter integration name' }]}
                >
                  <Input placeholder="e.g., Slack, Cliniko, Mailchimp, Zapier" className="rounded-xl h-10" />
                </Form.Item>

                <Form.Item
                  name="type"
                  label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Category / Type</span>}
                  initialValue="Custom Integration"
                >
                  <Select className="rounded-xl h-10">
                    <Option value="Accounting">Accounting</Option>
                    <Option value="Exercise Prescription">Exercise Prescription</Option>
                    <Option value="Payments">Payments</Option>
                    <Option value="Video Consultations">Video Consultations</Option>
                    <Option value="Health Claiming">Health Claiming</Option>
                    <Option value="Messaging / CRM">Messaging / CRM</Option>
                    <Option value="Custom Integration">Custom Integration</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<span className="font-bold text-xs text-slate-700 dark:text-slate-300">Description</span>}
                >
                  <Input.TextArea placeholder="Brief description of how this integration connects to your clinic..." rows={3} className="rounded-xl" />
                </Form.Item>

                <Form.Item
                  name="connected"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Checkbox className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                    Connect immediately upon saving to database
                  </Checkbox>
                </Form.Item>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button onClick={() => setAddIntegrationModalOpen(false)} className="rounded-xl font-semibold">
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold rounded-xl px-6">
                    Add to Database
                  </Button>
                </div>
              </Form>
            </Modal>
          </div>
        )

      case 'templates':
      case 'notes':
      case 'letters':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
              {[
                { id: 'forms', label: 'Forms Templates' },
                { id: 'letters', label: 'Letter Templates' },
                { id: 'notes', label: 'Note Templates' },
                ...(userRole !== 'practitioner' ? [{ id: 'invoices', label: 'Invoice Templates' }] : []),
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

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={store.formTemplates}
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
                          onClick={async () => {
                            const duplicated = {
                              name: `${record.name} (Copy)`,
                              category: record.category,
                              content: record.content || '',
                              lastModified: new Date().toISOString().split('T')[0],
                            }
                            await store.addSettingsTemplate('forms', duplicated)
                            toast.success(`Duplicated: ${record.name} in live database!`)
                          }}
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
                          onClick={async () => {
                            await store.removeSettingsTemplate('forms', record.id)
                            toast.success(`Deleted: ${record.name} from live database!`)
                          }}
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
                onFinish={async (values) => {
                  if (editingForm) {
                    await store.updateSettingsTemplate('forms', editingForm.id, values)
                    toast.success('Form template updated & published to live database!')
                  } else {
                    await store.addSettingsTemplate('forms', {
                      name: values.name,
                      category: values.category || 'General',
                      content: values.content || '',
                      status: 'active',
                      lastModified: new Date().toISOString().split('T')[0],
                    })
                    toast.success('New form template created & published to live database!')
                  }
                  setFormModalOpen(false)
                }}
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
                    className="rounded-xl font-mono text-xs p-3.5 leading-relaxed"
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
                  letterEdit.setFieldsValue({
                    category: 'GP Communication',
                    status: 'active',
                    content: `Dear Dr. {{doctor_name}},\n\nRe: {{client_name}} (DOB: {{dob}})\nDate of Review: {{date}}\n\nThank you for referring {{client_name}} for clinical allied health evaluation.\n\nClinical Findings & Assessment:\n{{diagnosis}}\n\nManagement Plan & Recommendations:\n1. Prescribed therapeutic exercise and active conditioning program.\n2. Advised on load management and ergonomic principles.\n3. Scheduled clinical progress review in 4-6 weeks.\n\nYours sincerely,\n\n{{practitioner_name}}\n{{specialty}}\n{{clinic_name}}`
                  })
                  setLetterModalOpen(true)
                }}
                className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
              >
                <PlusOutlined />
                <span>Create Letter</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={store.letterTemplates}
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
                          onClick={async () => {
                            const archivedVal = record.status === 'active' ? 'archived' : 'active'
                            await store.updateSettingsTemplate('letters', record.id, { status: archivedVal })
                            toast.success(`Letter marked as ${archivedVal}!`)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                          title="Archive"
                        >
                          <CloseCircleOutlined />
                        </button>
                        <button
                          onClick={async () => {
                            const duplicated = {
                              name: `${record.name} (Copy)`,
                              category: record.category,
                              content: record.content || '',
                              status: 'active',
                            }
                            await store.addSettingsTemplate('letters', duplicated)
                            toast.success(`Duplicated Letter: ${record.name}`)
                          }}
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
                          onClick={async () => {
                            await store.removeSettingsTemplate('letters', record.id)
                            toast.success(`Deleted Letter: ${record.name} from live database!`)
                          }}
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
                onFinish={async (values) => {
                  if (editingLetter) {
                    await store.updateSettingsTemplate('letters', editingLetter.id, values)
                    toast.success('Letter template updated & published!')
                  } else {
                    await store.addSettingsTemplate('letters', {
                      name: values.name,
                      category: values.category || 'General',
                      content: values.content || '',
                      status: 'active',
                    })
                    toast.success('Letter template created & published to clinic database!')
                  }
                  setLetterModalOpen(false)
                }}
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
                      className="text-left bg-transparent border-none font-bold text-xs cursor-pointer truncate flex-1"
                      style={{ color: selectedNote?.id === t.id ? '#8C4BFF' : '#334155' }}
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (store.noteTemplates.length <= 1) {
                          toast.error('At least one note template must be kept!')
                          return
                        }
                        await store.removeSettingsTemplate('notes', t.id)
                        if (selectedNote?.id === t.id) {
                          setSelectedNote(store.noteTemplates.filter((n) => n.id !== t.id)[0])
                        }
                        toast.success('Note template deleted!')
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
                                useClinicStore.setState((state) => ({
                                  noteTemplates: state.noteTemplates.map((n) =>
                                    n.id === selectedNote.id ? { ...n, content: newContent } : n
                                  ),
                                }))
                                setSelectedNote({ ...selectedNote, content: newContent })
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
                            const val = e.target.value
                            useClinicStore.setState((state) => ({
                              noteTemplates: state.noteTemplates.map((n) =>
                                n.id === selectedNote.id ? { ...n, content: val } : n
                              ),
                            }))
                            setSelectedNote({ ...selectedNote, content: val })
                          }}
                          autoSize={{ minRows: 22, maxRows: 45 }}
                          style={{ minHeight: '520px' }}
                          className="w-full text-slate-700 dark:text-slate-200 text-xs leading-relaxed font-mono rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:bg-white"
                          placeholder="Write clinical notes template structure and placeholders here..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                      <Button
                        type="primary"
                        onClick={async () => {
                          await store.updateSettingsTemplate('notes', selectedNote.id, { name: selectedNote.name, content: selectedNote.content })
                          toast.success('Note templates settings auto-saved to cloud database ledger!')
                        }}
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
                onFinish={async (values) => {
                  await store.addSettingsTemplate('notes', {
                    name: values.name,
                    content: 'Write notes structure details here...',
                  })
                  toast.success('Note template created!')
                  setNoteModalOpen(false)
                }}
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
          </div>
            )}

            {activeTemplateTab === 'invoices' && userRole !== 'practitioner' && (
              
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
                form={invoiceForm}
                initialValues={{
                  terms: store.invoiceTemplates.paymentTerms || 'Due on Receipt',
                  footer: store.invoiceTemplates.footerText || '',
                }}
                onFinish={async (values) => {
                  setInvoiceSaving(true)
                  try {
                    const invoicePayload = {
                      paymentTerms: values.terms,
                      footerText: values.footer,
                      logoUrl: store.invoiceTemplates.logoUrl || null,
                      enabledFunding
                    }
                    useClinicStore.setState(state => ({
                      invoiceTemplates: {
                        ...state.invoiceTemplates,
                        ...invoicePayload
                      }
                    }))
                    await updateInvoiceTemplates(invoicePayload)
                    toast.success('Invoicing configurations saved to live database successfully!')
                  } catch (err) {
                    toast.error('Failed to save invoicing layout')
                  } finally {
                    setInvoiceSaving(false)
                  }
                }}
              >
                {/* Upload logo */}
                <div className="mb-6">
                  <span className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2">Upload Clinic Logo</span>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
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
                              try {
                                await updateInvoiceTemplates({ 
                                  logoUrl: base64,
                                  paymentTerms: invoiceForm.getFieldValue('terms') || store.invoiceTemplates.paymentTerms,
                                  footerText: invoiceForm.getFieldValue('footer') || store.invoiceTemplates.footerText,
                                  enabledFunding
                                })
                                toast.success('Clinic logo uploaded and saved to live database!')
                              } catch (err) {
                                toast.success('Clinic logo uploaded!')
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }
                        input.click()
                      }}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
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
                          try {
                            await updateInvoiceTemplates({ 
                              logoUrl: null,
                              paymentTerms: invoiceForm.getFieldValue('terms') || store.invoiceTemplates.paymentTerms,
                              footerText: invoiceForm.getFieldValue('footer') || store.invoiceTemplates.footerText,
                              enabledFunding
                            })
                            toast.success('Logo removed from database successfully')
                          } catch (err) {
                            toast.success('Logo removed successfully')
                          }
                        }}
                        className="bg-transparent border-none text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item name="terms" label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Standard Payment Terms <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'Please select payment terms' }]}>
                    <Select className="w-full flex items-center">
                      <Option value="Due on Receipt">Due on Receipt</Option>
                      <Option value="7 Days">7 Days</Option>
                      <Option value="14 Days">14 Days</Option>
                      <Option value="30 Days">30 Days</Option>
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item name="footer" label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice Footer Information <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'Please enter footer information' }]}>
                  <Input.TextArea rows={3} placeholder="Thank you for choosing our practice. Please send remittance advice to billing@zhealth.com" />
                </Form.Item>

                <div className="mb-6">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Funding Templates Enabled</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'private', type: 'Private Client Invoice', desc: 'Auto-applies standard service price.' },
                      { key: 'ndis', type: 'NDIS Invoice', desc: 'Adds line codes and nominee fields.' },
                      { key: 'dva', type: 'DVA Invoice', desc: 'Formatted with Veteran file reference.' },
                      { key: 'workcover', type: 'WorkCover Invoice', desc: 'Includes Injury Case identifiers.' },
                    ].map((tpl) => {
                      const isEnabled = enabledFunding[tpl.key] !== false
                      return (
                        <div 
                          key={tpl.key} 
                          onClick={() => {
                            const updated = { ...enabledFunding, [tpl.key]: !isEnabled }
                            setEnabledFunding(updated)
                            toast.success(`${tpl.type} ${!isEnabled ? 'Enabled' : 'Disabled'}`)
                          }}
                          className={`p-3 border rounded-xl cursor-pointer transition-all ${
                            isEnabled 
                              ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' 
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{tpl.type}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{tpl.desc}</span>
                          <div className="mt-2 text-right">
                            <Tag color={isEnabled ? 'purple' : 'default'} className="m-0 text-[9px] border-none font-bold">
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </Tag>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={invoiceSaving}
                    className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-6 rounded-xl cursor-pointer shadow-sm"
                  >
                    Save Invoice Layout
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
            )}
          </div>
        )

      case 'services':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Services</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Configure services offered by practitioners. Service entries display within the calendar and invoice selectors.
                </p>
              </div>
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

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={store.services.filter((s) => !s.archived)}
                pagination={false}
                rowKey="id"
                columns={[
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Service Name</span>,
                    dataIndex: 'name',
                    render: (text, record) => (
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: record.color }} />
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
                            })
                            setServiceModalOpen(true)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Edit"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={() => {
                            store.archiveService(record.id)
                            toast.success(`Service "${record.name}" archived!`)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                          title="Archive"
                        >
                          <CloseCircleOutlined />
                        </button>
                        <button
                          onClick={() => {
                            store.removeService(record.id)
                            toast.success(`Removed service: ${record.name}`)
                          }}
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
                onFinish={(values) => {
                  if (editingService) {
                    store.editService({
                      ...editingService,
                      ...values,
                    })
                    toast.success('Service details updated successfully!')
                  } else {
                    store.addService(values)
                    toast.success('New service added!')
                  }
                  setServiceModalOpen(false)
                }}
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

      case 'cancellation':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Cancellation Reasons</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Configure reasons selected by practitioners when cancelling booked appointments.
              </p>
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
                    const text = cancellationText.trim() || 'Weather Issues'
                    if (editingCancellation) {
                      store.editCancellationReason(editingCancellation.id, text)
                      toast.success('Reason description modified!')
                      setEditingCancellation(null)
                    } else {
                      store.addCancellationReason(text)
                      toast.success(`New cancellation reason "${text}" added!`)
                    }
                    setCancellationText('')
                  }}
                  placeholder="e.g. Weather Issues"
                  className="rounded-xl h-10 flex-1"
                />
                <Button
                  onClick={() => {
                    const text = cancellationText.trim() || 'Weather Issues'
                    if (editingCancellation) {
                      store.editCancellationReason(editingCancellation.id, text)
                      toast.success('Reason description modified!')
                      setEditingCancellation(null)
                    } else {
                      store.addCancellationReason(text)
                      toast.success(`New cancellation reason "${text}" added!`)
                    }
                    setCancellationText('')
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

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-w-2xl">
                <Table
                  dataSource={store.cancellationReasons.filter((r) => !r.archived)}
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
                          >
                            <EditOutlined style={{ fontSize: 13 }} />
                          </button>
                          <button
                            onClick={() => {
                              store.archiveCancellationReason(record.id)
                              toast.success('Reason archived!')
                            }}
                            className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <CloseCircleOutlined style={{ fontSize: 13 }} />
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

      case 'tags':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Client Tags</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Create and color-code client classification tags used throughout profile sheets.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTag(null)
                  tagForm.resetFields()
                  setTagModalOpen(true)
                }}
                className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
              >
                <PlusOutlined />
                <span>Create Tag</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={store.clientTags}
                pagination={false}
                rowKey="id"
                columns={[
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Tag Identifier</span>,
                    dataIndex: 'name',
                    render: (text, record) => (
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: record.color }} />
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
                    render: (color) => <span className="font-mono text-xs text-slate-400">{color}</span>,
                  },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Assigned Icon</span>,
                    dataIndex: 'icon',
                    render: (icon) => (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-slate-600">
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
                            tagForm.setFieldsValue({
                              ...record,
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
                          onClick={() => {
                            store.deleteClientTag(record.id)
                            toast.success(`Removed tag: ${record.name}`)
                          }}
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

            {/* Tag Modal */}
            <Modal
              open={tagModalOpen}
              onCancel={() => setTagModalOpen(false)}
              footer={null}
              destroyOnHidden
              width={400}
              title={<span className="font-bold text-slate-800 dark:text-slate-200">{editingTag ? 'Edit Tag' : 'Create Tag'}</span>}
            >
              <Form
                layout="vertical"
                form={tagForm}
                onFinish={(values) => {
                  if (editingTag) {
                    store.editClientTag({
                      ...editingTag,
                      ...values,
                    })
                    toast.success('Tag details updated successfully!')
                  } else {
                    store.addClientTag(values)
                    toast.success('New client classification tag added!')
                  }
                  setTagModalOpen(false)
                }}
                className="mt-4"
              >
                <Form.Item name="name" label="Tag name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Falls Risk" />
                </Form.Item>
                <Form.Item name="color" label="Hex / Dot Color" rules={[{ required: true }]}>
                  <Select>
                    <Option value="#30D2BE">Teal</Option>
                    <Option value="#8C4BFF">Purple</Option>
                    <Option value="#3B82F6">Blue</Option>
                    <Option value="#10B981">Green</Option>
                    <Option value="#F59E0B">Yellow</Option>
                    <Option value="#EF4444">Red</Option>
                    <Option value="#64748B">Slate Gray</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="icon" label="Tag Icon" rules={[{ required: true }]} initialValue="TagOutlined">
                  <Select>
                    {Object.keys(tagIconsMap).map((iconKey) => (
                      <Option key={iconKey} value={iconKey}>
                        <span className="inline-flex items-center gap-2">
                          {tagIconsMap[iconKey]}
                          <span>{iconKey.replace('Outlined', '')}</span>
                        </span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <div className="flex justify-end gap-2 mt-6">
                  <Button onClick={() => setTagModalOpen(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}>
                    Save Tag
                  </Button>
                </div>
              </Form>
            </Modal>
          </div>
        )

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
                    Start Secure Download
                  </button>
                </Form>
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
                        onChange={(e) => setTfaMethod(e.target.value)}
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
                          setTfaEnabled(!tfaEnabled)
                          toast.success(`2FA turned ${!tfaEnabled ? 'ON' : 'OFF'} successfully!`)
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
                  layout="vertical"
                  onFinish={(values) => {
                    toast.success('Your secure password updated!')
                  }}
                  className="space-y-3"
                >
                  <Form.Item name="oldPass" label="Current Password" required>
                    <Input.Password className="rounded-xl h-9 text-xs" />
                  </Form.Item>
                  <Form.Item name="newPass" label="New Secure Password" required>
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

      case 'billing':
        return userRole === 'practitioner' ? null : <PractitionerBilling />

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
              Settings Menu
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[700px]">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
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
