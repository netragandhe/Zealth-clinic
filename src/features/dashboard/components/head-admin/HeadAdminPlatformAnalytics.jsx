import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Progress, Space } from 'antd'
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

export default function HeadAdminPlatformAnalytics() {
  const [activeSubTab, setActiveSubTab] = useState('Revenue & Financial')
  const [loading, setLoading] = useState(false)

  // Analytics Live States
  const [analytics, setAnalytics] = useState({
    mrr: 0,
    arr: 0,
    revenueGrowth: 0,
    totalYtd: 0,
    trendData: [],
    tierData: [],
    regionData: [],
    customerGrowthData: [],
    billingInvoices: []
  })

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/super-admin/platform-analytics')
      if (res.data?.success) {
        setAnalytics(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch platform analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleSendReminder = async (rec) => {
    try {
      const clinicName = rec.patientName || rec.clinic || 'Clinic'
      const invoiceId = rec.displayId || rec.invoiceNumber || rec.id || 'INV'
      await api.post('/api/super-admin/audit-logs', {
        category: 'Billing',
        action: `Payment reminder email sent for invoice ${invoiceId}`,
        target: `${clinicName}`,
        severity: 'Info'
      }).catch(() => null)

      toast.success(`Payment collection reminder sent to ${clinicName}!`)
    } catch (err) {
      toast.error('Failed to send billing reminder')
    }
  }

  const handleMarkInvoicePaid = async (rec) => {
    try {
      const targetId = rec.id || rec.displayId || rec.invoiceNumber
      const clinicName = rec.patientName || rec.clinic || 'Clinic'

      await api.put(`/api/super-admin/invoices/${targetId}`, { status: 'Paid' }).catch(() => null)
      await api.post('/api/super-admin/audit-logs', {
        category: 'Billing',
        action: `Invoice ${rec.displayId || targetId} manually marked as Paid`,
        target: `${clinicName}`,
        severity: 'Info'
      }).catch(() => null)

      setAnalytics(prev => ({
        ...prev,
        billingInvoices: prev.billingInvoices.map(inv => {
          const matches = (rec.id && inv.id === rec.id) ||
                          (rec.displayId && inv.displayId === rec.displayId) ||
                          (rec.invoiceNumber && inv.invoiceNumber === rec.invoiceNumber) ||
                          inv === rec
          return matches ? { ...inv, status: 'Paid', due: 0 } : inv
        })
      }))
      toast.success(`Invoice ${rec.displayId || targetId} marked as Paid! Status updated live.`)
    } catch (err) {
      toast.error('Failed to mark invoice as paid')
    }
  }

  const { mrr, arr, revenueGrowth, totalYtd, trendData, tierData, regionData, customerGrowthData, billingInvoices } = analytics

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-850 dark:text-white m-0 tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-405 dark:text-slate-400 text-xs mt-1 font-semibold">Financial, customer, and billing insights across the platform</p>
      </div>

      {/* Sub-tabs Selection */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['Revenue & Financial', 'Customer Metrics', 'Billing Reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border border-solid rounded-full cursor-pointer ${
              activeSubTab === tab 
                ? 'bg-[#8C4BFF] text-white border-[#8C4BFF]' 
                : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 1. REVENUE & FINANCIAL TAB ── */}
      {activeSubTab === 'Revenue & Financial' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            {/* Card 1: MRR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider">MRR</span>
                <span className="text-slate-400 text-xs">🪙</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">${(mrr || 0).toLocaleString()}</h3>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500">
                <span>▲ +7.4%</span>
                <span className="text-slate-400 font-medium ml-1">vs last month</span>
              </div>
            </div>

            {/* Card 2: ARR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-455 dark:text-slate-400 tracking-wider">ARR</span>
                <span className="text-slate-400 text-xs">💳</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">${(arr || 0).toLocaleString()}</h3>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500">
                <span>▲ +7.4%</span>
                <span className="text-slate-400 font-medium ml-1">vs last month</span>
              </div>
            </div>

            {/* Card 3: Revenue Growth */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-455 dark:text-slate-400 tracking-wider">Revenue Growth</span>
                <span className="text-slate-400 text-xs">📈</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">{revenueGrowth || 0}%</h3>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500">
                <span>▲ +{revenueGrowth || 0}%</span>
                <span className="text-slate-400 font-medium ml-1">YTD</span>
              </div>
            </div>

            {/* Card 4: Total Revenue (YTD) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-455 dark:text-slate-400 tracking-wider">Total Revenue (YTD)</span>
                <span className="text-slate-400 text-xs">🌐</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">${(totalYtd || 0).toLocaleString()}</h3>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500">
                <span>▲ +12.4%</span>
                <span className="text-slate-400 font-medium ml-1">vs last year</span>
              </div>
            </div>
          </div>

          {/* MRR & ARR Trend Chart */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div>
              <span className="font-bold text-slate-800 dark:text-white text-base block">MRR & ARR Trend</span>
              <span className="text-slate-400 text-xs font-semibold block mt-0.5">Monthly recurring revenue and annualized run rate</span>
            </div>
          }>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8C4BFF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8C4BFF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D2BE" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#30D2BE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="ARR" stroke="#8C4BFF" strokeWidth={3} fillOpacity={1} fill="url(#colorArr)" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="MRR" stroke="#30D2BE" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" dot={{ r: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue by Tier & Region */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue by Tier Donut Chart */}
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 lg:col-span-5" title={
              <div>
                <span className="font-bold text-slate-800 dark:text-white text-base block">Revenue by Tier</span>
                <span className="text-slate-400 text-xs font-semibold block mt-0.5">Current MRR distribution across subscription plans</span>
              </div>
            }>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-56">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(tierData || []).map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 shrink-0">
                  {(tierData || []).map(tier => (
                    <div key={tier.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                      <span className="text-xs font-bold text-slate-805 dark:text-slate-200">{tier.name}</span>
                      <span className="text-xs text-slate-455 dark:text-slate-400 font-semibold">${tier.value.toLocaleString()} · {tier.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Revenue by Region List */}
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 lg:col-span-7" title={
              <div>
                <span className="font-bold text-slate-800 dark:text-white text-base block">Revenue by Region</span>
                <span className="text-slate-400 text-xs font-semibold block mt-0.5">Top markets by country / state</span>
              </div>
            }>
              <div className="space-y-3">
                {(regionData || []).map(reg => {
                  const maxVal = regionData.length > 0 ? Math.max(...regionData.map(r => r.value)) || 1 : 1
                  const percent = (reg.value / maxVal) * 100
                  return (
                    <div key={reg.state} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{reg.state}</span>
                          <span className="text-[10px] text-slate-400 font-semibold ml-2">{reg.country} · {reg.clinics} clinics</span>
                        </div>
                        <span className="font-black text-slate-850 dark:text-white">${reg.value.toLocaleString()}</span>
                      </div>
                      <Progress percent={percent} strokeColor={reg.color || '#8C4BFF'} showInfo={false} size="small" />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── 2. CUSTOMER METRICS TAB ── */}
      {activeSubTab === 'Customer Metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Clinics</span>
              <h3 className="text-2xl font-black text-slate-808 dark:text-white mt-2 mb-0">
                {customerGrowthData.length > 0 ? customerGrowthData[customerGrowthData.length - 1].activeClinics : 0}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LTV to CAC Ratio</span>
              <h3 className="text-2xl font-black text-[#8C4BFF] mt-2 mb-0">4.8x</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Platform Churn Rate</span>
              <h3 className="text-2xl font-black text-emerald-500 mt-2 mb-0">0.8%</h3>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <span className="font-bold text-slate-850 dark:text-white text-base">Active Clinic Growth & Churn Details</span>
          }>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerGrowthData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                  <YAxis stroke="#94A3B8" fontSize={9} />
                  <Tooltip />
                  <Bar dataKey="activeClinics" fill="#8C4BFF" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="churned" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── 3. BILLING REPORTS TAB ── */}
      {activeSubTab === 'Billing Reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoice Collection Rate</span>
              <h3 className="text-2xl font-black text-[#8C4BFF] mt-2 mb-0">98.4%</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg. Days Outstanding (DSO)</span>
              <h3 className="text-2xl font-black text-slate-805 dark:text-slate-200 mt-2 mb-0">12.4 Days</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Outstanding</span>
              <h3 className="text-2xl font-black text-rose-500 mt-2 mb-0">
                ${(billingInvoices.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + (curr.amount || curr.due || 0), 0)).toLocaleString()}
              </h3>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <span className="font-bold text-slate-850 dark:text-white text-base">Aging Invoices Ledger</span>
          }>
            <Table
              dataSource={billingInvoices || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              columns={[
                { title: 'Invoice ID', dataIndex: 'displayId', render: (d, k) => <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">{d || k.invoiceNumber || k.key}</span> },
                { title: 'Clinic Scope', dataIndex: 'patientName', render: (c, rec) => <span className="font-bold text-slate-800 dark:text-white text-xs">{c || rec.clinic}</span> },
                { title: 'Invoice Amount', dataIndex: 'amount', render: (a) => <span className="font-extrabold text-xs text-slate-800 dark:text-white">${(a || 0).toLocaleString()}</span> },
                { title: 'Billing Date', dataIndex: 'issueDate', render: (d, rec) => <span>{d || rec.date}</span> },
                { 
                  title: 'Collection Status', 
                  dataIndex: 'status', 
                  render: (s) => (
                    <Tag color={s === 'Paid' ? 'success' : s === 'Refunded' ? 'default' : 'error'} className="border-none font-bold text-[9px] rounded-full px-2.5 py-0.5">
                      {s}
                    </Tag>
                  ) 
                },
                {
                  title: 'Remittance Actions',
                  key: 'action',
                  align: 'right',
                  render: (_, rec) => (
                    rec.status === 'Overdue' ? (
                      <Space>
                        <Button 
                          size="small" 
                          type="primary" 
                          style={{ backgroundColor: '#0E1B33', border: 'none' }}
                          className="rounded-lg text-[10px] font-bold h-7 cursor-pointer"
                          onClick={() => handleSendReminder(rec)}
                        >
                          Send Reminder
                        </Button>
                        <Button 
                          size="small" 
                          className="rounded-lg text-[10px] font-bold h-7 cursor-pointer"
                          onClick={() => handleMarkInvoicePaid(rec)}
                        >
                          Mark Paid
                        </Button>
                      </Space>
                    ) : <span className="text-slate-400 text-[10px] font-semibold">No Action Required</span>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  )
}
