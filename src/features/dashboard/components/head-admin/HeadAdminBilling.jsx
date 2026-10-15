import React, { useState } from 'react'
import { Card, Table, Tag, Button, Input, Select, Progress, Modal } from 'antd'
import {
  FileTextOutlined,
  LineChartOutlined,
  PieChartOutlined,
  WarningOutlined,
  UndoOutlined,
  DatabaseOutlined,
  SearchOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  HeartOutlined,
  AimOutlined,
  BankOutlined
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts'
import { toast } from 'react-hot-toast'

import { API_BASE_URL } from '@/api/axios'

const { Option } = Select

export default function HeadAdminBilling() {
  const [activeTab, setActiveTab] = useState('Revenue Metrics')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceIssueDate, setInvoiceIssueDate] = useState('all')
  const [invoiceStatus, setInvoiceStatus] = useState('all')
  const [invoiceDateline, setInvoiceDateline] = useState('all')

  const [liveMetrics, setLiveMetrics] = useState({
    mrr: 52400,
    arr: 628800,
    revenueGrowth: 183.2,
    totalYtd: 422000
  })

  const [subscriptionInvoicesList, setSubscriptionInvoicesList] = useState([])

  const backendFetch = async (endpoint, options = {}) => {
    const mainBase = API_BASE_URL
    try {
      const res = await fetch(`${mainBase}/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          ...(options.headers || {}),
        },
      })
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {}

    const defaultPorts = [5001, 8001, 8002, 8003, 5000]
    const PORTS = window._activeBackendPort ? [window._activeBackendPort, ...defaultPorts.filter(p => p !== window._activeBackendPort)] : defaultPorts

    for (const port of PORTS) {
      try {
        const res = await fetch(`http://localhost:${port}/api${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
            ...(options.headers || {}),
          },
        })
        if (res.ok) {
          window._activeBackendPort = port
          return await res.json()
        }
      } catch (e) {
        if (window._activeBackendPort === port) {
          window._activeBackendPort = null
        }
      }
    }
    return null
  }

  const fetchLiveBillingOverview = async () => {
    const json = await backendFetch('/super-admin/billing/overview')
    if (json && json.success && json.data) {
      setLiveMetrics({
        mrr: json.data.mrr || 52400,
        arr: json.data.arr || 628800,
        revenueGrowth: json.data.revenueGrowth || 183.2,
        totalYtd: json.data.totalYtd || 422000
      })
      if (Array.isArray(json.data.subscriptionInvoices) && json.data.subscriptionInvoices.length > 0) {
        setSubscriptionInvoicesList(json.data.subscriptionInvoices)
      }
    }
  }

  React.useEffect(() => {
    fetchLiveBillingOverview()
  }, [])

  const revenueTrendData = [
    { name: 'Jan', MRR: 20000, ARR: 240000 },
    { name: 'Feb', MRR: 23000, ARR: 276000 },
    { name: 'Mar', MRR: 21000, ARR: 252000 },
    { name: 'Apr', MRR: 29000, ARR: 348000 },
    { name: 'May', MRR: 32000, ARR: 384000 },
    { name: 'Jun', MRR: 35000, ARR: 420000 },
    { name: 'Jul', MRR: 38000, ARR: 456000 },
    { name: 'Aug', MRR: 42000, ARR: 504000 },
    { name: 'Sep', MRR: 45000, ARR: 540000 },
    { name: 'Oct', MRR: 48000, ARR: 576000 },
    { name: 'Nov', MRR: 50000, ARR: 600000 },
    { name: 'Dec', MRR: 52400, ARR: 628800 }
  ]

  const regionData = [
    { region: 'California', desc: 'USA · 28 clinics', value: 14200, pct: 85, color: '#30D2BE' },
    { region: 'Texas', desc: 'USA · 19 clinics', value: 9800, pct: 60, color: '#30D2BE' },
    { region: 'New York', desc: 'USA · 17 clinics', value: 8600, pct: 52, color: '#30D2BE' },
    { region: 'Florida', desc: 'USA · 14 clinics', value: 6900, pct: 42, color: '#30D2BE' },
    { region: 'Ontario', desc: 'Canada · 11 clinics', value: 5400, pct: 32, color: '#30D2BE' },
    { region: 'Greater London', desc: 'UK · 9 clinics', value: 4700, pct: 28, color: '#30D2BE' },
    { region: 'New South Wales', desc: 'Australia · 7 clinics', value: 2800, pct: 18, color: '#30D2BE' }
  ]

  const churnTrendData = [
    { name: 'Jan', value: 3.3 },
    { name: 'Feb', value: 3.1 },
    { name: 'Mar', value: 2.9 },
    { name: 'Apr', value: 2.8 },
    { name: 'May', value: 2.6 },
    { name: 'Jun', value: 2.4 },
    { name: 'Jul', value: 2.2 },
    { name: 'Aug', value: 2.1 },
    { name: 'Sep', value: 2.0 },
    { name: 'Oct', value: 1.8 },
    { name: 'Nov', value: 1.7 },
    { name: 'Dec', value: 1.62 }
  ]

  const ltvCacData = [
    { name: 'Jan', LTV: 4200, CAC: 540 },
    { name: 'Feb', LTV: 4350, CAC: 535 },
    { name: 'Mar', LTV: 4500, CAC: 530 },
    { name: 'Apr', LTV: 4650, CAC: 528 },
    { name: 'May', LTV: 4800, CAC: 525 },
    { name: 'Jun', LTV: 4950, CAC: 523 },
    { name: 'Jul', LTV: 5100, CAC: 522 },
    { name: 'Aug', LTV: 5300, CAC: 521 },
    { name: 'Sep', LTV: 5500, CAC: 522 },
    { name: 'Oct', LTV: 5700, CAC: 520 },
    { name: 'Nov', LTV: 5900, CAC: 522 },
    { name: 'Dec', LTV: 6180, CAC: 522 }
  ]

  const arpcTrendData = [
    { name: 'Jan', value: 375 },
    { name: 'Feb', value: 388 },
    { name: 'Mar', value: 398 },
    { name: 'Apr', value: 412 },
    { name: 'May', value: 425 },
    { name: 'Jun', value: 438 },
    { name: 'Jul', value: 452 },
    { name: 'Aug', value: 468 },
    { name: 'Sep', value: 485 },
    { name: 'Oct', value: 502 },
    { name: 'Nov', value: 518 },
    { name: 'Dec', value: 534 }
  ]

  const failedPaymentsData = [
    { key: '1', id: 'FP-10421', clinic: 'Bayview Family Clinic', amount: '$499', reason: 'Insufficient funds', attempts: 2, attempted: 'May 12, 2026', status: 'Retrying' },
    { key: '2', id: 'FP-10422', clinic: 'Northside Dental', amount: '$199', reason: 'Card expired', attempts: 3, attempted: 'May 11, 2026', status: 'Failed' },
    { key: '3', id: 'FP-10423', clinic: 'Sunrise Pediatrics', amount: '$299', reason: 'Bank decline', attempts: 1, attempted: 'May 10, 2026', status: 'Retrying' },
    { key: '4', id: 'FP-10424', clinic: 'Westend Wellness', amount: '$899', reason: 'Authentication required', attempts: 2, attempted: 'May 09, 2026', status: 'Recovered' },
    { key: '5', id: 'FP-10425', clinic: 'Hillcrest Vision', amount: '$149', reason: 'Insufficient funds', attempts: 3, attempted: 'May 08, 2026', status: 'Failed' }
  ]

  const outstandingInvoicesData = [
    { key: '1', invoice: 'INV-20821', clinic: 'Lakeside Medical', amount: '$1,299', due: 'May 01, 2026', overdue: '13d', status: 'Overdue' },
    { key: '2', invoice: 'INV-20822', clinic: 'Brookline Orthodontics', amount: '$599', due: 'May 10, 2026', overdue: '4d', status: 'Overdue' },
    { key: '3', invoice: 'INV-20823', clinic: 'Greenfield Health', amount: '$899', due: 'May 20, 2026', overdue: '—', status: 'Sent' },
    { key: '4', invoice: 'INV-20824', clinic: 'Pinecrest Physiotherapy', amount: '$349', due: 'May 22, 2026', overdue: '—', status: 'Pending' },
    { key: '5', invoice: 'INV-20825', clinic: 'Riverstone Cardiology', amount: '$1,899', due: 'Apr 28, 2026', overdue: '16d', status: 'Overdue' }
  ]

  const refundTrackingData = [
    { key: '1', id: 'RF-50021', clinic: 'Maplewood Dermatology', amount: '$199', reason: 'Duplicate charge', date: 'May 12, 2026', status: 'Processed' },
    { key: '2', id: 'RF-50022', clinic: 'Cedar Hill Clinic', amount: '$499', reason: 'Plan downgrade', date: 'May 09, 2026', status: 'Processed' },
    { key: '3', id: 'RF-50023', clinic: 'Harborview ENT', amount: '$89', reason: 'Service issue', date: 'May 07, 2026', status: 'Pending' },
    { key: '4', id: 'RF-50024', clinic: 'Summit Sports Medicine', amount: '$299', reason: 'Trial refund', date: 'May 05, 2026', status: 'Processed' },
    { key: '5', id: 'RF-50025', clinic: 'Glenwood Family Health', amount: '$149', reason: 'Billing error', date: 'May 03, 2026', status: 'Rejected' }
  ]

  const transactionLogsData = [
    { key: '1', id: 'TX-91102', clinic: 'Bayview Family Clinic', type: 'Subscription', method: 'Card', amount: '$499', date: 'May 13, 2026', status: 'Paid' },
    { key: '2', id: 'TX-91103', clinic: 'Northside Dental', type: 'Subscription', method: 'Card', amount: '$199', date: 'May 13, 2026', status: 'Failed' },
    { key: '3', id: 'TX-91104', clinic: 'Maplewood Dermatology', type: 'Refund', method: 'Card', amount: '$199', date: 'May 12, 2026', status: 'Refunded' },
    { key: '4', id: 'TX-91105', clinic: 'Greenfield Health', type: 'One-time', method: 'ACH', amount: '$89', date: 'May 12, 2026', status: 'Paid' },
    { key: '5', id: 'TX-91106', clinic: 'Sunrise Pediatrics', type: 'Subscription', method: 'Card', amount: '$299', date: 'May 11, 2026', status: 'Pending' },
    { key: '6', id: 'TX-91107', clinic: 'Riverstone Cardiology', type: 'Subscription', method: 'Wire', amount: '$1,899', date: 'May 11, 2026', status: 'Paid' },
    { key: '7', id: 'TX-91108', clinic: 'Cedar Hill Clinic', type: 'Refund', method: 'Card', amount: '$499', date: 'May 09, 2026', status: 'Refunded' },
    { key: '8', id: 'TX-91109', clinic: 'Westend Wellness', type: 'Subscription', method: 'Card', amount: '$899', date: 'May 09, 2026', status: 'Paid' }
  ]

  const subscriptionInvoicesData = subscriptionInvoicesList.length > 0 ? subscriptionInvoicesList : [
    { id: '1', key: '1', regId: '#265801', pacId: '326801d', username: 'Zoya Clinic', contact: '+61 2000 1000', email: 'clinic1.demo@mail.com', pkg: 'N/A', price: '$500', issueDate: '1 Jan 2026', dateline: '31 Dec 2026' },
    { id: '2', key: '2', regId: '#265802', pacId: '326802d', username: 'Bright Smile Dental', contact: '+61 2001 1001', email: 'clinic2.demo@mail.com', pkg: 'Basic/y', price: '$750', issueDate: '2 Feb 2026', dateline: '5 Mar 2026' },
    { id: '3', key: '3', regId: '#265803', pacId: '326803d', username: 'Harbor Wellness', contact: '+61 2002 1002', email: 'clinic3.demo@mail.com', pkg: 'Premium/y', price: '$1000', issueDate: '3 Mar 2026', dateline: '4 Apr 2026' },
  ]

  const [viewInvoiceModalRecord, setViewInvoiceModalRecord] = useState(null)

  const handleDownloadInvoicePdf = (record) => {
    if (!record) return
    const invoiceContent = `
==================================================
           ZEALTHOS SUBSCRIPTION INVOICE          
==================================================
Invoice Reg ID: ${record.regId || 'CLN-000001'}
Package ID:    ${record.pacId || '326801d'}
Clinic Name:   ${record.username || 'Clinic'}
Email:         ${record.email || 'N/A'}
Contact:       ${record.contact || 'N/A'}
Package Tier:  ${record.pkg || 'Enterprise'}
Billing Price: ${record.price || '$1000'}
Issue Date:    ${record.issueDate || '31 Jul 2026'}
Dateline:      ${record.dateline || '31 Dec 2026'}
Payment Status: ${record.status || 'Active / Paid'}
==================================================
Thank you for subscribing to ZealthOS Platform!
==================================================
`
    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Invoice_${record.regId || 'Subscription'}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Invoice ${record.regId} downloaded successfully!`)
  }

  const handleDeleteInvoice = async (record) => {
    if (record && record.id) {
      await backendFetch(`/super-admin/billing/invoices/${record.id}`, {
        method: 'DELETE'
      })
    }
    toast.success(`Subscription invoice ${record.regId || ''} deleted from database!`)
    fetchLiveBillingOverview()
  }

  const filteredInvoices = subscriptionInvoicesData.filter(item => {
    const matchesSearch = 
      item.username.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      item.email.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      item.regId.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      item.pacId.toLowerCase().includes(invoiceSearch.toLowerCase())
    
    const matchesStatus = invoiceStatus === 'all' || (
      invoiceStatus === 'Basic' && item.pkg.startsWith('Basic')
    ) || (
      invoiceStatus === 'Premium' && item.pkg.startsWith('Premium')
    ) || (
      invoiceStatus === 'N/A' && item.pkg === 'N/A'
    ) || (
      invoiceStatus === 'Free Trial' && item.pkg === 'Free Trial'
    )

    const matchesIssueDate = invoiceIssueDate === 'all' || item.issueDate.includes(invoiceIssueDate)
    const matchesDateline = invoiceDateline === 'all' || item.dateline.includes(invoiceDateline)

    return matchesSearch && matchesStatus && matchesIssueDate && matchesDateline
  })

  return (
    <div className="space-y-6">
      
      {/* ── Title Header ── */}
      <div>
        <h1 className="text-xl font-bold text-slate-805 dark:text-slate-200 m-0 tracking-tight">Revenue & Billing</h1>
        <p className="text-slate-400 text-xs mt-1 font-semibold">Financial dashboard — MRR, ARR, churn, LTV, CAC, refunds and full transaction logs.</p>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['Revenue Metrics', 'Customer Metrics', 'Billing Reports', 'Subscription Invoice'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border border-solid rounded-full cursor-pointer ${
              activeTab === tab 
                ? 'bg-[#8C4BFF] text-white border-[#8C4BFF]' 
                : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Revenue Metrics' && (
        <div className="space-y-6">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">MRR</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">${liveMetrics.mrr.toLocaleString()}</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">▲ +7.4% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-550 border border-solid border-slate-100 dark:border-slate-800 font-bold text-base">
                $
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ARR</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">${liveMetrics.arr.toLocaleString()}</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">▲ +7.4% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <FileTextOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue Growth</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">{liveMetrics.revenueGrowth}%</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">▲ +{liveMetrics.revenueGrowth}% <span className="text-slate-455 dark:text-slate-400 font-normal">YTD</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <LineChartOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Revenue (YTD)</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">${liveMetrics.totalYtd.toLocaleString()}</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">▲ +12.4% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last year</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <PieChartOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Chart Trend Card */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={<div className="text-xs"><span className="font-bold text-slate-800 dark:text-white block">MRR & ARR Trend</span><span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Monthly recurring revenue and annualized run rate</span></div>}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorARR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8C4BFF" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8C4BFF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D2BE" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#30D2BE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} domain={[0, 800000]} ticks={[0, 200000, 400000, 600000, 800000]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="ARR" stroke="#8C4BFF" fillOpacity={1} fill="url(#colorARR)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="MRR" stroke="#30D2BE" fillOpacity={1} fill="url(#colorMRR)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center text-xs font-bold text-slate-500 mt-4 select-none">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8C4BFF]" /> ARR</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#30D2BE]" /> MRR</span>
            </div>
          </Card>

          {/* Lower Grid (Tier and Region) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue by Tier */}
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<div className="text-xs"><span className="font-bold text-slate-800 dark:text-white block">Revenue by Tier</span><span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Current MRR distribution across subscription plans</span></div>}>
              <div className="flex flex-col sm:flex-row justify-around items-center h-full min-h-[220px] py-2 gap-4">
                {/* Donut Simulation */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r="54" stroke="#e2e8f0" strokeWidth="18" fill="transparent" />
                    <circle cx="72" cy="72" r="54" stroke="#30D2BE" strokeWidth="18" fill="transparent" strokeDasharray="339.29" strokeDashoffset="179.82" />
                    <circle cx="72" cy="72" r="54" stroke="#8C4BFF" strokeWidth="18" fill="transparent" strokeDasharray="339.29" strokeDashoffset="291.78" className="transform origin-center rotate-[169.2deg]" />
                    <circle cx="72" cy="72" r="54" stroke="#ec4899" strokeWidth="18" fill="transparent" strokeDasharray="339.29" strokeDashoffset="271.43" className="transform origin-center rotate-[288deg]" />
                  </svg>
                  <div className="absolute w-20 h-20 bg-white dark:bg-slate-900 rounded-full shadow-inner flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-455 dark:text-slate-400 uppercase font-black tracking-wider">MRR</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">$52,400</span>
                  </div>
                </div>

                <div className="space-y-3 font-semibold text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#30D2BE]" />
                    <span>Enterprise <span className="font-black text-slate-800 dark:text-white">$24,800 · 47%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#8C4BFF]" />
                    <span>Professional <span className="font-black text-slate-800 dark:text-white">$17,400 · 33%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ec4899]" />
                    <span>Basic <span className="font-black text-slate-800 dark:text-white">$10,200 · 20%</span></span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Revenue by Region */}
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<div className="text-xs"><span className="font-bold text-slate-800 dark:text-white block">Revenue by Region</span><span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Top markets by country / state</span></div>}>
              <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-1">
                {regionData.map((reg) => (
                  <div key={reg.region} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block">{reg.region}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{reg.desc}</span>
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-white">${reg.value.toLocaleString()}</span>
                    </div>
                    <Progress percent={reg.pct} strokeColor="#30D2BE" showInfo={false} size="small" />
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      )}

      {activeTab === 'Customer Metrics' && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Churn Rate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Churn Rate</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">1.62%</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↘ -10.0% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <LineChartOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            {/* LTV */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lifetime Value (LTV)</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$6,180</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↗ +3.0% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <HeartOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            {/* CAC */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer Acquisition Cost</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$522</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↘ -3.3% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <AimOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            {/* Avg Revenue / Clinic */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Revenue / Clinic</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$534</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↗ +2.7% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-550 border border-solid border-slate-100 dark:border-slate-800">
                <BankOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Rate Trend */}
            <Card 
              className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
              title={
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-white block">Churn Rate Trend</span>
                  <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Lower is better</span>
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={churnTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value) => [`${value}%`, 'Churn Rate']} />
                    <Line type="monotone" dataKey="value" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3, fill: '#F43F5E' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* LTV vs CAC */}
            <Card 
              className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
              title={
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-white block">LTV vs CAC</span>
                  <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Lifetime value versus acquisition cost</span>
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ltvCacData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} domain={[0, 8000]} ticks={[0, 2000, 4000, 6000, 8000]} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="CAC" fill="#F59E0B" radius={[2, 2, 0, 0]} maxBarSize={10} />
                    <Bar dataKey="LTV" fill="#8C4BFF" radius={[2, 2, 0, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 justify-center text-xs font-bold text-slate-500 mt-4 select-none">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> CAC</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8C4BFF]" /> LTV</span>
              </div>
            </Card>
          </div>

          {/* Full-width Line Chart: Avg Revenue per Clinic */}
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
            title={
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white block">Avg Revenue per Clinic</span>
                <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Monthly ARPC trend</span>
              </div>
            }
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={arpcTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} domain={[0, 600]} ticks={[0, 150, 300, 450, 600]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value) => [`$${value}`, 'ARPC']} />
                  <Line type="monotone" dataKey="value" stroke="#30D2BE" strokeWidth={2.5} dot={{ r: 3, fill: '#30D2BE' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Billing Reports' && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Failed Payments */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Failed Payments</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$2,045</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↘ -2.4% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <WarningOutlined style={{ fontSize: 13, color: '#EF4444' }} />
              </div>
            </div>

            {/* Outstanding Invoices */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Invoices</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$5,045</h3>
                <span className="text-[9px] text-rose-500 font-bold block mt-1">▲ +4.1% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <FileTextOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            {/* Refunds (Processed) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Refunds (Processed)</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$997</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↘ -1.2% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-550 border border-solid border-slate-100 dark:border-slate-800">
                <UndoOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            {/* Transactions (Month) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transactions (Month)</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">8</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">↗ +6.8% <span className="text-slate-405 dark:text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 border border-solid border-slate-100 dark:border-slate-800">
                <DatabaseOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Failed Payments Table */}
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
            title={
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white text-sm block">Failed Payments</span>
                <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Recent declined or unsuccessful charges</span>
              </div>
            }
          >
            <Table
              dataSource={failedPaymentsData}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (t) => <span className="font-mono text-xs text-slate-450 dark:text-slate-400 font-bold">{t}</span> },
                { title: 'CLINIC', dataIndex: 'clinic', render: (t) => <span className="font-bold text-slate-800 dark:text-white text-xs">{t}</span> },
                { title: 'AMOUNT', dataIndex: 'amount', render: (t) => <span className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">{t}</span> },
                { title: 'REASON', dataIndex: 'reason', render: (t) => <span className="text-slate-500 text-xs font-semibold">{t}</span> },
                { title: 'ATTEMPTS', dataIndex: 'attempts', render: (t) => <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">{t}</span> },
                { title: 'ATTEMPTED', dataIndex: 'attempted', render: (t) => <span className="text-slate-500 text-xs font-semibold">{t}</span> },
                { 
                  title: 'STATUS', 
                  dataIndex: 'status', 
                  render: (s) => (
                    <Tag color={s === 'Recovered' ? 'success' : s === 'Retrying' ? 'warning' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                      {s}
                    </Tag>
                  ) 
                }
              ]}
            />
          </Card>

          {/* Outstanding Invoices Table */}
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
            title={
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white text-sm block">Outstanding Invoices</span>
                <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Unpaid invoices and overdue accounts</span>
              </div>
            }
          >
            <Table
              dataSource={outstandingInvoicesData}
              pagination={false}
              columns={[
                { title: 'INVOICE', dataIndex: 'invoice', render: (t) => <span className="font-mono text-xs text-slate-450 dark:text-slate-400 font-bold">{t}</span> },
                { title: 'CLINIC', dataIndex: 'clinic', render: (t) => <span className="font-bold text-slate-800 dark:text-white text-xs">{t}</span> },
                { title: 'AMOUNT', dataIndex: 'amount', render: (t) => <span className="font-extrabold text-slate-750 text-xs">{t}</span> },
                { title: 'DUE', dataIndex: 'due', render: (t) => <span className="text-slate-500 text-xs font-semibold">{t}</span> },
                { 
                  title: 'OVERDUE', 
                  dataIndex: 'overdue', 
                  render: (t) => (
                    <span className={t !== '—' ? 'text-red-500 font-extrabold text-xs' : 'text-slate-400 font-semibold text-xs'}>
                      {t}
                    </span>
                  ) 
                },
                { 
                  title: 'STATUS', 
                  dataIndex: 'status', 
                  render: (s) => (
                    <Tag color={s === 'Sent' ? 'purple' : s === 'Pending' ? 'warning' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                      {s}
                    </Tag>
                  ) 
                }
              ]}
            />
          </Card>

          {/* Refund Tracking Table */}
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
            title={
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white text-sm block">Refund Tracking</span>
                <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Recent refunds across clinics</span>
              </div>
            }
          >
            <Table
              dataSource={refundTrackingData}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (t) => <span className="font-mono text-xs text-slate-450 dark:text-slate-400 font-bold">{t}</span> },
                { title: 'CLINIC', dataIndex: 'clinic', render: (t) => <span className="font-bold text-slate-800 dark:text-white text-xs">{t}</span> },
                { title: 'AMOUNT', dataIndex: 'amount', render: (t) => <span className="font-extrabold text-slate-750 text-xs">{t}</span> },
                { title: 'REASON', dataIndex: 'reason', render: (t) => <span className="text-slate-500 text-xs font-semibold">{t}</span> },
                { title: 'DATE', dataIndex: 'date', render: (t) => <span className="text-slate-500 text-xs font-semibold">{t}</span> },
                { 
                  title: 'STATUS', 
                  dataIndex: 'status', 
                  render: (s) => (
                    <Tag color={s === 'Processed' ? 'success' : s === 'Pending' ? 'warning' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                      {s}
                    </Tag>
                  ) 
                }
              ]}
            />
          </Card>

          {/* Transaction Logs Table */}
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" 
            title={
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white text-sm block">Transaction Logs</span>
                <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Full ledger of recent transactions</span>
              </div>
            }
          >
            <Table
              dataSource={transactionLogsData}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (t) => <span className="font-mono text-xs text-slate-450 dark:text-slate-400 font-bold">{t}</span> },
                { title: 'CLINIC', dataIndex: 'clinic', render: (t) => <span className="font-bold text-slate-800 dark:text-white text-xs">{t}</span> },
                { title: 'TYPE', dataIndex: 'type', render: (t) => <span className="text-slate-600 text-xs font-semibold">{t}</span> },
                { title: 'METHOD', dataIndex: 'method', render: (t) => <span className="text-slate-500 text-xs font-semibold">{t}</span> },
                { title: 'AMOUNT', dataIndex: 'amount', render: (t) => <span className="font-extrabold text-slate-750 text-xs">{t}</span> },
                { title: 'DATE', dataIndex: 'date', render: (t) => <span className="text-slate-550 text-xs font-semibold">{t}</span> },
                { 
                  title: 'STATUS', 
                  dataIndex: 'status', 
                  render: (s) => (
                    <Tag color={s === 'Paid' ? 'success' : s === 'Refunded' ? 'processing' : s === 'Pending' ? 'warning' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                      {s}
                    </Tag>
                  ) 
                }
              ]}
            />
          </Card>
        </div>
      )}

      {activeTab === 'Subscription Invoice' && (
        <Card 
          className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900 p-5"
          title={null}
        >
          {/* Custom Header Row with Title and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white m-0">Subscription Invoice</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Input
                placeholder="Search here"
                prefix={<SearchOutlined className="text-slate-400" />}
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                className="rounded-xl h-9 w-48 text-xs"
                style={{ borderRadius: 8 }}
              />
              <Select
                value={invoiceIssueDate}
                onChange={v => setInvoiceIssueDate(v)}
                className="h-9 w-32 text-xs"
                style={{ borderRadius: 8 }}
                dropdownStyle={{ borderRadius: 8 }}
              >
                <Option value="all">Issue Date</Option>
                <Option value="2025">2025</Option>
                <Option value="2026">2026</Option>
                <Option value="2027">2027</Option>
              </Select>
              <Select
                value={invoiceStatus}
                onChange={v => setInvoiceStatus(v)}
                className="h-9 w-32 text-xs"
                style={{ borderRadius: 8 }}
                dropdownStyle={{ borderRadius: 8 }}
              >
                <Option value="all">Status</Option>
                <Option value="N/A">N/A</Option>
                <Option value="Basic">Basic/y</Option>
                <Option value="Premium">Premium/y</Option>
                <Option value="Free Trial">Free Trial</Option>
              </Select>
              <Select
                value={invoiceDateline}
                onChange={v => setInvoiceDateline(v)}
                className="h-9 w-32 text-xs"
                style={{ borderRadius: 8 }}
                dropdownStyle={{ borderRadius: 8 }}
              >
                <Option value="all">Dateline</Option>
                <Option value="2025">2025</Option>
                <Option value="2026">2026</Option>
                <Option value="2027">2027</Option>
              </Select>
            </div>
          </div>

          <Table
            dataSource={filteredInvoices}
            pagination={false}
            columns={[
              { 
                title: 'Reg. ID', 
                dataIndex: 'regId', 
                render: (t) => <span className="font-mono text-[11px] text-slate-500 font-bold">{t}</span> 
              },
              { 
                title: 'Pac. ID', 
                dataIndex: 'pacId', 
                render: (t) => <span className="font-mono text-[11px] text-slate-400">{t}</span> 
              },
              { 
                title: 'User Name', 
                dataIndex: 'username', 
                render: (t) => <span className="font-bold text-slate-800 dark:text-white text-[11px]">{t}</span> 
              },
              { 
                title: 'Contact', 
                dataIndex: 'contact', 
                render: (t) => {
                  const parts = t.split(' ')
                  if (parts.length >= 3) {
                    return (
                      <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                        {parts[0]} {parts[1]}
                        <span className="block text-slate-400 font-normal">{parts[2]}</span>
                      </span>
                    )
                  }
                  return <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{t}</span>
                }
              },
              { 
                title: 'Email', 
                dataIndex: 'email', 
                render: (t) => <span className="text-[11px] text-slate-500 font-semibold block max-w-[120px] break-all">{t}</span> 
              },
              { 
                title: 'Package', 
                dataIndex: 'pkg', 
                render: (pkg) => (
                  <Tag 
                    color={pkg === 'N/A' ? 'default' : pkg.startsWith('Basic') ? 'blue' : pkg.startsWith('Premium') ? 'purple' : 'geekblue'} 
                    className="rounded-full border-none font-bold text-[8px] px-2 py-0.2 uppercase"
                  >
                    {pkg}
                  </Tag>
                )
              },
              { 
                title: 'price', 
                dataIndex: 'price', 
                render: (p) => <span className="font-bold text-slate-850 dark:text-white text-[11px]">{p}</span> 
              },
              { 
                title: 'Issue Date', 
                dataIndex: 'issueDate', 
                render: (d) => {
                  const parts = d.split(' ')
                  return (
                    <span className="text-[11px] text-slate-650 font-semibold leading-tight block">
                      {parts[0]} {parts[1]}
                      <span className="block text-[9px] text-slate-400 font-normal">{parts[2]}</span>
                    </span>
                  )
                }
              },
              { 
                title: 'Dateline', 
                dataIndex: 'dateline', 
                render: (d) => {
                  const parts = d.split(' ')
                  return (
                    <span className="text-[11px] text-slate-650 font-semibold leading-tight block">
                      {parts[0]} {parts[1]}
                      <span className="block text-[9px] text-slate-400 font-normal">{parts[2]}</span>
                    </span>
                  )
                }
              },
              {
                title: 'Action',
                key: 'action',
                align: 'right',
                render: (_, record) => (
                  <div className="flex gap-2 items-center justify-end text-slate-400 select-none">
                    <DownloadOutlined 
                      className="cursor-pointer hover:text-[#8C4BFF] transition-colors" 
                      style={{ fontSize: 13 }} 
                      onClick={() => handleDownloadInvoicePdf(record)} 
                    />
                    <InfoCircleOutlined 
                      className="cursor-pointer hover:text-blue-500 transition-colors" 
                      style={{ fontSize: 13 }} 
                      onClick={() => setViewInvoiceModalRecord(record)} 
                    />
                    <DeleteOutlined 
                      className="cursor-pointer hover:text-rose-500 transition-colors" 
                      style={{ fontSize: 13 }} 
                      onClick={() => handleDeleteInvoice(record)} 
                    />
                  </div>
                )
              }
            ]}
          />

          {/* Custom pagination */}
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold">Showing 1-15 out of 150</span>
            <div className="flex items-center gap-1.5 select-none">
              <Button 
                type="text" 
                size="small" 
                className="text-slate-400 hover:text-slate-600 font-bold text-[10px]" 
                onClick={() => toast.success('Previous page clicked')}
              >
                &lt; Previous
              </Button>
              <Button 
                size="small" 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20 border-none font-bold text-[10px]"
              >
                1
              </Button>
              <Button 
                size="small" 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-transparent text-slate-400 border-none font-bold text-[10px] hover:bg-slate-100"
                onClick={() => toast.success('Page 2 clicked')}
              >
                2
              </Button>
              <span className="text-slate-400 px-1 font-bold text-[10px]">...</span>
              <Button 
                size="small" 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-transparent text-slate-400 border-none font-bold text-[10px] hover:bg-slate-100"
                onClick={() => toast.success('Page 10 clicked')}
              >
                10
              </Button>
              <Button 
                type="text" 
                size="small" 
                className="text-[#0E1B33] dark:text-white hover:text-[#8C4BFF] font-bold text-[10px]"
                onClick={() => toast.success('Next page clicked')}
              >
                Next &gt;
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── View Invoice Modal ── */}
      <Modal
        title={<span className="font-bold text-slate-800 dark:text-white">Subscription Invoice Details - {viewInvoiceModalRecord?.regId}</span>}
        open={!!viewInvoiceModalRecord}
        onCancel={() => setViewInvoiceModalRecord(null)}
        footer={[
          <Button key="close" onClick={() => setViewInvoiceModalRecord(null)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            className="bg-[#8C4BFF] hover:bg-[#7A3BE5]"
            icon={<DownloadOutlined />}
            onClick={() => {
              handleDownloadInvoicePdf(viewInvoiceModalRecord)
            }}
          >
            Download Invoice
          </Button>
        ]}
      >
        {viewInvoiceModalRecord && (
          <div className="space-y-4 pt-2 select-none">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Registration ID:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.regId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Package ID:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.pacId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Clinic / User:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.username}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Contact Email:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Phone Number:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.contact}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Package Plan:</span>
                <Tag color="purple" className="font-bold">{viewInvoiceModalRecord.pkg}</Tag>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Billing Price:</span>
                <span className="text-base font-extrabold text-emerald-600">{viewInvoiceModalRecord.price}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Issue Date:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.issueDate}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Dateline:</span>
                <span className="font-bold text-slate-800 dark:text-white">{viewInvoiceModalRecord.dateline}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Status:</span>
                <Tag color="green" className="font-bold">{viewInvoiceModalRecord.status || 'Active'}</Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
