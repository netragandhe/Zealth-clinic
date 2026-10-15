import React, { useState, useEffect } from 'react'
import {
  Table, Input, Select, Space, Modal, Form, Tag,
  TimePicker, Switch, Tooltip, Divider, InputNumber,
} from 'antd'
import {
  SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, InfoCircleOutlined, BankOutlined,
  UserOutlined, CalendarOutlined, TrophyOutlined,
  ClockCircleOutlined, DollarOutlined, TeamOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '../../../store/clinicStore'
import dayjs from 'dayjs'
import { getPractitioners, createPractitioner, updatePractitioner, deletePractitioner, getBranches } from '../../calendar/api/clinicAdminApi'

const { Option } = Select
const { TextArea } = Input

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SPECIALTIES = [
  'Physiotherapist', 'Chiropractor', 'Occupational Therapist', 'Exercise Physiologist',
  'Speech Pathologist', 'Psychologist', 'Dietitian', 'Podiatrist', 'Osteopath',
  'General Practitioner', 'Specialist Doctor', 'Other'
]

const PALETTE = [
  '#30D2BE', '#8C4BFF', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#EC4899', '#F97316', '#0E1B33',
]

const defaultAvailability = () => {
  const av = {}
  DAYS.forEach((d) => {
    av[d] = {
      available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d),
      startTime: '09:00',
      endTime: '17:00',
    }
  })
  return av
}

