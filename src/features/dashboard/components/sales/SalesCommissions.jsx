import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Button } from 'antd'
import { CreditCardOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, PercentageOutlined, RiseOutlined } from '@ant-design/icons'
import { useClinicStore } from '../../../../store/clinicStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
      endDate: endOfMonth
    })
  }
  return months
}

export default function SalesCommissions({ store: propStore }) {
  const localStore = useClinicStore()
  const store = propStore || localStore
  const [requestedPayouts, setRequestedPayouts] = useState({})
  const { clinics, leads } = store
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    if (store.fetchSalesClinics) store.fetchSalesClinics()
    if (store.fetchLeads) store.fetchLeads()
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
  const ratePercentageStr = `${Math.round(repCommissionRate * 100)}%`

  const getPayoutForClinic = (id) => {
    return (store.salesCommissions || []).find(p => p.clinicId === id)
  }

  // Multi-tenant database clinics & converted leads attributed to this sales executive
  const dbClinicsFormatted = (clinics || [])
    .filter(c => c.status === 'Active')
    .filter(c => isMatchingRep(c.salesperson))
    .map(c => {
      const payout = getPayoutForClinic(c.id)
      return {
        id: c.id,
        name: c.name,
        tier: c.tier || 'Basic',
        revenue: parseFloat(c.revenue) || 100,
        commissionStatus: payout ? payout.status : 'Pending',
        commissionPaidDate: payout && payout.status === 'Paid' && payout.paidDate 
          ? new Date(payout.paidDate).toLocaleDateString() 
          : (payout ? 'Requested' : 'Awaiting Cycle'),
        salesperson: c.salesperson || currentRepName,
        signupDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      }
    })

  const convertedLeadsFormatted = (leads || [])
    .filter(l => l.stage === 'Converted' || l.status === 'Converted')
    .filter(l => isMatchingRep(l.assignedTo || l.salesperson))
    .map(l => {
      const payout = getPayoutForClinic(l.id)
      return {
        id: l.id,
        name: l.name || l.companyName,
        tier: l.tier || 'Basic',
        revenue: parseFloat(l.value) || 100,
        commissionStatus: payout ? payout.status : 'Pending',
        commissionPaidDate: payout && payout.status === 'Paid' && payout.paidDate 
          ? new Date(payout.paidDate).toLocaleDateString() 
          : (payout ? 'Requested' : 'Awaiting Cycle'),
        salesperson: l.assignedTo || currentRepName,
        signupDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent',
        createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
      }
    })

  const leadIds = new Set(convertedLeadsFormatted.map(l => l.id))
  const filteredDbClinics = dbClinicsFormatted.filter(c => !leadIds.has(c.id))

  const repClinics = [...filteredDbClinics, ...convertedLeadsFormatted]

  const paidCommissionSum = repClinics
    .filter(c => c.commissionStatus === 'Paid')
    .reduce((sum, c) => sum + (parseFloat(c.revenue) * repCommissionRate), 0)

  const pendingCommissionSum = repClinics
    .filter(c => c.commissionStatus === 'Pending')
    .reduce((sum, c) => sum + (parseFloat(c.revenue) * repCommissionRate), 0)

  const lifetimeCommissions = paidCommissionSum + pendingCommissionSum
  const totalMrr = repClinics.reduce((sum, c) => sum + (parseFloat(c.revenue) || 0), 0)
  const thisMonthCommission = totalMrr * repCommissionRate

  const stats = [
    { label: 'This Month', value: `$${Math.round(thisMonthCommission).toLocaleString()}`, icon: <PercentageOutlined />, color: '#8C4BFF', sub: 'Current month earnings' },
    { label: 'Lifetime Earned', value: `$${lifetimeCommissions.toFixed(2)}`, icon: <CreditCardOutlined />, color: '#3B82F6', sub: 'Accumulated total' },
    { label: 'Paid Out', value: `$${paidCommissionSum.toFixed(2)}`, icon: <CheckCircleOutlined />, color: '#10B981', sub: 'Released to bank' },
    { label: 'Pending Payout', value: `$${pendingCommissionSum.toFixed(2)}`, icon: <ClockCircleOutlined />, color: '#F59E0B', sub: 'Awaiting monthly cycle' },
  ]

  // Dynamic 6-Month Trend Window based on current date & active clinics in DB
  const monthsWindow = getMonthsWindow(6)
  const trendData = monthsWindow.map(({ label, endDate }) => {
    const activeClinicsUpToMonth = repClinics.filter(c => {
      const createdDate = c.createdAt ? new Date(c.createdAt) : new Date(0)
      return createdDate <= endDate
    })
    const monthRevenue = activeClinicsUpToMonth.reduce((sum, c) => sum + (parseFloat(c.revenue) || 0), 0)
    return {
      month: label,
      commission: Math.round(monthRevenue * repCommissionRate),
    }
  })

  // Filter ledger data
  const filteredClinics = repClinics.filter(c => filterStatus === 'All' || c.commissionStatus === filterStatus)

  const ledgerData = filteredClinics.map(c => ({
    key: c.id,
    clinicName: c.name,
    tier: c.tier,
    revenue: c.revenue,
    rate: ratePercentageStr,
    commissionVal: parseFloat(c.revenue) * repCommissionRate,
    status: c.commissionStatus,
    paidDate: c.commissionPaidDate || '—',
    signupDate: c.signupDate || '—',
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8C4BFF] block mb-1">
          Multi-Tenant Sales Commission &bull; Live MySQL DB
        </span>
        <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">My Commissions Ledger</h2>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
          {currentRepName || 'Sales Executive'} &bull; {ratePercentageStr} recurring affiliate commission on converted clinic subscriptions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex justify-between items-center gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-black tracking-wider block truncate">{s.label}</span>
              <h3 className="text-base sm:text-2xl font-black text-slate-800 dark:text-white mt-1.5 mb-0 truncate">{s.value}</h3>
              <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] font-semibold block mt-1 leading-tight">{s.sub}</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm shrink-0" style={{ backgroundColor: s.color + '15', color: s.color }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Commission Trend Chart */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900"
        title={
          <div>
            <span className="font-bold text-slate-800 dark:text-white text-xs block">Monthly Commission Trend</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Recurring commission payout over the last 6 months</span>
          </div>
        }>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C4BFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8C4BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={9} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Commission']} />
              <Area type="monotone" dataKey="commission" stroke="#8C4BFF" fillOpacity={1} fill="url(#commGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card
        className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
        title={<span className="font-bold text-slate-800 dark:text-white text-base">Recurring Commission Attributions</span>}
        extra={
          <Select value={filterStatus} onChange={setFilterStatus} size="small" className="min-w-[130px] rounded-xl">
            <Option value="All">All Statuses</Option>
            <Option value="Paid">Paid</Option>
            <Option value="Pending">Pending</Option>
          </Select>
        }
      >
        <Table
          dataSource={ledgerData}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 900 }}
          locale={{ emptyText: <span className="text-slate-400 text-xs">No commission attributions recorded for your account yet.</span> }}
          columns={[
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Converted Clinic</span>,
              dataIndex: 'clinicName',
              render: t => <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{t}</span>,
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan</span>,
              dataIndex: 'tier',
              render: tier => (
                <Tag color={tier === 'Enterprise' ? 'purple' : tier === 'Pro' ? 'orange' : 'blue'} className="rounded-full border-none font-bold text-[8px] px-2.5">{tier}</Tag>
              ),
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly MRR</span>,
              dataIndex: 'revenue',
              render: rev => <span className="font-bold text-slate-700 dark:text-slate-350 text-xs">${rev}/mo</span>,
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</span>,
              dataIndex: 'rate',
              render: rate => <span className="text-slate-500 font-semibold text-xs">{rate}</span>,
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Commission</span>,
              dataIndex: 'commissionVal',
              render: c => <span className="font-extrabold text-[#8C4BFF] text-xs">${c.toFixed(2)}</span>,
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>,
              dataIndex: 'status',
              render: status => (
                <Tag color={status === 'Paid' ? 'success' : 'warning'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">{status}</Tag>
              ),
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Date</span>,
              dataIndex: 'paidDate',
              render: d => <span className="text-slate-400 font-semibold text-xs">{d}</span>,
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</span>,
              key: 'action',
              render: (_, record) => {
                if (record.status === 'Paid') {
                  return <span className="text-emerald-500 font-bold text-xs flex items-center gap-1"><CheckCircleOutlined /> Released</span>
                }
                const isRequested = record.status === 'Requested' || requestedPayouts[record.id]
                return (
                  <Button
                    size="small"
                    type="primary"
                    disabled={isRequested}
                    className={`text-xs font-bold rounded-xl h-7 ${isRequested ? 'bg-slate-300 dark:bg-slate-700 text-slate-500' : 'bg-[#8C4BFF]'}`}
                    onClick={async () => {
                      if (store.requestCommissionPayout) {
                        await store.requestCommissionPayout(record.key, record.clinicName, record.commissionVal)
                      }
                      setRequestedPayouts(prev => ({ ...prev, [record.key]: true }))
                      toast.success(`Payout request recorded in database for ${record.clinicName}!`)
                    }}
                  >
                    {isRequested ? 'Requested' : 'Request Payout'}
                  </Button>
                )
              }
            }
          ]}
        />
      </Card>
    </div>
  )
}

