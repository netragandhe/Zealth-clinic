import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Checkbox, Space, Card, Radio, Table, Modal, Button, Tag, Divider, Tabs, InputNumber, Tooltip } from 'antd'
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
  CheckOutlined,
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
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import PatientSettings from '../../dashboard/components/patient/PatientSettings'
import ClinicDetailsTab from '../components/ClinicDetailsTab'
import SubscriptionPage from './SubscriptionPage'
import RolesPermissionsTab from '../components/RolesPermissionsTab'
import {
  getSuperAdminProfile,
  updateSuperAdminProfile,
  getSettingsTemplates,
  createSettingsTemplate,
  updateSettingsTemplate,
  deleteSettingsTemplate,
  getServices as apiGetServices,
  createService as apiCreateService,
  updateService as apiUpdateService,
  deleteService as apiDeleteService,
  getClientTags as apiGetClientTags,
  createClientTag as apiCreateClientTag,
  updateClientTag as apiUpdateClientTag,
  deleteClientTag as apiDeleteClientTag,
  getCancellationReasons as apiGetCancellationReasons,
  createCancellationReason as apiCreateCancellationReason,
  updateCancellationReason as apiUpdateCancellationReason,
  deleteCancellationReason as apiDeleteCancellationReason,
  processDataImport,
  logDataExport,
  getDataLogs,
  changeSuperAdminPassword,
  getLoginHistoryLogs,
  revokeDeviceSession,
  getIntegrations as getIntegrationsApi,
  updateIntegration as updateIntegrationApi
} from '../api/settingsApi'

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

