import React, { useState } from 'react'
import { Table, Modal, Form, Input, Select, Space, Tag, Tooltip } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined,
  InboxOutlined, FileTextOutlined, MailOutlined, FormOutlined,
  SearchOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '../../../store/clinicStore'

const { Option } = Select
const { TextArea } = Input

const TYPE_META = {
  form:   { label: 'Form',   color: '#3B82F6', bg: '#EFF6FF', icon: <FileTextOutlined /> },
  letter: { label: 'Letter', color: '#8C4BFF', bg: '#F5F3FF', icon: <MailOutlined /> },
  note:   { label: 'Note',   color: '#10B981', bg: '#F0FDF4', icon: <FormOutlined /> },
}

export default function TemplateManagePage() {
  const { allTemplates, addTemplate, editTemplate, deleteTemplate, cloneTemplate, archiveTemplate } = useClinicStore()
  const navigate = useNavigate()

  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState(undefined)
  const [statusFilter, setStatusFilter] = useState('Active')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState(null)
  const [form] = Form.useForm()

  const openAdd = () => {
    setCurrentTemplate(null)
    setModalMode('add')
    form.resetFields()
    form.setFieldsValue({ type: 'note', status: 'Active' })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setCurrentTemplate(record)
    setModalMode('edit')
    form.setFieldsValue({ name: record.name, type: record.type, category: record.category, content: record.content, status: record.status })
    setModalOpen(true)
  }

  const openPreview = (record) => {
    setCurrentTemplate(record)
    setPreviewOpen(true)
  }

  const handleSubmit = (values) => {
    if (modalMode === 'add') {
      addTemplate(values)
      toast.success('Template created!')
    } else {
      editTemplate({ ...currentTemplate, ...values })
      toast.success('Template updated!')
    }
    setModalOpen(false)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Template?',
      content: `Permanently remove "${record.name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => { deleteTemplate(record.id); toast.success('Template deleted.') },
    })
  }

  const handleClone = (record) => {
    cloneTemplate(record.id)
    toast.success(`Cloned "${record.name}"`)
  }

  const handleArchive = (record) => {
    archiveTemplate(record.id)
    toast.success(record.status === 'Archived' ? 'Template restored to Active.' : 'Template archived.')
  }

  const filtered = allTemplates.filter((t) => {
    const q = searchText.toLowerCase()
    const matchSearch = (t.name || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)
    const matchType = typeFilter ? t.type === typeFilter : true
    const matchStatus = statusFilter ? t.status === statusFilter : true
    return matchSearch && matchType && matchStatus
  })

  const columns = [
    {
      title: 'Template',
      key: 'template',
      width: '34%',
      render: (_, r) => {
        const meta = TYPE_META[r.type] || TYPE_META.note
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
              {meta.icon}
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{r.name}</div>
              <div className="text-slate-400 text-xs">{r.category}</div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: '12%',
      render: (type) => {
        const meta = TYPE_META[type] || TYPE_META.note
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: meta.bg, color: meta.color }}>
            {meta.icon} {meta.label}
          </span>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '12%',
      render: (s) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${s === 'Active' ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20' : 'bg-[#EEF2F6] text-[#64748B] dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'}`}>
          {s}
        </span>
      ),
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      width: '14%',
      render: (v) => <span className="text-slate-500 text-sm">{v}</span>,
    },
    {
      title: 'Preview',
      key: 'preview',
      width: '10%',
      render: (_, record) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            openPreview(record)
          }}
          className="text-xs font-bold text-[#8C4BFF] bg-[#F5F3FF] px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#EDE9FE]"
        >
          Preview
        </button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '18%',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openEdit(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF]"
            >
              <EditOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
          <Tooltip title="Clone Template">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClone(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#10B981]"
            >
              <CopyOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
          <Tooltip title={record.status === 'Archived' ? 'Restore' : 'Archive'}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleArchive(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#F59E0B]"
            >
              <InboxOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(record)
              }}
              className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-red-500"
            >
              <DeleteOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const activeCount = allTemplates.filter((t) => t.status === 'Active').length
  const archivedCount = allTemplates.filter((t) => t.status === 'Archived').length
  const typeCounts = { form: 0, letter: 0, note: 0 }
  allTemplates.forEach((t) => { if (typeCounts[t.type] !== undefined) typeCounts[t.type]++ })

  if (previewOpen && currentTemplate) {
    const meta = TYPE_META[currentTemplate.type] || TYPE_META.note
    return (
      <div className="space-y-6 animate-slide-in">
        {/* Navigation & Action Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => {
              setPreviewOpen(false)
              setCurrentTemplate(null)
            }}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer"
          >
            <span className="text-sm">←</span>
            <span>Back to Templates</span>
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                handleClone(currentTemplate)
                setPreviewOpen(false)
                setCurrentTemplate(null)
              }}
              className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-9 rounded-xl cursor-pointer text-xs transition-colors flex items-center gap-1.5"
            >
              <CopyOutlined style={{ fontSize: 13 }} />
              <span>Clone Template</span>
            </button>
            <button 
              onClick={() => {
                setPreviewOpen(false)
                setTimeout(() => openEdit(currentTemplate), 50)
              }}
              className="px-4 py-2 bg-[#0E1B33] hover:bg-[#1A2E50] text-white font-bold h-9 rounded-xl cursor-pointer border-none text-xs transition-colors flex items-center gap-1.5"
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Template</span>
            </button>
          </div>
        </div>

        {/* Template Banner */}
        <div 
          className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${meta.color || '#8C4BFF'}, #0E1B33)` }}
        >
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            {meta.icon}
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#8C4BFF] bg-white dark:bg-slate-900 font-bold text-2xl flex-shrink-0 shadow-sm">
              {(currentTemplate.name || '?')[0].toUpperCase()}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold m-0 text-white leading-none">{currentTemplate.name}</h2>
              <p className="text-xs text-white/80 m-0 mt-1">{currentTemplate.category} &bull; Modified {currentTemplate.lastModified}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white dark:bg-slate-900/20 text-white">
                  {meta.label}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    currentTemplate.status === 'Active' ? 'bg-[#30D2BE] text-[#0E1B33]' : 'bg-slate-100/20 text-slate-300'
                  }`}
                >
                  {currentTemplate.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Template Body Content</h3>
          <div className="bg-[#F8FAFC] dark:bg-slate-950 p-5 rounded-2xl font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed min-h-32 border border-slate-100 dark:border-slate-850">
            {currentTemplate.content}
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Template Management</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Create, edit, clone &amp; archive all clinical templates</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search templates..."
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220, height: 40 }}
            className="rounded-xl border-slate-200"
          />
          <Select placeholder="Type" allowClear value={typeFilter} onChange={setTypeFilter} style={{ width: 110, height: 40 }}>
            <Option value="form">Form</Option>
            <Option value="letter">Letter</Option>
            <Option value="note">Note</Option>
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 110, height: 40 }}>
            <Option value="Active">Active</Option>
            <Option value="Archived">Archived</Option>
            <Option value={undefined}>All</Option>
          </Select>
          <button onClick={openAdd} className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none text-sm shadow-sm">
            <PlusOutlined /> New Template
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Templates', value: allTemplates.length, color: '#8C4BFF', icon: <FileTextOutlined /> },
          { label: 'Active', value: activeCount, color: '#10B981', icon: <CheckCircleOutlined /> },
          { label: 'Archived', value: archivedCount, color: '#64748B', icon: <InboxOutlined /> },
          { label: 'Forms', value: typeCounts.form, color: '#3B82F6', icon: <FileTextOutlined /> },
          { label: 'Letters', value: typeCounts.letter, color: '#8C4BFF', icon: <MailOutlined /> },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: s.color }}>{s.icon}</div>
            <div>
              <div className="text-xl font-extrabold text-[#0E1B33] dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          className="border-none"
          onRow={(record) => ({
            onClick: () => {
              openPreview(record)
            },
            style: { cursor: 'pointer' }
          })}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => <span className="text-slate-400 font-bold text-xs">Showing {range[0]}-{range[1]} of {total}</span>,
          }}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden width={840} className="documents-modal">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">{modalMode === 'add' ? 'Create New Template' : 'Edit Template'}</h2>
          <p className="text-slate-400 text-xs mt-1">Use {'{{VariableName}}'} placeholders to create dynamic templates.</p>
        </div>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Initial Assessment Form" className="rounded-xl h-10" />
          </Form.Item>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="form">Form</Option>
                <Option value="letter">Letter</Option>
                <Option value="note">Note</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Category required' }]}>
              <Input placeholder="e.g. Clinical" className="rounded-xl h-10" />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Active">Active</Option>
                <Option value="Archived">Archived</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="content" label="Template Content" rules={[{ required: true, message: 'Content is required' }]}>
            <TextArea
              rows={16}
              style={{ minHeight: '360px' }}
              placeholder="Enter template content. Use {{Client Name}}, {{DOB}}, {{Practitioner Name}}, {{NDIS Number}}, etc."
              className="font-mono text-xs leading-relaxed p-4 rounded-xl"
              showCount
            />
          </Form.Item>
          <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-xl p-3 text-xs text-slate-500 font-semibold mb-4">
            <span className="font-bold text-slate-700 dark:text-slate-300">Click to insert placeholder: </span>
            {['{{Client Name}}', '{{DOB}}', '{{NDIS Number}}', '{{Practitioner Name}}', '{{Date}}', '{{Diagnosis}}'].map((p) => (
              <button 
                type="button" 
                key={p} 
                onClick={() => {
                  const currentContent = form.getFieldValue('content') || ''
                  form.setFieldsValue({ content: `${currentContent} ${p} ` })
                }}
                className="inline-flex mx-1 px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-md font-mono text-xs cursor-pointer hover:bg-blue-100"
              >
                {p}
              </button>
            ))}
          </div>
          <Form.Item className="mb-0 text-right">
            <Space>
              <button type="button" onClick={() => setModalOpen(false)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white border-none font-bold h-10 px-6 rounded-xl cursor-pointer">{modalMode === 'add' ? 'Create Template' : 'Save Changes'}</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

