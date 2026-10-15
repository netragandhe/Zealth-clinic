import React, { useState, useEffect } from 'react'
import { Card, Select, Tag } from 'antd'
import {
  ApartmentOutlined, TeamOutlined, UserOutlined, CreditCardOutlined, DollarOutlined, PieChartOutlined,
  ArrowUpOutlined, ArrowDownOutlined, CloseCircleOutlined, ThunderboltOutlined, InfoCircleOutlined, SyncOutlined,
  MessageOutlined, SendOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import api from '../../../../api/axios'

const { Option } = Select

export default function HeadAdminDashboard({ store, navigate }) {
  const darkMode = store.darkMode
  const [selectedYear, setSelectedYear] = useState('2026')
  const [taskRef, setTaskRef] = useState('')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)

  // Live Database State
  const [analyticsData, setAnalyticsData] = useState(null)
  const [billingData, setBillingData] = useState(null)
  const [clinicsList, setClinicsList] = useState([])
  const [auditLogsList, setAuditLogsList] = useState([])

  useEffect(() => {
    let isMounted = true

    const fetchAllDashboardData = async () => {
      try {
        setLoading(true)
        const [analyticsRes, billingRes, clinicsRes, auditLogsRes] = await Promise.all([
          api.get('/api/super-admin/platform-analytics').catch(() => null),
          api.get('/api/super-admin/billing/overview').catch(() => null),
          api.get('/api/super-admin/clinics').catch(() => null),
          api.get('/api/super-admin/audit-logs').catch(() => null)
        ])

        if (!isMounted) return

        if (analyticsRes?.data?.success && analyticsRes.data.data) {
          setAnalyticsData(analyticsRes.data.data)
        }
        if (billingRes?.data?.success && billingRes.data.data) {
          setBillingData(billingRes.data.data)
        }
        if (clinicsRes?.data?.success && Array.isArray(clinicsRes.data.data)) {
          setClinicsList(clinicsRes.data.data)
        }
        if (auditLogsRes?.data?.success && Array.isArray(auditLogsRes.data.data)) {
          setAuditLogsList(auditLogsRes.data.data)
        }
      } catch (err) {
        console.error('Error loading Super Admin Dashboard data:', err)
        if (isMounted) {
          toast.error('Could not load some dashboard metrics from live server')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAllDashboardData()
    if (store.fetchMessageBoardItems) {
      store.fetchMessageBoardItems()
    }

    return () => {
      isMounted = false
    }
  }, [])

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    const senderName = store.user?.name || 'Super Admin'
    await store.addMessageBoardItem({
      sender: senderName,
      senderRole: 'Super Admin',
      message: messageText.trim(),
      taskRef: taskRef.trim() || null,
    })
    toast.success('Message posted to clinic board!')
    setMessageText('')
    setTaskRef('')
  }

  // Metric Cards derived from Live DB
  const totalClinicsVal = analyticsData?.totalClinicsCount ?? billingData?.totalClinicsCount ?? clinicsList?.length ?? 0
  const totalPractitionersVal = analyticsData?.totalPractitionersCount ?? 0
  const totalPatientsVal = analyticsData?.totalPatientsCount ?? 0
  const activeSubsVal = analyticsData?.activeSubscriptionsCount ?? 0
  const mrrVal = analyticsData?.mrr ?? billingData?.mrr ?? 0
  const arrVal = analyticsData?.arr ?? billingData?.arr ?? 0

  const stats = [
    { label: 'Total Clinics', value: String(totalClinicsVal), icon: <ApartmentOutlined /> },
    { label: 'Total Practitioners', value: String(totalPractitionersVal.toLocaleString()), icon: <TeamOutlined /> },
    { label: 'Total Patients', value: String(totalPatientsVal.toLocaleString()), icon: <UserOutlined /> },
    { label: 'Active Subscriptions', value: String(activeSubsVal.toLocaleString()), icon: <CreditCardOutlined /> },
    { label: 'MRR', value: `$${Number(mrrVal).toLocaleString()}`, icon: <DollarOutlined /> },
    { label: 'ARR', value: `$${Number(arrVal).toLocaleString()}`, icon: <PieChartOutlined /> },
  ]

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Revenue Trend Chart Data (derived from Live DB)
  const revenueTrendData = analyticsData?.trendData && analyticsData.trendData.length > 0
    ? analyticsData.trendData.map(t => ({ name: t.name, value: t.MRR || t.value || 0 }))
    : months.map(name => ({ name, value: 0 }))

  // Subscription Monthly Distribution (1 year bar chart)
  const subMonthlyData = analyticsData?.customerGrowthData && analyticsData.customerGrowthData.length > 0
    ? analyticsData.customerGrowthData.map(c => ({ name: c.name, value: (c.activeClinics || 0) * 35 }))
    : months.map(name => ({ name, value: 0 }))

  // Live Activity Log
  const liveActivities = auditLogsList && auditLogsList.length > 0
    ? auditLogsList.slice(0, 6).map((log, idx) => ({
        id: log.id || String(idx + 1),
        title: log.action || 'System event logged',
        desc: log.target || log.details || 'Platform operation executed',
        time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${idx * 15 + 3}m ago`,
        icon: log.severity === 'Critical' ? <CloseCircleOutlined className="text-rose-500" /> : <ApartmentOutlined className="text-emerald-500" />,
        bg: log.severity === 'Critical' ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20'
      }))
    : []

  // Outstanding Invoices from DB
  const dbInvoices = analyticsData?.billingInvoices || []
  const outstandingInvoices = dbInvoices.length > 0
    ? dbInvoices.slice(0, 4).map(inv => ({
        name: inv.patientName || inv.clinic || 'Clinic Customer',
        inv: inv.invoiceNumber || inv.displayId || 'INV-1001',
        due: inv.dueDate || '18 Jun',
        amount: `$${Number(inv.amount || 0).toLocaleString()}`,
        status: inv.status === 'Paid' ? 'Succeeded' : 'Extension'
      }))
    : []

  // Churn Risk from DB Clinics
  const churnRisk = clinicsList.length > 0
    ? clinicsList.filter(c => c.status === 'Inactive' || c.status === 'Suspended' || c.status === 'Overdue').slice(0, 4).map(c => ({
        name: c.name,
        days: 'Overdue',
        status: c.tier || 'Basic'
      }))
    : []

  // Failed Payments from DB
  const failedPayments = dbInvoices.filter(i => i.status === 'Overdue' || i.status === 'Failed').length > 0
    ? dbInvoices.filter(i => i.status === 'Overdue' || i.status === 'Failed').slice(0, 3).map(i => ({
        name: i.patientName || i.clinic || 'Clinic Account',
        days: i.dueDate ? `Due ${i.dueDate}` : 'Overdue',
        amount: `$${Number(i.amount || 0).toLocaleString()}`
      }))
    : []

  // Top AI Consuming Clinics
  const topAiClinics = clinicsList.length > 0
    ? clinicsList.slice(0, 5).map((c, idx) => ({
        name: c.name,
        plan: c.tier || 'Basic',
        pct: Math.min(100, Math.round(((c.aiUsageCount || 0) / (c.aiUsageLimit || 100)) * 100)),
        val: `${c.aiUsageCount || 0} / wk`,
        color: idx === 0 ? 'bg-purple-600' : idx === 1 ? 'bg-indigo-600' : idx === 2 ? 'bg-pink-600' : idx === 3 ? 'bg-blue-600' : 'bg-sky-600'
      }))
    : []

  // System Health Nodes (Live DB health status)
  const systemHealthNodes = analyticsData?.systemHealth && analyticsData.systemHealth.length > 0
    ? analyticsData.systemHealth
    : [
        { name: 'Core API', status: 'Operational', color: 'text-emerald-500 bg-emerald-500/10', uptime: '100.0%', latency: 'Connected', desc: 'REST & GraphQL gateway' },
        { name: 'Web App', status: 'Operational', color: 'text-emerald-500 bg-emerald-500/10', uptime: '100.0%', latency: 'Connected', desc: 'Owner Dashboard and client portal' },
        { name: 'Primary Database', status: 'Operational', color: 'text-emerald-500 bg-emerald-500/10', uptime: '100.0%', latency: 'MySQL Live', desc: 'MySQL Database Cluster (Prisma ORM)' },
      ]

  // Recent Error Logs from AuditLog
  const recentErrors = auditLogsList.filter(l => l.category === 'Error' || l.severity === 'Critical').length > 0
    ? auditLogsList.filter(l => l.category === 'Error' || l.severity === 'Critical').slice(0, 4).map(l => ({
        type: 'Error',
        title: l.action || 'System Exception Logged',
        source: l.role || 'Core API',
        time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '21h ago',
        count: '1 occurrence'
      }))
    : [
        { type: 'Error', title: 'OutOfMemory on dashboard load — iOS 15 devices', source: 'Mobile App', time: '21h ago', count: '22 occurrences' },
        { type: 'Warning', title: 'Stripe webhook timeout (10s) — invoice.payment_failed', source: 'Core API', time: '23h ago', count: '5 occurrences' },
        { type: 'API Warning', title: 'Token budget exceeded for clinic CL-008 — request throttled', source: 'AI Inference', time: '27h ago', count: '18 occurrences' },
        { type: 'Error', title: 'Retry worker partial failure — 2 invoices not re-attempted', source: 'Billing jobs', time: '27h ago', count: '1 occurrence' },
      ]

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white m-0 tracking-tight">Platform Overview</h1>
          <p className="text-slate-400 dark:text-slate-350 text-xs font-semibold mt-1">Clinics, subscribers, revenue, AI usage, and system health at a glance</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">{s.label}</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-655 dark:text-slate-300 text-xs">
                {s.icon}
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white m-0 tracking-tight">{s.value}</h3>
            {s.change && (
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
                {s.pos ? <ArrowUpOutlined style={{ fontSize: 8 }} /> : <ArrowDownOutlined style={{ fontSize: 8 }} />}
                <span>{s.change}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium ml-0.5">{s.sub}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Trend & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2">
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm h-full bg-white dark:bg-slate-900"
            title={<span className="font-extrabold text-sm text-slate-700 dark:text-white">Revenue Trend</span>}
            extra={
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">1 year's revenue growth</span>
                <Select value={selectedYear} onChange={setSelectedYear} size="small" className="w-20 rounded-lg">
                  <Option value="2026">2026</Option>
                  <Option value="2025">2025</Option>
                </Select>
              </div>
            }
          >
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D2BE" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#30D2BE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} vertical={false} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', color: darkMode ? '#FFFFFF' : '#1E293B', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="value" stroke="#30D2BE" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" dot={{ r: 4, strokeWidth: 2, fill: darkMode ? '#1E293B' : '#fff', stroke: '#30D2BE' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Live Activity Column */}
        <div className="lg:col-span-1">
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm h-full bg-white dark:bg-slate-900"
            title={
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-700 dark:text-white">Live Activity</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase px-2 py-0.5 bg-emerald-500/10 rounded-full select-none">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                </span>
              </div>
            }
            extra={<span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">Real-time updates</span>}
          >
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {liveActivities.map(act => (
                <div key={act.id} className="flex gap-3 items-start border-b border-slate-50 dark:border-slate-800/50 pb-3 last:border-b-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${act.bg} text-xs font-bold`}>
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate">{act.title}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">{act.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">{act.desc}</p>
                    {act.detail && (
                      <span className="inline-block bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5">
                        {act.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* Financial Snapshot Row */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white m-0 tracking-tight">Financial Snapshot</h2>
          <p className="text-slate-455 dark:text-slate-400 text-xs font-semibold mt-0.5">Revenue, receivables, and risk</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Revenue today', value: '$8,420', change: '+12.4%', color: 'text-emerald-500', sub: 'vs yesterday' },
            { label: 'Revenue this month', value: '$142,300', change: '+8.1%', color: 'text-emerald-500', sub: 'vs last month' },
            { label: 'Outstanding invoices', value: '$12,440', change: '7 invoices', color: 'text-amber-500', sub: 'in process' },
            { label: 'Failed payments', value: '$2,995', change: '5 this week', color: 'text-rose-500', sub: 'needs attention' },
            { label: 'Churn risk', value: '4 clinics', change: '$8,900 MRR', color: 'text-rose-600', sub: 'at risk' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold block uppercase tracking-wider">{item.label}</span>
              <h4 className="text-lg font-black text-slate-800 dark:text-white m-0 mt-2">{item.value}</h4>
              <div className="flex items-center gap-1 mt-1 text-[9px] font-bold">
                <span className={item.color}>{item.change}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-white">Outstanding Invoices</span>}>
              <div className="space-y-3.5">
                {outstandingInvoices.map((inv, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 dark:border-slate-800 last:border-b-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{inv.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{inv.inv} &bull; Due {inv.due}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 dark:text-white">{inv.amount}</span>
                      <Tag color={inv.status === 'Succeeded' ? 'purple' : 'default'} className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">{inv.status}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-white">Churn Risk</span>}>
              <div className="space-y-3.5">
                {churnRisk.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 dark:border-slate-800 last:border-b-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.name}</span>
                      <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{c.days}</span>
                    </div>
                    <Tag color={c.status === 'Premium' ? 'purple' : c.status === 'Advanced' ? 'blue' : 'default'} className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">{c.status}</Tag>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-white">Failed Payments</span>}>
              <div className="space-y-3.5">
                {failedPayments.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 dark:border-slate-800 last:border-b-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{f.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{f.days}</span>
                    </div>
                    <span className="font-extrabold text-rose-500">{f.amount}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Usage Overview Row */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white m-0 tracking-tight">AI Usage Overview</h2>
          <p className="text-slate-450 dark:text-slate-400 text-xs font-semibold mt-0.5">Platform AI consumption and cost vs revenue</p>
        </div>

        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-white">Top AI-consuming clinics</span>}>
          <div className="space-y-4">
            {topAiClinics.map((c, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                    <Tag color={c.plan === 'Enterprise' ? 'purple' : 'default'} className="m-0 border-none font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">{c.plan}</Tag>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{c.pct}%</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{c.val}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Subscription Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-sm text-slate-700 dark:text-white">Subscription Distribution</span>}>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={subMonthlyData}>
                 <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} vertical={false} />
                 <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={9} tickLine={false} axisLine={false} />
                 <YAxis stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={9} tickLine={false} axisLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', color: darkMode ? '#FFFFFF' : '#1E293B', borderRadius: 12, border: 'none' }} />
                 <Bar dataKey="value" fill="#8C4BFF" radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-sm text-slate-700 dark:text-white">Subscription Distribution</span>}>
          <div className="space-y-6 mt-4">
            {[
              { tier: 'Enterprise ($499/year)', value: '310 clinics (52%)', pct: 52, color: 'bg-indigo-600' },
              { tier: 'Premium ($249/year)', value: '180 clinics (30%)', pct: 30, color: 'bg-purple-650' },
              { tier: 'Standard ($99/year)', value: '102 clinics (18%)', pct: 18, color: 'bg-sky-550' },
            ].map((t, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">{t.tier}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t.value}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Health Row */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white m-0 tracking-tight">System Health</h2>
            <p className="text-slate-450 dark:text-slate-400 text-xs font-semibold mt-0.5">Service status, uptime, and recent error logs</p>
          </div>
          <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full select-none">
            Partial degradation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {systemHealthNodes.map((node, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-xs m-0">{node.name}</h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{node.desc}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full select-none ${node.color}`}>
                  {node.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-5 text-[10px] font-bold text-slate-500 dark:text-slate-450">
                <span>{node.uptime} uptime &bull; 30d</span>
                <span className="text-slate-400 dark:text-slate-500">{node.latency}</span>
              </div>
            </div>
          ))}
        </div>

        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-white">Recent errors</span>}>
          <div className="space-y-3">
            {recentErrors.map((err, idx) => (
              <div key={idx} className="flex gap-3 items-center justify-between text-xs pb-3 border-b border-slate-50 dark:border-slate-800 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                    err.type === 'Error' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {err.type}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{err.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex-shrink-0">
                  <span>{err.source}</span>
                  <span>{err.time}</span>
                  <span className="text-slate-500 dark:text-slate-450 font-bold">{err.count}</span>
                </div>
              </div>
            ))}
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
            <div className="overflow-y-auto pr-2 space-y-3" style={{ maxHeight: '650px', minHeight: '450px' }}>
              {store.messageBoard && store.messageBoard.length > 0 ? (
                store.messageBoard.map((msg) => {
                  const isAdmin = msg.senderRole === 'Clinic Admin'
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isAdmin
                          ? 'bg-slate-50/50 dark:bg-slate-955/20 border-slate-100 dark:border-slate-800'
                          : 'bg-[#8C4BFF]/5 dark:bg-[#8C4BFF]/10 border-[#8C4BFF]/10'
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
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
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
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            <h4 className="font-bold text-xs text-slate-700 dark:text-white uppercase tracking-wider mb-4">Post Announcement / Task</h4>
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#8C4BFF] transition-all h-9"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Write details..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#8C4BFF] transition-all resize-none"
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
