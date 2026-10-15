import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Select, Button, Form, Input, Checkbox, Slider, Modal, Divider, DatePicker, TimePicker } from 'antd'
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'

// Modular Sales Dashboard components
import SalesDashboard from '../components/sales/SalesDashboard'
import SalesLeads from '../components/sales/SalesLeads'
import SalesPipeline from '../components/sales/SalesPipeline'
import SalesClinics from '../components/sales/SalesClinics'
import SalesCommissions from '../components/sales/SalesCommissions'
import SalesTasks from '../components/sales/SalesTasks'
import SalesMessages from '../components/sales/SalesMessages'
// Modular Head Admin Dashboard components
import HeadAdminDashboard from '../components/head-admin/HeadAdminDashboard'
import HeadAdminClinics from '../components/head-admin/HeadAdminClinics'
import HeadAdminSubscriptions from '../components/head-admin/HeadAdminSubscriptions'
import HeadAdminBilling from '../components/head-admin/HeadAdminBilling'
import HeadAdminAISettings from '../components/head-admin/HeadAdminAISettings'
import HeadAdminGlobalTemplates from '../components/head-admin/HeadAdminGlobalTemplates'
import HeadAdminUsers from '../components/head-admin/HeadAdminUsers'
import HeadAdminAuditLogs from '../components/head-admin/HeadAdminAuditLogs'
import HeadAdminPlatformAnalytics from '../components/head-admin/HeadAdminPlatformAnalytics'
import HeadAdminNotifications from '../components/head-admin/HeadAdminNotifications'
import HeadAdminAdminManagement from '../components/head-admin/HeadAdminAdminManagement'
import HeadAdminSalesAffiliates from '../components/head-admin/HeadAdminSalesAffiliates'
import HeadAdminSupportCentre from '../components/head-admin/HeadAdminSupportCentre'

const { Option } = Select

// ── DYNAMIC SECTION CONTENT RENDERER ────────────────────────────────────────
function renderSectionContent(section, role, store, navigate, modalContextProps) {
  // Check combination of role and active subpage section to render custom modular views
  if (role === 'head_admin') {
    switch (section) {
      case 'notifications':
        return <HeadAdminNotifications />
      case 'clinics-manage':
        return <HeadAdminClinics store={store} />
      case 'admin-management':
        return <HeadAdminAdminManagement />
      case 'sales-affiliates':
        return <HeadAdminSalesAffiliates />
      case 'subscriptions':
        return <HeadAdminSubscriptions />
      case 'billing':
        return <HeadAdminBilling />
      case 'ai-settings':
        return <HeadAdminAISettings />
      case 'global-templates':
        return <HeadAdminGlobalTemplates />
      case 'users':
        return <HeadAdminUsers />
      case 'audit-logs':
        return <HeadAdminAuditLogs />
      case 'support-centre':
        return <HeadAdminSupportCentre />
      case 'messages':
        return <SalesMessages store={store} />
      case 'platform-analytics':
        return <HeadAdminPlatformAnalytics />
      default:
        break
    }
  }



  // Fallback default card
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 bg-white dark:bg-slate-900">
      <h3 className="font-bold text-slate-800 dark:text-white capitalize m-0">{section.replace('-', ' ')} view</h3>
      <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">This section is dynamically loaded for the active {role} session.</p>
    </div>
  )
}

// ── MAIN DASHBOARD PAGE CONTAINER ───────────────────────────────────────────
export default function SuperAdminDashboardPage() {
  const { section } = useParams()
  const store = useClinicStore()
  const userRole = store.userRole
  const navigate = useNavigate()

  const modalContextProps = {
    setLeadModalOpen: store.setSalesLeadModalOpen,
    setDemoModalOpen: store.setSalesDemoModalOpen,
    setTaskModalOpen: store.setSalesTaskModalOpen,
    setProposalModalOpen: store.setSalesProposalModalOpen,
    setConvertModalOpen: store.setSalesConvertModalOpen,
    setSelectedLeadId: store.setSalesSelectedLeadId
  }

  // 1. If a dynamic sub-section is active, render it
  if (section) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/head-admin/dashboard" className="hover:text-[#8C4BFF] transition-colors">Dashboard</Link>
            <RightOutlined style={{ fontSize: 9 }} />
            <span className="text-slate-600 dark:text-slate-330 capitalize">{section.replace('-', ' ')}</span>
          </div>
          <button 
            onClick={() => navigate('/head-admin/dashboard')}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer transition-colors w-fit p-0"
          >
            <span className="text-sm">←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
        
        {renderSectionContent(section, userRole, store, navigate, modalContextProps)}
      </div>
    )
  }

  // 2. Render Main Dashboard according to the logged-in userRole
  return (
    <div className="space-y-6">
      <HeadAdminDashboard store={store} navigate={navigate} />
    </div>
  )
}
