import React, { useState, useEffect } from 'react'
import { Card, Select, Button, Table, Tag, Tooltip as AntTooltip, Space } from 'antd'
import {
  RiseOutlined, TeamOutlined, CheckCircleOutlined, DollarOutlined,
  PercentageOutlined, ApartmentOutlined, DownloadOutlined, CalendarOutlined,
  ThunderboltOutlined, FileTextOutlined
} from '@ant-design/icons'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { useClinicStore } from '../../../../store/clinicStore'
import { toast } from 'react-hot-toast'

const { Option } = Select

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getMonthsWindow(count) {
  const now = new Date()
  const months = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    months.push({
      label: MONTHS_SHORT[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      startDate: d,
      endDate: endOfMonth
    })
  }
  return months
}

export default function SalesReports({ store: propStore }) {
  const localStore = useClinicStore()
  const store = propStore || localStore
  const { leads, clinics, salesTasks, salesCalendarEvents, darkMode } = store
  const [dateRange, setDateRange] = useState('6m')

  useEffect(() => {
    if (store.fetchLeads) store.fetchLeads()
    if (store.fetchSalesClinics) store.fetchSalesClinics()
    if (store.fetchSalesTasks) store.fetchSalesTasks()
    if (store.fetchSalesCalendarEvents) store.fetchSalesCalendarEvents()
  }, [])

  const getLoggedInSalesName = () => {
    if (store.user?.name) return store.user.name
    if (store.salesProfile?.name) return store.salesProfile.name
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName')
      if (storedName) return storedName
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed?.name) return parsed.name
        } catch (e) {}
      }
    }
    return store.userRole === 'sales' ? 'Sales Executive' : ''
  }

  const currentRepName = getLoggedInSalesName()

  const isMatchingRep = (salespersonField) => {
    if (!salespersonField) return true
    if (!currentRepName) return true
    const sp = salespersonField.toLowerCase().trim()
    const cur = currentRepName.toLowerCase().trim()
    return sp.includes(cur) || cur.includes(sp) || sp === 'unassigned' || sp === 'sales executive'
  }

  const repCommissionRate = (parseFloat(store.user?.profileData?.commissionRate || store.salesProfile?.commissionRate) || 12.0) / 100

  // Filter real DB data for logged-in rep
  const myLeads = (leads || []).filter(l => isMatchingRep(l.assignedTo || l.salesperson))
  const myClinics = (clinics || []).filter(c => isMatchingRep(c.salesperson))
  const myCalendarEvents = (salesCalendarEvents || [])

  // Converted clinics list = DB clinics + converted leads
  const dbClinicsFormatted = myClinics.map(c => ({
    id: c.id,
    name: c.name,
    tier: c.tier || 'Basic',
    revenue: parseFloat(c.revenue) || 100,
    status: c.status || 'Active',
    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    salesperson: c.salesperson || currentRepName,
    signupDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'
  }))

  const convertedLeadsFormatted = myLeads
    .filter(l => l.stage === 'Converted' || l.status === 'Converted')
    .map(l => ({
      id: l.id,
      name: l.name || l.companyName,
      tier: l.tier || 'Basic',
      revenue: parseFloat(l.value) || 100,
      status: 'Active',
      createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
      salesperson: l.assignedTo || currentRepName,
      signupDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent'
    }))

  const leadIds = new Set(convertedLeadsFormatted.map(l => l.id))
  const filteredDbClinics = dbClinicsFormatted.filter(c => !leadIds.has(c.id))
  const allConvertedClinics = [...filteredDbClinics, ...convertedLeadsFormatted]

  // Time window calculations
  const monthCount = dateRange === '3m' ? 3 : dateRange === '1y' ? 12 : 6
  const monthsWindow = getMonthsWindow(monthCount)

  // Build dynamic monthly data from real DB records
  const monthlyData = monthsWindow.map(({ label, year, month, endDate }) => {
    // Active clinics created up to this month → MRR (Monthly Recurring Revenue)
    const activeClinicsInMonth = allConvertedClinics.filter(c => {
      const createdDate = c.createdAt ? new Date(c.createdAt) : new Date(0)
      return createdDate <= endDate
    })

    const monthlyMRR = activeClinicsInMonth.reduce((s, c) => s + (parseFloat(c.revenue) || 0), 0)

    // Leads created in this specific month
    const monthLeads = myLeads.filter(l => {
      if (!l.createdAt) return true
      const d = new Date(l.createdAt)
      return d.getFullYear() === year && d.getMonth() === month
    })

    // Demos scheduled or completed in this month
    const monthDemos = myCalendarEvents.filter(e => {
      if (!e.date) return false
      const d = new Date(e.date)
      return d.getFullYear() === year && d.getMonth() === month && (e.type === 'Demos' || e.type === 'Demo Scheduled' || e.type === 'Demo')
    }).length

    return {
      name: label,
      revenue: monthlyMRR,
      commissions: monthlyMRR * repCommissionRate,
      leads: monthLeads.length,
      demos: monthDemos,
    }
  })

  // KPI computations — 100% from live DB data
  const totalLeadsCount = myLeads.length
  const convertedCount = myLeads.filter(l => l.stage === 'Converted' || l.status === 'Converted').length
  const conversionRate = totalLeadsCount > 0 ? Math.round((convertedCount / totalLeadsCount) * 100) : 0
  const demosCompleted = myCalendarEvents.filter(e => e.type === 'Demos' || e.type === 'Demo Scheduled' || e.type === 'Demo').length
  
  const currentMrr = allConvertedClinics.reduce((s, c) => s + (parseFloat(c.revenue) || 0), 0)
  const currentCommission = currentMrr * repCommissionRate
  const activeClinicsCount = allConvertedClinics.length

  // Lead Funnel Distribution — live from DB
  const stageData = [
    { name: 'New Lead', count: myLeads.filter(l => l.stage === 'New Lead' || l.status === 'New').length },
    { name: 'Discovery', count: myLeads.filter(l => l.stage === 'Discovery Call').length },
    { name: 'Demo', count: myLeads.filter(l => l.stage === 'Demo Scheduled').length },
    { name: 'Proposal', count: myLeads.filter(l => l.stage === 'Proposal Sent').length },
    { name: 'Negotiation', count: myLeads.filter(l => l.stage === 'Negotiating').length },
    { name: 'Trial', count: myLeads.filter(l => l.stage === 'Trial Started').length },
    { name: 'Converted', count: convertedCount },
  ]

  // Tasks Summary — live from DB
  const pendingTasks = (salesTasks || []).filter(t => t.status !== 'Completed')
  const completedTasks = (salesTasks || []).filter(t => t.status === 'Completed')
  const totalTasks = (salesTasks || []).length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  // Tier Breakdown — live from all converted clinics
  const tierData = [
    { name: 'Basic', value: allConvertedClinics.filter(c => c.tier === 'Basic').length, color: '#3B82F6' },
    { name: 'Pro', value: allConvertedClinics.filter(c => c.tier === 'Pro').length, color: '#F59E0B' },
    { name: 'Enterprise', value: allConvertedClinics.filter(c => c.tier === 'Enterprise').length, color: '#8C4BFF' },
  ].filter(d => d.value > 0)

  const summaryStats = [
    { label: 'Leads Generated', value: totalLeadsCount, color: '#3B82F6', icon: <TeamOutlined />, sub: 'total registered' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, color: '#10B981', icon: <RiseOutlined />, sub: `${convertedCount} deals won` },
    { label: 'Demos Completed', value: demosCompleted, color: '#F59E0B', icon: <CheckCircleOutlined />, sub: 'scheduled meetings' },
    { label: 'Revenue Generated', value: `$${currentMrr.toLocaleString()}`, color: '#8C4BFF', icon: <DollarOutlined />, sub: 'monthly MRR' },
    { label: 'Commission Earned', value: `$${Math.round(currentCommission).toLocaleString()}`, color: '#EC4899', icon: <PercentageOutlined />, sub: `${Math.round(repCommissionRate * 100)}% rate` },
    { label: 'Clinics Onboarded', value: activeClinicsCount, color: '#06B6D4', icon: <ApartmentOutlined />, sub: 'active practices' },
  ]

  // CSV Export Functionality (Blob + UTF-8 BOM for Excel compatibility)
  const handleExportCSV = () => {
    try {
      const rows = []
      rows.push(['Sales Executive Performance Report'])
      rows.push(['Representative', currentRepName || 'Sales Executive'])
      rows.push(['Generated On', new Date().toLocaleDateString()])
      rows.push([])

      rows.push(['SUMMARY METRICS'])
      rows.push(['Metric', 'Value'])
      summaryStats.forEach(s => {
        rows.push([s.label, s.value])
      })
      rows.push([])

      rows.push(['MONTHLY PERFORMANCE BREAKDOWN'])
      rows.push(['Month', 'MRR ($)', 'Commission ($)', 'New Leads', 'Demos'])
      monthlyData.forEach(m => {
        rows.push([m.name, m.revenue, Math.round(m.commissions), m.leads, m.demos])
      })
      rows.push([])

      rows.push(['CONVERTED CLINIC ACCOUNTS'])
      rows.push(['Clinic Name', 'Tier', 'Monthly MRR ($)', 'Commission ($)', 'Signup Date'])
      allConvertedClinics.forEach(c => {
        rows.push([c.name, c.tier, c.revenue, (parseFloat(c.revenue) * repCommissionRate).toFixed(2), c.signupDate])
      })

      const csvString = rows.map(r => r.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
      
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Sales Analytics Report exported successfully!')
    } catch (err) {
      console.error('Export CSV error:', err)
      toast.error('Failed to export CSV report')
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8C4BFF] block mb-1">
            Real Database Analytics &bull; {currentRepName || 'Sales Executive'}
          </span>
          <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Performance Analytics Reports</h2>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
            Live database breakdown of leads, conversion rates, MRR revenue, and commission attributions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onChange={setDateRange} className="rounded-xl min-w-[130px]">
            <Option value="3m">Last 3 Months</Option>
            <Option value="6m">Last 6 Months</Option>
            <Option value="1y">Last 12 Months</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold text-xs h-9 px-4 text-white"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryStats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-black tracking-wider">{s.label}</span>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: s.color + '18', color: s.color }}>{s.icon}</div>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white m-0">{s.value}</h3>
            <span className="text-slate-400 text-[9px] font-semibold block mt-1">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1: MRR & Commission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MRR Chart */}
        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
          title={
            <div>
              <span className="font-bold text-slate-800 dark:text-white text-xs block">Monthly Recurring Revenue (MRR)</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Value of active signed clinic subscriptions in MySQL DB</span>
            </div>
          }>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8C4BFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8C4BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'MRR']} />
                <Area type="monotone" dataKey="revenue" stroke="#8C4BFF" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Commission Chart */}
        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
          title={
            <div>
              <span className="font-bold text-slate-800 dark:text-white text-xs block">Commission Earned</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Monthly commission payouts at {Math.round(repCommissionRate * 100)}% rate</span>
            </div>
          }>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(value) => [`$${Math.round(value).toLocaleString()}`, 'Commission']} />
                <Area type="monotone" dataKey="commissions" stroke="#EC4899" fillOpacity={1} fill="url(#colorComm)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Funnel & Leads Acquired */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lead Funnel */}
        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
          title={
            <div>
              <span className="font-bold text-slate-800 dark:text-white text-xs block">Lead Funnel Distribution</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Live prospects in each pipeline stage</span>
            </div>
          }>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={8} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Deals']} />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leads Generated per Month */}
        <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
          title={
            <div>
              <span className="font-bold text-slate-800 dark:text-white text-xs block">Leads Acquired Over Time</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">New leads registered per month</span>
            </div>
          }>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Leads']} />
                <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: Converted Clinics Table & Tier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Converted Clinics Table (2 cols) */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
          title={<span className="font-bold text-slate-800 dark:text-white text-xs">Converted Clinic Accounts & MRR</span>}>
          <Table
            dataSource={allConvertedClinics}
            rowKey="id"
            pagination={{ pageSize: 5, showSizeChanger: false }}
            scroll={{ x: 600 }}
            locale={{ emptyText: <span className="text-slate-400 text-xs">No converted clinics recorded in database yet.</span> }}
            columns={[
              {
                title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinic Name</span>,
                dataIndex: 'name',
                render: name => <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">{name}</span>
              },
              {
                title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</span>,
                dataIndex: 'tier',
                render: tier => (
                  <Tag color={tier === 'Enterprise' ? 'purple' : tier === 'Pro' ? 'orange' : 'blue'} className="rounded-full border-none font-bold text-[8px] px-2.5">
                    {tier}
                  </Tag>
                )
              },
              {
                title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly MRR</span>,
                dataIndex: 'revenue',
                render: rev => <span className="font-extrabold text-[#8C4BFF] text-xs">${rev}/mo</span>
              },
              {
                title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission ({Math.round(repCommissionRate * 100)}%)</span>,
                dataIndex: 'revenue',
                key: 'commission',
                render: rev => <span className="font-extrabold text-emerald-500 text-xs">${(rev * repCommissionRate).toFixed(2)}/mo</span>
              },
              {
                title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signup Date</span>,
                dataIndex: 'signupDate',
                render: d => <span className="text-slate-400 font-semibold text-xs">{d}</span>
              }
            ]}
          />
        </Card>

        {/* Tier Breakdown & Tasks Summary (1 col) */}
        <div className="space-y-6">

          {/* Tier Breakdown */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
            title={<span className="font-bold text-slate-800 dark:text-white text-xs">Subscription Tier Distribution</span>}>
            {tierData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tierData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {tierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value + ' clinics', name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {tierData.map(d => (
                    <div key={d.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{d.name} Plan</span>
                      </div>
                      <span className="font-extrabold text-xs" style={{ color: d.color }}>{d.value} clinic{d.value !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">No tier breakdown data available yet.</div>
            )}
          </Card>

          {/* Tasks Performance Summary */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
            title={<span className="font-bold text-slate-800 dark:text-white text-xs">Tasks Completion Metric</span>}>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Total Tasks Assigned</span>
                <span className="font-bold text-slate-800 dark:text-white">{totalTasks}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Completed Tasks</span>
                <span className="font-bold text-emerald-500">{completedTasks.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Pending Follow-ups</span>
                <span className="font-bold text-amber-500">{pendingTasks.length}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200">Completion Rate</span>
                <span className="font-extrabold text-sm text-[#8C4BFF]">{taskCompletionRate}%</span>
              </div>
            </div>
          </Card>

        </div>
      </div>

    </div>
  )
}
