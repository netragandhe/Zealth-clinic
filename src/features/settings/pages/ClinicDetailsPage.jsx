import React from 'react'
import { useNavigate } from 'react-router-dom'
import ClinicDetailsTab from '../components/ClinicDetailsTab'

export default function ClinicDetailsPage() {
  const navigate = useNavigate()

  return (
    <div className="documents-page-container py-2 space-y-6">
      <button 
        onClick={() => navigate('/clinic')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer mb-2 transition-colors w-fit"
      >
        <span className="text-sm">←</span>
        <span>Back to Dashboard</span>
      </button>
      
      <div className="max-w-[1000px]">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 lg:p-8 mt-2">
          <ClinicDetailsTab />
        </div>
      </div>
    </div>
  )
}
