import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Form, Input, Select, Space, Avatar, Timeline } from 'antd'
import {
  UserOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  LockOutlined,
  WarningOutlined,
  HistoryOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '@/api/axios'

const { Option } = Select

export default function HeadAdminUsers() {
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Stateful Users Data
  // Stateful Users Data
  const [usersList, setUsersList] = useState([])

  // Modals Visibility
  const [showProfile, setShowProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editUserForm] = Form.useForm()
  const editUserAvatarUrl = Form.useWatch('avatar', editUserForm)

  const backendFetch = async (endpoint, options = {}) => {
    const mainBase = API_BASE_URL
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      ...(options.headers || {}),
    }
    try {
      const res = await fetch(`${mainBase}/api${endpoint}`, {
        ...options,
        headers: authHeaders,
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
          headers: authHeaders,
        })
        if (res.ok) {
          window._activeBackendPort = port
          return await res.json()
        }
      } catch (e) {
        continue
      }
    }
    return null
  }

  const fetchUsersFromBackend = async () => {
    try {
      const json = await backendFetch('/super-admin/admins')
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped = json.data.map(u => ({
          id: u.id,
          displayId: u.displayId || `ADM-${u.id.slice(0, 6).toUpperCase()}`,
          name: u.name,
          email: u.email,
          contact: u.phone || '+61 400 000 000',
          clinic: u.clinic || 'ZealthOS Platform',
          status: u.status === 'ACTIVE' ? 'Active' : u.status === 'SUSPENDED' ? 'Pending' : u.status === 'INACTIVE' ? 'Inactive' : 'Active',
          type: u.role === 'SUPER_ADMIN' ? 'Super Admin' : u.role === 'CLINIC_ADMIN' ? 'Clinic Admin' : u.role === 'PRACTITIONER' ? 'Doctor' : u.role === 'SALES_EXECUTIVE' ? 'Salesperson' : 'Clinic Admin',
          subscription: u.subscription || u.tier || 'Basic',
          tier: u.tier || u.subscription || 'Basic',
          joined: u.joined || 'Aug 05, 2026',
          lastLogin: u.lastLogin || '5 Aug 2026, 20:04',
          address: u.address || 'Main Medical Center',
          avatar: u.avatar || '',
          raw: u
        }))
        setUsersList(mapped)
      }
    } catch (e) {
      console.error('Failed to fetch live users:', e)
    }
  }

  useEffect(() => {
    fetchUsersFromBackend()
  }, [])

  const handleEditUserSubmit = async (values) => {
    if (editingUser) {
      await backendFetch(`/super-admin/admins/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.contact,
          status: values.status,
          role: values.type
        })
      })
      toast.success('User updated successfully in database!')
    }
    setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...values } : u))
    if (selectedUser && selectedUser.id === editingUser.id) {
      setSelectedUser(prev => ({ ...prev, ...values }))
    }
    setEditingUser(null)
    editUserForm.resetFields()
    fetchUsersFromBackend()
  }

  const handleDeleteUser = async (user) => {
    if (!user) return
    await backendFetch(`/super-admin/admins/${user.id}`, {
      method: 'DELETE'
    })
    setUsersList(prev => prev.filter(u => u.id !== user.id))
    toast.success(`Deleted user ${user.name} from database!`)
    if (selectedUser && selectedUser.id === user.id) {
      setShowProfile(false)
      setSelectedUser(null)
    }
    fetchUsersFromBackend()
  }

  const startEditingUser = (user) => {
    setEditingUser(user)
    editUserForm.setFieldsValue({
      name: user.name,
      type: user.type,
      clinic: user.clinic,
      contact: user.contact,
      email: user.email,
      status: user.status,
      avatar: user.avatar || ''
    })
  }

  // Interactive Switch states for Permissions & Security
  const [billingAccess, setBillingAccess] = useState(true)
  const [aiAccess, setAiAccess] = useState(true)
  const [reportingAccess, setReportingAccess] = useState(false)
  const [whiteLabelAccess, setWhiteLabelAccess] = useState(false)
  const [adminPrivileges, setAdminPrivileges] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)

  const filtered = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchText.toLowerCase()) ||
      u.clinic.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase()) ||
      u.type.toLowerCase().includes(searchText.toLowerCase())

    const matchesType = typeFilter === 'All' || u.type === typeFilter
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const [profileTab, setProfileTab] = useState('Overview')

  if (editingUser) {
    return (
      <div className="bg-[#F8FAFC] dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingUser(null)}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-600 transition-colors bg-transparent"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-850 m-0 tracking-tight">Edit User</h1>
            <p className="text-slate-400 text-xs mt-0.5">Update details for {editingUser.name}.</p>
          </div>
        </div>

        <Form form={editUserForm} layout="vertical" onFinish={handleEditUserSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 mb-0">Personal details</h2>

            {/* Profile Photo URL / Avatar Preview */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <Avatar
                size={54}
                icon={<UserOutlined />}
                src={editUserAvatarUrl}
                style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}
                className="flex-shrink-0"
              />
              <Form.Item
                name="avatar"
                label={<span className="text-slate-655 text-xs font-bold">Profile Photo URL</span>}
                className="mb-0 flex-grow"
              >
                <Input placeholder="e.g. https://images.unsplash.com/photo-..." className="rounded-xl h-10 border-slate-200" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="name" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Full name *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200" />
              </Form.Item>
              <Form.Item name="email" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Email Address *</span>} rules={[{ required: true, type: 'email' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="contact" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Contact Phone *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200" />
              </Form.Item>
              <Form.Item name="clinic" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Clinic *</span>} rules={[{ required: true }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="type" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">User Type *</span>} rules={[{ required: true }]} className="mb-0">
                <Select className="rounded-xl h-10 flex items-center border-slate-200">
                  <Option value="Doctor">Doctor</Option>
                  <Option value="Physiotherapist">Physiotherapist</Option>
                  <Option value="Allied Health">Allied Health</Option>
                  <Option value="Receptionist">Receptionist</Option>
                  <Option value="Clinic Admin">Clinic Admin</Option>
                  <Option value="Salesperson">Salesperson</Option>
                  <Option value="Support Staff">Support Staff</Option>
                  <Option value="Super Admin">Super Admin</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Status *</span>} rules={[{ required: true }]} className="mb-0">
                <Select className="rounded-xl h-10 flex items-center border-slate-200">
                  <Option value="Active">Active</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
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

  if (showProfile && selectedUser) {
    return (
      <div className="space-y-6">
        {/* Navigation & Action Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => {
              setShowProfile(false)
              setSelectedUser(null)
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer"
          >
            <span className="text-sm">←</span>
            <span>Back to Users</span>
          </button>
          <div className="flex gap-2">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setShowProfile(false)
                startEditingUser(selectedUser)
              }}
              className="rounded-xl h-9 font-semibold text-xs border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              Edit User
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(selectedUser)}
              className="rounded-xl h-9 font-semibold text-xs"
            >
              Delete User
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 m-0">User profile</h1>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={selectedUser.avatar} size={72} style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}>
                {selectedUser.name.charAt(0)}
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 rounded-full p-1 shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px]">📷</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">{selectedUser.name}</h2>
              <div className="text-slate-450 text-xs font-semibold mt-1">
                User ID: {selectedUser.displayId || selectedUser.id} - {selectedUser.clinic}
              </div>
              <div className="flex gap-1.5 mt-2">
                <Tag color={selectedUser.status === 'Active' ? 'success' : selectedUser.status === 'Pending' ? 'warning' : 'default'} className="m-0 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">{selectedUser.status}</Tag>
                <Tag color="default" className="m-0 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">{selectedUser.type}</Tag>
                <Tag color="purple" className="m-0 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">{selectedUser.subscription || selectedUser.tier || 'Basic'}</Tag>
                <Tag className="m-0 border border-slate-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-transparent text-slate-500">Subscription</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 items-center">
            <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#8C4BFF]">
              <SafetyCertificateOutlined style={{ fontSize: 15 }} />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Account status</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">{selectedUser.status}</span>
              <span className="text-slate-400 text-[9px] font-medium block">{selectedUser.type}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 items-center">
            <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#8C4BFF]">
              <CalendarOutlined style={{ fontSize: 15 }} />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Joined</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">{selectedUser.joined || 'Jan 01, 2026'}</span>
              <span className="text-slate-400 text-[9px] font-medium block">Last login {selectedUser.lastLogin || '1 Jan 2026, 12:00'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 items-center">
            <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#8C4BFF]">
              <LockOutlined style={{ fontSize: 15 }} />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Two-factor auth</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">Off</span>
              <span className="text-slate-400 text-[9px] font-medium block">Enforced by admin</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 items-center">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <WarningOutlined style={{ fontSize: 15 }} />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Open security alerts</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">1</span>
              <span className="text-slate-400 text-[9px] font-medium block">2 tracked devices</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Menu */}
        <div className="flex gap-6 border-b border-slate-100 dark:border-slate-800 pb-1 mt-4">
          {['Overview', 'Permissions', 'Security', 'Activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setProfileTab(tab)}
              className={`pb-2 text-xs font-bold transition-all border-none bg-transparent cursor-pointer relative ${profileTab === tab
                  ? 'text-[#8C4BFF]'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <span className="flex items-center gap-1.5">
                {tab === 'Overview' && <UserOutlined style={{ fontSize: 12 }} />}
                {tab === 'Permissions' && <SafetyCertificateOutlined style={{ fontSize: 12 }} />}
                {tab === 'Security' && <LockOutlined style={{ fontSize: 12 }} />}
                {tab === 'Activity' && <HistoryOutlined style={{ fontSize: 12 }} />}
                <span>
                  {tab}
                </span>
                {tab === 'Security' && (
                  <span className="bg-rose-500 text-white rounded-full text-[9px] font-bold px-1.5 py-0.2">1</span>
                )}
              </span>
              {profileTab === tab && (
                <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-[#8C4BFF] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        {profileTab === 'Overview' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 mt-4" title={<span className="font-extrabold text-xs text-slate-705">User details</span>}>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 p-1">
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">User ID</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.displayId || selectedUser.id}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Legal name</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.name}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Display name</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.name}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Email</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Phone</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.contact}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">User type</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.type}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Clinic</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.clinic}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Subscription</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.subscription || selectedUser.tier || 'Basic'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Membership</div>
                <div className="text-slate-850 font-bold text-xs">Subscription</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Address</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.address || 'Main Medical Center'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Joined</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.joined || 'Jan 01, 2026'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Last login</div>
                <div className="text-slate-850 font-bold text-xs">{selectedUser.lastLogin || '1 Jan 2026, 12:00'}</div>
              </div>
            </div>
          </Card>
        )}

        {profileTab === 'Permissions' && (
          <div className="space-y-3 mt-4">
            <div className="text-slate-455 text-xs font-semibold">Page permissions</div>
            <div className="space-y-2">
              {[
                { name: 'Dashboard', value: 'Full access' },
                { name: 'User Management', value: billingAccess ? 'Full access' : 'No access' },
                { name: 'Clinic Management', value: adminPrivileges ? 'Full access' : 'No access' },
                { name: 'Subscription Manage', value: billingAccess ? 'Full access' : 'No access' },
                { name: 'Subscription Invoice', value: billingAccess ? 'Full access' : 'No access' },
                { name: 'Sales & Affiliates', value: reportingAccess ? 'Full access' : 'No access' },
                { name: 'AI Management', value: aiAccess ? 'Full access' : 'No access' },
                { name: 'Compliance & Audit', value: adminPrivileges ? 'Full access' : 'No access' },
                { name: 'Support Centre', value: 'Full access' },
                { name: 'Reports & Analytics', value: reportingAccess ? 'Full access' : 'No access' },
                { name: 'Settings', value: adminPrivileges ? 'Full access' : 'No access' },
              ].map((p) => (
                <div key={p.name} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{p.name}</span>
                  <span className={`text-[10px] font-bold px-3.5 py-1 rounded-full ${p.value === 'Full access' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'Security' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 mt-4" title={<span className="font-extrabold text-xs text-slate-705">Security Alerts & Devices</span>}>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl flex gap-3 items-center">
                <span className="text-red-500 text-lg">⚠️</span>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">Unrecognized Login Attempt</span>
                  <p className="text-slate-400 text-[10px] mt-0.5">Attempt from IP 203.0.113.42 was blocked.</p>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tracked Devices</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Windows PC (Chrome) &bull; Sydney, AU</span>
                    <Tag color="success">Active Now</Tag>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>iPhone 15 (App) &bull; Melbourne, AU</span>
                    <span className="text-slate-400">Last active 2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {profileTab === 'Activity' && (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 mt-4" title={<span className="font-extrabold text-xs text-slate-705">User Activity History</span>}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Logged in successfully</span>
                      <p className="text-slate-400 text-[10px] mt-0.5">Today at 1:45 PM from Chrome</p>
                    </div>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Updated profile information</span>
                      <p className="text-slate-400 text-[10px] mt-0.5">Yesterday at 10:30 AM</p>
                    </div>
                  )
                },
                {
                  color: 'purple',
                  children: (
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Assigned to {selectedUser.clinic}</span>
                      <p className="text-slate-400 text-[10px] mt-0.5">{selectedUser.joined || 'Recent'}</p>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0 tracking-tight">User Management</h1>
        </div>
      </div>

      {/* Search Bar & Filter Options */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search here"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="flex-1 rounded-xl h-10 border-slate-200 bg-white dark:bg-slate-900"
          prefix={<span className="text-slate-400 mr-2">🔍</span>}
        />
        <div className="flex gap-2">
          <Select value={typeFilter} onChange={setTypeFilter} className="min-w-36 rounded-xl h-10">
            <Option value="All">All User Types</Option>
            <Option value="Doctor">Doctor</Option>
            <Option value="Physiotherapist">Physiotherapist</Option>
            <Option value="Allied Health">Allied Health</Option>
            <Option value="Receptionist">Receptionist</Option>
            <Option value="Clinic Admin">Clinic Admin</Option>
            <Option value="Salesperson">Salesperson</Option>
            <Option value="Support Staff">Support Staff</Option>
            <Option value="Super Admin">Super Admin</Option>
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} className="min-w-36 rounded-xl h-10">
            <Option value="All">All Status</Option>
            <Option value="Active">Active</Option>
            <Option value="Pending">Pending</Option>
            <Option value="Inactive">Inactive</Option>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <Table
          dataSource={filtered}
          rowKey="id"
          scroll={{ x: 1000 }}
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
              setSelectedUser(record)
              setShowProfile(true)
            },
            style: { cursor: 'pointer' }
          })}
          className="border-none"
          columns={[
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User ID</span>,
              dataIndex: 'displayId',
              render: (displayId, record) => <span className="font-mono text-slate-450 text-xs font-bold">{displayId || record.id}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Name</span>,
              dataIndex: 'name',
              render: (name, record) => (
                <div className="flex items-center gap-2">
                  <Avatar src={record.avatar || null} size={28} style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}>
                    {name.charAt(0)}
                  </Avatar>
                  <span className="font-bold text-slate-808 text-xs">{name}</span>
                </div>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Type</span>,
              dataIndex: 'type',
              render: (type) => <span className="text-slate-605 text-xs font-semibold">{type}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinics</span>,
              dataIndex: 'clinic',
              render: (clinic) => <span className="text-slate-605 text-xs font-semibold">{clinic}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</span>,
              dataIndex: 'contact',
              render: (contact) => <span className="font-mono text-slate-500 text-xs">{contact}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>,
              dataIndex: 'email',
              render: (email) => <span className="text-slate-550 text-xs">{email}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>,
              dataIndex: 'status',
              render: (status) => (
                <Tag color={status === 'Active' ? 'success' : status === 'Pending' ? 'warning' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 select-none">
                  {status}
                </Tag>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</span>,
              key: 'actions',
              align: 'right',
              render: (_, record) => (
                <Space onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    icon={<EyeOutlined className="text-slate-400" />}
                    onClick={() => {
                      setSelectedUser(record)
                      setShowProfile(true)
                    }}
                    className="hover:bg-slate-50 dark:bg-slate-800 rounded-lg"
                  />
                  <Button
                    type="text"
                    icon={<EditOutlined className="text-slate-400" />}
                    onClick={() => startEditingUser(record)}
                    className="hover:bg-slate-50 dark:bg-slate-800 rounded-lg"
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteUser(record)}
                    className="hover:bg-red-50 rounded-lg"
                  />
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
