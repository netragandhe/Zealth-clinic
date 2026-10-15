import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Table, Card, Button, Tag, Space, Checkbox, Modal, Avatar, Switch, Progress, Timeline, Badge } from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  UserOutlined,
  LockOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  UserSwitchOutlined,
  SoundOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  SwapOutlined,
  TeamOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  HistoryOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  LockFilled,
  CalendarFilled,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/store/clinicStore'
import { API_BASE_URL } from '@/api/axios'

const { Option } = Select

export default function HeadAdminAdminManagement() {
  const navigate = useNavigate()
  const store = useClinicStore()
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Stateful Admin Data
  const [adminsList, setAdminsList] = useState([])

  // Modals / Editing state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [activeProfileTab, setActiveProfileTab] = useState('Overview')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const editAvatarUrl = Form.useWatch('avatar', editForm)
  const [editPermissions, setEditPermissions] = useState({})

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

  const fetchAdminsFromBackend = async () => {
    const json = await backendFetch('/super-admin/admins')
    if (json && json.success && Array.isArray(json.data)) {
      const formatted = json.data.map((item, index) => ({
        id: item.id,
        displayId: item.displayId || `ADM-${String(index + 1).padStart(6, '0')}`,
        name: item.name,
        email: item.email,
        clinic: item.clinic || 'General Platform',
        phone: item.phone || '—',
        role: item.role === 'SUPER_ADMIN' ? 'Super Admin' : item.role === 'CLINIC_ADMIN' ? 'Clinic Admin' : (item.roleTitle || 'Clinic Admin'),
        joinDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Today',
        lastLogin: 'Never',
        status: item.status === 'SUSPENDED' ? 'Suspended' : item.status === 'INACTIVE' ? 'Inactive' : 'Active',
        avatar: item.avatar || '',
        permissions: {
          'Dashboard': 'Full access',
          'Clinic Management': 'All 10',
          'User Management': 'All 8'
        }
      }))
      setAdminsList(formatted)
    }
  }

  useEffect(() => {
    fetchAdminsFromBackend()
  }, [])

  const handleAddAdminSubmit = async (values) => {
    await backendFetch('/super-admin/admins', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        status: values.status || 'Active',
        password: values.password || 'AdminPass123!'
      })
    })

    toast.success(`Admin ${values.name} added successfully!`)
    setIsAddOpen(false)
    addForm.resetFields()
    await fetchAdminsFromBackend()
  }

  const handleEditAdminSubmit = async (values) => {
    if (editingAdmin && editingAdmin.id) {
      const updatedPerms = {}
      Object.keys(editPermissions).forEach(key => {
        if (editPermissions[key]) {
          updatedPerms[key] = key === 'Clinic Management' ? 'All 10' : key === 'User Management' ? 'All 8' : 'Full access'
        }
      })

      setAdminsList(prev => prev.map(a => a.id === editingAdmin.id ? {
        ...a,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        status: values.status || 'Active',
        avatar: values.avatar || a.avatar,
        permissions: updatedPerms
      } : a))

      await backendFetch(`/super-admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
          status: values.status || 'Active',
          permissions: updatedPerms
        })
      })
    }

    toast.success('Admin profile and page permissions updated successfully!')
    setEditingAdmin(null)
    editForm.resetFields()
    await fetchAdminsFromBackend()
  }

  const handleDeleteAdmin = async (record) => {
    if (record && record.id) {
      await backendFetch(`/super-admin/admins/${record.id}`, {
        method: 'DELETE'
      })
    }
    toast.success(`Removed admin access for ${record.name} from database!`)
    setShowProfile(false)
    setSelectedAdmin(null)
    await fetchAdminsFromBackend()
  }

  const startEditing = (admin) => {
    setEditingAdmin(admin)
    // Seed initial permissions checkboxes
    const initialPerms = {}
    const possiblePages = [
      'Dashboard', 'User Management', 'Clinic Management', 'Subscription Manage', 'Subscription Invoice',
      'Sales & Affiliates', 'AI Management', 'Compliance & Audit', 'Support Centre', 'Reports & Analytics', 'Settings'
    ]
    possiblePages.forEach(p => {
      initialPerms[p] = !!admin.permissions[p]
    })
    setEditPermissions(initialPerms)

    editForm.setFieldsValue({
      name: admin.name,
      email: admin.email,
      clinic: admin.clinic,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
      avatar: admin.avatar || ''
    })
  }

  const filtered = adminsList.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchText.toLowerCase()) ||
      a.clinic.toLowerCase().includes(searchText.toLowerCase()) ||
      a.email.toLowerCase().includes(searchText.toLowerCase()) ||
      a.id.toLowerCase().includes(searchText.toLowerCase())

    const matchesRole = roleFilter === 'All' || a.role === roleFilter
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  // If editing, render the full-fidelity edit form inline
  if (editingAdmin) {
    const avatarUrl = editAvatarUrl

    const pagesLeft = [
      { key: 'Dashboard', label: 'Dashboard' },
      { key: 'Clinic Management', label: 'Clinic Management', badge: 'All 10' },
      { key: 'Subscription Invoice', label: 'Subscription Invoice', badge: 'All 6' },
      { key: 'AI Management', label: 'AI Management' },
      { key: 'Support Centre', label: 'Support Centre' },
      { key: 'Settings', label: 'Settings' }
    ]

    const pagesRight = [
      { key: 'User Management', label: 'User Management', badge: 'All 8' },
      { key: 'Subscription Manage', label: 'Subscription Manage', badge: 'All 4' },
      { key: 'Sales & Affiliates', label: 'Sales & Affiliates' },
      { key: 'Compliance & Audit', label: 'Compliance & Audit' },
      { key: 'Reports & Analytics', label: 'Reports & Analytics' }
    ]

    return (
      <div className="bg-[#F8FAFC] dark:bg-slate-955 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingAdmin(null)}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-350 transition-colors bg-transparent"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-850 dark:text-white m-0 tracking-tight">Edit admin</h1>
            <p className="text-slate-400 dark:text-slate-455 text-xs mt-0.5">Update {editingAdmin.name} details and adjust page-level access.</p>
          </div>
        </div>

        <Form form={editForm} layout="vertical" onFinish={handleEditAdminSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-0">Personal information</h2>

            {/* Profile Photo URL / Avatar Preview */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <Avatar
                size={54}
                icon={<UserOutlined />}
                src={avatarUrl}
                style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}
                className="flex-shrink-0"
              />
              <Form.Item
                name="avatar"
                label={<span className="text-slate-655 dark:text-slate-300 text-xs font-bold">Profile Photo URL</span>}
                className="mb-0 flex-grow"
              >
                <Input placeholder="e.g. https://images.unsplash.com/photo-..." className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="name" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Full name *</span>} rules={[{ required: true, message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="clinic" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Clinic name *</span>} rules={[{ required: true, message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="email" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Email *</span>} rules={[{ required: true, type: 'email', message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900" />
              </Form.Item>
              <Form.Item name="phone" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Phone *</span>} rules={[{ required: true, message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="role" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Role *</span>} rules={[{ required: true }]} className="mb-0">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="ClinicAdmin">ClinicAdmin</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Status *</span>} rules={[{ required: true }]} className="mb-0">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="Suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-805 dark:text-white mb-0">Page permissions *</h2>
              <button
                type="button"
                onClick={() => {
                  const cleared = {}
                  Object.keys(editPermissions).forEach(k => cleared[k] = false)
                  setEditPermissions(cleared)
                }}
                className="text-xs text-[#8C4BFF] font-bold border-none bg-transparent hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column */}
              <div className="space-y-3">
                {pagesLeft.map(p => (
                  <div key={p.key} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                    <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                      <Checkbox
                        checked={!!editPermissions[p.key]}
                        onChange={(e) => setEditPermissions(prev => ({ ...prev, [p.key]: e.target.checked }))}
                        className="custom-purple-checkbox"
                      />
                      <span>{p.label}</span>
                    </label>
                    {p.badge && (
                      <span className="text-[10px] font-bold text-[#8C4BFF] bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/50">
                        {p.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                {pagesRight.map(p => (
                  <div key={p.key} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                    <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                      <Checkbox
                        checked={!!editPermissions[p.key]}
                        onChange={(e) => setEditPermissions(prev => ({ ...prev, [p.key]: e.target.checked }))}
                        className="custom-purple-checkbox"
                      />
                      <span>{p.label}</span>
                    </label>
                    {p.badge && (
                      <span className="text-[10px] font-bold text-[#8C4BFF] bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/50">
                        {p.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingAdmin(null)}
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

  // If showProfile is true, render the high-fidelity admin detail view matching the screenshot exactly
  if (showProfile && selectedAdmin) {
    const handleStatusToggle = async () => {
      const isCurrentlyActive = selectedAdmin.status === 'Active'
      const nextStatus = isCurrentlyActive ? 'Suspended' : 'Active'

      await backendFetch(`/super-admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      })

      setAdminsList(prev => prev.map(a => a.id === selectedAdmin.id ? { ...a, status: nextStatus } : a))
      setSelectedAdmin(prev => ({ ...prev, status: nextStatus }))
      toast.success(`Admin ${selectedAdmin.name} status updated to ${nextStatus} in database!`)
      await fetchAdminsFromBackend()
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

      await backendFetch(`/super-admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword })
      })

      toast.success(`Password for ${selectedAdmin.name} reset successfully in database!`)
      setNewPassword('')
      setConfirmPassword('')
      await fetchAdminsFromBackend()
    }
    const userActivityLogs = selectedAdmin?.auditLogs || []

    return (
      <div className="bg-[#F8FAFC] dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
        {/* Top Navigation Row */}
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => {
              setShowProfile(false)
              setSelectedAdmin(null)
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white font-semibold text-xs border-none bg-transparent cursor-pointer transition-colors"
          >
            ← Back to Admins
          </button>
          <div className="flex gap-2">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setShowProfile(false)
                startEditing(selectedAdmin)
              }}
              className="rounded-xl h-9 font-semibold text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
            >
              Edit Admin
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAdmin(selectedAdmin)}
              className="rounded-xl h-9 font-semibold text-xs"
            >
              Delete Admin
            </Button>
          </div>
        </div>

        {/* Title Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              size={72}
              src={selectedAdmin.avatar}
              style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}
              className="flex-shrink-0 font-extrabold text-2xl flex items-center justify-center animate-fade-in"
            >
              {selectedAdmin.name.charAt(0)}
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-slate-805 dark:text-white m-0 tracking-tight">{selectedAdmin.name}</h2>
              <div className="text-slate-455 dark:text-slate-400 text-xs font-semibold mt-1">
                Admin ID: {selectedAdmin.displayId || selectedAdmin.id} &bull; {selectedAdmin.clinic}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <Tag color={selectedAdmin.status === 'Active' ? 'success' : selectedAdmin.status === 'Suspended' ? 'warning' : 'error'} className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase select-none">
                  {selectedAdmin.status}
                </Tag>
                <Tag color="purple" className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase select-none">
                  {selectedAdmin.role}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pages allowed</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">{Object.keys(selectedAdmin.permissions).length}</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">Custom permissions</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500 text-sm">
              <SafetyCertificateOutlined />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last login date</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">{selectedAdmin.lastLogin}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 text-sm">
              <CalendarOutlined />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access level</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">{selectedAdmin.role === 'Super Admin' ? 'Root' : 'Admin'}</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">Based on role</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-500 text-sm">
              <LockOutlined />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3.5 items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account status</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-0">{selectedAdmin.status}</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">Real-time status</span>
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
              className={`rounded-xl h-10 font-bold text-xs px-5 border ${selectedAdmin.status === 'Active'
                  ? 'bg-rose-50 border-rose-200 hover:border-rose-300 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400'
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
                }`}
              icon={selectedAdmin.status === 'Active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            >
              {selectedAdmin.status === 'Active' ? 'Suspend admin' : 'Reactivate admin'}
            </Button>
            <Button
              onClick={() => {
                toast.success(`Launching impersonation session for ${selectedAdmin ? selectedAdmin.name : 'admin'}...`)
                if (store && store.setUserRole) store.setUserRole('clinic')
                else localStorage.setItem('userRole', 'clinic')
                navigate('/clinic-admin/waitlist')
              }}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<UserSwitchOutlined />}
            >
              Impersonate admin
            </Button>
            <Button
              onClick={() => toast.success(`Alert notification sent to ${selectedAdmin.name}!`)}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<SoundOutlined />}
            >
              Send notification
            </Button>
            <Button
              onClick={() => { setActiveProfileTab('Password reset'); }}
              className="rounded-xl h-10 font-bold text-xs px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
              icon={<LockOutlined />}
            >
              Force password reset
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1.5 pb-0 select-none">
          {['Overview', 'Activity log', 'Password reset'].map(tab => (
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
          <div className="space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Admin details</span>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12 text-xs font-semibold p-1">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Company/Clinic name</span>
                  <span className="text-slate-808 dark:text-white font-extrabold">{selectedAdmin.clinic}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Admin ID</span>
                  <span className="text-slate-850 dark:text-white font-extrabold">{selectedAdmin.displayId || selectedAdmin.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Email</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{selectedAdmin.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Phone</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{selectedAdmin.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Role</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{selectedAdmin.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Status</span>
                  <Tag color={selectedAdmin.status === 'Active' ? 'success' : 'warning'} className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase">{selectedAdmin.status}</Tag>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Join date</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{selectedAdmin.joinDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Last login</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">{selectedAdmin.lastLogin}</span>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Page permissions</span>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {Object.keys(selectedAdmin.permissions).map((page) => (
                  <div key={page} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{page}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1 rounded-full">
                      {selectedAdmin.permissions[page]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeProfileTab === 'Activity log' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Admin Activity log</span>}>
            <div className="p-2">
              {userActivityLogs.length > 0 ? (
                <Timeline
                  items={userActivityLogs.map((log, idx) => ({
                    color: idx === 0 ? 'blue' : 'gray',
                    children: (
                      <div className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800 dark:text-white text-xs">{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recently'}</span>
                        </div>
                        <p className="text-slate-500 m-0">{log.details || log.target || 'No additional details'}</p>
                      </div>
                    )
                  }))}
                />
              ) : (
                <p className="text-slate-400 text-xs py-4 text-center m-0">No activity logged for this account.</p>
              )}
            </div>
          </Card>
        )}

        {activeProfileTab === 'Password reset' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-white">Password reset</span>}>
            <form onSubmit={handlePasswordReset} className="max-w-md space-y-4 p-2">
              <div>
                <label className="text-slate-450 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">New password</label>
                <Input.Password
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-450 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Confirm new password</label>
                <Input.Password
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: '#0E1B33' }}
                className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer hover:opacity-90 transition-opacity text-xs"
              >
                Reset Password
              </button>
            </form>
          </Card>
        )}
      </div>
    )
  }

  // Otherwise, render Table view
  return (
    <div className="space-y-6">

      {/* ── Title Header & Add Button ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-805 dark:text-white m-0 tracking-tight">Admin Management</h1>
          <p className="text-slate-400 dark:text-slate-455 text-xs mt-1">Manage platform admins and the pages each one can access</p>
        </div>
        <Button
          type="primary"
          onClick={() => setIsAddOpen(true)}
          style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
          className="rounded-xl font-bold text-xs h-10 px-5 flex items-center gap-1.5 shadow-sm hover:shadow"
        >
          <PlusOutlined style={{ fontSize: 13 }} />
          <span>Add Admin</span>
        </Button>
      </div>

      {/* ── Search & Filter Panel ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name, clinic, email or phone..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="flex-1 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          prefix={<span className="text-slate-400 mr-2">🔍</span>}
        />
        <div className="flex gap-2">
          <Select value={roleFilter} onChange={setRoleFilter} className="min-w-36 rounded-xl h-10">
            <Option value="All">All Roles</Option>
            <Option value="ClinicAdmin">ClinicAdmin</Option>
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} className="min-w-36 rounded-xl h-10">
            <Option value="All">All Status</Option>
            <Option value="Active">Active</Option>
            <Option value="Inactive">Inactive</Option>
            <Option value="Suspended">Suspended</Option>
          </Select>
        </div>
      </div>

      {/* ── Table Grid ── */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <Table
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            itemRender: (page, type, originalElement) => {
              if (type === 'prev') return <span className="text-xs font-semibold text-slate-500 hover:text-[#8C4BFF] cursor-pointer">&lt; Previous</span>
              if (type === 'next') return <span className="text-xs font-semibold text-slate-500 hover:text-[#8C4BFF] cursor-pointer">Next &gt;</span>
              return originalElement
            }
          }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedAdmin(record)
              setShowProfile(true)
            },
            style: { cursor: 'pointer' }
          })}
          className="border-none"
          columns={[
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Admin ID</span>,
              dataIndex: 'displayId',
              render: (displayId, record) => <span className="font-mono text-slate-400 dark:text-slate-555 text-xs font-bold">{displayId || record.id}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Name</span>,
              dataIndex: 'name',
              render: (name, record) => (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-555 block mt-0.5">{record.email}</span>
                </div>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Clinic</span>,
              dataIndex: 'clinic',
              render: (clinic, record) => (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{clinic}</span>
                  <span className="text-[10px] text-slate-405 dark:text-slate-500 block mt-0.5">{record.phone}</span>
                </div>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Role</span>,
              dataIndex: 'role',
              render: (role) => (
                <Tag color={role === 'Admin' ? 'purple' : role === 'ClinicAdmin' ? 'blue' : 'cyan'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                  {role}
                </Tag>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Page permissions</span>,
              dataIndex: 'permissions',
              render: (permissions) => {
                const keys = Object.keys(permissions)
                return (
                  <div className="flex flex-wrap gap-1 max-w-[240px]">
                    {keys.slice(0, 3).map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                      >
                        {p}
                      </span>
                    ))}
                    {keys.length > 3 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-[#8C4BFF] hover:underline cursor-pointer">
                        +{keys.length - 3} more
                      </span>
                    )}
                  </div>
                )
              }
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Last login</span>,
              dataIndex: 'lastLogin',
              render: (l) => <span className="text-slate-605 dark:text-slate-350 text-xs font-semibold">{l}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Status</span>,
              dataIndex: 'status',
              render: (status) => (
                <Tag color={status === 'Active' ? 'success' : status === 'Suspended' ? 'error' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 select-none">
                  {status}
                </Tag>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Action</span>,
              key: 'actions',
              align: 'right',
              render: (_, record) => (
                <Space onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    icon={<InfoCircleOutlined className="text-slate-400" />}
                    onClick={() => {
                      setSelectedAdmin(record)
                      setShowProfile(true)
                    }}
                    className="hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg"
                  />
                  <Button
                    type="text"
                    icon={<EditOutlined className="text-slate-400" />}
                    onClick={() => startEditing(record)}
                    className="hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg"
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteAdmin(record)}
                    className="hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                  />
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* ── Add Admin Modal ── */}
      <Modal
        open={isAddOpen}
        onCancel={() => {
          setIsAddOpen(false)
          addForm.resetFields()
        }}
        footer={null}
        destroyOnHidden
        centered
        style={{ maxWidth: '92vw', width: 480 }}
        title={
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-white m-0 tracking-tight">Add Administrator</h2>
            <p className="text-slate-455 dark:text-slate-400 text-[11px] font-medium mt-0.5">Create a new platform admin and define their properties.</p>
          </div>
        }
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddAdminSubmit} initialValues={{ role: 'ClinicAdmin' }}>
          <Form.Item name="name" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Full Name *</span>} rules={[{ required: true, message: 'Please enter name' }]}>
            <Input placeholder="e.g. Sarah Jenkins" className="rounded-xl h-10" />
          </Form.Item>
          <Form.Item name="email" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Email Address *</span>} rules={[{ required: true, type: 'email', message: 'Enter valid email' }]}>
            <Input placeholder="sarah@example.com" className="rounded-xl h-10" />
          </Form.Item>
          <Form.Item name="password" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Login Password *</span>} rules={[{ required: true, message: 'Please enter a login password' }]}>
            <Input.Password placeholder="Set login password (e.g. Admin@2026)" className="rounded-xl h-10" />
          </Form.Item>
          <Form.Item name="clinic" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Clinic Name *</span>} rules={[{ required: true, message: 'Please enter clinic' }]}>
            <Input placeholder="e.g. Harbor Wellness" className="rounded-xl h-10" />
          </Form.Item>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item name="phone" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Phone Number</span>}>
              <Input placeholder="+61 2000 1000" className="rounded-xl h-10" />
            </Form.Item>
            <Form.Item name="role" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Role *</span>} rules={[{ required: true }]}>
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="ClinicAdmin">ClinicAdmin</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item className="mb-0 text-right mt-4">
            <Space className="w-full sm:w-auto justify-end">
              <button type="button" onClick={() => setIsAddOpen(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" style={{ backgroundColor: '#0E1B33' }} className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Add Admin</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