function AvailabilityEditor({ value, onChange }) {
  const handleToggle = (day, checked) => {
    onChange({ ...value, [day]: { ...value[day], available: checked } })
  }
  const handleTime = (day, field, timeVal) => {
    const str = timeVal ? timeVal.format('HH:mm') : '09:00'
    onChange({ ...value, [day]: { ...value[day], [field]: str } })
  }
  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const slot = value?.[day] || { available: false, startTime: '09:00', endTime: '17:00' }
        return (
          <div key={day} className="flex items-center gap-3">
            <Switch
              size="small"
              checked={slot.available}
              onChange={(c) => handleToggle(day, c)}
            />
            <span
              className="text-sm font-semibold w-24 flex-shrink-0"
              style={{ color: slot.available ? '#0E1B33' : '#CBD5E1' }}
            >
              {day}
            </span>
            {slot.available ? (
              <div className="flex items-center gap-2">
                <TimePicker
                  size="small"
                  format="HH:mm"
                  value={dayjs(slot?.startTime || '09:00', 'HH:mm')}
                  onChange={(t) => handleTime(day, 'startTime', t)}
                  allowClear={false}
                  style={{ width: 90 }}
                />
                <span className="text-slate-400 text-xs font-semibold">to</span>
                <TimePicker
                  size="small"
                  format="HH:mm"
                  value={dayjs(slot?.endTime || '17:00', 'HH:mm')}
                  onChange={(t) => handleTime(day, 'endTime', t)}
                  allowClear={false}
                  style={{ width: 90 }}
                />
              </div>
            ) : (
              <span className="text-slate-300 text-xs italic">Unavailable</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DoctorsManagePage() {
  const store = useClinicStore()
  const navigate = useNavigate()

  const [practitionerList, setPractitionerList] = useState([])
  const practitioners = practitionerList
  const [branchList, setBranchList] = useState(store.branches || [])
  const branches = branchList
  const [loading, setLoading] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [specialtyFilter, setSpecialtyFilter] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'availability' | 'qualifications'
  const [currentDoc, setCurrentDoc] = useState(null)
  const [pickedColor, setPickedColor] = useState('#8C4BFF')
  const [availability, setAvailability] = useState(defaultAvailability())
  const [qualInput, setQualInput] = useState('')
  const [quals, setQuals] = useState([])
  const [form] = Form.useForm()
  const formSpecialty = Form.useWatch('specialty', form)

  const loadPractitioners = async () => {
    setLoading(true)
    try {
      const res = await getPractitioners()
      if (res && res.success && res.data) {
        setPractitionerList(res.data)
      } else if (store.practitioners && store.practitioners.length > 0) {
        setPractitionerList(store.practitioners)
      }
    } catch (err) {
      console.error("Failed to load practitioners from database:", err)
      if (store.practitioners && store.practitioners.length > 0) {
        setPractitionerList(store.practitioners)
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
    loadPractitioners()
    loadBranches()
  }, [])

  const openAdd = () => {
    setCurrentDoc(null)
    setModalMode('add')
    setActiveTab('info')
    setPickedColor('#8C4BFF')
    setAvailability(defaultAvailability())
    setQuals([])
    setQualInput('')
    form.resetFields()
    form.setFieldsValue({ status: 'Active', consultationFee: 0, registrationNumber: '', servicesOffered: [] })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setCurrentDoc(record)
    setModalMode('edit')
    setActiveTab('info')
    setPickedColor(record.color || '#8C4BFF')
    setAvailability(record.availability || defaultAvailability())
    setQuals(record.qualifications || [])
    setQualInput('')

    const isStandardSpec = SPECIALTIES.filter(s => s !== 'Other').includes(record.specialty)
    const specVal = isStandardSpec ? record.specialty : 'Other'
    const customSpecVal = isStandardSpec ? '' : (record.specialty || '')

    form.setFieldsValue({
      name: record.name,
      specialty: specVal,
      customSpecialty: customSpecVal,
      email: record.email,
      phone: record.phone,
      status: record.status,
      assignedBranches: record.assignedBranches || [],
      consultationFee: record.consultationFee || 0,
      bio: record.bio || '',
      registrationNumber: record.registrationNumber || '',
      servicesOffered: record.servicesOffered || [],
    })
    setModalOpen(true)
  }

  const openView = (record) => {
    setCurrentDoc(record)
    setModalMode('view')
    setAvailability(record.availability || defaultAvailability())
    setQuals(record.qualifications || [])
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalMode('add')
    setCurrentDoc(null)
    form.resetFields()
  }

  const addQual = () => {
    const trimmed = qualInput.trim()
    if (trimmed && !quals.includes(trimmed)) {
      setQuals([...quals, trimmed])
      setQualInput('')
    }
  }

  const removeQual = (q) => setQuals(quals.filter((x) => x !== q))

  const handleSubmit = async (values) => {
    const finalSpecialty = values.specialty === 'Other' ? (values.customSpecialty?.trim() || 'Other') : values.specialty
    const payload = { ...values, specialty: finalSpecialty }
    delete payload.customSpecialty

    const data = { ...payload, color: pickedColor, availability, qualifications: quals }
    try {
      if (modalMode === 'add') {
        const res = await createPractitioner(data)
        if (res && res.success) {
          toast.success('Practitioner added to live database!')
          if (store.addPractitioner) store.addPractitioner(res.data)
          await loadPractitioners()
          closeModal()
        } else {
          toast.error(res?.message || 'Failed to add practitioner')
        }
      } else {
        const res = await updatePractitioner(currentDoc.id, data)
        if (res && res.success) {
          toast.success('Practitioner updated in live database!')
          if (store.editPractitioner) store.editPractitioner({ ...currentDoc, ...data })
          await loadPractitioners()
          closeModal()
        } else {
          toast.error(res?.message || 'Failed to update practitioner')
        }
      }
    } catch (err) {
      console.error("Error saving practitioner:", err)
      const errorMsg = err?.response?.data?.message || 'Error saving practitioner to live database'
      toast.error(errorMsg)
    }
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Practitioner?',
      content: `Are you sure you want to remove "${record.name}"? This cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await deletePractitioner(record.id)
          if (res && res.success) {
            toast.success(`Removed practitioner: ${record.name}`)
            if (store.deletePractitioner) store.deletePractitioner(record.id)
            await loadPractitioners()
          } else {
            toast.error(res?.message || 'Failed to delete practitioner')
          }
        } catch (err) {
          console.error("Failed to delete practitioner:", err)
          toast.error('Failed to delete practitioner from database')
        }
      },
    })
  }

  const filtered = practitionerList.filter((p) => {
    const q = searchText.toLowerCase()
    const matchSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.specialty || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    const matchStatus = statusFilter ? p.status === statusFilter : true
    const matchSpec = specialtyFilter ? p.specialty === specialtyFilter : true
    return matchSearch && matchStatus && matchSpec
  })

  // Stats
  const totalActive = practitionerList.filter((p) => p.status === 'Active').length
  const totalInactive = practitionerList.filter((p) => p.status !== 'Active').length
  const specialties = [...new Set([...SPECIALTIES.filter(s => s !== 'Other'), ...practitionerList.map((p) => p.specialty).filter(Boolean)])]

  const columns = [
    {
      title: 'Practitioner',
      key: 'practitioner',
      width: '28%',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: r.color || '#8C4BFF' }}
          >
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
      title: 'Specialty',
      dataIndex: 'specialty',
      key: 'specialty',
      width: '20%',
      render: (v) => (
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20">
          {v}
        </span>
      ),
    },
    {
      title: 'Branches',
      dataIndex: 'assignedBranches',
      key: 'assignedBranches',
      width: '18%',
      render: (ids) => {
        if (!ids || ids.length === 0)
          return <span className="text-slate-400 text-xs font-semibold italic">All Branches</span>
        const names = ids
          .map((id) => branchList.find((b) => b.id === id)?.name)
          .filter(Boolean)
        return (
          <div className="flex flex-wrap gap-1">
            {names.slice(0, 2).map((n) => (
              <span key={n} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700">
                {n}
              </span>
            ))}
            {names.length > 2 && (
              <Tooltip title={names.slice(2).join(', ')}>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300 cursor-pointer">
                  +{names.length - 2}
                </span>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: 'Fee',
      dataIndex: 'consultationFee',
      key: 'consultationFee',
      width: '10%',
      render: (v) => (
        <span className="text-slate-600 font-semibold text-sm">${v || 0}</span>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: '12%',
      render: (v) => <span className="text-slate-500 text-sm">{v}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${status === 'Active' ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20' : 'bg-[#EEF2F6] text-[#64748B] dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700'
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
          <Tooltip title="Edit">
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
          <Tooltip title="Delete">
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

  const itemRender = (current, type, el) => {
    if (type === 'prev') return <span className="text-slate-500 font-semibold cursor-pointer">&lt; Previous</span>
    if (type === 'next') return <span className="text-slate-500 font-semibold cursor-pointer">Next &gt;</span>
    return el
  }

  // Tab button helper
  const TabBtn = ({ id, icon, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all ${activeTab === id
        ? 'bg-[#8C4BFF] text-white shadow-sm font-bold'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
    >
      {icon}
      {label}
    </button>
  )

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
              {isEdit ? 'Edit Practitioner' : 'Add New Practitioner'}
            </h1>
            <p className="text-slate-400 dark:text-slate-455 text-xs mt-0.5">
              {isEdit
                ? 'Update practitioner details, availability, and qualifications.'
                : 'Fill in basic info, set availability and add qualifications.'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Tab Nav */}
          <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <TabBtn id="info" icon={<UserOutlined />} label="Basic Info" />
            <TabBtn id="availability" icon={<CalendarOutlined />} label="Availability" />
            <TabBtn id="qualifications" icon={<TrophyOutlined />} label="Qualifications" />
          </div>

          <Form layout="vertical" form={form} onFinish={handleSubmit} className="space-y-6">

            {/* ---- TAB: BASIC INFO ---- */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <Form.Item
                  name="name"
                  label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Full Name *</span>}
                  rules={[{ required: true, message: 'Name is required' }]}
                  className="mb-0"
                >
                  <Input placeholder="e.g. Dr. Sarah Jenkins" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="email"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Email *</span>}
                    rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
                    className="mb-0"
                  >
                    <Input placeholder="dr@clinic.com" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">{modalMode === 'add' ? 'Login Password *' : 'Change Password (optional)'}</span>}
                    rules={modalMode === 'add' ? [{ required: true, message: 'Password required for practitioner login' }] : []}
                    className="mb-0"
                  >
                    <Input.Password placeholder={modalMode === 'add' ? 'Enter login password (e.g. Sarah@2026)' : 'Leave blank to keep existing'} className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Form.Item
                    name="phone"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Phone *</span>}
                    rules={[{ required: true, message: 'Phone required' }]}
                    className="mb-0"
                  >
                    <Input placeholder="+61 412 100 001" className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
                  </Form.Item>
                  <Form.Item
                    name="specialty"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Specialty *</span>}
                    rules={[{ required: true, message: 'Specialty required' }]}
                    className="mb-0"
                  >
                    <Select placeholder="Select specialty" className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                      {SPECIALTIES.map((s) => (
                        <Option key={s} value={s}>{s}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="status"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Status</span>}
                    initialValue="Active"
                    className="mb-0"
                  >
                    <Select className="rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                      <Option value="Active">Active</Option>
                      <Option value="Inactive">Inactive</Option>
                    </Select>
                  </Form.Item>
                </div>

                {formSpecialty === 'Other' && (
                  <Form.Item
                    name="customSpecialty"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Specify Custom Specialty *</span>}
                    rules={[{ required: true, message: 'Custom specialty required' }]}
                    className="mb-0 mt-3"
                  >
                    <Input placeholder="e.g. Neurologist, Cardiologist, Dermatologist..." className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
                  </Form.Item>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="consultationFee"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Consultation Fee ($)</span>}
                    initialValue={150}
                    className="mb-0"
                  >
                    <InputNumber min={0} className="w-full rounded-xl h-10 flex items-center dark:bg-slate-900 border-slate-200 dark:border-slate-850" />
                  </Form.Item>

                  <Form.Item
                    name="assignedBranches"
                    label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Assign Branches</span>}
                    className="mb-0"
                  >
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

                <div>
                  <span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider block mb-2">Calendar Color</span>
                  <div className="flex gap-2">
                    {PALETTE.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setPickedColor(hex)}
                        className="w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 flex items-center justify-center text-white text-xs"
                        style={{
                          backgroundColor: hex,
                          borderColor: pickedColor === hex ? '#ffffff' : 'transparent',
                          boxShadow: pickedColor === hex ? '0 0 0 2px #8C4BFF' : 'none',
                        }}
                      >
                        {pickedColor === hex && '✓'}
                      </button>
                    ))}
                  </div>
                </div>

                <Form.Item name="bio" label={<span className="text-slate-555 font-bold text-[11px] uppercase tracking-wider">Short Biography</span>} className="mb-0">
                  <TextArea rows={3} placeholder="Brief description of experience..." className="rounded-xl border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white" />
                </Form.Item>
              </div>
            )}

            {/* ---- TAB: AVAILABILITY ---- */}
            {activeTab === 'availability' && (
              <div>
                <p className="text-slate-400 text-xs mb-3 font-semibold">
                  Toggle working days and set start / end hours. This drives online booking slot availability.
                </p>
                <AvailabilityEditor value={availability} onChange={setAvailability} />
              </div>
            )}

            {/* ---- TAB: QUALIFICATIONS ---- */}
            {activeTab === 'qualifications' && (
              <div>
                <p className="text-slate-400 text-xs mb-3 font-semibold">
                  Add degrees, certifications, registration numbers, or memberships.
                </p>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="e.g. BPhty (Hons), AHPRA Registered..."
                    value={qualInput}
                    onChange={(e) => setQualInput(e.target.value)}
                    onPressEnter={addQual}
                    className="flex-1 rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-slate-808 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addQual}
                    className="bg-[#0E1B33] text-white font-bold px-5 h-10 rounded-xl border-none cursor-pointer text-xs"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  {quals.length === 0 ? (
                    <span className="text-slate-300 text-xs italic">No qualifications added yet.</span>
                  ) : (
                    quals.map((q) => (
                      <Tag
                        key={q}
                        closable
                        onClose={() => removeQual(q)}
                        color="purple"
                        className="rounded-full px-3 py-1 font-semibold text-xs flex items-center gap-1"
                      >
                        {q}
                      </Tag>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                {isEdit ? 'Save Changes' : 'Add Practitioner'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    )
  }

  if (modalMode === 'view' && currentDoc) {
    return (
      <div className="space-y-6 animate-slide-in">
        {/* Navigation & Action Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button
            onClick={closeModal}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer"
          >
            <span className="text-sm">←</span>
            <span>Back to Practitioners</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                closeModal()
                openEdit(currentDoc)
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold h-9 rounded-xl cursor-pointer text-xs transition-colors flex items-center gap-1.5"
            >
              <EditOutlined style={{ fontSize: 13 }} />
              <span>Edit Practitioner</span>
            </button>
            <button
              onClick={() => {
                closeModal()
                handleDelete(currentDoc)
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-655 text-white font-bold h-9 rounded-xl cursor-pointer border-none text-xs transition-colors flex items-center gap-1.5"
            >
              <DeleteOutlined style={{ fontSize: 13 }} />
              <span>Delete Practitioner</span>
            </button>
          </div>
        </div>

        {/* Profile Banner */}
        <div
          className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${currentDoc.color || '#8C4BFF'}, #0E1B33)` }}
        >
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            <UserOutlined style={{ fontSize: 200 }} />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#8C4BFF] bg-white dark:bg-slate-900 font-bold text-2xl flex-shrink-0 shadow-sm">
              {(currentDoc.name || '?')[0].toUpperCase()}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold m-0 text-white leading-none">{currentDoc.name}</h2>
              <p className="text-xs text-white/80 m-0 mt-1">{currentDoc.email} &bull; {currentDoc.phone || 'No phone'}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white">
                  {currentDoc.specialty}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${currentDoc.status === 'Active' ? 'bg-[#30D2BE] text-[#0E1B33]' : 'bg-slate-100/20 text-slate-300'
                    }`}
                >
                  {currentDoc.status}
                </span>
                <span className="text-white/95 text-xs font-semibold">${currentDoc.consultationFee || 0} / session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details and Availability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5">Practitioner Profile Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Email Address</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDoc.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Phone Number</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDoc.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Join Date</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDoc.joinDate || 'Jan 1, 2025'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Consultation Fee</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">${currentDoc.consultationFee || 0} AUD</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Registration Number</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDoc.registrationNumber || '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Services Offered</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {(currentDoc.servicesOffered || []).join(', ') || 'All services offered'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Assigned Branches</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(currentDoc.assignedBranches || []).length === 0 ? (
                      <span className="text-slate-400 text-xs font-semibold italic mt-1 block">All Branches (Unassigned)</span>
                    ) : (
                      (currentDoc.assignedBranches || []).map((bid) => {
                        const br = branchList.find((b) => b.id === bid)
                        return (
                          <span
                            key={bid}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20"
                          >
                            {br ? br.name : bid}
                          </span>
                        )
                      })
                    )}
                  </div>
                </div>
                {currentDoc.bio && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px] mb-1">Short Biography</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{currentDoc.bio}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5">Qualifications &amp; Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {(currentDoc.qualifications || []).length === 0 ? (
                  <span className="text-slate-300 text-sm">No qualifications listed</span>
                ) : (
                  (currentDoc.qualifications || []).map((q) => (
                    <span
                      key={q}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#10B981]"
                    >
                      {q}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Weekly Availability</h3>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const slot = currentDoc.availability?.[day]
                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${slot?.available ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#F8FAFC] dark:bg-slate-900 text-slate-300 dark:bg-slate-950/40'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${slot?.available ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
                        <span>{day}</span>
                      </div>
                      {slot?.available && (
                        <span className="text-slate-500 font-bold">{slot?.startTime || '09:00'} – {slot?.endTime || '17:00'}</span>
                      )}
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
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Practitioners</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Manage practitioners, availability &amp; specialties
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search name, specialty, email..."
            prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 border border-slate-200 rounded-xl"
            style={{ width: 250 }}
          />
          <Select
            placeholder="Specialty"
            allowClear
            value={specialtyFilter}
            onChange={setSpecialtyFilter}
            style={{ width: 170, height: 40 }}
          >
            {specialties.map((s) => (
              <Option key={s} value={s}>{s}</Option>
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
            Add Practitioner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Practitioners', value: practitionerList.length, icon: <TeamOutlined />, color: '#8C4BFF' },
          { label: 'Active', value: totalActive, icon: <UserOutlined />, color: '#10B981' },
          { label: 'Inactive', value: totalInactive, icon: <ClockCircleOutlined />, color: '#64748B' },
          { label: 'Specialties', value: specialties.length, icon: <TrophyOutlined />, color: '#0E1B33' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ background: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0E1B33] dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
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
    </div>
  )
}
