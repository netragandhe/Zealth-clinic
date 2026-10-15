import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Tooltip, Modal, Form, Input, Select, Space, Upload, Button, Divider, DatePicker, TimePicker, Slider, Checkbox } from 'antd'
import {
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  MenuOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  ApartmentOutlined,
  TeamOutlined,
  DashboardOutlined,
  CalendarOutlined,
  ContactsOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  PieChartOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  LineChartOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
  SwapOutlined,
  UsergroupAddOutlined,
  HeartOutlined,
  EditOutlined,
  HomeOutlined,
  FolderOutlined,
  BranchesOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  SunOutlined,
  MoonOutlined,
  MailOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  MessageFilled,
  MessageOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import logoImg from '../assets/logo2.png'
import { useClinicStore } from '../store/clinicStore'
import api from '../api/axios'
import FloatingChatDrawer from '../features/chat/components/FloatingChatDrawer'

import { Brain } from 'lucide-react'

const { Option } = Select
const { Dragger } = Upload

const getNavItemIcon = (label) => {
  switch (label) {
    case 'Live Chat':
    case 'Messages':
      return <MailOutlined style={{ fontSize: 16 }} />
    case 'Notification':
    case 'Notifications':
      return <BellOutlined style={{ fontSize: 16 }} />
    case 'Dashboard':
      return <DashboardOutlined style={{ fontSize: 16 }} />
    case 'Calendar':
    case 'My Calendar':
    case 'Appointments':
      return <CalendarOutlined style={{ fontSize: 16 }} />
    case 'Clients':
    case 'My Patients':
      return <TeamOutlined style={{ fontSize: 16 }} />
    case 'Consultations':
      return <ClockCircleOutlined style={{ fontSize: 16 }} />
    case 'Notes & Reports':
      return <FileTextOutlined style={{ fontSize: 16 }} />
    case 'Exercises & Treatment Plans':
      return <HeartOutlined style={{ fontSize: 16 }} />
    case 'Referrals':
      return <BranchesOutlined style={{ fontSize: 16 }} />
    case 'Contacts':
      return <ContactsOutlined style={{ fontSize: 16 }} />
    case 'Waitlist':
      return <ClockCircleOutlined style={{ fontSize: 16 }} />
    case 'Invoices':
    case 'Payments':
    case 'Billing':
    case 'Billing & Revenue':
    case 'Revenue & Billing':
    case 'Sales Revenue':
      return <DollarOutlined style={{ fontSize: 16 }} />
    case 'Reports':
    case 'Reports & Analytics':
      return <PieChartOutlined style={{ fontSize: 16 }} />
    case 'Documents':
    case 'My Documents':
      return <FolderOpenOutlined style={{ fontSize: 16 }} />
    case 'Settings':
    case 'Profile Settings':
      return <SettingOutlined style={{ fontSize: 16 }} />
    case 'Clinics':
    case 'Clinics Manage':
      return <ApartmentOutlined style={{ fontSize: 16 }} />
    case 'Subscriptions':
      return <CreditCardOutlined style={{ fontSize: 16 }} />
    case 'AI Settings':
    case 'AI Notes':
    case 'AI Management':
      return <ThunderboltOutlined style={{ fontSize: 16 }} />
    case 'Global Templates':
      return <FileTextOutlined style={{ fontSize: 16 }} />
    case 'User Console':
    case 'Users':
      return <TeamOutlined style={{ fontSize: 16 }} />
    case 'Admin':
    case 'Admin Management':
      return <KeyOutlined style={{ fontSize: 16 }} />
    case 'Audit Logs':
    case 'Compliance':
    case 'Compliance & Audit':
      return <SafetyCertificateOutlined style={{ fontSize: 16 }} />
    case 'Platform Analytics':
      return <LineChartOutlined style={{ fontSize: 16 }} />
    case 'Leads':
      return <UserAddOutlined style={{ fontSize: 16 }} />
    case 'Pipeline':
    case 'Sales':
    case 'Sales & Affiliates':
      return <BranchesOutlined style={{ fontSize: 16 }} />
    case 'Demos':
      return <InfoCircleOutlined style={{ fontSize: 16 }} />
    case 'Support':
    case 'Support Centre':
      return <InfoCircleOutlined style={{ fontSize: 16 }} />
    case 'Trials':
      return <ExperimentOutlined style={{ fontSize: 16 }} />
    case 'Quotes':
      return <FileDoneOutlined style={{ fontSize: 16 }} />
    case 'Conversions':
      return <SwapOutlined style={{ fontSize: 16 }} />
    case 'Onboarding':
      return <UsergroupAddOutlined style={{ fontSize: 16 }} />
    case 'Exercises':
    case 'My Exercises':
      return <HeartOutlined style={{ fontSize: 16 }} />
    case 'Notes Review':
      return <EditOutlined style={{ fontSize: 16 }} />
    case 'Commissions':
      return <CreditCardOutlined style={{ fontSize: 16 }} />
    case 'Tasks':
      return <FileDoneOutlined style={{ fontSize: 16 }} />
    case 'My Care Team':
      return <TeamOutlined style={{ fontSize: 16 }} />
    case 'Treatment Plans':
      return <HeartOutlined style={{ fontSize: 16 }} />
    case 'Progress & Outcomes':
      return <LineChartOutlined style={{ fontSize: 16 }} />
    case 'Forms & Documents':
      return <FolderOpenOutlined style={{ fontSize: 16 }} />
    case 'Funding & Claims':
      return <DollarOutlined style={{ fontSize: 16 }} />
    case 'Invoices & Payments':
      return <CreditCardOutlined style={{ fontSize: 16 }} />
    case 'Health Record Sharing':
      return <SwapOutlined style={{ fontSize: 16 }} />
    case 'Profile & Settings':
      return <SettingOutlined style={{ fontSize: 16 }} />
    case 'Products':
      return <ShoppingOutlined style={{ fontSize: 16 }} />
    default:
      return <HomeOutlined style={{ fontSize: 16 }} />
  }
}

const getSettingsDropdownItems = (role) => {
  switch (role) {
    case 'head_admin':
      return [
        { key: 'branch', label: 'Branch', icon: <ApartmentOutlined style={{ fontSize: 14 }} />, path: '/head-admin/branch' },
        { key: 'admin', label: 'Admin', icon: <UserOutlined style={{ fontSize: 14 }} />, path: '/head-admin/admin-management' },
        { key: 'practitioners', label: 'Practitioners', icon: <UserAddOutlined style={{ fontSize: 14 }} />, path: '/head-admin/practitioners' },
      ]
    case 'clinic':
      return [
        { key: 'branch', label: 'Branch', icon: <ApartmentOutlined style={{ fontSize: 14 }} />, path: '/head-admin/branch' },
        { key: 'admin', label: 'Admin', icon: <UserOutlined style={{ fontSize: 14 }} />, path: '/clinic-admin/admin' },
        { key: 'practitioners', label: 'Practitioners', icon: <UserAddOutlined style={{ fontSize: 14 }} />, path: '/clinic-admin/practitioners' },
      ]
    case 'sales':
      return []
    case 'patient':
      return []
    case 'practitioner':
      return []
    default:
      return []
  }
}

const getNavItems = (role) => {
  switch (role) {
    case 'head_admin':
      return [
        { label: 'Dashboard', path: '/head-admin/dashboard' },
        { label: 'Clinics', path: '/head-admin/clinics-manage' },
        { label: 'Users', path: '/head-admin/users' },
        { label: 'Admin', path: '/head-admin/admin-management' },
        { label: 'Subscriptions', path: '/head-admin/subscriptions' },
        { label: 'Billing', path: '/head-admin/billing' },
        { label: 'Sales', path: '/head-admin/sales-affiliates' },
        { label: 'AI Notes', path: '/head-admin/ai-notes' },
        { label: 'Global Templates', path: '/head-admin/global-templates' },
        { label: 'Compliance', path: '/head-admin/audit-logs' },
        { label: 'Support', path: '/head-admin/support-centre' },
        { label: 'Reports', path: '/head-admin/platform-analytics' },
      ]
    case 'sales':
      return [
        { label: 'Dashboard', path: '/sales/dashboard' },
        { label: 'Leads', path: '/sales/leads' },
        { label: 'Pipeline', path: '/sales/pipeline' },
        { label: 'Calendar', path: '/sales/calendar' },
        { label: 'Clinics', path: '/sales/sales-clinics' },
        { label: 'Commissions', path: '/sales/commissions' },
        { label: 'Tasks', path: '/sales/tasks' },
        { label: 'Reports', path: '/sales/sales-reports' },
        { label: 'Settings', path: '/sales/settings' },
      ]
    case 'practitioner':
      return [
        { label: 'Dashboard', path: '/practitioner/dashboard' },
        { label: 'Calendar', path: '/practitioner/calendar' },
        { label: 'Clients', path: '/practitioner/patients' },
        { label: 'Contacts', path: '/practitioner/contacts' },
        { label: 'Waitlist', path: '/practitioner/waitlist' },
        { label: 'Products', path: '/practitioner/products' },
        { label: 'Reports', path: '/practitioner/reports' },
        { label: 'Documents', path: '/practitioner/documents' },
      ]
    case 'patient':
      return [
        { label: 'Dashboard', path: '/patient/dashboard' },
        { label: 'Appointments', path: '/patient/calendar' },
        { label: 'My Care Team', path: '/patient/care-team' },
        { label: 'Treatment Plans', path: '/patient/treatment-plans' },
        { label: 'Progress & Outcomes', path: '/patient/progress' },
        { label: 'Forms & Documents', path: '/patient/forms-documents' },
        { label: 'Funding & Claims', path: '/patient/funding' },
        { label: 'Invoices & Payments', path: '/patient/payments' },
        { label: 'Profile & Settings', path: '/patient/settings' },
      ]
    case 'clinic':
    default:
      return [
        { label: 'Dashboard', path: '/clinic-admin/dashboard' },
        { label: 'Calendar', path: '/clinic-admin/calendar' },
        { label: 'Details', path: '/clinic-admin/details' },
        { label: 'Clients', path: '/clinic-admin/patients' },
        { label: 'Contacts', path: '/clinic-admin/contacts' },
        { label: 'Waitlist', path: '/clinic-admin/waitlist' },
        { label: 'Invoices', path: '/clinic-admin/invoices' },
        { label: 'Payments', path: '/clinic-admin/payments-centre' },
        { label: 'Products', path: '/clinic-admin/products' },
        { label: 'Reports', path: '/clinic-admin/reports' },
        { label: 'Documents', path: '/clinic-admin/documents' },
      ]
  }
}

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const navRef = React.useRef(null)

  const handleWheel = (e) => {
    if (navRef.current) {
      navRef.current.scrollLeft += e.deltaY;
    }
  }

  // Practitioner Modals
  const [newConsultationModalOpen, setNewConsultationModalOpen] = useState(false)
  const [newConsultationForm] = Form.useForm()

  const store = useClinicStore()
  const userRole = store.userRole
  const darkMode = store.darkMode
  const toggleDarkMode = store.toggleDarkMode
  const navItems = getNavItems(userRole)

  const storedRole = localStorage.getItem('userRole') || userRole || 'clinic'
  const activeRole = userRole || storedRole
  const rolePrefix = (activeRole === 'head_admin' || activeRole === 'super_admin' || activeRole === 'super-admin')
    ? 'head-admin'
    : activeRole === 'clinic'
      ? 'clinic-admin'
      : activeRole;

  const [notificationsList, setNotificationsList] = useState([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications')
      if (data && data.success && Array.isArray(data.data)) {
        setNotificationsList(data.data)
      }
    } catch (error) {
      // Suppress unhandled logging if route is offline
    }
  }

  const fetchUnreadChat = async () => {
    try {
      const res = await api.get('/api/chat/contacts')
      if (res.data?.success && Array.isArray(res.data.data)) {
        const totalUnread = res.data.data.reduce((acc, c) => acc + (Number(c.unreadCount) || 0), 0)
        setUnreadChatCount(totalUnread)
      }
    } catch (error) {
      // Suppress unhandled logging if route is offline
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchUnreadChat()
    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadChat()
    }, 30000)
    
    const handleCustomRefetch = () => {
      fetchNotifications()
      fetchUnreadChat()
    }
    window.addEventListener('notification:refetch', handleCustomRefetch)
    window.addEventListener('chat:refetch', handleCustomRefetch)

    return () => {
      clearInterval(interval)
      window.removeEventListener('notification:refetch', handleCustomRefetch)
      window.removeEventListener('chat:refetch', handleCustomRefetch)
    }
  }, [userRole])

  const getHeaderTitle = () => {
    const path = location.pathname
    if (path.includes('/notifications')) return 'Notifications'
    if (path.includes('/messages') || path.includes('/live-chat')) return 'Messages'

    const activeItem = navItems.find(item => isActive(item))
    if (activeItem) return activeItem.label

    // Fallback for settings or specific subpages
    if (path.includes('/branch')) return 'Branch Settings'
    if (path.includes('/admin')) return 'Admin Management'
    if (path.includes('/practitioners')) return 'Practitioners'
    if (path.includes('/subscription')) return 'Subscription'
    if (path.includes('/ai-notes')) return 'AI Management'
    if (path.includes('/tenants')) return 'Tenants'
    if (path.includes('/payment-terms')) return 'Payment Terms'
    if (path.includes('/templates')) return 'Templates'
    if (path.includes('/payments-centre')) return 'Payments'
    if (path.includes('/products')) return 'Products'

    return 'Clinic Management'
  }

  const [leadForm] = Form.useForm()
  const [demoForm] = Form.useForm()
  const [taskForm] = Form.useForm()
  const [convertForm] = Form.useForm()

  React.useEffect(() => {
    store.fetchAppointments()
    if (userRole === 'sales' || userRole === 'head_admin') {
      store.fetchLeads()
    }
  }, [userRole])

  // Quote generator states inside Send Proposal modal
  const [proposalLeadId, setProposalLeadId] = useState(null)
  const [proposalDrs, setProposalDrs] = useState(3)
  const [proposalHasAi, setProposalHasAi] = useState(true)
  const [proposalPromo, setProposalPromo] = useState('')

  const basePrice = proposalDrs * 30
  const aiPrice = proposalHasAi ? proposalDrs * 15 : 0
  const subtotal = basePrice + aiPrice
  const discount = proposalPromo.toUpperCase() === 'ALLIED20' ? subtotal * 0.20 : 0
  const totalProposalPrice = subtotal - discount

  const handleCreateLead = async (values) => {
    await store.addLead({
      name: values.name,
      contactPerson: values.contactPerson,
      contact: values.contact,
      email: values.email,
      location: values.location,
      practitioners: parseInt(values.practitioners) || 1,
      value: parseFloat(values.value) || 0,
      stage: values.stage || 'New Lead',
      source: values.source || 'Web Form',
      notes: values.notes || ''
    })
    toast.success(`Lead ${values.name} registered successfully!`)
    store.setSalesLeadModalOpen(false)
    leadForm.resetFields()
  }

  const handleBookDemo = (values) => {
    const newEvt = {
      title: `${values.type}: ${values.clinic}`,
      date: values.date.format('YYYY-MM-DD'),
      time: values.time.format('HH:mm'),
      clinic: values.clinic,
      contact: values.contact,
      type: values.type,
      stage: values.stage || 'Demo Scheduled',
      notes: values.notes || ''
    }
    store.addSalesCalendarEvent(newEvt)

    const matchedLead = store.leads.find(l => l.name.toLowerCase() === values.clinic.toLowerCase())
    if (matchedLead) {
      store.moveLeadStage(matchedLead.id, 'Demo Scheduled')
      store.addLeadActivity(matchedLead.id, `Booked demo/meeting: ${values.type}`)
    }

    toast.success(`Successfully booked ${values.type} for ${values.clinic}`)
    store.setSalesDemoModalOpen(false)
    demoForm.resetFields()
  }

  const handleAddTask = (values) => {
    store.addSalesTask({
      title: values.title,
      category: values.category || 'Calls',
      leadName: values.leadName,
      contactPerson: values.contactPerson || '',
      phone: values.phone || '',
      priority: values.priority || 'Medium',
      dueDate: values.dueDate ? values.dueDate.format('D MMM YYYY') : 'Today'
    })
    toast.success('Task created successfully!')
    store.setSalesTaskModalOpen(false)
    taskForm.resetFields()
  }

  const handleSendProposalSubmit = async () => {
    if (!proposalLeadId) {
      toast.error('Please select a lead clinic first.')
      return
    }
    const matchedLead = store.leads.find(l => l.id === proposalLeadId)
    if (matchedLead) {
      // 1. Update the overall lead details (value)
      await store.updateLead({
        ...matchedLead,
        value: totalProposalPrice
      })
      
      // 2. Move stage sequentially
      await store.moveLeadStage(matchedLead.id, 'Proposal Sent')
      
      // 3. Log activity sequentially
      await store.addLeadActivity(
        matchedLead.id, 
        `Sent pricing proposal: $${totalProposalPrice.toFixed(2)}/mo (${proposalDrs} practitioners, AI note add-on: ${proposalHasAi ? 'YES' : 'NO'})`
      )
      
      toast.success(`Proposal sent to ${matchedLead.name}!`)
      store.setSalesProposalModalOpen(false)
      setProposalLeadId(null)
      setProposalPromo('')
    }
  }

  const handleConvertClinicSubmit = async (values) => {
    const leadId = store.salesSelectedLeadId || values.leadId
    if (!leadId) {
      toast.error('Please select a lead clinic to convert.')
      return
    }
    const lead = store.leads.find(l => l.id === leadId)
    if (!lead) return

    const res = await store.convertLeadToClinic(leadId, values.tier || 'Basic', parseFloat(values.value) || lead.value || 100, 'Colin Edegbe')
    if (res && res.success) {
      toast.success(`Clinic ${lead.name} successfully converted!`)
      store.setSalesConvertModalOpen(false)
      store.setSalesSelectedLeadId(null)
      convertForm.resetFields()

      if (res.data && res.data.defaultPassword && lead.email) {
        Modal.success({
          title: '🎉 Clinic Successfully Converted!',
          width: 550,
          content: (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-4 text-sm">
                Login credentials have been automatically generated for the clinic admin. Please share these with the client so they can access their new dashboard.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-xs text-slate-500 font-bold">Login URL:</span>
                  <span className="text-xs font-mono text-[#8C4BFF] cursor-pointer" onClick={() => {navigator.clipboard.writeText('https://zhealthos.com/login'); toast.success('URL copied!')}}>https://zhealthos.com/login</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-xs text-slate-500 font-bold">Admin Email ID:</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-white cursor-pointer" onClick={() => {navigator.clipboard.writeText(lead.email); toast.success('Email copied!')}}>{lead.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">Temporary Password:</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer" onClick={() => {navigator.clipboard.writeText(res.data.defaultPassword); toast.success('Password copied!')}}>{res.data.defaultPassword}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 italic">
                * The clinic admin can reset this password anytime from their profile settings.
              </p>
            </div>
          ),
          okText: 'Done',
          okButtonProps: { style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', borderRadius: '8px' } }
        })
      }
    }
  }

  const renderSalesActionsBar = () => {
    return null
  }

  const renderPractitionerActionsBar = () => {
    return null
  }

  const renderPractitionerModals = () => {
    if (userRole !== 'practitioner') return null
    return (
      <Modal
        open={newConsultationModalOpen}
        onCancel={() => setNewConsultationModalOpen(false)}
        title={<span className="font-bold text-slate-800 dark:text-white text-base">Start New Consultation</span>}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={newConsultationForm}
          layout="vertical"
          onFinish={(values) => {
            setNewConsultationModalOpen(false);
            newConsultationForm.resetFields();
            navigate(`/practitioner/consultations?new=true&patient=${values.patient}&type=${values.type}`);
            toast.success(`Starting ${values.type} consultation for ${values.patient}`);
          }}
          className="pt-4"
        >
          <Form.Item name="patient" label={<span className="font-semibold text-xs text-slate-500 uppercase">Select Patient *</span>} rules={[{ required: true, message: 'Please select a patient' }]}>
            <Select
              showSearch
              placeholder="Search by name or ID"
              className="rounded-xl"
              size="large"
              options={[
                { value: 'John Miller', label: 'John Miller (ID: #1204)' },
                { value: 'Sarah Jenkins', label: 'Sarah Jenkins (ID: #1205)' },
                { value: 'Colin Edegbe', label: 'Colin Edegbe (ID: #1206)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="type" label={<span className="font-semibold text-xs text-slate-500 uppercase">Consultation Type *</span>} rules={[{ required: true, message: 'Please select consultation type' }]}>
            <Select
              placeholder="Select Type"
              className="rounded-xl"
              size="large"
              options={[
                { value: 'Initial Assessment', label: 'Initial Assessment' },
                { value: 'Standard Follow-up', label: 'Standard Follow-up' },
                { value: 'Extended Review', label: 'Extended Review' },
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setNewConsultationModalOpen(false)} className="rounded-xl font-semibold">Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] border-none hover:bg-[#8C4BFF]/90 rounded-xl font-semibold">Start Consultation</Button>
          </div>
        </Form>
      </Modal>
    )
  }

  const renderPatientActionsBar = () => {
    return null;
  }

  const renderSalesModals = () => {
    if (userRole !== 'sales') return null
    return (
      <>
        {/* + New Lead Modal */}
        <Modal
          open={store.salesLeadModalOpen}
          onCancel={() => store.setSalesLeadModalOpen(false)}
          title={<span className="font-bold text-slate-800 dark:text-white text-base">Register New Sales Lead</span>}
          footer={null}
          destroyOnHidden
        >
          <Form form={leadForm} layout="vertical" onFinish={handleCreateLead} initialValues={{ stage: 'New Lead', source: 'Web Form', practitioners: 1 }}>
            <Form.Item name="name" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Clinic Name *</span>} rules={[{ required: true }]}>
              <Input placeholder="e.g. Melbourne Physiotherapy" className="rounded-xl h-10" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="contactPerson" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Contact Person *</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. James Bradley" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="contact" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Phone Number *</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. +61 411 992 812" className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="email" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Email Address *</span>} rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="e.g. contact@melbphysio.com" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="location" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Location / City *</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Melbourne" className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item name="practitioners" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Practitioners *</span>} rules={[{ required: true }]}>
                <Input type="number" min={1} className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="value" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Est Value ($/mo) *</span>} rules={[{ required: true }]}>
                <Input type="number" min={0} className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="source" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Lead Source *</span>} rules={[{ required: true }]}>
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Web Form">Web Form</Option>
                  <Option value="Direct Call">Direct Call</Option>
                  <Option value="LinkedIn Inbound">LinkedIn Inbound</Option>
                  <Option value="Email Outbound">Email Outbound</Option>
                  <Option value="Referral">Referral</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="notes" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Prospect Notes</span>}>
              <Input.TextArea placeholder="Enter client priorities, treatment focus..." rows={3} className="rounded-xl" />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => store.setSalesLeadModalOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs text-white">Register Lead</Button>
            </div>
          </Form>
        </Modal>

        {/* + Book Demo Modal */}
        <Modal
          open={store.salesDemoModalOpen}
          onCancel={() => store.setSalesDemoModalOpen(false)}
          title={<span className="font-bold text-slate-800 dark:text-white text-base">Schedule Product Demo</span>}
          footer={null}
          destroyOnHidden
        >
          <Form form={demoForm} layout="vertical" onFinish={handleBookDemo} initialValues={{ type: 'Demos', stage: 'Demo Scheduled' }}>
            <Form.Item name="clinic" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Clinic Lead / Client *</span>} rules={[{ required: true }]}>
              <Select showSearch placeholder="Select lead clinic" optionFilterProp="children" className="rounded-xl">
                {(store.leads || []).map(l => (
                  <Option key={l.id} value={l.name}>{l.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="contact" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Contact Person *</span>} rules={[{ required: true }]}>
              <Input placeholder="e.g. James Bradley" className="rounded-xl h-10" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="date" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Date *</span>} rules={[{ required: true }]}>
                <DatePicker className="w-full rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="time" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Time *</span>} rules={[{ required: true }]}>
                <TimePicker format="HH:mm" className="w-full rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="type" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Meeting Type *</span>} rules={[{ required: true }]}>
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Demos">Demo</Option>
                  <Option value="Follow-up calls">Follow-up Call</Option>
                  <Option value="Onboarding meetings">Onboarding Meeting</Option>
                  <Option value="Renewal discussions">Renewal Discussion</Option>
                </Select>
              </Form.Item>
              <Form.Item name="stage" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Sales Stage *</span>} rules={[{ required: true }]}>
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Discovery Call">Discovery Call</Option>
                  <Option value="Demo Scheduled">Demo Scheduled</Option>
                  <Option value="Proposal Sent">Proposal Sent</Option>
                  <Option value="Trial Started">Trial Started</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="notes" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Meeting Objectives</span>}>
              <Input.TextArea placeholder="Enter demo details..." rows={3} className="rounded-xl" />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => store.setSalesDemoModalOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs text-white">Schedule Demo</Button>
            </div>
          </Form>
        </Modal>

        {/* + Add Task Modal */}
        <Modal
          open={store.salesTaskModalOpen}
          onCancel={() => store.setSalesTaskModalOpen(false)}
          title={<span className="font-bold text-slate-800 dark:text-white text-base">Create Follow-up Reminder Task</span>}
          footer={null}
          destroyOnHidden
        >
          <Form form={taskForm} layout="vertical" onFinish={handleAddTask} initialValues={{ category: 'Calls', priority: 'Medium' }}>
            <Form.Item name="title" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Task Title / Activity *</span>} rules={[{ required: true }]}>
              <Input placeholder="e.g. Call James regarding NDIS guidelines" className="rounded-xl h-10" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="category" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Category *</span>} rules={[{ required: true }]}>
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Calls">Call Lead</Option>
                  <Option value="Follow-ups">Follow-up</Option>
                  <Option value="Demos">Demo prep</Option>
                  <Option value="Renewal reminders">Renewal reminder</Option>
                </Select>
              </Form.Item>
              <Form.Item name="priority" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Priority *</span>} rules={[{ required: true }]}>
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="leadName" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Clinic Lead *</span>} rules={[{ required: true }]}>
                <Select placeholder="Select lead clinic" className="rounded-xl h-10 flex items-center">
                  {(store.leads || []).map(l => (
                    <Option key={l.id} value={l.name}>{l.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="dueDate" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Due Date *</span>} rules={[{ required: true }]}>
                <DatePicker className="w-full rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="contactPerson" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Contact Person</span>}>
                <Input placeholder="e.g. James Bradley" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="phone" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Contact Phone</span>}>
                <Input placeholder="e.g. +61 411 992 812" className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => store.setSalesTaskModalOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs text-white">Create Task</Button>
            </div>
          </Form>
        </Modal>

        {/* + Send Proposal Modal */}
        <Modal
          open={store.salesProposalModalOpen}
          onCancel={() => store.setSalesProposalModalOpen(false)}
          title={<span className="font-bold text-slate-800 dark:text-white text-base">Generate pricing Proposal</span>}
          footer={null}
          destroyOnHidden
          width={650}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 space-y-4">
              <div>
                <span className="text-slate-555 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider block mb-1">Select Clinic Lead *</span>
                <Select placeholder="Choose lead clinic" value={proposalLeadId} onChange={setProposalLeadId} className="w-full rounded-xl h-10">
                  {(store.leads || []).filter(l => l.stage !== 'Converted').map(l => (
                    <Option key={l.id} value={l.id}>{l.name} ({l.practitioners} Drs)</Option>
                  ))}
                </Select>
              </div>

              <div>
                <span className="text-slate-555 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider block mb-1">Number of Allied Practitioners / Doctors</span>
                <Slider min={1} max={50} value={proposalDrs} onChange={setProposalDrs} />
                <div className="text-right text-xs text-[#8C4BFF] font-black">{proposalDrs} active practitioners</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <Checkbox checked={proposalHasAi} onChange={e => setProposalHasAi(e.target.checked)} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Add AI dictation SOAP notes add-on ($15/mo per doctor)
                </Checkbox>
              </div>

              <div>
                <span className="text-slate-555 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider block mb-1">Promo Voucher Code (e.g. ALLIED20)</span>
                <Input placeholder="Enter promo code" value={proposalPromo} onChange={e => setProposalPromo(e.target.value)} className="rounded-xl h-10 uppercase font-extrabold text-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div className="md:col-span-2 bg-[#8C4BFF]/5 dark:bg-slate-900/50 border border-[#8C4BFF]/10 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider mb-3">Proposal Price Summary</h4>
                <div className="space-y-2 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Base seats:</span>
                    <span className="text-slate-850 dark:text-slate-200">${basePrice.toFixed(2)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Note Add-on:</span>
                    <span className="text-slate-850 dark:text-slate-200">${aiPrice.toFixed(2)}/mo</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promo Discount:</span>
                      <span>-${discount.toFixed(2)}/mo</span>
                    </div>
                  )}
                  <Divider className="my-2 border-slate-200 dark:border-slate-800" />
                  <div className="flex justify-between text-sm font-black text-slate-800 dark:text-white">
                    <span>Total Quote:</span>
                    <span className="text-[#8C4BFF]">${totalProposalPrice.toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <Button
                  type="primary"
                  onClick={handleSendProposalSubmit}
                  style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33', width: '100%' }}
                  className="rounded-xl h-10 font-bold text-xs text-white"
                >
                  Send Pricing Proposal
                </Button>
                <Button
                  style={{ width: '100%' }}
                  onClick={() => toast.success('Pricing Proposal PDF generated!')}
                  className="rounded-xl h-10 font-bold text-xs"
                >
                  Download Proposal PDF
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* + Convert Clinic Modal */}
        <Modal
          open={store.salesConvertModalOpen}
          onCancel={() => store.setSalesConvertModalOpen(false)}
          title={<span className="font-bold text-slate-800 dark:text-white text-base">Convert Lead to Paying Clinic</span>}
          footer={null}
          destroyOnHidden
        >
          <Form form={convertForm} layout="vertical" onFinish={handleConvertClinicSubmit} initialValues={{ tier: 'Basic' }}>
            {!store.salesSelectedLeadId && (
              <Form.Item name="leadId" label={<span className="text-slate-555 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider">Select Converted Lead *</span>} rules={[{ required: true }]}>
                <Select placeholder="Choose lead clinic" className="rounded-xl">
                  {(store.leads || []).filter(l => l.stage !== 'Converted').map(l => (
                    <Option key={l.id} value={l.id}>{l.name} (Est. ${l.value}/mo)</Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <div className="p-3.5 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/40 rounded-xl mb-4 text-[11px] font-semibold text-yellow-700 dark:text-yellow-400">
              Converting a lead immediately links your salesperson attribution, creates an active clinic workspace, and starts recurring commission tracking.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="tier" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Subscription Tier *</span>} rules={[{ required: true }]}>
                <Select 
                  className="rounded-xl h-10 flex items-center"
                  onChange={(val) => {
                    const selectedPlan = store.subscriptionPlans?.find(p => p.name === val)
                    if (selectedPlan) {
                      convertForm.setFieldsValue({ value: selectedPlan.monthlyPrice })
                    }
                  }}
                >
                  {store.subscriptionPlans?.length > 0 ? store.subscriptionPlans.map(plan => (
                    <Option key={plan.id} value={plan.name}>{plan.name} (${plan.monthlyPrice}/mo)</Option>
                  )) : (
                    <>
                      <Option value="Basic">Basic ($100/mo)</Option>
                      <Option value="Pro">Pro ($250/mo)</Option>
                      <Option value="Enterprise">Enterprise ($1000/mo)</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
              <Form.Item name="value" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Subscription Monthly Value ($) *</span>} rules={[{ required: true }]}>
                <Input type="number" min={1} placeholder="e.g. 250" className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => store.setSalesConvertModalOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} className="rounded-xl font-bold text-xs text-white">Convert & Launch Clinic</Button>
            </div>
          </Form>
        </Modal>
      </>
    )
  }

  const isWhiteBgPage = location.pathname === '/clinic/calendar' || location.pathname === '/clinic/patients'

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  React.useEffect(() => {
    if (isWhiteBgPage && !darkMode) {
      document.body.style.backgroundColor = '#FFFFFF'
    } else if (darkMode) {
      document.body.style.backgroundColor = '#020617'
    } else {
      document.body.style.backgroundColor = '#F8FAFC'
    }
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [isWhiteBgPage, darkMode])

  // Route access validation based on user role
  React.useEffect(() => {
    const path = location.pathname
    if (path === '/clinic' || path === '/login' || path === '/register' || path === '/forgot-password') {
      return
    }

    const items = getNavItems(userRole)
    const hasNavAccess = items.some(item => path.startsWith(item.path))

    const isSettingsPath = path.includes('/settings') ||
      path.includes('/branch') ||
      path.includes('/admin') ||
      path.includes('/practitioners') ||
      path.includes('/subscription') ||
      path.includes('/ai-notes') ||
      path.includes('/tenants') ||
      path.includes('/payment-terms') ||
      path.includes('/templates') ||
      path.includes('/sales-settings')

    const settingsItems = getSettingsDropdownItems(userRole)
    const hasSettingsAccess = settingsItems.some(item => path.startsWith(item.path)) ||
      ((userRole === 'head_admin' || userRole === 'clinic') && isSettingsPath)

    const headAdminSections = [
      'clinics-manage', 'admin-management', 'subscriptions', 'billing',
      'sales-affiliates', 'ai-settings', 'audit-logs', 'support-centre',
      'messages', 'live-chat', 'platform-analytics', 'global-templates', 'notifications', 'documents'
    ]
    const isHeadAdminSection = headAdminSections.some(sec => path.includes(`/head-admin/${sec}`))
    const hasHeadAdminAccess = isHeadAdminSection && (userRole === 'head_admin' || userRole === 'super_admin' || localStorage.getItem('userRole') === 'head_admin' || localStorage.getItem('userRole') === 'super_admin')

    const isSalesPath = path.startsWith('/sales')
    const hasSalesAccess = isSalesPath && (userRole === 'sales' || userRole === 'head_admin' || userRole === 'clinic' || (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'sales'))

    const isPatientPath = path.startsWith('/patient/')
    const hasPatientAccess = isPatientPath && (userRole === 'patient' || userRole === 'clinic')

    const isPractitionerPath = path.startsWith('/practitioner/patients') ||
      path.startsWith('/practitioner/calendar') ||
      path.startsWith('/practitioner/reports') ||
      path.startsWith('/practitioner/consultations') ||
      path.startsWith('/practitioner/notes-reports') ||
      path.startsWith('/practitioner/exercises-plans') ||
      path.startsWith('/practitioner/referrals') ||
      path.startsWith('/practitioner/messages') ||
      path.startsWith('/practitioner/live-chat') ||
      path.startsWith('/practitioner/waitlist') ||
      path.startsWith('/practitioner/products') ||
      path.startsWith('/practitioner/documents') ||
      path.startsWith('/practitioner/contacts') ||
      path.startsWith('/practitioner/tasks') ||
      path.startsWith('/practitioner/settings')
    const hasPractitionerAccess = isPractitionerPath && (userRole === 'practitioner' || userRole === 'clinic' || userRole === 'head_admin' || userRole === 'patient')

    const hasProfileAccess = path.includes('/profile');
    const hasSharedFeatureAccess = path.includes('/ai-notes') || path.includes('/notifications') || path.includes('/live-chat') || path.includes('/messages');

    const hasAccess = hasNavAccess || hasSettingsAccess || hasHeadAdminAccess || hasSalesAccess || hasPatientAccess || hasPractitionerAccess || hasProfileAccess || hasSharedFeatureAccess


    if (!hasAccess) {
      toast.error('Unauthorized access to this section.')
      navigate('/clinic')
    }
  }, [location.pathname, userRole])

  const addDocModalOpen = useClinicStore(state => state.addDocModalOpen)
  const setAddDocModalOpen = useClinicStore(state => state.setAddDocModalOpen)
  const addDocument = useClinicStore(state => state.addDocument)
  const [addForm] = Form.useForm()

  const handleAddSubmit = async (values) => {
    try {
      let uploaderName = ''
      try {
        const uStr = localStorage.getItem('user')
        if (uStr) {
          const uObj = JSON.parse(uStr)
          uploaderName = uObj.name || uObj.fullName || uObj.email
        }
      } catch (e) {}
      if (!uploaderName) uploaderName = localStorage.getItem('userName') || 'Clinic Admin'

      let resolvedPatientName = values.patientName || 'Client'
      let resolvedPatientId = values.patientId || null

      if (resolvedPatientId) {
        const found = (useClinicStore.getState().patients || []).find(p => p.id === resolvedPatientId)
        if (found) {
          resolvedPatientName = found.fullName || found.name || resolvedPatientName
        }
      }

      await addDocument({
        name: values.name,
        patientId: resolvedPatientId,
        patientName: resolvedPatientName,
        sentTo: values.sentTo || '',
        uploadBy: uploaderName,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: values.type || 'Assessment',
        status: 'Active'
      })
      toast.success(`Document uploaded and linked to ${resolvedPatientName}'s profile!`)
      setAddDocModalOpen(false)
      addForm.resetFields()
      window.dispatchEvent(new CustomEvent('document-added'))
    } catch (err) {
      toast.error('Failed to save document to live database')
    }
  }


  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('userName')
    localStorage.removeItem('userId')
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userRole')
    toast.success('Logged out successfully.')
    navigate('/login')
  }

  const toggleTheme = () => {
    toggleDarkMode()
    toast.success(`${!darkMode ? 'Dark' : 'Light'} Mode activated.`, { duration: 1000 })
  }

  const isActive = (item) => {
    if (item.path === '/clinic') return location.pathname === '/clinic'
    return location.pathname.startsWith(item.path)
  }

  const renderProfileBlock = () => {
    const authUserId = localStorage.getItem('userId') || '1' // fallback to '1' if not set
    let displayName = 'Super Admin User'
    let displayRole = 'Super Admin'
    let avatarSrc = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'

    if (userRole === 'sales') {
      displayName = 'Colin Edegbe'
      displayRole = 'Sales Executive'
      avatarSrc = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    } else if (userRole === 'practitioner' && store.practitioners) {
      const p = store.practitioners.find(pr => pr.id === authUserId) || store.practitioners[0]
      if (p) {
        displayName = p.name
        displayRole = store.simulatedSpecialty || p.specialty || 'Physiotherapist'
        avatarSrc = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      }
    } else if (userRole === 'patient' && store.patients) {
      const p = store.patients.find(pt => pt.id === authUserId) || store.patients[0]
      if (p) {
        displayName = p.name
        displayRole = 'Patient'
        avatarSrc = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      }
    } else if (userRole === 'clinic' || userRole === 'head_admin') {
      displayName = 'Clinic Manager'
      displayRole = 'Clinic Admin'
      avatarSrc = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    }

    return (
      <div
        className="p-4 border-t flex items-center justify-between gap-2 transition-colors duration-300 mt-auto select-none"
        style={{ borderColor: darkMode ? '#1E2E4A' : '#F1F5F9' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-100">
            <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[11px] font-bold truncate" style={{ color: darkMode ? '#FFFFFF' : '#1E293B' }}>
              {displayName}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {displayRole}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-none bg-transparent cursor-pointer"
        >
          <LogoutOutlined style={{ fontSize: 13 }} />
        </button>
      </div>
    )
  }

  const bgClass = darkMode ? 'bg-slate-950' : (isWhiteBgPage ? 'bg-white' : 'bg-[#F8FAFC] dark:bg-slate-900')

  return (
    <div className={`h-screen w-screen overflow-hidden flex transition-colors duration-300 ${bgClass}`}>

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar content */}
        <aside
          className="relative flex flex-col w-52 max-w-xs h-full border-r shadow-2xl transition-transform duration-300 ease-out select-none"
          style={{
            backgroundColor: darkMode ? '#0E1B33' : '#FFFFFF',
            borderColor: darkMode ? '#1E2E4A' : '#E2E8F0',
          }}
        >
          {/* Sidebar Header (Logo) */}
          <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: darkMode ? '#1E2E4A' : '#F1F5F9' }}>
            <img src={logoImg} alt="ZealthOS Logo" className="h-6.5 w-26 object-cover object-left" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white border-none bg-transparent cursor-pointer p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={{
                    color: active
                      ? '#8C4BFF'
                      : darkMode
                        ? '#94A3B8'
                        : '#475569',
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active
                      ? darkMode
                        ? '#241A42'
                        : '#F3EEFF'
                      : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(140, 75, 255, 0.04)';
                      e.currentTarget.style.color = darkMode ? '#FFFFFF' : '#8C4BFF';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = darkMode ? '#94A3B8' : '#475569';
                    }
                  }}
                >
                  {getNavItemIcon(item.label)}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile Block */}
          {renderProfileBlock()}
        </aside>
      </div>

      {/* ── Desktop Left Sidebar ── */}
      <aside className="hidden" />

      {/* ── Right Column (Header + Content) ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* ── Top Header ── */}
        <header
          className="border-b px-2 lg:px-3 xl:px-4 h-16 flex items-center justify-between transition-colors duration-300 w-full max-w-full overflow-visible flex-shrink-0"
          style={{
            backgroundColor: darkMode ? '#0E1B33' : '#FFFFFF',
            borderColor: darkMode ? '#1E2E4A' : '#E2E8F0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          }}
        >
          {/* Left Side: Logo & Mobile Hamburger */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Mobile Hamburger */}
            <button
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center"
              onClick={() => setMobileMenuOpen(o => !o)}
              style={{
                backgroundColor: 'transparent',
                color: darkMode ? '#94A3B8' : '#475569',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <MenuOutlined style={{ fontSize: 15 }} />
            </button>

            {/* Logo */}
            <Link to={`/${rolePrefix}/dashboard`} className="flex items-center select-none flex-shrink-0">
              <img src={logoImg} alt="ZealthOS Logo" className="h-6.5 w-26 object-cover object-left" />
            </Link>
          </div>

          {/* Middle: Top Horizontal Navigation */}
          <nav
            ref={navRef}
            onWheel={handleWheel}
            className="hidden lg:flex items-center justify-start 2xl:justify-center gap-1 xl:gap-2 2xl:gap-3 h-full flex-1 min-w-0 mx-1 xl:mx-2 overflow-x-auto select-none no-scrollbar"
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            {navItems.filter(item => item.label !== 'Details' && item.label !== 'Profile & Settings').map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center h-full px-1 xl:px-1.5 py-5 text-[10px] xl:text-[10.5px] 2xl:text-[11px] font-bold transition-all duration-200 whitespace-nowrap"
                  style={{
                    color: active
                      ? '#8C4BFF'
                      : darkMode
                        ? '#94A3B8'
                        : '#475569',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = darkMode ? '#FFFFFF' : '#8C4BFF';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = darkMode ? '#94A3B8' : '#475569';
                    }
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    {getNavItemIcon(item.label)}
                    <span>{item.label}</span>
                  </span>
                  {active && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ backgroundColor: '#8C4BFF' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-3 xl:gap-4 flex-shrink-0">

            {/* Light/Dark Toggle Switch */}
            <div
              onClick={toggleTheme}
              className="relative flex items-center bg-slate-700 dark:bg-slate-800 p-1 rounded-full cursor-pointer select-none mr-2 w-14 h-7 border border-slate-650 dark:border-slate-700"
            >
              {/* White Sliding Knob */}
              <div
                className="absolute w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow-md transition-all duration-200"
                style={{
                  left: darkMode ? '31px' : '3px',
                }}
              />
              {/* Sun Icon (Left) */}
              <div className="w-6 h-5 flex items-center justify-center z-10">
                <SunOutlined
                  style={{
                    fontSize: 11,
                    color: darkMode ? '#94A3B8' : '#1E293B',
                    transition: 'color 0.2s'
                  }}
                />
              </div>
              {/* Moon Icon (Right) */}
              <div className="w-6 h-5 flex items-center justify-center z-10 ml-auto">
                <MoonOutlined
                  style={{
                    fontSize: 11,
                    color: darkMode ? '#1E293B' : '#94A3B8',
                    transition: 'color 0.2s'
                  }}
                />
              </div>
            </div>

            {/* AI Manager icon */}
            <Tooltip title="AI Manager">
              <button
                className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-colors"
                onClick={() => navigate(`/${rolePrefix}/ai-notes`)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#8C4BFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(140, 75, 255, 0.15)' : 'rgba(140, 75, 255, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Brain color="#8C4BFF" size={16} strokeWidth={2.5} />
              </button>
            </Tooltip>


            {/* Messages / Live Chat */}
            <div className="relative">
              <Tooltip title="Messages">
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  onClick={() => navigate(`/${rolePrefix}/live-chat`)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Badge count={unreadChatCount} size="small" offset={[2, -2]}>
                    <MessageOutlined style={{ fontSize: 16, color: darkMode ? '#94A3B8' : '#475569' }} />
                  </Badge>
                </button>
              </Tooltip>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <Tooltip title="Notifications">
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  onClick={() => navigate(`/${rolePrefix}/notifications`)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Badge count={notificationsList.filter(n => !n.isRead).length} size="small" offset={[2, -2]}>
                    <BellOutlined style={{ fontSize: 16, color: darkMode ? '#94A3B8' : '#475569' }} />
                  </Badge>
                </button>
              </Tooltip>
            </div>


            {/* User Role Display */}
            {userRole !== 'patient' && (
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Role</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize leading-tight mt-1">
                  {userRole === 'head_admin' ? 'Super Admin' : userRole === 'clinic' ? 'Clinic Admin' : userRole === 'sales' ? 'Sales Exec' : userRole === 'practitioner' ? 'Practitioner' : 'Patient'}
                </span>
              </div>
            )}

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <Tooltip title="Profile Menu">
                <div
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shadow select-none flex-shrink-0"
                  style={{ backgroundColor: '#8C4BFF' }}
                >
                  <UserOutlined style={{ color: 'white', fontSize: 13 }} />
                </div>
              </Tooltip>

              {profileDropdownOpen && (
                <>
                  {/* Backdrop overlay to close dropdown */}
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setProfileDropdownOpen(false)}
                  />

                  <div
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50 animate-fade-in"
                    style={{
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        const currentId = localStorage.getItem('userId') || '1'
                        navigate(`/${rolePrefix}/profile/${currentId}`)
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-none bg-transparent"
                      style={{ color: darkMode ? '#E2E8F0' : '#334155' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = darkMode ? '#1E2E4A' : '#F1F5F9';
                        e.currentTarget.style.color = darkMode ? '#FFFFFF' : '#0F172A';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = darkMode ? '#E2E8F0' : '#334155';
                      }}
                    >
                      <UserOutlined style={{ fontSize: 14 }} />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate(`/${rolePrefix}/settings`)
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-none bg-transparent"
                      style={{ color: darkMode ? '#E2E8F0' : '#334155' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = darkMode ? '#1E2E4A' : '#F1F5F9';
                        e.currentTarget.style.color = darkMode ? '#FFFFFF' : '#0F172A';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = darkMode ? '#E2E8F0' : '#334155';
                      }}
                    >
                      <SettingOutlined style={{ fontSize: 14 }} />
                      <span>Settings</span>
                    </button>

                    {/* Divider */}
                    <div className="border-b border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-none bg-transparent"
                      style={{ color: '#EF4444' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <LogoutOutlined style={{ fontSize: 14 }} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main
          className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden scroll-smooth"
          style={{ color: darkMode ? '#F1F5F9' : '#0F172A' }}
        >
          <div className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-8 py-3 lg:py-6 w-full">
            {renderSalesActionsBar()}
            {renderPractitionerActionsBar()}
            {renderPatientActionsBar()}
            {children}
          </div>
        </main>
      </div>

      {renderSalesModals()}

      {/* ── Global Add Document Modal ── */}
      <Modal
        open={addDocModalOpen}
        onCancel={() => setAddDocModalOpen(false)}
        footer={null}
        destroyOnHidden
        className="documents-modal"
        width={650}
        style={{ top: '30px' }}
        styles={{
          content: {
            backgroundColor: '#1E1E28',
            border: '1px solid #333344',
            padding: '24px'
          },
          mask: {
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white m-0">Add document</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Create a new document record</p>
        </div>

        <Form layout="vertical" form={addForm} onFinish={handleAddSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Form.Item
              name="name"
              label={<span className="text-slate-300 font-semibold text-xs">Document name</span>}
              rules={[{ required: true, message: 'Please enter document name' }]}
              style={{ marginBottom: '16px' }}
            >
              <Input placeholder="e.g. Docname.doc" className="w-full bg-[#2A2A36] text-white placeholder-slate-500 border-none rounded-lg h-10 hover:bg-[#323240] focus:bg-[#323240] transition-colors" />
            </Form.Item>
            <Form.Item
              name="patientId"
              label={<span className="text-slate-300 font-semibold text-xs">Link to Client</span>}
              rules={[{ required: true, message: 'Please select a client' }]}
              style={{ marginBottom: '16px' }}
            >
              <Select
                placeholder="Select client"
                showSearch
                optionFilterProp="children"
                className="w-full h-10 rounded-lg"
              >
                {(useClinicStore.getState().patients || []).map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.fullName || p.name} {p.displayId ? `(#${p.displayId})` : ''}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-slate-300 font-semibold text-xs">Document Upload</span>}
            style={{ marginBottom: '24px' }}
          >
            <Dragger
              beforeUpload={(file) => {
                addForm.setFieldsValue({ name: file.name })
                toast.success(`${file.name} prepared to upload!`)
                return false
              }}
              maxCount={1}
              showUploadList={true}
              className="rounded-2xl text-center bg-[#2A2A36] hover:bg-[#323240] transition-colors"
              style={{
                borderRadius: '12px',
                padding: '24px 10px',
                border: '1px dashed #475569',
                background: '#2A2A36'
              }}
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-[#60A5FA]">
                <PictureOutlined style={{ fontSize: 18 }} />
              </div>
              <p className="text-[13px] font-semibold text-slate-400 m-0">Drag & drop or click to upload</p>
            </Dragger>
          </Form.Item>

          <Form.Item className="mb-0 text-right mt-6">
            <Space size="middle">
              <button
                type="button"
                onClick={() => setAddDocModalOpen(false)}
                className="bg-transparent hover:bg-[#2A2A36] text-slate-300 font-bold h-11 px-8 rounded-xl cursor-pointer transition-colors duration-150 border border-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white border-none font-bold h-11 px-8 rounded-xl cursor-pointer transition-colors duration-150"
              >
                Add Document
              </button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      {renderPractitionerModals()}
      <FloatingChatDrawer />
    </div>
  )
}
