import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Progress, Space } from 'antd'
import {
  CalendarOutlined,
  UserOutlined,
  HomeOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  MailOutlined,
  LineChartOutlined,
  UploadOutlined,
  RightOutlined,
  ShareAltOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'
import { isAppointmentUpcoming, sortAppointmentsUpcoming } from '../../../../utils/appointmentUtils'
import { computeActivePlanAdherence } from '../../../../utils/progressUtils'

export default function PatientDashboard({ store, navigate }) {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    appointments: [],
    careTeam: [],
    treatmentPlans: [],
    funding: { accounts: [], claims: [] },
    formsDocs: { forms: [], documents: [] },
    exercises: [],
    invoices: []
  })
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchAllDashboardData = async () => {
      setLoading(true)
      setHasError(false)

      try {
        const [
          profileRes,
          appointmentsRes,
          careTeamRes,
          treatmentPlansRes,
          fundingRes,
          formsDocsRes,
          exercisesRes,
          invoicesRes
        ] = await Promise.all([
          api.get('/api/patient/profile').catch(err => ({ error: err })),
          api.get('/api/patient/appointments').catch(err => ({ error: err })),
          api.get('/api/patient/care-team').catch(err => ({ error: err })),
          api.get('/api/patient/treatment-plans').catch(err => ({ error: err })),
          api.get('/api/patient/funding-claims').catch(err => ({ error: err })),
          api.get('/api/patient/forms-documents').catch(err => ({ error: err })),
          api.get('/api/patient/exercises').catch(err => ({ error: err })),
          api.get('/api/patient/invoices').catch(err => ({ error: err }))
        ])

        if (!isMounted) return

        let networkOrServerError = false

        const getResData = (res) => {
          if (res?.error) {
            networkOrServerError = true
            return null
          }
          if (res?.data?.success) {
            return res.data.data
          }
          return null
        }

        const profile = getResData(profileRes)
        const appointments = getResData(appointmentsRes) || []
        const careTeam = getResData(careTeamRes) || []
        const treatmentPlans = getResData(treatmentPlansRes) || []
        const funding = getResData(fundingRes) || { accounts: [], claims: [] }
        const formsDocs = getResData(formsDocsRes) || { forms: [], documents: [] }
        const exercises = getResData(exercisesRes) || []
        const invoices = getResData(invoicesRes) || []

        if (networkOrServerError) {
          setHasError(true)
          toast.error('Could not load some live dashboard data from server')
        }

        setDashboardData({
          profile,
          appointments: Array.isArray(appointments) ? appointments : [],
          careTeam: Array.isArray(careTeam) ? careTeam : [],
          treatmentPlans: Array.isArray(treatmentPlans) ? treatmentPlans : [],
          funding: funding || { accounts: [], claims: [] },
          formsDocs: formsDocs || { forms: [], documents: [] },
          exercises: Array.isArray(exercises) ? exercises : [],
          invoices: Array.isArray(invoices) ? invoices : []
        })
      } catch (err) {
        if (isMounted) {
          setHasError(true)
          toast.error('Failed to load dashboard data')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAllDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const patientName = dashboardData.profile?.fullName || dashboardData.profile?.name || store?.userName || 'Patient'
  
  const upcomingAppts = sortAppointmentsUpcoming(
    dashboardData.appointments.filter(a => isAppointmentUpcoming(a))
  )
  const nextAppt = upcomingAppts[0] || null
  const nextApptTime = nextAppt ? `${nextAppt.date || ''} ${nextAppt.startTime || ''}`.trim() : 'No upcoming appointment'

  const primaryDocObj = dashboardData.careTeam[0]
  const primaryDoctor = nextAppt?.practitionerName || primaryDocObj?.name || 'Not Assigned'
  const primaryDoctorSpecialty = primaryDocObj?.specialty || (nextAppt ? 'Practitioner' : 'Pending')
  const primaryClinic = nextAppt?.branchName || primaryDocObj?.clinic || 'Not Assigned'

  const activePlans = dashboardData.treatmentPlans.filter(p => (p.status || 'Active').toLowerCase() === 'active')
  const activePlanAdherence = computeActivePlanAdherence(dashboardData.treatmentPlans, dashboardData.exercises)
  const plansSummaryText = activePlans.length > 0 ? activePlans.map(p => p.condition).filter(Boolean).join(' & ') : 'No active treatment plans'

  const doctorsCount = dashboardData.careTeam.length
  const activePlansCount = activePlans.length
  const scheduledCount = upcomingAppts.length

  const epcAccount = (dashboardData.funding.accounts || []).find(a => (a.type || '').toLowerCase().includes('epc') || (a.type || '').toLowerCase().includes('medicare'))
  const ndisAccount = (dashboardData.funding.accounts || []).find(a => (a.type || '').toLowerCase().includes('ndis'))

  const epcPercent = epcAccount?.percent !== undefined ? epcAccount.percent : 0
  const epcUsedText = epcAccount ? `${epcAccount.used || '0'} (${epcAccount.remaining || '0 remaining'})` : '0 of 0 used'

  const ndisPercent = ndisAccount?.percent !== undefined ? ndisAccount.percent : 0
  const ndisRemainingText = ndisAccount ? `${ndisAccount.remaining || '$0 remaining'} (${ndisPercent}% available)` : '$0 remaining'

  const pendingForms = (dashboardData.formsDocs.forms || []).filter(f => (f.status || '').toLowerCase() === 'pending')
  const pendingExercises = dashboardData.exercises.filter(e => !e.done)
  const completedExercises = dashboardData.exercises.filter(e => e.done)
  const totalExercises = dashboardData.exercises.length

  const pendingFormItem = pendingForms[0]
  const unpaidInvoice = dashboardData.invoices.find(i => (i.status || '').toLowerCase() === 'unpaid' || (i.status || '').toLowerCase() === 'overdue')
  
  // Construct dynamic action items list
  const actionItems = []

  // 1. Pending exercises / interventions
  if (pendingExercises.length > 0) {
    actionItems.push({
      key: 'exercises',
      icon: <HeartOutlined style={{ fontSize: 13 }} />,
      iconBg: 'bg-[#8C4BFF]/10 text-[#8C4BFF]',
      title: 'Interventions To Complete',
      desc: `${pendingExercises.length} intervention${pendingExercises.length === 1 ? '' : 's'} pending completion today`,
      btnText: 'Complete',
      btnClass: 'border-[#8C4BFF] text-[#8C4BFF] hover:bg-[#8C4BFF]/5',
      action: () => navigate('/patient/treatment-plans')
    })
  }

  // 2. Pending Forms
  if (pendingForms.length > 0 && pendingFormItem) {
    actionItems.push({
      key: 'forms',
      icon: <FileTextOutlined style={{ fontSize: 13 }} />,
      iconBg: 'bg-amber-500/10 text-amber-500',
      title: 'Forms to Complete',
      desc: `${pendingFormItem.name || 'Intake questionnaire'} is pending submission`,
      btnText: 'Fill Form',
      btnClass: 'border-amber-500 text-amber-600 hover:bg-amber-500/5',
      action: () => navigate('/patient/forms-documents')
    })
  }

  // 3. Outstanding Payments
  if (unpaidInvoice) {
    actionItems.push({
      key: 'invoices',
      icon: <DollarOutlined style={{ fontSize: 13 }} />,
      iconBg: 'bg-rose-500/10 text-rose-500',
      title: 'Payments Outstanding',
      desc: `${unpaidInvoice.id || 'Invoice'} ($${Number(unpaidInvoice.amount || 0).toFixed(2)}) is due`,
      btnText: 'Pay Now',
      btnClass: 'border-rose-500 text-rose-500 hover:bg-rose-500/5',
      action: () => navigate('/patient/payments')
    })
  }

  return (
    <div className="space-y-6">
      
      {/* ── Grid Row 1: Welcome & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div 
          className="lg:col-span-2 rounded-2xl shadow-sm overflow-hidden text-white bg-gradient-to-br from-[#8C4BFF] via-[#9F66FF] to-[#30D2BE] dark:from-[#8C4BFF] dark:via-[#7B3DE8] dark:to-[#0E1B33] p-6"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-start h-full gap-4">
            <div className="space-y-4">
              <div>
                <span className="block uppercase font-black tracking-wider" style={{ fontSize: '10px', color: '#e9d5ff' }}>Personal Health Portal</span>
                <div className="font-black m-0 mt-1" style={{ fontSize: '24px', lineHeight: '32px', color: '#ffffff' }}>Welcome Back, {patientName}</div>
                <div className="font-semibold mt-1" style={{ fontSize: '12px', color: '#e9d5ff' }}>Your healthcare journey is securely managed across clinics.</div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 font-semibold" style={{ fontSize: '12px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 dark:bg-slate-900/20 flex items-center justify-center text-white">
                    <CalendarOutlined style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <span className="block uppercase font-bold" style={{ fontSize: '9px', color: '#e9d5ff' }}>Next Appointment</span>
                    <span style={{ color: '#ffffff' }}>{nextApptTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 dark:bg-slate-900/20 flex items-center justify-center text-white">
                    <UserOutlined style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <span className="block uppercase font-bold" style={{ fontSize: '9px', color: '#e9d5ff' }}>{primaryDoctorSpecialty}</span>
                    <span style={{ color: '#ffffff' }}>{primaryDoctor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 dark:bg-slate-900/20 flex items-center justify-center text-white">
                    <HomeOutlined style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <span className="block uppercase font-bold" style={{ fontSize: '9px', color: '#e9d5ff' }}>Primary Clinic</span>
                    <span style={{ color: '#ffffff' }}>{primaryClinic}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 dark:bg-slate-900/20 p-4 rounded-xl border border-white/15 backdrop-blur-sm md:w-56 space-y-2 flex-shrink-0 self-center">
              <span className="uppercase font-black block" style={{ fontSize: '9px', color: '#e9d5ff' }}>Active Plan Adherence</span>
              <div className="flex items-center gap-3">
                <Progress 
                  type="circle" 
                  percent={activePlanAdherence} 
                  size={50} 
                  strokeColor="#30D2BE" 
                  railColor="rgba(255, 255, 255, 0.15)"
                  strokeWidth={10}
                  format={(p) => <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: '900' }}>{p}%</span>}
                />
                <div>
                  <span className="font-extrabold block" style={{ fontSize: '12px', color: '#ffffff' }}>{activePlanAdherence > 50 ? 'On Track' : 'Needs Review'}</span>
                  <span className="block mt-0.5 font-semibold" style={{ fontSize: '9px', color: '#e9d5ff' }}>Active Care Plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <Card 
          className="lg:col-span-1 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" 
          title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Quick Actions</span>}
        >
          <div className="grid grid-cols-1 gap-2.5">
            <Button 
              type="primary" 
              icon={<CalendarOutlined />} 
              onClick={() => navigate('/patient/calendar')}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="w-full rounded-xl font-bold text-xs h-10 text-white flex items-center justify-start px-4"
            >
              Book New Appointment
            </Button>
            <Button 
              onClick={() => navigate('/patient/forms-documents')}
              icon={<FileTextOutlined />}
              className="w-full rounded-xl font-bold text-xs h-10 flex items-center justify-start px-4 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              Upload Document / Referral
            </Button>
            <Button 
              onClick={() => navigate('/patient/payments')}
              icon={<DollarOutlined />}
              className="w-full rounded-xl font-bold text-xs h-10 flex items-center justify-start px-4 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              View Invoices & Receipts
            </Button>
            <Button 
              onClick={() => navigate('/patient/settings?tab=health_sharing')}
              icon={<ShareAltOutlined />}
              className="w-full rounded-xl font-bold text-xs h-10 flex items-center justify-start px-4 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              Share Health Record
            </Button>
          </div>
        </Card>

      </div>

      {/* ── Grid Row 2: Snapshot & Today's Actions ── */}
      <div className={`grid grid-cols-1 ${actionItems.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        
        {/* Care Summary Snapshot */}
        <Card 
          className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" 
          title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Care Summary Snapshot</span>}
          extra={<button onClick={() => navigate('/patient/care-team')} className="text-xs text-[#8C4BFF] font-bold border-none bg-transparent cursor-pointer hover:underline">View Care Team →</button>}
        >
          <div className="space-y-3">
            
            {/* Snapshot Row 1: Primary Care Practitioner */}
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
              <div>
                <span className="font-bold text-xs text-slate-808 dark:text-slate-200 block">Primary Care Practitioner</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{primaryDoctor} ({primaryDoctorSpecialty})</span>
              </div>
              <Tag color="purple" className="m-0 font-bold border-none text-xs rounded-full px-3">{doctorsCount} Team Doctor{doctorsCount === 1 ? '' : 's'}</Tag>
            </div>

            {/* Snapshot Row 2: Active Treatment Plan */}
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
              <div>
                <span className="font-bold text-xs text-slate-808 dark:text-slate-200 block">Active Treatment Plan</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{plansSummaryText}</span>
              </div>
              <button 
                onClick={() => navigate('/patient/treatment-plans')}
                className="text-xs text-[#8C4BFF] font-bold border-none bg-transparent cursor-pointer hover:underline"
              >
                {activePlansCount} Active Plan{activePlansCount === 1 ? '' : 's'}
              </button>
            </div>

          </div>
        </Card>

        {/* Today's Actions (Conditionally rendered only when there are actual active pending actions) */}
        {actionItems.length > 0 && (
          <Card 
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" 
            title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Today's Actions</span>}
            extra={<Tag color="purple" className="rounded-full text-[10px] font-bold border-none px-2.5 py-0.5">{actionItems.length} Action{actionItems.length === 1 ? '' : 's'} Pending</Tag>}
          >
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div key={item.key} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center`}>
                      {item.icon}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-808 dark:text-slate-200 block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                  <Button 
                    size="small"
                    onClick={item.action}
                    className={`rounded-lg text-[10px] font-bold h-8 ${item.btnClass}`}
                  >
                    {item.btnText}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>

    </div>
  )
}
