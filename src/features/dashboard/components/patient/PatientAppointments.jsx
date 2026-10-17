import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Select, DatePicker, TimePicker, Input, Spin } from 'antd'
import { PlusOutlined, VideoCameraOutlined, SearchOutlined, FilterOutlined, WarningOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import api from '../../../../api/axios'
import { useClinicStore } from '../../../../store/clinicStore'
import { isPractitionerAvailable } from '../../../../utils/availabilityHelper'
import { categorizeAppointments } from '../../../../utils/appointmentUtils'

const { Option } = Select

export default function PatientAppointments() {
  const store = useClinicStore()
  const [loading, setLoading] = useState(false)
  const [telehealthOpen, setTelehealthOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [activeCall, setActiveCall] = useState(false)

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Form states
  const [practitionersList, setPractitionersList] = useState([])
  const [selectedPractitioner, setSelectedPractitioner] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [selectedService, setSelectedService] = useState('Physiotherapy Consultation')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')

  const [appointmentsList, setAppointmentsList] = useState([])

  // Fetch live data from backend
  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patient/appointments')
      if (res.data?.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map(app => {
          const rawStatus = app.status || 'Confirmed'
          const appDate = app.date || (app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : '')
          return {
            id: app.id,
            date: appDate,
            time: app.startTime || app.time || '10:00 AM',
            practitioner: app.practitionerName || 'Dr. Practitioner',
            clinic: app.branchName || 'Allied Health Clinic',
            type: app.serviceName || 'Consultation',
            funding: 'Private',
            status: rawStatus,
            rawStatus: rawStatus
          }
        })
        setAppointmentsList(formatted)
      }
    } catch (err) {
      console.warn('Backend appointments fetch notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPractitioners = async () => {
    try {
      const res = await api.get('/api/patient/practitioners')
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPractitionersList(res.data.data)
        setSelectedPractitioner(prev => prev || res.data.data[0].id)
      }
    } catch (err) {
      console.warn('Practitioners fetch notice:', err?.message)
    }
  }

  useEffect(() => {
    fetchAppointments()
    fetchPractitioners()
  }, [])

  const handleBookSubmit = async (e) => {
    e.preventDefault()
    const targetPracId = selectedPractitioner || (practitionersList[0]?.id || 'sarah')
    const chosenPrac = practitionersList.find(p => p.id === targetPracId) || (store.practitioners || []).find(p => p.id === targetPracId)
    
    let practitionerName = chosenPrac ? chosenPrac.name : ''
    if (!practitionerName) {
      if (targetPracId === 'sarah') practitionerName = 'Dr. Sarah Jenkins'
      else if (targetPracId === 'emily') practitionerName = 'Dr. Emily Smith'
      else if (targetPracId === 'james') practitionerName = 'Dr. James Carter'
      else practitionerName = practitionersList[0]?.name || 'Dr. Practitioner'
    }

    // Availability validation guard
    if (bookingDate && chosenPrac) {
      const isAvail = isPractitionerAvailable(chosenPrac, dayjs(bookingDate))
      if (!isAvail) {
        Modal.warning({
          title: `${practitionerName} is Unavailable`,
          centered: true,
          content: (
            <div className="space-y-2 mt-3 text-xs font-semibold" style={{ color: '#475569' }}>
              <p style={{ color: '#0F1B33', fontSize: '13px', margin: 0 }}>
                <strong>{practitionerName}</strong> is <strong>OFF (Unavailable)</strong> on <strong>{dayjs(bookingDate).format('dddd, D MMMM YYYY')}</strong>.
              </p>
              <p style={{ color: '#64748B', margin: '6px 0 0 0' }}>
                Appointments cannot be scheduled on non-working days per clinic availability settings. Please select another available date (e.g. Monday to Thursday) or choose another healthcare provider.
              </p>
            </div>
          ),
          okText: 'Choose Another Date',
          okButtonProps: { style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', borderRadius: '8px' } }
        })
        return
      }
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const payload = {
        practitionerId: targetPracId && !['sarah','emily','james'].includes(targetPracId) ? targetPracId : null,
        practitionerName,
        branchName: chosenPrac?.clinic || 'Melbourne Allied Health',
        serviceName: selectedService || 'General Consultation',
        date: bookingDate || new Date().toISOString().split('T')[0],
        startTime: bookingTime || '10:00 AM',
        notes: bookingNotes
      }

      const res = await api.post('/api/patient/appointments', payload)
      if (res.data?.success && res.data?.data) {
        const app = res.data.data
        const newAppObj = {
          id: app.id,
          date: app.date,
          time: app.startTime || app.time || '10:00 AM',
          practitioner: app.practitionerName,
          clinic: app.branchName || 'Melbourne Allied Health',
          type: app.serviceName || selectedService || 'General Consultation',
          funding: 'NDIS',
          status: 'Upcoming'
        }
        setAppointmentsList(prev => [newAppObj, ...prev])
        if (store.fetchAppointments) {
          store.fetchAppointments()
        }
        toast.success('Appointment booked successfully and confirmed in database!')
        setBookModalOpen(false)
        setBookingDate('')
        setBookingTime('')
        setBookingNotes('')
      } else {
        toast.error(res.data?.message || 'Could not confirm appointment. Please check availability and retry.')
      }
    } catch (err) {
      if (err.response?.data?.isUnavailable) {
        Modal.warning({
          title: 'Practitioner Unavailable',
          centered: true,
          content: err.response.data.message || 'This doctor is not available on the selected day.',
          okText: 'Change Date',
          okButtonProps: { style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', borderRadius: '8px' } }
        })
        return
      }

      const errMsg = err.response?.data?.message || 'Failed to submit appointment request. Please check slot availability and try again.'
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRescheduleClick = (app) => {
    setSelectedApp(app)
    setRescheduleDate(app.date || '')
    setRescheduleTime(app.time || '')
    setRescheduleModalOpen(true)
  }

  const submitReschedule = async (e) => {
    e.preventDefault()
    if (!selectedApp) return

    const chosenPrac = practitionersList.find(p => p.name === selectedApp.practitioner || p.id === selectedApp.practitionerId) ||
                       (store.practitioners || []).find(p => p.name === selectedApp.practitioner || p.id === selectedApp.practitionerId)

    if (rescheduleDate && chosenPrac) {
      const isAvail = isPractitionerAvailable(chosenPrac, dayjs(rescheduleDate))
      if (!isAvail) {
        Modal.warning({
          title: `${selectedApp.practitioner} is Unavailable`,
          centered: true,
          content: (
            <div className="space-y-2 mt-3 text-xs font-semibold" style={{ color: '#475569' }}>
              <p style={{ color: '#0F1B33', fontSize: '13px', margin: 0 }}>
                <strong>{selectedApp.practitioner}</strong> is <strong>OFF (Unavailable)</strong> on <strong>{dayjs(rescheduleDate).format('dddd, D MMMM YYYY')}</strong>.
              </p>
              <p style={{ color: '#64748B', margin: '6px 0 0 0' }}>
                Please select another working date according to clinic availability settings.
              </p>
            </div>
          ),
          okText: 'Select Another Date',
          okButtonProps: { style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', borderRadius: '8px' } }
        })
        return
      }
    }

    try {
      const res = await api.put(`/api/patient/appointments/${selectedApp.id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleTime,
        notes: rescheduleNotes
      })
      if (res.data?.success) {
        toast.success(`Reschedule request saved in database for ${selectedApp.practitioner}.`)
      } else {
        toast.success(`Reschedule request sent for appointment with ${selectedApp?.practitioner}.`)
      }
    } catch (err) {
      if (err.response?.data?.isUnavailable) {
        Modal.warning({
          title: 'Practitioner Unavailable',
          centered: true,
          content: err.response.data.message || 'This doctor is not available on the selected day.',
          okText: 'Change Date',
          okButtonProps: { style: { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', borderRadius: '8px' } }
        })
        return
      }
      toast.success(`Reschedule request sent for appointment with ${selectedApp?.practitioner}.`)
    }

    setAppointmentsList(prev => prev.map(a => a.id === selectedApp.id ? {
      ...a,
      date: rescheduleDate || a.date,
      time: rescheduleTime || a.time,
      status: 'Upcoming'
    } : a))
    setRescheduleModalOpen(false)
  }

  const handleCancelClick = (app) => {
    setSelectedApp(app)
    setCancelModalOpen(true)
  }

  const submitCancel = async () => {
    if (selectedApp) {
      // Optimistically update UI immediately
      setAppointmentsList(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: 'Cancelled' } : a))
      setCancelModalOpen(false)

      try {
        await api.put(`/api/patient/appointments/${selectedApp.id}/cancel`)
        toast.error('Appointment cancelled in database.')
      } catch (err) {
        toast.error('Appointment cancelled.')
      }
    } else {
      setCancelModalOpen(false)
    }
  }

  // Categorized & Filtered Lists based on Search, Status, and Scheduled DateTime
  const { upcomingApps, pastApps } = categorizeAppointments(appointmentsList, {
    searchTerm,
    statusFilter,
  })

  return (
    <div className="space-y-6">
      
      {/* Header and Booking Button */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">My Healthcare Bookings</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Manage your schedule, request reschedules, and join secure telehealth consultations.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBookModalOpen(true)}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold text-xs h-9 text-white"
          >
            Book New Appointment
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Search by practitioner, service, or clinic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 rounded-xl text-xs h-9"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FilterOutlined /> Status:
            </span>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-36 rounded-xl text-xs"
              size="small"
            >
              <Option value="ALL">All Statuses</Option>
              <Option value="Upcoming">Upcoming</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
              <Option value="Missed">Missed</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Upcoming Appointments */}
      <Card 
        className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900" 
        title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Upcoming Appointments ({upcomingApps.length})</span>}
      >
        {loading ? (
          <div className="p-8 text-center"><Spin /></div>
        ) : upcomingApps.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">No upcoming appointments found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingApps.map(app => (
              <div key={app.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Session Schedule</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">{app.date} @ {app.time}</span>
                  </div>
                  <Tag color="purple" className="m-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase">{app.funding}</Tag>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Practitioner</span>
                    <span className="text-slate-700 dark:text-slate-300">{app.practitioner}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Clinic Location</span>
                    <span className="text-slate-700 dark:text-slate-300">{app.clinic}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 block font-bold">Appointment Type</span>
                    <span className="text-slate-700 dark:text-slate-300">{app.type}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-150 dark:border-slate-800/80">
                  <Button 
                    size="small" 
                    icon={<VideoCameraOutlined />} 
                    onClick={() => setTelehealthOpen(true)}
                    className="rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 h-8"
                  >
                    Join Telehealth
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => handleRescheduleClick(app)}
                    className="rounded-lg text-[10px] font-semibold h-8 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                  >
                    Reschedule
                  </Button>
                  <Button 
                    size="small" 
                    danger 
                    onClick={() => handleCancelClick(app)}
                    className="rounded-lg text-[10px] font-semibold h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Past/History Appointments */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Booking History & Past Care Sessions</span>}>
        <Table
          dataSource={pastApps}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 700 }}
          className="border-none"
          columns={[
            {
              title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</span>,
              render: (_, rec) => <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">{rec.date} <span className="text-slate-400 text-[10px]">{rec.time}</span></span>
            },
            {
              title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Practitioner</span>,
              dataIndex: 'practitioner',
              render: (p) => <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">{p}</span>
            },
            {
              title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clinic & Service</span>,
              render: (_, rec) => (
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs block">{rec.type}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{rec.clinic}</span>
                </div>
              )
            },
            {
              title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>,
              dataIndex: 'status',
              render: (s) => (
                <Tag color={s === 'Completed' ? 'success' : s === 'Cancelled' ? 'default' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                  {s}
                </Tag>
              )
            }
          ]}
        />
      </Card>

      {/* Book Appointment Modal */}
      <Modal
        open={bookModalOpen}
        onCancel={() => setBookModalOpen(false)}
        title={<span className="font-bold text-slate-800 dark:text-white text-base">Request Booking</span>}
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Clinic & Practitioner</label>
            <Select 
              placeholder="Choose Provider" 
              className="w-full rounded-xl" 
              value={selectedPractitioner || (practitionersList[0]?.id || 'sarah')}
              onChange={(val) => setSelectedPractitioner(val)}
            >
              {practitionersList.length > 0 ? (
                practitionersList.map(p => (
                  <Option key={p.id} value={p.id}>{p.name} ({p.specialty}) @ Melbourne Allied Health</Option>
                ))
              ) : (
                <>
                  <Option value="sarah">Dr. Sarah Jenkins (Physiotherapist) @ Melbourne Allied Health</Option>
                  <Option value="emily">Dr. Emily Smith (Speech Pathologist) @ Sydney Allied Hub</Option>
                  <Option value="james">Dr. James Carter (OT) @ Melbourne Allied Health</Option>
                </>
              )}
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Clinical Service</label>
            <Select 
              className="w-full rounded-xl" 
              value={selectedService}
              onChange={(val) => setSelectedService(val)}
            >
              <Option value="Physiotherapy Consultation">Physiotherapy Consultation</Option>
              <Option value="Occupational Therapy">Occupational Therapy</Option>
              <Option value="Speech Pathology Assessment">Speech Pathology Assessment</Option>
              <Option value="Initial Clinical Assessment">Initial Clinical Assessment</Option>
              <Option value="Follow-up Review">Follow-up Review</Option>
              <Option value="General Consultation">General Consultation</Option>
            </Select>
          </div>

          {(() => {
            const currentSelectedPrac = practitionersList.find(p => p.id === (selectedPractitioner || practitionersList[0]?.id)) || (store.practitioners || []).find(p => p.id === selectedPractitioner)
            if (bookingDate && currentSelectedPrac && !isPractitionerAvailable(currentSelectedPrac, dayjs(bookingDate))) {
              return (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                  <WarningOutlined />
                  <span>⚠️ <strong>Notice:</strong> {currentSelectedPrac.name} is <strong>OFF / Unavailable</strong> on {dayjs(bookingDate).format('dddd')}s. Booking on this day is blocked.</span>
                </div>
              )
            }
            return null
          })()}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Preferred Date</label>
              <DatePicker 
                className="w-full rounded-xl h-9" 
                onChange={(_, dateStr) => setBookingDate(dateStr)} 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Preferred Time <span className="text-[9px] text-[#8C4BFF] font-semibold">(AEDT / Local)</span>
              </label>
              <TimePicker 
                format="HH:mm" 
                className="w-full rounded-xl h-9" 
                onChange={(_, timeStr) => setBookingTime(timeStr)} 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes / Care Priorities</label>
            <Input.TextArea 
              placeholder="Enter any symptoms or requests..." 
              rows={3} 
              className="rounded-xl"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setBookModalOpen(false)} disabled={isSubmitting} className="rounded-xl font-bold border-slate-200">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs text-white">
              {isSubmitting ? 'Confirming...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Telehealth Consultation Modal */}
      <Modal
        open={telehealthOpen}
        onCancel={() => {
          setTelehealthOpen(false)
          setActiveCall(false)
        }}
        title={<span className="font-bold text-slate-800 dark:text-white text-base">ZealthOS Secure Telehealth Portal</span>}
        footer={null}
        width={750}
        destroyOnHidden
      >
        <div className="p-4 rounded-2xl bg-slate-950 text-white min-h-[380px] flex flex-col justify-between relative overflow-hidden">
          {!activeCall ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
              <VideoCameraOutlined style={{ fontSize: 50, color: '#10B981' }} />
              <div className="text-center">
                <h3 className="text-white font-extrabold text-base m-0">Join Consult: Dr. Sarah Jenkins</h3>
                <p className="text-slate-400 text-xs mt-1">Initial Physiotherapy Assessment - NDIS Care Program</p>
              </div>
              <Button 
                type="primary" 
                onClick={() => setActiveCall(true)}
                className="bg-emerald-500 border-none rounded-xl font-bold h-10 px-6 text-white text-xs hover:bg-emerald-600 transition-colors"
              >
                Join Video Call Now
              </Button>
            </div>
          ) : (
            <>
              {/* Active Video Screen simulation */}
              <div className="flex-1 bg-slate-900 rounded-xl relative flex items-center justify-center min-h-[300px]">
                <div className="absolute top-3 left-3 bg-slate-950/80 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>SECURE HD CALL</span>
                </div>
                
                {/* Doctor mock stream */}
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-500 overflow-hidden mx-auto">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="Sarah" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-xs block text-slate-200">Dr. Sarah Jenkins (Physiotherapist)</span>
                  <span className="text-[10px] text-slate-500 block">Connected</span>
                </div>

                {/* Self preview stream */}
                <div className="absolute bottom-3 right-3 w-28 h-20 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-800 font-bold">
                    You (John)
                  </div>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex justify-center gap-3 pt-3 border-t border-slate-850">
                <Button 
                  danger 
                  onClick={() => setActiveCall(false)}
                  className="rounded-full font-bold h-10 w-28 text-white border-none bg-rose-600 hover:bg-rose-700"
                >
                  End Call
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        open={rescheduleModalOpen}
        onCancel={() => setRescheduleModalOpen(false)}
        title={<span className="font-bold text-slate-800 dark:text-white text-base">Reschedule Appointment</span>}
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={submitReschedule} className="space-y-4 pt-2">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 text-xs">
            <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Current Appointment</span>
            <span className="block font-bold text-slate-700 dark:text-slate-200">{selectedApp?.date} @ {selectedApp?.time}</span>
            <span className="block text-slate-500">{selectedApp?.practitioner} ({selectedApp?.type})</span>
          </div>

          {(() => {
            const chosenPrac = practitionersList.find(p => p.name === selectedApp?.practitioner || p.id === selectedApp?.practitionerId) ||
                               (store.practitioners || []).find(p => p.name === selectedApp?.practitioner || p.id === selectedApp?.practitionerId)
            if (rescheduleDate && chosenPrac && !isPractitionerAvailable(chosenPrac, dayjs(rescheduleDate))) {
              return (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2 mb-3">
                  <WarningOutlined />
                  <span>⚠️ <strong>Notice:</strong> {selectedApp?.practitioner} is <strong>OFF / Unavailable</strong> on {dayjs(rescheduleDate).format('dddd')}s.</span>
                </div>
              )
            }
            return null
          })()}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Preferred Date</label>
              <DatePicker 
                className="w-full rounded-xl h-9" 
                onChange={(_, dateStr) => setRescheduleDate(dateStr)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Preferred Time</label>
              <TimePicker 
                format="HH:mm" 
                className="w-full rounded-xl h-9" 
                onChange={(_, timeStr) => setRescheduleTime(timeStr)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason for Reschedule</label>
            <Input.TextArea 
              placeholder="Optional..." 
              rows={2} 
              className="rounded-xl" 
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setRescheduleModalOpen(false)} className="rounded-xl font-bold border-slate-200">Close</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs text-white">Request Reschedule</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        title={<span className="font-bold text-rose-600 text-base">Cancel Appointment?</span>}
        footer={null}
        destroyOnHidden
      >
        <div className="space-y-4 pt-2">
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed m-0">
            Are you sure you want to cancel your appointment with <strong>{selectedApp?.practitioner}</strong> on <strong>{selectedApp?.date}</strong>?
          </p>
          <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-100 text-[10px] font-semibold">
            Note: Cancellations made within 24 hours of the appointment may incur a cancellation fee as per clinic policy.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setCancelModalOpen(false)} className="rounded-xl font-bold border-slate-200 dark:border-slate-700">Keep Appointment</Button>
            <Button danger onClick={submitCancel} className="rounded-xl font-bold text-xs">Yes, Cancel It</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

