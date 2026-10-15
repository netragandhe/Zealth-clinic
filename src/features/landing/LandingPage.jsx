import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from 'antd'
import {
  CheckCircleFilled,
  CheckOutlined,
  ThunderboltFilled,
  DownOutlined,
  ArrowRightOutlined,
  SyncOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'
import { useClinicStore } from '../../store/clinicStore'

// ── Allied Health Specialties Data ──────────────────────────────────────────
const SPECIALTIES = [
  {
    id: 'physio',
    name: 'Physiotherapy',
    badge: 'Medicare EPC & NDIS',
    icon: '🏃',
    headline: 'Biomechanical Assessments & Custom Rehabilitation Plans',
    desc: 'Automated joint range-of-motion charts, home exercise prescription, and Medicare Chronic Disease Management (EPC) bulk-billing.',
    template: 'SOAP: Lower Lumbar Spine Assessment',
    sampleCode: 'MBS Item 10960 ($58.30 Rebate) | NDIS 15_056_0128_1_3 ($193.99/hr)',
    points: ['Body chart annotation & visual pain mapping', 'Direct HEP export to client mobile app', 'Automated GP progress referral letters'],
  },
  {
    id: 'psych',
    name: 'Psychology & Mental Health',
    badge: 'MHTP & Telehealth',
    icon: '🧠',
    headline: 'Psychometric Outcome Tracking with Secure Telehealth',
    desc: 'Built-in DASS-21, K10, and GAD-7 psychometrics, encrypted Telehealth video, and automated Mental Health Treatment Plan (MHTP) reviews.',
    template: 'Clinical Formulation: Cognitive Behavioural Therapy',
    sampleCode: 'MBS Item 80110 ($93.35 Rebate) | Private Health Fund HICAPS',
    points: ['Automated 6-session GP review reminders', 'Client self-assessment portal before session', 'Strict end-to-end encrypted session vault'],
  },
  {
    id: 'podiatry',
    name: 'Podiatry',
    badge: 'DVA & Biomechanics',
    icon: '🦶',
    headline: 'Gait Analysis, Diabetic Foot Screening & Orthotic Tracking',
    desc: 'Diabetic foot risk stratification, custom orthotic lab orders, and Department of Veterans Affairs (DVA) claiming in one workflow.',
    template: 'Neuro-Vascular & Biomechanical Screening',
    sampleCode: 'DVA Item F004 | MBS Item 10962 | NDIS Assistive Technology',
    points: ['3D digital orthotic lab order integration', 'Automated vascular Doppler & monofilament tracking', 'DVA health provider direct claim export'],
  },
  {
    id: 'speech',
    name: 'Speech Pathology',
    badge: 'NDIS Core & Capacity',
    icon: '🗣️',
    headline: 'Functional Communication Goals & NDIS Reporting',
    desc: 'Track articulation, language milestones, and dysphagia assessments with automated NDIS Functional Capacity Assessment generation.',
    template: 'NDIS Plan Review & Capacity Building Report',
    sampleCode: 'NDIS 15_052_0128_1_3 Capacity Building Assessment ($193.99/hr)',
    points: ['Goal Attainment Scaling (GAS) matrices', 'One-click NDIS end-of-plan summary reports', 'Family & school educator communication portal'],
  },
  {
    id: 'ot',
    name: 'Occupational Therapy',
    badge: 'Home & Workplace Assessments',
    icon: '🍎',
    headline: 'Sensory Profiles, Ergonomics & Daily Living Assessments',
    desc: 'Home modification reports, sensory processing measure rubrics, and assistive equipment trials managed with zero duplicate paperwork.',
    template: 'FIM / WHODAS 2.0 Functional Living Matrix',
    sampleCode: 'NDIS 15_056_0128_1_3 | WorkCover NSW / WorkSafe Vic',
    points: ['Equipment trial quotes & supplier tracking', 'Home safety checklist with photo uploads', 'Automated Plan Manager & Support Coordinator invoicing'],
  },
]

// ── Frequently Asked Questions ──────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Is ZealthOS compliant with Australian health privacy laws?',
    a: 'Yes, 100%. ZealthOS is engineered specifically for Australian allied health clinics. All clinic data is stored in ISO-27001 certified AWS/GCP data centres in Sydney with AES-256 encryption at rest and TLS 1.3 in transit, fully compliant with the Australian Privacy Act 1988 and Australian Privacy Principles (APPs).',
  },
  {
    q: 'How does NDIS & Medicare bulk-billing work on ZealthOS?',
    a: 'ZealthOS features built-in NDIS line-item lookups (support catalogue updated for 2026/2027), automated PRODA Medicare claims, and direct export for Plan-Managed, Self-Managed, and Agency-Managed participants. Invoices and PRODA files are generated in 1 click.',
  },
  {
    q: 'Can I import our existing patient records from Cliniko, Halaxy, or Power Diary?',
    a: 'Yes. Our automated clinic migration tool imports clients, appointments, contacts, and historical clinical notes via standard CSV/JSON exports. Our team also provides free concierge onboarding assistance for clinics with 3+ practitioners.',
  },
  {
    q: 'How do I get started with ZealthOS?',
    a: 'Getting started takes under 2 minutes. Choose your plan, register your clinic, and you can immediately begin scheduling appointments, documenting clinical notes, and billing NDIS or Medicare.',
  },
  {
    q: 'Can we change, upgrade, or cancel our subscription plan anytime?',
    a: 'Absolutely. You can switch between Monthly and Annual billing or upgrade your plan at any time in Clinic Settings. If you cancel, your data remains exportable at no extra charge.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const darkMode = useClinicStore((state) => state.darkMode)
  const toggleDarkMode = useClinicStore((state) => state.toggleDarkMode)

  const [scrolled, setScrolled] = useState(false)
  const [billingCycle, setBillingCycle] = useState('MONTHLY') // 'MONTHLY' | 'ANNUAL'
  const [activeSpecialty, setActiveSpecialty] = useState(SPECIALTIES[0])
  const [activeSandboxTab, setActiveSandboxTab] = useState('calendar') // 'calendar' | 'scribe' | 'billing' | 'analytics'
  const [practitionerCount, setPractitionerCount] = useState(4)
  const [expandedFaq, setExpandedFaq] = useState(0)

  // ── Dynamic DB Subscription Plans Synced from Super Admin ──
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Fetch plans from backend DB (managed by Super Admin)
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
      const res = await api.get('/api/subscription-plans')
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Only show active plans configured in Super Admin
        const active = res.data.data.filter(p => p.isActive !== false)
        setPlans(active)
      } else {
        // Fallback default plans if DB empty
        setPlans([
          {
            id: 'default-starter',
            name: 'Basic',
            monthlyPrice: 49,
            yearlyPrice: 470,
            features: ['Basic Patient Management', 'Appointment Scheduling', 'Clinical Notes', 'Clinical Auto-Summarization'],
            isActive: true,
          },
          {
            id: 'default-pro',
            name: 'Pro',
            monthlyPrice: 499,
            yearlyPrice: 4790,
            features: ['Basic Patient Management', 'Appointment Scheduling', 'Clinical Notes', 'Clinical Auto-Summarization'],
            isActive: true,
          },
          {
            id: 'default-enterprise',
            name: 'Premium',
            monthlyPrice: 999,
            yearlyPrice: 9590,
            features: ['Basic Patient Management', 'Appointment Scheduling', 'Clinical Notes', 'Clinical Auto-Summarization'],
            isActive: true,
          },
        ])
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err)
    } finally {
      setLoadingPlans(false)
    }
  }

  useEffect(() => {
    document.title = 'ZealthOS — Practice Management for Allied Health Clinics'
    fetchPlans()

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Parse features helper (handles array of strings, array of objects, or newline text)
  const getPlanFeatures = (plan) => {
    if (!plan || !plan.features) return []
    if (Array.isArray(plan.features)) {
      return plan.features.map(f => (typeof f === 'object' && f !== null && f.text ? f.text : String(f)))
    }
    if (typeof plan.features === 'string') {
      try {
        const parsed = JSON.parse(plan.features)
        if (Array.isArray(parsed)) {
          return parsed.map(f => (typeof f === 'object' && f !== null && f.text ? f.text : String(f)))
        }
      } catch {
        return plan.features.split('\n').map(s => s.trim()).filter(Boolean)
      }
    }
    return []
  }

  // Handle plan selection -> go to registration
  const handleSelectPlan = (plan) => {
    navigate(`/register?plan=${encodeURIComponent(plan.name)}&cycle=${billingCycle.toLowerCase()}`)
  }

  // ROI calculations
  const hoursSavedPerWeek = Math.round(practitionerCount * 3.8)
  const billingSavedPerMonth = Math.round(practitionerCount * 420)
  const annualPracticeBoost = Math.round(practitionerCount * 8600)

  // Interactive sandbox mock notes
  const [aiGenerating, setAiGenerating] = useState(false)
  const [sampleNote, setSampleNote] = useState(
    'Client presents with 3-week history of right patellar tendon tenderness post increased plyometric training. Mild swelling noted over inferior pole.'
  )

  const handleSimulateAiNote = () => {
    setAiGenerating(true)
    setTimeout(() => {
      setSampleNote(
        'AI Summary: 28yo runner with unilateral right patellar tendinopathy (VISA-P score: 62/100). Commenced heavy slow resistance protocol (eccentric squats). Client tolerated 4 sets of 8 reps @ 70% 1RM without symptom exacerbation. Reviewed NDIS funding line for ongoing exercise therapy.'
      )
      setAiGenerating(false)
      toast.success('Clinical progress note generated by AI Scribe!', { icon: '✨' })
    }, 900)
  }

  // ── Theme tokens ──
  const theme = {
    bg: darkMode ? '#090D16' : '#F8FAFC',
    cardBg: darkMode ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
    cardBorder: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
    textMain: darkMode ? '#FFFFFF' : '#0F172A',
    textMuted: darkMode ? '#94A3B8' : '#64748B',
    headerBg: scrolled
      ? (darkMode ? 'rgba(9, 13, 22, 0.94)' : 'rgba(255, 255, 255, 0.95)')
      : (darkMode ? 'rgba(9, 13, 22, 0.8)' : 'rgba(255, 255, 255, 0.85)'),
    headerBorder: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    subPanelBg: darkMode ? 'rgba(30, 41, 59, 0.6)' : '#F1F5F9',
    subPanelBorder: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    sandboxWindowHeader: darkMode ? 'rgba(2, 6, 23, 0.95)' : '#F8FAFC',
    codeBlockBg: darkMode ? 'rgba(2, 6, 23, 0.95)' : '#F8FAFC',
    toggleBg: darkMode ? '#1E293B' : '#E2E8F0',
    toggleBorder: darkMode ? '#334155' : '#CBD5E1',
    footerBg: darkMode ? '#05080E' : '#F1F5F9',
    footerBorder: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    cardShadow: darkMode ? '0 12px 36px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(0, 0, 0, 0.06)',
  }

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
      background: theme.bg,
      color: theme.textMain,
      minHeight: '100vh',
      overflowX: 'hidden',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      
      {/* ─── Modern Sticky Header ─── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: theme.headerBg,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.headerBorder}`,
          transition: 'all 0.3s ease',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo & Sydney Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #8C4BFF, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: '0 4px 16px rgba(140, 75, 255, 0.45)',
            }}>
              Z
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: theme.textMain }}>ZealthOS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
                <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>Allied Health Cloud</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
            {[
              { label: 'Interactive Sandbox', href: '#sandbox' },
              { label: 'Specialties', href: '#specialties' },
              { label: 'Plans & Pricing', href: '#pricing' },
              { label: 'ROI Calculator', href: '#calculator' },
              { label: 'FAQ', href: '#faq' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#8C4BFF'}
                onMouseLeave={e => e.target.style.color = theme.textMuted}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Header Actions & Light/Dark Mode Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            
            {/* Exact Light / Dark Mode Toggle Switch (Matches Dashboard & Login) */}
            <div
              onClick={() => {
                toggleDarkMode()
                toast.success(`${!darkMode ? 'Dark' : 'Light'} Mode activated.`, { duration: 1000 })
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: theme.toggleBg,
                padding: 3,
                borderRadius: 999,
                cursor: 'pointer',
                userSelect: 'none',
                width: 56,
                height: 28,
                border: `1px solid ${theme.toggleBorder}`,
                transition: 'all 0.25s ease',
              }}
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
            >
              {/* Sliding Knob */}
              <div
                style={{
                  position: 'absolute',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  left: darkMode ? 31 : 3,
                  background: darkMode ? '#0F172A' : '#FFFFFF',
                }}
              />
              {/* Sun Icon (Left) */}
              <div style={{ width: 22, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <SunOutlined
                  style={{
                    fontSize: 11,
                    color: darkMode ? '#64748B' : '#F59E0B',
                    transition: 'color 0.2s',
                  }}
                />
              </div>
              {/* Moon Icon (Right) */}
              <div style={{ width: 22, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginLeft: 'auto' }}>
                <MoonOutlined
                  style={{
                    fontSize: 11,
                    color: darkMode ? '#8C4BFF' : '#94A3B8',
                    transition: 'color 0.2s',
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1'}`,
                color: theme.textMain,
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              Sign in
            </button>

            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #8C4BFF 0%, #6366F1 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '9px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(140, 75, 255, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 24px rgba(140, 75, 255, 0.55)'
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 18px rgba(140, 75, 255, 0.4)'
              }}
            >
              Get Started →
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Glowing Accents ─── */}
      <section style={{ position: 'relative', paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, overflow: 'hidden' }}>
        {/* Luminous background glow */}
        <div style={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 450,
          background: darkMode
            ? 'radial-gradient(circle, rgba(140, 75, 255, 0.25) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(140, 75, 255, 0.15) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          
          {/* Release Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 999,
            background: darkMode ? 'rgba(140, 75, 255, 0.15)' : 'rgba(140, 75, 255, 0.08)',
            border: `1px solid ${darkMode ? 'rgba(140, 75, 255, 0.35)' : 'rgba(140, 75, 255, 0.25)'}`,
            marginBottom: 24,
          }}>
            <span style={{ color: '#F59E0B', fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#E2E8F0' : '#6D28D9' }}>
              Built for Australian Allied Health • Medicare PRODA & NDIS Ready
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-1.8px',
            marginBottom: 20,
            color: theme.textMain,
          }}>
            Allied health practice management, <br />
            <span style={{
              background: 'linear-gradient(135deg, #8C4BFF 0%, #0284C7 60%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              without the administrative headache.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: theme.textMuted,
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            Appointments, AI clinical scribe notes, NDIS support item billing, Medicare EPC claiming, and client communication — unified in an ultra-fast, Australian-hosted cloud workspace.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #8C4BFF 0%, #6366F1 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '16px 36px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(140, 75, 255, 0.45)',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(140, 75, 255, 0.6)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(140, 75, 255, 0.45)'
              }}
            >
              <span>Get Started</span>
              <ArrowRightOutlined />
            </button>

            <a
              href="#sandbox"
              style={{
                background: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                color: theme.textMain,
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1'}`,
                padding: '16px 28px',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.12)' : '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF'}
            >
              <span>Explore Interactive Sandbox</span>
              <DownOutlined style={{ fontSize: 12 }} />
            </a>
          </div>

          {/* Social Proof & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap', color: theme.textMuted, fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleFilled style={{ color: '#10B981' }} /> No credit card required
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleFilled style={{ color: '#10B981' }} /> Australian Privacy Principles (APP)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleFilled style={{ color: '#10B981' }} /> Instant Cliniko / Halaxy data import
            </span>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Interactive Hands-On Product Sandbox ─── */}
      <section id="sandbox" style={{ padding: '40px 24px 80px', maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 24,
          boxShadow: theme.cardShadow,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}>
          
          {/* Sandbox Top Bar with Window Dots & Module Selector */}
          <div style={{
            background: theme.sandboxWindowHeader,
            borderBottom: `1px solid ${theme.cardBorder}`,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 700, color: theme.textMuted, letterSpacing: 0.5 }}>
                ZEALTHOS LIVE CLINICAL SANDBOX — INTERACTIVE DEMO
              </span>
            </div>

            {/* Interactive Tab Switcher */}
            <div style={{ display: 'flex', gap: 6, background: darkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0', padding: 4, borderRadius: 12 }}>
              {[
                { id: 'calendar', label: '📅 Smart Scheduling' },
                { id: 'scribe', label: '🤖 AI Clinical Scribe' },
                { id: 'billing', label: '💳 NDIS & Medicare' },
                { id: 'analytics', label: '📊 Practice Health' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSandboxTab(tab.id)}
                  style={{
                    background: activeSandboxTab === tab.id ? 'linear-gradient(135deg, #8C4BFF, #6366F1)' : 'transparent',
                    color: activeSandboxTab === tab.id ? '#FFFFFF' : theme.textMuted,
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Body Content */}
          <div style={{ padding: 28, minHeight: 380 }}>
            
            {/* TAB 1: Smart Scheduling */}
            {activeSandboxTab === 'calendar' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.textMain }}>Today's Clinical Roster — Sydney Main Branch</h3>
                    <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0' }}>Click an appointment slot to view live clinical actions</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#059669', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>
                      ● 3 Clinicians Online
                    </span>
                    <button
                      onClick={() => toast.success('New booking modal simulated! Client appointment added to calendar.', { icon: '📅' })}
                      style={{ background: '#8C4BFF', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Quick Book Slot
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {[
                    { time: '09:00 AM - 09:45 AM', client: 'Marcus Brody', type: 'Initial Physio Assessment', status: 'Arrived / In Room 2', badgeColor: '#10B981', notes: 'NDIS Plan #43092281 • Plan Managed' },
                    { time: '10:00 AM - 10:45 AM', client: 'Elena Rostova', type: 'Clinical Pilates & Rehab', status: 'In Session', badgeColor: '#3B82F6', notes: 'Medicare EPC Item 10960 (Session 3/5)' },
                    { time: '11:15 AM - 12:00 PM', client: 'Liam O’Connor', type: 'Biomechanical Gait Analysis', status: 'Upcoming', badgeColor: '#F59E0B', notes: 'Private Health Fund Bupa • HICAPS' },
                    { time: '01:30 PM - 02:15 PM', client: 'Aaliyah Khan', type: 'NDIS Capacity Review', status: 'Confirmed', badgeColor: '#8C4BFF', notes: 'Support Coordinator: Sarah Mitchell' },
                  ].map((appt, i) => (
                    <div
                      key={i}
                      onClick={() => toast(`Viewing ${appt.client} (${appt.type}) — Status: ${appt.status}`, { icon: '📋' })}
                      style={{
                        background: theme.subPanelBg,
                        border: `1px solid ${theme.subPanelBorder}`,
                        borderRadius: 14,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.borderColor = '#8C4BFF'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.borderColor = theme.subPanelBorder
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#8C4BFF' }}>{appt.time}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: `${appt.badgeColor}22`, color: appt.badgeColor, fontWeight: 700, border: `1px solid ${appt.badgeColor}44` }}>
                          {appt.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: theme.textMain, margin: '0 0 4px' }}>{appt.client}</h4>
                      <p style={{ fontSize: 12, color: theme.textMuted, margin: '0 0 8px' }}>{appt.type}</p>
                      <div style={{ fontSize: 11, color: theme.textMuted, borderTop: `1px dashed ${theme.cardBorder}`, paddingTop: 8 }}>
                        {appt.notes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: AI Clinical Scribe */}
            {activeSandboxTab === 'scribe' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.textMain }}>AI Clinical Scribe — Real-time SOAP Auto-Generation</h3>
                    <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0' }}>Converts patient dialogue into compliant Australian allied health records</p>
                  </div>
                  <button
                    onClick={handleSimulateAiNote}
                    disabled={aiGenerating}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '8px 18px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ThunderboltFilled />
                    <span>{aiGenerating ? 'Transcribing & Summarizing...' : '⚡ Generate AI Clinical Note'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
                  <div style={{ background: theme.subPanelBg, padding: 16, borderRadius: 14, border: `1px solid ${theme.subPanelBorder}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Simulated Audio Dictation</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>00:04:12 Session Audio Recorded</span>
                    </div>
                    <div style={{ background: theme.codeBlockBg, padding: 12, borderRadius: 8, fontSize: 12, color: theme.textMain, lineHeight: 1.6, fontStyle: 'italic', border: `1px solid ${theme.cardBorder}` }}>
                      "Patient Marcus reports knee pain decreased from 6/10 to 2/10 following prescribed eccentric loading. Range of motion flexion is at 135 degrees. Continuing home exercise program and progressing to bilateral box jumps next week."
                    </div>
                  </div>

                  <div style={{ background: theme.subPanelBg, padding: 18, borderRadius: 14, border: '1px solid rgba(140, 75, 255, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#8C4BFF' }}>Structured SOAP Progress Record</span>
                      <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>AHPRA & Privacy Verified</span>
                    </div>
                    <div style={{ background: theme.codeBlockBg, padding: 14, borderRadius: 10, fontSize: 13, color: theme.textMain, lineHeight: 1.6, border: `1px solid ${theme.cardBorder}` }}>
                      {sampleNote}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NDIS & Medicare */}
            {activeSandboxTab === 'billing' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.textMain }}>Instant Claiming — NDIS Bulk & Medicare PRODA</h3>
                    <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0' }}>Automatic item code reconciliation with 99.8% first-pass claim acceptance</p>
                  </div>
                  <button
                    onClick={() => toast.success('Medicare EPC & NDIS claim submitted to PRODA simulator! Approved in 1.4s', { icon: '✅' })}
                    style={{ background: 'linear-gradient(135deg, #8C4BFF, #6366F1)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Simulate PRODA Bulk Batch
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div style={{ background: theme.subPanelBg, padding: 16, borderRadius: 14, border: `1px solid ${theme.subPanelBorder}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0284C7' }}>NDIS PARTICIPANT</span>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: theme.textMain, margin: '6px 0 2px' }}>Sarah Jenkins (#43019283)</h4>
                    <span style={{ fontSize: 12, color: theme.textMuted }}>Plan Managed • MyPlanManager</span>
                    <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: theme.codeBlockBg, fontSize: 12, border: `1px solid ${theme.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted }}>
                        <span>Item 15_056_0128_1_3:</span>
                        <strong style={{ color: theme.textMain }}>$193.99</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', marginTop: 4, fontWeight: 700 }}>
                        <span>Participant Remainder:</span>
                        <span>$0.00 (Bulk-Billed)</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: theme.subPanelBg, padding: 16, borderRadius: 14, border: `1px solid ${theme.subPanelBorder}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8C4BFF' }}>MEDICARE CDM / EPC</span>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: theme.textMain, margin: '6px 0 2px' }}>Robert Campbell</h4>
                    <span style={{ fontSize: 12, color: theme.textMuted }}>GP Referral: Dr. Andrew Taylor (Bondi)</span>
                    <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: theme.codeBlockBg, fontSize: 12, border: `1px solid ${theme.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted }}>
                        <span>MBS Item 10960:</span>
                        <strong style={{ color: theme.textMain }}>$58.30</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284C7', marginTop: 4, fontWeight: 700 }}>
                        <span>Gap Fee Collected:</span>
                        <span>$35.00 via Stripe</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: theme.subPanelBg, padding: 16, borderRadius: 14, border: `1px solid ${theme.subPanelBorder}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>PRIVATE HEALTH & HICAPS</span>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: theme.textMain, margin: '6px 0 2px' }}>Emma Watson</h4>
                    <span style={{ fontSize: 12, color: theme.textMuted }}>Medibank Private Comprehensive</span>
                    <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: theme.codeBlockBg, fontSize: 12, border: `1px solid ${theme.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted }}>
                        <span>HICAPS Code 505:</span>
                        <strong style={{ color: theme.textMain }}>$85.00</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', marginTop: 4, fontWeight: 700 }}>
                        <span>Rebate Approved:</span>
                        <span>Instant Terminal Sync</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Practice Health Analytics */}
            {activeSandboxTab === 'analytics' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.textMain }}>Executive Clinic Health Scorecard</h3>
                    <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0' }}>Real-time revenue, clinician utilization, and cancellation defense</p>
                  </div>
                  <Tag color="purple" style={{ fontSize: 12, padding: '4px 10px' }}>Updated 2 mins ago</Tag>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { label: 'Monthly Billed Revenue', value: '$48,240', sub: '+14.2% vs last month', color: '#10B981' },
                    { label: 'Clinician Utilization', value: '88.6%', sub: 'Target: 85%+', color: '#0284C7' },
                    { label: 'Late Cancellation Rate', value: '1.8%', sub: 'Reduced with SMS alerts', color: '#8C4BFF' },
                    { label: 'NDIS Claims Accepted', value: '100%', sub: '0 rejected line items', color: '#F59E0B' },
                  ].map((stat, idx) => (
                    <div key={idx} style={{ background: theme.subPanelBg, padding: 18, borderRadius: 14, border: `1px solid ${theme.subPanelBorder}` }}>
                      <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>{stat.label}</span>
                      <h3 style={{ fontSize: 28, fontWeight: 900, color: theme.textMain, margin: '8px 0 4px' }}>{stat.value}</h3>
                      <span style={{ fontSize: 12, color: stat.color, fontWeight: 700 }}>{stat.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ─── SECTION: Allied Health Specialty Switcher ─── */}
      <section id="specialties" style={{ padding: '60px 24px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#8C4BFF', textTransform: 'uppercase', letterSpacing: 1 }}>
            Purpose-Built Workflows
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900, color: theme.textMain, marginTop: 6, letterSpacing: '-0.8px' }}>
            Engineered for your clinical discipline
          </h2>
          <p style={{ fontSize: 16, color: theme.textMuted, maxWidth: 650, margin: '0 auto' }}>
            No clunky generic forms. Select your specialty to see customized templates, item codes, and clinical workflows.
          </p>
        </div>

        {/* Specialty Selector Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {SPECIALTIES.map(sp => {
            const isSelected = activeSpecialty.id === sp.id
            return (
              <button
                key={sp.id}
                onClick={() => setActiveSpecialty(sp)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #8C4BFF, #6366F1)' : theme.cardBg,
                  border: `1px solid ${isSelected ? 'transparent' : theme.cardBorder}`,
                  color: isSelected ? '#FFFFFF' : theme.textMain,
                  padding: '12px 20px',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 18px rgba(140, 75, 255, 0.4)' : (darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.03)'),
                }}
              >
                <span>{sp.icon}</span>
                <span>{sp.name}</span>
              </button>
            )
          })}
        </div>

        {/* Active Specialty Detail Showcase Card */}
        <div style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 24,
          padding: 36,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 32,
          alignItems: 'center',
          boxShadow: theme.cardShadow,
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(140, 75, 255, 0.15)', border: '1px solid rgba(140, 75, 255, 0.35)', color: '#8C4BFF', fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
              <span>{activeSpecialty.icon}</span>
              <span>{activeSpecialty.badge}</span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 900, color: theme.textMain, margin: '0 0 12px', lineHeight: 1.2 }}>
              {activeSpecialty.headline}
            </h3>
            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
              {activeSpecialty.desc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeSpecialty.points.map((pt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: theme.textMain }}>
                  <CheckCircleFilled style={{ color: '#10B981', fontSize: 16 }} />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28 }}>
              <button
                onClick={() => navigate(`/register?specialty=${activeSpecialty.id}`)}
                style={{
                  background: 'linear-gradient(135deg, #8C4BFF, #6366F1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Deploy {activeSpecialty.name} Clinic</span>
                <ArrowRightOutlined />
              </button>
            </div>
          </div>

          <div style={{ background: theme.subPanelBg, border: `1px solid ${theme.subPanelBorder}`, borderRadius: 16, padding: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8C4BFF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Clinical Template</span>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: theme.textMain, margin: '8px 0 12px' }}>
              {activeSpecialty.template}
            </h4>
            <div style={{ background: theme.codeBlockBg, padding: 12, borderRadius: 8, marginBottom: 16, border: `1px solid ${theme.cardBorder}` }}>
              <span style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Standard Item & Billing Codes</span>
              <code style={{ fontSize: 12, color: '#0284C7', fontFamily: 'monospace' }}>
                {activeSpecialty.sampleCode}
              </code>
            </div>
            <div style={{ borderLeft: '3px solid #10B981', paddingLeft: 12, fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>
              "Client report generated automatically with Medicare provider number validation and NDIS service agreement verification."
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Dynamic Subscription Plans Synced Live from Super Admin ─── */}
      <section id="pricing" style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        
        {/* Header with Title & Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#059669', fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>Super Admin Synced • Real-Time Database Plans</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: theme.textMain, margin: 0, letterSpacing: '-1px' }}>
              Transparent, scalable pricing
            </h2>
            <p style={{ fontSize: 16, color: theme.textMuted, marginTop: 8, maxWidth: 620 }}>
              No hidden lock-ins. Transparent pricing, unlimited client storage, and Australian data compliance.
            </p>
          </div>

          {/* Monthly / Annual Pill Toggle */}
          <div style={{ display: 'flex', background: theme.toggleBg, padding: 4, borderRadius: 14, border: `1px solid ${theme.toggleBorder}` }}>
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              style={{
                background: billingCycle === 'MONTHLY' ? 'linear-gradient(135deg, #8C4BFF, #6366F1)' : 'transparent',
                color: billingCycle === 'MONTHLY' ? '#FFFFFF' : theme.textMuted,
                border: 'none',
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              style={{
                background: billingCycle === 'ANNUAL' ? 'linear-gradient(135deg, #8C4BFF, #6366F1)' : 'transparent',
                color: billingCycle === 'ANNUAL' ? '#FFFFFF' : theme.textMuted,
                border: 'none',
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <span>Annual</span>
              <span style={{ fontSize: 10, background: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: 999, fontWeight: 800 }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Dynamic Plan Cards Grid */}
        {loadingPlans ? (
          <div style={{ padding: 60, textAlign: 'center', color: theme.textMuted }}>
            <SyncOutlined spin style={{ fontSize: 32, color: '#8C4BFF', marginBottom: 16 }} />
            <p style={{ fontSize: 15 }}>Loading plans from Super Admin...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {plans.map((plan, index) => {
              const features = getPlanFeatures(plan)
              const isPopular = index === 1 || plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('clinic')
              
              // Calculate price based on cycle
              let displayPrice = plan.monthlyPrice
              if (billingCycle === 'ANNUAL') {
                if (plan.yearlyPrice) {
                  displayPrice = Math.round(plan.yearlyPrice / 12)
                } else {
                  displayPrice = Math.round(plan.monthlyPrice * 0.8)
                }
              }

              return (
                <div
                  key={plan.id || index}
                  style={{
                    background: theme.cardBg,
                    border: isPopular ? '2px solid #8C4BFF' : `1px solid ${theme.cardBorder}`,
                    borderRadius: 24,
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: isPopular ? '0 16px 48px rgba(140, 75, 255, 0.22)' : theme.cardShadow,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #8C4BFF, #EC4899)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 14px',
                      borderRadius: 999,
                      letterSpacing: 0.5,
                      boxShadow: '0 4px 14px rgba(140, 75, 255, 0.4)',
                    }}>
                      MOST POPULAR FOR ALLIED HEALTH
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 900, color: theme.textMain, margin: 0, textTransform: 'capitalize' }}>
                        {plan.name}
                      </h3>
                    </div>

                    <p style={{ fontSize: 13, color: theme.textMuted, minHeight: 38, margin: '0 0 20px', lineHeight: 1.5 }}>
                      {plan.description || (isPopular ? 'Complete allied health team workspace with AI Scribe and NDIS bulk claims.' : 'Essential clinic practice management and Medicare claiming.')}
                    </p>

                    {/* Price display */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 44, fontWeight: 900, color: theme.textMain, letterSpacing: '-1px' }}>
                        ${displayPrice}
                      </span>
                      <span style={{ fontSize: 14, color: theme.textMuted, fontWeight: 600 }}>
                        AUD / month
                      </span>
                    </div>

                    <span style={{ fontSize: 12, color: billingCycle === 'ANNUAL' ? '#10B981' : theme.textMuted, display: 'block', marginBottom: 24, fontWeight: 600 }}>
                      {billingCycle === 'ANNUAL'
                        ? `Billed annually ($${plan.yearlyPrice || Math.round(plan.monthlyPrice * 9.6)}/yr) • 2 months free`
                        : 'Billed monthly • Cancel anytime'}
                    </span>

                    <div style={{ height: 1, background: theme.cardBorder, marginBottom: 24 }} />

                    {/* Features checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                      {features.map((feat, fIdx) => (
                        <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: theme.textMain, lineHeight: 1.4 }}>
                          <CheckOutlined style={{ color: '#8C4BFF', fontSize: 13, marginTop: 3, flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan CTA Button */}
                  <div>
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      style={{
                        width: '100%',
                        background: isPopular
                          ? 'linear-gradient(135deg, #8C4BFF, #6366F1)'
                          : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'),
                        border: isPopular ? 'none' : `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1'}`,
                        color: isPopular ? '#FFFFFF' : theme.textMain,
                        padding: '14px 20px',
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: isPopular ? '0 6px 20px rgba(140, 75, 255, 0.4)' : 'none',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        if (!isPopular) e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.16)' : '#E2E8F0'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        if (!isPopular) e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
                      }}
                    >
                      <span>Choose Plan</span>
                      <ArrowRightOutlined />
                    </button>
                    <span style={{ display: 'block', textAlign: 'center', fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
                      Instant activation • Setup in under 2 minutes
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── SECTION: Interactive Practice ROI & Savings Calculator ─── */}
      <section id="calculator" style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 24,
          padding: '40px 36px',
          boxShadow: theme.cardShadow,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1 }}>
              Practice Value Calculator
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 900, color: theme.textMain, margin: '8px 0' }}>
              How much clinical time does your clinic get back?
            </h2>
            <p style={{ fontSize: 15, color: theme.textMuted }}>
              Adjust the slider to your team size and see your estimated time & revenue return.
            </p>
          </div>

          {/* Slider Row */}
          <div style={{ maxWidth: 650, margin: '0 auto 36px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.textMain }}>Active Treating Clinicians:</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#8C4BFF' }}>{practitionerCount} Clinicians</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={practitionerCount}
              onChange={e => setPractitionerCount(Number(e.target.value))}
              style={{
                width: '100%',
                height: 8,
                borderRadius: 999,
                background: 'linear-gradient(to right, #8C4BFF, #38BDF8)',
                cursor: 'pointer',
                accentColor: '#8C4BFF',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
              <span>Solo Clinician (1)</span>
              <span>Small Practice (5)</span>
              <span>Medium Clinic (10)</span>
              <span>Large Network (25)</span>
            </div>
          </div>

          {/* Calculated Output Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div style={{ background: theme.subPanelBg, border: `1px solid ${theme.subPanelBorder}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Clinical Notes Time Saved</span>
              <h3 style={{ fontSize: 32, fontWeight: 900, color: '#8C4BFF', margin: '8px 0 4px' }}>~{hoursSavedPerWeek} hrs/wk</h3>
              <span style={{ fontSize: 12, color: theme.textMuted }}>Recovered from administrative paperwork</span>
            </div>

            <div style={{ background: theme.subPanelBg, border: `1px solid ${theme.subPanelBorder}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Unbilled NDIS / EPC Recovery</span>
              <h3 style={{ fontSize: 32, fontWeight: 900, color: '#0284C7', margin: '8px 0 4px' }}>${billingSavedPerMonth.toLocaleString()} /mo</h3>
              <span style={{ fontSize: 12, color: theme.textMuted }}>Zero missed lines or delayed invoices</span>
            </div>

            <div style={{ background: theme.subPanelBg, border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 16, padding: 22, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>Total Annual Practice Value</span>
              <h3 style={{ fontSize: 32, fontWeight: 900, color: '#10B981', margin: '8px 0 4px' }}>+${annualPracticeBoost.toLocaleString()} AUD</h3>
              <span style={{ fontSize: 12, color: theme.textMuted }}>ROI based on standard Australian billing rates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Interactive FAQ Accordion ─── */}
      <section id="faq" style={{ padding: '60px 24px 80px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: theme.textMain, margin: 0 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 15, color: theme.textMuted, marginTop: 8 }}>
            Everything you need to know about switching your practice to ZealthOS.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = expandedFaq === idx
            return (
              <div
                key={idx}
                onClick={() => setExpandedFaq(isOpen ? null : idx)}
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${isOpen ? '#8C4BFF' : theme.cardBorder}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  cursor: 'pointer',
                  boxShadow: theme.cardShadow,
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: isOpen ? '#8C4BFF' : theme.textMain, margin: 0 }}>
                    {item.q}
                  </h4>
                  <span style={{ color: theme.textMuted, fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </div>
                {isOpen && (
                  <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.6, margin: '14px 0 0', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: 14 }}>
                    {item.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ background: theme.footerBg, borderTop: `1px solid ${theme.footerBorder}`, padding: '50px 24px 30px', color: theme.textMuted, fontSize: 13, transition: 'all 0.3s ease' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #8C4BFF, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>Z</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: theme.textMain }}>ZealthOS</span>
            <span style={{ color: theme.textMuted }}>• Allied Health Practice Management</span>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <a href="/login" style={{ color: theme.textMuted, textDecoration: 'none' }}>Sign In</a>
            <a href="/register" style={{ color: theme.textMuted, textDecoration: 'none' }}>Register Clinic</a>
            <span style={{ color: theme.cardBorder }}>|</span>
            <span style={{ color: theme.textMuted }}>Australian Data Sovereignty</span>
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: '24px auto 0', paddingTop: 20, borderTop: `1px solid ${theme.footerBorder}`, textAlign: 'center', fontSize: 12, color: theme.textMuted }}>
          © {new Date().getFullYear()} ZealthOS Pty Ltd. All rights reserved. Australian Privacy Act 1988 & AHPRA Compliant.
        </div>
      </footer>

    </div>
  )
}
