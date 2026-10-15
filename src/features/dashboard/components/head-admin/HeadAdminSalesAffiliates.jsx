import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Table, Card, Button, Tag, Space, Slider, Modal } from 'antd'
import {
  TeamOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

const { Option } = Select

export default function HeadAdminSalesAffiliates() {
  const store = useClinicStore()
  const clinics = store.clinics || []

  const [salesList, setSalesList] = useState([])
  const [affiliatesList, setAffiliatesList] = useState([])
  const [leadsList, setLeadsList] = useState([])
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('Sales User Management')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')

  // Modals Visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditSalesOpen, setIsEditSalesOpen] = useState(false)
  const [editingSalesUser, setEditingSalesUser] = useState(null)
  const [isCreateAffiliateOpen, setIsCreateAffiliateOpen] = useState(false)
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false)

  const [createForm] = Form.useForm()
  const [editSalesForm] = Form.useForm()
  const [createAffiliateForm] = Form.useForm()
  const [createLeadForm] = Form.useForm()

  const handleOpenEditSalesUser = (record) => {
    setEditingSalesUser(record)
    editSalesForm.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      territory: record.territory,
      tier: record.tier || 'Silver',
      commission: record.commissionRate || 10,
      status: record.status || 'Active'
    })
    setIsEditSalesOpen(true)
  }

  const handleEditSalesUserSubmit = async (values) => {
    if (!editingSalesUser) return
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        territory: values.territory || 'General Platform',
        tier: values.tier || 'Silver',
        commissionRate: parseFloat(values.commission) || 10.0,
        commission: `${values.commission || '10'}% recurring`,
        status: values.status || 'Active'
      }

      const res = await api.put(`/api/super-admin/sales-users/${editingSalesUser.id}`, payload)
      if (res.data?.success) {
        toast.success(`Sales account ${values.name} updated successfully!`)
        setSalesList(prev => prev.map(s => s.id === editingSalesUser.id ? { ...s, ...payload } : s))
        setIsEditSalesOpen(false)
        setEditingSalesUser(null)
      }
    } catch (err) {
      toast.error('Failed to update sales account')
    }
  }

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const [usersRes, affRes, leadsRes] = await Promise.all([
        api.get('/api/super-admin/sales-users').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/super-admin/affiliates').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/super-admin/sales-leads').catch(() => ({ data: { success: false, data: [] } }))
      ])

      if (usersRes.data?.success) {
        setSalesList(usersRes.data.data)
        store.setSalesList(usersRes.data.data)
      }
      if (affRes.data?.success) {
        setAffiliatesList(affRes.data.data)
      }
      if (leadsRes.data?.success) {
        setLeadsList(leadsRes.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch sales data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesData()
  }, [])

  const handleCreateSubmit = async (values) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        territory: values.territory || 'General Platform',
        tier: values.tier || 'Silver',
        commissionRate: parseFloat(values.commission) || 10.0,
        commission: `${values.commission || '10'}% recurring`,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      }

      const res = await api.post('/api/super-admin/sales-users', payload)
      if (res.data?.success) {
        const created = res.data.data
        toast.success(`Account ${created.displayId || ''} created for ${values.name}!`)
        setSalesList(prev => [created, ...prev])
        store.setSalesList([created, ...salesList])
        setIsCreateOpen(false)
        createForm.resetFields()
      } else {
        toast.error(res.data?.message || 'Failed to create sales account')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating sales account')
    }
  }

  // Create Affiliate Partner
  const handleCreateAffiliateSubmit = async (values) => {
    try {
      const payload = {
        partner: values.partner,
        rep: values.rep,
        commissionRate: values.commissionRate ? `${values.commissionRate}%` : '15%',
        referralsCount: parseInt(values.referralsCount) || 0,
        totalPayout: parseFloat(values.totalPayout) || 0.0,
        status: 'Active'
      }

      const res = await api.post('/api/super-admin/affiliates', payload)
      if (res.data?.success) {
        const created = res.data.data
        toast.success(`Affiliate ${created.displayId || ''} added for ${values.partner}!`)
        setAffiliatesList(prev => [created, ...prev])
        setIsCreateAffiliateOpen(false)
        createAffiliateForm.resetFields()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding affiliate')
    }
  }

  // Create Sales Lead
  const handleCreateLeadSubmit = async (values) => {
    try {
      const payload = {
        companyName: values.companyName,
        contactPerson: values.contactPerson || values.companyName,
        email: values.email,
        phone: values.phone || null,
        value: parseFloat(values.value) || 0.0,
        assignedTo: values.assignedTo || 'Unassigned',
        territory: values.territory || 'General Platform',
        stage: values.stage || 'New Lead',
        status: 'New'
      }

      const res = await api.post('/api/super-admin/sales-leads', payload)
      if (res.data?.success) {
        const created = res.data.data
        toast.success(`Lead ${created.displayId || ''} added for ${values.companyName}!`)
        setLeadsList(prev => [created, ...prev])
        setIsCreateLeadOpen(false)
        createLeadForm.resetFields()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating lead')
    }
  }

  // Delete Sales User
  const handleDeleteSalesUser = async (id, name) => {
    try {
      await api.delete(`/api/super-admin/sales-users/${id}`)
      setSalesList(prev => prev.filter(s => s.id !== id))
      toast.success(`Sales user ${name} deleted successfully!`)
    } catch (err) {
      toast.error('Failed to delete sales user')
    }
  }

  // Delete Affiliate
  const handleDeleteAffiliate = async (id, partner) => {
    try {
      await api.delete(`/api/super-admin/affiliates/${id}`)
      setAffiliatesList(prev => prev.filter(a => a.id !== id))
      toast.success(`Affiliate ${partner} deleted successfully!`)
    } catch (err) {
      toast.error('Failed to delete affiliate')
    }
  }

  const filteredSales = salesList.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchText.toLowerCase()) || 
                          (s.email || '').toLowerCase().includes(searchText.toLowerCase()) || 
                          (s.territory || '').toLowerCase().includes(searchText.toLowerCase()) ||
                          (s.displayId || '').toLowerCase().includes(searchText.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter
    const matchesTier = tierFilter === 'All' || s.tier === tierFilter

    return matchesSearch && matchesStatus && matchesTier
  })

  const [globalRate, setGlobalRate] = useState(15)
  const tabsList = ['Sales User Management', 'Commission Dashboard']

  // Colin Edegbe calculations from store clinics
  const colinClinics = clinics.filter(c => c.salesperson === 'Colin Edegbe')
  const colinCommissions = colinClinics.map(c => {
    const rate = 0.12
    const commissionVal = (c.revenue || 0) * rate
    return {
      clinicId: c.id,
      clinicName: c.name,
      tier: c.tier || 'Basic',
      revenue: c.revenue || 0,
      commission: commissionVal,
      status: c.commissionStatus || 'Pending',
      date: c.signupDate || 'Recently',
      paidDate: c.commissionPaidDate
    }
  })

  const colinTotalPending = colinCommissions.filter(c => c.status === 'Pending').reduce((acc, curr) => acc + curr.commission, 0)
  const colinTotalPaid = colinCommissions.filter(c => c.status === 'Paid').reduce((acc, curr) => acc + curr.commission, 0)

  const handleMarkPaid = (clinicId) => {
    const today = new Date().toISOString().split('T')[0]
    store.setClinicCommissionStatus(clinicId, 'Paid', today)
    toast.success('Commission marked as Paid!')
  }

  // Dynamic Pipeline Columns from database leads
  const pipelineColumns = {
    'New Leads': leadsList.filter(l => l.stage === 'New Lead' || l.stage === 'Lead Registered' || !l.stage),
    'In Progress': leadsList.filter(l => ['Discovery Call', 'Demo Scheduled', 'Negotiating', 'Proposal Sent', 'In Progress'].includes(l.stage)),
    'Closed Won': leadsList.filter(l => ['Converted', 'Closed Won'].includes(l.stage))
  }

  // Dynamic Metrics
  const activeSalesCount = salesList.filter(s => s.status === 'Active').length
  const inactiveSalesCount = salesList.filter(s => s.status !== 'Active').length
  const avgCommissionCalc = salesList.length > 0
    ? (salesList.reduce((sum, s) => sum + (Number(s.commissionRate) || 10), 0) / salesList.length).toFixed(1)
    : '12.2'

  return (
    <div className="space-y-6">
      
      {/* ── Title Header ── */}
      <div>
        <h1 className="text-xl font-bold text-slate-850 dark:text-white m-0 tracking-tight">Sales Management</h1>
        <p className="text-slate-400 dark:text-slate-450 text-xs mt-1">Sales accounts and commission rules management</p>
      </div>

      {/* ── Horizontal Navigation Tabs ── */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1.5 pb-0">
        {tabsList.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border-none bg-transparent cursor-pointer rounded-t-xl -mb-[1px] ${
              activeTab === tab 
                ? 'bg-purple-100 dark:bg-purple-950/40 text-[#8C4BFF] border-b-2 border-[#8C4BFF]' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'Sales User Management' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total sales users</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">{salesList.length}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500">
                <TeamOutlined style={{ fontSize: 14 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">{activeSalesCount}</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">
                  {inactiveSalesCount} inactive
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                <LineChartOutlined style={{ fontSize: 14 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg commission</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">{avgCommissionCalc}%</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-[#8C4BFF]">
                <SafetyCertificateOutlined style={{ fontSize: 14 }} />
              </div>
            </div>
          </div>

          {/* Table Directory */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="shrink-0">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">Sales accounts</h2>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
                  {filteredSales.length} of {salesList.length} · territory + tier + activity
                </p>
              </div>

              {/* Search in Middle */}
              <div className="flex-1 max-w-md w-full md:mx-4">
                <Input
                  placeholder="Search name, email, territory..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="w-full rounded-xl h-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  prefix={<span className="text-slate-400 mr-1">🔍</span>}
                />
              </div>

              {/* Filters and Action Button on Right Corner */}
              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full md:w-auto shrink-0">
                <Select value={statusFilter} onChange={setStatusFilter} className="min-w-28 rounded-xl h-9">
                  <Option value="All">All statuses</Option>
                  <Option value="Active">Active</Option>
                  <Option value="Onboarding">Onboarding</Option>
                  <Option value="Paused">Paused</Option>
                </Select>
                <Select value={tierFilter} onChange={setTierFilter} className="min-w-28 rounded-xl h-9">
                  <Option value="All">All tiers</Option>
                  <Option value="Platinum">Platinum</Option>
                  <Option value="Gold">Gold</Option>
                  <Option value="Silver">Silver</Option>
                  <Option value="Bronze">Bronze</Option>
                </Select>
                <Button 
                  type="primary" 
                  onClick={() => setIsCreateOpen(true)}
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                  className="rounded-xl font-bold text-xs h-9 px-4 flex items-center gap-1.5 text-white"
                >
                  <span>+ Create account</span>
                </Button>
              </div>
            </div>

            <Table
              dataSource={filteredSales}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 850 }}
              className="border-none"
              columns={[
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Display ID</span>,
                  dataIndex: 'displayId',
                  render: (id) => <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">{id || 'SLS-000001'}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Sales user</span>,
                  dataIndex: 'name',
                  render: (name, record) => (
                    <div className="flex items-center gap-2.5">
                      <img src={record.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 block mt-0.5">{record.email}</span>
                      </div>
                    </div>
                  )
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Territory</span>,
                  dataIndex: 'territory',
                  render: (t) => <span className="text-slate-605 dark:text-slate-350 text-xs font-semibold">{t || 'General Platform'}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Tier</span>,
                  dataIndex: 'tier',
                  render: (tier) => (
                    <Tag color={tier === 'Platinum' ? 'purple' : tier === 'Gold' ? 'orange' : tier === 'Silver' ? 'blue' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {tier || 'Silver'}
                    </Tag>
                  )
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Commission</span>,
                  dataIndex: 'commission',
                  render: (c, r) => <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{c || `${r.commissionRate || 10}% recurring`}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Clinics</span>,
                  dataIndex: 'clinicsCount',
                  render: (c, r) => {
                    const count = r.name === 'Colin Edegbe' ? colinClinics.length : (c || 0)
                    return <span className="font-bold text-slate-800 dark:text-white text-xs">{count}</span>
                  }
                },

                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Status</span>,
                  dataIndex: 'status',
                  render: (status) => (
                    <Tag color={status === 'Active' ? 'success' : status === 'Onboarding' ? 'processing' : 'warning'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 select-none">
                      {status || 'Active'}
                    </Tag>
                  )
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Action</span>,
                  key: 'action',
                  align: 'right',
                  render: (_, record) => (
                    <Space size="middle">
                      <EditOutlined className="text-blue-500 hover:text-blue-700 cursor-pointer text-xs" onClick={() => handleOpenEditSalesUser(record)} />
                      <DeleteOutlined className="text-red-400 hover:text-red-600 cursor-pointer text-xs" onClick={() => handleDeleteSalesUser(record.id, record.name)} />
                    </Space>
                  )
                }
              ]}
            />
          </Card>

          {/* Add Sales Account Responsive Modal */}
          <Modal
            open={isCreateOpen}
            onCancel={() => {
              setIsCreateOpen(false)
              createForm.resetFields()
            }}
            footer={null}
            destroyOnHidden
            centered
            width={540}
            style={{ maxWidth: '92vw', margin: '0 auto' }}
            title={
              <div className="mb-2">
                <h2 className="text-base font-bold text-slate-805 dark:text-white m-0 tracking-tight">Create Sales Account</h2>
                <p className="text-slate-450 dark:text-slate-400 text-[11px] font-medium mt-0.5">Register a new sales user and designate their parameters.</p>
              </div>
            }
          >
            <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit} initialValues={{ tier: 'Silver', commission: '10' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Form.Item name="name" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Full Name *</span>} rules={[{ required: true, message: 'Please enter name' }]}>
                  <Input placeholder="e.g. Maria Lopez" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="email" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Email Address *</span>} rules={[{ required: true, type: 'email', message: 'Enter valid email' }]}>
                  <Input placeholder="maria@kaykaydee.health" className="rounded-xl h-10" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Form.Item name="password" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Login Password *</span>} rules={[{ required: true, message: 'Please enter a login password' }]}>
                  <Input.Password placeholder="Set password (e.g. Sales@2026)" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="phone" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Phone Number</span>}>
                  <Input placeholder="+1 (555) 019-2834" className="rounded-xl h-10" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Form.Item name="territory" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Territory Coverage</span>}>
                  <Input placeholder="e.g. West · California, Nevada" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="tier" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Partner Tier *</span>} rules={[{ required: true }]}>
                  <Select className="rounded-xl h-10 flex items-center">
                    <Option value="Platinum">Platinum</Option>
                    <Option value="Gold">Gold</Option>
                    <Option value="Silver">Silver</Option>
                    <Option value="Bronze">Bronze</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="commission" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Commission %</span>}>
                  <Input placeholder="10" className="rounded-xl h-10" suffix="%" />
                </Form.Item>
              </div>
              <Form.Item className="mb-0 text-right mt-4">
                <Space>
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" style={{ backgroundColor: '#0E1B33' }} className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Create Account</button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Sales Account Responsive Modal */}
          <Modal
            open={isEditSalesOpen}
            onCancel={() => {
              setIsEditSalesOpen(false)
              setEditingSalesUser(null)
              editSalesForm.resetFields()
            }}
            footer={null}
            destroyOnHidden
            centered
            width={540}
            style={{ maxWidth: '92vw', margin: '0 auto' }}
            title={
              <div className="mb-2">
                <h2 className="text-base font-bold text-slate-805 dark:text-white m-0 tracking-tight">Edit Sales Account</h2>
                <p className="text-slate-450 dark:text-slate-400 text-[11px] font-medium mt-0.5">Update parameters for {editingSalesUser?.name}</p>
              </div>
            }
          >
            <Form form={editSalesForm} layout="vertical" onFinish={handleEditSalesUserSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Form.Item name="name" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Full Name *</span>} rules={[{ required: true }]}>
                  <Input className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="email" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Email Address *</span>} rules={[{ required: true, type: 'email' }]}>
                  <Input className="rounded-xl h-10" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Form.Item name="password" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Reset Password (optional)</span>}>
                  <Input.Password placeholder="Leave blank to keep existing" className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="phone" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Phone Number</span>}>
                  <Input className="rounded-xl h-10" />
                </Form.Item>
                <Form.Item name="territory" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Territory Coverage</span>}>
                  <Input className="rounded-xl h-10" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                <Form.Item name="tier" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Partner Tier</span>}>
                  <Select className="rounded-xl h-10 flex items-center">
                    <Option value="Platinum">Platinum</Option>
                    <Option value="Gold">Gold</Option>
                    <Option value="Silver">Silver</Option>
                    <Option value="Bronze">Bronze</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="commission" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Commission %</span>}>
                  <Input className="rounded-xl h-10" suffix="%" />
                </Form.Item>
                <Form.Item name="status" label={<span className="text-slate-555 dark:text-slate-300 font-bold text-[11px]">Status</span>}>
                  <Select className="rounded-xl h-10 flex items-center">
                    <Option value="Active">Active</Option>
                    <Option value="Onboarding">Onboarding</Option>
                    <Option value="Paused">Paused</Option>
                  </Select>
                </Form.Item>
              </div>
              <Form.Item className="mb-0 text-right mt-4">
                <Space>
                  <button type="button" onClick={() => setIsEditSalesOpen(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" style={{ backgroundColor: '#0E1B33' }} className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Save Changes</button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      )}



      {/* ── Tab 3: Commission Dashboard ── */}
      {activeTab === 'Commission Dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Colin Edegbe's Commission Panel */}
          <Card 
            className="border border-purple-100 dark:border-purple-900/50 rounded-2xl shadow-sm bg-white dark:bg-slate-900" 
            title={
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <SafetyCertificateOutlined />
                  Representative Commission Ledger: Colin Edegbe (12% recurring MRR)
                </span>
                <Tag color="purple" className="rounded-full border-none font-bold text-[10px] px-3 py-0.5">
                  12% MRR Commission Tier
                </Tag>
              </div>
            }
          >
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Converted Clinics</span>
                <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">{colinClinics.length}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Paid Commissions</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">
                  ${colinTotalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-purple-50/40 dark:bg-purple-950/10 p-4 rounded-xl border border-purple-100/30 dark:border-purple-900/20">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Total Pending Commissions</span>
                <span className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1 block">
                  ${colinTotalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* List of Clinics Attributed to Colin */}
            <Table
              dataSource={colinCommissions}
              rowKey="clinicId"
              pagination={false}
              columns={[
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Clinic Name</span>,
                  dataIndex: 'clinicName',
                  render: (name) => <span className="font-bold text-slate-800 dark:text-white text-xs">{name}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Tier</span>,
                  dataIndex: 'tier',
                  render: (t) => <Tag className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">{t}</Tag>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Clinic MRR</span>,
                  dataIndex: 'revenue',
                  render: (rev) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">${rev.toLocaleString()}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Commission (12%)</span>,
                  dataIndex: 'commission',
                  render: (comm) => <span className="font-extrabold text-[#8C4BFF] text-xs">${comm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Signup Date</span>,
                  dataIndex: 'date',
                  render: (d) => <span className="text-xs text-slate-400 font-medium">{d}</span>
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Status</span>,
                  dataIndex: 'status',
                  render: (status, record) => (
                    <Tag 
                      color={status === 'Paid' ? 'success' : 'warning'} 
                      className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5"
                    >
                      {status} {record.paidDate ? `on ${record.paidDate}` : ''}
                    </Tag>
                  )
                },
                {
                  title: <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Action</span>,
                  key: 'action',
                  align: 'right',
                  render: (_, record) => (
                    record.status === 'Pending' ? (
                      <Button 
                        size="small" 
                        type="primary"
                        style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
                        className="rounded-lg text-[10px] font-bold"
                        onClick={() => handleMarkPaid(record.clinicId)}
                      >
                        Mark Paid
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-extrabold flex items-center gap-1">
                        <CheckCircleOutlined /> Paid
                      </span>
                    )
                  )
                }
              ]}
            />
          </Card>

          {/* Global Settings */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-sm text-slate-700 dark:text-white">Global Commission Settings</span>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-xs font-bold text-slate-655 block mb-1">Standard Commission Percentage</span>
                <Slider min={5} max={40} step={1} value={globalRate} onChange={setGlobalRate} />
                <div className="flex justify-between text-xs text-slate-400 font-semibold mt-1">
                  <span>5%</span>
                  <span className="text-[#8C4BFF] font-black">{globalRate}% commission rate</span>
                  <span>40%</span>
                </div>
              </div>
              <div className="text-right">
                <Button type="primary" onClick={() => toast.success(`Saved default commission rate: ${globalRate}%`)} style={{ backgroundColor: '#0E1B33', border: 'none' }} className="rounded-xl h-10 font-bold px-6">
                  Update Commission Rules
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}



    </div>
  )
}
