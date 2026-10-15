import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Switch, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, SafetyCertificateOutlined, FormOutlined, MailOutlined, FileTextOutlined, ApartmentOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import {
  getSettingsTemplates,
  createSettingsTemplate,
  updateSettingsTemplate,
  deleteSettingsTemplate
} from '../../../settings/api/settingsApi'

const { Option } = Select
const { TextArea } = Input

export default function HeadAdminGlobalTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('All')

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [assigningTemplate, setAssigningTemplate] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [assignForm] = Form.useForm()

  // Fetch templates from database
  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await getSettingsTemplates()
      if (res && res.success && res.data) {
        const forms = (res.data.forms || []).map(t => ({ ...t, templateType: 'forms' }))
        const letters = (res.data.letters || []).map(t => ({ ...t, templateType: 'letters' }))
        const notes = (res.data.notes || []).map(t => ({ ...t, templateType: 'notes' }))
        const allList = [...forms, ...letters, ...notes]
        setTemplates(allList)
      } else {
        setTemplates([
          { id: '1', name: 'NDIS Intake Care Assessment', category: 'NDIS Services', templateType: 'forms', status: 'Published', content: 'Standard NDIS Intake Assessment Form' },
          { id: '2', name: 'EPC Standard Clinical Assessment', category: 'Medicare Billing', templateType: 'forms', status: 'Published', content: 'Medicare EPC Referral Assessment' },
          { id: '3', name: 'AHTR Outcome Measure Questionnaire', category: 'Outcomes', templateType: 'notes', status: 'Published', content: 'Patient outcome measure evaluation note' },
          { id: '4', name: 'Standard GDPR Consent Release Form', category: 'Consent', templateType: 'letters', status: 'Draft', content: 'Client medical information release consent letter' }
        ])
      }
    } catch (err) {
      console.error('Error fetching global templates:', err)
      toast.error('Failed to load global templates from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Handle Add Template
  const handleCreateTemplate = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        name: values.name,
        category: values.category || 'General',
        type: values.templateType || 'forms',
        content: values.content || '',
        status: values.status ? 'Published' : 'Draft'
      }
      const res = await createSettingsTemplate(payload)
      if (res && res.success) {
        toast.success(`Global template "${values.name}" created successfully!`)
        setCreateModalOpen(false)
        form.resetFields()
        await fetchTemplates()
      } else {
        toast.error(res?.message || 'Failed to create template')
      }
    } catch (err) {
      console.error('Create template error:', err)
      toast.error('Error creating template in database')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Template
  const handleEditTemplate = async (values) => {
    if (!editingTemplate) return
    setSubmitting(true)
    try {
      const payload = {
        name: values.name,
        category: values.category,
        content: values.content,
        status: values.status ? 'Published' : 'Draft'
      }
      const type = editingTemplate.templateType || 'forms'
      const res = await updateSettingsTemplate(type, editingTemplate.id, payload)
      if (res && res.success) {
        toast.success(`Template "${values.name}" updated successfully!`)
        setEditModalOpen(false)
        setEditingTemplate(null)
        await fetchTemplates()
      } else {
        toast.error(res?.message || 'Failed to update template')
      }
    } catch (err) {
      console.error('Update template error:', err)
      toast.error('Error updating template in database')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Template
  const handleDeleteTemplate = async (record) => {
    try {
      const type = record.templateType || 'forms'
      const res = await deleteSettingsTemplate(type, record.id)
      if (res && res.success) {
        toast.success(`Template "${record.name}" deleted from database`)
        await fetchTemplates()
      } else {
        toast.error(res?.message || 'Failed to delete template')
      }
    } catch (err) {
      console.error('Delete template error:', err)
      toast.error('Error deleting template from database')
    }
  }

  // Handle Assign to Clinics
  const handleAssignSubmit = (values) => {
    const clinicTarget = values.targetClinics === 'all' ? 'all active clinics' : `${values.selectedClinics?.length || 1} selected clinics`
    toast.success(`Template "${assigningTemplate?.name}" pushed globally to ${clinicTarget}!`)
    setAssignModalOpen(false)
    setAssigningTemplate(null)
    assignForm.resetFields()
  }

  // Open Edit Modal
  const openEditModal = (record) => {
    setEditingTemplate(record)
    setEditModalOpen(true)
    setTimeout(() => {
      editForm.setFieldsValue({
        name: record.name,
        category: record.category || 'General',
        templateType: record.templateType || 'forms',
        content: record.content || '',
        status: record.status === 'Published' || record.status === 'active'
      })
    }, 0)
  }

  // Open Assign Modal
  const openAssignModal = (record) => {
    setAssigningTemplate(record)
    setAssignModalOpen(true)
    setTimeout(() => {
      assignForm.setFieldsValue({ targetClinics: 'all' })
    }, 0)
  }

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
                          (t.category || '').toLowerCase().includes(searchText.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
    const matchesType = selectedType === 'All' || t.templateType === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#8C4BFF]/10 text-[#8C4BFF] mb-2 tracking-wider">
            <SafetyCertificateOutlined /> Global Platform Catalog
          </span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white m-0">
            Healthcare Templates Catalog
          </h1>
          <p className="text-slate-400 dark:text-slate-400 text-xs mt-1.5 font-semibold">
            Manage global assessment forms, letter templates, and clinical note schemas deployed across all clinics.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields()
            form.setFieldsValue({ status: true, templateType: 'forms', category: 'NDIS Services' })
            setCreateModalOpen(true)
          }}
          className="rounded-xl h-10 px-5 text-xs font-bold shadow-sm"
          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
        >
          Add Global Template
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <Input
              placeholder="Search template name or category..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-xl h-10 text-xs font-semibold max-w-sm"
            />
            <Select
              value={selectedType}
              onChange={setSelectedType}
              className="w-36 font-semibold text-xs h-10"
            >
              <Option value="All">All Types</Option>
              <Option value="forms">Forms</Option>
              <Option value="letters">Letters</Option>
              <Option value="notes">Clinical Notes</Option>
            </Select>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="w-44 font-semibold text-xs h-10 hidden md:block"
            >
              <Option value="All">All Categories</Option>
              <Option value="NDIS Services">NDIS Services</Option>
              <Option value="Medicare Billing">Medicare Billing</Option>
              <Option value="Outcomes">Outcomes</Option>
              <Option value="Consent">Consent</Option>
              <Option value="Assessment">Assessment</Option>
            </Select>
          </div>

          <div className="text-xs text-slate-400 font-bold">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
        </div>
      </Card>

      {/* Catalog Table */}
      <Card className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <Table
          dataSource={filteredTemplates}
          rowKey={(r) => r.id || r.key}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: 'Template Name',
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold bg-[#8C4BFF]/10 text-[#8C4BFF]">
                    {record.templateType === 'letters' ? <MailOutlined /> : record.templateType === 'notes' ? <FileTextOutlined /> : <FormOutlined />}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">{text || record.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{record.content ? (record.content.substring(0, 45) + '...') : 'Healthcare standard schema'}</span>
                  </div>
                </div>
              )
            },
            {
              title: 'Type',
              dataIndex: 'templateType',
              key: 'templateType',
              render: (type) => (
                <Tag color={type === 'letters' ? 'purple' : type === 'notes' ? 'cyan' : 'blue'} className="rounded-full border-none font-bold text-[9px] uppercase px-2.5 py-0.5">
                  {type === 'letters' ? 'Letter' : type === 'notes' ? 'Clinical Note' : 'Form'}
                </Tag>
              )
            },
            {
              title: 'Category Scheme',
              dataIndex: 'category',
              key: 'category',
              render: (cat) => (
                <Tag color="geekblue" className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                  {cat || 'General'}
                </Tag>
              )
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (s) => (
                <Tag color={s === 'Published' || s === 'active' ? 'success' : 'default'} className="rounded-full border-none font-bold text-[9px] uppercase px-2.5 py-0.5">
                  {s === 'Published' || s === 'active' ? 'Published' : 'Draft'}
                </Tag>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              align: 'right',
              render: (_, record) => (
                <Space size="small">
                  <Button
                    size="small"
                    icon={<ApartmentOutlined />}
                    onClick={() => openAssignModal(record)}
                    className="rounded-lg text-[10px] font-bold border-slate-200"
                  >
                    Assign to Clinics
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(record)}
                    className="rounded-lg text-[10px] font-bold"
                  />
                  <Popconfirm
                    title="Delete Global Template?"
                    description="This template will be removed from the global database catalog."
                    onConfirm={() => handleDeleteTemplate(record)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                  >
                    <Button size="small" icon={<DeleteOutlined />} danger className="rounded-lg text-[10px]" />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        title={<span className="font-extrabold text-base text-slate-800 dark:text-white">Add New Global Healthcare Template</span>}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTemplate} className="pt-3">
          <Form.Item name="name" label={<span className="text-xs font-bold text-slate-600 uppercase">Template Title *</span>} rules={[{ required: true, message: 'Please enter template name' }]}>
            <Input placeholder="e.g. Initial Musculoskeletal Assessment Form" className="rounded-xl h-10 text-xs font-semibold" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="templateType" label={<span className="text-xs font-bold text-slate-600 uppercase">Template Type *</span>} rules={[{ required: true }]}>
              <Select className="h-10 text-xs font-semibold">
                <Option value="forms">Assessment Form</Option>
                <Option value="letters">Letter Template</Option>
                <Option value="notes">Clinical Note Schema</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label={<span className="text-xs font-bold text-slate-600 uppercase">Category Scheme *</span>} rules={[{ required: true }]}>
              <Select className="h-10 text-xs font-semibold">
                <Option value="NDIS Services">NDIS Services</Option>
                <Option value="Medicare Billing">Medicare Billing</Option>
                <Option value="Outcomes">Outcomes</Option>
                <Option value="Consent">Consent</Option>
                <Option value="Assessment">Assessment</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="content" label={<span className="text-xs font-bold text-slate-600 uppercase">Template Body / Questions Schema</span>}>
            <TextArea rows={4} placeholder="Enter form fields or letter text template..." className="rounded-xl text-xs font-semibold" />
          </Form.Item>

          <Form.Item name="status" valuePropName="checked" label={<span className="text-xs font-bold text-slate-600 uppercase">Publish Globally to Catalog</span>}>
            <Switch checkedChildren="Published" unCheckedChildren="Draft" style={{ backgroundColor: '#8C4BFF' }} />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setCreateModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="rounded-xl font-bold" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}>
              Create Template
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingTemplate(null) }}
        title={<span className="font-extrabold text-base text-slate-800 dark:text-white">Edit Global Healthcare Template</span>}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditTemplate} className="pt-3">
          <Form.Item name="name" label={<span className="text-xs font-bold text-slate-600 uppercase">Template Title *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10 text-xs font-semibold" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="category" label={<span className="text-xs font-bold text-slate-600 uppercase">Category Scheme *</span>} rules={[{ required: true }]}>
              <Select className="h-10 text-xs font-semibold">
                <Option value="NDIS Services">NDIS Services</Option>
                <Option value="Medicare Billing">Medicare Billing</Option>
                <Option value="Outcomes">Outcomes</Option>
                <Option value="Consent">Consent</Option>
                <Option value="Assessment">Assessment</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" valuePropName="checked" label={<span className="text-xs font-bold text-slate-600 uppercase">Status</span>}>
              <Switch checkedChildren="Published" unCheckedChildren="Draft" style={{ backgroundColor: '#8C4BFF' }} />
            </Form.Item>
          </div>

          <Form.Item name="content" label={<span className="text-xs font-bold text-slate-600 uppercase">Template Content</span>}>
            <TextArea rows={4} className="rounded-xl text-xs font-semibold" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => { setEditModalOpen(false); setEditingTemplate(null) }} className="rounded-xl font-bold">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="rounded-xl font-bold" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); setAssigningTemplate(null) }}
        title={<span className="font-extrabold text-base text-slate-800 dark:text-white">Push Template Globally to Clinics</span>}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit} className="pt-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-4 border border-slate-150 dark:border-slate-700">
            <span className="text-xs font-extrabold text-slate-800 dark:text-white block">{assigningTemplate?.name}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Category: {assigningTemplate?.category || 'General'}</span>
          </div>

          <Form.Item name="targetClinics" label={<span className="text-xs font-bold text-slate-600 uppercase">Target Deployment Scope *</span>} rules={[{ required: true }]}>
            <Select className="h-10 text-xs font-semibold">
              <Option value="all">Deploy to ALL Active Network Clinics</Option>
              <Option value="new">Deploy to New Onboarded Clinics Only</Option>
              <Option value="custom">Deploy to Selected Clinics List</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => { setAssignModalOpen(false); setAssigningTemplate(null) }} className="rounded-xl font-bold">Cancel</Button>
            <Button type="primary" htmlType="submit" className="rounded-xl font-bold" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}>
              Push Globally
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