export default function SuperAdminSettingsPage() {
  const [activeTemplateTab, setActiveTemplateTab] = useState('forms')
  const store = useClinicStore()
  const navigate = useNavigate()
  const userRole = store.userRole
  const isPatient = userRole === 'patient'

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
          { key: 'templates', label: 'Templates', icon: <FileTextOutlined /> }
        ]
      case 'clinic':
      case 'head_admin':
      default:
        return [
          { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
          { key: 'integrations', label: 'Integrations', icon: <ApiOutlined /> },
          { key: 'templates', label: 'Templates', icon: <FileTextOutlined /> },
          { key: 'services', label: 'Services', icon: <AppstoreOutlined /> },
          { key: 'cancellation', label: 'Cancellation Reasons', icon: <CloseCircleOutlined /> },
          { key: 'tags', label: 'Client Tags', icon: <TagOutlined /> },
          { key: 'import_export', label: 'Data Management', icon: <DatabaseOutlined /> },
          { key: 'security', label: 'Security', icon: <LockOutlined /> }
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

  const [form] = Form.useForm()

  // Live Database States
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [signatureText, setSignatureText] = useState('Colin Edegbe')
  const [serviceSearch, setServiceSearch] = useState('')
  const [servicesList, setServicesList] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [cancellationReasonsList, setCancellationReasonsList] = useState([])
  const [clientTagsList, setClientTagsList] = useState([])
  const [tagsSearch, setTagsSearch] = useState('')
  const [loadingTags, setLoadingTags] = useState(false)

  // Profile Tab State
  const [providerNumbers, setProviderNumbers] = useState([
    { id: 1, type: 'AHPRA', num: 'PHY000278016', loc: 'NDIS' },
    { id: 2, type: 'AHPRA', num: 'PHY000278016', loc: 'CEO Therapy Mobile' },
    { id: 3, type: 'Medicare', num: '6683896B', loc: 'CEO Therapy Mobile' }
  ])

  // Load profile and settings data from backend database on mount
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        setLoadingProfile(true)
        const [profileRes, templatesRes, servicesRes, tagsRes, reasonsRes, historyRes] = await Promise.allSettled([
          getSuperAdminProfile(),
          getSettingsTemplates(),
          apiGetServices(),
          apiGetClientTags(),
          apiGetCancellationReasons(),
          getLoginHistoryLogs()
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
          const userData = profileRes.value.data
          const pData = userData.profileData || {}
          form.setFieldsValue({
            title: pData.title || 'Mr',
            firstName: pData.firstName || userData.name?.split(' ')[0] || 'Colin',
            lastName: pData.lastName || userData.name?.split(' ').slice(1).join(' ') || 'Edegbe',
            gender: pData.gender || 'Male',
            email: userData.email || 'colin.edegbe@ceotherapy.com',
            dobDay: pData.dobDay || '15',
            dobMonth: pData.dobMonth || 'August',
            dobYear: pData.dobYear || '1990',
            phone: userData.phone || pData.phone || '+61 412 345 678',
            professionalTitle: pData.professionalTitle || 'Physiotherapist',
            groups: pData.groups || 'Senior Practitioner'
          })
          if (pData.providerNumbers?.length) setProviderNumbers(pData.providerNumbers)
          if (pData.services) setSelectedServices(pData.services)
          if (pData.signature) setSignatureText(pData.signature)
          if (pData.integrations) setIntegrations(pData.integrations)
          if (pData.twoFactorEnabled !== undefined) setTwoFactorEnabled(!!pData.twoFactorEnabled)
          if (pData.apiKeys?.length) setApiKeys(pData.apiKeys)
          if (userData.avatarUrl) setAvatarUrl(userData.avatarUrl)
        }

        if (templatesRes.status === 'fulfilled' && templatesRes.value?.success) {
          const rawData = templatesRes.value.data
          const forms = rawData?.forms || (Array.isArray(rawData) ? rawData : [])
          const letters = rawData?.letters || []
          const notes = rawData?.notes || []
          
          useClinicStore.setState({
            formTemplates: forms,
            letterTemplates: letters.length ? letters : store.letterTemplates,
            noteTemplates: notes.length ? notes : store.noteTemplates
          })

          const fetchedCharts = forms.filter(t => t.category === 'BODY_CHART' || t.type === 'BODY_CHART')
          if (fetchedCharts?.length) {
            setBodyChartsList(fetchedCharts.map(c => ({ id: c.id, name: c.name, category: 'Physiotherapy', updatedAt: c.lastModified || 'Live DB' })))
          }
        }
        if (servicesRes.status === 'fulfilled') {
          const svcData = servicesRes.value
          console.log('[Settings] Services API response:', svcData)
          const list = svcData?.data || (Array.isArray(svcData) ? svcData : [])
          if (list.length >= 0) {
            setServicesList(list)
            store.updateSettings('services', list)
          }
        }
        if (tagsRes.status === 'fulfilled' && tagsRes.value?.success && Array.isArray(tagsRes.value.data)) {
          const mappedTags = tagsRes.value.data.map(t => ({
            ...t,
            icon: t.iconName || t.icon || 'TagOutlined'
          }))
          setClientTagsList(mappedTags)
          useClinicStore.setState({ clientTags: mappedTags })
        }
        if (reasonsRes.status === 'fulfilled' && reasonsRes.value?.success && Array.isArray(reasonsRes.value.data)) {
          setCancellationReasonsList(reasonsRes.value.data)
        }
        if (historyRes.status === 'fulfilled' && historyRes.value?.success && Array.isArray(historyRes.value.data) && historyRes.value.data.length) {
          setLoginHistoryList(historyRes.value.data)
        }
      } catch (err) {
        console.error('Error fetching settings from backend:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
    loadAllSettings()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await apiGetClientTags()
      if (res && res.success && Array.isArray(res.data)) {
        const mappedTags = res.data.map(t => ({
          ...t,
          icon: t.iconName || t.icon || 'TagOutlined'
        }))
        setClientTagsList(mappedTags)
        useClinicStore.setState({ clientTags: mappedTags })
      }
    } catch (err) {
      console.error("Error fetching tags in SuperAdminSettingsPage:", err)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'tags') {
      fetchTags()
    }
  }, [activeTab])

  const handleSaveProfile = async (values) => {
    try {
      const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim()
      const payload = {
        name: fullName,
        phone: values.phone,
        avatarUrl,
        profileData: {
          title: values.title,
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender,
          dobDay: values.dobDay,
          dobMonth: values.dobMonth,
          dobYear: values.dobYear,
          professionalTitle: values.professionalTitle,
          groups: values.groups,
          signature: signatureText,
          providerNumbers,
          services: selectedServices,
          integrations,
          twoFactorEnabled,
          apiKeys
        }
      }

      await updateSuperAdminProfile(payload)
      toast.success('Profile settings updated & saved to live database!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile settings')
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (uploadEvent) => {
        const base64Url = uploadEvent.target.result
        setAvatarUrl(base64Url)
        try {
          await updateSuperAdminProfile({ avatarUrl: base64Url })
          toast.success('Profile photo uploaded and saved to live database!')
        } catch (err) {
          toast.error('Failed to save avatar photo')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const updateProviderNumberField = (id, field, value) => {
    setProviderNumbers(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleAddProviderNumber = () => {
    setProviderNumbers([...providerNumbers, { id: Date.now(), type: 'AHPRA', num: '', loc: 'NDIS' }])
    toast.success('Provider number added')
  }

  const handleDeleteProviderNumber = (id) => {
    setProviderNumbers(providerNumbers.filter(pn => pn.id !== id))
    toast.success('Provider number removed')
  }
  // Body Chart Template State
  const [bodyChartsList, setBodyChartsList] = useState([
    { id: '1', name: 'Physiotherapy Full Body', category: 'Physiotherapy', updatedAt: '2 days ago' },
    { id: '2', name: 'Spine & Posture Chart', category: 'Chiropractic', updatedAt: '5 days ago' },
    { id: '3', name: 'Upper Extremity Assessment', category: 'Occupational Therapy', updatedAt: '1 week ago' }
  ])
  const [bodyChartModalOpen, setBodyChartModalOpen] = useState(false)
  const [bodyChartForm] = Form.useForm()

  const handleCreateBodyChart = async (values) => {
    try {
      const res = await createSettingsTemplate({
        type: 'BODY_CHART',
        name: values.name,
        category: 'BODY_CHART'
      })

      const createdObj = res?.data
      const newChart = {
        id: createdObj?.id || Date.now().toString(),
        name: createdObj?.name || values.name,
        category: values.category || 'Physiotherapy',
        updatedAt: 'Live DB'
      }
      setBodyChartsList(prev => [newChart, ...prev])
      setBodyChartModalOpen(false)
      bodyChartForm.resetFields()

      toast.success('New Body Chart template created & saved to live database!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create body chart template')
    }
  }

  const handleDeleteBodyChart = async (id) => {
    setBodyChartsList(bodyChartsList.filter(c => c.id !== id))
    await deleteSettingsTemplate('BODY_CHART', id).catch(() => {})
    toast.success('Body chart template deleted from database!')
  }

  // Integrations DB State & Handlers
  const [integrationsList, setIntegrationsList] = useState([])
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)
  const [integrationsSearch, setIntegrationsSearch] = useState('')
  const [integrationsCategoryFilter, setIntegrationsCategoryFilter] = useState('All')
  const [integrationsStatusFilter, setIntegrationsStatusFilter] = useState('All')

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

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrations()
    }
  }, [activeTab])

  const handleToggleIntegrationDB = async (item) => {
    if (item.id === 'myob') {
      toast.error('MYOB integration is coming soon in a future update!')
      return
    }
    const nextStatus = !item.connected
    try {
      const res = await updateIntegrationApi(item.id, { connected: nextStatus })
      if (res && res.success && Array.isArray(res.data)) {
        setIntegrationsList(res.data)
        useClinicStore.setState({ integrations: res.data })
        toast.success(`${item.name} is now ${nextStatus ? 'Connected' : 'Disconnected'} in live database!`)
      } else {
        toast.error('Failed to update integration in database')
      }
    } catch (err) {
      console.error("Error updating integration in database:", err)
      toast.error('Error updating integration in live database')
    }
  }

  const handleSyncIntegrationDB = async (item) => {
    try {
      const nowStr = new Date().toLocaleString()
      const res = await updateIntegrationApi(item.id, { connected: true, lastSync: nowStr })
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

  // Integrations State
  const [integrations, setIntegrations] = useState({})

  const handleToggleIntegration = async (appName) => {
    const updated = { ...integrations, [appName]: !integrations[appName] }
    setIntegrations(updated)
    try {
      const currentFormValues = form.getFieldsValue()
      const fullProfileData = {
        title: currentFormValues.title || 'Mr',
        firstName: currentFormValues.firstName || 'Colin',
        lastName: currentFormValues.lastName || 'Edegbe',
        gender: currentFormValues.gender || 'Male',
        dobDay: currentFormValues.dobDay || '15',
        dobMonth: currentFormValues.dobMonth || 'August',
        dobYear: currentFormValues.dobYear || '1990',
        professionalTitle: currentFormValues.professionalTitle || 'Physiotherapist',
        groups: currentFormValues.groups || 'Senior Practitioner',
        signature: signatureText,
        providerNumbers,
        services: selectedServices,
        integrations: updated
      }
      await updateSuperAdminProfile({ profileData: fullProfileData })
      toast.success(`${appName} status ${updated[appName] ? 'Connected' : 'Disconnected'} & saved to database!`)
    } catch (err) {
      toast.error(`Failed to update ${appName} integration status`)
    }
  }

  // Login History State
  const [loginHistoryList, setLoginHistoryList] = useState([
    { key: '1', date: '2026-07-03 10:00 AM', ip: '192.168.1.1', location: 'Melbourne, VIC', device: 'Chrome / Windows' },
    { key: '2', date: '2026-07-02 09:30 AM', ip: '192.168.1.1', location: 'Melbourne, VIC', device: 'Chrome / Windows' }
  ])

  // Account Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all password fields')
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirm password do not match')
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters long')
    }
    try {
      await changeSuperAdminPassword({ currentPassword, newPassword })
      toast.success('Password updated & saved to live database!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    }
  }

  const handleToggle2FA = async () => {
    const nextVal = !twoFactorEnabled
    setTwoFactorEnabled(nextVal)
    try {
      const currentFormValues = form.getFieldsValue()
      await updateSuperAdminProfile({
        profileData: {
          ...currentFormValues,
          twoFactorEnabled: nextVal,
          signature: signatureText,
          providerNumbers,
          services: selectedServices,
          integrations,
          apiKeys
        }
      })
      toast.success(`Two-Factor Authentication ${nextVal ? 'enabled' : 'disabled'} & saved to database!`)
    } catch (err) {
      toast.error('Failed to update 2FA status')
    }
  }

  // API Keys State
  const [apiKeys, setApiKeys] = useState([
    { key: '1', name: 'Production App', token: 'sk_live_12345...89', created: '2026-01-10', lastUsed: '2026-07-03' },
    { key: '2', name: 'Zapier Integration', token: 'sk_live_98765...21', created: '2026-03-15', lastUsed: '2026-07-01' }
  ])
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [apiKeyForm] = Form.useForm()

  const handleGenerateApiKey = async (values) => {
    const newKey = {
      key: Date.now().toString(),
      name: values.name || 'New API Key',
      token: 'sk_live_' + Math.random().toString(36).substring(2, 14),
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Just now'
    }
    const updated = [newKey, ...apiKeys]
    setApiKeys(updated)
    setApiKeyModalOpen(false)
    apiKeyForm.resetFields()

    try {
      const currentFormValues = form.getFieldsValue()
      await updateSuperAdminProfile({
        profileData: {
          ...currentFormValues,
          apiKeys: updated,
          twoFactorEnabled,
          signature: signatureText,
          providerNumbers,
          services: selectedServices,
          integrations
        }
      })
      toast.success('New API Key generated & saved to database!')
    } catch (err) {
      toast.error('Failed to save API Key to database')
    }
  }

  const handleDeleteApiKey = async (keyId) => {
    const updated = apiKeys.filter(k => (k.key !== keyId && k.id !== keyId))
    setApiKeys(updated)
    try {
      const currentFormValues = form.getFieldsValue()
      await updateSuperAdminProfile({
        profileData: {
          ...currentFormValues,
          apiKeys: updated,
          twoFactorEnabled,
          signature: signatureText,
          providerNumbers,
          services: selectedServices,
          integrations
        }
      })
      toast.success('API Key revoked & deleted from database!')
    } catch (err) {
      toast.error('Failed to revoke API Key')
    }
  }

  // Forms Template State
  const [editingForm, setEditingForm] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formEdit] = Form.useForm()

  // Letters Template State
  const [editingLetter, setEditingLetter] = useState(null)
  const [letterModalOpen, setLetterModalOpen] = useState(false)
  const [letterEdit] = Form.useForm()

  // Notes Template State
  const [selectedNote, setSelectedNote] = useState(store.noteTemplates[0] || null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [notePreviewMode, setNotePreviewMode] = useState(false)
  const [notePreviewModalOpen, setNotePreviewModalOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState('placeholders')

  // Services State
  const [editingService, setEditingService] = useState(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [serviceForm] = Form.useForm()

  // Cancellation Reasons State
  const [cancellationText, setCancellationText] = useState('')
  const [editingCancellation, setEditingCancellation] = useState(null)

  // Client Tags State
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [activeTagColorHex, setActiveTagColorHex] = useState('#8C4BFF')
  const [tagForm] = Form.useForm()

  // Security Toggles
  const [tfaMethod, setTfaMethod] = useState('app')
  const [tfaEnabled, setTfaEnabled] = useState(true)
  const [trustedDevices, setTrustedDevices] = useState([
    { key: '1', device: 'Chrome / Windows (Current)', ip: '103.88.24.12', time: 'Today, 04:30 PM', location: 'Melbourne, VIC', status: 'Active Session' },
    { key: '2', device: 'iPhone App Client', ip: '120.91.4.11', time: 'Today, 10:15 AM', location: 'Sydney, NSW', status: 'Active Session' },
    { key: '3', device: 'Safari / macOS Sierra', ip: '110.12.82.9', time: 'Yesterday, 02:44 PM', location: 'Melbourne, VIC', status: 'Expired' },
  ])

  // Data Import / Export State
  const [importFile, setImportFile] = useState(null)
  const [importTarget, setImportTarget] = useState('clients')
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedErrors, setSelectedErrors] = useState([])
  const [selectedLogFileName, setSelectedLogFileName] = useState('')

  // Data Management Live Database States & Filters
  const [dataLogsList, setDataLogsList] = useState([])
  const [loadingDataLogs, setLoadingDataLogs] = useState(false)
  const [logTypeFilter, setLogTypeFilter] = useState('all')
  const [logStatusFilter, setLogStatusFilter] = useState('all')
  const [logTargetFilter, setLogTargetFilter] = useState('all')
  const [logSearchQuery, setLogSearchQuery] = useState('')

  const loadDataLogsFromBackend = async (overrideParams = {}) => {
    try {
      setLoadingDataLogs(true)
      const params = {
        type: overrideParams.type !== undefined ? overrideParams.type : logTypeFilter,
        status: overrideParams.status !== undefined ? overrideParams.status : logStatusFilter,
        target: overrideParams.target !== undefined ? overrideParams.target : logTargetFilter,
        search: overrideParams.search !== undefined ? overrideParams.search : logSearchQuery
      }
      const res = await getDataLogs(params)
      if (res?.success && Array.isArray(res.data)) {
        setDataLogsList(res.data)
      }
    } catch (err) {
      console.error('Failed to load data logs from database:', err)
    } finally {
      setLoadingDataLogs(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'import_export') {
      loadDataLogsFromBackend()
    } else if (activeTab === 'security') {
      loadSecurityLogsFromBackend()
    }
  }, [activeTab])

  // Security Live Database States & Filters
  const [securitySearchQuery, setSecuritySearchQuery] = useState('')
  const [securityStatusFilter, setSecurityStatusFilter] = useState('all')
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState(false)

  const loadSecurityLogsFromBackend = async (overrideParams = {}) => {
    try {
      setLoadingSecurityLogs(true)
      const params = {
        status: overrideParams.status !== undefined ? overrideParams.status : securityStatusFilter,
        search: overrideParams.search !== undefined ? overrideParams.search : securitySearchQuery
      }
      const res = await getLoginHistoryLogs(params)
      if (res?.success && Array.isArray(res.data)) {
        setLoginHistoryList(res.data)
        setTrustedDevices(res.data)
      }
    } catch (err) {
      console.error('Failed to load security logs from database:', err)
    } finally {
      setLoadingSecurityLogs(false)
    }
  }



  // Render content logic
  const renderTabContent = () => {
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
          <Form 
            form={form}
            layout="vertical" 
            onFinish={handleSaveProfile}
            initialValues={{
              title: 'Mr',
              firstName: 'Colin',
              lastName: 'Edegbe',
              gender: 'Male',
              email: 'colin.edegbe@ceotherapy.com',
              dobDay: '15',
              dobMonth: 'August',
              dobYear: '1990',
              phone: '+61 412 345 678',
              professionalTitle: 'Physiotherapist',
              groups: 'Senior Practitioner'
            }}
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
                                <Form.Item name="dobDay" className="mb-0 flex-1">
                                  <Select showSearch>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                      <Option key={d} value={d.toString()}>{d}</Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item name="dobMonth" className="mb-0 flex-1">
                                  <Select showSearch>
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                      <Option key={m} value={m}>{m}</Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item name="dobYear" className="mb-0 flex-1">
                                  <Select showSearch>
                                    {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                      <Option key={y} value={y.toString()}>{y}</Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </div>
                            </Form.Item>

                            <Form.Item name="phone" label={<span className="font-semibold text-xs">Phone numbers</span>} className="mb-0 mt-2">
                              <div className="flex flex-col gap-2">
                                <Input />
                              </div>
                            </Form.Item>

                            <Form.Item name="professionalTitle" label={<span className="font-semibold text-xs mt-2">Professional title (Occupational Therapist, Physiotherapist, etc.) <span className="text-red-500">*</span></span>} className="mb-0">
                              <Input />
                            </Form.Item>

                            <Form.Item name="groups" label={<span className="font-semibold text-xs mt-2">Groups</span>} className="mb-0">
                              <Select>
                                <Option value="Senior Practitioner">Senior Practitioner</Option>
                                <Option value="Standard Practitioner">Standard Practitioner</Option>
                              </Select>
                            </Form.Item>
                          </div>
                          
                          {/* Profile Picture */}
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-48 h-48 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 relative">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <UserOutlined className="text-[80px] text-slate-300" />
                              )}
                            </div>
                            <label className="ant-btn ant-btn-default font-semibold cursor-pointer flex items-center gap-2">
                              <UploadOutlined /> Upload Photo
                              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
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
                              <Input 
                                placeholder="Search options" 
                                value={serviceSearch}
                                onChange={e => setServiceSearch(e.target.value)}
                                className="mb-3 max-w-sm rounded-lg" 
                              />
                              <div className="mb-3">
                                <Checkbox 
                                  className="font-semibold text-slate-500 text-xs"
                                  onChange={e => {
                                    if (e.target.checked) {
                                      const all = (servicesList.length ? servicesList.map(s => s.name) : [
                                        'Physiotherapy Subsequent Session (Therapeutic Supports)',
                                        'Progress report (Non-Face-to-Face Services)',
                                        'Initial Physiotherapy Session (Therapeutic Supports)',
                                        'Creation of resources (e.g. exercise program) (Therapeutic Supports)',
                                        '(ECS) Subsequent Physiotherapy Session (Early Childhood Supports)',
                                        'Mobile Physio - Initial (0-10km) (Private)',
                                        'Mobile Physio - Follow-Up (0-10km) (Private)',
                                        'Correspondence (inc phone calls and emails) (Physiotherapy) (Therapeutic Supports)',
                                        'Mobile Physio - Initial (20-30km) (Private)',
                                        'Mobile Physio - Initial (30-40km) (Private)',
                                        'Mobile Physio - Initial (10-20km) (Private)',
                                        'Mobile Physio - Follow-Up (10-20km) (Private)',
                                        'Mobile Physio - Follow-Up (30-40km) (Private)',
                                        'Mobile Physio - Follow-Up (20-30km) (Private)',
                                        'Copy of Progress report (Non-Face-to-Face Services)'
                                      ])
                                      setSelectedServices(all)
                                    } else {
                                      setSelectedServices([])
                                    }
                                  }}
                                >
                                  Check all
                                </Checkbox>
                              </div>
                              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 text-sm">
                                {(servicesList.length ? servicesList.map(s => s.name) : [
                                  'Physiotherapy Subsequent Session (Therapeutic Supports)',
                                  'Progress report (Non-Face-to-Face Services)',
                                  'Initial Physiotherapy Session (Therapeutic Supports)',
                                  'Creation of resources (e.g. exercise program) (Therapeutic Supports)',
                                  '(ECS) Subsequent Physiotherapy Session (Early Childhood Supports)',
                                  'Mobile Physio - Initial (0-10km) (Private)',
                                  'Mobile Physio - Follow-Up (0-10km) (Private)',
                                  'Correspondence (inc phone calls and emails) (Physiotherapy) (Therapeutic Supports)',
                                  'Mobile Physio - Initial (20-30km) (Private)',
                                  'Mobile Physio - Initial (30-40km) (Private)',
                                  'Mobile Physio - Initial (10-20km) (Private)',
                                  'Mobile Physio - Follow-Up (10-20km) (Private)',
                                  'Mobile Physio - Follow-Up (30-40km) (Private)',
                                  'Mobile Physio - Follow-Up (20-30km) (Private)',
                                  'Copy of Progress report (Non-Face-to-Face Services)'
                                ])
                                .filter(s => !serviceSearch || s.toLowerCase().includes(serviceSearch.toLowerCase()))
                                .map(serviceName => (
                                  <Checkbox 
                                    key={serviceName} 
                                    checked={selectedServices.includes(serviceName)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedServices([...selectedServices, serviceName])
                                      } else {
                                        setSelectedServices(selectedServices.filter(item => item !== serviceName))
                                      }
                                    }}
                                  >
                                    {serviceName}
                                  </Checkbox>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-3">Signature</h4>
                              <div className="mb-4 text-3xl text-slate-600 dark:text-slate-300 italic border-b border-slate-200 dark:border-slate-800 inline-block px-4 py-2" style={{ fontFamily: 'cursive' }}>
                                {signatureText}
                              </div>
                              <div className="flex gap-3">
                                <Button onClick={() => {
                                  const newSig = prompt('Enter signature name:', signatureText)
                                  if (newSig) {
                                    setSignatureText(newSig)
                                    toast.success('Signature updated!')
                                  }
                                }}>
                                  Re-sign
                                </Button>
                                <Button icon={<CloseCircleOutlined />} onClick={() => { setSignatureText(''); toast.success('Signature cleared'); }}>
                                  Clear signature
                                </Button>
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
                                      <Input value={row.type} onChange={e => updateProviderNumberField(row.id, 'type', e.target.value)} className="rounded-lg" />
                                    </div>
                                    <div className="col-span-4">
                                      <Input value={row.num} onChange={e => updateProviderNumberField(row.id, 'num', e.target.value)} className="rounded-lg" />
                                    </div>
                                    <div className="col-span-4">
                                      <Select value={row.loc} onChange={val => updateProviderNumberField(row.id, 'loc', val)} className="w-full rounded-lg">
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
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-semibold" 
                            onClick={() => setBodyChartModalOpen(true)}
                          >
                            New Template
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {bodyChartsList.map(chart => (
                            <div key={chart.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                              <div className="h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative p-4 text-center">
                                <span className="text-slate-600 dark:text-slate-300 font-bold text-lg">{chart.name}</span>
                                <Button 
                                  danger 
                                  type="primary" 
                                  shape="circle" 
                                  icon={<DeleteOutlined />} 
                                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteBodyChart(chart.id); }}
                                />
                              </div>
                              <div className="p-4 bg-white dark:bg-slate-900">
                                <h4 className="font-bold text-sm m-0 text-slate-800 dark:text-white">{chart.name}</h4>
                                <p className="text-xs text-slate-500 m-0 mt-1">{chart.category} • {chart.updatedAt}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Modal to Create New Body Chart Template */}
                        <Modal
                          title="Create Body Chart Template"
                          open={bodyChartModalOpen}
                          onCancel={() => setBodyChartModalOpen(false)}
                          onOk={() => bodyChartForm.submit()}
                          okText="Create & Save to DB"
                          okButtonProps={{ className: "bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold" }}
                        >
                          <Form form={bodyChartForm} layout="vertical" onFinish={handleCreateBodyChart} className="mt-4">
                            <Form.Item name="name" label="Template Title" rules={[{ required: true, message: 'Please enter template title' }]}>
                              <Input placeholder="e.g. Physiotherapy Full Body Chart" />
                            </Form.Item>
                            <Form.Item name="category" label="Category / Department" initialValue="Physiotherapy">
                              <Select>
                                <Option value="Physiotherapy">Physiotherapy</Option>
                                <Option value="Chiropractic">Chiropractic</Option>
                                <Option value="Occupational Therapy">Occupational Therapy</Option>
                                <Option value="Podiatry">Podiatry</Option>
                                <Option value="General">General</Option>
                              </Select>
                            </Form.Item>
                          </Form>
                        </Modal>
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
                          {[
                            { name: 'Xero', desc: 'Accounting & Invoicing Sync' },
                            { name: 'Mailchimp', desc: 'Patient Email Campaigns' },
                            { name: 'Physitrack', desc: 'Exercise Prescriptions' },
                            { name: 'Stripe', desc: 'Online Payment Processing' }
                          ].map(app => {
                            const isConnected = !!integrations[app.name]
                            return (
                              <div key={app.name} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${isConnected ? 'bg-[#8C4BFF]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    {app.name[0]}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm m-0 text-slate-800 dark:text-white">{app.name}</h4>
                                    <p className="text-xs text-slate-500 m-0">{isConnected ? <span className="text-emerald-600 font-semibold">● Connected</span> : 'Not connected'}</p>
                                  </div>
                                </div>
                                <Button 
                                  className={`rounded-lg font-semibold ${isConnected ? 'border-red-400 text-red-500 hover:bg-red-50' : 'bg-[#8C4BFF] text-white hover:bg-[#8C4BFF]/90 border-none'}`} 
                                  onClick={() => handleToggleIntegration(app.name)}
                                >
                                  {isConnected ? 'Disconnect' : 'Connect'}
                                </Button>
                              </div>
                            )
                          })}
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
                          dataSource={loginHistoryList} 
                          columns={[
                            { title: 'Date & Time', dataIndex: 'date', key: 'date', className: 'font-semibold' },
                            { title: 'IP Address', dataIndex: 'ip', key: 'ip' },
                            { title: 'Location', dataIndex: 'location', key: 'location' },
                            { title: 'Device', dataIndex: 'device', key: 'device' },
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
                            <Input.Password 
                              placeholder="Current Password" 
                              size="large" 
                              className="rounded-lg" 
                              value={currentPassword} 
                              onChange={(e) => setCurrentPassword(e.target.value)} 
                            />
                            <Input.Password 
                              placeholder="New Password" 
                              size="large" 
                              className="rounded-lg" 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)} 
                            />
                            <Input.Password 
                              placeholder="Confirm New Password" 
                              size="large" 
                              className="rounded-lg" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)} 
                            />
                            <Button 
                              type="primary" 
                              className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-semibold" 
                              onClick={handleChangePassword}
                            >
                              Update Password
                            </Button>
                          </div>
                        </div>
                        {SHOW_2FA && (
                          <>
                            <Divider />
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white m-0 flex items-center gap-2">
                                  Two-Factor Authentication
                                  {twoFactorEnabled && <Tag color="green">Active</Tag>}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">Add an extra layer of security to your account.</p>
                              </div>
                              <Button 
                                className={`rounded-lg font-semibold ${twoFactorEnabled ? 'border-red-400 text-red-500 hover:bg-red-50' : 'bg-[#8C4BFF] text-white hover:bg-[#8C4BFF]/90 border-none'}`} 
                                onClick={handleToggle2FA}
                              >
                                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
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
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none rounded-lg font-semibold" 
                            onClick={() => setApiKeyModalOpen(true)}
                          >
                            Generate New Key
                          </Button>
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
                              render: (_, record) => (
                                <Button 
                                  danger 
                                  type="text" 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => handleDeleteApiKey(record.key || record.id)} 
                                />
                              )
                            }
                          ]}
                          pagination={false}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                        />

                        {/* Modal to Generate New API Key */}
                        <Modal
                          title="Generate New API Key"
                          open={apiKeyModalOpen}
                          onCancel={() => setApiKeyModalOpen(false)}
                          onOk={() => apiKeyForm.submit()}
                          okText="Generate & Save"
                          okButtonProps={{ className: "bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 border-none font-bold" }}
                        >
                          <Form form={apiKeyForm} layout="vertical" onFinish={handleGenerateApiKey} className="mt-4">
                            <Form.Item name="name" label="API Key Name / Description" rules={[{ required: true, message: 'Please enter key name' }]}>
                              <Input placeholder="e.g. Production Webhook Integration" />
                            </Form.Item>
                          </Form>
                        </Modal>
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
        const currentList = integrationsList.length > 0 ? integrationsList : store.integrations
        const displayIntegrations = currentList.filter(item => {
          const matchesSearch = !integrationsSearch.trim() ||
            item.name.toLowerCase().includes(integrationsSearch.toLowerCase()) ||
            (item.type && item.type.toLowerCase().includes(integrationsSearch.toLowerCase()))
          const matchesCategory = integrationsCategoryFilter === 'All' || item.type === integrationsCategoryFilter
          const matchesStatus = integrationsStatusFilter === 'All' ||
            (integrationsStatusFilter === 'Connected' && item.connected) ||
            (integrationsStatusFilter === 'Disconnected' && !item.connected)
          return matchesSearch && matchesCategory && matchesStatus
        })

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Integrations</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Manage your connections to third-party software tools with live database backend synchronization.
                </p>
              </div>
              <Button
                icon={<SyncOutlined spin={loadingIntegrations} />}
                onClick={fetchIntegrations}
                className="rounded-xl font-semibold border-slate-200 h-9"
              >
                Refresh DB Data
              </Button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
              <Input
                placeholder="Search integrations..."
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
                <Option value="Accounting">Accounting</Option>
                <Option value="Exercise Prescription">Exercise Prescription</Option>
                <Option value="Payments">Payments</Option>
                <Option value="Video Consultations">Video Consultations</Option>
                <Option value="Health Claiming">Health Claiming</Option>
              </Select>
              <Select
                value={integrationsStatusFilter}
                onChange={setIntegrationsStatusFilter}
                className="w-40 rounded-xl h-9"
              >
                <Option value="All">All Statuses</Option>
                <Option value="Connected">Connected</Option>
                <Option value="Disconnected">Disconnected</Option>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayIntegrations.map((item) => (
                <Card
                  key={item.id}
                  className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
                  styles={{ body: { padding: '20px' } }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {item.type}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0 mt-0.5">{item.name}</h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.connected
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${item.connected ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                      />
                      {item.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 font-semibold leading-relaxed">
                    {item.name === 'Xero' && 'Sync clinical invoicing automatically to your accountancy accounts.'}
                    {item.name === 'MYOB' && 'Alternative corporate accountancy sync. (Development planned next stage)'}
                    {item.name === 'Physitrack' && 'Assign clinical home exercises and monitor participant adherence.'}
                    {item.name === 'VALD HUB' && 'Integrate VALD HUB to assign exercises and track participant rehabilitation progress.'}
                    {item.name === 'Stripe' && 'Accept direct client credit card payments inside practitioner portals.'}
                    {item.name === 'Zoom' && 'Integrate secure clinical video rooms directly inside appointments.'}
                    {item.name === 'Google Meet' && 'Connect calendar appointments automatically with Meet links.'}
                    {item.name === 'HICAPS' && 'Medicare claiming and instant private health insurer rebates.'}
                    {item.name === 'Tyro Health' && 'Integrated Tyro claiming terminal connection and rebates.'}
                  </p>

                  <div className="border-t border-slate-50 pt-4 flex flex-col gap-2">
                    {item.connected && (
                      <div className="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                        <span>Last Synced:</span>
                        <span className="font-bold text-slate-600">{item.lastSync || 'Never'}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type={item.connected ? 'default' : 'primary'}
                        onClick={() => handleToggleIntegrationDB(item)}
                        className="flex-1 rounded-xl text-xs font-bold h-9"
                        style={!item.connected && item.id !== 'myob' ? { backgroundColor: '#8C4BFF', border: 'none' } : {}}
                      >
                        {item.connected ? 'Disconnect' : 'Connect'}
                      </Button>
                      {item.connected && (
                        <Button
                          icon={<SyncOutlined />}
                          onClick={() => handleSyncIntegrationDB(item)}
                          className="rounded-xl border border-slate-200 h-9 w-9 flex items-center justify-center p-0"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'forms':
      case 'letters':
      case 'notes':
      case 'invoices':
      case 'templates':
        return (
          <div className="space-y-6 animate-fade-in">
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
                        render: (text) => <Tag color="blue" className="rounded-full border-none font-bold text-[10px] px-2.5 py-0.5">{text || 'Intake'}</Tag>,
                      },
                      {
                        title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Last Modified</span>,
                        dataIndex: 'lastModified',
                        render: (text) => <span className="text-slate-400 font-semibold text-xs">{text || 'Recently'}</span>
                      },
                  {
                    title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Actions</span>,
                    key: 'actions',
                    align: 'right',
                    render: (_, record) => (
                      <Space size="middle">
                        <button
                          onClick={async () => {
                            const res = await createSettingsTemplate({
                              type: 'form',
                              name: `${record.name} (Copy)`,
                              category: record.category
                            }).catch(() => null)

                            const duplicated = res?.data || {
                              id: `f_${Date.now()}`,
                              name: `${record.name} (Copy)`,
                              category: record.category,
                              lastModified: new Date().toISOString().split('T')[0],
                            }
                            useClinicStore.setState((state) => ({
                              formTemplates: [...state.formTemplates, duplicated],
                            }))
                            toast.success(`Duplicated & saved: ${record.name}`)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Duplicate"
                        >
                          <CopyOutlined />
                        </button>
                        <button
                          onClick={() => {
                            setEditingForm(record)
                            formEdit.setFieldsValue(record)
                            setFormModalOpen(true)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Edit"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={async () => {
                            await deleteSettingsTemplate('form', record.id).catch(() => {})
                            useClinicStore.setState((state) => ({
                              formTemplates: state.formTemplates.filter((f) => f.id !== record.id),
                            }))
                            toast.success(`Deleted from database: ${record.name}`)
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
              width={420}
              title={<span className="font-bold text-slate-800 dark:text-slate-200">{editingForm ? 'Edit Form' : 'Create Form'}</span>}
            >
              <Form
                layout="vertical"
                form={formEdit}
                onFinish={async (values) => {
                  if (editingForm) {
                    useClinicStore.setState((state) => ({
                      formTemplates: state.formTemplates.map((f) =>
                        f.id === editingForm.id ? { ...f, ...values, lastModified: new Date().toISOString().split('T')[0] } : f
                      ),
                    }))
                    await createSettingsTemplate({ type: 'form', name: values.name, category: values.category }).catch(() => {})
                    toast.success('Form template updated & saved to database!')
                  } else {
                    const res = await createSettingsTemplate({
                      type: 'form',
                      name: values.name,
                      category: values.category || 'General'
                    }).catch(() => null)

                    const newForm = res?.data || {
                      id: `f_${Date.now()}`,
                      name: values.name,
                      category: values.category || 'General',
                      lastModified: new Date().toISOString().split('T')[0],
                    }
                    useClinicStore.setState((state) => ({
                      formTemplates: [newForm, ...state.formTemplates],
                    }))
                    toast.success('New form template created & saved to database!')
                  }
                  setFormModalOpen(false)
                }}
                className="mt-4"
              >
                <Form.Item name="name" label="Form name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Falls Risk Assessment" />
                </Form.Item>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select placeholder="Select category">
                    <Option value="Intake">Intake</Option>
                    <Option value="Assessment">Assessment</Option>
                    <Option value="Consent">Consent</Option>
                    <Option value="Clinical">Clinical</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
                <div className="flex justify-end gap-2 mt-6">
                  <Button onClick={() => setFormModalOpen(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}>
                    Save Form
                  </Button>
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
                          onClick={() => {
                            const archivedVal = record.status === 'active' ? 'archived' : 'active'
                            useClinicStore.setState((state) => ({
                              letterTemplates: state.letterTemplates.map((l) =>
                                l.id === record.id ? { ...l, status: archivedVal } : l
                              ),
                            }))
                            toast.success(`Letter marked as ${archivedVal}!`)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                          title="Archive"
                        >
                          <CloseCircleOutlined />
                        </button>
                        <button
                          onClick={() => {
                            const duplicated = {
                              id: `l_${Date.now()}`,
                              name: `${record.name} (Copy)`,
                              category: record.category,
                              status: 'active',
                            }
                            useClinicStore.setState((state) => ({
                              letterTemplates: [...state.letterTemplates, duplicated],
                            }))
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
                            letterEdit.setFieldsValue(record)
                            setLetterModalOpen(true)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Edit"
                        >
                          <EditOutlined />
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
              width={420}
              title={<span className="font-bold text-slate-800 dark:text-slate-200">{editingLetter ? 'Edit Letter' : 'Create Letter'}</span>}
            >
              <Form
                layout="vertical"
                form={letterEdit}
                onFinish={(values) => {
                  if (editingLetter) {
                    useClinicStore.setState((state) => ({
                      letterTemplates: state.letterTemplates.map((l) =>
                        l.id === editingLetter.id ? { ...l, ...values } : l
                      ),
                    }))
                    toast.success('Letter template updated!')
                  } else {
                    const newLetter = {
                      id: `l_${Date.now()}`,
                      name: values.name,
                      category: values.category || 'General',
                      status: 'active',
                    }
                    useClinicStore.setState((state) => ({
                      letterTemplates: [...state.letterTemplates, newLetter],
                    }))
                    toast.success('Letter template created!')
                  }
                  setLetterModalOpen(false)
                }}
                className="mt-4"
              >
                <Form.Item name="name" label="Letter template name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Discharge Summary Letter" />
                </Form.Item>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Referrals, Discharge" />
                </Form.Item>
                <div className="flex justify-end gap-2 mt-6">
                  <Button onClick={() => setLetterModalOpen(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}>
                    Save Letter
                  </Button>
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
                        try {
                          await deleteSettingsTemplate('note', t.id).catch(() => {})
                          const updated = store.noteTemplates.filter((n) => n.id !== t.id)
                          useClinicStore.setState({ noteTemplates: updated })
                          if (selectedNote?.id === t.id) {
                            setSelectedNote(updated[0])
                          }
                          toast.success('Note template deleted from database!')
                        } catch (err) {
                          toast.error('Failed to delete note template')
                        }
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
                    <div className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">TEMPLATE TITLE</span>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white m-0 mt-0.5">{selectedNote.name}</h3>
                    </div>

                    <div>
                      <div className="mb-4">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-2">
                          PLACEHOLDERS (CLICK TO INSERT AT CURSOR POSITION)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {['{{Client Name}}', '{{DOB}}', '{{NDIS Number}}', '{{Diagnosis}}', '{{Practitioner Name}}'].map((pl) => (
                            <button
                              key={pl}
                              type="button"
                              onClick={async () => {
                                const newContent = (selectedNote.content || '') + ` ${pl} `
                                const updatedNote = { ...selectedNote, content: newContent }
                                useClinicStore.setState((state) => ({
                                  noteTemplates: state.noteTemplates.map((n) =>
                                    n.id === selectedNote.id ? updatedNote : n
                                  ),
                                }))
                                setSelectedNote(updatedNote)
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
                            const updatedNote = { ...selectedNote, content: val }
                            useClinicStore.setState((state) => ({
                              noteTemplates: state.noteTemplates.map((n) =>
                                n.id === selectedNote.id ? updatedNote : n
                              ),
                            }))
                            setSelectedNote(updatedNote)
                          }}
                          autoSize={{ minRows: 18, maxRows: 35 }}
                          style={{ minHeight: '480px' }}
                          className="w-full text-slate-700 dark:text-slate-200 text-xs leading-relaxed font-mono rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus:bg-white"
                          placeholder="Write clinical notes template structure and placeholders here..."
                        />
                      </div>

                      {/* Bottom Right Actions */}
                      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          onClick={() => setNotePreviewModalOpen(true)}
                          className="rounded-xl font-bold h-10 text-xs px-5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                          icon={<EyeOutlined />}
                        >
                          Preview Template
                        </Button>
                        <Button
                          type="primary"
                          onClick={async () => {
                            try {
                              await updateSettingsTemplate('note', selectedNote.id, {
                                name: selectedNote.name,
                                content: selectedNote.content
                              })
                              toast.success('Notes layout saved to live database!')
                            } catch (err) {
                              toast.error('Failed to save notes layout to database')
                            }
                          }}
                          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                          className="rounded-xl font-bold h-10 text-xs px-6 border-none shadow-md cursor-pointer"
                        >
                          Save Notes Layout
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-bold">Select a template to edit</div>
                )}
              </div>
            </div>

            {/* Note Modal */}
            <Modal
              open={noteModalOpen}
              onCancel={() => setNoteModalOpen(false)}
              footer={null}
              destroyOnHidden
              width={420}
              title={<span className="font-bold text-slate-800 dark:text-slate-200">Create Note Template</span>}
            >
              <Form
                layout="vertical"
                onFinish={async (values) => {
                  try {
                    const res = await createSettingsTemplate({
                      type: 'note',
                      name: values.name,
                      content: ''
                    })
                    const newNote = res?.success && res.data ? res.data : {
                      id: `n_${Date.now()}`,
                      name: values.name,
                      content: '',
                    }
                    useClinicStore.setState((state) => ({
                      noteTemplates: [...state.noteTemplates, newNote],
                    }))
                    setSelectedNote(newNote)
                    setNoteModalOpen(false)
                    toast.success('Note template created in live database!')
                  } catch (err) {
                    toast.error('Failed to create note template')
                  }
                }}
                className="mt-4"
              >
                <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Initial Assessment Notes" />
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
              width={640}
              title={
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  Template Preview: {selectedNote?.name}
                </span>
              }
              className="dark:bg-[#111827] rounded-2xl"
            >
              <div className="mt-4 bg-[#0D1B2E] border border-[#1E3A5F] rounded-2xl overflow-hidden shadow-2xl">
                {/* Blue left accent bar + content area like the screenshot */}
                <div className="flex">
                  <div className="w-1 flex-shrink-0 bg-[#3B82F6] rounded-l-2xl" />
                  <div className="flex-1 p-5 whitespace-pre-wrap text-slate-200 text-xs font-sans leading-relaxed max-h-[60vh] overflow-y-auto">
                    {selectedNote?.content ? (
                      selectedNote.content.split(/(\{\{[^}]+\}\})/).map((part, i) => {
                        if (part.startsWith('{{') && part.endsWith('}}')) {
                          return (
                            <span
                              key={i}
                              className="text-[#60A5FA] font-bold bg-[#1E3A5F] px-2 py-0.5 rounded border border-[#3B82F6]/40 inline-block my-0.5 mx-0.5 text-xs"
                            >
                              {part}
                            </span>
                          )
                        }
                        return part
                      })
                    ) : (
                      <span className="text-slate-500 italic">No content available for preview...</span>
                    )}
                  </div>
                </div>
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
                    onFinish={async (values) => {
                      try {
                        const invoiceObj = {
                          logoUrl: store.invoiceTemplates.logoUrl,
                          paymentTerms: values.terms,
                          footerText: values.footer,
                        }
                        useClinicStore.setState({ invoiceTemplates: invoiceObj })

                        const currentFormValues = form.getFieldsValue()
                        await updateSuperAdminProfile({
                          profileData: {
                            ...currentFormValues,
                            invoiceTemplates: invoiceObj,
                            signature: signatureText,
                            providerNumbers,
                            services: selectedServices,
                            integrations
                          }
                        })
                        toast.success('Invoicing configurations saved to live database!')
                      } catch (err) {
                        toast.error('Failed to save invoicing layout')
                      }
                    }}
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
                                reader.onload = (readerEvent) => {
                                  const base64 = readerEvent.target.result
                                  useClinicStore.setState(state => ({
                                    invoiceTemplates: {
                                      ...state.invoiceTemplates,
                                      logoUrl: base64
                                    }
                                  }))
                                  toast.success('Clinic logo uploaded and saved!')
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
                            onClick={() => {
                              useClinicStore.setState(state => ({
                                invoiceTemplates: {
                                  ...state.invoiceTemplates,
                                  logoUrl: null
                                }
                              }))
                              toast.success('Logo removed successfully')
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

                    <div className="mb-6">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Funding Templates Enabled</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { type: 'Private Client Invoice', desc: 'Auto-applies standard service price.' },
                          { type: 'NDIS Invoice', desc: 'Adds line codes and nominee fields.' },
                          { type: 'DVA Invoice', desc: 'Formatted with Veteran file reference.' },
                          { type: 'WorkCover Invoice', desc: 'Includes Injury Case identifiers.' },
                        ].map((tpl) => (
                          <div key={tpl.type} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{tpl.type}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{tpl.desc}</span>
                            <div className="mt-2 text-right">
                              <Tag color="purple" className="m-0 text-[9px] border-none font-bold">Enabled</Tag>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Form.Item className="mb-0">
                      <button
                        type="submit"
                        className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer"
                      >
                        Save Invoice Layout
                      </button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            )}
          </div>
        )

      case 'services': {
        const displayServices = servicesList.length
          ? servicesList.filter((s) => !s.archived)
          : store.services.filter((s) => !s.archived)

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
                dataSource={displayServices}
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
                              invoiceDescription: record.description || '',
                              gst: record.taxable !== undefined ? record.taxable : false,
                            })
                            setServiceModalOpen(true)
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-[#8C4BFF] cursor-pointer"
                          title="Edit"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await apiUpdateService(record.id, { archived: true })
                              store.archiveService(record.id)
                              toast.success(`Service "${record.name}" archived!`)
                            } catch (err) {
                              console.error('Error archiving service:', err)
                              toast.error('Failed to archive service')
                            }
                          }}
                          className="bg-transparent border-none text-slate-400 hover:text-amber-500 cursor-pointer"
                          title="Archive"
                        >
                          <CloseCircleOutlined />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await apiDeleteService(record.id)
                              store.removeService(record.id)
                              toast.success(`Removed service: ${record.name}`)
                            } catch (err) {
                              console.error('Error deleting service:', err)
                              toast.error('Failed to delete service')
                            }
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
                onFinish={async (values) => {
                  try {
                    const payload = {
                      name: values.name,
                      duration: values.duration,
                      price: values.price,
                      ndisCode: values.ndisCode || '',
                      color: values.color || '#8C4BFF',
                      description: values.invoiceDescription || values.description || '',
                      taxable: Boolean(values.gst),
                    }
                    if (editingService) {
                      const res = await apiUpdateService(editingService.id, payload)
                      const updatedSvc = res?.data || { ...editingService, ...payload, id: editingService.id }
                      store.editService(updatedSvc)
                      setServicesList(prev => prev.map(s => s.id === editingService.id ? updatedSvc : s))
                      toast.success('Service details updated successfully in database!')
                    } else {
                      const res = await apiCreateService(payload)
                      const newSvc = res?.data || { ...payload, id: `s_${Date.now()}` }
                      store.addService(newSvc)
                      setServicesList(prev => [newSvc, ...prev])
                      toast.success('New service added to database!')
                    }
                    setServiceModalOpen(false)
                  } catch (err) {
                    console.error('Error saving service:', err)
                    toast.error(err.response?.data?.message || 'Failed to save service')
                  }
                }}
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
                  onPressEnter={async () => {
                    const text = cancellationText.trim() || 'Weather Issues'
                    try {
                      if (editingCancellation) {
                        const res = await apiUpdateCancellationReason(editingCancellation.id, { reason: text })
                        const upd = res.data || { ...editingCancellation, reason: text }
                        setCancellationReasonsList(prev => prev.map(r => r.id === editingCancellation.id ? upd : r))
                        store.editCancellationReason(editingCancellation.id, text)
                        toast.success('Reason modified & saved to DB!')
                        setEditingCancellation(null)
                      } else {
                        const res = await apiCreateCancellationReason({ reason: text })
                        const newObj = res.data || { id: Date.now().toString(), reason: text }
                        setCancellationReasonsList(prev => [newObj, ...prev])
                        store.addCancellationReason(text)
                        toast.success('Cancellation reason saved to DB!')
                      }
                      setCancellationText('')
                    } catch (err) {
                      toast.error('Failed to save cancellation reason')
                    }
                  }}
                  placeholder="e.g. Weather Issues"
                  className="rounded-xl h-10 flex-1"
                />
                <Button
                  onClick={async () => {
                    const text = cancellationText.trim() || 'Weather Issues'
                    try {
                      if (editingCancellation) {
                        const res = await apiUpdateCancellationReason(editingCancellation.id, { reason: text })
                        const upd = res.data || { ...editingCancellation, reason: text }
                        setCancellationReasonsList(prev => prev.map(r => r.id === editingCancellation.id ? upd : r))
                        store.editCancellationReason(editingCancellation.id, text)
                        toast.success('Reason modified & saved to DB!')
                        setEditingCancellation(null)
                      } else {
                        const res = await apiCreateCancellationReason({ reason: text })
                        const newObj = res.data || { id: Date.now().toString(), reason: text }
                        setCancellationReasonsList(prev => [newObj, ...prev])
                        store.addCancellationReason(text)
                        toast.success('Cancellation reason saved to DB!')
                      }
                      setCancellationText('')
                    } catch (err) {
                      toast.error('Failed to save cancellation reason')
                    }
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
                  dataSource={cancellationReasonsList.length ? cancellationReasonsList.filter((r) => !r.archived) : store.cancellationReasons.filter((r) => !r.archived)}
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
                            onClick={async () => {
                              try {
                                await apiDeleteCancellationReason(record.id)
                                setCancellationReasonsList(prev => prev.filter(r => r.id !== record.id))
                                store.archiveCancellationReason(record.id)
                                toast.success('Reason deleted from DB!')
                              } catch (err) {
                                toast.error('Failed to delete reason')
                              }
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
                  setActiveTagColorHex('#8C4BFF')
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

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <Table
                dataSource={clientTagsList.length ? clientTagsList : store.clientTags}
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
                            setActiveTagColorHex(record.color || '#8C4BFF')
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
                          onClick={async () => {
                            try {
                              await apiDeleteClientTag(record.id)
                              setClientTagsList(prev => prev.filter(t => t.id !== record.id))
                              store.deleteClientTag(record.id)
                              toast.success(`Removed tag: ${record.name}`)
                            } catch (err) {
                              toast.error('Failed to delete tag')
                            }
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

            {/* Tag Modal with Broad 24+ Color-Block Palette & Custom Color Picker */}
            <Modal
              open={tagModalOpen}
              onCancel={() => setTagModalOpen(false)}
              footer={null}
              destroyOnHidden
              width={520}
              title={
                <div className="flex items-center gap-2">
                  <TagOutlined style={{ color: activeTagColorHex }} />
                  <span className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    {editingTag ? 'Edit Client Tag' : 'Create New Client Tag'}
                  </span>
                </div>
              }
            >
              <Form
                layout="vertical"
                form={tagForm}
                onFinish={async (values) => {
                  try {
                    const payloadColor = activeTagColorHex || values.color || '#8C4BFF'
                    if (editingTag) {
                      const res = await apiUpdateClientTag(editingTag.id, { name: values.name, color: payloadColor, iconName: values.icon })
                      const updatedObj = res.data || { ...editingTag, ...values, color: payloadColor }
                      setClientTagsList(prev => prev.map(t => t.id === editingTag.id ? updatedObj : t))
                      store.editClientTag(updatedObj)
                      toast.success('Tag updated & saved to database!')
                    } else {
                      const res = await apiCreateClientTag({ name: values.name, color: payloadColor, iconName: values.icon })
                      const newObj = res.data || { id: Date.now().toString(), ...values, color: payloadColor }
                      setClientTagsList(prev => [newObj, ...prev])
                      store.addClientTag(newObj)
                      toast.success('New tag created & saved to DB!')
                    }
                    setTagModalOpen(false)
                  } catch (err) {
                    toast.error('Failed to save tag')
                  }
                }}
                className="mt-4 font-sans space-y-4"
              >
                <Form.Item
                  name="name"
                  label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tag Name / Identifier</span>}
                  rules={[{ required: true, message: 'Please enter a tag name' }]}
                >
                  <Input placeholder="e.g. Falls Risk, VIP, NDIS..." className="rounded-xl h-10" />
                </Form.Item>

                {/* Broad Color Palette Section */}
                <Form.Item
                  name="color"
                  label={
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Select Tag Color (24+ Curated Swatches & Custom Picker)
                      </span>
                      <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800" style={{ color: activeTagColorHex }}>
                        {activeTagColorHex}
                      </span>
                    </div>
                  }
                  rules={[{ required: true, message: 'Please select a color' }]}
                  initialValue={activeTagColorHex}
                >
                  <div className="space-y-3 pt-1">
                    {/* 24 Curated Color Blocks Grid */}
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      {TAG_COLOR_PALETTE.map((swatch) => {
                        const isSelected = activeTagColorHex?.toLowerCase() === swatch.hex.toLowerCase()
                        return (
                          <Tooltip key={swatch.hex} title={`${swatch.name} (${swatch.hex})`}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTagColorHex(swatch.hex)
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
                          value={activeTagColorHex || '#8C4BFF'}
                          onChange={(e) => {
                            setActiveTagColorHex(e.target.value)
                            tagForm.setFieldsValue({ color: e.target.value })
                          }}
                          className="w-7 h-7 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                        />
                        <Input
                          value={activeTagColorHex}
                          onChange={(e) => {
                            setActiveTagColorHex(e.target.value)
                            tagForm.setFieldsValue({ color: e.target.value })
                          }}
                          placeholder="#8C4BFF"
                          className="font-mono text-xs uppercase bg-transparent border-none p-0 focus:ring-0"
                        />
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: activeTagColorHex + '18',
                          borderColor: activeTagColorHex + '40',
                          color: activeTagColorHex
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTagColorHex }} />
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
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <DatabaseOutlined className="text-[#8C4BFF]" style={{ fontSize: 20 }} />
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
                  reader.onload = async (e) => {
                    try {
                      const text = e.target.result
                      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
                      if (lines.length <= 1) {
                        toast.error('The selected CSV file has no records!')
                        return
                      }
                      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
                      const nameColIdx = headers.findIndex(h => h.toLowerCase() === 'name')
                      if (nameColIdx === -1) {
                        const errorsList = [{ row: 1, field: 'headers', message: "CSV is missing the required 'name' column header." }]
                        try { await processDataImport({ target: importTarget, fileName: importFile.name, records: [], errors: errorsList }) } catch (apiErr) {}
                        store.addImportExportLog({ type: 'Import', fileName: importFile.name, target: importTarget === 'clients' ? 'Clients Register' : 'Contacts Directory', status: 'Failed', recordsProcessed: 0, errors: errorsList })
                        setSelectedErrors(errorsList)
                        setSelectedLogFileName(importFile.name)
                        setErrorModalOpen(true)
                        toast.error('Import failed: Missing name column header.')
                        setImportFile(null)
                        loadDataLogsFromBackend()
                        return
                      }
                      const errorsList = []
                      const parsedRecords = []
                      for (let i = 1; i < lines.length; i++) {
                        const rowValues = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
                        const record = {}
                        headers.forEach((h, idx) => { record[h.toLowerCase()] = rowValues[idx] || '' })
                        const rowNum = i + 1
                        if (!record['name']?.trim()) errorsList.push({ row: rowNum, field: 'name', message: 'Name is required' })
                        const emailVal = record['email'] ? record['email'].trim() : ''
                        if (emailVal && !emailVal.includes('@')) errorsList.push({ row: rowNum, field: 'email', message: 'Email address format is invalid: missing @ symbol' })
                        parsedRecords.push(record)
                      }
                      if (errorsList.length > 0) {
                        try { await processDataImport({ target: importTarget, fileName: importFile.name, records: [], errors: errorsList }) } catch (apiErr) {}
                        store.addImportExportLog({ type: 'Import', fileName: importFile.name, target: importTarget === 'clients' ? 'Clients Register' : 'Contacts Directory', status: 'Failed', recordsProcessed: 0, errors: errorsList })
                        setSelectedErrors(errorsList)
                        setSelectedLogFileName(importFile.name)
                        setErrorModalOpen(true)
                        toast.error('Import failed with validation errors. Please check the error report.')
                        setImportFile(null)
                        loadDataLogsFromBackend()
                        return
                      }
                      const importRes = await processDataImport({ target: importTarget, fileName: importFile.name, records: parsedRecords, errors: [] })
                      parsedRecords.forEach((record) => {
                        if (importTarget === 'clients') store.addPatient({ name: record.name, dob: record.dob || '1990-01-01', gender: record.gender || 'Other', email: record.email || '', phone: record.phone || '', primaryPractitioner: record.primarypractitioner || record.practitioner || 'Dr. Sarah Jenkins', status: record.status || 'active' })
                        else if (importTarget === 'contacts') store.addContact({ name: record.name, type: record.type || 'Other', company: record.company || '', email: record.email || '', mobileNumber: record.mobilenumber || record.phone || '' })
                        else if (importTarget === 'appointments') store.addAppointment({ id: `a_${Date.now()}_${Math.random()}`, patientName: record.patientname || record.patient || 'Unknown Client', patientId: 'N/A', practitionerName: record.practitionername || record.practitioner || 'Dr. Sarah Jenkins', practitionerId: '1', date: record.date || dayjs().format('YYYY-MM-DD'), time: record.time || '10:00', status: record.status || 'Active', appointmentType: record.appointmenttype || record.type || 'Consultation' })
                        else if (importTarget === 'invoices') store.addInvoice({ id: `INV-${Date.now()}`, patientName: record.patientname || record.clientname || 'Unknown Client', practitioner: record.practitioner || 'Dr. Sarah Jenkins', issueDate: record.issuedate || dayjs().format('YYYY-MM-DD'), dueDate: record.duedate || dayjs().add(14, 'day').format('YYYY-MM-DD'), amount: parseFloat(record.amount) || 150, due: parseFloat(record.due) || 150, status: record.status || 'Draft', sentStatus: record.sentstatus || 'Not Sent' })
                        else if (importTarget === 'services') store.addService({ id: `s_${Date.now()}_${Math.random()}`, name: record.name || 'New Service', duration: parseInt(record.duration) || 60, price: parseFloat(record.price) || 150, ndisCode: record.ndiscode || record.ndis || '', color: record.color || '#8C4BFF', archived: false, gst: record.gst === 'true' || record.gst === '1' })
                      })
                      toast.success(importRes?.message || `Successfully imported ${parsedRecords.length} records into the live database!`)
                      setImportFile(null)
                      loadDataLogsFromBackend()
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to process CSV import in live database!')
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
                  onFinish={async (values) => {
                    const target = values.target || 'clients'
                    const format = values.format || 'csv'
                    try {
                      const res = await logDataExport({ target, format })
                      const dataToExport = res?.data || []
                      const fileName = res?.fileName || `${target}_export_${Date.now()}.${format}`

                      let headers = ['id', 'name', 'dob', 'gender', 'email', 'phone', 'status']
                      if (target === 'appointments') {
                        headers = ['id', 'patientName', 'practitionerName', 'date', 'startTime', 'status', 'serviceName']
                      } else if (target === 'invoices' || target === 'financial') {
                        headers = ['id', 'invoiceNumber', 'patientName', 'issueDate', 'dueDate', 'amount', 'due', 'status']
                      } else if (target === 'services') {
                        headers = ['id', 'name', 'duration', 'price', 'ndisCode', 'taxable']
                      }

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
                        toast.success(`Successfully exported ${dataToExport.length} live records to ${fileName}!`)
                      } else {
                        toast.success(`Exporting ${target} details as ${format.toUpperCase()} (${dataToExport.length} records)!`)
                      }

                      loadDataLogsFromBackend()
                    } catch (err) {
                      toast.error('Failed to generate export from live database!')
                      console.error(err)
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">Activity History Logs</h3>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">
                    Complete registry of database import and export actions executed on the platform.
                  </p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search logs..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={logSearchQuery}
                    onChange={(e) => {
                      const val = e.target.value
                      setLogSearchQuery(val)
                      loadDataLogsFromBackend({ search: val })
                    }}
                    style={{ width: 180 }}
                    allowClear
                  />
                  <Select
                    value={logTypeFilter}
                    onChange={(val) => {
                      setLogTypeFilter(val)
                      loadDataLogsFromBackend({ type: val })
                    }}
                    style={{ width: 120 }}
                  >
                    <Option value="all">All Types</Option>
                    <Option value="Import">Import</Option>
                    <Option value="Export">Export</Option>
                  </Select>

                  <Select
                    value={logStatusFilter}
                    onChange={(val) => {
                      setLogStatusFilter(val)
                      loadDataLogsFromBackend({ status: val })
                    }}
                    style={{ width: 120 }}
                  >
                    <Option value="all">All Status</Option>
                    <Option value="Success">Success</Option>
                    <Option value="Failed">Failed</Option>
                  </Select>

                  {(logTypeFilter !== 'all' || logStatusFilter !== 'all' || logSearchQuery) && (
                    <Button
                      type="text"
                      className="text-xs font-bold text-slate-500 hover:text-purple-600"
                      onClick={() => {
                        setLogTypeFilter('all')
                        setLogStatusFilter('all')
                        setLogSearchQuery('')
                        loadDataLogsFromBackend({ type: 'all', status: 'all', search: '' })
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <Table
                dataSource={dataLogsList.length > 0 ? dataLogsList : store.importExportLogs}
                loading={loadingDataLogs}
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
                      return <span className="text-slate-400 text-xs font-semibold">—</span>
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
                        onChange={async (e) => {
                          const newMethod = e.target.value
                          setTfaMethod(newMethod)
                          try {
                            const currentFormValues = form.getFieldsValue()
                            await updateSuperAdminProfile({
                              profileData: {
                                ...currentFormValues,
                                twoFactorEnabled: tfaEnabled,
                                tfaMethod: newMethod,
                                signature: signatureText,
                                providerNumbers,
                                services: selectedServices,
                                integrations
                              }
                            })
                            toast.success(`2FA verification method updated to ${newMethod.toUpperCase()} & saved to database!`)
                          } catch (err) {
                            toast.error('Failed to update 2FA verification method')
                          }
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
                        onClick={async () => {
                          const nextVal = !tfaEnabled
                          setTfaEnabled(nextVal)
                          try {
                            const currentFormValues = form.getFieldsValue()
                            await updateSuperAdminProfile({
                              profileData: {
                                ...currentFormValues,
                                twoFactorEnabled: nextVal,
                                tfaMethod,
                                signature: signatureText,
                                providerNumbers,
                                services: selectedServices,
                                integrations
                              }
                            })
                            toast.success(`2FA turned ${nextVal ? 'ON' : 'OFF'} & saved to live database!`)
                          } catch (err) {
                            toast.error('Failed to update 2FA status in database')
                          }
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
                  onFinish={async (values) => {
                    const curPass = values.oldPass || values.currentPassword
                    const newPass = values.newPass || values.newPassword
                    if (!curPass || !newPass) {
                      return toast.error('Current password and new password are required')
                    }
                    if (newPass.length < 6) {
                      return toast.error('New password must be at least 6 characters long')
                    }
                    try {
                      await changeSuperAdminPassword({ currentPassword: curPass, newPassword: newPass })
                      toast.success('Your secure password updated & saved to live database!')
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to update password in live database')
                    }
                  }}
                  className="space-y-3"
                >
                  <Form.Item name="oldPass" label="Current Password" rules={[{ required: true, message: 'Please enter current password' }]}>
                    <Input.Password className="rounded-xl h-9 text-xs" />
                  </Form.Item>
                  <Form.Item name="newPass" label="New Secure Password" rules={[{ required: true, message: 'Please enter new secure password' }]}>
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-slate-50 dark:border-slate-800 gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 m-0">
                    Login History & Connected Devices
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">
                    Real-time database session logs and active login locations on the platform.
                  </p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search devices / IP..."
                    prefix={<SearchOutlined className="text-slate-400" />}
                    value={securitySearchQuery}
                    onChange={(e) => {
                      const val = e.target.value
                      setSecuritySearchQuery(val)
                      loadSecurityLogsFromBackend({ search: val })
                    }}
                    style={{ width: 190 }}
                    allowClear
                  />

                  <Select
                    value={securityStatusFilter}
                    onChange={(val) => {
                      setSecurityStatusFilter(val)
                      loadSecurityLogsFromBackend({ status: val })
                    }}
                    style={{ width: 140 }}
                  >
                    <Option value="all">All Status</Option>
                    <Option value="Active Session">Active Session</Option>
                    <Option value="Expired">Expired</Option>
                    <Option value="Revoked">Revoked</Option>
                  </Select>

                  {(securityStatusFilter !== 'all' || securitySearchQuery) && (
                    <Button
                      type="text"
                      className="text-xs font-bold text-slate-500 hover:text-purple-600"
                      onClick={() => {
                        setSecurityStatusFilter('all')
                        setSecuritySearchQuery('')
                        loadSecurityLogsFromBackend({ status: 'all', search: '' })
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <Table
                dataSource={trustedDevices.length > 0 ? trustedDevices : loginHistoryList}
                loading={loadingSecurityLogs}
                rowKey={(r) => r.key || r.id}
                pagination={{ pageSize: 5 }}
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
                    dataIndex: 'date',
                    render: (text, record) => <span className="text-xs text-slate-500">{text || record.time}</span>,
                  },
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>,
                    dataIndex: 'location',
                    render: (text) => <span className="text-xs text-slate-500 font-medium">{text}</span>,
                  },
                  {
                    title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
                    dataIndex: 'status',
                    render: (status) => (
                      <Tag color={status?.includes('Active') ? 'purple' : status === 'Revoked' ? 'error' : 'default'} className="rounded-full border-none font-bold text-[9px] uppercase px-2.5">
                        {status}
                      </Tag>
                    ),
                  },
                  {
                    title: '',
                    key: 'actions',
                    align: 'right',
                    render: (_, record) => {
                      if (record.status === 'Revoked') {
                        return <span className="text-slate-400 text-xs font-semibold">Revoked</span>
                      }
                      return (
                        <Button
                          size="small"
                          danger
                          onClick={async () => {
                            try {
                              await revokeDeviceSession(record.key || record.id)
                              toast.success('Device session revoked in live database!')
                              loadSecurityLogsFromBackend()
                            } catch (err) {
                              toast.error('Failed to revoke device session')
                            }
                          }}
                          className="rounded-lg text-[10px] font-bold"
                        >
                          Revoke
                        </Button>
                      )
                    },
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
    isPatient ? <PatientSettings /> :
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

    </div>
  )
}
