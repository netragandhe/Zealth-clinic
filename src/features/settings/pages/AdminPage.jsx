import React, { useState, useEffect } from 'react'
import { Table, Input, Select, Space, Modal, Form, Checkbox, Tag, Tooltip, Divider, Avatar } from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  UserOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '../../../store/clinicStore'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getBranches } from '../../calendar/api/clinicAdminApi'

const { Option } = Select

const ROLES = ['Super Admin', 'Clinic Admin', 'Admin', 'Manager', 'Receptionist', 'Billing Admin', 'View Only']

const ROLE_PRESETS = {
  'Super Admin': {
    manageAdmins: true,
    manageBranches: true,
    managePatients: true,
    manageDoctors: true,
    manageAppointments: true,
    manageInvoices: true,
    manageReports: true,
    manageSettings: true,
    viewOnly: false,
  },
  'Clinic Admin': {
    manageAdmins: true,
    manageBranches: true,
    managePatients: true,
    manageDoctors: true,
    manageAppointments: true,
    manageInvoices: true,
    manageReports: true,
    manageSettings: true,
    viewOnly: false,
  },
  Admin: {
    manageAdmins: true,
    manageBranches: true,
    managePatients: true,
    manageDoctors: true,
    manageAppointments: true,
    manageInvoices: true,
    manageReports: true,
    manageSettings: true,
    viewOnly: false,
  },
  Manager: {
    manageAdmins: false,
    manageBranches: false,
    managePatients: true,
    manageDoctors: true,
    manageAppointments: true,
    manageInvoices: true,
    manageReports: true,
    manageSettings: false,
    viewOnly: false,
  },
  Receptionist: {
    manageAdmins: false,
    manageBranches: false,
    managePatients: true,
    manageDoctors: false,
    manageAppointments: true,
    manageInvoices: false,
    manageReports: false,
    manageSettings: false,
    viewOnly: false,
  },
  'Billing Admin': {
    manageAdmins: false,
    manageBranches: false,
    managePatients: false,
    manageDoctors: false,
    manageAppointments: false,
    manageInvoices: true,
    manageReports: true,
    manageSettings: false,
    viewOnly: false,
  },
  'View Only': {
    manageAdmins: false,
    manageBranches: false,
    managePatients: false,
    manageDoctors: false,
    manageAppointments: false,
    manageInvoices: false,
    manageReports: false,
    manageSettings: false,
    viewOnly: true,
  },
}

const PERMISSION_LABELS = {
  manageAdmins: 'Manage Admins',
  manageBranches: 'Manage Branches',
  managePatients: 'Manage Patients',
  manageDoctors: 'Manage Doctors',
  manageAppointments: 'Manage Appointments',
  manageInvoices: 'Manage Invoices',
  manageReports: 'View Reports',
  manageSettings: 'Manage Settings',
  viewOnly: 'View Only Access',
}

const ROLE_COLORS = {
  'Super Admin': { bg: '#1E293B', text: '#E2E8F0', border: '#475569', darkBg: 'rgba(255, 255, 255, 0.1)', darkText: '#FFFFFF', darkBorder: 'rgba(255, 255, 255, 0.2)' },
  'Clinic Admin': { bg: '#F3EEFF', text: '#8C4BFF', border: '#8C4BFF', darkBg: 'rgba(140, 75, 255, 0.2)', darkText: '#A855F7', darkBorder: 'rgba(168, 85, 247, 0.3)' },
  Admin: { bg: '#F3EEFF', text: '#8C4BFF', border: '#8C4BFF', darkBg: 'rgba(140, 75, 255, 0.2)', darkText: '#A855F7', darkBorder: 'rgba(168, 85, 247, 0.3)' },
  Manager: { bg: '#E8F0FE', text: '#1A73E8', border: '#1A73E8', darkBg: 'rgba(26, 115, 232, 0.2)', darkText: '#60A5FA', darkBorder: 'rgba(96, 165, 250, 0.3)' },
  Receptionist: { bg: '#E6F7FF', text: '#0EA5E9', border: '#0EA5E9', darkBg: 'rgba(14, 165, 233, 0.2)', darkText: '#38BDF8', darkBorder: 'rgba(56, 189, 248, 0.3)' },
  'Billing Admin': { bg: '#FEF3C7', text: '#D97706', border: '#D97706', darkBg: 'rgba(217, 119, 6, 0.2)', darkText: '#FBBF24', darkBorder: 'rgba(251, 191, 36, 0.3)' },
  'View Only': { bg: '#F1F5F9', text: '#64748B', border: '#64748B', darkBg: 'rgba(100, 116, 139, 0.2)', darkText: '#94A3B8', darkBorder: 'rgba(148, 163, 184, 0.3)' },
}

