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
import SalesReports from '../components/sales/SalesReports'
import SalesSettings from '../components/sales/SalesSettings'

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

// Modular Practitioner Dashboard components
import PractitionerDashboard from '../components/practitioner/PractitionerDashboard'
import PractitionerConsultation from '../components/practitioner/PractitionerConsultation'
import PractitionerNotesReports from '../components/practitioner/PractitionerNotesReports'
import PractitionerExercisesPlans from '../components/practitioner/PractitionerExercisesPlans'
import PractitionerReferrals from '../components/practitioner/PractitionerReferrals'
import PractitionerBilling from '../components/practitioner/PractitionerBilling'
import PractitionerMessages from '../components/practitioner/PractitionerMessages'
import PractitionerTasks from '../components/practitioner/PractitionerTasks'

// Modular Patient Dashboard components
import PatientDashboard from '../components/patient/PatientDashboard'
import PatientExercises from '../components/patient/PatientExercises'
import PatientPayments from '../components/patient/PatientPayments'
import PatientAppointments from '../components/patient/PatientAppointments'
import PatientCareTeam from '../components/patient/PatientCareTeam'
import PatientTreatmentPlans from '../components/patient/PatientTreatmentPlans'
import PatientProgressOutcomes from '../components/patient/PatientProgressOutcomes'
import PatientFormsDocuments from '../components/patient/PatientFormsDocuments'
import PatientFundingClaims from '../components/patient/PatientFundingClaims'
import PatientMessages from '../components/patient/PatientMessages'
import PatientHealthSharing from '../components/patient/PatientHealthSharing'

// Modular Clinic Admin Dashboard components
import ClinicAdminDashboard from '../components/clinic/ClinicAdminDashboard'

const { Option } = Select

// ── DYNAMIC SECTION CONTENT RENDERER ────────────────────────────────────────
function renderSectionContent(section, role, store, navigate, modalContextProps) {
  if (section === 'notifications') {
    return <HeadAdminNotifications />
  }
  // Check combination of role and active subpage section to render custom modular views






  if (role === 'patient') {
    switch (section) {
      case 'calendar':
        return <PatientAppointments />
      case 'care-team':
        return <PatientCareTeam />
      case 'treatment-plans':
        return <PatientTreatmentPlans />
      case 'exercises':
        return <PatientExercises />
      case 'progress':
        return <PatientProgressOutcomes />
      case 'forms-documents':
        return <PatientFormsDocuments />
      case 'funding':
        return <PatientFundingClaims />
      case 'payments':
        return <PatientPayments />
      case 'messages':
        return <PatientMessages />
      case 'health-sharing':
        return <PatientHealthSharing />
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
export default function PatientPortalDashboardPage() {
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
        {renderSectionContent(section, userRole, store, navigate, modalContextProps)}
      </div>
    )
  }

  // 2. Render Main Dashboard according to the logged-in userRole
  return (
    <div className="space-y-6">
      <PatientDashboard store={store} navigate={navigate} />
    </div>
  )
}
