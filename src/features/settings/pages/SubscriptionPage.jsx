import React, { useState } from 'react'
import { Table, Modal, Tag, Tooltip, Progress, Select } from 'antd'
import {
  CreditCardOutlined,
  MessageOutlined,
  RiseOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  FileTextOutlined,
  AuditOutlined,
  CloudOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../store/clinicStore'

const { Option } = Select

const PLAN_ICONS = {
  Starter: <RocketOutlined />,
  Growth: <ThunderboltOutlined />,
  Enterprise: <CrownOutlined />,
}

const PLAN_GRADIENT = {
  Starter: 'linear-gradient(135deg, #3B82F6, #1A56DB)',
  Growth: 'linear-gradient(135deg, #8C4BFF, #5B21B6)',
  Enterprise: 'linear-gradient(135deg, #0E1B33, #1E3A5F)',
}

const USAGE_ICONS = {
  practitioners: <TeamOutlined />,
  branches: <BankOutlined />,
  patients: <UserOutlined />,
  storage: <CloudOutlined />,
  appointments: <CalendarOutlined />,
  forms: <FileTextOutlined />,
  invoicesThisMonth: <AuditOutlined />,
}

const USAGE_LABELS = {
  practitioners: 'Practitioners',
  branches: 'Branches',
  patients: 'Patients',
  storage: 'Storage',
  appointments: 'Appointments (This Month)',
  forms: 'Form Templates',
  invoicesThisMonth: 'Invoices (This Month)',
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.mrr), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => {
        const pct = (d.mrr / max) * 100
        const isLast = i === data.length - 1
        return (
          <Tooltip key={d.month} title={`${d.month}: $${d.mrr}`}>
            <div className="flex flex-col items-center gap-1 flex-1 cursor-pointer">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(8, pct * 0.7)}px`,
                  background: isLast
                    ? 'linear-gradient(180deg, #8C4BFF, #5B21B6)'
                    : 'linear-gradient(180deg, #CBD5E1, #94A3B8)',
                  minHeight: 8,
                }}
              />
              <span className="text-xs text-slate-400 font-semibold">{d.month}</span>
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}

function UsageBar({ used, limit, unit = '' }) {
  const isUnlimited = limit === -1
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981'

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {used}{unit}
          <span className="text-slate-400 font-normal">
            {' '}/{isUnlimited ? ' ∞ Unlimited' : ` ${limit}${unit}`}
          </span>
        </span>
        {!isUnlimited && (
          <span
            className="text-xs font-bold"
            style={{ color: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#64748B' }}
          >
            {pct}%
          </span>
        )}
      </div>
      {!isUnlimited && (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-semibold">
          <CheckCircleOutlined />
          Unlimited access
        </div>
      )}
    </div>
  )
}

export default function SubscriptionPage() {
  const { subscription, upgradePlan, updateSmsCredits } = useClinicStore()
  const [upgradeModal, setUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(subscription.plan)
  const [smsModal, setSmsModal] = useState(false)
  const [smsCreditAdd, setSmsCreditAdd] = useState(100)

  const sub = subscription
  const limits = sub.planLimits[sub.plan] || {}

  const mrrGrowth = sub.mrrHistory.length >= 2
    ? (((sub.mrrHistory.at(-1).mrr - sub.mrrHistory.at(-2).mrr) / sub.mrrHistory.at(-2).mrr) * 100).toFixed(1)
    : 0

  const smsUsedPct = Math.min(100, Math.round((sub.smsCredits.used / sub.smsCredits.total) * 100))
  const smsColor = smsUsedPct >= 90 ? '#EF4444' : smsUsedPct >= 70 ? '#F59E0B' : '#10B981'

  const handleUpgrade = () => {
    if (selectedPlan === sub.plan) {
      toast('You are already on this plan.')
      return
    }
    upgradePlan(selectedPlan)
    setUpgradeModal(false)
    toast.success(`Upgraded to ${selectedPlan} plan!`)
  }

  const handleBuySmsCredits = () => {
    updateSmsCredits(Math.max(0, sub.smsCredits.used - smsCreditAdd))
    setSmsModal(false)
    toast.success(`${smsCreditAdd} SMS credits added!`)
  }

  const billingColumns = [
    {
      title: 'Invoice',
      dataIndex: 'id',
      key: 'id',
      render: (v) => <span className="font-bold text-slate-600 text-sm">{v}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v) => <span className="text-slate-700 dark:text-slate-300 text-sm">{v}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (v) => <span className="text-slate-500 text-sm">{v}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => <span className="font-bold text-slate-800 dark:text-slate-200">${v} AUD</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
          v === 'Paid' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]'
        }`}>
          {v === 'Paid' ? <CheckCircleOutlined className="mr-1" /> : <CloseCircleOutlined className="mr-1" />}
          {v}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      render: () => (
        <button
          onClick={() => toast('Downloading invoice...')}
          className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-[#8C4BFF] transition-colors"
        >
          <DownloadOutlined style={{ fontSize: 15 }} />
        </button>
      ),
    },
  ]

  const PLANS = ['Starter', 'Growth', 'Enterprise']

  return (
    <div className="documents-page-container py-2 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E1B33] dark:text-white m-0">Subscription &amp; Usage</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Monitor your plan usage, MRR, SMS credits &amp; billing history
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setSmsModal(true)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer text-sm transition-colors shadow-sm"
          >
            <MessageOutlined />
            Top Up SMS
          </button>
          <button
            onClick={() => setUpgradeModal(true)}
            className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer border-none text-sm transition-colors shadow-sm"
          >
            <CrownOutlined />
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Current Plan Card + MRR */}
      <div className="grid grid-cols-3 gap-5">

        {/* Plan Card */}
        <div
          className="col-span-1 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg"
          style={{ background: PLAN_GRADIENT[sub.plan] }}
        >
          <div className="absolute right-4 top-4 text-5xl opacity-10">{PLAN_ICONS[sub.plan]}</div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Current Plan</div>
          <div className="text-3xl font-extrabold mb-1">{sub.plan}</div>
          <div className="text-sm font-semibold opacity-80 mb-4">
            ${limits.price}/mo · {sub.billingCycle} · {sub.currency}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${
              sub.status === 'Active' ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${sub.status === 'Active' ? 'bg-[#30D2BE]' : 'bg-red-300'}`} />
            {sub.status}
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70 font-semibold">
            <CalendarOutlined />
            Renews {sub.renewalDate}
          </div>
        </div>

        {/* MRR Card */}
        <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Monthly Recurring Revenue (MRR)
              </div>
              <div className="text-4xl font-extrabold text-[#0E1B33] dark:text-white">
                ${sub.mrr.toLocaleString()}
                <span className="text-base font-semibold text-slate-400 ml-1">AUD</span>
              </div>
              {mrrGrowth !== '0.0' && (
                <div className={`flex items-center gap-1 mt-1 text-sm font-bold ${parseFloat(mrrGrowth) >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                  <ArrowUpOutlined style={{ transform: parseFloat(mrrGrowth) < 0 ? 'rotate(180deg)' : 'none' }} />
                  {Math.abs(mrrGrowth)}% vs last month
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <RiseOutlined /> 6-Month Trend
            </div>
          </div>
          <MiniBarChart data={sub.mrrHistory} />
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'SMS Credits Used',
            value: `${sub.smsCredits.used}/${sub.smsCredits.total}`,
            sub: `Resets ${sub.smsCredits.resetDate}`,
            icon: <MessageOutlined />,
            color: smsColor,
            bg: smsUsedPct >= 90 ? '#FEF2F2' : '#F0FDF4',
            alert: smsUsedPct >= 90,
          },
          {
            label: 'Practitioners',
            value: `${sub.usage.practitioners.used}/${limits.practitioners === -1 ? '∞' : limits.practitioners}`,
            sub: limits.practitioners === -1 ? 'Unlimited' : `${limits.practitioners - sub.usage.practitioners.used} remaining`,
            icon: <TeamOutlined />,
            color: '#8C4BFF',
            bg: '#F5F3FF',
            alert: false,
          },
          {
            label: 'Active Patients',
            value: `${sub.usage.patients.used}/${limits.patients === -1 ? '∞' : limits.patients}`,
            sub: limits.patients === -1 ? 'Unlimited' : `${limits.patients - sub.usage.patients.used} remaining`,
            icon: <UserOutlined />,
            color: '#3B82F6',
            bg: '#EFF6FF',
            alert: false,
          },
          {
            label: 'Storage Used',
            value: `${sub.usage.storage.used} GB`,
            sub: `of ${sub.usage.storage.limit} GB`,
            icon: <CloudOutlined />,
            color: '#10B981',
            bg: '#F0FDF4',
            alert: false,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: m.bg, color: m.color }}
              >
                {m.icon}
              </div>
              {m.alert && (
                <Tooltip title="Running low!">
                  <ExclamationCircleOutlined className="text-red-500 text-base" />
                </Tooltip>
              )}
            </div>
            <div className="text-xl font-extrabold text-[#0E1B33] dark:text-white">{m.value}</div>
            <div className="text-xs text-slate-400 font-semibold mt-0.5">{m.label}</div>
            <div className="text-xs text-slate-300 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* SMS Credit Detail + Usage Quotas side-by-side */}
      <div className="grid grid-cols-5 gap-5">

        {/* SMS Detail */}
        <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageOutlined className="text-[#8C4BFF]" />
            <span className="font-bold text-[#0E1B33] dark:text-white">SMS Credit Tracking</span>
          </div>

          {/* Visual circular-style usage */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex-shrink-0">
              <Progress
                type="circle"
                percent={smsUsedPct}
                size={100}
                strokeColor={smsColor}
                railColor="#F1F5F9"
                format={() => (
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-[#0E1B33] dark:text-white">{smsUsedPct}%</div>
                    <div className="text-xs text-slate-400">used</div>
                  </div>
                )}
              />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Total Credits</div>
                <div className="text-lg font-extrabold text-[#0E1B33] dark:text-white">{sub.smsCredits.total}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Used</div>
                <div className="text-lg font-extrabold" style={{ color: smsColor }}>{sub.smsCredits.used}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Remaining</div>
                <div className="text-lg font-extrabold text-[#10B981]">{sub.smsCredits.total - sub.smsCredits.used}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-xl p-3 text-xs text-slate-500 font-semibold mb-4">
            <CalendarOutlined className="mr-1.5" />
            Credits reset on <span className="text-[#0E1B33] dark:text-white font-bold">{sub.smsCredits.resetDate}</span>
          </div>

          {smsUsedPct >= 70 && (
            <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 text-xs text-[#D97706] font-semibold mb-4">
              <ExclamationCircleOutlined className="mr-1.5" />
              {smsUsedPct >= 90 ? 'Critical: Almost out of SMS credits!' : 'Warning: SMS credits running low.'}
            </div>
          )}

          <button
            onClick={() => setSmsModal(true)}
            className="w-full bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-9 rounded-xl border-none cursor-pointer text-sm transition-colors"
          >
            Top Up Credits
          </button>
        </div>

        {/* Usage Quotas */}
        <div className="col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <BarChartOutlined className="text-[#8C4BFF]" />
            <span className="font-bold text-[#0E1B33] dark:text-white">Usage Quota Tracking</span>
            <span className="ml-auto text-xs text-slate-400 font-semibold bg-[#F1F5F9] px-2 py-1 rounded-lg">
              {sub.plan} Plan
            </span>
          </div>

          <div className="space-y-5">
            {Object.entries(sub.usage).map(([key, val]) => {
              const planLimit = limits[key] ?? val.limit
              const unit = val.unit ? ` ${val.unit}` : ''
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-500 text-sm">{USAGE_ICONS[key]}</span>
                    <span className="text-sm font-semibold text-slate-600">{USAGE_LABELS[key]}</span>
                  </div>
                  <UsageBar used={`${val.used}${unit}`} limit={planLimit === -1 ? -1 : planLimit} unit={unit} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <CrownOutlined className="text-[#8C4BFF]" />
          <span className="font-bold text-[#0E1B33] dark:text-white">Plan Limit Monitoring</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wide">Feature</th>
                {PLANS.map((p) => (
                  <th key={p} className="text-center py-3 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: p === sub.plan ? '#8C4BFF' : '#0E1B33' }}
                      >
                        {p}
                      </span>
                      {p === sub.plan && (
                        <span className="text-xs bg-[#8C4BFF] text-white px-2 py-0.5 rounded-full font-bold">Current</span>
                      )}
                      <span className="text-xs text-slate-400">${sub.planLimits[p].price}/mo</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'practitioners', label: 'Practitioners' },
                { key: 'branches', label: 'Branches' },
                { key: 'patients', label: 'Patients' },
                { key: 'storage', label: 'Storage (GB)' },
                { key: 'appointments', label: 'Appointments/mo' },
                { key: 'forms', label: 'Form Templates' },
                { key: 'smsCredits', label: 'SMS Credits/mo' },
                { key: 'invoicesThisMonth', label: 'Invoices/mo' },
              ].map((row, idx) => (
                <tr key={row.key} className={idx % 2 === 0 ? 'bg-[#FAFBFC]' : 'bg-white'}>
                  <td className="py-3 px-4 font-semibold text-slate-600">{row.label}</td>
                  {PLANS.map((p) => {
                    const val = sub.planLimits[p][row.key]
                    const isCurrent = p === sub.plan
                    const display = val === -1 ? '∞ Unlimited' : val
                    return (
                      <td key={p} className="text-center py-3 px-4">
                        <span
                          className="font-bold"
                          style={{ color: isCurrent ? '#8C4BFF' : val === -1 ? '#10B981' : '#0E1B33' }}
                        >
                          {display}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <CreditCardOutlined className="text-[#8C4BFF]" />
          <span className="font-bold text-[#0E1B33] dark:text-white">Billing History</span>
        </div>
        <Table
          dataSource={sub.billingHistory}
          columns={billingColumns}
          rowKey="id"
          className="border-none"
          pagination={false}
        />
      </div>

      {/* ====================== UPGRADE PLAN MODAL ====================== */}
      <Modal
        open={upgradeModal}
        onCancel={() => setUpgradeModal(false)}
        footer={null}
        destroyOnHidden
        className="documents-modal"
        width={520}
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Change Plan</h2>
          <p className="text-slate-400 text-xs mt-1">Select a plan to upgrade or downgrade your subscription.</p>
        </div>

        <div className="space-y-3 mb-6">
          {PLANS.map((p) => {
            const pl = sub.planLimits[p]
            const isCurrent = p === sub.plan
            const isSelected = p === selectedPlan
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlan(p)}
                className="w-full text-left p-4 rounded-2xl border-2 cursor-pointer transition-all"
                style={{
                  borderColor: isSelected ? '#8C4BFF' : '#E2E8F0',
                  background: isSelected ? '#F5F3FF' : 'white',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base"
                      style={{ background: PLAN_GRADIENT[p] }}
                    >
                      {PLAN_ICONS[p]}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#0E1B33] dark:text-white flex items-center gap-2">
                        {p}
                        {isCurrent && (
                          <span className="text-xs bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20 px-2 py-0.5 rounded-full font-bold">Current</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {pl.practitioners === -1 ? 'Unlimited' : pl.practitioners} practitioners ·{' '}
                        {pl.patients === -1 ? 'Unlimited' : pl.patients} patients ·{' '}
                        {pl.smsCredits} SMS/mo
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-[#0E1B33] dark:text-white text-lg">${pl.price}</div>
                    <div className="text-xs text-slate-400">/month</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setUpgradeModal(false)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={selectedPlan === sub.plan}
            className="bg-[#8C4BFF] hover:bg-[#7B3DE8] disabled:bg-slate-300 text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer transition-colors"
          >
            {selectedPlan === sub.plan ? 'Current Plan' : `Switch to ${selectedPlan}`}
          </button>
        </div>
      </Modal>

      {/* ====================== SMS TOP-UP MODAL ====================== */}
      <Modal
        open={smsModal}
        onCancel={() => setSmsModal(false)}
        footer={null}
        destroyOnHidden
        className="documents-modal"
        width={400}
      >
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 m-0">Top Up SMS Credits</h2>
          <p className="text-slate-400 text-xs mt-1">
            Current: <strong>{sub.smsCredits.used}</strong> used of{' '}
            <strong>{sub.smsCredits.total}</strong> total credits.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[100, 250, 500].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setSmsCreditAdd(amt)}
              className="py-3 rounded-xl border-2 cursor-pointer text-center transition-all font-bold"
              style={{
                borderColor: smsCreditAdd === amt ? '#8C4BFF' : '#E2E8F0',
                background: smsCreditAdd === amt ? '#F5F3FF' : 'white',
                color: smsCreditAdd === amt ? '#8C4BFF' : '#0E1B33',
              }}
            >
              <div className="text-xl">{amt}</div>
              <div className="text-xs text-slate-400">credits</div>
              <div className="text-xs font-bold mt-1" style={{ color: smsCreditAdd === amt ? '#8C4BFF' : '#64748B' }}>
                ${(amt * 0.08).toFixed(0)} AUD
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-xl p-3 text-xs text-slate-500 font-semibold mb-5">
          <CheckCircleOutlined className="text-[#10B981] mr-1.5" />
          Credits will be added immediately to your account.
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setSmsModal(false)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBuySmsCredits}
            className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer"
          >
            Buy {smsCreditAdd} Credits
          </button>
        </div>
      </Modal>
    </div>
  )
}
