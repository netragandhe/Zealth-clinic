import React, { useState, useRef, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { getClinicDashboardStats } from '../../../calendar/api/clinicAdminApi'
import { Card, Button, Tag, Space, Checkbox, Select, DatePicker, Switch, Popconfirm, Tooltip as AntTooltip, Spin } from 'antd'
import {
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
  PercentageOutlined,
  UserAddOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  SlidersOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MessageOutlined,
  SendOutlined,
  DownloadOutlined,
  WarningOutlined,
  UndoOutlined,
  RollbackOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { useClinicStore } from '../../../../store/clinicStore'

const defaultMonths = [
  { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
  { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 },
]

export default function ClinicAdminDashboard({ store: propStore }) {
  const localStore = useClinicStore()
  const store = propStore || localStore
  const darkMode = store.darkMode

  const [taskRef, setTaskRef] = useState('')
  const [messageText, setMessageText] = useState('')
  const [pendingBoardPost, setPendingBoardPost] = useState(null)
  const boardTimerRef = useRef(null)
  const boardCountdownRef = useRef(null)

  // ── DB Stats State ────────────────────────────────────────────────────────
  const [dbStats, setDbStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await getClinicDashboardStats()
      if (res && res.success) {
        setDbStats(res.data)
        setLastUpdated(dayjs())
      }
    } catch (err) {
      console.error('❌ Dashboard stats fetch error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    if (store.fetchMessageBoardItems) {
      store.fetchMessageBoardItems()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (boardTimerRef.current) clearTimeout(boardTimerRef.current)
      if (boardCountdownRef.current) clearInterval(boardCountdownRef.current)
    }
  }, [])

  const executeActualBoardPost = async (payload) => {
    await store.addMessageBoardItem({
      sender: payload.sender,
      senderRole: payload.senderRole,
      message: payload.message,
      taskRef: payload.taskRef,
    })
    toast.success('Message posted to clinic board!')
  }

  const triggerImmediateBoardPost = (item) => {
    if (boardTimerRef.current) clearTimeout(boardTimerRef.current)
    if (boardCountdownRef.current) clearInterval(boardCountdownRef.current)
    setPendingBoardPost(null)
    executeActualBoardPost(item)
  }

  const handleUndoBoardPost = () => {
    if (boardTimerRef.current) clearTimeout(boardTimerRef.current)
    if (boardCountdownRef.current) clearInterval(boardCountdownRef.current)
    if (pendingBoardPost) {
      setMessageText(pendingBoardPost.message)
      setTaskRef(pendingBoardPost.taskRef || '')
      setPendingBoardPost(null)
      toast.success('Post cancelled. Text restored.', { icon: '↩️' })
    }
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) return

    if (pendingBoardPost) {
      triggerImmediateBoardPost(pendingBoardPost)
    }

    const senderName = store.user?.name || 'Clinic Admin'
    const newPost = {
      sender: senderName,
      senderRole: 'Clinic Admin',
      message: messageText.trim(),
      taskRef: taskRef.trim() || null,
      secondsLeft: 5
    }

    setMessageText('')
    setTaskRef('')
    setPendingBoardPost(newPost)

    boardCountdownRef.current = setInterval(() => {
      setPendingBoardPost(prev => {
        if (!prev) return null
        if (prev.secondsLeft <= 1) {
          clearInterval(boardCountdownRef.current)
          return null
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 }
      })
    }, 1000)

    boardTimerRef.current = setTimeout(() => {
      clearInterval(boardCountdownRef.current)
      setPendingBoardPost(null)
      executeActualBoardPost(newPost)
    }, 5000)
  }

  const handleRecallBoardMessage = async (id) => {
    if (!id) return
    try {
      await store.deleteMessageBoardItem(id)
      toast.success('Message recalled / removed from board', { icon: '↩️' })
    } catch (err) {
      toast.error('Failed to recall message')
    }
  }
  
  // Persisted grid columns layout preference
  const [gridCols, setGridCols] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_dashboard_grid_cols')
      return saved ? Number(saved) : 7
    } catch {
      return 7
    }
  })
  
  // Persisted visible metrics list preference
  const [visibleStats, setVisibleStats] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_dashboard_visible_stats')
      return saved ? JSON.parse(saved) : {
        monthly_revenue: true,
        outstanding_invoices: true,
        active_clients: false,
        payment_rate: false,
        new_clients: true,
        appts_week: true,
        cancellation_rate: true,
        waitlist: false,
        avg_utilisation: true,
        uninvoiced: true,
      }
    } catch {
      return {
        monthly_revenue: true,
        outstanding_invoices: true,
        active_clients: false,
        payment_rate: false,
        new_clients: true,
        appts_week: true,
        cancellation_rate: true,
        waitlist: false,
        avg_utilisation: true,
        uninvoiced: true,
      }
    }
  })
  
  const [customiseOpen, setCustomiseOpen] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const customiseRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('clinic_dashboard_grid_cols', String(gridCols))
  }, [gridCols])

  useEffect(() => {
    localStorage.setItem('clinic_dashboard_visible_stats', JSON.stringify(visibleStats))
  }, [visibleStats])

  useEffect(() => {
    const handler = (e) => {
      if (customiseRef.current && !customiseRef.current.contains(e.target)) {
        setCustomiseOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Check connected states for integrations from clinic settings store
  const isStripeConnected = store.integrations.find(i => i.id === 'stripe')?.connected
  const isXeroConnected = store.integrations.find(i => i.id === 'xero')?.connected
  const isMyobConnected = store.integrations.find(i => i.id === 'myob')?.connected
  const isZoomConnected = store.integrations.find(i => i.id === 'zoom')?.connected
  const isGMeetConnected = store.integrations.find(i => i.id === 'gmeet')?.connected

  const hasFinancials = isStripeConnected || isXeroConnected || isMyobConnected
  const hasVideoConsults = isZoomConnected || isGMeetConnected

  // ── Real DB Stats (from API) with fallback ────────────────────────────────
  const dbRevenue        = dbStats?.monthlyRevenue ?? 0
  const dbOutstanding    = dbStats?.outstandingAmount ?? 0
  const dbWeekAppts      = dbStats?.weekAppointments ?? 0
  const dbCancelRate     = dbStats?.cancellationRate ?? 0
  const dbNewClients     = dbStats?.newClientsThisMonth ?? 0
  const dbUninvoiced     = dbStats?.uninvoicedCount ?? 0
  const dbActiveClients  = dbStats?.activePatients ?? 0
  const dbPaymentRate    = dbStats?.paymentRate ?? 0
  const dbWaitlist       = dbStats?.waitlistCount ?? 0
  const dbUtilisation    = dbStats?.avgUtilisation ?? 0

  // Chart data from DB (last 6 months), fallback to 0 defaults if empty
  const chartActivityData = (dbStats?.activityByMonth?.length > 0) ? dbStats.activityByMonth : defaultMonths
  const chartRevenueData  = (dbStats?.revenueByMonth?.length > 0)  ? dbStats.revenueByMonth  : defaultMonths

  const statsList = [
    { 
      id: 'avg_utilisation', label: 'UTILISATION %', icon: null, color: '#10B981', 
      value: statsLoading ? '—' : `${dbUtilisation}%`, 
      change: dbStats ? 'Direct calculation' : 'Loading...', pos: true, sub: 'Completed sessions / total' 
    },
    { 
      id: 'monthly_revenue', label: 'REVENUE $', icon: <DollarOutlined />, color: '#8C4BFF',
      value: statsLoading ? '—' : `$${dbRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: dbStats ? 'Current month' : null, pos: true, sub: 'Monthly paid invoices'
    },
    { 
      id: 'appts_week', label: 'APPOINTMENTS', icon: <CalendarOutlined />, color: '#3B82F6',
      value: statsLoading ? '—' : String(dbWeekAppts),
      change: null, pos: null, sub: 'This week (scheduled)'
    },
    { 
      id: 'cancellation_rate', label: 'CANCELLATION', icon: <WarningOutlined />, color: '#EF4444',
      value: statsLoading ? '—' : `${dbCancelRate}%`,
      change: dbStats ? 'Current month' : null, pos: false, sub: 'Cancelled this month'
    },
    { 
      id: 'new_clients', label: 'NEW CLIENTS', icon: <UserAddOutlined />, color: '#30D2BE',
      value: statsLoading ? '—' : String(dbNewClients),
      change: null, pos: null, sub: 'Onboarded this month'
    },
    { 
      id: 'outstanding_invoices', label: 'OUTSTANDING $', icon: <DollarOutlined />, color: '#F59E0B',
      value: statsLoading ? '—' : `$${dbOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: null, pos: null, sub: 'Pending payment'
    },
    { 
      id: 'uninvoiced', label: 'UNINVOICED', icon: <FileTextOutlined />, color: '#8C4BFF',
      value: statsLoading ? '—' : String(dbUninvoiced),
      change: null, pos: null, sub: 'Draft invoice needed'
    },
    { 
      id: 'active_clients', label: 'ACTIVE CLIENTS', icon: <TeamOutlined />, color: '#8C4BFF',
      value: statsLoading ? '—' : String(dbActiveClients),
      change: dbStats ? 'Active status' : null, pos: true, sub: 'Active patient status'
    },
    { 
      id: 'payment_rate', label: 'PAYMENT RATE', icon: <PercentageOutlined />, color: '#8C4BFF',
      value: statsLoading ? '—' : `${dbPaymentRate}%`,
      change: dbStats ? 'Paid / total invoices' : null, pos: dbPaymentRate >= 70, sub: 'From total invoices'
    },
    { 
      id: 'waitlist', label: 'WAITLIST CLIENTS', icon: <ClockCircleOutlined />, color: '#F59E0B',
      value: statsLoading ? '—' : String(dbWaitlist),
      change: null, pos: false, sub: 'Awaiting appointment'
    },
  ]

  const getGridClass = () => {
    if (gridCols === 4) return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'
    if (gridCols === 5) return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4'
    if (gridCols === 6) return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4'
    return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4'
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white m-0">Performance Overview Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Real-time analytics, utilization rates, and financial reports across all locations.</p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 hidden sm:flex">
            <span className="text-xs font-semibold text-slate-400">
              {statsLoading
                ? 'Refreshing…'
                : lastUpdated
                  ? `Updated ${lastUpdated.format('D MMM YYYY, h:mm A')}`
                  : 'Not yet loaded'}
            </span>
            <button
              onClick={fetchStats}
              disabled={statsLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-[#8C4BFF] hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title="Refresh dashboard data"
            >
              {statsLoading ? <Spin size="small" /> : <ReloadOutlined spin={statsLoading} />}
            </button>
          </div>
          <div className="relative" ref={customiseRef}>
            <div className="flex gap-2">
              <button
                onClick={() => setCustomiseOpen(!customiseOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-[#8C4BFF] hover:text-[#8C4BFF] transition-colors"
              >
                <SlidersOutlined />
                <span>Customise</span>
              </button>
            </div>

          {customiseOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 z-50 w-[320px] p-5 shadow-xl space-y-5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Dashboard Filters</span>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date Range</label>
                    <div className="flex items-center gap-2">
                      <DatePicker className="h-8 w-full rounded-lg text-xs" placeholder="Start date" getPopupContainer={trigger => trigger.parentNode} />
                      <span className="text-slate-400">-</span>
                      <DatePicker className="h-8 w-full rounded-lg text-xs" placeholder="End date" getPopupContainer={trigger => trigger.parentNode} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Period</label>
                      <Select defaultValue="Monthly" className="w-full h-8 rounded-lg text-xs" getPopupContainer={trigger => trigger.parentNode}>
                        <Select.Option value="Daily">Daily</Select.Option>
                        <Select.Option value="Weekly">Weekly</Select.Option>
                        <Select.Option value="Monthly">Monthly</Select.Option>
                      </Select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                      <Select defaultValue="All Locations" className="w-full h-8 rounded-lg text-xs" getPopupContainer={trigger => trigger.parentNode}>
                        <Select.Option value="All Locations">All Locations</Select.Option>
                        <Select.Option value="Main Clinic">Main Clinic</Select.Option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Practitioner</label>
                    <Select defaultValue="All Practitioners" className="w-full h-8 rounded-lg text-xs" getPopupContainer={trigger => trigger.parentNode}>
                      <Select.Option value="All Practitioners">All Practitioners</Select.Option>
                      <Select.Option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</Select.Option>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Compare (Prev. Period)</span>
                    <Switch 
                      checked={isComparing} 
                      onChange={(checked) => {
                        setIsComparing(checked)
                        if(checked) toast.success('Comparison mode enabled')
                        else toast.success('Comparison mode disabled')
                      }}
                      size="small"
                      style={{ backgroundColor: isComparing ? '#8C4BFF' : undefined }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Report Grid Layout</span>
                <div className="flex gap-1">
                  {[4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      onClick={() => setGridCols(num)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        gridCols === num ? 'border-[#8C4BFF] bg-[#F3EEFF] text-[#8C4BFF]' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      {num} Cols
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Customise Specific Reports</span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {statsList.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer py-0.5 hover:text-[#8C4BFF]">
                      <Checkbox
                        checked={visibleStats[s.id]}
                        onChange={() => setVisibleStats(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>


      {/* Stats Cards Grid */}
      <div className={getGridClass()}>
        {statsList.filter(s => visibleStats[s.id]).map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2 gap-1">
              <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider leading-tight">{s.label}</span>
              {s.icon && (
                <div className="text-[10px] font-bold shrink-0" style={{ color: s.color }}>
                  {s.icon}
                </div>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white m-0 mb-1">{s.value}</h3>
            {s.change && (
              <div className={`flex items-center gap-1 text-[9px] font-semibold ${s.pos === null ? 'text-slate-400' : s.pos ? 'text-emerald-500' : 'text-rose-500'}`}>
                {s.pos === true && <ArrowUpOutlined style={{ fontSize: 8 }} />}
                {s.pos === false && <ArrowDownOutlined style={{ fontSize: 8 }} />}
                {s.change}
              </div>
            )}
            {s.sub && !s.change && (
              <div className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-tight">
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main charts layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm" title={<span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Monthly Clinical Appointments Trend <span className="text-[10px] text-emerald-500 font-semibold ml-2">Live DB</span></span>}>
          <div style={{ width: '100%', height: 240, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={false} contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', color: darkMode ? '#FFFFFF' : '#1E293B', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="value" stroke="#30D2BE" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#30D2BE' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm" title={<span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Financial Revenue Logs <span className="text-[10px] text-emerald-500 font-semibold ml-2">Live DB</span></span>}>
          <div style={{ width: '100%', height: 240, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={false} contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', color: darkMode ? '#FFFFFF' : '#1E293B', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="value" fill="#8C4BFF" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Clinic Message Board & Tasks Communication */}
      <Card
        className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 mt-6"
        title={
          <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
            <MessageOutlined style={{ color: '#8C4BFF' }} /> Clinic Message Board & Task Communication
          </span>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Board Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3">
              {store.messageBoard && store.messageBoard.length > 0 ? (
                store.messageBoard.map((msg) => {
                  const isAdmin = msg.senderRole === 'Clinic Admin'
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border transition-all relative group ${
                        isAdmin
                          ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800'
                          : 'bg-[#8C4BFF]/5 dark:bg-[#8C4BFF]/10 border-[#8C4BFF]/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
                            {msg.timestamp}
                          </span>
                          {isAdmin && msg.id && (
                            <AntTooltip title="Recall / Undo message from board">
                              <Popconfirm
                                title="Recall this message?"
                                description="Are you sure you want to recall/remove this post from the board?"
                                onConfirm={() => handleRecallBoardMessage(msg.id)}
                                okText="Recall"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, size: 'small' }}
                                cancelButtonProps={{ size: 'small' }}
                              >
                                <button className="opacity-0 group-hover:opacity-100 p-1 px-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-all border-none bg-transparent cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                                  <RollbackOutlined style={{ fontSize: 10 }} />
                                  <span>Recall</span>
                                </button>
                              </Popconfirm>
                            </AntTooltip>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs m-0 font-semibold leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  No messages posted yet.
                </div>
              )}
            </div>
          </div>

          {/* Message Composer */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            <h4 className="font-bold text-xs text-slate-700 dark:text-white uppercase tracking-wider mb-4">Post Announcement / Task</h4>
            
            {/* Active Undo Send Cancellation Window */}
            {pendingBoardPost && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border border-amber-400/40 text-xs font-semibold shadow-sm mb-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-amber-500 animate-spin text-sm" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Posting in <strong className="text-amber-600 dark:text-amber-400 font-bold">{pendingBoardPost.secondsLeft}s</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate m-0 italic">
                  "{pendingBoardPost.message.slice(0, 45)}{pendingBoardPost.message.length > 45 ? '...' : ''}"
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="small"
                    danger
                    icon={<UndoOutlined />}
                    onClick={handleUndoBoardPost}
                    className="font-bold text-xs rounded-lg shadow-sm flex-1"
                  >
                    Undo Post
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => triggerImmediateBoardPost(pendingBoardPost)}
                    style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                    className="font-bold text-xs rounded-lg flex-1"
                  >
                    Post Now
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Task Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Miller Assessment"
                  value={taskRef}
                  onChange={(e) => setTaskRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#8C4BFF] transition-all h-9"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Write your task instructions or communication message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-[#8C4BFF] transition-all resize-none"
                />
              </div>
              <button
                onClick={handleSendMessage}
                className="w-full bg-[#8C4BFF] hover:bg-[#8C4BFF]/90 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer border-none shadow-sm text-xs transition-colors"
              >
                <SendOutlined />
                <span>Post Message</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
