import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useClinicStore } from '../../../../store/clinicStore'
import { Card, Form, Input, Button, Checkbox, Space, Table, Tag, Modal, Divider, Switch, Tooltip, Select, Spin } from 'antd'
import {
  UserOutlined,
  BellOutlined,
  LockOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  RobotOutlined,
  FireOutlined,
  CalendarOutlined,
  GlobalOutlined,
  ShareAltOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'
import PatientHealthSharing from './PatientHealthSharing'

export default function PatientSettings({ initialTab }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { darkMode } = useClinicStore()
  const queryTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(initialTab || queryTab || 'profile')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) {
      setActiveTab(t)
    }
  }, [searchParams])
  const [activeProfileId, setActiveProfileId] = useState('self')
  const [familyProfiles, setFamilyProfiles] = useState([
    { id: 'self', name: 'Primary Account (Self)', role: 'Self' }
  ])
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)

  const [profileForm] = Form.useForm()
  const [gpForm] = Form.useForm()
  const [insuranceForm] = Form.useForm()

  const [tfaEnabled, setTfaEnabled] = useState(true)
  const [smsNotify, setSmsNotify] = useState(true)
  const [emailNotify, setEmailNotify] = useState(true)
  const [pushNotify, setPushNotify] = useState(false)

  // AI chat state
  const [aiChatMessages, setAiChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Recovery Assistant. Select one of the quick coaches below or ask me any question about your care plan, exercises, or funding.' }
  ])
  const [aiInput, setAiInput] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)

  const [trustedDevices, setTrustedDevices] = useState([])
  const [achievementsList, setAchievementsList] = useState([])

  const fetchFamilyProfiles = async () => {
    try {
      const res = await api.get('/api/patient/family-profiles')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setFamilyProfiles(res.data.data)
      }
    } catch (err) {
      console.warn('Family profiles fetch notice:', err?.message)
    }
  }

  const fetchAchievements = async () => {
    try {
      const res = await api.get('/api/patient/achievements')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAchievementsList(res.data.data)
      }
    } catch (err) {
      console.warn('Patient achievements API fetch fallback notice:', err?.message)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchPreferences()
    fetchTrustedDevices()
    fetchAchievements()
    fetchFamilyProfiles()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patient/profile')
      if (res.data?.success && res.data.data) {
        setProfileData(res.data.data)
        if (res.data.data.fullName) {
          setAiChatMessages([
            { sender: 'ai', text: `Hello ${res.data.data.fullName.split(' ')[0]}! I am your AI Clinical Recovery Assistant. Select one of the coaches below or ask me any question about your care plan, exercises, or funding.` }
          ])
        }
      }
    } catch (err) {
      console.warn('Patient profile API fetch fallback notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/api/patient/preferences')
      if (res.data?.success && res.data.data) {
        const p = res.data.data
        if (p.smsNotify !== undefined) setSmsNotify(p.smsNotify)
        if (p.emailNotify !== undefined) setEmailNotify(p.emailNotify)
        if (p.pushNotify !== undefined) setPushNotify(p.pushNotify)
        if (p.tfaEnabled !== undefined) setTfaEnabled(p.tfaEnabled)
      }
    } catch (err) {
      console.warn('Patient preferences API fetch fallback notice:', err?.message)
    }
  }

  const handleSavePreferences = async () => {
    try {
      const payload = { smsNotify, emailNotify, pushNotify, tfaEnabled }
      const res = await api.put('/api/patient/preferences', payload)
      if (res.data?.success) {
        toast.success(res.data.message || 'Preferences updated in live database!')
      } else {
        toast.error(res.data?.message || 'Failed to update preferences')
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      toast.error(err?.response?.data?.message || 'Failed to save preferences to live database.')
    }
  }

  const handleTfaToggle = async (checked) => {
    setTfaEnabled(checked)
    try {
      const res = await api.put('/api/patient/preferences', { tfaEnabled: checked })
      if (res.data?.success) {
        toast.success(`2FA Authentication ${checked ? 'Enabled' : 'Disabled'} in live database`)
      }
    } catch (err) {
      console.error('Error toggling 2FA:', err)
      toast.error('Failed to update 2FA setting in live database.')
    }
  }

  const fetchTrustedDevices = async () => {
    try {
      const res = await api.get('/api/patient/security/devices')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTrustedDevices(res.data.data)
      }
    } catch (err) {
      console.warn('Trusted devices API fetch fallback notice:', err?.message)
    }
  }

  const handleRevokeDevice = async (key) => {
    try {
      const res = await api.delete(`/api/patient/security/devices/${key}`)
      if (res.data?.success) {
        setTrustedDevices(prev => prev.filter(item => item.key !== key))
        toast.success('Device session terminated in live database.')
      } else {
        toast.error(res.data?.message || 'Failed to terminate session')
      }
    } catch (err) {
      console.error('Error terminating device session:', err)
      toast.error('Failed to terminate device session in live database.')
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchPreferences()
    fetchTrustedDevices()
  }, [])

  // Use real profileData from DB directly — no more hardcoded fallback names
  useEffect(() => {
    if (profileData) {
      profileForm.setFieldsValue({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        email: profileData.email || '',
        address: profileData.address || '',
        emergencyName: profileData.emergencyContactName || '',
        emergencyRelation: profileData.emergencyRelation || '',
        emergencyPhone: profileData.emergencyContactPhone || '',
      })
      gpForm.setFieldsValue({
        gpName: profileData.gpName || '',
        gpClinic: profileData.gpClinic || '',
        gpPhone: profileData.gpPhone || '',
      })
      insuranceForm.setFieldsValue({
        medicareNum: profileData.medicareNumber || '',
        medicareRef: profileData.medicareRef || '',
        medicareExpiry: profileData.medicareExpiry || '',
        phiProvider: profileData.privateHealthFund || '',
        phiMemberNum: profileData.phiMemberNum || '',
      })
    }
  }, [profileData, profileForm, gpForm, insuranceForm])

  const handleSaveProfile = async () => {
    try {
      const profileValues = profileForm.getFieldsValue() || {}
      const gpValues = gpForm.getFieldsValue() || {}
      const insuranceValues = insuranceForm.getFieldsValue() || {}

      const payload = {
        ...profileValues,
        ...gpValues,
        ...insuranceValues
      }

      const res = await api.put('/api/patient/profile', payload)
      if (res.data?.success) {
        toast.success('Personal details saved successfully in live database!')
        if (res.data.data) {
          setProfileData(res.data.data)
        } else {
          fetchProfile()
        }
      } else {
        toast.error(res.data?.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error saving patient profile:', err)
      toast.error(err?.response?.data?.message || 'Failed to save profile. Please check connection.')
    }
  }

  const tabs = [
    { key: 'profile', label: 'Personal Details', icon: <UserOutlined /> },
    { key: 'preferences', label: 'Preferences', icon: <BellOutlined /> },
    { key: 'security', label: 'Security', icon: <LockOutlined /> },
    { key: 'health_sharing', label: 'Health Record Sharing', icon: <ShareAltOutlined /> },
    { key: 'achievements', label: 'Achievements', icon: <CrownOutlined /> },
    { key: 'ai_assistant', label: 'AI Recovery Assistant', icon: <ThunderboltOutlined /> }
  ]

  const handleAiAsk = async (promptText) => {
    if (!promptText.trim()) return

    const userMsg = { sender: 'user', text: promptText }
    setAiChatMessages(prev => [...prev, userMsg])
    setAiInput('')
    setIsAiTyping(true)

    try {
      const res = await api.post('/api/patient/ai-assistant', { message: promptText })
      if (res.data?.success && res.data.data?.reply) {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: res.data.data.reply }])
      } else {
        throw new Error('AI service fallback')
      }
    } catch (err) {
      const pName = profileData?.fullName || 'Patient'
      const fallbackReply = `🤖 [AI Recovery Coach for ${pName}]: I've noted your question regarding "${promptText}". Please maintain your prescribed daily routine and track your exercises in the Treatment Plans tab.`
      setAiChatMessages(prev => [...prev, { sender: 'ai', text: fallbackReply }])
    } finally {
      setIsAiTyping(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">

            {/* Parent / Carer Portal Widget */}
            <Card className="border border-indigo-100 dark:border-indigo-900/50 rounded-2xl shadow-sm bg-indigo-50/30 dark:bg-indigo-950/20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserOutlined style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-808 dark:text-slate-200 m-0">Parent / Carer Portal (Family Management)</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 font-semibold">You are currently managing accounts for your dependents. Switch profiles below.</p>
                  </div>
                </div>
                <Select 
                  value={activeProfileId} 
                  className="w-full sm:w-60 h-9" 
                  onChange={(v) => { 
                    setActiveProfileId(v)
                    const selectedF = familyProfiles.find(f => f.id === v)
                    toast.success(`Switched to profile: ${selectedF?.name || v}`) 
                  }}
                >
                  {familyProfiles.map(f => (
                    <Select.Option key={f.id} value={f.id}>
                      {f.id === 'self' ? '👨' : '👧'} {f.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Card>

            <div key={activeProfileId} className="space-y-6">
              <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">My Profile & Contact Details</span>}>
                {loading ? (
                  <div className="text-center py-6">
                    <Spin description="Loading profile..." />
                  </div>
                ) : (
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleSaveProfile}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Form.Item name="fullName" label="Full Name" required>
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                      <Form.Item name="phone" label="Phone Number" required>
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                      <Form.Item name="email" label="Email Address" required>
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                    </div>
                    <Form.Item name="address" label="Home Address">
                      <Input className="rounded-xl h-9" />
                    </Form.Item>

                    <Divider className="my-4" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Emergency Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Form.Item name="emergencyName" label="Contact Name">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                      <Form.Item name="emergencyRelation" label="Relationship">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                      <Form.Item name="emergencyPhone" label="Contact Phone">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold h-9 text-xs text-white">Save Personal Details</Button>
                    </div>
                  </Form>
                )}
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GP Information */}
                <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">General Practitioner (GP) Information</span>}>
                  <Form
                    form={gpForm}
                    layout="vertical"
                    onFinish={handleSaveProfile}
                  >
                    <Form.Item name="gpName" label="GP Doctor Name">
                      <Input className="rounded-xl h-9" />
                    </Form.Item>
                    <Form.Item name="gpClinic" label="GP Clinic Name">
                      <Input className="rounded-xl h-9" />
                    </Form.Item>
                    <Form.Item name="gpPhone" label="GP Phone Contact">
                      <Input className="rounded-xl h-9" />
                    </Form.Item>
                    <div className="flex justify-end pt-2">
                      <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-9 text-xs text-white">Save GP Records</Button>
                    </div>
                  </Form>
                </Card>

                {/* Medicare & Insurance Details */}
                <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Medicare & Private Health Insurance</span>}>
                  <Form
                    form={insuranceForm}
                    layout="vertical"
                    onFinish={handleSaveProfile}
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <Form.Item name="medicareNum" label="Medicare Card Number" className="col-span-2">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                      <Form.Item name="medicareRef" label="Ref No" className="col-span-1">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                    </div>
                    <Form.Item name="medicareExpiry" label="Card Expiry (MM/YYYY)">
                      <Input className="rounded-xl h-9" />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-3">
                      <Form.Item name="phiProvider" label="Private Health Provider">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                      <Form.Item name="phiMemberNum" label="Member Policy ID">
                        <Input className="rounded-xl h-9" />
                      </Form.Item>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-9 text-xs text-white">Save Insurance Details</Button>
                    </div>
                  </Form>
                </Card>
              </div>

            </div>
          </div>
        )

      case 'preferences':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Communication & Recovery Alert Preferences</span>}>
            <div className="space-y-6">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-808 dark:text-slate-200 m-0">SMS Session Reminders</h4>
                  <p className="text-[10px] text-slate-400 m-0 mt-0.5">Receive instant SMS alerts 24h prior to clinic appointments.</p>
                </div>
                <Switch checked={smsNotify} onChange={setSmsNotify} />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-808 dark:text-slate-200 m-0">Email Health Reports & Receipts</h4>
                  <p className="text-[10px] text-slate-400 m-0 mt-0.5">Auto-email finalized consultation summaries and payment tax invoices.</p>
                </div>
                <Switch checked={emailNotify} onChange={setEmailNotify} />
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-808 dark:text-slate-200 m-0">Daily Home Exercise Reminders</h4>
                  <p className="text-[10px] text-slate-400 m-0 mt-0.5">Push notifications to log completed home stretches and pain scores.</p>
                </div>
                <Switch checked={pushNotify} onChange={setPushNotify} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="primary" onClick={handleSavePreferences} style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-9 text-xs text-white">Save Preferences</Button>
              </div>
            </div>
          </Card>
        )

      case 'security':
        return (
          <div className="space-y-6">
            {/* 2FA Card temporarily hidden */}
            {false && (
              <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Two-Factor Authentication (2FA)</span>}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-808 dark:text-slate-200 m-0">Two-Factor Security Verification</h4>
                    <p className="text-[10px] text-slate-400 m-0 mt-0.5">Requires a 6-digit SMS verification code upon patient login.</p>
                  </div>
                  <Switch checked={tfaEnabled} onChange={handleTfaToggle} />
                </div>
              </Card>
            )}

            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Active Portal Sessions & Trusted Devices</span>}>
              <Table
                dataSource={trustedDevices}
                pagination={false}
                scroll={{ x: 600 }}
                className="border-none"
                columns={[
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Device & Browser</span>,
                    dataIndex: 'device',
                    render: (d) => <span className="font-bold text-slate-808 dark:text-slate-200 text-xs">{d}</span>
                  },
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">IP Address</span>,
                    dataIndex: 'ip',
                    render: (ip) => <span className="font-mono text-xs text-slate-500">{ip}</span>
                  },
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location / Time</span>,
                    render: (_, rec) => (
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block">{rec.location}</span>
                        <span className="text-[9px] text-slate-400 block">{rec.time}</span>
                      </div>
                    )
                  },
                  {
                    title: '',
                    key: 'action',
                    align: 'right',
                    render: (_, rec) => (
                      <Button
                        size="small"
                        danger
                        disabled={rec.key === '1'}
                        onClick={() => handleRevokeDevice(rec.key)}
                        className="rounded-lg text-[10px] font-bold h-7"
                      >
                        {rec.key === '1' ? 'Current Session' : 'Logout Device'}
                      </Button>
                    )
                  }
                ]}
              />
            </Card>
          </div>
        )

      case 'achievements':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">My Health Milestones & Badges</span>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievementsList.map((ach, idx) => (
                <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-3">
                  <div className="text-2xl">{ach.badge}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-808 dark:text-slate-200 m-0">{ach.name}</h4>
                      <Tag color={ach.status === 'Unlocked' ? 'gold' : ach.status === 'In Progress' ? 'blue' : 'default'} className="m-0 border-none rounded-full text-[8.5px] font-bold uppercase">{ach.status}</Tag>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium m-0">{ach.desc}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block">{ach.status === 'Unlocked' ? `Status: ${ach.date}` : `Progress: ${ach.progress}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )

      case 'ai_assistant':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">AI Clinical Assistant & Recovery Coach</span>}>
            <div className="space-y-4">

              {/* Preset prompt pills */}
              <div className="flex flex-wrap gap-2">
                <Button size="small" onClick={() => handleAiAsk("How do I do lumbar extensions safely?")} className="rounded-xl text-[10px] font-semibold border-slate-200">🧘 Lumbar Extension Guide</Button>
                <Button size="small" onClick={() => handleAiAsk("What should I tell my GP at Tuesday's review?")} className="rounded-xl text-[10px] font-semibold border-slate-200">📅 Prepare for GP Appointment</Button>
                <Button size="small" onClick={() => handleAiAsk("Explain my EPC treatment goals")} className="rounded-xl text-[10px] font-semibold border-slate-200">📖 Explain My EPC Plan</Button>
                <Button size="small" onClick={() => handleAiAsk("How much NDIS funding is left?")} className="rounded-xl text-[10px] font-semibold border-slate-200">💰 Check NDIS Balance</Button>
              </div>

              {/* Chat Thread */}
              <div className="h-64 overflow-y-auto p-4 bg-slate-50/70 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                {aiChatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-semibold ${msg.sender === 'user' ? 'bg-[#8C4BFF] text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-none text-xs text-slate-400 font-semibold flex items-center gap-2">
                      <RobotOutlined className="animate-spin text-[#8C4BFF]" />
                      <span>AI Recovery Assistant is processing your request...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input row */}
              <form onSubmit={(e) => { e.preventDefault(); handleAiAsk(aiInput) }} className="flex gap-2">
                <Input
                  placeholder="Ask AI Recovery Coach about exercises, GP prep, or funding..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold text-xs h-10 px-5 text-white">
                  Ask AI
                </Button>
              </form>

            </div>
          </Card>
        )

      case 'health_sharing':
        return <PatientHealthSharing />

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">

      {/* Intro Header */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-808 dark:text-white m-0">Patient Account Settings & Personal Profile</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Manage personal contact information, GP records, Medicare details, and AI Recovery Assistant.
            </p>
          </div>
        </div>
      </Card>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3" style={{ marginTop: '24px' }}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'text'}
            icon={tab.icon}
            onClick={() => setActiveTab(tab.key)}
            style={activeTab === tab.key ? { backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' } : {}}
            className={`rounded-xl font-bold text-xs h-9 ${activeTab === tab.key ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Main Tab Content Container */}
      {renderTabContent()}

    </div>
  )
}