export default function AdminPage() {
  const store = useClinicStore()
  const { darkMode } = store
  const navigate = useNavigate()

  const [adminList, setAdminList] = useState([])
  const admins = adminList
  const [branchList, setBranchList] = useState(store.branches || [])
  const branches = branchList
  const [loading, setLoading] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [roleFilter, setRoleFilter] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit' | 'view'
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [permissions, setPermissions] = useState({ ...ROLE_PRESETS.Manager })
  const [form] = Form.useForm()
  const avatarUrl = Form.useWatch('avatar', form)

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const res = await getAdmins()
      if (res && res.success && res.data) {
        setAdminList(res.data)
      } else if (store.admins && store.admins.length > 0) {
        setAdminList(store.admins)
      }
    } catch (err) {
      console.error("Failed to load admins from database:", err)
      if (store.admins && store.admins.length > 0) {
        setAdminList(store.admins)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      const res = await getBranches()
      if (res && res.success && res.data) {
        setBranchList(res.data)
      }
    } catch (err) {
      console.error("Failed to load branches:", err)
    }
  }

  useEffect(() => {
    loadAdmins()
    loadBranches()
  }, [])

  const openAdd = () => {
    setCurrentAdmin(null)
    setModalMode('add')
    setPermissions({ ...ROLE_PRESETS['Clinic Admin'] })
    form.resetFields()
    form.setFieldsValue({ role: 'Clinic Admin', status: 'Active' })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setCurrentAdmin(record)
    setModalMode('edit')
    setPermissions(record.permissions || { ...ROLE_PRESETS[record.role] || ROLE_PRESETS['Clinic Admin'] })
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: record.status,
      assignedBranches: record.assignedBranches || [],
      avatar: record.avatar || ''
    })
    setModalOpen(true)
  }

  const openView = (record) => {
    setCurrentAdmin(record)
    setModalMode('view')
    setPermissions(record.permissions || {})
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalMode('add')
    setCurrentAdmin(null)
    form.resetFields()
  }

  const handleRoleChange = (role) => {
    if (ROLE_PRESETS[role]) {
      setPermissions({ ...ROLE_PRESETS[role] })
    }
  }

  const handlePermissionChange = (key, checked) => {
    setPermissions((prev) => ({ ...prev, [key]: checked }))
  }

  const handleSubmit = async (values) => {
    const adminData = { ...values, permissions }
    try {
      if (modalMode === 'add') {
        const res = await createAdmin(adminData)
        if (res && res.success) {
          toast.success('Administrator added to live database!')
          if (store.addAdmin) store.addAdmin(res.data)
          await loadAdmins()
        } else {
          toast.error(res?.message || 'Failed to add administrator')
        }
      } else if (modalMode === 'edit') {
        const res = await updateAdmin(currentAdmin.id, adminData)
        if (res && res.success) {
          toast.success('Administrator updated in live database!')
          if (store.editAdmin) store.editAdmin({ ...currentAdmin, ...adminData })
          await loadAdmins()
        } else {
          toast.error(res?.message || 'Failed to update administrator')
        }
      }
    } catch (err) {
      console.error("Error saving admin:", err)
      toast.error('Error saving administrator to live database')
    }
    closeModal()
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Administrator?',
      content: `Are you sure you want to remove "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await deleteAdmin(record.id)
          if (res && res.success) {
            toast.success(`Removed admin: ${record.name}`)
            if (store.deleteAdmin) store.deleteAdmin(record.id)
            await loadAdmins()
          } else {
            toast.error(res?.message || 'Failed to delete admin')
          }
        } catch (err) {
          console.error("Failed to delete admin:", err)
          toast.error('Failed to delete admin from database')
        }
      },
    })
  }

  const filtered = adminList.filter((admin) => {
    const matchesSearch =
      (admin.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (admin.adminId || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (admin.role || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (admin.email || '').toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter ? admin.status === statusFilter : true
    const matchesRole = roleFilter ? admin.role === roleFilter : true
    return matchesSearch && matchesStatus && matchesRole
  })

  const columns = [
    {
      title: 'Admin ID',
      dataIndex: 'adminId',
      key: 'adminId',
      width: '12%',
      render: (text) => <span className="text-slate-400 font-semibold text-xs">{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '22%',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          {record.avatar ? (
            <img src={record.avatar} alt={text} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}
            >
              {(text || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{text}</div>
            <div className="text-slate-400 text-xs">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: '14%',
      render: (v) => <span className="text-slate-500 text-sm">{v}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: '16%',
      render: (role) => {
        const c = ROLE_COLORS[role] || { bg: '#E8F0FE', text: '#1A73E8', border: '#1A73E8', darkBg: 'rgba(26, 115, 232, 0.2)', darkText: '#60A5FA', darkBorder: 'rgba(96, 165, 250, 0.3)' }
        return (
          <span
            className="inline-flex px-3 py-1 rounded-full text-xs font-bold border transition-colors"
            style={{
              backgroundColor: darkMode ? c.darkBg : c.bg,
              color: darkMode ? c.darkText : c.text,
              borderColor: darkMode ? c.darkBorder : c.border
            }}
          >
            {role}
          </span>
        )
      },
    },
    {
      title: 'Branches',
      dataIndex: 'assignedBranches',
      key: 'assignedBranches',
      width: '16%',
      render: (branchIds) => {
        if (!branchIds || branchIds.length === 0)
          return <span className="text-slate-400 text-xs font-semibold italic">All Branches</span>
        const names = branchIds
          .map((bid) => branchList.find((b) => b.id === bid)?.name)
          .filter(Boolean)
        const visible = names.slice(0, 2)
        const extra = names.length - 2
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((n) => (
              <span
                key={n}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20"
              >
                {n}
              </span>
            ))}
            {extra > 0 && (
              <Tooltip title={names.slice(2).join(', ')}>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700 cursor-pointer">
                  +{extra}
                </span>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
            status === 'Active' ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20' : 'bg-[#EEF2F6] text-[#64748B] dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openView(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF] transition-colors"
            >
              <InfoCircleOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
          <Tooltip title="Edit Admin">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openEdit(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF] transition-colors"
            >
              <EditOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
          <Tooltip title="Delete Admin">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-red-500 transition-colors"
            >
              <DeleteOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const itemRender = (current, type, originalElement) => {
    if (type === 'prev') return <span className="text-slate-500 font-semibold cursor-pointer">&lt; Previous</span>
    if (type === 'next') return <span className="text-slate-500 font-semibold cursor-pointer">Next &gt;</span>
    return originalElement
  }

  if (modalOpen && (modalMode === 'edit' || modalMode === 'add')) {
    const isEdit = modalMode === 'edit'
    return (
      <div className="bg-[#F8FAFC] dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6 animate-slide-in">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={closeModal}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-350 transition-colors bg-transparent"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-850 dark:text-white m-0 tracking-tight">
              {isEdit ? 'Edit admin' : 'Add admin'}
            </h1>
            <p className="text-slate-400 dark:text-slate-455 text-xs mt-0.5">
              {isEdit 
                ? `Update ${currentAdmin?.name} details and adjust page-level access.` 
                : 'Create a new admin user and set their permissions.'}
            </p>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-6">
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
                <Input placeholder="e.g. https://images.unsplash.com/photo-..." className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="name" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Full name *</span>} rules={[{ required: true, message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
              <Form.Item name="assignedBranches" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Assign Branches</span>} className="mb-0">
                <Select
                  mode="multiple"
                  placeholder="Select branches..."
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  className="rounded-xl flex items-center min-h-[40px] dark:bg-slate-900 border-slate-200 dark:border-slate-850"
                >
                  {branchList.map((b) => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="email" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Email *</span>} rules={[{ required: true, type: 'email', message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
              <Form.Item name="phone" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Phone *</span>} rules={[{ required: true, message: 'Required' }]} className="mb-0">
                <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="role" hidden initialValue="Clinic Admin">
                <Input />
              </Form.Item>
              <Form.Item name="status" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Status *</span>} rules={[{ required: true }]} className="mb-0 col-span-2">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
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
                  Object.keys(permissions).forEach(k => cleared[k] = false)
                  setPermissions(cleared)
                }}
                className="text-xs text-[#8C4BFF] font-bold border-none bg-transparent hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column */}
              <div className="space-y-3">
                {[
                  { key: 'manageAdmins', label: 'Manage Admins' },
                  { key: 'manageBranches', label: 'Manage Branches' },
                  { key: 'managePatients', label: 'Manage Patients' },
                  { key: 'manageDoctors', label: 'Manage Doctors' },
                  { key: 'manageSettings', label: 'Manage Settings' }
                ].map(p => (
                  <div key={p.key} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                    <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                      <Checkbox 
                        checked={!!permissions[p.key]}
                        onChange={(e) => handlePermissionChange(p.key, e.target.checked)}
                        className="custom-purple-checkbox"
                      />
                      <span>{p.label}</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                {[
                  { key: 'manageAppointments', label: 'Manage Appointments' },
                  { key: 'manageInvoices', label: 'Manage Invoices' },
                  { key: 'manageReports', label: 'View Reports' },
                  { key: 'viewOnly', label: 'View Only Access' }
                ].map(p => (
                  <div key={p.key} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                    <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                      <Checkbox 
                        checked={!!permissions[p.key]}
                        onChange={(e) => handlePermissionChange(p.key, e.target.checked)}
                        className="custom-purple-checkbox"
                      />
                      <span>{p.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={closeModal} 
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

  if (modalMode === 'view' && currentAdmin) {
    return (
      <div className="space-y-6 animate-slide-in">
        {/* Navigation & Action Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={closeModal}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer"
          >
            <span className="text-sm">←</span>
            <span>Back to Admins</span>
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                closeModal()
                openEdit(currentAdmin)
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold h-9 rounded-xl cursor-pointer text-xs transition-colors flex items-center gap-1.5"
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Admin</span>
            </button>
            <button 
              onClick={() => {
                closeModal()
                handleDelete(currentAdmin)
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-655 text-white font-bold h-9 rounded-xl cursor-pointer border-none text-xs transition-colors flex items-center gap-1.5"
            >
              <DeleteOutlined style={{ fontSize: 13 }} />
              <span>Delete Admin</span>
            </button>
          </div>
        </div>

        {/* Profile Banner */}
        <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-[#8C4BFF] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            <UserOutlined style={{ fontSize: 200 }} />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#8C4BFF] bg-white dark:bg-slate-900 font-bold text-2xl flex-shrink-0 shadow-sm overflow-hidden">
              {currentAdmin.avatar ? (
                <img src={currentAdmin.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (currentAdmin.name || '?')[0].toUpperCase()
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold m-0 text-white leading-none">{currentAdmin.name}</h2>
              <p className="text-xs text-white/80 m-0 mt-1">{currentAdmin.email} &bull; {currentAdmin.phone || 'No phone'}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    background: (ROLE_COLORS[currentAdmin.role] || {}).bg || '#E8F0FE',
                    color: (ROLE_COLORS[currentAdmin.role] || {}).text || '#1A73E8',
                  }}
                >
                  {currentAdmin.role}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    currentAdmin.status === 'Active' ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
                  }`}
                >
                  {currentAdmin.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details and Permissions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5">Administrator Profile Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Admin ID</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentAdmin.adminId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Join Date</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentAdmin.joinDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Email Address</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentAdmin.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Phone Number</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentAdmin.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Assigned Branches</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(currentAdmin.assignedBranches || []).length === 0 ? (
                      <span className="text-slate-400 text-xs font-semibold italic mt-1 block">All Branches (Unassigned)</span>
                    ) : (
                      (currentAdmin.assignedBranches || []).map((bid) => {
                        const br = branchList.find((b) => b.id === bid)
                        return (
                          <span
                            key={bid}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20"
                          >
                            {br ? br.name : bid}
                          </span>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Permissions</h3>
              <div className="space-y-2">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                  const granted = currentAdmin.permissions?.[key]
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                        granted ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#F8FAFC] dark:bg-slate-900 text-slate-300 dark:bg-slate-950/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          granted ? 'bg-[#10B981]' : 'bg-slate-300'
                        }`}
                      />
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="documents-page-container py-2 space-y-6">
      <button 
        onClick={() => navigate('/clinic')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer mb-2 transition-colors w-fit"
      >
        <span className="text-sm">←</span>
        <span>Back to Dashboard</span>
      </button>
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Admin Manage</h1>
          <p className="text-slate-400 dark:text-slate-400 text-xs mt-1 font-semibold">
            Manage admin users, roles &amp; permissions
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search name, ID, role, email..."
            prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 border border-slate-200 rounded-xl"
            style={{ width: 240 }}
          />
          <Select
            placeholder="Role"
            allowClear
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 140, height: 40 }}
          >
            {ROLES.map((r) => (
              <Option key={r} value={r}>{r}</Option>
            ))}
          </Select>
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 110, height: 40 }}
          >
            <Option value="Active">Active</Option>
            <Option value="Inactive">Inactive</Option>
          </Select>
          <button
            onClick={openAdd}
            className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-sm transition-colors"
          >
            <PlusOutlined style={{ fontSize: 13 }} />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Admins', value: adminList.length, icon: <UserOutlined />, color: '#8C4BFF' },
          { label: 'Active', value: adminList.filter((a) => a.status === 'Active').length, icon: <SafetyCertificateOutlined />, color: '#10B981' },
          { label: 'Inactive', value: adminList.filter((a) => a.status === 'Inactive').length, icon: <SettingOutlined />, color: '#64748B' },
          { label: 'Branches', value: branchList.length, icon: <BankOutlined />, color: '#0E1B33' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ background: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0E1B33] dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-450 dark:text-slate-400 font-semibold">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden reports-card">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          className="border-none"
          onRow={(record) => ({
            onClick: () => {
              openView(record)
            },
            style: { cursor: 'pointer' }
          })}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => (
              <span className="text-slate-400 font-bold text-xs select-none">
                Showing {range[0]}-{range[1]} out of {total}
              </span>
            ),
            itemRender,
          }}
        />
      </div>

      {/* Add / Edit / View Modal */}
      <Modal
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
        width="100%"
        style={{ top: 0, padding: 0, margin: 0, maxWidth: '100vw' }}
        styles={{ body: { minHeight: '100vh', padding: '28px 36px' } }}
      >


        {/* ADD / EDIT MODE */}
        {modalMode !== 'view' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">
                {modalMode === 'add' ? 'Add New Admin' : 'Edit Admin'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {modalMode === 'add'
                  ? 'Fill in details and set permissions for the new administrator.'
                  : 'Update admin details, role, and permissions.'}
              </p>
            </div>

            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              {/* Profile Photo URL / Avatar Preview */}
              <div className="flex items-center gap-4 mb-5 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <Avatar 
                  size={54} 
                  icon={<UserOutlined />} 
                  src={avatarUrl} 
                  style={{ background: 'linear-gradient(135deg, #8C4BFF, #0E1B33)' }}
                  className="flex-shrink-0"
                />
                <Form.Item
                  name="avatar"
                  label={<span className="text-slate-650 dark:text-slate-300 text-xs font-bold">Profile Photo URL</span>}
                  className="mb-0 flex-grow"
                >
                  <Input placeholder="e.g. https://images.unsplash.com/photo-..." className="rounded-xl h-10" />
                </Form.Item>
              </div>

              {/* Basic Info */}
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="e.g. Alex Sadman" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
                >
                  <Input placeholder="admin@domain.com" />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Phone"
                  rules={[{ required: true, message: 'Phone required' }]}
                >
                  <Input placeholder="+1 555-0199" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Form.Item name="role" hidden initialValue="Clinic Admin">
                  <Input />
                </Form.Item>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Select status' }]}
                >
                  <Select>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* Branch Assignment */}
              <Form.Item name="assignedBranches" label="Assign Branches">
                <Select
                  mode="multiple"
                  placeholder="Select one or more branches..."
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {branches.map((b) => (
                    <Option key={b.id} value={b.id}>{b.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Permissions */}
              <Divider className="my-3" />
              <div className="mb-3">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Permissions</div>
                <div className="text-xs text-slate-400 mb-3">
                  Auto-filled by role — customise as needed.
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={!!permissions[key]}
                      onChange={(e) => handlePermissionChange(key, e.target.checked)}
                      className="text-sm text-slate-600"
                    >
                      {label}
                    </Checkbox>
                  ))}
                </div>
              </div>

              <Divider className="my-3" />

              <Form.Item className="mb-0 text-right mt-4">
                <Space size="middle">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-none text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white border-none font-bold h-10 px-6 rounded-xl cursor-pointer shadow-md transition-colors"
                  >
                    {modalMode === 'add' ? 'Add Admin' : 'Save Changes'}
                  </button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
