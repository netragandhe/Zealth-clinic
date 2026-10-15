import React, { useState, useEffect } from 'react'
import { Table, Input, Select, Space, Modal, Form } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '../../../store/clinicStore'
import { 
  getBranches as getBranchesApi, 
  createBranch as createBranchApi, 
  updateBranch as updateBranchApi, 
  deleteBranch as deleteBranchApi 
} from '../../calendar/api/clinicAdminApi'

const { Option } = Select

export default function BranchPage() {
  const store = useClinicStore()
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [addVisible, setAddVisible] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'view'
  const [currentBranch, setCurrentBranch] = useState(null)
  const [form] = Form.useForm()

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const res = await getBranchesApi({ search: searchText, status: statusFilter })
      if (res && res.success) {
        setBranches(res.data || [])
      }
    } catch (err) {
      console.error("Error fetching live branches:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [searchText, statusFilter])

  const handleAdd = async (values) => {
    const formattedBranch = {
      name: values.name,
      email: values.email,
      status: values.status || 'Active',
      phone: values.phone || '',
      address: values.address || '',
      timezone: values.timezone || 'AEST',
      businessHours: {
        startTime: values.startTime || '09:00',
        endTime: values.endTime || '17:00'
      }
    }
    try {
      if (modalMode === 'add') {
        const res = await createBranchApi(formattedBranch)
        if (res && res.success) {
          toast.success('Branch added to live database successfully!')
        }
      } else if (modalMode === 'edit') {
        const res = await updateBranchApi(currentBranch.id, formattedBranch)
        if (res && res.success) {
          toast.success('Branch details updated in live database!')
        }
      }
      setAddVisible(false)
      form.resetFields()
      setCurrentBranch(null)
      fetchBranches()
    } catch (err) {
      console.error("Error saving branch to database:", err)
      toast.error('Failed to save branch to database')
    }
  }

  const handleDelete = async (id, name) => {
    try {
      const res = await deleteBranchApi(id)
      if (res && res.success) {
        toast.success(`Branch "${name}" deleted from database!`)
        fetchBranches()
      }
    } catch (err) {
      console.error("Error deleting branch:", err)
      toast.error('Failed to delete branch')
    }
  }

  const filtered = branches

  const columns = [
    {
      title: 'Branch Name',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text) => (
        <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <EnvironmentOutlined className="text-slate-400" />
          <span>{text}</span>
        </span>
      )
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: '20%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
      render: (text) => <span className="font-semibold text-slate-600">{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '18%',
      render: (status) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
          status === 'Active' 
            ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20' 
            : 'bg-[#EEF2F6] text-[#64748B] dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
        }`}>
          {status}
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: '12%',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setCurrentBranch(record)
              setModalMode('view')
            }}
            className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF] transition-colors"
          >
            <InfoCircleOutlined style={{ fontSize: 15 }} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setCurrentBranch(record)
              setModalMode('edit')
              form.setFieldsValue({
                ...record,
                startTime: record.businessHours?.startTime || '09:00',
                endTime: record.businessHours?.endTime || '17:00'
              })
              setAddVisible(true)
            }}
            className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF] transition-colors"
          >
            <EditOutlined style={{ fontSize: 15 }} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(record.id, record.name)
            }}
            className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-red-500 transition-colors"
          >
            <DeleteOutlined style={{ fontSize: 15 }} />
          </button>
        </Space>
      )
    }
  ]

  if (modalMode === 'view' && currentBranch) {
    return (
      <div className="space-y-6 animate-slide-in">
        {/* Navigation & Action Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => {
              setModalMode('add')
              setCurrentBranch(null)
            }}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer"
          >
            <span className="text-sm">←</span>
            <span>Back to Branches</span>
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setModalMode('edit')
                form.setFieldsValue({
                  ...currentBranch,
                  startTime: currentBranch.businessHours?.startTime || '09:00',
                  endTime: currentBranch.businessHours?.endTime || '17:00'
                })
                setAddVisible(true)
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold h-9 rounded-xl cursor-pointer text-xs transition-colors flex items-center gap-1.5"
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Branch</span>
            </button>
            <button 
              onClick={() => {
                handleDelete(currentBranch.id, currentBranch.name)
                setModalMode('add')
                setCurrentBranch(null)
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-650 text-white font-bold h-9 rounded-xl cursor-pointer border-none text-xs transition-colors flex items-center gap-1.5"
            >
              <DeleteOutlined style={{ fontSize: 13 }} />
              <span>Delete Branch</span>
            </button>
          </div>
        </div>

        {/* Profile Banner */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-550 to-[#8C4BFF] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            <EnvironmentOutlined style={{ fontSize: 200 }} />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white dark:bg-slate-900/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-2xl font-bold">
              {currentBranch.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold m-0 text-white leading-none">{currentBranch.name}</h2>
              <p className="text-xs text-white/80 m-0 mt-1">{currentBranch.email} &bull; {currentBranch.phone || 'No phone'}</p>
              <span className={`inline-flex px-2.5 py-0.5 mt-2 rounded-full text-[10px] font-bold uppercase ${
                currentBranch.status === 'Active' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
              }`}>
                {currentBranch.status}
              </span>
            </div>
          </div>
        </div>

        {/* Detail info card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5">Branch details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Branch name</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBranch.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Email address</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBranch.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Phone number</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBranch.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Address</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBranch.address || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Timezone</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBranch.timezone || 'AEST'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Business Hours</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {currentBranch.businessHours?.startTime || '09:00'} to {currentBranch.businessHours?.endTime || '17:00'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Join Date</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBranch.joinDate || 'Jan 1, 2025'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Branch Status</span>
              <span className="font-semibold text-[#8C4BFF]">{currentBranch.status}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (addVisible && (modalMode === 'edit' || modalMode === 'add')) {
    const isEdit = modalMode === 'edit'
    const closeModal = () => {
      setAddVisible(false)
      setCurrentBranch(null)
      form.resetFields()
    }

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
              {isEdit ? 'Edit branch' : 'Add branch'}
            </h1>
            <p className="text-slate-400 dark:text-slate-455 text-xs mt-0.5">
              {isEdit 
                ? `Update ${currentBranch?.name || 'branch'} details and business hours.` 
                : 'Create a new clinic branch location.'}
            </p>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleAdd} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-0">Branch details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="name" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Branch name *</span>} rules={[{ required: true, message: 'Please enter branch name' }]} className="mb-0">
                <Input placeholder="e.g. Branch 1" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
              <Form.Item name="email" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Email *</span>} rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]} className="mb-0">
                <Input placeholder="e.g. branch@domain.com" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="phone" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Phone Number</span>} className="mb-0">
                <Input placeholder="e.g. +61 3 9000 1111" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
              <Form.Item name="address" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Address</span>} className="mb-0">
                <Input placeholder="e.g. 123 Care Street, Melbourne VIC" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="timezone" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Timezone</span>} initialValue="AEST" className="mb-0">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="AEST">AEST (Sydney/Brisbane/Melbourne Standard)</Option>
                  <Option value="AEDT">AEDT (Melbourne/Sydney Daylight Savings)</Option>
                  <Option value="ACDT">ACDT (Adelaide)</Option>
                  <Option value="AWST">AWST (Perth)</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Status *</span>} rules={[{ required: true, message: 'Please select status' }]} initialValue="Active" className="mb-0">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Form.Item name="startTime" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Business Hours Start</span>} initialValue="09:00" className="mb-0">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="08:00">08:00 AM</Option>
                  <Option value="08:30">08:30 AM</Option>
                  <Option value="09:00">09:00 AM</Option>
                  <Option value="09:30">09:30 AM</Option>
                </Select>
              </Form.Item>
              <Form.Item name="endTime" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Business Hours End</span>} initialValue="17:00" className="mb-0">
                <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                  <Option value="17:00">05:00 PM</Option>
                  <Option value="17:30">05:30 PM</Option>
                  <Option value="18:00">06:00 PM</Option>
                  <Option value="18:30">06:30 PM</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={closeModal} 
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white border-none font-bold h-10 px-6 rounded-xl cursor-pointer shadow-md transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Add Branch'}
            </button>
          </div>
        </Form>
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
      
      {/* Header Controls */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Branch manage</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Manage your branches</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search here"
            prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-56 h-10 border-slate-200 rounded-xl"
            style={{ width: 230 }}
          />

          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-28 rounded-xl"
            style={{ width: 110, height: 40 }}
          >
            <Option value="Active">Active</Option>
            <Option value="Inactive">Inactive</Option>
          </Select>

          <button
            onClick={() => {
              setCurrentBranch(null)
              setModalMode('add')
              form.resetFields()
              setAddVisible(true)
            }}
            className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-sm text-sm transition-colors"
          >
            <PlusOutlined style={{ fontSize: 13 }} />
            <span>Add Branch</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden reports-card">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={false}
          onRow={(record) => ({
            onClick: () => {
              setCurrentBranch(record)
              setModalMode('view')
            },
            style: { cursor: 'pointer' }
          })}
          className="border-none"
        />
      </div>
    </div>
  )
}
