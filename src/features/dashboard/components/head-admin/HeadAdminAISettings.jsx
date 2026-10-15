import React, { useState } from 'react'
import { Card, Table, Tag, Button, Switch, Progress, Select, Input } from 'antd'
import {
  SyncOutlined,
  DatabaseOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SlidersOutlined,
  CheckCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { toast } from 'react-hot-toast'

export default function HeadAdminAISettings() {
  const [activeTab, setActiveTab] = useState('AI Governance')

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const aiTrendData = months.map(name => ({ name, requests: 0, cost: 0 }))

  const promptCatalog = [
    { id: 'PR-2101', name: 'soap_summary_v3', feature: 'Clinical Note Summarization', version: '3.2.1', owner: 'Dr. Amelia Park', date: 'May 09, 2026, 04:54 PM', status: 'Active' },
    { id: 'PR-2102', name: 'dictation_normalizer_v2', feature: 'Voice Dictation', version: '2.5.0', owner: 'AI Platform Team', date: 'May 04, 2026, 08:40 PM', status: 'Active' },
    { id: 'PR-2103', name: 'cpt_code_recommender', feature: 'Billing Code Suggestion', version: '1.8.3', owner: 'Finance Engineering', date: 'Apr 28, 2026, 03:18 PM', status: 'Active' },
    { id: 'PR-2104', name: 'patient_translation_pro', feature: 'Auto-translation', version: '4.0.0', owner: 'Localization Team', date: 'May 12, 2026, 11:25 PM', status: 'Draft' },
    { id: 'PR-2105', name: 'soap_summary_v2', feature: 'Clinical Note Summarization', version: '2.4.5', owner: 'Dr. Amelia Park', date: 'Feb 18, 2026, 02:00 PM', status: 'Deprecated' }
  ]

  const moderationLog = [
    { id: 'MF-5501', category: 'PHI Leak', feature: 'Clinical Note Summarization', user: 'Westend Wellness (Dr. David Olenkova)', severity: 'High', date: 'May 13, 2026, 03:32 PM', status: 'Escalated' },
    { id: 'MF-5502', category: 'Hallucination', feature: 'Voice Dictation', user: 'Bayview Family Clinic (Dr. Sarah Chen)', severity: 'Medium', date: 'May 12, 2026, 08:12 PM', status: 'Pending Review' },
    { id: 'MF-5503', category: 'Off-topic', feature: 'Patient Q&A Assist', user: 'Sunrise Pediatrics (Dr. Priya Patel)', severity: 'Low', date: 'May 12, 2026, 04:48 PM', status: 'Resolved' },
    { id: 'MF-5504', category: 'Bias', feature: 'Billing Code Suggestion', user: 'Greenfield Health (James Wilson)', severity: 'Medium', date: 'May 11, 2026, 03:20 PM', status: 'Pending Review' },
    { id: 'MF-5505', category: 'Toxic Output', feature: 'Clinical Note Summarization', user: 'Cedar Hill Clinic (Dr. K. Lee)', severity: 'High', date: 'May 10, 2026, 10:35 PM', status: 'Escalated' }
  ]

  const analyticsFeaturesData = [
    { name: 'Clinical Note Summarization', requests: 120000 },
    { name: 'Voice Dictation', requests: 92000 },
    { name: 'Patient Q&A Assist', requests: 50000 },
    { name: 'Billing Code Suggestion', requests: 32000 },
    { name: 'Auto-translation', requests: 22000 }
  ]

  const timeSavedData = [
    { name: 'Jan', time: 20 },
    { name: 'Feb', time: 22 },
    { name: 'Mar', time: 25 },
    { name: 'Apr', time: 30 },
    { name: 'May', time: 32 },
    { name: 'Jun', time: 35 },
    { name: 'Jul', time: 38 },
    { name: 'Aug', time: 41 },
    { name: 'Sep', time: 43 },
    { name: 'Oct', time: 47 },
    { name: 'Nov', time: 49 },
    { name: 'Dec', time: 52 }
  ]

  const adoptionClinics = [
    { key: '1', clinic: 'Bayview Family Clinic', plan: 'Enterprise', seats: '42 / 48', adoption: 88, requests: '8,200' },
    { key: '2', clinic: 'Northside Dental', plan: 'Professional', seats: '11 / 14', adoption: 79, requests: '1,980' },
    { key: '3', clinic: 'Sunrise Pediatrics', plan: 'Professional', seats: '9 / 12', adoption: 75, requests: '1,340' },
    { key: '4', clinic: 'Westend Wellness', plan: 'Professional', seats: '14 / 22', adoption: 64, requests: '2,105' },
    { key: '5', clinic: 'Maplewood Dermatology', plan: 'Professional', seats: '8 / 9', adoption: 89, requests: '1,640' },
    { key: '6', clinic: 'Riverstone Cardiology', plan: 'Enterprise', seats: '35 / 41', adoption: 85, requests: '6,900' },
    { key: '7', clinic: 'Cedar Hill Clinic', plan: 'Basic', seats: '3 / 6', adoption: 50, requests: '210' },
    { key: '8', clinic: 'Greenfield Health', plan: 'Professional', seats: '12 / 18', adoption: 67, requests: '1,810' }
  ]

  const noteAuditLog = [
    { id: 'NA-9001', clinic: 'Bayview Family Clinic (Dr. Sarah Chen)', patient: 'P-4821', feature: 'Clinical Note Summarization', tokens: '—', reviewed: '—', status: 'Pending Review' },
    { id: 'NA-9002', clinic: 'Northside Dental (Dr. Amelia Park)', patient: 'P-5102', feature: 'Voice Dictation', tokens: '612 / 84 tokens', reviewed: 'May 13, 2026, 07:12 PM by Dr. Amelia Park', status: 'Edited' },
    { id: 'NA-9003', clinic: 'Maplewood Dermatology (Dr. Emily Rodriguez)', patient: 'P-3219', feature: 'Clinical Note Summarization', tokens: '540 / 0 tokens', reviewed: 'May 13, 2026, 04:38 PM by Dr. Emily Rodriguez', status: 'Accepted' },
    { id: 'NA-9004', clinic: 'Westend Wellness (Dr. David Okonkwo)', patient: 'P-6011', feature: 'Voice Dictation', tokens: '0 / 0 tokens', reviewed: 'May 12, 2026, 09:48 PM by Dr. David Okonkwo', status: 'Rejected' },
    { id: 'NA-9005', clinic: 'Riverstone Cardiology (Dr. M. Patel)', patient: 'P-7704', feature: 'Patient Q&A Assist', tokens: '—', reviewed: '—', status: 'Pending Review' }
  ]

  const complianceLogs = [
    { id: 'CL-3301', event: 'AI moderation policy v2.4 published', actor: 'Michael Ross', context: 'Added stricter PHI detection thresholds', date: 'May 13, 2026, 02:30 PM', severity: 'Info' },
    { id: 'CL-3302', event: 'PHI leak flag escalated to compliance', actor: 'System', context: 'MF-5501 - Westend Wellness - Clinical Note Summarization', date: 'May 13, 2026, 03:52 PM', severity: 'Critical' },
    { id: 'CL-3303', event: 'Prompt soap_summary_v3 activated', actor: 'Dr. Amelia Park', context: 'Replaced soap_summary_v2 (deprecated)', date: 'May 09, 2026, 04:54 PM', severity: 'Info' },
    { id: 'CL-3304', event: 'Manual override engaged for Voice Dictation', actor: 'Michael Ross', context: 'Disabled auto-finalize across all clinics for 24h', date: 'May 09, 2026, 12:45 AM', severity: 'Warning' },
    { id: 'CL-3305', event: 'Tier limit raised for Enterprise plan', actor: 'Sarah Chen', context: 'Monthly requests 20k -> 25k', date: 'May 05, 2026, 07:30 PM', severity: 'Info' }
  ]

  const [overrides, setOverrides] = useState([
    { key: '1', name: 'Global · all features', desc: 'Master kill switch — disables every AI feature platform-wide', date: 'Last updated Apr 22, 2026, 01:30 PM by Michael Ross', status: 'Enforced', enabled: true },
    { key: '2', name: 'Clinical Note Summarization', desc: 'Require clinician review before notes are auto-finalized', date: 'Last updated May 09, 2026, 05:30 PM by Compliance Team', status: 'Enforced', enabled: true },
    { key: '3', name: 'Voice Dictation', desc: 'Auto-finalize transcripts on >95% confidence', date: 'Last updated May 09, 2026, 12:45 AM by Michael Ross', status: 'Disabled', enabled: false },
    { key: '4', name: 'Billing Code Suggestion', desc: 'Require human confirmation before posting codes to invoices', date: 'Last updated May 01, 2026, 04:00 PM by Finance Engineering', status: 'Enforced', enabled: true },
    { key: '5', name: 'Patient Q&A Assist', desc: 'Block outputs that reference medications or dosages', date: 'Last updated Apr 30, 2026, 09:30 PM by Compliance Team', status: 'Enforced', enabled: true }
  ])

  return (
    <div className="space-y-6">
      {/* ── Title Header ── */}
      <div>
        <h1 className="text-xl font-bold text-slate-850 m-0 tracking-tight">AI Management</h1>
        <p className="text-slate-400 text-xs mt-1 font-semibold">Govern usage, cost, prompts, moderation, adoption, and safety controls for platform AI</p>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['AI Governance', 'Analytics', 'AI Safety'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border border-solid rounded-full cursor-pointer ${
              activeTab === tab 
                ? 'bg-[#8C4BFF] text-white border-[#8C4BFF]' 
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'AI Governance' && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly Requests</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">318K</h3>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">▲ +13.2% <span className="text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <SyncOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tokens Used</span>
                <h3 className="text-2xl font-black text-slate-805 mt-3 mb-0">152.6M</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">480 tokens / request</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <DatabaseOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly AI Cost</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">$5,724</h3>
                <span className="text-[9px] text-emerald-605 font-bold block mt-1">▲ +13.2% <span className="text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <DollarOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Open Moderation</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">2</h3>
                <span className="text-[9px] text-rose-500 font-bold block mt-1">3 active prompts</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <SafetyCertificateOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Cost and Usage Trend */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Usage & Cost Trend</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Monthly AI requests and dollar cost</span>
            </div>
          }>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aiTrendData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D2BE" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#30D2BE" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8C4BFF" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8C4BFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}K`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Area yAxisId="left" type="monotone" dataKey="requests" stroke="#30D2BE" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2.5} />
                  <Area yAxisId="right" type="monotone" dataKey="cost" stroke="#8C4BFF" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center text-xs font-bold text-slate-500 mt-4 select-none">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#30D2BE]" /> Requests</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8C4BFF]" /> Cost</span>
            </div>
          </Card>

          {/* AI Limits per Tier */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">AI Limits per Tier</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Monthly request quotas and feature entitlements</span>
            </div>
          }>
            <div className="space-y-6">
              {/* Basic */}
              <div className="space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Basic</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">200 req/mo · 100K tokens</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">158 / 200 used</span>
                </div>
                <Progress percent={79} strokeColor="#F59E0B" showInfo={false} size="small" />
                <div className="flex gap-1.5">
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Summarization</Tag>
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Translation</Tag>
                </div>
              </div>

              {/* Professional */}
              <div className="space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Professional</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">2,000 req/mo · 1.5M tokens</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">1,420 / 2,000 used</span>
                </div>
                <Progress percent={71} strokeColor="#F59E0B" showInfo={false} size="small" />
                <div className="flex gap-1.5 flex-wrap">
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Summarization</Tag>
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Voice Dictation</Tag>
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Translation</Tag>
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Q&A Assist</Tag>
                </div>
              </div>

              {/* Enterprise */}
              <div className="space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Enterprise</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">25,000 req/mo · 20M tokens</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">18,900 / 25,000 used</span>
                </div>
                <Progress percent={75} strokeColor="#F59E0B" showInfo={false} size="small" />
                <div className="flex gap-1.5 flex-wrap">
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">All features</Tag>
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Custom prompts</Tag>
                  <Tag className="rounded-full border-none font-bold text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700 px-2 py-0.2">Priority routing</Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* Prompt Management table */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">Prompt Management</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Active, draft, and deprecated prompts across features</span>
            </div>
          }>
            <Table
              dataSource={promptCatalog}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (id) => <span className="font-mono text-slate-400 font-semibold">{id}</span> },
                { title: 'NAME', dataIndex: 'name', render: (n) => <span className="font-mono font-bold text-slate-805">{n}</span> },
                { title: 'FEATURE', dataIndex: 'feature' },
                { title: 'VERSION', dataIndex: 'version', render: (v) => <span className="font-bold">{v}</span> },
                { title: 'OWNER', dataIndex: 'owner' },
                { title: 'LAST EDITED', dataIndex: 'date' },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Active' ? 'success' : s === 'Draft' ? 'warning' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {s}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>

          {/* AI Moderation table */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">AI Moderation</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">PHI leaks, hallucinations, toxic outputs, and bias flags</span>
            </div>
          }>
            <Table
              dataSource={moderationLog}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (id) => <span className="font-mono text-slate-400 font-semibold">{id}</span> },
                { title: 'CATEGORY', dataIndex: 'category', render: (c) => <span className="font-bold text-slate-800 dark:text-slate-200">{c}</span> },
                { title: 'FEATURE', dataIndex: 'feature' },
                { title: 'CLINIC / USER', dataIndex: 'user' },
                {
                  title: 'SEVERITY',
                  dataIndex: 'severity',
                  render: (sev) => (
                    <Tag color={sev === 'High' ? 'error' : sev === 'Medium' ? 'warning' : 'default'} className="border-none font-bold text-[9px] rounded-full px-2 py-0.2">
                      {sev}
                    </Tag>
                  )
                },
                { title: 'FLAGGED', dataIndex: 'date' },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Escalated' ? 'error' : s === 'Pending Review' ? 'warning' : 'success'} className="border-none font-bold text-[9px] rounded-full px-2 py-0.2 uppercase">
                      {s}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>

          {/* Prompt Studio */}
          <div className="space-y-3">
            <div className="text-xs">
              <span className="font-bold text-slate-805 text-sm block">Prompt Studio</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Author and review prompts powering each feature</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block">soap_summary_v3</span>
                    <FileTextOutlined className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">Clinical Note Summarization</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Version 3.2.1 - maintained by Dr. Amelia Park</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Tag color="success" className="border-none font-bold text-[9px] rounded-full px-2 py-0.2 uppercase">Active</Tag>
                  <Button size="small" type="link" className="p-0 font-bold text-xs text-[#8C4BFF] border-none bg-transparent" onClick={() => toast.success('Open Prompt Studio editor')}>Edit Prompt</Button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block">dictation_normalizer_v2</span>
                    <FileTextOutlined className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">Voice Dictation</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Version 2.5.0 - maintained by AI Platform Team</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Tag color="success" className="border-none font-bold text-[9px] rounded-full px-2 py-0.2 uppercase">Active</Tag>
                  <Button size="small" type="link" className="p-0 font-bold text-xs text-[#8C4BFF] border-none bg-transparent" onClick={() => toast.success('Open Prompt Studio editor')}>Edit Prompt</Button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block">cpt_code_recommender</span>
                    <FileTextOutlined className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">Billing Code Suggestion</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Version 1.8.3 - maintained by Finance Engineering</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Tag color="success" className="border-none font-bold text-[9px] rounded-full px-2 py-0.2 uppercase">Active</Tag>
                  <Button size="small" type="link" className="p-0 font-bold text-xs text-[#8C4BFF] border-none bg-transparent" onClick={() => toast.success('Open Prompt Studio editor')}>Edit Prompt</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Most-used Feature</span>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">Clinical</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">118.4K requests · 37%</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <SyncOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Requests (Month)</span>
                <h3 className="text-2xl font-black text-slate-805 mt-3 mb-0">318K</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">5 features in use</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <SyncOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time Saved / Clinician</span>
                <h3 className="text-2xl font-black text-slate-805 mt-3 mb-0">52 min/day</h3>
                <span className="text-[9px] text-emerald-605 font-bold block mt-1">▲ +8.3% <span className="text-slate-400 font-normal">vs last month</span></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <ClockCircleOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adoption Rate</span>
                <h3 className="text-2xl font-black text-slate-850 mt-3 mb-0">79%</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">134 of 170 users active</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-550">
                <UserOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* Most-used AI Features */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Most-used AI Features</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Requests per feature in the last 30 days</span>
            </div>
          }>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={analyticsFeaturesData} margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}K`} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="requests" fill="#8C4BFF" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Avg Dictation Time Saved */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Avg Dictation Time Saved</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Minutes saved per clinician per day from voice dictation</span>
            </div>
          }>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSavedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D2BE" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#30D2BE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="time" stroke="#30D2BE" fillOpacity={1} fill="url(#colorTime)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AI Adoption by Clinic */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-805 text-sm block">AI Adoption by Clinic</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Active vs total seats and weekly request volume</span>
            </div>
          }>
            <Table
              dataSource={adoptionClinics}
              pagination={false}
              columns={[
                { title: 'CLINIC', dataIndex: 'clinic', render: (c) => <span className="font-bold text-slate-805">{c}</span> },
                {
                  title: 'PLAN',
                  dataIndex: 'plan',
                  render: (p) => (
                    <Tag color={p === 'Enterprise' ? 'purple' : p === 'Professional' ? 'blue' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2 py-0.2">
                      {p}
                    </Tag>
                  )
                },
                { title: 'ACTIVE / TOTAL', dataIndex: 'seats' },
                {
                  title: 'ADOPTION',
                  dataIndex: 'adoption',
                  render: (pct) => (
                    <div className="flex items-center gap-2">
                      <Progress percent={pct} strokeColor={pct >= 70 ? '#30D2BE' : '#F59E0B'} showInfo={false} size="small" style={{ width: 60 }} />
                      <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                    </div>
                  )
                },
                { title: 'WEEKLY REQUESTS', dataIndex: 'requests', render: (r) => <span className="font-bold text-slate-705">{r}</span> }
              ]}
            />
          </Card>
        </div>
      )}

      {activeTab === 'AI Safety' && (
        <div className="space-y-6">
          {/* Safety Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Note Reviews</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">2</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Awaiting clinician sign-off</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <ClockCircleOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes Rejected</span>
                <h3 className="text-2xl font-black text-slate-805 mt-3 mb-0">1</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Last 30 days</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <SafetyCertificateOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reviewed Share</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">60%</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Of all AI-generated notes</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircleOutlined style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Overrides</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-3 mb-0">4 / 5</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Manual safety controls engaged</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <SlidersOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          {/* AI-Generated Note Audit */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-805 text-sm block">AI-Generated Note Audit</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Track which AI outputs were accepted, edited, or rejected</span>
            </div>
          }>
            <Table
              dataSource={noteAuditLog}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (id) => <span className="font-mono text-slate-400 font-semibold">{id}</span> },
                { title: 'CLINIC / CLINICIAN', dataIndex: 'clinic', render: (c) => <span className="font-bold text-slate-850">{c}</span> },
                { title: 'PATIENT', dataIndex: 'patient', render: (p) => <span className="font-mono text-slate-500">{p}</span> },
                { title: 'FEATURE', dataIndex: 'feature' },
                {
                  title: 'ACCEPTED / EDITED',
                  dataIndex: 'tokens',
                  render: (t) => {
                    if (t.includes('/')) {
                      const parts = t.split('/')
                      return (
                        <span className="font-bold">
                          <span className="text-emerald-500">{parts[0]}</span> / <span className="text-amber-500">{parts[1]}</span>
                        </span>
                      )
                    }
                    return <span>{t}</span>
                  }
                },
                { title: 'REVIEWED', dataIndex: 'reviewed' },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Accepted' ? 'success' : s === 'Edited' ? 'processing' : s === 'Rejected' ? 'error' : 'warning'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {s}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>

          {/* Compliance Logging */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-805 text-sm block">Compliance Logging</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Policy publishes, escalations, and override changes</span>
            </div>
          }>
            <Table
              dataSource={complianceLogs}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', render: (id) => <span className="font-mono text-slate-400 font-semibold">{id}</span> },
                { title: 'EVENT', dataIndex: 'event', render: (e) => <span className="font-bold text-slate-750">{e}</span> },
                { title: 'ACTOR', dataIndex: 'actor' },
                { title: 'CONTEXT', dataIndex: 'context' },
                { title: 'TIMESTAMP', dataIndex: 'date' },
                {
                  title: 'SEVERITY',
                  dataIndex: 'severity',
                  render: (sev) => (
                    <Tag color={sev === 'Critical' ? 'error' : sev === 'Warning' ? 'warning' : 'processing'} className="border-none font-bold text-[9px] rounded-full px-2.5 py-0.2">
                      {sev}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>

          {/* Manual Override Controls */}
          <div className="space-y-3">
            <div className="text-xs">
              <span className="font-bold text-slate-805 text-sm block">Manual Override Controls</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Toggle safety behaviors and feature kill-switches across the platform</span>
            </div>

            <div className="space-y-3">
              {overrides.map((item, index) => (
                <div key={item.key} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{item.name}</span>
                    <span className="text-[10px] text-slate-450 font-medium block mt-1">{item.desc}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag color={item.enabled ? 'success' : 'default'} className="border-none font-bold text-[9px] rounded-full px-2 py-0.5 m-0">
                      {item.enabled ? 'Enforced' : 'Disabled'}
                    </Tag>
                    <Switch checked={item.enabled} style={{ backgroundColor: item.enabled ? '#8C4BFF' : undefined }} onChange={(v) => {
                      setOverrides(p => {
                        const copy = [...p]
                        copy[index].enabled = v
                        return copy
                      })
                      toast.success(`Override behavior for "${item.name}" ${v ? 'Enforced' : 'Disabled'}`)
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
