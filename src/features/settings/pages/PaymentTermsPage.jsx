import React, { useState } from 'react'
import { Table, Modal, Form, Input, InputNumber, Space, Switch, Tooltip } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CreditCardOutlined, StarOutlined, ClockCircleOutlined, FileTextOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../store/clinicStore'

const { TextArea } = Input

export default function PaymentTermsPage() {
  const { paymentTerms, addPaymentTerm, editPaymentTerm, deletePaymentTerm, setDefaultPaymentTerm } = useClinicStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [currentTerm, setCurrentTerm] = useState(null)
  const [form] = Form.useForm()

  const openAdd = () => {
    setCurrentTerm(null)
    setModalMode('add')
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setCurrentTerm(record)
    setModalMode('edit')
    form.setFieldsValue({ name: record.name, days: record.days, description: record.description })
    setModalOpen(true)
  }

  const handleSubmit = (values) => {
    if (modalMode === 'add') {
      addPaymentTerm(values)
      toast.success('Payment term created!')
    } else {
      editPaymentTerm({ ...currentTerm, ...values })
      toast.success('Payment term updated!')
    }
    setModalOpen(false)
  }

  const handleDelete = (record) => {
    if (record.isDefault) { toast.error('Cannot delete the default payment term.'); return }
    Modal.confirm({
      title: 'Delete Payment Term?',
      content: `Remove "${record.name}"? This may affect invoices using this term.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => { deletePaymentTerm(record.id); toast.success('Payment term deleted.') },
    })
  }

  const handleSetDefault = (record) => {
    setDefaultPaymentTerm(record.id)
    toast.success(`"${record.name}" is now the default payment term.`)
  }

  const defaultTerm = paymentTerms.find((t) => t.isDefault)

  const columns = [
    {
      title: 'Term Name',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>
          {record.isDefault && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20">
              <StarOutlined style={{ fontSize: 9 }} /> Default
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Due Days',
      dataIndex: 'days',
      key: 'days',
      width: '14%',
      render: (days) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20">
          <ClockCircleOutlined />
          {days === -1 ? 'End of Month' : days === 0 ? 'Immediate' : `${days} Days`}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <span className="text-slate-500 text-sm">{text}</span>,
    },
    {
      title: 'Set Default',
      key: 'setDefault',
      width: '12%',
      align: 'center',
      render: (_, record) => (
        <Tooltip title={record.isDefault ? 'Current default' : 'Set as global default'}>
          <Switch
            size="small"
            checked={record.isDefault}
            onChange={() => !record.isDefault && handleSetDefault(record)}
            className={record.isDefault ? '' : 'cursor-pointer'}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <button onClick={() => openEdit(record)} className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF] transition-colors">
              <EditOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
          <Tooltip title={record.isDefault ? 'Cannot delete default' : 'Delete'}>
            <button onClick={() => handleDelete(record)} className={`bg-transparent border-none p-0 cursor-pointer transition-colors ${record.isDefault ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-500'}`}>
              <DeleteOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const itemRender = (_, type, el) => {
    if (type === 'prev') return <span className="text-slate-500 font-semibold cursor-pointer">&lt; Previous</span>
    if (type === 'next') return <span className="text-slate-500 font-semibold cursor-pointer">Next &gt;</span>
    return el
  }

  return (
    <div className="documents-page-container py-2 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Payment Terms</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Create, edit &amp; manage invoice payment terms globally
          </p>
        </div>
        <button onClick={openAdd} className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none text-sm shadow-sm">
          <PlusOutlined /> Add Payment Term
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#8C4BFF] flex items-center justify-center text-white"><CreditCardOutlined /></div>
          <div>
            <div className="text-2xl font-extrabold text-[#0E1B33] dark:text-white">{paymentTerms.length}</div>
            <div className="text-xs text-slate-400 font-semibold">Total Payment Terms</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0E1B33] flex items-center justify-center text-white"><StarOutlined /></div>
          <div>
            <div className="text-lg font-extrabold text-[#0E1B33] dark:text-white">{defaultTerm?.name || 'None'}</div>
            <div className="text-xs text-slate-400 font-semibold">Global Default Term</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center text-white"><ClockCircleOutlined /></div>
          <div>
            <div className="text-2xl font-extrabold text-[#0E1B33] dark:text-white">{defaultTerm?.days === -1 ? 'EOM' : `${defaultTerm?.days ?? 0}d`}</div>
            <div className="text-xs text-slate-400 font-semibold">Default Due Period</div>
          </div>
        </div>
      </div>

      {/* Global Default Banner */}
      {defaultTerm && (
        <div className="bg-gradient-to-r from-[#0E1B33] to-[#1A2E50] rounded-2xl p-5 flex items-center gap-5 shadow-sm text-white">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900/10 flex items-center justify-center text-2xl">
            <FileTextOutlined />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest opacity-70">Current Global Default</div>
            <div className="text-xl font-extrabold mt-0.5">{defaultTerm.name}</div>
            <div className="text-sm opacity-80 mt-0.5">{defaultTerm.description}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-70 font-semibold">Applied to all new invoices</div>
            <div className="text-2xl font-extrabold mt-0.5">
              {defaultTerm.days === -1 ? 'End of Month' : defaultTerm.days === 0 ? 'Immediate' : `${defaultTerm.days} Days`}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <Table
          dataSource={paymentTerms}
          columns={columns}
          rowKey="id"
          className="border-none"
          pagination={{ pageSize: 10, itemRender, showTotal: (total, range) => <span className="text-slate-400 font-bold text-xs">Showing {range[0]}-{range[1]} of {total}</span> }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden width={440} className="documents-modal">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">{modalMode === 'add' ? 'Add Payment Term' : 'Edit Payment Term'}</h2>
          <p className="text-slate-400 text-xs mt-1">Define the term name, due days, and a short description.</p>
        </div>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="name" label="Term Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Net 30, Immediate, NDIS 30 Days" />
          </Form.Item>
          <Form.Item
            name="days"
            label="Due Days (use -1 for End of Month, 0 for Immediate)"
            rules={[{ required: true, message: 'Enter due days' }]}
          >
            <InputNumber min={-1} max={365} className="w-full" placeholder="e.g. 7, 14, 30, 0, -1" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Brief description for this payment term..." maxLength={200} showCount />
          </Form.Item>
          <Form.Item className="mb-0 text-right mt-4">
            <Space>
              <button type="button" onClick={() => setModalOpen(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-[#0E1B33] hover:bg-[#1A2E50] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">{modalMode === 'add' ? 'Create Term' : 'Save Changes'}</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
