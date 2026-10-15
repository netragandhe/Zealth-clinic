import React, { useState } from 'react'
import { Table, Modal, Form, Input, Select, Space, Tooltip, InputNumber } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined,
  CheckCircleOutlined, PauseCircleOutlined, StopOutlined,
  PlayCircleOutlined, BankOutlined, UserOutlined, CloudOutlined,
  TeamOutlined, CrownOutlined, ThunderboltOutlined, RocketOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../store/clinicStore'

const { Option } = Select

const STATUS_STYLES = {
  Active:    { bg: '#F0FDF4', text: '#10B981', icon: <CheckCircleOutlined /> },
  Suspended: { bg: '#FEF2F2', text: '#EF4444', icon: <StopOutlined /> },
  Trial:     { bg: '#FEF3C7', text: '#D97706', icon: <PlayCircleOutlined /> },
  Inactive:  { bg: '#F1F5F9', text: '#64748B', icon: <PauseCircleOutlined /> },
}

const PLAN_COLORS = { Starter: '#3B82F6', Growth: '#8C4BFF', Enterprise: '#0E1B33' }
const PLAN_ICONS = { Starter: <RocketOutlined />, Growth: <ThunderboltOutlined />, Enterprise: <CrownOutlined /> }

function QuotaBar({ used, limit }) {
  if (limit === -1) return <span className="text-[#10B981] font-bold text-xs">∞ Unlimited</span>
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 font-semibold">{used}/{limit}</span>
        <span style={{ color }} className="font-bold">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function TenantPage() {
  const { tenants, addTenant, editTenant, deleteTenant, setTenantStatus } = useClinicStore()

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [viewModal, setViewModal] = useState(false)
  const [currentTenant, setCurrentTenant] = useState(null)
  const [form] = Form.useForm()
  const [quotaForm] = Form.useForm()
  const [quotaModal, setQuotaModal] = useState(false)

  const openAdd = () => {
    setCurrentTenant(null)
    setModalMode('add')
    form.resetFields()
    form.setFieldsValue({ plan: 'Starter', status: 'Trial' })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setCurrentTenant(record)
    setModalMode('edit')
    form.setFieldsValue({ name: record.name, owner: record.owner, email: record.email, plan: record.plan, status: record.status })
    setModalOpen(true)
  }

  const openQuota = (record) => {
    setCurrentTenant(record)
    quotaForm.setFieldsValue({ ...record.quotas })
    setQuotaModal(true)
  }

  const handleSubmit = (values) => {
    if (modalMode === 'add') {
      addTenant(values)
      toast.success('Tenant workspace created!')
    } else {
      editTenant({ ...currentTenant, ...values })
      toast.success('Tenant updated!')
    }
    setModalOpen(false)
  }

  const handleQuotaSave = (values) => {
    editTenant({ ...currentTenant, quotas: values })
    setQuotaModal(false)
    toast.success(`Quotas updated for ${currentTenant.name}`)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Tenant Workspace?',
      content: `This will permanently remove "${record.name}" and all associated data.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => { deleteTenant(record.id); toast.success('Tenant deleted.') },
    })
  }

  const handleStatusChange = (record, newStatus) => {
    setTenantStatus(record.id, newStatus)
    toast.success(`${record.name} is now ${newStatus}.`)
  }

  const filtered = tenants.filter((t) => {
    const q = searchText.toLowerCase()
    const match = (t.name || '').toLowerCase().includes(q) || (t.owner || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q)
    const matchStatus = statusFilter ? t.status === statusFilter : true
    return match && matchStatus
  })

  const columns = [
    {
      title: 'Workspace',
      key: 'workspace',
      width: '24%',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: PLAN_COLORS[r.plan] || '#8C4BFF' }}>
            {(r.name || '?')[0]}
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{r.name}</div>
            <div className="text-slate-400 text-xs">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      width: '12%',
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20">
          {PLAN_ICONS[p]} {p}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '12%',
      render: (s) => {
        const st = STATUS_STYLES[s] || STATUS_STYLES.Inactive
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: st.bg, color: st.text }}>
            {st.icon} {s}
          </span>
        )
      },
    },
    {
      title: 'Quota Usage',
      key: 'quota',
      width: '28%',
      render: (_, r) => (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TeamOutlined className="flex-shrink-0" />
            <span className="w-20 font-semibold">Practitioners</span>
            <div className="flex-1"><QuotaBar used={r.usage.practitioners} limit={r.quotas.practitioners} /></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserOutlined className="flex-shrink-0" />
            <span className="w-20 font-semibold">Patients</span>
            <div className="flex-1"><QuotaBar used={r.usage.patients} limit={r.quotas.patients} /></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CloudOutlined className="flex-shrink-0" />
            <span className="w-20 font-semibold">Storage</span>
            <div className="flex-1"><QuotaBar used={r.usage.storage} limit={r.quotas.storage} /></div>
          </div>
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: '10%',
      render: (v) => <span className="text-slate-500 text-xs">{v}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '14%',
      align: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status !== 'Active' && (
            <Tooltip title="Activate">
              <button onClick={() => handleStatusChange(record, 'Active')} className="bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#10B981] border-none px-2 py-1 rounded-lg text-xs font-bold cursor-pointer">
                Activate
              </button>
            </Tooltip>
          )}
          {record.status === 'Active' && (
            <Tooltip title="Suspend">
              <button onClick={() => handleStatusChange(record, 'Suspended')} className="bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border-none px-2 py-1 rounded-lg text-xs font-bold cursor-pointer">
                Suspend
              </button>
            </Tooltip>
          )}
          <Tooltip title="Allocate Quotas">
            <button onClick={() => openQuota(record)} className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF]">
              <BankOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
          <Tooltip title="Edit">
            <button onClick={() => openEdit(record)} className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF]">
              <EditOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button onClick={() => handleDelete(record)} className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-red-500">
              <DeleteOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const statuses = ['Active', 'Suspended', 'Trial', 'Inactive']

  return (
    <div className="documents-page-container py-2 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Multi-Tenant Workspaces</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Activate, suspend &amp; manage workspace quotas across all tenants</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Input.Search
            placeholder="Search workspace, owner, email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, height: 40 }}
            className="rounded-xl border-slate-200"
          />
          <Select placeholder="Status" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 120, height: 40 }}>
            {statuses.map((s) => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <button onClick={openAdd} className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none text-sm shadow-sm">
            <PlusOutlined /> Add Tenant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Workspaces', value: tenants.length, color: '#8C4BFF', icon: <BankOutlined /> },
          { label: 'Active', value: tenants.filter((t) => t.status === 'Active').length, color: '#10B981', icon: <CheckCircleOutlined /> },
          { label: 'Suspended', value: tenants.filter((t) => t.status === 'Suspended').length, color: '#EF4444', icon: <StopOutlined /> },
          { label: 'Trial', value: tenants.filter((t) => t.status === 'Trial').length, color: '#D97706', icon: <PlayCircleOutlined /> },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base" style={{ background: s.color }}>{s.icon}</div>
            <div>
              <div className="text-2xl font-extrabold text-[#0E1B33] dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <Table dataSource={filtered} columns={columns} rowKey="id" className="border-none"
          pagination={{ pageSize: 8, showTotal: (total, range) => <span className="text-slate-400 font-bold text-xs">Showing {range[0]}-{range[1]} of {total}</span> }}
        />
      </div>

      {/* Add/Edit Tenant Modal */}
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden width={460} className="documents-modal">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">{modalMode === 'add' ? 'Add Tenant Workspace' : 'Edit Tenant'}</h2>
          <p className="text-slate-400 text-xs mt-1">Fill in workspace details to {modalMode === 'add' ? 'create' : 'update'} the tenant.</p>
        </div>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="name" label="Workspace Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. ZealthOS Main" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="owner" label="Owner Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Alex Sadman" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="admin@workspace.com" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="plan" label="Plan">
              <Select>
                <Option value="Starter">Starter</Option>
                <Option value="Growth">Growth</Option>
                <Option value="Enterprise">Enterprise</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select>
                {statuses.map((s) => <Option key={s} value={s}>{s}</Option>)}
              </Select>
            </Form.Item>
          </div>
          <Form.Item className="mb-0 text-right mt-4">
            <Space>
              <button type="button" onClick={() => setModalOpen(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">{modalMode === 'add' ? 'Create Workspace' : 'Save Changes'}</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Quota Allocation Modal */}
      <Modal open={quotaModal} onCancel={() => setQuotaModal(false)} footer={null} destroyOnHidden width={440} className="documents-modal">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Allocate Usage Quotas</h2>
          <p className="text-slate-400 text-xs mt-1">Set resource limits for <strong>{currentTenant?.name}</strong>. Enter -1 for unlimited.</p>
        </div>
        <Form layout="vertical" form={quotaForm} onFinish={handleQuotaSave}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'practitioners', label: 'Practitioners' },
              { name: 'patients', label: 'Patients' },
              { name: 'storage', label: 'Storage (GB)' },
              { name: 'branches', label: 'Branches' },
            ].map((f) => (
              <Form.Item key={f.name} name={f.name} label={f.label} rules={[{ required: true }]}>
                <InputNumber min={-1} className="w-full" placeholder="-1 for unlimited" />
              </Form.Item>
            ))}
          </div>
          <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-xl p-3 text-xs text-slate-500 font-semibold mb-4">
            <ExclamationCircleOutlined className="mr-1.5" /> Enter -1 to grant unlimited access for any quota.
          </div>
          <Form.Item className="mb-0 text-right">
            <Space>
              <button type="button" onClick={() => setQuotaModal(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Save Quotas</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
