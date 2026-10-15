import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Select } from 'antd'
import { PlusOutlined, InfoCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import { useClinicStore } from '../../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { getWaitlist, createWaitlist, updateWaitlist, getBranches, getClinicDetails, getPatients, getPractitioners } from '../../../calendar/api/clinicAdminApi'
import NewScheduleModal from '../../../calendar/components/NewScheduleModal'

const { Option } = Select

export default function ClinicAdminWaitlist() {
  const store = useClinicStore()
  const [modalVisible, setModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [clinicName, setClinicName] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    getClinicDetails().then(res => {
      if (res && res.success && res.data && res.data.name) {
        setClinicName(res.data.name)
      }
    }).catch(() => { })
  }, [])

  const fetchWaitlistData = async () => {
    setLoading(true)
    try {
      const [res, branchesRes] = await Promise.all([
        getWaitlist({ search: searchText, appointmentType: typeFilter, status: statusFilter }),
        (!store.branches || store.branches.length === 0) ? getBranches() : Promise.resolve(null)
      ])
      if (res && res.success && Array.isArray(res.data)) {
        store.setWaitlist(res.data)
      }
      if (branchesRes && branchesRes.success && Array.isArray(branchesRes.data)) {
        store.setBranches(branchesRes.data)
      }
    } catch (err) {
      console.error('Failed to fetch waitlist or branches:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWaitlistData()
  }, [searchText, typeFilter, statusFilter])

  const handleAddWaitlist = async (values) => {
    setSubmitting(true)
    const entry = {
      clientName: values.clientName,
      dob: values.dob ? values.dob.format('YYYY-MM-DD') : '',
      contactNumber: values.contactNumber || '',
      address: values.address || '',
      preferredPractitioner: values.preferredPractitioner || 'Any Practitioner',
      preferredDate: values.preferredDate ? values.preferredDate.format('YYYY-MM-DD') : '',
      dateAdded: values.dateAdded ? values.dateAdded.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      appointmentType: values.appointmentType || 'Initial Assessment',
      status: values.status || 'Waiting',
      branch: values.branch || '',
    }

    try {
      const res = await createWaitlist(entry)
      if (res && res.success && res.data) {
        store.addToWaitlist(res.data)
        toast.success('Client added to the waitlist!')
        setModalVisible(false)
        form.resetFields()
        fetchWaitlistData()
      } else {
        toast.error('Failed to add client to waitlist')
      }
    } catch (err) {
      console.error('Add waitlist error:', err)
      toast.error('Error adding client to live waitlist database')
    } finally {
      setSubmitting(false)
    }
  }

  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState(null)
  const [bookingSlot, setBookingSlot] = useState(null)

  useEffect(() => {
    // Ensure patients & practitioners are loaded in store for booking pre-fill
    if (!store.patients || store.patients.length === 0) {
      getPatients().then(res => {
        if (res && res.success && Array.isArray(res.data)) store.setPatients(res.data)
      }).catch(() => {})
    }
    if (!store.practitioners || store.practitioners.length === 0) {
      getPractitioners().then(res => {
        if (res && res.success && Array.isArray(res.data)) store.setPractitioners(res.data)
      }).catch(() => {})
    }
  }, [])

  const handleBookFromWaitlist = (record) => {
    // Match client patient from store if available by name
    const matchedPatient = (store.patients || []).find(p => {
      const pName = (p.fullName || p.name || '').toLowerCase()
      return pName && (pName === (record.clientName || '').toLowerCase() || pName.includes((record.clientName || '').toLowerCase()))
    })

    // Match practitioner from store by preferred name
    const matchedPrac = (store.practitioners || []).find(p => {
      const prName = (p.name || '').toLowerCase()
      const prefName = (record.preferredPractitioner || '').toLowerCase()
      return prName && prefName && (prName.includes(prefName) || prefName.includes(prName))
    })

    // Match service by appointment type
    const matchedService = (store.services || []).find(s => {
      const sName = (s.name || '').toLowerCase()
      const aType = (record.appointmentType || '').toLowerCase()
      return sName && aType && (sName.includes(aType) || aType.includes(sName))
    })

    const slotData = {
      patientId: matchedPatient?.id || undefined,
      practitionerId: matchedPrac?.id || undefined,
      serviceId: matchedService?.id || undefined,
      date: record.preferredDate || dayjs().format('YYYY-MM-DD'),
      time: '09:00',
      location: record.branch || undefined
    }

    setSelectedWaitlistEntry(record)
    setBookingSlot(slotData)
    setBookingModalOpen(true)
  }

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      const res = await updateWaitlist(recordId, { status: newStatus })
      if (res && res.success && res.data) {
        store.updateWaitlistStatus(recordId, newStatus)
        toast.success(`Waitlist status updated to ${newStatus}`)
      }
    } catch (err) {
      console.error('Failed to update waitlist status:', err)
      toast.error('Failed to update waitlist status in database')
    }
  }

  const columns = [
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Client Name</span>,
      dataIndex: 'clientName',
      key: 'clientName',
      render: (text) => <span className="font-bold text-slate-800 dark:text-slate-200">{text}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">DOB</span>,
      dataIndex: 'dob',
      key: 'dob',
      render: (date) => <span className="text-slate-500 font-medium">{date ? dayjs(date).format('D MMM YYYY') : '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Contact Number</span>,
      dataIndex: 'contactNumber',
      key: 'contactNumber',
      render: (text) => <span className="text-slate-500 font-semibold">{text || '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Address</span>,
      dataIndex: 'address',
      key: 'address',
      render: (text) => <span className="text-slate-500 max-w-[200px] truncate block">{text || '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Preferred Practitioner</span>,
      dataIndex: 'preferredPractitioner',
      key: 'preferredPractitioner',
      render: (text) => <span className="text-slate-500">{text || '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Date Added</span>,
      dataIndex: 'dateAdded',
      key: 'dateAdded',
      render: (date) => <span className="text-slate-500">{date ? dayjs(date).format('D MMM YYYY') : '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Preferred Date</span>,
      dataIndex: 'preferredDate',
      key: 'preferredDate',
      render: (date) => <span className="text-slate-500">{date ? dayjs(date).format('D MMM YYYY') : '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Appointment Type</span>,
      dataIndex: 'appointmentType',
      key: 'appointmentType',
      render: (text) => <span className="text-slate-500">{text || '—'}</span>,
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const safeStatus = status || 'Waiting'
        return (
          <div className={`status-tag status-${safeStatus.toLowerCase()}`}>
            <Select
              value={safeStatus}
              onChange={(val) => handleStatusChange(record.id, val)}
              variant="borderless"
              className="waitlist-status-select"
            >
              <Option value="Waiting">Waiting</Option>
              <Option value="Contacted">Contacted</Option>
              <Option value="Booked">Booked</Option>
              <Option value="Cancelled">Cancelled</Option>
              <Option value="Declined">Declined</Option>
            </Select>
          </div>
        )
      },
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Action</span>,
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CalendarOutlined />}
          onClick={() => handleBookFromWaitlist(record)}
          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
          className="rounded-lg font-bold text-xs px-3 text-white shadow-sm flex items-center gap-1"
        >
          Book Appointment
        </Button>
      ),
    },
  ]


  const waitlistList = (store.waitlist || []).filter(Boolean)

  const filtered = waitlistList.filter((w) => {
    const q = searchText.toLowerCase()
    const matchSearch =
      !searchText ||
      (w.clientName || '').toLowerCase().includes(q) ||
      (w.preferredPractitioner || '').toLowerCase().includes(q) ||
      (w.appointmentType || '').toLowerCase().includes(q)

    const matchType = !typeFilter || w.appointmentType === typeFilter
    const matchStatus = !statusFilter || w.status === statusFilter

    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* ── Clinic Branded Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 mb-0">
            <span>{clinicName ? `${clinicName} — Waitlist Queue` : 'Waitlist Management'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 mb-0">
            Client waitlist queue, appointment preference, and branch allocation for {clinicName || 'your clinic'}.
          </p>
        </div>
      </div>

      {/* ── Top controls bar matching screenshot ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-[480px] relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search client, contact, practitioner..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full waitlist-search-input text-sm focus:outline-none focus:border-[#8C4BFF] transition-colors"
          />
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            placeholder="Appointment type"
            allowClear
            value={typeFilter || undefined}
            onChange={setTypeFilter}
            className="rounded-xl"
            style={{ width: 180, height: 38 }}
          >
            <Option value="Initial Assessment">Initial Assessment</Option>
            <Option value="Follow-Up">Follow-Up</Option>
            <Option value="NDIS Review">NDIS Review</Option>
            <Option value="Hydrotherapy">Hydrotherapy</Option>
            <Option value="Telehealth">Telehealth</Option>
            <Option value="Other">Other</Option>
          </Select>

          <Select
            placeholder="Status"
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            className="rounded-xl"
            style={{ width: 130, height: 38 }}
          >
            <Option value="Waiting">Waiting</Option>
            <Option value="Contacted">Contacted</Option>
            <Option value="Booked">Booked</Option>
            <Option value="Cancelled">Cancelled</Option>
            <Option value="Declined">Declined</Option>
          </Select>

          {/* Add Button "+" */}
          <button
            onClick={() => setModalVisible(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white border-none cursor-pointer transition-opacity hover:opacity-85 shadow-sm"
            style={{ backgroundColor: '#8C4BFF' }}
          >
            <PlusOutlined style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 shadow-sm rounded-2xl overflow-hidden"
        pagination={{
          pageSize: 15,
          showSizeChanger: false,
          showTotal: (total, range) => (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Showing {range[0]}-{range[1]} out of {total}
            </span>
          ),
          itemRender: (current, type, originalElement) => {
            if (type === 'prev') {
              return <span className="text-xs font-semibold select-none text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 cursor-pointer">&lt; Previous</span>
            }
            if (type === 'next') {
              return <span className="text-xs font-semibold select-none text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 cursor-pointer">Next &gt;</span>
            }
            return originalElement
          }
        }}
      />

      {/* Add Client Waitlist Modal */}
      <Modal
        title={
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white m-0">
              Add client to waitlist
            </h3>
            <p className="text-slate-400 text-xs font-semibold mt-0.5 mb-2">
              Add a client waiting for an appointment.
            </p>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={650}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleAddWaitlist}
          initialValues={{
            preferredPractitioner: 'Any Practitioner',
            appointmentType: 'Initial Assessment',
            dateAdded: dayjs(),
            status: 'Waiting',
          }}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-0">
            <Form.Item
              name="clientName"
              label={<span className="text-slate-500 font-semibold text-[11px]">Client name</span>}
              rules={[{ required: true, message: 'Please enter client name' }]}
              style={{ marginBottom: '10px' }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="dob"
              label={<span className="text-slate-500 font-semibold text-[11px]">Date of birth</span>}
              style={{ marginBottom: '10px' }}
            >
              <DatePicker className="w-full" format="DD-MM-YYYY" placeholder="dd-mm-yyyy" />
            </Form.Item>

            <div className="col-span-2">
              <Form.Item
                name="address"
                label={<span className="text-slate-500 font-semibold text-[11px]">Address</span>}
                style={{ marginBottom: '10px' }}
              >
                <Input />
              </Form.Item>
            </div>

            <Form.Item
              name="contactNumber"
              label={<span className="text-slate-500 font-semibold text-[11px]">Contact number</span>}
              rules={[{ required: true, message: 'Please enter contact number' }]}
              style={{ marginBottom: '10px' }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="preferredPractitioner"
              label={<span className="text-slate-500 font-semibold text-[11px]">Preferred practitioner</span>}
              rules={[{ required: true }]}
              style={{ marginBottom: '10px' }}
            >
              <Select placeholder="Select practitioner">
                <Option value="Any Practitioner">Any Practitioner</Option>
                {store.practitioners.map(p => (
                  <Option key={p.id} value={p.name}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="appointmentType"
              label={<span className="text-slate-500 font-semibold text-[11px]">Appointment type</span>}
              rules={[{ required: true }]}
              style={{ marginBottom: '10px' }}
            >
              <Select placeholder="Select appointment type">
                <Option value="Initial Assessment">Initial Assessment</Option>
                <Option value="Follow-Up">Follow-Up</Option>
                <Option value="NDIS Review">NDIS Review</Option>
                <Option value="Hydrotherapy">Hydrotherapy</Option>
                <Option value="Telehealth">Telehealth</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="dateAdded"
              label={<span className="text-slate-500 font-semibold text-[11px]">Date added</span>}
              rules={[{ required: true }]}
              style={{ marginBottom: '10px' }}
            >
              <DatePicker className="w-full" format="DD-MM-YYYY" />
            </Form.Item>

            <Form.Item
              name="preferredDate"
              label={<span className="text-slate-500 font-semibold text-[11px]">Preferred date</span>}
              style={{ marginBottom: '10px' }}
            >
              <DatePicker className="w-full" format="DD-MM-YYYY" placeholder="dd-mm-yyyy" />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="text-slate-500 font-semibold text-[11px]">Status</span>}
              rules={[{ required: true }]}
              style={{ marginBottom: '10px' }}
            >
              <Select placeholder="Select status">
                <Option value="Waiting">Waiting</Option>
                <Option value="Contacted">Contacted</Option>
                <Option value="Booked">Booked</Option>
                <Option value="Cancelled">Cancelled</Option>
                <Option value="Declined">Declined</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="branch"
              label={<span className="text-slate-500 font-semibold text-[11px]">Branch Assignment</span>}
              rules={[{ required: true, message: 'Please select branch' }]}
              style={{ marginBottom: '10px' }}
            >
              <Select placeholder="Select branch">
                {store.branches.map(b => (
                  <Option key={b.id} value={b.name}>{b.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button onClick={() => setModalVisible(false)} className="rounded-xl font-bold h-10 px-5">
              Cancel
            </Button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white border-none font-bold rounded-xl h-10 px-5 cursor-pointer flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
              style={{ outline: 'none' }}
            >
              {submitting ? 'Adding...' : 'Add to waitlist'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* ── Appointment Booking Modal triggered from Waitlist ── */}
      {bookingModalOpen && (
        <NewScheduleModal
          open={bookingModalOpen}
          defaultTimeSlot={bookingSlot}
          onCancel={() => {
            setBookingModalOpen(false)
            if (selectedWaitlistEntry) {
              handleStatusChange(selectedWaitlistEntry.id, 'Booked')
            }
            setSelectedWaitlistEntry(null)
            setBookingSlot(null)
          }}
        />
      )}
    </div>
  )
}


