import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Badge, Tag, Tooltip, Select, Switch, Progress } from 'antd'
import {
  CalendarOutlined,
  FileTextOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BranchesOutlined,
  AudioOutlined,
  MobileOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  MessageOutlined,
  SendOutlined,
  SlidersOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { getPractitionerDashboardStats } from '../../../calendar/api/clinicAdminApi'
import { getCategoryTagColor } from './PractitionerTasks'

const { Option } = Select

export default function PractitionerDashboard({ store, navigate }) {
  const [mobileMode, setMobileMode] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const [dictationText, setDictationText] = useState('')

  const [taskRef, setTaskRef] = useState('')
  const [messageText, setMessageText] = useState('')

  const [customiseOpen, setCustomiseOpen] = useState(false)
  const customiseRef = useRef(null)

  // ── DB Stats State ────────────────────────────────────────────────────────
  const [dbStats, setDbStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const res = await getPractitionerDashboardStats()
        if (res && res.success) {
          setDbStats(res.data)
        }
      } catch (err) {
        console.error('❌ Practitioner dashboard stats fetch error:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (customiseRef.current && !customiseRef.current.contains(e.target)) {
        setCustomiseOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    if (store.fetchAppointments) store.fetchAppointments()
    if (store.fetchPatients) store.fetchPatients()
    if (store.fetchTasks) store.fetchTasks()
    if (store.fetchConsultations) store.fetchConsultations()
    if (store.fetchMessageBoardItems) store.fetchMessageBoardItems()
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    const senderName = store.user?.name || 'Dr. Sarah Jenkins'
    await store.addMessageBoardItem({
      sender: senderName,
      senderRole: 'Practitioner',
      message: messageText.trim(),
      taskRef: taskRef.trim() || null,
    })
    toast.success('Message posted to clinic board!')
    setMessageText('')
    setTaskRef('')
  }

  // Get active profession, checking authoritative store specialty
  const activeSpecialty = store.getActiveSpecialty ? store.getActiveSpecialty() : (store.simulatedSpecialty || 'Physiotherapist')

  const handleProfessionChange = (val) => {
    store.setSimulatedSpecialty(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('practitionerSpecialty', val)
    }
    toast.success(`Active profile updated: Customizing workflows for ${val}`)
  }

  // Dictation simulator
  const handleStartDictation = () => {
    if (isDictating) {
      setIsDictating(false)
      setDictationText('Patient presents with moderate cervical stiffness. Recommending dry needling and isometric pulls.')
      toast.success('Dictation stopped. Notes transcribed successfully!')
    } else {
      setIsDictating(true)
      setDictationText('Listening...')
      toast('AI Assistant is listening...', { icon: '🎤' })
    }
  }

  // Handle KPI Cards count dynamically
  const pendingReportsCount = store.tasks.filter(t => t.type === 'Report Due' && t.status !== 'Completed').length
  const lowFundingAlerts = store.patients.filter(p => (p.sessionsAllocated - p.sessionsUsed) <= 2).length

  // Appointments for today — strictly today's date only (no cross-date fallback), sorted chronologically by time
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppts = (store.appointments || [])
    .filter(a => a.date === todayStr)
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))

  // Tasks due
  const pendingTasks = store.tasks.filter(t => t.status !== 'Completed')

  // Calculate completed consultations and pending notes dynamically from live store/DB
  const completedConsultationsCount = (store.consultations || []).filter(c => c.status === 'Completed' || c.status === 'Signed').length
  // Prefer DB-sourced pending notes count; fall back to local store filter
  const pendingNotesCount = dbStats?.pendingNotes ?? (store.consultations || []).filter(c => c.status === 'Draft').length

  // Render Mobile View Mode
  if (mobileMode) {
    return (
      <div className="max-w-[400px] mx-auto bg-slate-950 text-white rounded-[40px] border-[12px] border-slate-800 shadow-2xl overflow-hidden p-6 font-sans flex flex-col justify-between min-h-[720px] relative">
        {/* Notch / Speaker */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-4.5 bg-slate-800 rounded-full flex justify-center items-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mr-2" />
          <div className="w-10 h-1 bg-slate-900 rounded-full" />
        </div>

        <div className="mt-4 flex-1 flex flex-col justify-between space-y-5">
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-black text-[#30D2BE] tracking-widest block">{activeSpecialty} Portal</span>
              <h3 className="text-sm font-extrabold text-white m-0">Dr. Sarah Jenkins</h3>
            </div>
            <Button
              size="small"
              onClick={() => setMobileMode(false)}
              className="bg-slate-800 text-slate-300 border-none font-bold text-[10px] rounded-lg"
            >
              Exit Mobile
            </Button>
          </div>

          {/* Quick Actions grid for mobile */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Mobile Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleStartDictation}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-none cursor-pointer transition-all ${isDictating ? 'bg-red-550 text-white animate-pulse' : 'bg-slate-900 hover:bg-slate-850 text-white'
                  }`}
              >
                <AudioOutlined style={{ fontSize: 22, color: isDictating ? 'white' : '#30D2BE' }} />
                <span className="text-[10px] font-bold mt-2">{isDictating ? 'Stop Dictating' : 'Start Dictation'}</span>
              </button>

              <button
                onClick={() => navigate('/practitioner/calendar')}
                className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl border-none cursor-pointer"
              >
                <CalendarOutlined style={{ fontSize: 22, color: '#8C4BFF' }} />
                <span className="text-[10px] font-bold mt-2">View Calendar</span>
              </button>

              <button
                onClick={() => navigate('/practitioner/patients')}
                className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl border-none cursor-pointer"
              >
                <UserOutlined style={{ fontSize: 22, color: '#3B82F6' }} />
                <span className="text-[10px] font-bold mt-2">Open Patients</span>
              </button>

              <button
                onClick={() => navigate('/practitioner/consultations')}
                className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl border-none cursor-pointer"
              >
                <FileTextOutlined style={{ fontSize: 22, color: '#10B981' }} />
                <span className="text-[10px] font-bold mt-2">Create Notes</span>
              </button>

              <button
                onClick={() => navigate('/practitioner/notes-reports?tab=reports')}
                className="flex flex-col items-center justify-center p-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl border-none cursor-pointer"
              >
                <BranchesOutlined style={{ fontSize: 22, color: '#EC4899' }} />
                <span className="text-[10px] font-bold mt-2">Generate Report</span>
              </button>
            </div>
          </div>

          {/* Dictation Output */}
          {dictationText && (
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px]">
              <span className="font-bold text-[#30D2BE] block mb-1">AI Live Transcribed Text:</span>
              <p className="text-slate-300 m-0 leading-relaxed italic">"{dictationText}"</p>
            </div>
          )}

          {/* Today's Agenda list for Mobile */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Today's Appointments</h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {todayAppts.slice(0, 3).map(a => (
                <div key={a.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold block">{a.patientName}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{a.appointmentType || 'Consultation'}</span>
                  </div>
                  <Tag color="cyan" className="m-0 border-none font-bold text-[8px] uppercase">{a.fundingScheme}</Tag>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#8C4BFF]/10 text-[#8C4BFF] mb-2 tracking-wider">
            Treating Clinician Workspace
          </span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white m-0">
            Practitioner dashboard
          </h1>
          <p className="text-slate-400 dark:text-slate-400 text-xs mt-1.5 font-semibold">
            Manage your appointments, notes and reports.
          </p>
        </div>

        {/* Customise Button & Dropdown */}
        <div className="relative" ref={customiseRef}>
          <button
            onClick={() => setCustomiseOpen(!customiseOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-[#8C4BFF] hover:text-[#8C4BFF] transition-colors"
          >
            <SlidersOutlined />
            <span>Customise</span>
          </button>

          {customiseOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 z-50 w-[280px] p-5 shadow-xl space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Workspace Settings</span>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Simulate Specialty</span>
                <Select
                  value={activeSpecialty}
                  onChange={handleProfessionChange}
                  className="w-full font-bold text-xs"
                >
                  <Option value="Physiotherapist">Physiotherapist</Option>
                  <Option value="Chiropractor">Chiropractor</Option>
                  <Option value="Occupational Therapist">Occupational Therapist</Option>
                  <Option value="Exercise Physiologist">Exercise Physiologist</Option>
                  <Option value="Speech Pathologist">Speech Pathologist</Option>
                  <Option value="Psychologist">Psychologist</Option>
                  <Option value="Dietitian">Dietitian</Option>
                  <Option value="Podiatrist">Podiatrist</Option>
                  <Option value="Osteopath">Osteopath</Option>
                  <Option value="General Practitioner">General Practitioner</Option>
                  <Option value="Specialist Doctor">Specialist Doctor</Option>
                </Select>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mobile View</span>
                <Switch
                  checked={mobileMode}
                  onChange={setMobileMode}
                  size="small"
                  checkedChildren={<MobileOutlined />}
                  unCheckedChildren={<MobileOutlined />}
                  style={{ backgroundColor: mobileMode ? '#8C4BFF' : undefined }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: "Today's Consultations",
            value: statsLoading ? '—' : `${todayAppts.length} Sessions`,
            icon: <CalendarOutlined />,
            color: '#30D2BE',
            desc: statsLoading ? 'Loading...' : `${completedConsultationsCount} completed · ${dbStats?.todayCancelled ?? todayAppts.filter(a => a.status === 'Cancelled' || a.status === 'No Show').length} cancelled`
          },
          {
            label: 'Uncompleted Notes Review',
            value: statsLoading ? '—' : `${pendingNotesCount} Pending`,
            icon: <FileTextOutlined />,
            color: '#8C4BFF',
            desc: pendingNotesCount === 0 ? 'All session notes completed!' : 'Requires validation / completion'
          },
          {
            label: 'Weekly Clinical Utilisation',
            value: statsLoading ? '—' : `${(dbStats?.weeklyUtilisation ?? 0)}%`,
            icon: <CheckCircleOutlined />,
            color: '#10B981',
            desc: statsLoading
              ? 'Loading...'
              : (() => {
                  const booked = dbStats?.weeklyBookedAppointments ?? 0
                  const spaces = dbStats?.weeklyClinicalSpaces ?? 40
                  const wStart = dbStats?.weekStartStr ? dayjs(dbStats.weekStartStr).format('D MMM') : dayjs().startOf('week').add(1, 'day').format('D MMM')
                  const wEnd = dbStats?.weekEndStr ? dayjs(dbStats.weekEndStr).format('D MMM') : dayjs().endOf('week').add(1, 'day').format('D MMM')
                  return `${booked}/${spaces} spaces booked (${wStart} – ${wEnd})`
                })()
          }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-wider">{kpi.label}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: kpi.color + '18', color: kpi.color }}
              >
                {kpi.icon}
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white m-0 mt-3">{kpi.value}</h3>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-1 block">{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Appointments & Tasks */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Appointments Calendar Panel */}
          <Card
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden"
            title={
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2 whitespace-normal leading-tight">
                  <CalendarOutlined style={{ color: '#30D2BE' }} /> Today's Consultations Agenda
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{dayjs().format('MMMM D, YYYY')}</span>
              </div>
            }
          >
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {todayAppts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No consultations scheduled for today.</div>
              ) : (
                todayAppts.map(appt => {
                  const patientObj = store.patients.find(p => p.id === appt.patientId)
                  let sessionsLeft = 8
                  if (patientObj && typeof patientObj.sessionsAllocated === 'number' && typeof patientObj.sessionsUsed === 'number') {
                    sessionsLeft = Math.max(0, patientObj.sessionsAllocated - patientObj.sessionsUsed)
                  }
                  const isLowFunding = sessionsLeft <= 2
                  const hasFinalNote = (store.consultations || []).some(
                    c => (c.patientId === appt.patientId || c.appointmentId === appt.id) && (c.status === 'Completed' || c.status === 'Signed')
                  )
                  return (
                    <div
                      key={appt.id}
                      className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-[#8C4BFF]/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: hasFinalNote ? '#10B981' : (appt.color || '#30D2BE') }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-white text-xs">{appt.patientName}</span>
                            {hasFinalNote && (
                              <Tag color="success" className="m-0 border-none font-bold text-[8px] uppercase rounded-full px-2 py-0.5">Completed</Tag>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {appt.appointmentType || appt.serviceType || 'Consultation'} &bull; {appt.time}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag color={appt.fundingScheme === 'NDIS' ? 'cyan' : 'purple'} className="border-none font-bold text-[8px] uppercase m-0 px-2.5 py-0.5 rounded-full">
                              {appt.fundingScheme}
                            </Tag>
                            <span className={`text-[9px] font-black ${isLowFunding ? 'text-red-500' : 'text-slate-400'}`}>
                              {sessionsLeft} sessions remaining
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 select-none">
                        <Button
                          size="small"
                          onClick={() => navigate(`/practitioner/patients/${appt.patientId}`)}
                          className="rounded-xl font-bold text-[10px] bg-white dark:bg-slate-900 border-slate-200"
                        >
                          Open Patient
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => {
                            const pracSpec = appt.specialty || appt.practitionerSpecialty || (store.practitioners || []).find(p => p.name === appt.practitionerName || p.id === appt.practitionerId)?.specialty || activeSpecialty
                            if (pracSpec && store.setSimulatedSpecialty) {
                              store.setSimulatedSpecialty(pracSpec)
                            }
                            navigate(`/practitioner/consultations?patientId=${appt.patientId}&profession=${encodeURIComponent(pracSpec)}`)
                          }}
                          style={{ backgroundColor: hasFinalNote ? '#10B981' : '#8C4BFF', borderColor: hasFinalNote ? '#10B981' : '#8C4BFF' }}
                          className="rounded-xl font-bold text-[10px] text-white"
                        >
                          {hasFinalNote ? 'View Note' : 'Start Consultation'}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Clinical Tasks Dashboard Checklist */}
          <Card
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2 whitespace-normal leading-tight">
                  <CheckCircleOutlined style={{ color: '#10B981' }} /> Clinical Checklist Tasks
                </span>
                <button
                  onClick={() => navigate('/practitioner/tasks')}
                  className="text-xs text-[#8C4BFF] font-bold border-none bg-transparent cursor-pointer hover:underline text-left sm:text-right"
                >
                  Manage Tasks Board →
                </button>
              </div>
            }
          >
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map(task => {
                const tagColor = getCategoryTagColor(task.type)
                return (
                  <div key={task.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 sm:mt-0"
                        style={{ backgroundColor: tagColor.text }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white block whitespace-normal leading-tight">{task.title}</span>
                          <span
                            className="text-[8px] font-extrabold uppercase px-2 py-0.2 rounded-full border inline-block"
                            style={{
                              backgroundColor: tagColor.bg,
                              color: tagColor.text,
                              borderColor: tagColor.border
                            }}
                          >
                            {task.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold whitespace-normal">{task.patientName} &bull; Due: {task.dueDate}</span>
                      </div>
                    </div>
                    <Tag color={task.status === 'In Progress' ? 'processing' : 'default'} className="m-0 border-none rounded-lg text-[9px] font-extrabold uppercase shrink-0">
                      {task.status}
                    </Tag>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Clinic Message Board & Tasks Communication */}
          <Card
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                <MessageOutlined style={{ color: '#8C4BFF' }} /> Clinic Message Board & Task Communication
              </span>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Message Board Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="overflow-y-auto pr-2 space-y-3" style={{ height: '500px' }}>
                  {store.messageBoard && store.messageBoard.length > 0 ? (
                    store.messageBoard.map((msg) => {
                      const isAdmin = msg.senderRole === 'Clinic Admin'
                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-2xl border transition-all ${isAdmin
                              ? 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                              : 'bg-[#8C4BFF]/10 dark:bg-[#8C4BFF]/20 border-[#8C4BFF]/20'
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-850 dark:text-slate-200">
                                {msg.sender}
                              </span>
                              <Tag
                                color={isAdmin ? 'blue' : 'purple'}
                                className="border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-full m-0"
                              >
                                {msg.senderRole}
                              </Tag>
                              {msg.taskRef && (
                                <Tag
                                  color="cyan"
                                  className="border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-full m-0"
                                >
                                  Task: {msg.taskRef}
                                </Tag>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                              {msg.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 text-xs m-0 font-semibold leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No messages posted yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Message Composer */}
              <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-150 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-5">
                <h4 className="font-bold text-xs text-slate-700 dark:text-white uppercase tracking-wider mb-3">Post Announcement / Task</h4>
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Task Reference (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Miller Assessment"
                      value={taskRef}
                      onChange={(e) => setTaskRef(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#8C4BFF] transition-all h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write details..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#8C4BFF] transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="w-full bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-9 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
                  >
                    <SendOutlined />
                    <span>Post Message</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Uncompleted Notes Review & AI Dictation Assistant */}
        <div className="space-y-6">
          {/* Uncompleted Notes Review Queue */}
          <Card
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            styles={{ body: { padding: '16px' } }}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-base text-slate-800 dark:text-white m-0">
                Uncompleted Notes
              </h4>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/practitioner/notes-reports'); }} className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-colors">
                View All &rarr;
              </a>
            </div>

            <div className="space-y-3">
              {(dbStats?.uncompletedNotes || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">No pending notes for review.</div>
              ) : (
                (dbStats?.uncompletedNotes || []).map(item => (
                  <div key={item.id} className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <span className="font-bold text-[14px] text-slate-900 dark:text-slate-100 block mb-1">
                        {item.patientName || item.notes || 'Clinical Note'}
                      </span>
                      <span className="text-[12px] font-semibold text-[#8C4BFF] block">
                        {item.date || 'Draft'}
                      </span>
                    </div>

                    <Button
                      size="small"
                      type="primary"
                      style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}
                      onClick={async () => {
                        if (item.id && item.id.length > 10) {
                          await store.updateConsultation(item.id, { status: 'Signed' })
                        }
                        setDbStats(prev => prev ? {
                          ...prev,
                          uncompletedNotes: (prev.uncompletedNotes || []).filter(n => n.id !== item.id),
                          pendingNotes: Math.max(0, (prev.pendingNotes || 1) - 1)
                        } : null)
                        toast.success(`Note for ${item.patientName || 'Patient'} approved and signed in live database!`)
                      }}
                      className="rounded-md font-semibold text-white px-4 py-1 h-auto text-[11px]"
                    >
                      Sign & Approve
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Reports Due Grid */}
          <Card
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
          >
            <div className="space-y-3">
              {(dbStats?.upcomingReports || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">No upcoming reports due.</div>
              ) : (
                (dbStats?.upcomingReports || []).map(rep => (
                  <div key={rep.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-250 block">{rep.patientName || rep.patient}</span>
                      <span className="text-[9px] text-[#F97316] font-bold mt-0.5 block">{rep.type || 'Clinical Report'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">{rep.date || 'Pending'}</span>
                      <button
                        onClick={() => navigate(`/practitioner/notes-reports?generate=${rep.type || 'Report'}&patient=${rep.patientName || rep.patient}`)}
                        className="text-[9px] text-[#8C4BFF] border-none bg-transparent cursor-pointer font-bold mt-1 block"
                      >
                        Draft Report →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
