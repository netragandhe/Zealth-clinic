import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Select, Input, Button, Card, Tag, Modal, Form, DatePicker, TimePicker, Badge, Calendar, Popover } from 'antd'
import {
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  SyncOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  FileTextFilled,
  DollarOutlined,
  GlobalOutlined,
  WarningOutlined,
  WarningFilled,
  QuestionCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  StopFilled,
  VideoCameraFilled,
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import AppointmentModal from '../components/NewScheduleModal'
import AppointmentDetailsModal from '../components/AppointmentDetailsModal'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import 'dayjs/locale/en-gb'
dayjs.locale('en-gb')

const { Option } = Select

// Sales Calendar View Component
function SalesCalendarView({ store, navigate }) {
  const [currentWeek, setCurrentWeek] = useState(() => dayjs().startOf('week'))
  const [syncStatus, setSyncStatus] = useState('Not Synced')
  const [syncing, setSyncing] = useState(false)
  const [bookModalVisible, setBookModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form] = Form.useForm()

  const today = dayjs()

  // Sync Google Calendar handler
  const handleCalendarSync = () => {
    setSyncing(true)
    toast.loading('Syncing with Google Calendar...', { id: 'sync' })
    setTimeout(() => {
      setSyncStatus(`Synced on ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      setSyncing(false)
      toast.success('Successfully synced with Google Calendar!', { id: 'sync' })
    }, 1200)
  }

  // Get active days of the week (Mon to Sun)
  const daysOfWeek = useMemo(() => {
    const start = currentWeek.day(1) // Monday
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
  }, [currentWeek])

  const prevWeek = () => setCurrentWeek(d => d.subtract(7, 'day'))
  const nextWeek = () => setCurrentWeek(d => d.add(7, 'day'))
  const goToday = () => setCurrentWeek(dayjs().startOf('week'))

  // Filter events by search query
  const filteredEvents = useMemo(() => {
    return store.salesCalendarEvents.filter(evt => {
      const query = searchQuery.toLowerCase()
      return (
        evt.title.toLowerCase().includes(query) ||
        evt.clinic.toLowerCase().includes(query) ||
        evt.contact.toLowerCase().includes(query) ||
        (evt.notes && evt.notes.toLowerCase().includes(query))
      )
    })
  }, [store.salesCalendarEvents, searchQuery])

  // Get events for a specific day
  const getEventsForDay = (dayObj) => {
    const dateStr = dayObj.format('YYYY-MM-DD')
    return filteredEvents.filter(evt => evt.date === dateStr)
  }

  // Calculate weekly statistics based on current week
  const statsThisWeek = useMemo(() => {
    let total = 0
    let demos = 0
    let onboardings = 0
    let followups = 0
    
    daysOfWeek.forEach(day => {
      const dateStr = day.format('YYYY-MM-DD')
      const evts = store.salesCalendarEvents.filter(e => e.date === dateStr)
      total += evts.length
      demos += evts.filter(e => e.type === 'Demos' || e.stage === 'Demo Scheduled').length
      onboardings += evts.filter(e => e.type === 'Onboarding meetings').length
      followups += evts.filter(e => e.type === 'Follow-ups').length
    })
    
    return { total, demos, onboardings, followups }
  }, [daysOfWeek, store.salesCalendarEvents])

  const handleBookDemo = (values) => {
    const newEvent = {
      title: `${values.type}: ${values.clinic}`,
      date: values.date.format('YYYY-MM-DD'),
      time: values.time.format('HH:mm'),
      clinic: values.clinic,
      contact: values.contact,
      type: values.type,
      stage: values.stage || 'Demo Scheduled',
      notes: values.notes || ''
    }

    store.addSalesCalendarEvent(newEvent)

    // Check if there is a matching lead to update stage
    const matchedLead = store.leads.find(l => l.name.toLowerCase() === values.clinic.toLowerCase())
    if (matchedLead) {
      store.moveLeadStage(matchedLead.id, 'Demo Scheduled')
      store.addLeadActivity(matchedLead.id, `Booked a ${values.type} on ${newEvent.date} at ${newEvent.time}`)
    }

    toast.success(`Successfully scheduled ${values.type} for ${values.clinic}!`)
    setBookModalVisible(false)
    form.resetFields()
  }

  const getEventStyle = (type) => {
    switch (type) {
      case 'Demos':
        return {
          border: 'border-l-[4px] border-l-[#8C4BFF]',
          bg: 'bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/10 dark:hover:bg-purple-500/20',
          text: 'text-[#8C4BFF]',
          tagColor: 'purple',
          icon: <PlayCircleOutlined className="text-[#8C4BFF]" style={{ fontSize: 13 }} />
        }
      case 'Onboarding meetings':
        return {
          border: 'border-l-[4px] border-l-[#10B981]',
          bg: 'bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
          text: 'text-[#10B981]',
          tagColor: 'success',
          icon: <CheckCircleOutlined className="text-[#10B981]" style={{ fontSize: 13 }} />
        }
      case 'Follow-ups':
        return {
          border: 'border-l-[4px] border-l-[#3B82F6]',
          bg: 'bg-blue-500/5 dark:bg-blue-500/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/20',
          text: 'text-[#3B82F6]',
          tagColor: 'blue',
          icon: <PhoneOutlined className="text-[#3B82F6]" style={{ fontSize: 13 }} />
        }
      case 'Renewal discussions':
        return {
          border: 'border-l-[4px] border-l-[#F59E0B]',
          bg: 'bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10 dark:hover:bg-amber-500/20',
          text: 'text-[#F59E0B]',
          tagColor: 'warning',
          icon: <SyncOutlined className="text-[#F59E0B]" style={{ fontSize: 13 }} />
        }
      default:
        return {
          border: 'border-l-[4px] border-l-slate-400',
          bg: 'bg-slate-500/5 dark:bg-slate-500/10 hover:bg-slate-500/10 dark:hover:bg-slate-500/20',
          text: 'text-slate-500',
          tagColor: 'default',
          icon: <CalendarOutlined className="text-slate-500" style={{ fontSize: 13 }} />
        }
    }
  }

  return (
    <div className="space-y-6 select-none p-1">
      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white m-0 tracking-tight flex items-center gap-2">
            <CalendarOutlined className="text-[#8C4BFF]" />
            <span>Master Clinic Scheduler</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">
            Manage patient appointments, track practitioner availability, and schedule clinical sessions.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields()
              setBookModalVisible(true)
            }}
            style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
            className="rounded-xl font-bold text-xs h-10 shadow-sm text-white"
          >
            Add Appointment
          </Button>
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleCalendarSync}
            className="rounded-xl font-semibold text-xs h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {syncStatus === 'Not Synced' ? 'Sync Google Calendar' : syncStatus}
          </Button>
        </div>
      </div>

      {/* ── Weekly Statistics Dashboard ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Events', value: statsThisWeek.total, icon: <CalendarOutlined className="text-[#8C4BFF]" />, bg: 'bg-[#8C4BFF]/5 border-[#8C4BFF]/10' },
          { label: 'Patient Consults', value: statsThisWeek.demos, icon: <PlayCircleOutlined className="text-[#F59E0B]" />, bg: 'bg-[#F59E0B]/5 border-[#F59E0B]/10' },
          { label: 'Assessments', value: statsThisWeek.onboardings, icon: <CheckCircleOutlined className="text-[#10B981]" />, bg: 'bg-[#10B981]/5 border-[#10B981]/10' },
          { label: 'Follow-ups', value: statsThisWeek.followups, icon: <PhoneOutlined className="text-[#3B82F6]" />, bg: 'bg-[#3B82F6]/5 border-[#3B82F6]/10' }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-xs transition-all hover:shadow-sm">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{stat.label}</span>
              <span className="text-xl font-black text-slate-800 dark:text-white block mt-1">{stat.value}</span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} border`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Date Navigation Row ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white m-0 min-w-[150px]">
            {currentWeek.format('MMMM YYYY')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              shape="circle"
              size="small"
              icon={<LeftOutlined style={{ fontSize: 10 }} />}
              onClick={prevWeek}
              className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350"
            />
            <Button
              shape="circle"
              size="small"
              icon={<RightOutlined style={{ fontSize: 10 }} />}
              onClick={nextWeek}
              className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350"
            />
          </div>
          <Button
            size="small"
            onClick={goToday}
            className="rounded-full px-3 text-xs font-semibold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
          >
            Today
          </Button>
        </div>

        {/* Search Input */}
        <Input
          prefix={<SearchOutlined className="text-slate-300 mr-1" />}
          placeholder="Search by clinic, contact, details..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full md:w-64 rounded-xl h-9 text-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* ── 7 Days Calendar Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 bg-transparent">
        {daysOfWeek.map((day, idx) => {
          const isToday = day.isSame(today, 'day')
          const dayEvents = getEventsForDay(day)

          return (
            <Card
              key={idx}
              className={`border rounded-2xl shadow-sm min-h-[380px] flex flex-col transition-all overflow-hidden hover:shadow-md ${
                isToday
                  ? 'border-[#8C4BFF] bg-[#8C4BFF]/5 dark:bg-[#241A42]/10'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
              styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', flexGrow: 1 } }}
            >
              {/* Card Day Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3.5 flex items-center justify-between flex-shrink-0">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {day.format('dddd')}
                  </span>
                  <span className={`text-base font-extrabold mt-0.5 inline-block w-8 h-8 leading-8 rounded-full text-center ${
                    isToday ? 'bg-[#8C4BFF] text-white shadow-sm' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {day.format('D')}
                  </span>
                </div>
                {/* Quick Add icon */}
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<PlusOutlined className="text-slate-400 hover:text-[#8C4BFF] transition-colors" />}
                  onClick={() => {
                    form.resetFields()
                    form.setFieldsValue({ date: day })
                    setBookModalVisible(true)
                  }}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                />
              </div>

              {/* Events List for this Day */}
              <div className="space-y-2.5 flex-grow overflow-y-auto">
                {dayEvents.map(evt => {
                  const styleInfo = getEventStyle(evt.type)

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 ${styleInfo.border} ${styleInfo.bg} transition-all cursor-pointer text-left relative group shadow-xs hover:shadow-md hover:-translate-y-0.5 duration-200 flex flex-col gap-1.5`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {styleInfo.icon}
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {evt.time}
                          </span>
                        </div>
                        <Tag color={styleInfo.tagColor} className="m-0 border-none font-bold text-[8px] uppercase px-1.5 py-0.5 rounded">
                          {evt.type === 'Onboarding meetings' ? 'Onboarding' : evt.type === 'Follow-ups' ? 'Call' : evt.type === 'Renewal discussions' ? 'Renewal' : 'Demo'}
                        </Tag>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-850 dark:text-slate-100 text-xs block truncate group-hover:text-[#8C4BFF] transition-colors">
                          {evt.clinic}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5 truncate">
                          Contact: {evt.contact}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {dayEvents.length === 0 && (
                  <div className="h-full min-h-[120px] border border-dashed border-slate-200 dark:border-slate-800/85 rounded-2xl flex flex-col items-center justify-center py-10 text-slate-350 dark:text-slate-650 text-[10px] font-bold gap-1.5 bg-slate-50/10 dark:bg-slate-950/5">
                    <CalendarOutlined style={{ fontSize: 16 }} className="opacity-45" />
                    <span>No scheduled items</span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Event Details Modal ── */}
      <Modal
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        title={<span className="font-bold text-slate-850 dark:text-white text-base">Calendar Event details</span>}
        footer={null}
        destroyOnHidden
        className="dark:bg-slate-900 rounded-2xl"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <h4 className="text-slate-800 dark:text-white font-extrabold text-sm mb-1">{selectedEvent.title}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Scheduled on {selectedEvent.date} at {selectedEvent.time}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinic Name</span>
                <span className="text-slate-800 dark:text-white font-bold text-sm block mt-1">{selectedEvent.clinic}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Person</span>
                <span className="text-slate-800 dark:text-white font-bold text-sm block mt-1">{selectedEvent.contact}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meeting Type</span>
                <Tag color="purple" className="m-0 border-none font-bold text-[9px] uppercase px-2.5 mt-1">{selectedEvent.type}</Tag>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales Stage</span>
                <Tag color="orange" className="m-0 border-none font-bold text-[9px] uppercase px-2.5 mt-1">{selectedEvent.stage}</Tag>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes</span>
              <p className="mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {selectedEvent.notes || 'No notes logged.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </Button>
              {selectedEvent.type === 'Demos' && (
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedEvent(null)
                    toast.success('Launching Zoom Sales Call...')
                  }}
                  style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
                  className="rounded-xl font-bold text-xs text-white"
                >
                  Start Meeting
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Book Demo/Call Modal ── */}
      <Modal
        open={bookModalVisible}
        onCancel={() => setBookModalVisible(false)}
        title={<span className="font-bold text-slate-850 dark:text-white text-base">Book Demo / Meeting Slot</span>}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleBookDemo} initialValues={{ type: 'Demos', stage: 'Demo Scheduled' }}>
          <Form.Item
            name="clinic"
            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Clinic / Prospect Name *</span>}
            rules={[{ required: true, message: 'Please enter clinic name' }]}
          >
            <Select showSearch placeholder="Select from leads or type new" optionFilterProp="children" dropdownMatchSelectWidth={false} className="rounded-xl">
              {store.leads.map(l => (
                <Option key={l.id} value={l.name}>{l.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="contact"
            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Contact Person *</span>}
            rules={[{ required: true, message: 'Please enter contact person' }]}
          >
            <Input placeholder="e.g. James Bradley" className="rounded-xl h-10 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-white" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="date"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Date *</span>}
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker className="w-full rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="time"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Time *</span>}
              rules={[{ required: true, message: 'Please select time' }]}
            >
              <TimePicker format="HH:mm" className="w-full rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Meeting Type *</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Demos">Demo</Option>
                <Option value="Follow-ups">Follow-up Call</Option>
                <Option value="Onboarding meetings">Onboarding Meeting</Option>
                <Option value="Renewal discussions">Renewal Discussion</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="stage"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Associated Sales Stage</span>}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Discovery Call">Discovery Call</Option>
                <Option value="Demo Scheduled">Demo Scheduled</Option>
                <Option value="Proposal Sent">Proposal Sent</Option>
                <Option value="Trial Started">Trial Started</Option>
                <Option value="Converted">Converted</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="notes"
            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Notes</span>}
          >
            <Input.TextArea placeholder="Enter demo requirements, custom needs..." rows={3} className="rounded-xl dark:bg-slate-900 dark:border-slate-800 dark:text-white" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setBookModalVisible(false)}
              className="rounded-xl font-bold border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
              className="rounded-xl font-bold text-xs text-white"
            >
              Schedule Event
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

// Appointment type colors mapping
const TYPE_COLORS = {
  Procedure:       { bg: '#FFF0F0', border: '#FFCDD2', text: '#E53935', label: '#E53935' },
  Consultation:    { bg: '#F0F4FF', border: '#C5CAE9', text: '#3949AB', label: '#3949AB' },
  Administrative:  { bg: '#F0FFF4', border: '#A5D6A7', text: '#2E7D32', label: '#2E7D32' },
  Diagnostics:     { bg: '#FFFDE7', border: '#FFF176', text: '#F57F17', label: '#F57F17' },
  'Follow-up':     { bg: '#F3E5F5', border: '#CE93D8', text: '#7B1FA2', label: '#7B1FA2' },
  'Staff / Handover': { bg: '#F5F5F5', border: '#E0E0E0', text: '#616161', label: '#616161' },
  Default:         { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', label: '#475569' },
}

const getTypeColor = (appt, isDark) => {
  if (appt?.status === 'Completed' || appt?.isCompleted || appt?.appointmentType === 'Administrative') {
    return isDark 
      ? { bg: '#0F2B14', border: '#1A4D24', text: '#A5D6A7', label: '#A5D6A7' } 
      : { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', label: '#15803D' };
  }
  const c = TYPE_COLORS[appt?.appointmentType] || TYPE_COLORS[appt?.serviceType] || TYPE_COLORS.Default;
  return isDark ? { bg: c.darkBg, border: c.darkBorder, text: c.darkText, label: c.darkLabel } : c;
}

// ---------- Status Icons Row for appointment cards ----------
const IconBadge = ({ icon, bg, color, title, noBorder }) => (
  <span 
    title={title}
    className="inline-flex items-center justify-center rounded-[3px] shadow-sm ml-[2px]"
    style={{ 
      backgroundColor: bg, 
      color: color, 
      border: noBorder ? 'none' : '1px solid rgba(0,0,0,0.2)',
      width: 14, 
      height: 14,
      fontSize: 10
    }}
  >
    {icon}
  </span>
)

function AppointmentStatusIcons({ appt, noteObj }) {
  const icons = []

  // Progress Note icon
  if (noteObj) {
    if (noteObj.status === 'Finalised' || noteObj.status === 'Completed') {
      icons.push(<IconBadge key="note-final" title="Progress note finalised" bg="#6B7280" color="#FFFFFF" icon={<FileTextFilled />} />)
    } else {
      icons.push(<IconBadge key="note-start" title="Progress note started" bg="#FEF08A" color="#854D0E" icon={<FileTextFilled />} />)
    }
  }

  // Invoice Status icon
  const inv = appt.invoiceStatus
  if (inv === 'Draft') {
    icons.push(<IconBadge key="inv-draft" title="Invoice draft" bg="#FFFFFF" color="#374151" icon={<DollarOutlined style={{ fontSize: 9 }} />} />)
  } else if (inv === 'Awaiting Payment') {
    icons.push(<IconBadge key="inv-await" title="Invoice awaiting payment" bg="#FEF08A" color="#854D0E" icon={<DollarOutlined style={{ fontSize: 9 }} />} />)
  } else if (inv === 'Invoiced' || inv === 'Paid') {
    icons.push(<IconBadge key="inv-paid" title="Invoice paid" bg="#22C55E" color="#FFFFFF" icon={<DollarOutlined style={{ fontSize: 9 }} />} />)
  } else if (inv === 'Overdue') {
    icons.push(<IconBadge key="inv-over" title="Invoice overdue" bg="#EF4444" color="#FFFFFF" icon={<DollarOutlined style={{ fontSize: 9 }} />} />)
  } else if (inv === 'Do Not Invoice') {
    icons.push(<IconBadge key="inv-no" title="Do not invoice" bg="#374151" color="#FFFFFF" icon={<DollarOutlined style={{ fontSize: 9 }} />} />)
  }

  // Attendance icon
  const status = appt.status
  if (status === 'Completed' || status === 'Arrived') {
    icons.push(<span key="arrived" title="Client arrived" style={{ color: '#16A34A', fontSize: 13, marginLeft: 2, background: '#fff', borderRadius: '50%', lineHeight: 1 }}><CheckCircleFilled /></span>)
  } else if (status === 'DNA' || status === 'Did Not Arrive' || status === 'No Show') {
    icons.push(<span key="dna" title="Client did not arrive" style={{ color: '#DC2626', fontSize: 13, marginLeft: 2, background: '#fff', borderRadius: '50%', lineHeight: 1 }}><CloseCircleFilled /></span>)
  } else if (status === 'Cancelled') {
    icons.push(<span key="cancel" title="Appointment cancelled" style={{ color: '#EA580C', fontSize: 13, marginLeft: 2, background: '#fff', borderRadius: '50%', lineHeight: 1 }}><StopFilled /></span>)
  }

  // Telehealth icon
  if (appt.location === 'Telehealth' || appt.isOnline || appt.appointmentType === 'Telehealth') {
    icons.push(<span key="tele" title="Telehealth" style={{ color: '#2563EB', fontSize: 13, marginLeft: 2 }}><VideoCameraFilled /></span>)
  }

  // Online booking
  if (appt.isOnlineBooking || appt.source === 'Online') {
    icons.push(<span key="online" title="Online booking" style={{ color: '#059669', fontSize: 13, marginLeft: 2 }}><GlobalOutlined /></span>)
  }

  // Client alert
  if (appt.hasAlert || appt.clientAlert) {
    icons.push(<span key="alert" title="Client alert" style={{ color: '#F59E0B', fontSize: 13, marginLeft: 2 }}><WarningFilled /></span>)
  }

  if (icons.length === 0) return null

  return (
    <div className="flex items-center flex-wrap">
      {icons}
    </div>
  )
}

// Generate the 24 hours dictionary
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12
  const ampm = i < 12 ? 'AM' : 'PM'
  return { label: `${h}:00 ${ampm}`, value: i }
})

const getOrdinalSuffix = (dayNum) => {
  if (dayNum > 3 && dayNum < 21) return 'th';
  switch (dayNum % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

const formatCustomDate = (dayObj) => {
  const ddd = dayObj.format('ddd'); // e.g. "Mon"
  const d = dayObj.date(); // e.g. 15
  const suffix = getOrdinalSuffix(d);
  const MMM = dayObj.format('MMM'); // e.g. "Jun"
  return `${ddd}, ${d}${suffix} ${MMM}`;
}

export default function PatientPortalCalendarPage() {
  const store = useClinicStore()
  const navigate = useNavigate()
  const location = useLocation()

  if (store.userRole === 'sales') {
    return <SalesCalendarView store={store} navigate={navigate} />
  }

  // Base configurations states
  const [weekStart, setWeekStart] = useState(() => dayjs().startOf('week'))
  const [viewMode, setViewMode] = useState('7 Days')
  const [slotMode, setSlotMode] = useState('60-minute slots')
  const [searchVal, setSearchVal] = useState('')
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [visibleDaysSelected, setVisibleDaysSelected] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  
  // Custom work hours (Default: 9:00am - 5:00pm)
  const [workStartHour, setWorkStartHour] = useState(9)
  const [workEndHour, setWorkEndHour] = useState(17)
  const [showMiniCalendar, setShowMiniCalendar] = useState(true)
  const [selectedPractitioners, setSelectedPractitioners] = useState(
    store.practitioners?.map(p => p.id) || []
  )

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [defaultSlot, setDefaultSlot] = useState(null)

  const today = dayjs()

  // Calculate navigations based on selected view mode
  const prevWeek = () => {
    if (viewMode === '1 Day') setWeekStart(d => d.subtract(1, 'day'))
    else if (viewMode === '30 Days') setWeekStart(d => d.subtract(1, 'month'))
    else setWeekStart(d => d.subtract(7, 'day'))
  }
  const nextWeek = () => {
    if (viewMode === '1 Day') setWeekStart(d => d.add(1, 'day'))
    else if (viewMode === '30 Days') setWeekStart(d => d.add(1, 'month'))
    else setWeekStart(d => d.add(7, 'day'))
  }
  const goToday = () => setWeekStart(dayjs().startOf('week'))

  const intervalMin = slotMode === '15-minute slots' ? 15 : slotMode === '30-minute slots' ? 30 : 60
  const slotHeight = slotMode === '15-minute slots' ? 32 : slotMode === '30-minute slots' ? 44 : 76

  // visible hours time-slots calculated dynamically
  const timeSlots = useMemo(() => {
    const slots = []
    for (let h = workStartHour; h <= workEndHour; h++) {
      for (let m = 0; m < 60; m += intervalMin) {
        if (h === workEndHour && m > 0) continue
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        slots.push({ h, m, label: m === 0 ? HOURS[h].label : '' })
      }
    }
    return slots
  }, [intervalMin, workStartHour, workEndHour])

  // Get active days of calendar depending on current view mode
  const visibleDays = useMemo(() => {
    let days = []
    if (viewMode === '1 Day') {
      days = [weekStart]
    } else if (viewMode === '5 Days') {
      const start = weekStart.day(1) // Monday
      days = Array.from({ length: 5 }, (_, i) => start.add(i, 'day'))
    } else if (viewMode === '7 Days') {
      const start = weekStart.day(1) // Monday
      days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
    } else if (viewMode === '14 Days') {
      const start = weekStart.day(1) // Monday
      days = Array.from({ length: 14 }, (_, i) => start.add(i, 'day'))
    } else if (viewMode === '30 Days') {
      const start = weekStart.startOf('month')
      days = Array.from({ length: 30 }, (_, i) => start.add(i, 'day'))
    } else {
      const start = weekStart.day(1)
      days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day'))
    }

    if (viewMode === '1 Day' || viewMode === '7 Days' || viewMode === '14 Days' || viewMode === '30 Days') return days
    return days.filter(d => visibleDaysSelected.includes(d.format('dddd')))
  }, [weekStart, viewMode, visibleDaysSelected])

  // Filter appointments
  const filteredAppts = useMemo(() => {
    return (store.appointments || []).filter(appt => {
      if (selectedPractitioners && selectedPractitioners.length > 0) {
        if (appt.practitionerId && !selectedPractitioners.includes(appt.practitionerId)) return false
      }
      if (!searchVal) return true
      const q = searchVal.toLowerCase()
      return appt.patientName?.toLowerCase().includes(q) ||
             appt.practitionerName?.toLowerCase().includes(q) ||
             appt.appointmentType?.toLowerCase().includes(q) ||
             appt.diagnosis?.toLowerCase().includes(q)
    })
  }, [store.appointments, searchVal, selectedPractitioners])

  const getApptsInSlot = (dayObj, h, m) => {
    if (!dayObj) return []
    const dateStr = dayObj.format('YYYY-MM-DD')
    const dayAppts = filteredAppts.filter(a => a && a.date === dateStr)
    return dayAppts.filter(a => {
      let ah = -1, am = -1
      const rawTime = a?.startTime || a?.time
      if (rawTime && typeof rawTime === 'string') {
        const parts = rawTime.trim().split(' ')
        const timePart = parts[0]
        const modifier = parts[1] ? parts[1].toUpperCase() : null
        if (timePart && timePart.includes(':')) {
          const tArr = timePart.split(':').map(Number)
          ah = tArr[0]
          am = tArr[1] || 0
          if (modifier === 'PM' && ah < 12) ah += 12
          if (modifier === 'AM' && ah === 12) ah = 0
        }
      }
      return ah === h && am === m
    })
  }

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, apptId) => {
    e.dataTransfer.setData('text/plain', apptId)
  }

  const handleDrop = (e, dayObj, h, m) => {
    e.preventDefault()
    const apptId = e.dataTransfer.getData('text/plain')
    const appt = store.appointments.find(a => a.id === apptId)
    if (appt) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const updated = {
        ...appt,
        date: dayObj.format('YYYY-MM-DD'),
        time: `${hh}:${mm}`,
        endTime: appt.endTime ? dayjs(`${dayObj.format('YYYY-MM-DD')}T${hh}:${mm}`).add(1, 'hour').format('HH:mm') : undefined
      }
      store.updateAppointment(updated)
      toast.success(`Rescheduled ${appt.patientName} to ${dayObj.format('D MMM')} at ${hh}:${mm}`)
    }
  }

  const activePractitionerObjects = useMemo(() => {
    const list = store.practitioners?.filter(p => selectedPractitioners.includes(p.id)) || []
    return list.length > 0 ? list : (store.practitioners || [])
  }, [store.practitioners, selectedPractitioners])

  const [activeIndicationBanner, setActiveIndicationBanner] = useState(null)

  useEffect(() => {
    if (store.fetchAppointments) {
      store.fetchAppointments()
    }
    const params = new URLSearchParams(location.search);
    const newAppointment = params.get('newAppointment');
    const rescheduleApptId = params.get('rescheduleApptId');
    const patientId = params.get('patientId');

    if (patientId && (newAppointment || rescheduleApptId)) {
      const patient = store.patients?.find(p => p.id === patientId);
      const pName = patient ? patient.name : 'Unknown Client';
      if (newAppointment) {
        setActiveIndicationBanner(`Booking for ${pName}`);
      } else if (rescheduleApptId) {
        setActiveIndicationBanner(`Rescheduling for ${pName}`);
      }
    } else {
      setActiveIndicationBanner(null);
    }
  }, [location.search, store.patients]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 96px)' }}>
      <style>{`
        /* Selected date marked in purple */
        .ant-picker-calendar-mini .ant-picker-cell-selected .ant-picker-cell-inner,
        .ant-picker-panel .ant-picker-cell-selected .ant-picker-cell-inner {
          background-color: #8C4BFF !important;
          color: white !important;
        }
        
        /* Current date text color in purple */
        .ant-picker-calendar-mini .ant-picker-cell-today .ant-picker-cell-inner,
        .ant-picker-panel .ant-picker-cell-today .ant-picker-cell-inner {
          color: #8C4BFF !important;
          border-color: #8C4BFF !important;
          font-weight: bold;
        }
        .ant-picker-calendar-mini .ant-picker-cell-today.ant-picker-cell-selected .ant-picker-cell-inner,
        .ant-picker-panel .ant-picker-cell-today.ant-picker-cell-selected .ant-picker-cell-inner {
          color: white !important; /* keep white when selected */
        }
        
        /* Hide other dates from different month */
        .ant-picker-calendar-mini .ant-picker-cell:not(.ant-picker-cell-in-view) .ant-picker-cell-inner,
        .ant-picker-panel .ant-picker-cell:not(.ant-picker-cell-in-view) .ant-picker-cell-inner {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* ── Top Toolbar ── */}
      <div className="flex items-center justify-between pb-4 gap-3 flex-wrap">

        {/* Left: Month and Date navigations */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-slate-800 min-w-[130px] dark:text-white">
            {weekStart.format('MMMM YYYY')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={prevWeek}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 hover:border-[#8C4BFF] hover:text-[#8C4BFF] transition-colors bg-white dark:bg-slate-800 dark:border-slate-700"
            >
              <LeftOutlined style={{ fontSize: 10 }} />
            </button>
            <button
              onClick={nextWeek}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 hover:border-[#8C4BFF] hover:text-[#8C4BFF] transition-colors bg-white dark:bg-slate-800 dark:border-slate-700"
            >
              <RightOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-650 hover:border-[#8C4BFF] hover:text-[#8C4BFF] transition-colors bg-white dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700"
          >
            Today
          </button>
          <button
            onClick={() => setShowMiniCalendar(!showMiniCalendar)}
            className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-650 hover:border-[#8C4BFF] hover:text-[#8C4BFF] transition-colors bg-white dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-1.5"
          >
            <CalendarOutlined style={{ color: '#8C4BFF' }} />
            <span>{showMiniCalendar ? 'Hide Sidebar' : 'Show Sidebar'}</span>
          </button>

          {activeIndicationBanner && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 rounded-lg text-xs font-bold shadow-sm animate-fadeIn">
              <span>{activeIndicationBanner}</span>
              <button 
                onClick={() => {
                  setActiveIndicationBanner(null)
                  navigate(location.pathname, { replace: true })
                }}
                className="hover:text-blue-800 dark:hover:text-blue-100 ml-1 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right: Search, view mode select, work hour settings & slot modes */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            prefix={<SearchOutlined className="text-slate-300" style={{ fontSize: 13 }} />}
            placeholder="Search name, type, diagnosis..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            className="w-52 rounded-full text-xs"
            style={{ height: 36, borderColor: '#E2E8F0' }}
          />

          <Select
            value={viewMode}
            onChange={setViewMode}
            className="rounded-xl text-xs"
            style={{ width: 100, height: 36 }}
          >
            <Option value="1 Day">1 Day</Option>
            <Option value="5 Days">5 Days</Option>
            <Option value="7 Days">7 Days</Option>
            <Option value="14 Days">14 Days</Option>
            <Option value="30 Days">30 Days</Option>
          </Select>

          <Select
            value={slotMode}
            onChange={setSlotMode}
            className="rounded-xl text-xs"
            style={{ width: 130, height: 36 }}
          >
            <Option value="15-minute slots">15 Min</Option>
            <Option value="30-minute slots">30 Min</Option>
            <Option value="60-minute slots">60 Min</Option>
          </Select>

          <Popover
            trigger="click"
            placement="bottomRight"
            title={<span className="text-sm font-bold text-slate-800 dark:text-white">Calendar Settings</span>}
            content={
              <div className="flex flex-col gap-4 w-64 pt-2">
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Visible Days</span>
                  <Select
                    mode="multiple"
                    placeholder="Visible Days"
                    value={visibleDaysSelected}
                    onChange={setVisibleDaysSelected}
                    className="w-full rounded-xl text-xs"
                    maxTagCount="responsive"
                  >
                    <Option value="Monday">Mon</Option>
                    <Option value="Tuesday">Tue</Option>
                    <Option value="Wednesday">Wed</Option>
                    <Option value="Thursday">Thu</Option>
                    <Option value="Friday">Fri</Option>
                    <Option value="Saturday">Sat</Option>
                    <Option value="Sunday">Sun</Option>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Start Time</span>
                    <Select
                      value={workStartHour}
                      onChange={setWorkStartHour}
                      className="w-full rounded-xl text-xs"
                    >
                      {HOURS.slice(0, 18).map(h => (
                        <Option key={h.value} value={h.value}>{h.label}</Option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">End Time</span>
                    <Select
                      value={workEndHour}
                      onChange={setWorkEndHour}
                      className="w-full rounded-xl text-xs"
                    >
                      {HOURS.slice(6, 24).map(h => (
                        <Option key={h.value} value={h.value}>{h.label}</Option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            }
          >
            <Button 
              shape="circle" 
              icon={<SettingOutlined />} 
              style={{ height: 36, width: 36 }}
              className="border-slate-200 text-slate-600 hover:text-[#8C4BFF] hover:border-[#8C4BFF] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            />
          </Popover>
        </div>
      </div>

      {/* ── Main Workspace split container ── */}
      <div className="flex-grow flex gap-4 overflow-hidden h-full">
        {showMiniCalendar && (
          <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col h-full overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 select-none">
              Quick Navigation
            </span>
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/20">
              <Calendar
                fullscreen={false}
                value={weekStart}
                onChange={(val) => {
                  setWeekStart(val)
                }}
                headerRender={({ value, onChange }) => {
                  return (
                    <div className="flex justify-between items-center mb-2 px-1 select-none">
                      <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200">
                        {value.format('MMM YYYY')}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="small"
                          shape="circle"
                          icon={<LeftOutlined style={{ fontSize: 9 }} />}
                          onClick={() => onChange(value.clone().subtract(1, 'month'))}
                        />
                        <Button
                          size="small"
                          shape="circle"
                          icon={<RightOutlined style={{ fontSize: 9 }} />}
                          onClick={() => onChange(value.clone().add(1, 'month'))}
                        />
                      </div>
                    </div>
                  )
                }}
              />
            </div>
            <div className="mt-4 border-t border-slate-50 dark:border-slate-800 pt-4 flex-grow">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 select-none">
                Practitioners
              </span>
              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-2">
                {store.practitioners?.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPractitioners.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPractitioners([...selectedPractitioners, p.id])
                        } else {
                          setSelectedPractitioners(selectedPractitioners.filter(id => id !== p.id))
                        }
                      }}
                      className="accent-[#8C4BFF]"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-grow overflow-x-auto h-full flex flex-col">
          <div 
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800 h-full"
            style={{ minWidth: Math.max(750, visibleDays.length * activePractitionerObjects.length * 90) }}
          >
        
        {/* Days Header */}
        <div
          className="grid border-b border-slate-100 flex-shrink-0 dark:border-slate-800"
          style={{ gridTemplateColumns: `80px repeat(${visibleDays.length}, 1fr)` }}
        >
          <div className="py-3 border-r border-slate-100 dark:border-slate-800" />
          {visibleDays.map((day, i) => {
            const isToday = day.isSame(today, 'day')
            const isSelected = day.isSame(weekStart, 'day')
            const highlightClass = isSelected 
              ? 'border-t-4 border-t-[#8C4BFF] bg-[#8C4BFF]/10 dark:bg-[#8C4BFF]/20 text-[#8C4BFF] dark:text-[#A78BFA] border-r-slate-150 dark:border-r-slate-800'
              : isToday 
                ? 'border-t-4 border-t-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-r-slate-150 dark:border-r-slate-800'
                : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'

            return (
              <div 
                key={i} 
                className={`py-2 text-center border-r last:border-r-0 transition-colors flex flex-col justify-between ${highlightClass}`}
              >
                <div className={`text-[11px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#8C4BFF] dark:text-[#A78BFA]' : isToday ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {formatCustomDate(day)}
                </div>
                {/* Individual sub-columns header for each Practitioner */}
                <div className="grid mt-2 border-t border-slate-100/80 dark:border-slate-800 pt-1" style={{ gridTemplateColumns: `repeat(${activePractitionerObjects.length}, 1fr)` }}>
                  {activePractitionerObjects.map((p, pIdx) => (
                    <div key={p.id} className={`text-[9px] font-black uppercase tracking-tight truncate px-0.5 ${pIdx > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''} ${isSelected ? 'text-[#8C4BFF] dark:text-[#A78BFA]' : isToday ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {p.name.replace('Dr. ', '')}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Scrollable grid slots */}
        <div className="overflow-y-auto flex-grow">
          {timeSlots.map(({ h, m, label }, slotIdx) => {
            return (
              <div
                key={slotIdx}
                className="grid border-b border-slate-100 dark:border-slate-800"
                style={{
                  gridTemplateColumns: `80px repeat(${visibleDays.length}, 1fr)`,
                  minHeight: slotHeight,
                }}
              >
                {/* Hours Label Column */}
                <div className="border-r border-slate-100 flex items-start justify-end pr-3 pt-1 dark:border-slate-800">
                  {label && (
                    <span className="text-[10px] font-semibold text-slate-400 select-none">
                      {label}
                    </span>
                  )}
                </div>

                {/* Day Cells columns divided into Practitioner sub-columns */}
                {visibleDays.map((day, dayIdx) => {
                  const appts = getApptsInSlot(day, h, m)
                  const isToday = day.isSame(today, 'day')
                  const isSelected = day.isSame(weekStart, 'day')
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`border-r border-slate-100 last:border-r-0 p-0 cursor-pointer transition-colors grid dark:border-slate-800 ${
                        isSelected ? 'bg-[#8C4BFF]/10 dark:bg-[#8C4BFF]/10' : isToday ? 'bg-blue-500/5' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                      style={{ gridTemplateColumns: `repeat(${activePractitionerObjects.length}, 1fr)` }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, day, h, m)}
                    >
                      {activePractitionerObjects.map((prac, pracIdx) => {
                        const pracAppts = appts.filter(a => a.practitionerId === prac.id || (!a.practitionerId && pracIdx === 0))
                        
                        return (
                          <div
                            key={prac.id}
                            className={`h-full min-h-[44px] p-0.5 ${pracIdx > 0 ? 'border-l border-slate-100/60 dark:border-slate-800/60' : ''} flex flex-col gap-1`}
                            onClick={(e) => {
                              if (e.target === e.currentTarget) {
                                const hh = String(h).padStart(2, '0')
                                const mm = String(m).padStart(2, '0')
                                
                                const params = new URLSearchParams(location.search);
                                const rescheduleApptId = params.get('rescheduleApptId');
                                
                                if (rescheduleApptId) {
                                  const appt = store.appointments.find(a => a.id === rescheduleApptId);
                                  if (appt) {
                                    const updated = {
                                      ...appt,
                                      date: day.format('YYYY-MM-DD'),
                                      time: `${hh}:${mm}`,
                                      endTime: appt.endTime ? dayjs(`${day.format('YYYY-MM-DD')}T${hh}:${mm}`).add(1, 'hour').format('HH:mm') : undefined,
                                      practitionerId: prac.id
                                    };
                                    store.updateAppointment(updated);
                                    toast.success(`Rescheduled ${appt.patientName} to ${day.format('D MMM')} at ${hh}:${mm}`);
                                    setActiveIndicationBanner(null);
                                    navigate(location.pathname, { replace: true });
                                    return;
                                  }
                                }

                                setDefaultSlot({ date: day.format('YYYY-MM-DD'), time: `${hh}:${mm}`, practitionerId: prac.id })
                                setCreateModalVisible(true)
                              }
                            }}
                          >
                            {pracAppts.map(appt => {
                              const colors = getTypeColor(appt, store.darkMode)
                              const isNoClient = !appt.patientName || appt.patientName === 'No client'
                              const associatedNoteObj = store.consultations.find(c => c.appointmentId === appt.id)
                              
                              return (
                                <div
                                  key={appt.id}
                                  draggable
                                  onDragStart={e => handleDragStart(e, appt.id)}
                                  onClick={e => {
                                    e.stopPropagation()
                                    setSelectedAppt(appt)
                                    setDetailsVisible(true)
                                  }}
                                  className="rounded-lg px-1.5 py-1 mb-0.5 cursor-pointer border-l-[3px] hover:shadow-md transition-all select-none w-full text-left"
                                  style={{
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                    color: colors.text,
                                  }}
                                >
                                  {/* Patient name + icons row */}
                                  <div className="flex justify-between items-start w-full">
                                    <span className="font-black text-[10px] truncate leading-tight flex-1 mr-1" style={{ color: colors.text }}>
                                      {isNoClient ? 'No client' : appt.patientName}
                                    </span>
                                    <AppointmentStatusIcons appt={appt} noteObj={associatedNoteObj} />
                                  </div>
                                  <div className="text-[9px] font-bold truncate opacity-80 mt-0.5" style={{ color: colors.label }}>
                                    {appt.appointmentType || appt.serviceType || 'Consultation'}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => {
          setDefaultSlot(null)
          setCreateModalVisible(true)
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#8C4BFF] hover:bg-[#7b41e3] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-50"
        title="Add Appointment"
      >
        <PlusOutlined style={{ fontSize: 24 }} />
      </button>

      {/* Create appointment form modal */}
      <AppointmentModal
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        defaultTimeSlot={defaultSlot}
      />

      {/* Item Details popup modal */}
      <AppointmentDetailsModal
        open={detailsVisible}
        onCancel={() => {
          setDetailsVisible(false)
          setSelectedAppt(null)
        }}
        appointment={selectedAppt}
        onEditSuccess={(updated) => setSelectedAppt(updated)}
      />

    </div>
  )
}
