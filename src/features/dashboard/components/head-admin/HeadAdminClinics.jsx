import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Button, Input, Select, Space, Modal, Form, Avatar, Switch, Progress, Timeline, Badge } from 'antd'
import {
  PlusOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  TeamOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  LockOutlined,
  SyncOutlined,
  UserSwitchOutlined,
  SoundOutlined,
  FolderOpenOutlined,
  KeyOutlined,
  ReloadOutlined,
  SwapOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

import { API_BASE_URL } from '@/api/axios'

const { Option } = Select

export default function HeadAdminClinics({ store: propStore }) {
  const navigate = useNavigate()
  const localStore = useClinicStore()
  const store = propStore || localStore
  const [searchText, setSearchText] = useState('')
  const [pkgFilter, setPkgFilter] = useState('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [revFilter, setRevFilter] = useState('All')
  const [salesFilter, setSalesFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const clinics = store.clinics

  // Modals Visibility
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [editingClinic, setEditingClinic] = useState(null)

  const [form] = Form.useForm()
  const [editClinicForm] = Form.useForm()
  const editClinicAvatarUrl = Form.useWatch('avatar', editClinicForm)

  // Profile View States
  const [activeProfileTab, setActiveProfileTab] = useState('Overview')
  const [features, setFeatures] = useState({
    aiAssistant: true,
    whiteLabel: false,
    advancedReporting: false,
    patientPortal: true,
    waitlist: true
  })
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All')
  const [invoiceStartDate, setInvoiceStartDate] = useState('')
  const [invoiceEndDate, setInvoiceEndDate] = useState('')

  // Action Modals & Forms
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeTier, setUpgradeTier] = useState('Basic')
  const [lastBillingReset, setLastBillingReset] = useState('Never')

  // Password reset form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // State for live invoices, tickets, and audit logs
  const [liveInvoices, setLiveInvoices] = useState([])
  const [liveTickets, setLiveTickets] = useState([])
  const [liveAuditLogs, setLiveAuditLogs] = useState([])

  // Synchronize clinic feature flags and state when selectedClinic changes
  useEffect(() => {
    if (selectedClinic) {
      if (selectedClinic.featureFlags) {
        setFeatures(selectedClinic.featureFlags)
      }
      if (selectedClinic.lastBillingReset) {
        setLastBillingReset(selectedClinic.lastBillingReset)
      }
    }
  }, [selectedClinic])

  // Fetch live profile tab data (invoices, tickets, audit logs) at top level
  useEffect(() => {
    if (!selectedClinic || !showProfile) return
    if (activeProfileTab === 'Payment history') {
      backendFetch(`/super-admin/clinics/${selectedClinic.id}/invoices`).then(json => {
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLiveInvoices(json.data.map(sub => ({
            id: sub.displayId || `INV-${sub.id.slice(0, 6)}`,
            date: sub.createdAt ? new Date(sub.createdAt).toISOString().split('T')[0] : '2026-06-12',
            amount: sub.amount || 199.00,
            status: sub.status === 'Active' ? 'Paid' : sub.status
          })))
        }
      }).catch(() => {})
    } else if (activeProfileTab === 'Support tickets') {
      backendFetch(`/super-admin/clinics/${selectedClinic.id}/tickets`).then(json => {
        if (json && json.success && Array.isArray(json.data)) {
          setLiveTickets(json.data)
        }
      }).catch(() => {})
    } else if (activeProfileTab === 'Activity log') {
      backendFetch(`/super-admin/clinics/${selectedClinic.id}/audit-logs`).then(json => {
        if (json && json.success && Array.isArray(json.data)) {
          setLiveAuditLogs(json.data)
        }
      }).catch(() => {})
    }
  }, [activeProfileTab, selectedClinic, showProfile])

  const backendFetch = async (endpoint, options = {}) => {
    const mainBase = API_BASE_URL
    try {
      const res = await fetch(`${mainBase}/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          ...(options.headers || {}),
        },
      })
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {}

    const defaultPorts = [5001, 8001, 8002, 8003, 5000]
    const PORTS = window._activeBackendPort ? [window._activeBackendPort, ...defaultPorts.filter(p => p !== window._activeBackendPort)] : defaultPorts

    for (const port of PORTS) {
      try {
        const res = await fetch(`http://localhost:${port}/api${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
            ...(options.headers || {}),
          },
        })
        if (res.ok) {
          window._activeBackendPort = port
          return await res.json()
        }
      } catch (e) {
        if (window._activeBackendPort === port) {
          window._activeBackendPort = null
        }
      }
    }
    return null
  }

  const fetchClinicsFromBackend = async () => {
    const json = await backendFetch('/super-admin/clinics')
    if (json && json.success && Array.isArray(json.data)) {
      const formatted = json.data.map((item, index) => ({
        id: item.id,
        displayId: item.displayId || `CLN-${String(index + 1).padStart(6, '0')}`,
        name: item.name,
        email: item.email || 'N/A',
        contact: item.phone || 'N/A',
        contactPerson: item.contactPerson || item.name || 'N/A',
        website: item.website || '—',
        country: item.country || (item.address ? item.address.split(' ').pop() : 'India'),
        state: item.state || (item.address ? item.address.split(' ')[0] : 'Madhya Pradesh'),
        salesperson: item.salesperson || 'Unassigned',
        referral: item.referral || 'Direct',
        staffCount: item.staffCount !== undefined && item.staffCount !== null ? item.staffCount : 1,
        patientsCount: item.patientsCount !== undefined && item.patientsCount !== null ? item.patientsCount : 0,
        revenue: item.revenue !== undefined && item.revenue !== null ? item.revenue : 0,
        tier: item.tier || 'Basic',
        status: item.status || 'Active',
        featureFlags: item.featureFlags || { aiAssistant: true, whiteLabel: false, advancedReporting: false, patientPortal: true, waitlist: true },
        aiUsageCount: item.aiUsageCount || 0,
        aiUsageLimit: item.aiUsageLimit || 200,
        lastBillingReset: item.lastBillingReset ? new Date(item.lastBillingReset).toLocaleString() : 'Never',
        avatar: item.logoUrl || '',
        signupDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        commissionStatus: 'Pending',
        commissionPaidDate: null
      }))
      if (store.setClinics) store.setClinics(formatted)
    }
  }

  useEffect(() => {
    fetchClinicsFromBackend()
  }, [])

  const handleAddClinicSubmit = async (values) => {
    await backendFetch('/super-admin/clinics', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        contact: values.contact,
        phone: values.contact,
        contactPerson: values.contactPerson,
        website: values.website,
        country: values.country,
        state: values.state,
        salesperson: values.salesperson,
        referral: values.referral,
        staffCount: parseInt(values.staffCount) || 1,
        patientsCount: parseInt(values.patientsCount) || 0,
        revenue: parseFloat(values.revenue) || 0,
        tier: values.tier || 'Basic',
        status: values.status || 'Active',
        avatar: values.avatar || ''
      })
    })

    toast.success(`Clinic ${values.name} added successfully!`)
    setIsAddOpen(false)
    form.resetFields()
    await fetchClinicsFromBackend()
  }

  const handleEditClinicSubmit = async (values) => {
    if (editingClinic && editingClinic.id) {
      await backendFetch(`/super-admin/clinics/${editingClinic.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          contact: values.contact,
          phone: values.contact,
          contactPerson: values.contactPerson,
          website: values.website,
          country: values.country,
          state: values.state,
          salesperson: values.salesperson,
          referral: values.referral,
          staffCount: parseInt(values.staffCount) || 0,
          patientsCount: parseInt(values.patientsCount) || 0,
          revenue: parseFloat(values.revenue) || 0,
          tier: values.tier,
          status: values.status || 'Active',
          avatar: values.avatar || ''
        })
      })
    }

    toast.success('Clinic profile updated successfully!')
    setEditingClinic(null)
    editClinicForm.resetFields()
    await fetchClinicsFromBackend()
  }

  const handleDeleteClinic = async (record) => {
    if (record && record.id) {
      await backendFetch(`/super-admin/clinics/${record.id}`, {
        method: 'DELETE'
      })
    }
    store.deleteClinic(record.id)
    toast.success(`Deleted clinic ${record.name}`)
    fetchClinicsFromBackend()
  }

  const startEditingClinic = (clinic) => {
    setEditingClinic(clinic)
    editClinicForm.setFieldsValue({
      name: clinic.name,
      email: clinic.email,
      contact: clinic.contact,
      contactPerson: clinic.contactPerson,
      website: clinic.website,
      country: clinic.country,
      state: clinic.state,
      salesperson: clinic.salesperson,
      referral: clinic.referral,
      tier: clinic.tier,
      status: clinic.status,
      staffCount: clinic.staffCount,
      patientsCount: clinic.patientsCount,
      revenue: clinic.revenue,
      avatar: clinic.avatar || ''
    })
  }

  const filtered = clinics.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.country.toLowerCase().includes(searchText.toLowerCase()) ||
      c.state.toLowerCase().includes(searchText.toLowerCase()) ||
      c.salesperson.toLowerCase().includes(searchText.toLowerCase())

    const matchesPkg = pkgFilter === 'All' || c.tier === pkgFilter
    const matchesCountry = countryFilter === 'All' || c.country === countryFilter
    const matchesSales = salesFilter === 'All' || c.salesperson === salesFilter
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter

    let matchesRev = true
    if (revFilter !== 'All') {
      if (revFilter === '<50k') matchesRev = c.revenue < 50000
      else if (revFilter === '50k-100k') matchesRev = c.revenue >= 50000 && c.revenue <= 100000
      else if (revFilter === '>100k') matchesRev = c.revenue > 100000
    }

    return matchesSearch && matchesPkg && matchesCountry && matchesSales && matchesStatus && matchesRev
  })

  if (editingClinic) {
    return (
      <div className="bg-[#F8FAFC] dark:bg-slate-955 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingClinic(null)}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-350 transition-colors bg-transparent"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-850 dark:text-white m-0 tracking-tight">Edit clinic</h1>
            <p className="text-slate-400 dark:text-slate-455 text-xs mt-0.5">Update {editingClinic.name} details.</p>
          </div>
        </div>

        <Form form={editClinicForm} layout="vertical" onFinish={handleEditClinicSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-0">Clinic details</h2>

            {/* Logo URL / Avatar Preview */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <Avatar
                size={54}
                icon={<BankOutlined />}
                src={editClinicAvatarUrl || null}
                style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}
                className="flex-shrink-0"
              />
              <Form.Item
                name="avatar"
                label={<span className="text-slate-655 dark:text-slate-300 text-xs font-bold">Clinic Logo URL</span>}
                className="mb-0 flex-grow"
              >
                <Input placeholder="e.g. https://images.unsplash.com/photo-..." className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="name" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Clinic name *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="contactPerson" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Contact Person *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="email" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Email *</span>} rules={[{ required: true, type: 'email' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="contact" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Phone *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item name="website" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Website URL</span>} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="country" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Country *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="state" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">State *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item name="tier" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Subscription Tier *</span>} rules={[{ required: true }]} className="mb-0">
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Basic">Basic</Option>
                  <Option value="Pro">Pro</Option>
                  <Option value="Enterprise">Enterprise</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Status *</span>} rules={[{ required: true }]} className="mb-0">
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Active">Active</Option>
                  <Option value="Deactive">Deactive</Option>
                  <Option value="Suspended">Suspended</Option>
                </Select>
              </Form.Item>
              <Form.Item name="salesperson" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Salesperson *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Form.Item name="staffCount" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Staff Count</span>} className="mb-0">
                <Input type="number" className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="patientsCount" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Patients Count</span>} className="mb-0">
                <Input type="number" className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="revenue" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Revenue ($)</span>} className="mb-0">
                <Input type="number" step="0.01" className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="referral" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Referral Source</span>} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900" />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingClinic(null)}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#0E1B33' }}
              className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
          </div>
        </Form>
      </div>
    )
  }
  if (showProfile && selectedClinic) {
    const displayInvoicesList = liveInvoices

    // Invoice filtering logic
    const filteredInvoices = displayInvoicesList.filter(inv => {
      const matchesSearch = inv.id.toLowerCase().includes(invoiceSearch.toLowerCase())
      const matchesStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter
      const matchesStartDate = !invoiceStartDate || new Date(inv.date) >= new Date(invoiceStartDate)
      const matchesEndDate = !invoiceEndDate || new Date(inv.date) <= new Date(invoiceEndDate)
      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
    })

    const handleFeatureToggle = async (key, val) => {
      const nextFeatures = { ...features, [key]: val }
      setFeatures(nextFeatures)
      if (selectedClinic && selectedClinic.id) {
        await backendFetch(`/super-admin/clinics/${selectedClinic.id}/features`, {
          method: 'PUT',
          body: JSON.stringify({ features: nextFeatures })
        })
      }
      toast.success(`Feature ${key.replace(/([A-Z])/g, ' $1')} ${val ? 'enabled' : 'disabled'} successfully!`)
      fetchClinicsFromBackend()
    }

    const handlePasswordReset = async (e) => {
      e.preventDefault()
      if (!newPassword || !confirmPassword) {
        toast.error('Please fill out all fields.')
        return
      }
      if (newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long.')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match.')
        return
      }
      if (selectedClinic && selectedClinic.id) {
        await backendFetch(`/super-admin/clinics/${selectedClinic.id}/reset-password`, {
          method: 'PUT',
          body: JSON.stringify({ newPassword })
        })
      }
      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }

    const handleStatusToggle = async () => {
      const isCurrentlyActive = selectedClinic.status === 'Active'
      const nextStatus = isCurrentlyActive ? 'Suspended' : 'Active'
      if (selectedClinic && selectedClinic.id) {
        const res = await backendFetch(`/super-admin/clinics/${selectedClinic.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: nextStatus })
        })
        if (res && res.success && res.data) {
          setSelectedClinic(prev => ({ ...prev, status: res.data.status }))
        } else {
          setSelectedClinic(prev => ({ ...prev, status: nextStatus }))
        }
      } else {
        setSelectedClinic(prev => ({ ...prev, status: nextStatus }))
      }
      if (store.setClinicStatus) store.setClinicStatus(selectedClinic.id, nextStatus)
      toast.success(`Clinic ${selectedClinic.name} status updated to ${nextStatus}`)
      fetchClinicsFromBackend()
    }

    const handleUpgradePlan = async (tier) => {
      let nextRevenue = 100
      if (tier === 'Pro') nextRevenue = 250
      if (tier === 'Enterprise') nextRevenue = 1000

      if (selectedClinic && selectedClinic.id) {
        const res = await backendFetch(`/super-admin/clinics/${selectedClinic.id}/tier`, {
          method: 'PUT',
          body: JSON.stringify({ tier })
        })
        if (res && res.success && res.data) {
          setSelectedClinic(prev => ({ ...prev, tier: res.data.tier, revenue: res.data.revenue }))
        } else {
          setSelectedClinic(prev => ({ ...prev, tier, revenue: nextRevenue }))
        }
      } else {
        setSelectedClinic(prev => ({ ...prev, tier, revenue: nextRevenue }))
      }

      toast.success(`Clinic tier upgraded to ${tier} ($${nextRevenue.toLocaleString()}/mo) successfully!`)
      setUpgradeOpen(false)
      fetchClinicsFromBackend()
    }

    const handleSendAnnouncement = async () => {
      if (!announcementText.trim()) {
        toast.error('Please enter announcement text')
        return
      }
      if (selectedClinic && selectedClinic.id) {
        await backendFetch(`/super-admin/clinics/${selectedClinic.id}/announcements`, {
          method: 'POST',
          body: JSON.stringify({ text: announcementText })
        })
      }
      toast.success(`Announcement sent to all users in ${selectedClinic.name}!`)
      setAnnouncementText('')
      setAnnouncementOpen(false)
    }

    const handleResetBilling = async () => {
      let now = new Date().toLocaleString()
      if (selectedClinic && selectedClinic.id) {
        const res = await backendFetch(`/super-admin/clinics/${selectedClinic.id}/reset-billing`, {
          method: 'POST'
        })
        if (res && res.lastBillingReset) {
          now = new Date(res.lastBillingReset).toLocaleString()
        }
      }
      setLastBillingReset(now)
      setSelectedClinic(prev => ({ ...prev, lastBillingReset: now }))
      toast.success('Billing cycle reset successfully!')
    }

    const handleImpersonateAdmin = async () => {
      if (selectedClinic && selectedClinic.id) {
        await backendFetch(`/super-admin/clinics/${selectedClinic.id}/impersonate`, {
          method: 'POST'
        })
      }
      toast.success(`Launching impersonation session for ${selectedClinic ? selectedClinic.name : 'clinic'}...`)
      if (store && store.setUserRole) {
        store.setUserRole('clinic')
      } else {
        localStorage.setItem('userRole', 'clinic')
      }
      navigate('/clinic-admin/waitlist')
    }

    const handleDownloadInvoice = (record) => {
      const content = `================================================
ZEALTHOS SAAS INVOICE RECEIPT
================================================
Invoice ID: ${record.id}
Clinic Name: ${selectedClinic ? selectedClinic.name : 'Clinic'}
Date: ${record.date || new Date().toISOString().split('T')[0]}
Amount Paid: $${Number(record.amount || 0).toFixed(2)}
Payment Status: ${record.status || 'Paid'}
Billing Cycle: Annual Subscription Plan
Issued By: ZealthOS Head Admin Platform
================================================`

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${record.id}_Receipt.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${record.id} invoice receipt!`)
    }

    return (
      <div className="bg-[#F8FAFC] dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
        {/* Top Navigation Row */}
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => {
              setShowProfile(false)
              setSelectedClinic(null)
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white font-semibold text-xs border-none bg-transparent cursor-pointer transition-colors"
          >
            ← Back to Clinic Directory
          </button>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setShowProfile(false)
              startEditingClinic(selectedClinic)
            }}
            className="rounded-xl h-9 font-semibold text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
          >
            Edit
          </Button>
        </div>

        {/* Title Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              size={72}
              style={{ background: 'linear-gradient(135deg, #6366F1, #312E81)' }}
              className="flex-shrink-0 font-extrabold text-2xl flex items-center justify-center"
            >
              {selectedClinic.name.split(' ').map(w => w.charAt(0)).join('').toUpperCase()}
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-slate-805 dark:text-white m-0 tracking-tight">{selectedClinic.name}</h2>
              <div className="text-slate-450 dark:text-slate-400 text-xs font-semibold mt-1">
                Clinic ID: {selectedClinic.displayId || selectedClinic.id} &bull; {selectedClinic.state}, {selectedClinic.country}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <Tag color={selectedClinic.status === 'Active' ? 'success' : selectedClinic.status === 'Suspended' ? 'warning' : 'error'} className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase select-none">
                  {selectedClinic.status}
                </Tag>
                <Tag color="purple" className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase select-none">
                  {selectedClinic.tier}
                </Tag>
                <Tag className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase select-none">
                  White-label {features.whiteLabel ? 'on' : 'off'}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Number of users</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">{selectedClinic.staffCount}</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">{selectedClinic.patientsCount} patients</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500 text-sm">
              <TeamOutlined />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue generated</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">${selectedClinic.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 text-sm">
              <DollarOutlined />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI usage</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">0</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">of 200 this period</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-500 text-sm">
              <ThunderboltOutlined />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Support tickets</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">1</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">1 open</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 text-sm">
              <InfoCircleOutlined />
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-750 dark:text-white flex items-center gap-1.5 uppercase tracking-wider mb-0 pb-1">⚡ Quick actions</h4>
          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={handleStatusToggle}
              className={`rounded-xl h-10 font-bold text-xs px-5 border ${selectedClinic.status === 'Active'
                  ? 'bg-rose-50 border-rose-200 hover:border-rose-300 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 animate-fade-in'
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 animate-fade-in'
                }`}
              icon={selectedClinic.status === 'Active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            >
              {selectedClinic.status === 'Active' ? 'Suspend clinic' : 'Reactivate clinic'}
            </Button>
            <Button
              onClick={() => { setUpgradeTier(selectedClinic.tier); setUpgradeOpen(true); }}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<SwapOutlined />}
            >
              Upgrade / downgrade
            </Button>
            <Button
              onClick={handleResetBilling}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<ReloadOutlined />}
            >
              Reset billing
            </Button>
            <Button
              onClick={handleImpersonateAdmin}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<UserSwitchOutlined />}
            >
              Impersonate admin
            </Button>
            <Button
              onClick={() => setAnnouncementOpen(true)}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<SoundOutlined />}
            >
              Send announcement
            </Button>
            <Button
              onClick={() => navigate('/head-admin/documents')}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<FolderOpenOutlined />}
            >
              Global documents
            </Button>
          </div>

          {/* Feature Toggles Subsection */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Enable / Disable Features</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'aiAssistant', label: 'AI Assistant', desc: 'Zealth AI clinical summarisation and assistance.' },
                { key: 'whiteLabel', label: 'White-label', desc: 'Custom branding across the clinic workspace.' },
                { key: 'advancedReporting', label: 'Advanced Reporting', desc: 'Analytics dashboards and exportable reports.' },
                { key: 'patientPortal', label: 'Patient Portal', desc: 'Self-service portal for the clinic\'s patients.' },
                { key: 'waitlist', label: 'Waitlist Management', desc: 'Client waitlist queue and branch allocation under clinic name.' }
              ].map(feat => (
                <div key={feat.key} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white text-xs block">{feat.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">{feat.desc}</span>
                  </div>
                  <Switch
                    checked={features[feat.key]}
                    onChange={(checked) => handleFeatureToggle(feat.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1.5 pb-0 select-none">
          {['Overview', 'Subscription', 'Payment history', 'Support tickets', 'Activity log', 'Password reset'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveProfileTab(tab)}
              className={`px-4 py-2 text-xs font-bold transition-all border-none bg-transparent cursor-pointer rounded-t-xl -mb-[1px] ${activeProfileTab === tab
                  ? 'bg-purple-100 dark:bg-purple-950/40 text-[#8C4BFF] border-b-2 border-[#8C4BFF]'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeProfileTab === 'Overview' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Clinic details</span>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12 text-xs font-semibold p-1">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Company name</span>
                <span className="text-slate-808 dark:text-white font-extrabold">{selectedClinic.name}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Clinic ID</span>
                <span className="text-slate-850 dark:text-white font-extrabold">{selectedClinic.displayId || selectedClinic.id}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Email</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.email}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Phone</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.contact}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Contact person</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Website</span>
                {selectedClinic.website && selectedClinic.website !== '—' ? (
                  <a href={selectedClinic.website} target="_blank" rel="noreferrer" className="text-[#8C4BFF] hover:underline font-extrabold">{selectedClinic.website}</a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Country / State</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.country} - {selectedClinic.state}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Assigned salesperson</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.salesperson}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Referral source</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.referral}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Status</span>
                <Tag color={selectedClinic.status === 'Active' ? 'success' : 'warning'} className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase">{selectedClinic.status}</Tag>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Number of users</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.staffCount}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Patients</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.patientsCount}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Revenue generated</span>
                <span className="text-slate-800 dark:text-white font-extrabold">${selectedClinic.revenue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Subscription tier</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{selectedClinic.tier}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">White-label status</span>
                <Badge status={features.whiteLabel ? 'success' : 'default'} text={features.whiteLabel ? 'Enabled' : 'Disabled'} className="font-bold text-xs" />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">AI usage</span>
                <div className="flex items-center gap-3 mt-1 max-w-[200px]">
                  <Progress percent={0} size="small" showInfo={false} />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">0 / 200</span>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Last used</span>
                <span className="text-slate-800 dark:text-white font-extrabold">Jun 12, 2026</span>
              </div>
            </div>
          </Card>
        )}

        {activeProfileTab === 'Subscription' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Subscription</span>}>
            <div className="space-y-6 text-xs font-semibold p-1">
              <div>
                <p className="text-slate-400 dark:text-slate-550 text-xs m-0">Current package and renewal timeline.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Subscription tier</span>
                  <Tag color="purple" className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase">{selectedClinic.tier}</Tag>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Billing cycle</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">Annual</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Subscribed since</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">Aug 12, 2025</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Next renewal</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">Aug 12, 2026</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Revenue generated</span>
                  <span className="text-[#8C4BFF] font-black">${selectedClinic.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Last billing reset</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{lastBillingReset}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
                Use Quick actions above to upgrade, downgrade or reset billing. Wire this tab to your billing API when ready.
              </div>
            </div>
          </Card>
        )}

        {activeProfileTab === 'Payment history' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Payment history</span>}>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 dark:text-slate-550 text-xs m-0">Invoices for {selectedClinic.name}.</p>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="Search invoice ID..."
                  value={invoiceSearch}
                  onChange={e => setInvoiceSearch(e.target.value)}
                  className="w-48 rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900"
                  prefix={<SearchOutlined className="text-slate-400 mr-1" />}
                />
                <Select value={invoiceStatusFilter} onChange={setInvoiceStatusFilter} className="min-w-28 rounded-xl h-10">
                  <Option value="All">All Status</Option>
                  <Option value="Paid">Paid</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Failed">Failed</Option>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={invoiceStartDate}
                    onChange={e => setInvoiceStartDate(e.target.value)}
                    className="w-36 rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-xs font-semibold"
                  />
                  <span className="text-slate-400 text-xs">&rarr;</span>
                  <Input
                    type="date"
                    value={invoiceEndDate}
                    onChange={e => setInvoiceEndDate(e.target.value)}
                    className="w-36 rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
                <Button
                  onClick={() => {
                    setInvoiceSearch('')
                    setInvoiceStatusFilter('All')
                    setInvoiceStartDate('')
                    setInvoiceEndDate('')
                  }}
                  className="rounded-xl h-10 font-bold text-xs"
                >
                  Reset
                </Button>
              </div>

              {/* Invoices Table */}
              <Table
                dataSource={filteredInvoices}
                rowKey="id"
                pagination={{ pageSize: 6 }}
                className="border-none text-slate-800 dark:text-slate-200"
                columns={[
                  { title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Invoice</span>, dataIndex: 'id', render: (id) => <span className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">{id}</span> },
                  { title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</span>, dataIndex: 'date', render: (d) => <span className="text-slate-500 text-xs font-semibold">{d}</span> },
                  { title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount</span>, dataIndex: 'amount', render: (a) => <span className="text-slate-808 dark:text-white font-extrabold text-xs">${a.toFixed(2)}</span> },
                  {
                    title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>,
                    dataIndex: 'status',
                    render: (status) => (
                      <Tag color={status === 'Paid' ? 'success' : status === 'Pending' ? 'warning' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 select-none">
                        {status}
                      </Tag>
                    )
                  },
                  {
                    title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</span>,
                    key: 'action',
                    align: 'right',
                    render: (_, record) => (
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadInvoice(record)}
                        className="rounded-lg text-[10px] font-bold"
                      >
                        Download
                      </Button>
                    )
                  }
                ]}
              />
            </div>
          </Card>
        )}

        {activeProfileTab === 'Support tickets' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Support tickets</span>}>
            <div className="space-y-6">
              <div>
                <p className="text-slate-400 dark:text-slate-555 text-xs m-0">Recent tickets raised by {selectedClinic.name}. Open detailed conversations from the Support Centre.</p>
              </div>

              {/* Counts grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Open', count: String(liveTickets.filter(t => t.status === 'Open' || t.status === 'New').length || 1), color: 'text-amber-600' },
                  { label: 'In progress', count: String(liveTickets.filter(t => t.status === 'In Progress').length || 0), color: 'text-blue-500' },
                  { label: 'Resolved', count: String(liveTickets.filter(t => t.status === 'Resolved').length || 0), color: 'text-emerald-500' },
                  { label: 'Closed', count: String(liveTickets.filter(t => t.status === 'Closed').length || 0), color: 'text-slate-400' }
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold block uppercase tracking-wider">{stat.label}</span>
                    <h4 className={`text-2xl font-black m-0 mt-1.5 ${stat.color}`}>{stat.count}</h4>
                  </div>
                ))}
              </div>

              {/* Ticket item */}
              {liveTickets.length > 0 ? (
                liveTickets.map(tkt => (
                  <div key={tkt.id} className="p-4 bg-slate-50/30 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="rounded-md border-none font-bold text-[9px] px-2 py-0.5 bg-slate-200">{tkt.displayId || `TKT-${tkt.id.slice(0,6)}`}</Tag>
                        <span className="font-bold text-slate-808 dark:text-white text-xs">{tkt.desc || 'Support request'}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <Tag color="purple" className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full">{tkt.category || 'General'}</Tag>
                        <Tag className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400">{tkt.priority || 'Medium'} priority</Tag>
                        <span className="text-rose-500 font-extrabold text-[10px] uppercase ml-1">{tkt.status || 'Open'}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold pt-1">
                      &bull; {tkt.clinic || selectedClinic.name} &bull; Opened {tkt.created || (tkt.createdAt ? new Date(tkt.createdAt).toISOString().split('T')[0] : 'Recently')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="rounded-md border-none font-bold text-[9px] px-2 py-0.5 bg-slate-200">TKT-2400</Tag>
                      <span className="font-bold text-slate-808 dark:text-white text-xs">Billing discrepancy on latest invoice</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Tag color="purple" className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full">Billing</Tag>
                      <Tag className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400">Low priority</Tag>
                      <span className="text-rose-500 font-extrabold text-[10px] uppercase ml-1">Open</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-455 dark:text-slate-400 font-medium m-0 leading-relaxed">
                    Invoice total does not match the agreed monthly rate after the recent plan change.
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold pt-1">
                    &bull; Mia Roberts &bull; Opened Jun 11, 2026 &bull; Updated Jun 11, 2026
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeProfileTab === 'Activity log' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Activity log</span>}>
            <div className="p-1">
              <Timeline
                items={liveAuditLogs.length > 0 ? liveAuditLogs.map(log => ({
                  color: log.severity === 'Critical' ? 'red' : log.severity === 'Warning' ? 'orange' : 'green',
                  children: (
                    <div key={log.id} className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span className="font-bold">{log.action}</span>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recently'} &bull; {log.actor} ({log.role})
                      </p>
                    </div>
                  )
                })) : [
                  {
                    color: selectedClinic.status === 'Active' ? 'green' : 'orange',
                    children: (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-bold">Clinic status set to {selectedClinic.status}</span>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Today at 12:30 PM &bull; Admin session</p>
                      </div>
                    )
                  },
                  {
                    color: 'green',
                    children: (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-bold">AI Assistant feature toggle updated</span>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Today at 10:15 AM</p>
                      </div>
                    )
                  },
                  {
                    color: 'blue',
                    children: (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-bold">Monthly billing cycle initiated</span>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">10 Jun 2026 &bull; System event</p>
                      </div>
                    )
                  },
                  {
                    color: 'purple',
                    children: (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-bold">Clinic workspace initialized</span>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">{selectedClinic.signupDate} &bull; Onboarding completed</p>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          </Card>
        )}

        {activeProfileTab === 'Password reset' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Password reset</span>}>
            <form onSubmit={handlePasswordReset} className="space-y-4 max-w-sm">
              <p className="text-slate-455 dark:text-slate-400 text-[11px] font-semibold m-0">Set a new password for this clinic's dashboard login. Confirm with your backend when integrated.</p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New password</label>
                <Input.Password
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-950 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm password</label>
                <Input.Password
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-950 text-xs font-semibold"
                />
              </div>

              <Button
                htmlType="submit"
                type="primary"
                style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
                className="rounded-xl h-10 font-bold text-xs px-5 flex items-center gap-1.5"
                icon={<KeyOutlined />}
              >
                Save new password
              </Button>
            </form>
          </Card>
        )}

        {/* Quick Action Modals */}

        {/* 1. Send Announcement Modal */}
        <Modal
          open={announcementOpen}
          onCancel={() => { setAnnouncementOpen(false); setAnnouncementText(''); }}
          title={<span className="font-bold text-slate-805 dark:text-white text-base">Broadcast Announcement</span>}
          footer={null}
          destroyOnHidden
        >
          <div className="space-y-4">
            <p className="text-slate-455 dark:text-slate-400 text-[11px] font-semibold m-0">Send an immediate in-app broadcast alert to all practitioners and administrators at {selectedClinic.name}.</p>
            <Input.TextArea
              rows={4}
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              placeholder="Type your announcement here..."
              className="rounded-xl text-xs font-semibold"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => { setAnnouncementOpen(false); setAnnouncementText(''); }} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button onClick={handleSendAnnouncement} type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs">Send Broadcast</Button>
            </div>
          </div>
        </Modal>

        {/* 2. Upgrade/Downgrade Subscription Modal */}
        <Modal
          open={upgradeOpen}
          onCancel={() => setUpgradeOpen(false)}
          title={<span className="font-bold text-slate-805 dark:text-white text-base">Modify Subscription Plan</span>}
          footer={null}
          destroyOnHidden
        >
          <div className="space-y-4">
            <p className="text-slate-455 dark:text-slate-400 text-[11px] font-semibold m-0">Change subscription level for {selectedClinic.name}. Billing amounts will adjust automatically.</p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Tier</label>
              <Select value={upgradeTier} onChange={setUpgradeTier} className="w-full rounded-xl h-10">
                <Option value="Basic">Basic ($100/mo)</Option>
                <Option value="Pro">Pro ($250/mo)</Option>
                <Option value="Enterprise">Enterprise ($1000/mo)</Option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setUpgradeOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button onClick={() => handleUpgradePlan(upgradeTier)} type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs">Update Plan</Button>
            </div>
          </div>
        </Modal>

      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white m-0 tracking-tight">Clinic Management</h1>
          <p className="text-slate-400 dark:text-slate-455 text-xs mt-1">Search and filter every clinic on the platform, then open a profile to manage it.</p>
        </div>
        <Button
          type="primary"
          onClick={() => setIsAddOpen(true)}
          style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
          className="rounded-xl font-bold text-xs h-10 px-5 flex items-center gap-1.5 shadow-sm hover:shadow"
        >
          <PlusOutlined style={{ fontSize: 13 }} />
          <span>Add Clinics</span>
        </Button>
      </div>

      {/* Search Bar & Filter Options */}
      <div className="space-y-3">
        <Input
          placeholder="Search by name, country, state or salesperson..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-full rounded-xl h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          prefix={<span className="text-slate-400 mr-2">🔍</span>}
        />
        <div className="flex flex-wrap gap-2">
          <Select value={pkgFilter} onChange={setPkgFilter} className="min-w-36 rounded-xl h-9">
            <Option value="All">All packages</Option>
            <Option value="Basic">Basic</Option>
            <Option value="Pro">Pro</Option>
            <Option value="Enterprise">Enterprise</Option>
          </Select>
          <Select value={countryFilter} onChange={setCountryFilter} className="min-w-36 rounded-xl h-9">
            <Option value="All">All Countries</Option>
            <Option value="Australia">Australia</Option>
            <Option value="New Zealand">New Zealand</Option>
            <Option value="United Kingdom">United Kingdom</Option>
            <Option value="United States">United States</Option>
            <Option value="Canada">Canada</Option>
          </Select>
          <Select value={revFilter} onChange={setRevFilter} className="min-w-36 rounded-xl h-9">
            <Option value="All">All Revenue</Option>
            <Option value="<50k">&lt; $50k</Option>
            <Option value="50k-100k">$50k - $100k</Option>
            <Option value=">100k">&gt; $100k</Option>
          </Select>
          <Select value={salesFilter} onChange={setSalesFilter} className="min-w-36 rounded-xl h-9">
            <Option value="All">All Salespeople</Option>
            {Array.from(new Set(clinics.map(c => c.salesperson))).map(sp => (
              <Option key={sp} value={sp}>{sp}</Option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} className="min-w-36 rounded-xl h-9">
            <Option value="All">All Status</Option>
            <Option value="Active">Active</Option>
            <Option value="Suspended">Suspended</Option>
            <Option value="Deactive">Deactive</Option>
          </Select>
        </div>
      </div>

      {/* Clinics Table */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <Table
          dataSource={filtered}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15 }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedClinic(record)
              setShowProfile(true)
            },
            style: { cursor: 'pointer' }
          })}
          className="border-none"
          columns={[
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Clinic ID</span>,
              dataIndex: 'displayId',
              render: (displayId, record) => <span className="font-mono text-slate-400 dark:text-slate-550 text-xs font-bold">{displayId || record.id}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Clinic name</span>,
              dataIndex: 'name',
              render: (name, record) => (
                <div className="flex items-center gap-2">
                  <Avatar src={record.avatar || null} size={28} style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}>
                    {name.charAt(0)}
                  </Avatar>
                  <div>
                    <span className="font-bold text-slate-850 dark:text-slate-200 text-xs block">{name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-555 block mt-0.5">{record.email}</span>
                  </div>
                </div>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Country / State</span>,
              dataIndex: 'country',
              render: (country, record) => (
                <div>
                  <span className="font-bold text-slate-705 dark:text-slate-300 text-xs block">{country}</span>
                  <span className="text-[10px] text-slate-405 dark:text-slate-500 block mt-0.5">{record.state}</span>
                </div>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subscription tier</span>,
              dataIndex: 'tier',
              render: (tier) => (
                <Tag color={tier === 'Enterprise' ? 'purple' : tier === 'Pro' ? 'blue' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                  {tier}
                </Tag>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revenue</span>,
              dataIndex: 'revenue',
              render: (revenue) => <span className="font-extrabold text-slate-800 dark:text-white text-xs">${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Salesperson</span>,
              dataIndex: 'salesperson',
              render: (t) => <span className="text-slate-605 dark:text-slate-350 font-semibold text-xs">{t}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>,
              dataIndex: 'status',
              render: (status) => (
                <Tag color={status === 'Active' ? 'success' : status === 'Suspended' ? 'warning' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 select-none">
                  {status}
                </Tag>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Action</span>,
              key: 'actions',
              align: 'right',
              render: (_, record) => (
                <Space onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    icon={<InfoCircleOutlined className="text-slate-400" />}
                    onClick={() => {
                      setSelectedClinic(record)
                      setShowProfile(true)
                    }}
                    className="hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg"
                  />
                  <Button
                    type="text"
                    icon={<EditOutlined className="text-slate-400" />}
                    onClick={() => startEditingClinic(record)}
                    className="hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg"
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteClinic(record)}
                    className="hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                  />
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Add Clinic Modal */}
      <Modal
        open={isAddOpen}
        onCancel={() => {
          setIsAddOpen(false)
          form.resetFields()
        }}
        footer={null}
        destroyOnHidden
        width={520}
        title={
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-805 dark:text-white m-0 tracking-tight">Add clinic</h2>
            <p className="text-slate-455 dark:text-slate-400 text-[11px] font-medium mt-0.5">Enter clinic details.</p>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddClinicSubmit}
          initialValues={{ staffCount: '1', patientsCount: '0', revenue: '0', tier: 'Basic', status: 'Active' }}
        >
          <Form.Item
            name="name"
            label={<span className="text-slate-550 dark:text-slate-300 font-bold text-[11px]">Clinic name *</span>}
            rules={[{ required: true, message: 'Please enter clinic name' }]}
            className="mb-3"
          >
            <Input placeholder="e.g. Zoya Clinic" className="rounded-xl h-10" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3 mb-1">
            <Form.Item
              name="contact"
              label={<span className="text-slate-550 dark:text-slate-300 font-bold text-[11px]">Contact *</span>}
              rules={[{ required: true, message: 'Please enter contact number' }]}
              className="mb-2"
            >
              <Input placeholder="Phone number" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Email *</span>}
              rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
              className="mb-2"
            >
              <Input placeholder="clinic@example.com" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-1">
            <Form.Item
              name="contactPerson"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Contact person *</span>}
              rules={[{ required: true, message: 'Please enter contact person name' }]}
              className="mb-2"
            >
              <Input placeholder="Full name" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="website"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Website</span>}
              className="mb-2"
            >
              <Input placeholder="https://example.com" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-1">
            <Form.Item
              name="country"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Country *</span>}
              rules={[{ required: true, message: 'Please enter country' }]}
              className="mb-2"
            >
              <Input placeholder="e.g. Australia" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="state"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">State / region *</span>}
              rules={[{ required: true, message: 'Please enter state/region' }]}
              className="mb-2"
            >
              <Input placeholder="e.g. New South Wales" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-1">
            <Form.Item
              name="salesperson"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Assigned salesperson *</span>}
              rules={[{ required: true, message: 'Please enter salesperson name' }]}
              className="mb-2"
            >
              <Input placeholder="Full name" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="referral"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Referral source *</span>}
              rules={[{ required: true, message: 'Please enter referral source' }]}
              className="mb-2"
            >
              <Input placeholder="e.g. Partner Referral" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-1">
            <Form.Item
              name="staffCount"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Staff count *</span>}
              rules={[{ required: true, message: 'Required' }]}
              className="mb-2"
            >
              <Input type="number" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="patientsCount"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Patients count *</span>}
              rules={[{ required: true, message: 'Required' }]}
              className="mb-2"
            >
              <Input type="number" className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="revenue"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Revenue (USD) *</span>}
              rules={[{ required: true, message: 'Required' }]}
              className="mb-2"
            >
              <Input type="number" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Form.Item
              name="tier"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Package *</span>}
              rules={[{ required: true, message: 'Required' }]}
              className="mb-2"
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Basic">Basic</Option>
                <Option value="Pro">Pro</Option>
                <Option value="Enterprise">Enterprise</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Status *</span>}
              rules={[{ required: true, message: 'Required' }]}
              className="mb-2"
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Active">Active</Option>
                <Option value="Suspended">Suspended</Option>
                <Option value="Deactive">Deactive</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="mb-0 text-right mt-4">
            <Space size="middle">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false)
                  form.resetFields()
                }}
                className="bg-white dark:bg-slate-900 hover:bg-slate-55 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: '#0E1B33' }}
                className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer"
              >
                Add clinic
              </button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
