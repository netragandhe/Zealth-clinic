import React from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import logoImg from '../../../assets/logo2.png'
import { useClinicStore } from '../../../store/clinicStore'
import { SunOutlined, MoonOutlined, ArrowLeftOutlined } from '@ant-design/icons'

export default function LoginPage() {
  const navigate = useNavigate()
  const darkMode = useClinicStore((state) => state.darkMode)
  const toggleDarkMode = useClinicStore((state) => state.toggleDarkMode)

  return (
    <div className={`min-h-screen overflow-y-auto flex items-center justify-center p-4 lg:p-8 py-8 font-sans relative transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-[#F8FAFC] dark:bg-slate-900 text-slate-800'}`}>
      
      {/* Back to Website Button */}
      <button 
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none shadow-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#8C4BFF] hover:border-[#8C4BFF]/50"
      >
        <ArrowLeftOutlined style={{ fontSize: 11 }} />
        <span>Back to Website</span>
      </button>

      {/* Light/Dark Toggle Switch */}
      <div 
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 z-50 flex items-center bg-slate-700 dark:bg-slate-800 p-1 rounded-full cursor-pointer select-none w-14 h-7 border border-slate-650 dark:border-slate-700"
      >
        {/* White Sliding Knob */}
        <div 
          className="absolute w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow-md transition-all duration-200"
          style={{
            left: darkMode ? '31px' : '3px',
          }}
        />
        {/* Sun Icon (Left) */}
        <div className="w-6 h-5 flex items-center justify-center z-10">
          <SunOutlined 
            style={{ 
              fontSize: 11, 
              color: darkMode ? '#94A3B8' : '#1E293B',
              transition: 'color 0.2s'
            }} 
          />
        </div>
        {/* Moon Icon (Right) */}
        <div className="w-6 h-5 flex items-center justify-center z-10 ml-auto">
          <MoonOutlined 
            style={{ 
              fontSize: 11, 
              color: darkMode ? '#1E293B' : '#94A3B8',
              transition: 'color 0.2s'
            }} 
          />
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        
        {/* Left Column - Floating Purple Gradient Card (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex bg-[#4E14E2] bg-gradient-to-tr from-[#250059] via-[#4E14E2] to-[#9934FF] rounded-[2.5rem] p-12 flex-col justify-center h-[600px] lg:h-[650px] relative overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/10">
          
          {/* Curved silk/glow streaks overlay */}
          <div className="absolute inset-0 opacity-40 select-none pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M-100,500 C120,420 180,250 280,100 C350,0 420,-50 500,-100" stroke="url(#paint_wave1)" strokeWidth="120" strokeLinecap="round" />
              <path d="M-50,550 C170,470 230,300 330,150 C400,50 470,0 550,-50" stroke="url(#paint_wave2)" strokeWidth="80" strokeLinecap="round" />
              <path d="M-150,450 C70,370 130,200 230,50 C300,-50 370,-100 450,-150" stroke="url(#paint_wave3)" strokeWidth="140" strokeLinecap="round" />
              <defs>
                <linearGradient id="paint_wave1" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                  <stop offset="40%" stopColor="#E0C3FC" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8EC5FC" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint_wave2" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
                  <stop offset="60%" stopColor="#E2D4F0" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="paint_wave3" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Radial blur hotspots for realistic glassmorphism depth */}
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#9B51E0] rounded-full blur-[100px] opacity-45 mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-20%] w-[90%] h-[90%] bg-[#56CCF2] rounded-full blur-[120px] opacity-25 mix-blend-screen pointer-events-none"></div>

          {/* Text Overlays matching the image exactly */}
          <div className="relative z-10 text-left space-y-0.5">
            <div className="text-4xl lg:text-5xl font-normal m-0 tracking-tight leading-tight text-white" style={{ color: '#ffffff' }}>
              Zealth OS
            </div>
            <div className="text-4xl lg:text-5xl font-normal m-0 tracking-tight leading-tight pb-6 text-white" style={{ color: '#ffffff' }}>
              Practice management for allied health clinics.
            </div>
            <div className="text-xs font-normal max-w-sm leading-relaxed tracking-wide mt-1 text-white" style={{ color: '#ffffff' }}>
              Manage appointments, client records and clinic administration in one place.
            </div>
          </div>
        </div>

        {/* Right Column - Centered Sign In Form Panel */}
        <div className="flex flex-col items-center justify-center max-w-md w-full mx-auto py-2">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6 select-none text-slate-800 dark:text-white">
            <img src={logoImg} alt="Zealth OS Logo" style={{ height: '28px', width: 'auto' }} className="object-contain dark:invert" />
          </div>

          {/* Tab Selector Buttons */}
          <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full flex space-x-1 mb-4 border border-slate-100 dark:border-slate-800 shadow-inner">
            <button className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold px-6 py-1.5 rounded-full shadow-sm cursor-pointer select-none">
              Log in
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-semibold px-6 py-1.5 rounded-full cursor-pointer select-none"
            >
              Create Account
            </button>
          </div>

          {/* Login Form component wrapper */}
          <LoginForm />
        </div>

      </div>
    </div>
  )
}
