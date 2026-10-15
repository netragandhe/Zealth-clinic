import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, Form, Input, Select, Button, Modal, Switch } from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import { getContactById, createContact, updateContact, deleteContact } from '../../calendar/api/clinicAdminApi'

const { Option } = Select

export default function ContactProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useClinicStore()
  const isNew = id === 'new'
  const basePath = window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '/clinic'
  const [form] = Form.useForm()

  const [contactData, setContactData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newLogText, setNewLogText] = useState('')
  const [logs, setLogs] = useState([])

  // Default empty contact state if isNew
  const defaultContact = React.useMemo(() => ({
    name: '',
    type: 'Support Coordinator',
    title: '',
    occupation: '',
    company: '',
    email: '',
    mobileNumber: '',
    workPhone: '',
    secondaryPhone: '',
    addressSearch: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    notes: '',
    associatedClients: [],
    noteLogs: [],
  }), [])

  // Load contact data from live database API if not new
  useEffect(() => {
    if (isNew) {
      setContactData(defaultContact)
      form.setFieldsValue(defaultContact)
      setLogs([])
    } else {
      setLoading(true)
      getContactById(id)
        .then((res) => {
          if (res && res.success && res.data) {
            setContactData(res.data)
            form.setFieldsValue(res.data)
            setLogs(res.data.noteLogs || [])
            store.updateContact(res.data)
          } else {
            // fallback to store
            const storeC = store.contacts.find(c => c?.id === id)
            if (storeC) {
              setContactData(storeC)
              form.setFieldsValue(storeC)
              setLogs(storeC.noteLogs || [])
            }
          }
        })
        .catch((err) => {
          console.error('Error fetching contact details:', err)
          const storeC = store.contacts.find(c => c?.id === id)
          if (storeC) {
            setContactData(storeC)
            form.setFieldsValue(storeC)
            setLogs(storeC.noteLogs || [])
          }
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, form])

  const contact = contactData || (isNew ? defaultContact : store.contacts.find(c => c?.id === id))

  const handleAddLog = async () => {
    if (!newLogText.trim() || !contact) return
    const newLog = {
      id: `log_${Date.now()}`,
      text: newLogText,
      timestamp: new Date().toLocaleString(),
      author: store.userRole === 'clinic' ? 'Admin Staff' : 'Practitioner'
    }
    const updatedLogs = [newLog, ...logs]
    setLogs(updatedLogs)
    setNewLogText('')

    try {
      if (!isNew && contact.id) {
        const res = await updateContact(contact.id, { noteLogs: updatedLogs })
        if (res && res.success && res.data) {
          setContactData(res.data)
          store.updateContact(res.data)
        }
      }
      toast.success('Note log entry added!')
    } catch (err) {
      console.error('Failed to add note log:', err)
      toast.error('Error saving note log to database')
    }
  }

  if (!contact && !isNew && !loading) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Contact Not Found</h3>
        <Button onClick={() => navigate(`${basePath}/contacts`)} className="mt-4 rounded-xl">
          Back to Directory
        </Button>
      </div>
    )
  }

  const handleSave = async (values) => {
    setSubmitting(true)
    const formattedValues = {
      ...contact,
      ...values,
      noteLogs: logs,
    }

    try {
      if (isNew) {
        const res = await createContact(formattedValues)
        if (res && res.success && res.data) {
          store.addContact(res.data)
          toast.success('Contact created successfully in live database!')
          navigate(`${basePath}/contacts`)
        } else {
          toast.error('Failed to create contact')
        }
      } else {
        const res = await updateContact(contact.id, formattedValues)
        if (res && res.success && res.data) {
          setContactData(res.data)
          store.updateContact(res.data)
          toast.success('Contact details updated successfully!')
        } else {
          toast.error('Failed to update contact')
        }
      }
    } catch (err) {
      console.error('Save contact error:', err)
      toast.error('Error saving contact to live database')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteContact = () => {
    Modal.confirm({
      title: 'Delete Contact?',
      content: `Are you sure you want to permanently delete the contact ${contact?.name || ''}?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (contact && contact.id) {
            await deleteContact(contact.id)
            store.deleteContact(contact.id)
            toast.success('Contact deleted successfully from live database.')
          }
          navigate(`${basePath}/contacts`)
        } catch (err) {
          console.error('Delete contact error:', err)
          toast.error('Failed to delete contact from backend database')
        }
      },
    })
  }


  return (
    <div className="space-y-6 client-profile-container">
      {/* Back link */}
      <div>
        <Link
          to={`${basePath}/contacts`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#8C4BFF] transition-colors font-sans"
        >
          <ArrowLeftOutlined style={{ fontSize: 10 }} /> Back to contacts details
        </Link>
      </div>

      {/* Page Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
          Contacts
        </h2>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold select-none shadow-inner flex-shrink-0"
          style={{ backgroundColor: '#8C4BFF' }}
        >
          {isNew ? 'NC' : contact.name ? contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isNew ? 'New contact' : contact.name}
          </h3>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">
            {isNew ? 'contact' : contact.type}
          </p>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="space-y-6"
      >
        {/* General Details Card */}
        <Card
          title={
            <div className="flex justify-between items-center w-full py-1">
              <span className="font-extrabold text-sm text-slate-855 dark:text-white flex items-center gap-2">
                <UserOutlined style={{ color: '#8C4BFF' }} /> General Details
              </span>
              <button
                type="submit"
                className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white border-none font-bold rounded-lg h-9 px-5 text-xs cursor-pointer flex items-center justify-center transition-colors shadow-sm"
                style={{ color: '#ffffff', outline: 'none', backgroundColor: '#8C4BFF' }}
              >
                Save changes
              </button>
            </div>
          }
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="text-slate-500 font-semibold text-xs">Name *</span>}
              rules={[{ required: true, message: 'Please enter contact name' }]}
            >
              <Input placeholder="Person name" className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="type"
              label={<span className="text-slate-500 font-semibold text-xs">Type</span>}
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select placeholder="Select type" className="rounded-xl h-10 border-slate-200" style={{ height: 40 }}>
                {['Support Coordinator', 'Plan Manager', 'Nominee', 'Family Member', 'Provider', 'GP', 'Specialist', 'Other'].map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="title"
              label={<span className="text-slate-500 font-semibold text-xs">Title</span>}
            >
              <Input placeholder="e.g. Dr, Mr, Ms" className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="occupation"
              label={<span className="text-slate-500 font-semibold text-xs">Occupation</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="company"
              label={<span className="text-slate-500 font-semibold text-xs">Company</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="isMedicalReferrer"
              label={<span className="text-slate-500 font-semibold text-xs">GP / Specialist Status</span>}
              valuePropName="checked"
            >
              <Switch checkedChildren="GP/Specialist" unCheckedChildren="Standard Contact" />
            </Form.Item>
          </div>
        </Card>

        {/* Contact Details Card */}
        <Card
          title={
            <span className="font-extrabold text-sm text-slate-855 dark:text-white flex items-center gap-2">
              <PhoneOutlined style={{ color: '#8C4BFF' }} /> Contact Details
            </span>
          }
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label={<span className="text-slate-500 font-semibold text-xs">Email</span>}
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="mobileNumber"
              label={<span className="text-slate-500 font-semibold text-xs">Mobile Number</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="workPhone"
              label={<span className="text-slate-500 font-semibold text-xs">Work Phone</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="secondaryPhone"
              label={<span className="text-slate-500 font-semibold text-xs">Secondary Phone Number</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
          </div>
        </Card>

        {/* Linked Clients Card */}
        <Card
          title={
            <span className="font-extrabold text-sm text-slate-855 dark:text-white flex items-center gap-2">
              <UserOutlined style={{ color: '#8C4BFF' }} /> Linked Clients
            </span>
          }
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
        >
          <Form.Item
            name="associatedClients"
            label={<span className="text-slate-500 font-semibold text-xs">Link clients to this contact (Select multiple)</span>}
          >
            <Select
              mode="multiple"
              placeholder="Select client/s to link"
              className="rounded-xl flex items-center min-h-[40px]"
            >
              {store.patients.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        {/* Address Details Card */}
        <Card
          title={
            <span className="font-extrabold text-sm text-slate-855 dark:text-white flex items-center gap-2">
              <HomeOutlined style={{ color: '#8C4BFF' }} /> Address Details
            </span>
          }
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Form.Item
                name="addressSearch"
                label={<span className="text-slate-500 font-semibold text-xs">Address Search</span>}
              >
                <Input placeholder="Start typing to search an address..." className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
              </Form.Item>
            </div>
            <div className="md:col-span-2">
              <Form.Item
                name="address"
                label={<span className="text-slate-500 font-semibold text-xs">Address</span>}
              >
                <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
              </Form.Item>
            </div>
            <Form.Item
              name="city"
              label={<span className="text-slate-500 font-semibold text-xs">City / Town</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="state"
              label={<span className="text-slate-500 font-semibold text-xs">State / Region</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="postcode"
              label={<span className="text-slate-500 font-semibold text-xs">Postcode</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
            <Form.Item
              name="country"
              label={<span className="text-slate-500 font-semibold text-xs">Country</span>}
            >
              <Input className="rounded-xl h-10 bg-[#F1F5F9]/50 border-slate-200" />
            </Form.Item>
          </div>
        </Card>

        {/* Notes Card */}
        <Card
          title={
            <span className="font-extrabold text-sm text-slate-855 dark:text-white flex items-center gap-2">
              <FileTextOutlined style={{ color: '#8C4BFF' }} /> Notes
            </span>
          }
          className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
        >
          <Form.Item
            name="notes"
            label={
              <span className="text-slate-400 font-semibold text-xs">
                Additional information (preferred contact method, best times to call, relationship to participant, invoicing instructions, referral info...)
              </span>
            }
          >
            <Input.TextArea
              placeholder="Add any additional notes about this contact..."
              rows={4}
              className="rounded-xl bg-[#F1F5F9]/50 border-slate-200"
            />
          </Form.Item>
        </Card>

        {/* Note Logs Card (Timeline logs) */}
        {!isNew && (
          <Card
            title={
              <span className="font-extrabold text-sm text-slate-855 dark:text-white flex items-center gap-2">
                <FileTextOutlined style={{ color: '#8C4BFF' }} /> Contact Note Logs
              </span>
            }
            className="border border-slate-150 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm mt-6"
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input.TextArea
                  placeholder="Enter a new log entry for this contact..."
                  value={newLogText}
                  onChange={e => setNewLogText(e.target.value)}
                  rows={2}
                  className="rounded-xl flex-1 bg-[#F1F5F9]/50 border-slate-200"
                />
                <Button 
                  type="primary" 
                  onClick={handleAddLog}
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', height: 'fit-content' }}
                  className="rounded-xl font-bold h-10 px-5"
                >
                  Add Log
                </Button>
              </div>

              <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={log.id || index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs leading-relaxed">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                      <span>{log.author || 'Staff'}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="m-0 text-slate-700 dark:text-slate-300 font-medium">{log.text}</p>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-4 font-semibold">No note logs recorded for this contact yet.</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Delete Contact Button at bottom if not new */}
        {!isNew && (
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteContact}
              className="rounded-xl font-bold h-11 px-6 flex items-center shadow-md shadow-red-500/10 cursor-pointer"
            >
              Delete Contact
            </Button>
          </div>
        )}
      </Form>
    </div>
  )
}
