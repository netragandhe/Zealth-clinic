import React, { useState } from 'react'
import { Tag, Button, Progress, Drawer, Select } from 'antd'
import { ApartmentOutlined, CalendarOutlined, CheckCircleOutlined, CreditCardOutlined, RiseOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

const { Option } = Select

export default function SalesClinics({ store: propStore }) {
  const localStore = useClinicStore()
  const store = propStore || localStore
  const { clinics, leads } = store

  React.useEffect(() => {
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
    // Also show clinics with generic "sales executive" default (set during conversion)
    if (sp === 'sales executive') return true
    return sp.includes(cur) || cur.includes(sp)
  }

  // Combine database clinics + converted sales leads for the active Sales Executive
  const dbClinicsFormatted = (clinics || [])
    .filter(c => isMatchingRep(c.salesperson))
    .map(c => ({
      id: c.id,
      name: c.name,
      contactPerson: c.contactPerson || c.name,
      email: c.email || '',
      state: c.state || c.country || 'General',
      tier: c.tier || 'Basic',
      revenue: parseFloat(c.revenue) || 100,
      status: c.status || 'Active',
      salesperson: c.salesperson || currentRepName,
      signupDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
      onboardingSteps: (typeof c.onboardingSteps === 'string' 
        ? JSON.parse(c.onboardingSteps) 
        : c.onboardingSteps) || [true, false, false, false, false],
      isLead: false,
    }))

  const convertedLeadsFormatted = (leads || [])
    .filter(l => l.stage === 'Converted' || l.status === 'Converted')
    .filter(l => isMatchingRep(l.assignedTo || l.salesperson))
    .map(l => ({
      id: l.id,
      name: l.name || l.companyName,
      contactPerson: l.contactPerson || l.name || l.companyName,
      email: l.email || '',
      state: l.location || l.territory || 'General Platform',
      tier: l.tier || 'Basic',
      revenue: parseFloat(l.value) || 100,
      status: 'Active',
      salesperson: l.assignedTo || currentRepName,
      signupDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent',
      onboardingSteps: [true, false, false, false, false],
      isLead: true,
    }))

  const dbClinicNames = new Set(dbClinicsFormatted.map(c => c.name.toLowerCase().trim()))
  const filteredConvertedLeads = convertedLeadsFormatted.filter(l => !dbClinicNames.has(l.name.toLowerCase().trim()))

  const colinClinics = [...dbClinicsFormatted, ...filteredConvertedLeads]
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [onboardingStates, setOnboardingStates] = useState(() => {
    try {
      const saved = localStorage.getItem('legacyOnboardingStates')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const standardSteps = [
    'Account Initialization',
    'Staff Onboarding Training Call',
    'Database CSV Client Migration',
    'Custom Template Setup',
    'DNS Configuration Setup',
  ]

  const getClinicOnboarding = (clinicId) => {
    if (onboardingStates[clinicId]) return onboardingStates[clinicId]
    const c = colinClinics.find(x => x.id === clinicId)
    return c?.onboardingSteps || [true, false, false, false, false]
  }

  const handleToggleStep = async (clinicId, index) => {
    const c = colinClinics.find(x => x.id === clinicId)
    const current = [...getClinicOnboarding(clinicId)]
    current[index] = !current[index]
    
    if (c?.isLead) {
      // Legacy leads don't have a DB clinic yet, update local state only so UI works
      const newState = { ...onboardingStates, [clinicId]: current }
      setOnboardingStates(newState)
      localStorage.setItem('legacyOnboardingStates', JSON.stringify(newState))
      toast.success(`Updated (Legacy Lead): ${standardSteps[index]}`)
      return
    }
    
    // Database and optimistic update via store
    if (store.updateClinicOnboarding) {
      await store.updateClinicOnboarding(clinicId, current)
      toast.success(`Updated: ${standardSteps[index]}`)
    }
  }

  const handlePlanUpgrade = (newTier) => {
    // Dynamic lookup from subscriptionPlans
    const planMatch = store.subscriptionPlans?.find(p => p.name === newTier)
    const newRevenue = planMatch ? planMatch.monthlyPrice : 100

    const updated = { ...selectedClinic, tier: newTier, revenue: newRevenue, value: newRevenue }
    if (selectedClinic?.isLead) {
      if (store.updateLead) store.updateLead(updated)
    } else {
      if (store.editClinic) store.editClinic(updated)
    }
    setSelectedClinic(updated)
    toast.success(`Plan upgraded to ${newTier} ($${newRevenue}/mo)`)
  }

  const getProgressPercent = (clinicId) => {
    const steps = getClinicOnboarding(clinicId)
    return Math.round((steps.filter(Boolean).length / steps.length) * 100)
  }

  const getTierColors = (tier) => {
    if (tier === 'Enterprise') return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', tag: 'purple' }
    if (tier === 'Pro') return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', tag: 'orange' }
    return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', tag: 'blue' }
  }

  // Summary stats
  const totalMrr = colinClinics.reduce((s, c) => s + (parseFloat(c.revenue) || 0), 0)
  const activeClinics = colinClinics.filter(c => c.status === 'Active').length
  const totalCommission = totalMrr * 0.12

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white m-0">My Converted Clinics</h2>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
            Manage onboarding, subscriptions, and upgrade opportunities.
          </p>
        </div>
        {/* Quick Stats */}
        <div className="flex gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Total MRR</span>
            <span className="text-sm font-black text-[#8C4BFF]">${totalMrr.toLocaleString()}/mo</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Commission</span>
            <span className="text-sm font-black text-emerald-500">${Math.round(totalCommission).toLocaleString()}/mo</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Active</span>
            <span className="text-sm font-black text-slate-800 dark:text-white">{activeClinics}</span>
          </div>
        </div>
      </div>

      {/* Clinic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {colinClinics.map(c => {
          const progress = getProgressPercent(c.id)
          const tierStyle = getTierColors(c.tier)
          const commission = parseFloat(c.revenue) * 0.12

          return (
            <div
              key={c.id}
              onClick={() => setSelectedClinic(c)}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#8C4BFF] transition-all cursor-pointer flex flex-col justify-between group"
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm m-0 group-hover:text-[#8C4BFF] transition-colors truncate">{c.name}</h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{c.contactPerson} &bull; {c.state}</span>
                </div>
                <Tag color={tierStyle.tag} className="rounded-full border-none font-bold text-[8px] px-2 m-0 ml-2 shrink-0">{c.tier}</Tag>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Monthly MRR</span>
                  <span className="text-sm font-black text-[#8C4BFF] block mt-0.5">${c.revenue}/mo</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">My Commission</span>
                  <span className="text-sm font-black text-emerald-500 block mt-0.5">${commission.toFixed(0)}/mo</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className={`text-xs font-extrabold block mt-0.5 ${c.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>{c.status}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Signed Up</span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mt-0.5">{c.signupDate}</span>
                </div>
              </div>

              {/* Onboarding Progress */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                  <span>ONBOARDING PROGRESS</span>
                  <span className={progress === 100 ? 'text-emerald-500' : 'text-amber-500'}>{progress}%</span>
                </div>
                <Progress
                  percent={progress}
                  size="small"
                  showInfo={false}
                  strokeColor={progress === 100 ? '#10B981' : '#F59E0B'}
                  railColor="rgba(148,163,184,0.15)"
                />
                {progress === 100 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircleOutlined className="text-emerald-500 text-[10px]" />
                    <span className="text-[9px] text-emerald-500 font-bold">Fully Onboarded</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {colinClinics.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <ApartmentOutlined className="text-4xl text-slate-300 dark:text-slate-700 block mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-semibold">🌱 No clinics converted yet.</p>
            <p className="text-slate-400 text-[10px]">Move leads to "Converted" in the pipeline to start onboarding!</p>
          </div>
        )}
      </div>

      {/* Clinic Detail Drawer */}
      <Drawer
        open={!!selectedClinic}
        onClose={() => setSelectedClinic(null)}
        width={480}
        destroyOnHidden
        title={
          <div>
            <span className="font-black text-slate-800 dark:text-white text-base block">{selectedClinic?.name}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Onboarding & Subscription Management</span>
          </div>
        }
        footer={
          <div className="flex justify-between items-center px-2 py-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              danger
              type="text"
              onClick={async () => {
                if (selectedClinic) {
                  if (selectedClinic.isLead) {
                    if (store.deleteLead) await store.deleteLead(selectedClinic.id)
                  } else {
                    if (store.deleteClinic) await store.deleteClinic(selectedClinic.id)
                  }
                  toast.success(`Clinic "${selectedClinic.name}" removed successfully.`)
                  setSelectedClinic(null)
                }
              }}
              className="font-bold text-xs"
            >
              Delete Clinic
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setSelectedClinic(null)} className="font-bold rounded-xl text-xs h-9">Cancel</Button>
              <Button type="primary" onClick={() => { setSelectedClinic(null); toast.success('Changes saved successfully!'); }} className="font-bold rounded-xl text-xs h-9 bg-[#8C4BFF] border-none hover:bg-[#7b3de6] shadow-sm shadow-[#8C4BFF]/20">Save Changes</Button>
            </div>
          </div>
        }
      >
        {selectedClinic && (
          <div className="space-y-6">

            {/* Clinic Info Block */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Contact</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{selectedClinic.contactPerson}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Email</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold truncate block">{selectedClinic.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Plan Tier</span>
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{selectedClinic.tier}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Monthly MRR</span>
                  <span className="text-[#8C4BFF] font-extrabold">${selectedClinic.revenue}/mo</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Status</span>
                  <span className={`font-extrabold ${selectedClinic.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedClinic.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">My Commission</span>
                  <span className="text-emerald-500 font-extrabold">${(parseFloat(selectedClinic.revenue) * 0.12).toFixed(2)}/mo</span>
                </div>
              </div>
            </div>

            {/* Upgrade Plan */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Upgrade Subscription Plan</span>
              <Select value={selectedClinic.tier} onChange={handlePlanUpgrade} className="w-full rounded-xl">
                {store.subscriptionPlans?.length > 0 ? (
                  store.subscriptionPlans.map((plan) => (
                    <Option key={plan.id} value={plan.name}>
                      {plan.name} — ${plan.monthlyPrice}/mo
                    </Option>
                  ))
                ) : (
                  <>
                    <Option value="Basic">Basic — $100/mo</Option>
                    <Option value="Pro">Pro — $250/mo</Option>
                    <Option value="Enterprise">Enterprise — $1,000/mo</Option>
                  </>
                )}
              </Select>
              <span className="text-[9px] text-slate-400 font-semibold block">Changes are applied immediately and reflected on all dashboards.</span>
            </div>

            {/* Onboarding Checklist */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Onboarding Checklist</span>
                <Tag color="purple" className="m-0 border-none font-bold text-[9px] px-2">
                  {getProgressPercent(selectedClinic.id)}% Complete
                </Tag>
              </div>
              <Progress
                percent={getProgressPercent(selectedClinic.id)}
                size="small"
                showInfo={false}
                strokeColor={getProgressPercent(selectedClinic.id) === 100 ? '#10B981' : '#F59E0B'}
              />
              <div className="space-y-2">
                {standardSteps.map((step, idx) => {
                  const isChecked = getClinicOnboarding(selectedClinic.id)[idx]
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleStep(selectedClinic.id, idx)}
                      className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:border-purple-200 dark:hover:border-purple-900 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-[#8C4BFF] focus:ring-[#8C4BFF] shrink-0"
                      />
                      <span className={`text-xs font-semibold ${isChecked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {step}
                      </span>
                      {isChecked && <CheckCircleOutlined className="text-emerald-500 text-xs ml-auto shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  )
}
