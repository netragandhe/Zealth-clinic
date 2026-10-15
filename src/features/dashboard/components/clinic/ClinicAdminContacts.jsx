import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, Modal, Form, Input, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'
import { getContacts, createContact } from '../../../calendar/api/clinicAdminApi'

const { Option } = Select

export default function ClinicAdminContacts() {
  const store = useClinicStore()
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [form] = Form.useForm()

  const basePath = window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '/clinic'

  const fetchContactsData = async () => {
    setLoading(true)
    try {
      const res = await getContacts({ search: searchText, type: typeFilter, company: companyFilter })
      if (res && res.success && Array.isArray(res.data)) {
        store.setContacts(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContactsData()
  }, [searchText, typeFilter, companyFilter])

  const handleAddSubmit = async (values) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await createContact({
        name: values.name,
        type: values.type || 'Other',
        company: values.company || '',
        email: values.email || '',
        mobileNumber: values.mobileNumber || '',
      })
      if (res && res.success && res.data) {
        store.addContact(res.data)
        toast.success('Contact added successfully!')
        setIsAddModalOpen(false)
        form.resetFields()
        fetchContactsData()
      } else {
        toast.error('Failed to save contact')
      }
    } catch (err) {
      console.error('Add contact error:', err)
      toast.error('Error adding contact to backend database')
    } finally {
      setSubmitting(false)
    }
  }


  const PAGE_SIZE = 15

  const contactsList = (store.contacts || []).filter((c, idx, self) => {
    if (!c) return false
    return idx === self.findIndex(t => t && (t.id === c.id || (t.name === c.name && t.email === c.email && t.mobileNumber === c.mobileNumber)))
  })

  const filtered = contactsList.filter(c => {
    const q = searchText.toLowerCase()
    const matchSearch = !searchText || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    const matchType = !typeFilter || c.type === typeFilter
    const matchCompany = !companyFilter || c.company === companyFilter
    return matchSearch && matchType && matchCompany
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const uniqueCompanies = [...new Set(contactsList.map(c => c.company).filter(Boolean))]

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white m-0">Contacts</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-semibold">Manage contact details</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 13 }} />
            <input
              type="text"
              placeholder="Search contacts here..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#8C4BFF] transition-colors"
            />
          </div>

          {/* Filters and Add Button */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Type Filter */}
            <Select
              placeholder="Type"
              allowClear
              value={typeFilter || undefined}
              onChange={v => { setTypeFilter(v || ''); setPage(1) }}
              className="rounded-xl flex-1 sm:flex-none"
              style={{ minWidth: 120, height: 38 }}
            >
              {['Support Coordinator', 'Plan Manager', 'Nominee', 'Family Member', 'Provider', 'GP', 'Specialist', 'Other'].map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>

            {/* Company Filter */}
            <Select
              placeholder="Company"
              allowClear
              value={companyFilter || undefined}
              onChange={v => { setCompanyFilter(v || ''); setPage(1) }}
              className="rounded-xl flex-1 sm:flex-none"
              style={{ minWidth: 120, height: 38 }}
            >
              {uniqueCompanies.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>

            {/* Add Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md hover:opacity-80 transition-opacity cursor-pointer border-none flex-shrink-0"
              style={{ backgroundColor: '#8C4BFF' }}
            >
              <PlusOutlined style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <div className="w-full">
            {/* Table Header */}
            <div
              className="hidden md:grid text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
              style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr 1.5fr', alignItems: 'stretch' }}
            >
              <span className="bg-slate-50 dark:bg-slate-800/60 py-3 px-6 font-bold text-slate-700 dark:text-slate-300">Name</span>
              <span className="py-3 px-4 flex items-center">Type</span>
              <span className="py-3 px-4 flex items-center">Contact Number</span>
              <span className="py-3 px-4 flex items-center">Email</span>
              <span className="py-3 px-4 flex items-center">Company</span>
            </div>
            {/* Table Rows */}
            {pageData.map((contact) => (
              <div
                key={contact.id}
                onClick={() => navigate(`${basePath}/contacts/${contact.id}`)}
                className="flex flex-col md:grid border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group py-2 md:py-0"
                style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr 1.5fr', alignItems: 'stretch' }}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#8C4BFF] transition-colors bg-slate-50/50 md:bg-slate-50 dark:bg-slate-800/50 md:dark:bg-slate-800 py-3 md:py-4 px-4 md:px-6 md:border-r border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between">
                  <span className="md:hidden font-bold text-xs text-slate-400 uppercase tracking-wider">Name</span>
                  {contact.name}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 py-1.5 md:py-4 px-4 flex items-center justify-between">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Type</span>
                  <Tag color="purple" className="border-none font-bold text-[10px] rounded-md m-0 uppercase tracking-wider">{contact.type || 'General'}</Tag>
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 py-1.5 md:py-4 px-4 flex items-center justify-between">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Contact</span>
                  {contact.mobileNumber || '—'}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-500 py-1.5 md:py-4 px-4 flex items-center justify-between truncate">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Email</span>
                  <span className="truncate">{contact.email || '—'}</span>
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 py-1.5 md:py-4 px-4 flex items-center justify-between">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Company</span>
                  {contact.company || '—'}
                </span>
              </div>
            ))}

            {pageData.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-650">No contacts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} out of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 disabled:opacity-40"
              >{'< Previous'}</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${page === p ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-400 text-xs px-1">...</span>}
              {totalPages > 5 && (
                <button onClick={() => setPage(totalPages)} className="w-7 h-7 rounded-full text-xs font-bold text-slate-500">{totalPages}</button>
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 disabled:opacity-40"
              >{'Next >'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal
        title={<span className="text-slate-800 dark:text-white font-extrabold text-lg">Add New Contact</span>}
        open={isAddModalOpen}
        onCancel={() => { setIsAddModalOpen(false); form.resetFields() }}
        footer={null}
        destroyOnHidden
        className="documents-modal"
      >
        <Form form={form} layout="vertical" onFinish={handleAddSubmit} className="mt-4">
          <Form.Item
            name="name"
            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Full Name *</span>}
            rules={[{ required: true, message: 'Please enter contact name' }]}
          >
            <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. John Doe" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Type *</span>}
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select className="rounded-xl h-10">
                {['Support Coordinator', 'Plan Manager', 'Nominee', 'Family Member', 'Provider', 'GP', 'Specialist', 'Other'].map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="company"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Company</span>}
            >
              <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Plan Partners" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Email</span>}
              rules={[{ type: 'email', message: 'Valid email required' }]}
            >
              <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. john@example.com" />
            </Form.Item>

            <Form.Item
              name="mobileNumber"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Contact Number</span>}
            >
              <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. +61 400 000 000" />
            </Form.Item>
          </div>

          <div className="flex justify-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); form.resetFields() }}
              className="mr-3 px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#8C4BFF' }}
            >
              {submitting ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


