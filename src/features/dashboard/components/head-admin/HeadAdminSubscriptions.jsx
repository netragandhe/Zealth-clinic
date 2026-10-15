import React, { useState } from 'react'
import { Card, Button, Tag, Switch, Modal, Form, Input, Select, Space, Table } from 'antd'
import {
  PlusOutlined, ClockCircleOutlined, StarOutlined, FileTextOutlined, CrownOutlined,
  RocketOutlined, GlobalOutlined, CheckOutlined, CloseOutlined, EditOutlined, DeleteOutlined, SyncOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '@/api/axios'

const { Option } = Select

export default function HeadAdminSubscriptions() {
  // Set to true whenever Tier Management is needed again
  const SHOW_TIER_MANAGEMENT = false

  const [activeTab, setActiveTab] = useState('Subscription Management')
  const [billingCycle, setBillingCycle] = useState('Monthly Subscription')

  const [packages, setPackages] = useState({})

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
        continue
      }
    }
    return null
  }

  const fetchSubscriptionsFromBackend = async () => {
    const json = await backendFetch('/super-admin/subscription-plans')
    if (json && json.success && Array.isArray(json.data)) {
      const fetchedPackages = {}
      json.data.forEach((sub, idx) => {
        const key = sub.id || `sub_${idx}`
        fetchedPackages[key] = {
          id: sub.id,
          name: sub.name || 'Package',
          price: sub.monthlyPrice || 0,
          enabled: sub.isActive !== false,
          features: Array.isArray(sub.features) && sub.features.length > 0 ? sub.features : [
            { text: 'Basic Patient Management', hasBullet: true },
            { text: 'Appointment Scheduling', hasBullet: true },
            { text: 'Clinical Notes', hasBullet: false, isIndented: true },
            { text: 'Clinical Auto-Summarization', hasBullet: true }
          ]
        }
      })
      setPackages(fetchedPackages)
    }
  }

  React.useEffect(() => {
    fetchSubscriptionsFromBackend()
  }, [])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newForm] = Form.useForm()

  const handleAddPackage = async (values) => {
    const key = values.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const newPkg = {
      name: values.name,
      price: values.price || 50,
      enabled: true,
      features: [
        { text: 'Basic Patient Management', hasBullet: true },
        { text: 'Appointment Scheduling', hasBullet: true },
        { text: 'Clinical Notes', hasBullet: false, isIndented: true },
        { text: 'Clinical Auto-Summarization', hasBullet: true }
      ]
    }
    setPackages(prev => ({
      ...prev,
      [key]: newPkg
    }))

    await backendFetch('/super-admin/subscription-plans', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name,
        monthlyPrice: values.price || 50,
        features: [
          { text: 'Basic Patient Management', hasBullet: true },
          { text: 'Appointment Scheduling', hasBullet: true },
          { text: 'Clinical Notes', hasBullet: false, isIndented: true },
          { text: 'Clinical Auto-Summarization', hasBullet: true }
        ],
        isActive: true
      })
    })

    toast.success(`Package "${values.name}" created and saved to database!`)
    setIsAddOpen(false)
    newForm.resetFields()
    await fetchSubscriptionsFromBackend()
  }

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [editForm] = Form.useForm()

  const handleOpenEdit = (key) => {
    const pack = packages[key]
    if (!pack) return
    setEditingKey(key)
    editForm.setFieldsValue({
      name: pack.name,
      price: pack.price
    })
    setIsEditOpen(true)
  }

  const handleSaveEditPackage = async (values) => {
    if (!editingKey) return
    const pack = packages[editingKey]
    setPackages(prev => ({
      ...prev,
      [editingKey]: {
        ...prev[editingKey],
        name: values.name,
        price: values.price
      }
    }))

    if (pack && pack.id) {
      await backendFetch(`/super-admin/subscription-plans/${pack.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: values.name,
          monthlyPrice: values.price
        })
      })
    }

    toast.success(`Package "${values.name}" updated in database!`)
    setIsEditOpen(false)
    setEditingKey(null)
  }

  const handleToggleEnable = async (key, val) => {
    setPackages(prev => ({ ...prev, [key]: { ...prev[key], enabled: val } }))
    const pack = packages[key]
    if (pack && pack.id) {
      await backendFetch(`/super-admin/subscription-plans/${pack.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: val })
      })
      toast.success(`Package "${pack.name}" ${val ? 'enabled' : 'disabled'} and synced with landing page!`)
    }
  }

  const handleDeletePackage = async (key) => {
    const pack = packages[key]
    if (!pack) return
    if (pack.id) {
      await backendFetch(`/super-admin/subscription-plans/${pack.id}`, {
        method: 'DELETE'
      })
    }
    setPackages(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
    toast.success(`Package "${pack.name}" deleted and removed from landing page!`)
  }

  // Tiers and Billing Cycle
  const [tierCycle, setTierCycle] = useState('MONTHLY')

  // Coupons data state (clean empty array)
  const [coupons, setCoupons] = useState([])

  // Automated Billing states
  const [billingRules, setBillingRules] = useState({
    recurring: true,
    suspend: true,
    invoice: true,
    retryAttempts: 3,
    retryInterval: 3,
    gracePeriod: 7
  })

  // Failed retries list (clean empty array)
  const [failedRetries, setFailedRetries] = useState([])

  // Auto Invoices list (clean empty array)
  const [autoInvoices, setAutoInvoices] = useState([])

  // White-label master switches and clinics (clean empty array)
  const [wlMaster, setWlMaster] = useState(true)
  const [wlClinics, setWlClinics] = useState([])

  // Branding Approval Queue (clean empty array)
  const [approvalQueue, setApprovalQueue] = useState([])

  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false)
  const [couponForm] = Form.useForm()

  const handleAddCoupon = (values) => {
    const newCoupon = {
      key: String(coupons.length + 1),
      code: values.code.toUpperCase(),
      desc: values.desc,
      discount: values.discount,
      applies: values.applies || 'All packages',
      validity: 'Jun 10, 2026 - Dec 31, 2026',
      usage: '0 / ∞',
      status: 'Active'
    }
    setCoupons([newCoupon, ...coupons])
    toast.success(`Coupon code "${values.code}" added successfully!`)
    setIsAddCouponOpen(false)
    couponForm.resetFields()
  }

  const packageList = Object.values(packages)
  const activePackages = packageList.filter(p => p.enabled)
  const monthlySubscriptionCount = activePackages.length
  const monthlySubscriptionTotal = activePackages.reduce((sum, p) => sum + (Number(p.price) || 0), 0)

  const totalPackagesCount = packageList.length
  const totalSubscriptionTotal = packageList.reduce((sum, p) => sum + (Number(p.price) || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2 pb-2">
        {['Subscription Management', ...(SHOW_TIER_MANAGEMENT ? ['Tier Management'] : [])].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border border-solid rounded-full cursor-pointer ${
              activeTab === tab 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700' 
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. Subscription Management Tab */}
      {activeTab === 'Subscription Management' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400">Monthly subscription</span>
                <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-1 mb-0">{monthlySubscriptionCount}</h2>
              </div>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">${monthlySubscriptionTotal.toLocaleString()}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400">Total Subscription</span>
                <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-1 mb-0">{totalPackagesCount}</h2>
              </div>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">${totalSubscriptionTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-full border border-slate-200 dark:border-slate-700">
              {['Monthly Subscription', 'Annual Subscription', 'Free Trial'].map(cycle => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border-none cursor-pointer transition-all ${
                    billingCycle === cycle 
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                      : 'text-slate-500 bg-transparent hover:text-slate-700'
                  }`}
                >
                  {cycle}
                </button>
              ))}
            </div>
            <Button 
              type="primary" 
              onClick={() => setIsAddOpen(true)}
              style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
              className="rounded-xl font-bold text-xs h-10 px-5 flex items-center gap-1.5"
            >
              <PlusOutlined /> Add New Package
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(packages).map((key) => {
              const pack = packages[key]
              return (
                <div key={key} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">{pack.name}</h3>
                      <span className="text-xs text-slate-400 font-semibold">${pack.price}/month</span>
                    </div>
                    <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-slate-650 dark:text-slate-400">Enable</span>
                      <Switch 
                        checked={pack.enabled} 
                        style={{ backgroundColor: pack.enabled ? '#8C4BFF' : undefined }}
                        onChange={(val) => handleToggleEnable(key, val)}
                      />
                    </div>
                    <ul className="space-y-2.5 pl-0 list-none text-xs text-slate-750 dark:text-slate-300 font-bold">
                      {pack.features.map((feat, i) => (
                        <li key={i} className={`flex items-start gap-2 ${feat.isIndented ? 'pl-4 text-slate-400 dark:text-slate-500 font-medium' : ''}`}>
                          {feat.hasBullet && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8C4BFF] mt-1.5 inline-block shrink-0" />
                          )}
                          <span>{feat.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => handleOpenEdit(key)}
                      className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold h-10 rounded-xl cursor-pointer transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <EditOutlined /> Edit Features
                    </button>
                    <button 
                      onClick={() => handleDeletePackage(key)}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 font-bold h-10 px-3.5 rounded-xl cursor-pointer transition-all text-xs flex items-center justify-center"
                      title="Delete Package from database and landing page"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. Tier Management Tab */}
      {SHOW_TIER_MANAGEMENT && activeTab === 'Tier Management' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active tiers</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">3 / 4</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                <StarOutlined style={{ fontSize: 14 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total subscribers</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">0</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
                <FileTextOutlined style={{ fontSize: 14 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">MRR from tiers</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">$0</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
                <CrownOutlined style={{ fontSize: 14 }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Future tiers</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">1</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
                <RocketOutlined style={{ fontSize: 14 }} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white m-0">Tier Management</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Pricing plans, feature gating, trial periods, and annual discounts</p>
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-full border border-slate-200 dark:border-slate-700 select-none">
                {['MONTHLY', 'ANNUAL (SAVE UP TO 20%)'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTierCycle(opt.startsWith('MONTHLY') ? 'MONTHLY' : 'ANNUAL')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border-none cursor-pointer transition-all ${
                      (tierCycle === 'MONTHLY' && opt.startsWith('MONTHLY')) || (tierCycle === 'ANNUAL' && opt.startsWith('ANNUAL'))
                        ? 'bg-white dark:bg-slate-955 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 bg-transparent hover:text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Basic */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 mb-3">
                    <StarOutlined style={{ fontSize: 14 }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">Basic</h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-medium">Solo practitioners getting started</p>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-805 dark:text-white">${tierCycle === 'MONTHLY' ? '49' : '39'}</span>
                    <span className="text-slate-400 text-xs font-semibold"> /mo</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> 14-day free trial
                  </span>
                  <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
                  <ul className="space-y-2.5 pl-0 list-none text-xs text-slate-750 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Up to 3 clinicians</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Patient management</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Appointment scheduling</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> AI summarization (limited)</li>
                    <li className="flex items-center gap-2 text-slate-300 dark:text-slate-600"><CloseOutlined /> Voice dictation</li>
                    <li className="flex items-center gap-2 text-slate-300 dark:text-slate-600"><CloseOutlined /> White-label branding</li>
                    <li className="flex items-center gap-2 text-slate-300 dark:text-slate-600"><CloseOutlined /> Priority support</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2 text-center">0 active subscribers</span>
                  <button onClick={() => toast.success('Modify Basic tier features')} className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-105 text-slate-705 dark:text-slate-300 border-none font-bold h-9 rounded-xl cursor-pointer transition-colors text-xs">Edit tier</button>
                </div>
              </div>

              {/* Advanced */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 mb-3">
                    <RocketOutlined style={{ fontSize: 14 }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">Advanced</h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-medium">Growing clinics with multiple seats</p>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-805 dark:text-white">${tierCycle === 'MONTHLY' ? '149' : '119'}</span>
                    <span className="text-slate-400 text-xs font-semibold"> /mo</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> 14-day free trial
                  </span>
                  <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
                  <ul className="space-y-2.5 pl-0 list-none text-xs text-slate-750 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Up to 15 clinicians</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Patient management</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Appointment scheduling</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> AI summarization (full)</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Voice dictation</li>
                    <li className="flex items-center gap-2 text-slate-300 dark:text-slate-600"><CloseOutlined /> White-label branding</li>
                    <li className="flex items-center gap-2 text-slate-300 dark:text-slate-600"><CloseOutlined /> Priority support</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2 text-center">0 active subscribers</span>
                  <button onClick={() => toast.success('Modify Advanced tier features')} className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-105 text-slate-705 dark:text-slate-300 border-none font-bold h-9 rounded-xl cursor-pointer transition-colors text-xs">Edit tier</button>
                </div>
              </div>

              {/* Premium */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div className="absolute top-4 right-4">
                  <Tag color="purple" className="border-none font-bold text-[9px] rounded-full px-2 py-0.5 m-0">White-label</Tag>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500 mb-3">
                    <CrownOutlined style={{ fontSize: 14 }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">Premium</h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-medium">Multi-location practices with branding</p>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-805 dark:text-white">${tierCycle === 'MONTHLY' ? '349' : '279'}</span>
                    <span className="text-slate-400 text-xs font-semibold"> /mo</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> 30-day free trial
                  </span>
                  <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
                  <ul className="space-y-2.5 pl-0 list-none text-xs text-slate-750 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Unlimited clinicians</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Patient management</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Appointment scheduling</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> AI summarization (full)</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Voice dictation</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> White-label branding</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Priority support</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2 text-center">0 active subscribers</span>
                  <button onClick={() => toast.success('Modify Premium tier features')} className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-105 text-slate-705 dark:text-slate-300 border-none font-bold h-9 rounded-xl cursor-pointer transition-colors text-xs">Edit tier</button>
                </div>
              </div>

              {/* Enterprise */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div className="absolute top-4 right-4">
                  <Tag color="warning" className="border-none font-bold text-[9px] rounded-full px-2 py-0.5 m-0">Future</Tag>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 mb-3">
                    <GlobalOutlined style={{ fontSize: 14 }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">Enterprise</h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-medium">Health systems & networks (coming soon)</p>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">Coming soon</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> 60-day free trial
                  </span>
                  <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
                  <ul className="space-y-2.5 pl-0 list-none text-xs text-slate-750 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Unlimited clinicians</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Patient management</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Appointment scheduling</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> AI summarization (custom limits)</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Voice dictation</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> White-label branding</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> Priority support & CSM</li>
                    <li className="flex items-center gap-2 text-emerald-600"><CheckOutlined /> On-prem / private cloud</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2 text-center">0 active subscribers</span>
                  <button onClick={() => toast.success('Registered for Enterprise notifications!')} className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-105 text-slate-400 dark:text-slate-500 border-none font-bold h-9 rounded-xl cursor-pointer transition-colors text-xs">Notify me</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Coupons & Promotions Tab */}
      {activeTab === 'Coupons & Promotions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400">Active Coupons</span>
                <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-1 mb-0">{coupons.length}</h2>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400">Total Redemptions</span>
                <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-1 mb-0">0</h2>
              </div>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-slate-805 dark:text-white text-base">Coupons & Promotions</span>
              <Button type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl text-xs h-9 px-4 font-bold" onClick={() => setIsAddCouponOpen(true)}>
                + Add Coupon
              </Button>
            </div>
          }>
            <Table
              dataSource={coupons}
              pagination={false}
              columns={[
                {
                  title: 'Code',
                  dataIndex: 'code',
                  render: (code, rec) => (
                    <div>
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold block">{code}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{rec.desc}</span>
                    </div>
                  )
                },
                { title: 'Discount', dataIndex: 'discount', render: (d) => <span className="font-extrabold text-[#8C4BFF]">{d}</span> },
                { title: 'Applies to', dataIndex: 'applies' },
                { title: 'Validity', dataIndex: 'validity' },
                { title: 'Usage', dataIndex: 'usage', render: (u) => <span className="font-bold text-slate-650 dark:text-slate-350">{u}</span> },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Active' ? 'success' : s === 'Inactive' ? 'default' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5 uppercase">
                      {s}
                    </Tag>
                  )
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  align: 'right',
                  render: (_, rec) => (
                    <Space size="middle">
                      <EditOutlined className="text-slate-400 hover:text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => toast.success(`Edit coupon ${rec.code}`)} />
                      <DeleteOutlined className="text-red-400 hover:text-red-655 cursor-pointer" onClick={() => {
                        setCoupons(prev => prev.filter(item => item.key !== rec.key))
                        toast.success(`Coupon ${rec.code} deleted`)
                      }} />
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}

      {/* 4. Automated Billing Tab */}
      {activeTab === 'Automated Billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recurring billing</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">On</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">3 retries · 3d apart</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                <SyncOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Grace period</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">7 days</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Before suspension</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
                <ClockCircleOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active retries</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">0</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">0 failed</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
                <SyncOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoices auto-generated</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">0</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Last 30 days</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
                <FileTextOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-white text-sm block">Billing Rules</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Configure recurring billing, retries, grace periods, and auto-suspension</span>
            </div>
          }>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-105 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-850 dark:text-white block">Recurring billing</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Automatically charge subscribers each cycle</span>
                </div>
                <Switch checked={billingRules.recurring} style={{ backgroundColor: billingRules.recurring ? '#8C4BFF' : undefined }} onChange={(v) => setBillingRules(p => ({ ...p, recurring: v }))} />
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-105 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-850 dark:text-white block">Auto-suspend after failed retries</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Suspend access after all retries are exhausted</span>
                </div>
                <Switch checked={billingRules.suspend} style={{ backgroundColor: billingRules.suspend ? '#8C4BFF' : undefined }} onChange={(v) => setBillingRules(p => ({ ...p, suspend: v }))} />
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-105 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-850 dark:text-white block">Auto-generate invoices</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Issue invoices on the first day of each cycle</span>
                </div>
                <Switch checked={billingRules.invoice} style={{ backgroundColor: billingRules.invoice ? '#8C4BFF' : undefined }} onChange={(v) => setBillingRules(p => ({ ...p, invoice: v }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">RETRY ATTEMPTS</span>
                  <Input type="number" value={billingRules.retryAttempts} className="rounded-xl h-10" onChange={(e) => setBillingRules(p => ({ ...p, retryAttempts: Number(e.target.value) }))} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">RETRY INTERVAL (DAYS)</span>
                  <Input type="number" value={billingRules.retryInterval} className="rounded-xl h-10" onChange={(e) => setBillingRules(p => ({ ...p, retryInterval: Number(e.target.value) }))} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">GRACE PERIOD (DAYS)</span>
                  <Input type="number" value={billingRules.gracePeriod} className="rounded-xl h-10" onChange={(e) => setBillingRules(p => ({ ...p, gracePeriod: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-805 dark:text-white text-sm block">Failed Payment Retries</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Active retry queue and recent outcomes</span>
            </div>
          }>
            <Table
              dataSource={failedRetries}
              pagination={false}
              columns={[
                { title: 'CLINIC', dataIndex: 'clinic', render: (c) => <span className="font-bold text-slate-800 dark:text-white">{c}</span> },
                { title: 'INVOICE', dataIndex: 'invoice', render: (i) => <span className="font-mono text-slate-400 font-semibold">{i}</span> },
                { title: 'AMOUNT', dataIndex: 'amount', render: (a) => <span className="font-bold text-slate-700 dark:text-slate-300">{a}</span> },
                { title: 'ATTEMPT', dataIndex: 'attempt' },
                { title: 'REASON', dataIndex: 'reason' },
                { title: 'NEXT RETRY', dataIndex: 'nextRetry' },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Scheduled' ? 'processing' : s === 'Retrying' ? 'warning' : s === 'Recovered' ? 'success' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {s}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="text-xs">
              <span className="font-bold text-slate-805 dark:text-white text-sm block">Auto-generated Invoices</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Latest invoices issued by the recurring billing job</span>
            </div>
          }>
            <Table
              dataSource={autoInvoices}
              pagination={false}
              columns={[
                { title: 'INVOICE', dataIndex: 'invoice', render: (i) => <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{i}</span> },
                { title: 'CLINIC', dataIndex: 'clinic', render: (c) => <span className="font-bold text-slate-650 dark:text-slate-355">{c}</span> },
                { title: 'AMOUNT', dataIndex: 'amount', render: (a) => <span className="font-extrabold text-[#8C4BFF]">{a}</span> },
                { title: 'CYCLE', dataIndex: 'cycle' },
                { title: 'GENERATED', dataIndex: 'date' },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Paid' ? 'success' : s === 'Sent' ? 'purple' : s === 'Issued' ? 'processing' : 'error'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {s}
                    </Tag>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}

      {/* 5. White-Label Controls Tab */}
      {activeTab === 'White-Label Controls' && (
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-solid border-purple-100 dark:border-purple-900 rounded-2xl p-4 flex justify-between items-center">
            <div className="flex gap-2.5 items-start">
              <CrownOutlined className="text-purple-600 text-base mt-0.5" />
              <div>
                <span className="font-bold text-xs text-purple-900 dark:text-purple-300 block">Premium-only access</span>
                <span className="text-[11px] text-purple-700 dark:text-purple-400 block mt-0.5 font-medium">White-label features are available exclusively on Premium and Enterprise plans.</span>
              </div>
            </div>
            <Tag color="purple" className="border-none font-bold text-[9px] rounded-full px-2.5 py-0.5 m-0 uppercase">0 clinics live</Tag>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Master switch</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">{wlMaster ? 'On' : 'Off'}</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Platform-wide white-label</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                <StarOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending approvals</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">0</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Branding submissions</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
                <EditOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Approved brandings</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">0</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Live across the platform</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
                <CheckCircleOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active domains</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3 mb-0">0</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Custom domains deployed</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
                <GlobalOutlined style={{ fontSize: 13 }} />
              </div>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-white text-sm block">Platform Controls</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Master switch and per-clinic enable / disable</span>
            </div>
          }>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-850 dark:text-white block">White-label master switch</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">When off, all clinics revert to default platform branding</span>
                </div>
                <Switch checked={wlMaster} style={{ backgroundColor: wlMaster ? '#8C4BFF' : undefined }} onChange={(v) => {
                  setWlMaster(v)
                  toast.success(`White-label master switch turned ${v ? 'On' : 'Off'}`)
                }} />
              </div>

              {wlClinics.length > 0 ? (
                wlClinics.map((clinic, index) => (
                  <div key={clinic.key} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 pl-4">
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white font-bold bg-[#8C4BFF]">
                        {clinic.name[0]}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-805 dark:text-white block">{clinic.name}</span>
                        <span className="text-[9px] text-[#8C4BFF] font-semibold block mt-0.5">{clinic.subdomain}</span>
                      </div>
                    </div>
                    <Switch disabled={!wlMaster} checked={clinic.enabled} style={{ backgroundColor: clinic.enabled && wlMaster ? '#8C4BFF' : undefined }} onChange={(v) => {
                      setWlClinics(p => {
                        const copy = [...p]
                        copy[index].enabled = v
                        return copy
                      })
                      toast.success(`Custom branding for "${clinic.name}" ${v ? 'Enabled' : 'Disabled'}`)
                    }} />
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">No white-label clinics configured yet.</div>
              )}
            </div>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-white text-sm block">Branding Approval Queue</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">Review submitted logos and brand colors before they go live</span>
            </div>
          }>
            <div className="space-y-4">
              {approvalQueue.length > 0 ? (
                approvalQueue.map((item, index) => (
                  <div key={item.key} className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex gap-3 items-center">
                      <span className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white" style={{ backgroundColor: item.color }}>
                        {item.name[0]}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-800 dark:text-white">{item.name}</span>
                          <Tag color="purple" className="border-none font-bold text-[8px] rounded-full px-1.5 py-0.2 m-0">Premium</Tag>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          Submitted by {item.submitter} · {item.date}
                        </span>
                        {item.reviewer && (
                          <span className="text-[9px] text-slate-450 font-bold block mt-0.5">Reviewed by {item.reviewer}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-solid border-slate-200" style={{ backgroundColor: item.color }} />
                        <span className="font-mono text-[10px] font-bold text-slate-400">{item.color}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag color={item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'error' : 'processing'} className="border-none font-bold text-[9px] rounded-full px-2 py-0.5 m-0 uppercase">
                          {item.status}
                        </Tag>
                        {item.status === 'Pending Review' && (
                          <div className="flex gap-1.5">
                            <Button size="small" className="rounded-lg text-[10px] font-bold" danger onClick={() => {
                              setApprovalQueue(p => {
                                const copy = [...p]
                                copy[index].status = 'Rejected'
                                copy[index].reviewer = 'Admin'
                                return copy
                              })
                              toast.error(`Branding for "${item.name}" rejected`)
                            }}>Reject</Button>
                            <Button size="small" type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-lg text-[10px] font-bold" onClick={() => {
                              setApprovalQueue(p => {
                                const copy = [...p]
                                copy[index].status = 'Approved'
                                copy[index].reviewer = 'Admin'
                                return copy
                              })
                              toast.success(`Branding for "${item.name}" approved`)
                            }}>Approve</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">No pending branding submissions in queue.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Add Coupon Modal */}
      <Modal
        open={isAddCouponOpen}
        onCancel={() => setIsAddCouponOpen(false)}
        footer={null}
        destroyOnHidden
        width={450}
        title={
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-805 dark:text-white m-0">Create Promotion Coupon</h2>
            <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Setup a new discount offer or coupon rule</p>
          </div>
        }
      >
        <Form form={couponForm} layout="vertical" onFinish={handleAddCoupon}>
          <Form.Item name="code" label={<span className="text-slate-500 font-bold text-xs">Coupon Code *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="e.g. WELCOME30" />
          </Form.Item>
          <Form.Item name="discount" label={<span className="text-slate-500 font-bold text-xs">Discount Amount *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="e.g. 30% or $50" />
          </Form.Item>
          <Form.Item name="desc" label={<span className="text-slate-500 font-bold text-xs">Description *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="e.g. New user signup promotion" />
          </Form.Item>
          <Form.Item name="applies" label={<span className="text-slate-500 font-bold text-xs">Applies To</span>}>
            <Select className="rounded-xl h-10 flex items-center" placeholder="All packages">
              <Option value="All packages">All packages</Option>
              <Option value="Basic - Annual">Basic - Annual</Option>
              <Option value="Premium - Monthly">Premium - Monthly</Option>
            </Select>
          </Form.Item>
          <Form.Item className="mb-0 text-right mt-4">
            <Space>
              <button type="button" onClick={() => setIsAddCouponOpen(false)} className="bg-white dark:bg-slate-900 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" style={{ backgroundColor: '#0E1B33' }} className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Create Coupon</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Package Modal */}
      <Modal
        open={isAddOpen}
        onCancel={() => setIsAddOpen(false)}
        footer={null}
        destroyOnHidden
        width={450}
        title={
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-805 dark:text-white m-0">Create Subscription Package</h2>
            <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Design a new product offering and pricing details</p>
          </div>
        }
      >
        <Form form={newForm} layout="vertical" onFinish={handleAddPackage}>
          <Form.Item name="name" label={<span className="text-slate-500 font-bold text-xs">Package Name *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="e.g. Enterprise Tier" />
          </Form.Item>
          <Form.Item name="price" label={<span className="text-slate-500 font-bold text-xs">Monthly Rate *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="150" suffix="$" />
          </Form.Item>
          <Form.Item className="mb-0 text-right mt-4">
            <Space>
              <button type="button" onClick={() => setIsAddOpen(false)} className="bg-white dark:bg-slate-900 border border-slate-200 text-slate-700 dark:text-slate-300 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" style={{ backgroundColor: '#0E1B33' }} className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Create Package</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Package Modal */}
      <Modal
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditingKey(null); }}
        footer={null}
        destroyOnHidden
        width={450}
        title={
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-805 dark:text-white m-0">Edit Subscription Package</h2>
            <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Update package name, pricing and settings</p>
          </div>
        }
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveEditPackage}>
          <Form.Item name="name" label={<span className="text-slate-500 font-bold text-xs">Package Name *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="Package name" />
          </Form.Item>
          <Form.Item name="price" label={<span className="text-slate-500 font-bold text-xs">Monthly Rate *</span>} rules={[{ required: true }]}>
            <Input className="rounded-xl h-10" placeholder="Rate" suffix="$" />
          </Form.Item>
          <Form.Item className="mb-0 text-right mt-4">
            <Space>
              <button type="button" onClick={() => { setIsEditOpen(false); setEditingKey(null); }} className="bg-white dark:bg-slate-900 border border-slate-200 text-slate-700 dark:text-slate-355 font-bold h-10 px-5 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" style={{ backgroundColor: '#0E1B33' }} className="text-white border-none font-bold h-10 px-5 rounded-xl cursor-pointer">Save Changes</button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
