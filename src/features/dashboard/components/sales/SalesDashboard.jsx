import React, { useState } from 'react'
import { Button, Timeline, Tag, Modal, List, Badge } from 'antd'
import {
  TeamOutlined, DollarOutlined, PercentageOutlined, PlusOutlined,
  CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined,
  MobileOutlined, DesktopOutlined, PhoneOutlined, ApartmentOutlined,
  FireOutlined, ThunderboltOutlined, BellOutlined, SendOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'

export default function SalesDashboard({ store, navigate, modalContext }) {
  const { leads, clinics, salesTasks, salesCalendarEvents, darkMode } = store
  const [mobileMode, setMobileMode] = useState(false)
  const [callLeadModalOpen, setCallLeadModalOpen] = useState(false)

  React.useEffect(() => {
    if (store.fetchLeads) store.fetchLeads()
    if (store.fetchSalesTasks) store.fetchSalesTasks()
    if (store.fetchSalesCalendarEvents) store.fetchSalesCalendarEvents()
    if (store.fetchSalesClinics) store.fetchSalesClinics()
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

  const repCommissionRate = (parseFloat(store.user?.profileData?.commissionRate || store.salesProfile?.commissionRate) || 10.0) / 100
  const colinClinics = (clinics || []).filter(c => isMatchingRep(c.salesperson))
  const myLeads = (leads || []).filter(l => isMatchingRep(l.assignedTo || l.salesperson))
  const convertedLeads = myLeads.filter(l => l.stage === 'Converted' || l.stage === 'Closed Won')
  const totalLeads = myLeads.length
  const demosBooked = salesCalendarEvents.filter(e => e.type === 'Demos' || e.type === 'Demo Scheduled').length
  const clinicsConverted = Math.max(colinClinics.length, convertedLeads.length)
  const totalMrr = colinClinics.reduce((sum, c) => sum + (parseFloat(c.revenue) || 0), 0) || convertedLeads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0)
  const pendingCommissions = colinClinics.filter(c => c.commissionStatus === 'Pending').reduce((sum, c) => sum + (parseFloat(c.revenue) * repCommissionRate), 0)
  const paidCommissions = colinClinics.filter(c => c.commissionStatus === 'Paid').reduce((sum, c) => sum + (parseFloat(c.revenue) * repCommissionRate), 0)
  const totalCommissionsEarned = (pendingCommissions + paidCommissions) || (totalMrr * repCommissionRate)
  const activeClinicsCount = Math.max(colinClinics.filter(c => c.status === 'Active').length, convertedLeads.length)
  const thisMonthCommission = totalMrr * repCommissionRate
  const pendingTasks = salesTasks.filter(t => t.status !== 'Completed')
  const trialClinics = colinClinics.filter(c => c.status === 'Trial')
  const today = new Date()
  const tasksDueToday = salesTasks.filter(t => t.status !== 'Completed' && t.dueDate === today.toISOString().split('T')[0]).length
  const upcomingDemos = salesCalendarEvents.filter(e => e.type === 'Demos' || e.type === 'Demo Scheduled').slice(0, 3)
  const activityLogs = leads
    .flatMap(l => (l.history || []).map(h => ({ ...h, clinicName: l.name })))
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6)

  const basePath = window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '/sales'

  const stats = [
    { label: 'Total Leads', value: totalLeads, color: '#3B82F6', sub: 'leads registered', trend: '+2 this week' },
    { label: 'Demos Booked', value: demosBooked, color: '#F59E0B', sub: 'scheduled events', trend: `${demosBooked} upcoming` },
    { label: 'Clinics Converted', value: clinicsConverted, color: '#10B981', sub: 'deals won', trend: 'All time' },
    { label: 'MRR Generated', value: `$${(totalMrr || 0).toLocaleString()}`, color: '#8C4BFF', sub: 'monthly value', trend: 'recurring' },
    { label: 'Commission Earned', value: `$${Math.round(totalCommissionsEarned || 0).toLocaleString()}`, color: '#EC4899', sub: `$${Math.round(paidCommissions || 0).toLocaleString()} paid`, trend: `$${Math.round(pendingCommissions || 0).toLocaleString()} pending` },
    { label: 'Active Clinics', value: activeClinicsCount, color: '#06B6D4', sub: 'live practices', trend: 'On platform' },
  ]

  const quickActions = [
    { label: 'New Lead', icon: <PlusOutlined />, color: '#3B82F6', action: () => modalContext.setLeadModalOpen(true) },
    { label: 'Book Demo', icon: <CalendarOutlined />, color: '#F59E0B', action: () => modalContext.setDemoModalOpen(true) },
    { label: 'Add Task', icon: <CheckCircleOutlined />, color: '#10B981', action: () => modalContext.setTaskModalOpen(true) },
    { label: 'Send Proposal', icon: <SendOutlined />, color: '#8C4BFF', action: () => modalContext.setProposalModalOpen(true) },
    { label: 'Convert Clinic', icon: <ThunderboltOutlined />, color: '#EC4899', action: () => modalContext.setConvertModalOpen(true) },
  ]

  const handleToggleTaskStatus = (task) => {
    const nextStatus = task.status === 'In Progress' ? 'Completed' : 'In Progress'
    store.updateSalesTask(task.id, { status: nextStatus })
    toast.success(nextStatus === 'Completed' ? 'Task completed!' : 'Task in progress.')
  }

  const handleQuickCall = (lead) => {
    store.addLeadActivity(lead.id, `Logged Outbound Call with ${lead.contactPerson}`)
    toast.success(`Calling ${lead.name}... Call logged!`)
    setCallLeadModalOpen(false)
  }

  return (
    <div className="space-y-6">

      {/* ── Welcome Header ── */}
      <div
        className="p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ background: darkMode ? 'linear-gradient(135deg,#0E1B33 0%,#1E293B 100%)' : '#FFFFFF', borderColor: darkMode ? '#1E293B' : '#E2E8F0' }}
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8C4BFF] block mb-1">Sales Executive</span>
          <h1 className="text-2xl font-black m-0 tracking-tight" style={{ color: darkMode ? '#FFFFFF' : '#0F172A' }}>
            Hello, {currentRepName || 'Sales Executive'}! 👋
          </h1>
          <p className="text-xs mt-1 font-semibold" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &bull; {pendingTasks.length} tasks pending &bull; {activeClinicsCount} active clinics
          </p>
        </div>
        <div
          className="flex items-center gap-2 p-2 rounded-xl border"
          style={{ backgroundColor: darkMode ? 'rgba(2,6,17,0.4)' : '#F1F5F9', borderColor: darkMode ? 'rgba(30,41,59,0.8)' : '#E2E8F0' }}
        >
          <span className="text-xs font-bold" style={{ color: darkMode ? '#D1D5DB' : '#475569' }}>View:</span>
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: darkMode ? 'rgba(2,6,17,0.6)' : '#E2E8F0' }}>
            <Button size="small" icon={<DesktopOutlined />} onClick={() => setMobileMode(false)}
              className="rounded border-none text-[10px] font-bold"
              style={{ backgroundColor: !mobileMode ? '#8C4BFF' : 'transparent', color: !mobileMode ? '#FFF' : (darkMode ? '#94A3B8' : '#475569') }}>
              Desktop CRM
            </Button>
            <Button size="small" icon={<MobileOutlined />} onClick={() => setMobileMode(true)}
              className="rounded border-none text-[10px] font-bold"
              style={{ backgroundColor: mobileMode ? '#8C4BFF' : 'transparent', color: mobileMode ? '#FFF' : (darkMode ? '#94A3B8' : '#475569') }}>
              Mobile App
            </Button>
          </div>
        </div>
      </div>

      {mobileMode ? (
        /* ── MOBILE VIEW ── */
        <div className="flex justify-center py-4 select-none">
          <div className="w-[360px] h-[720px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col overflow-hidden">
            <div className="flex-1 bg-[#F8FAFC] rounded-[30px] overflow-y-auto px-4 pt-6 pb-4 space-y-4 flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">SALES APP</span>
                  <h2 className="text-sm font-black text-slate-800 m-0">{currentRepName || 'Sales Executive'}</h2>
                </div>
                <Badge count={pendingTasks.length} size="small">
                  <Button shape="circle" size="small" icon={<BellOutlined />} />
                </Badge>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Quick Actions</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: 'Add Lead', i: <PlusOutlined />, c: 'bg-blue-500/10 text-blue-500', a: () => modalContext.setLeadModalOpen(true) },
                    { l: 'Call', i: <PhoneOutlined />, c: 'bg-emerald-500/10 text-emerald-500', a: () => setCallLeadModalOpen(true) },
                    { l: 'Demo', i: <CalendarOutlined />, c: 'bg-purple-500/10 text-purple-500', a: () => modalContext.setDemoModalOpen(true) },
                    { l: 'Calendar', i: <ClockCircleOutlined />, c: 'bg-amber-500/10 text-amber-500', a: () => navigate(`${basePath}/calendar`) },
                  ].map(q => (
                    <button key={q.l} onClick={q.a} className="bg-white border border-slate-100 p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${q.c}`}>{q.i}</div>
                      <span className="text-[8px] font-bold text-slate-600">{q.l}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { l: 'Pipeline', a: () => navigate(`${basePath}/pipeline`) },
                    { l: 'Commissions', a: () => navigate(`${basePath}/commissions`) },
                    { l: 'Messages', a: () => navigate(`${basePath}/messages`) },
                  ].map(q => (
                    <button key={q.l} onClick={q.a} className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-center cursor-pointer">
                      <span className="text-[8px] font-bold text-slate-600">{q.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stats.slice(0, 4).map(s => (
                  <div key={s.label} className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">{s.label}</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{s.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tasks</span>
                  <span onClick={() => navigate(`${basePath}/tasks`)} className="text-[9px] text-[#8C4BFF] font-black cursor-pointer">All</span>
                </div>
                {pendingTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-xl mb-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={t.status === 'Completed'} onChange={() => handleToggleTaskStatus(t)} className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold text-slate-700 truncate">{t.title}</span>
                    </div>
                    <Tag color={t.priority === 'High' ? 'red' : 'blue'} className="text-[7px] m-0">{t.priority}</Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── DESKTOP VIEW ── */
        <div className="space-y-6">

          {/* Top Quick Action Bar */}
          <div className="flex flex-wrap gap-2">
            {quickActions.map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: btn.color }}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-black tracking-wider block mb-3">{s.label}</span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white m-0">{s.value}</h3>
                <span className="text-slate-400 text-[9px] font-semibold block mt-1">{s.sub}</span>
                <span className="text-[9px] font-bold block mt-0.5" style={{ color: s.color }}>{s.trend}</span>
              </div>
            ))}
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">

              {/* Upcoming Activities Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                    <BellOutlined className="text-amber-500" /> Upcoming Activities
                  </span>
                  <button onClick={() => navigate(`${basePath}/calendar`)} className="text-xs text-[#8C4BFF] font-bold hover:underline focus:outline-none">View All →</button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {upcomingDemos.length > 0 ? upcomingDemos.map((demo, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0"><CalendarOutlined /></div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{demo.title || 'Demo Scheduled'}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{demo.date}</span>
                      </div>
                      <Tag color="orange" className="rounded-full border-none font-bold text-[8px] px-2 shrink-0">Demo</Tag>
                    </div>
                  )) : (
                    <div className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-400 shrink-0"><CalendarOutlined /></div>
                      <span className="text-xs text-slate-400 font-semibold">No upcoming demos scheduled</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 shrink-0"><FireOutlined /></div>
                    <div className="flex-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Tasks Due Today</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{tasksDueToday} task{tasksDueToday !== 1 ? 's' : ''} require attention</span>
                    </div>
                    {tasksDueToday > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{tasksDueToday}</span>}
                  </div>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 shrink-0"><ClockCircleOutlined /></div>
                    <div className="flex-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Clinics in Trial</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{trialClinics.length} clinic{trialClinics.length !== 1 ? 's' : ''} on trial — follow up!</span>
                    </div>
                    {trialClinics.length > 0 && <span className="bg-purple-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{trialClinics.length}</span>}
                  </div>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shrink-0"><DollarOutlined /></div>
                    <div className="flex-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">This Month's Commission</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Based on active MRR at 12% rate</span>
                    </div>
                    <span className="text-emerald-500 font-extrabold text-sm">${Math.round(thisMonthCommission).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Active Tasks */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-700 dark:text-white">
                    Active Tasks <span className="text-slate-400 font-bold">({pendingTasks.length})</span>
                  </span>
                  <button onClick={() => navigate(`${basePath}/tasks`)} className="text-xs text-[#8C4BFF] font-bold hover:underline focus:outline-none">View All →</button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {pendingTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={task.status === 'Completed'} onChange={() => handleToggleTaskStatus(task)}
                          className="w-4 h-4 rounded border-slate-300 text-[#8C4BFF] focus:ring-[#8C4BFF] cursor-pointer" />
                        <div>
                          <span className={`font-bold text-xs block ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold capitalize">{task.category} &bull; {task.leadName} &bull; Due: {task.dueDate}</span>
                        </div>
                      </div>
                      <Tag color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'blue'}
                        className="text-[8px] font-bold uppercase rounded-full border-none px-2 m-0 shrink-0">{task.priority}</Tag>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">🎉 All caught up! No pending tasks.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">

              {/* Commission Summary Card */}
              <div className="bg-gradient-to-br from-[#8C4BFF] to-[#6B2FCC] rounded-2xl p-5 text-white shadow-lg shadow-[#8C4BFF]/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block">This Month</span>
                    <h3 className="text-3xl font-black m-0 mt-1">${Math.round(thisMonthCommission).toLocaleString()}</h3>
                    <span className="text-[10px] font-semibold text-white/70">Commission earnings</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <PercentageOutlined className="text-white text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
                  <div>
                    <span className="text-[9px] text-white/60 font-bold uppercase block">Paid</span>
                    <span className="text-sm font-extrabold">${Math.round(paidCommissions).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/60 font-bold uppercase block">Pending</span>
                    <span className="text-sm font-extrabold">${Math.round(pendingCommissions).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => navigate(`${basePath}/commissions`)}
                  className="mt-4 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all text-center block">
                  View Full Commission Ledger →
                </button>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-700 dark:text-white">Recent Activity</span>
                  <button onClick={() => navigate(`${basePath}/leads`)} className="text-xs text-[#8C4BFF] font-bold hover:underline focus:outline-none">Leads Log →</button>
                </div>
                <div className="p-4">
                  {activityLogs.length > 0 ? (
                    <Timeline
                      className="mt-1"
                      items={activityLogs.map(log => ({
                        color: log.text?.includes('Converted') ? 'green' : log.text?.includes('Proposal') ? 'purple' : 'blue',
                        content: (
                          <div className="text-xs pb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{log.clinicName}</span>
                            <span className="text-slate-500 dark:text-slate-400 block">{log.text}</span>
                            <span className="text-slate-400 block text-[9px] mt-0.5 font-semibold">{log.time}</span>
                          </div>
                        )
                      }))}
                    />
                  ) : (
                    <div className="text-slate-400 text-xs text-center py-8">No activities recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Lead Modal */}
      <Modal open={callLeadModalOpen} onCancel={() => setCallLeadModalOpen(false)}
        title={<span className="font-black text-slate-800 dark:text-white text-base">Select Lead to Call</span>}
        footer={null} destroyOnHidden>
        <List
          dataSource={leads.filter(l => l.stage !== 'Converted')}
          renderItem={lead => (
            <List.Item
              actions={[
                <Button type="primary" shape="circle" icon={<PhoneOutlined />} onClick={() => handleQuickCall(lead)}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} />
              ]}
              className="px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            >
              <List.Item.Meta
                title={<span className="font-bold text-slate-800 dark:text-white text-xs">{lead.name}</span>}
                description={
                  <div className="text-[10px] font-semibold text-slate-400">
                    {lead.contactPerson} &bull; <span className="font-mono">{lead.contact}</span>
                    &bull; <Tag color="blue" className="text-[8px] border-none rounded-full m-0">{lead.stage}</Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  )
}
