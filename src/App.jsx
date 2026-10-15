import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, theme } from 'antd'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import { LoginPage, ForgotPasswordPage, RegisterPage } from './features/auth'
import LandingPage from './features/landing/LandingPage'
import DashboardLayout from './layouts/DashboardLayout'
import { DashboardPage, SuperAdminDashboardPage, SalesExecutiveDashboardPage, ClinicAdminDashboardPage, PractitionerDashboardPage, PatientPortalDashboardPage } from './features/dashboard'
import { CalendarPage, SuperAdminCalendarPage, SalesExecutiveCalendarPage, ClinicAdminCalendarPage, PractitionerCalendarPage, PatientPortalCalendarPage } from './features/calendar'
import { PatientsPage, ClientProfilePage, WaitlistPage, ContactsPage, ContactProfilePage } from './features/patients'
import { InvoicesPage } from './features/invoices'
import { ReportsPage, DocumentsPage } from './features/reports'
import { SettingsPage, SuperAdminSettingsPage, SalesExecutiveSettingsPage, ClinicAdminSettingsPage, PractitionerSettingsPage, PatientPortalSettingsPage, AdminPage, BranchPage, DoctorsManagePage, SubscriptionPage, AiNotePage, TenantPage, PaymentTermsPage, TemplateManagePage, AdminProfilePage } from './features/settings'
import { PaymentsPage } from './features/payments'
import { ProductsPage } from './features/products'
import LiveChatPage from './features/chat/pages/LiveChatPage'
import { useClinicStore } from './store/clinicStore'
import { usePageTitle } from './hooks/usePageTitle'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const darkMode = useClinicStore((state) => state.darkMode)
  const initStoreData = useClinicStore((state) => state.initStoreData)
  const clinicName = useClinicStore((state) => state.clinicDetails?.name)

  useEffect(() => {
    const publicPaths = ['/', '/login', '/register', '/forgot-password']
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null
    
    if (!publicPaths.includes(currentPath) || token) {
      initStoreData()
    }
  }, [initStoreData])

  // Dynamic page title: "ClinicName — Page | ZealthOS"
  usePageTitle(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#020617'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#F8FAFC'
    }
  }, [darkMode])

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <ConfigProvider
          theme={{
            algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: darkMode ? '#8C4BFF' : '#0E1B33', // Primary purple in dark mode, Navy in light
              colorSuccess: '#30D2BE', // Brand Teal
              colorInfo: '#8C4BFF', // Brand Purple
              colorWarning: '#F59E0B',
              colorError: '#EF4444',
              borderRadius: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
            },
          }}
        >
          <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Clinic Dashboard Panel Routes */}
            <Route 
              path="/clinic" 
              element={
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="/clinic/:section" 
              element={
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              } 
            />
            {/* Role-Specific Dashboard Routes */}
            <Route path="/head-admin/dashboard" element={<DashboardLayout><SuperAdminDashboardPage /></DashboardLayout>} />
            <Route path="/sales/dashboard" element={<DashboardLayout><SalesExecutiveDashboardPage /></DashboardLayout>} />
            <Route path="/clinic-admin/dashboard" element={<DashboardLayout><ClinicAdminDashboardPage /></DashboardLayout>} />
            <Route path="/practitioner/dashboard" element={<DashboardLayout><PractitionerDashboardPage /></DashboardLayout>} />
            <Route path="/patient/dashboard" element={<DashboardLayout><PatientPortalDashboardPage /></DashboardLayout>} />

            {/* Universal Real-Time Live Chat Routes */}
            <Route path="/head-admin/live-chat" element={<DashboardLayout><LiveChatPage /></DashboardLayout>} />
            <Route path="/sales/live-chat" element={<DashboardLayout><LiveChatPage /></DashboardLayout>} />
            <Route path="/clinic-admin/live-chat" element={<DashboardLayout><LiveChatPage /></DashboardLayout>} />
            <Route path="/practitioner/live-chat" element={<DashboardLayout><LiveChatPage /></DashboardLayout>} />
            <Route path="/patient/live-chat" element={<DashboardLayout><LiveChatPage /></DashboardLayout>} />
            <Route path="/live-chat" element={<DashboardLayout><LiveChatPage /></DashboardLayout>} />

            <Route 
              path="/clinic/calendar" 
              element={
                <DashboardLayout>
                  <CalendarPage />
                </DashboardLayout>
              } 
            />
            {/* Role-Specific Calendar Routes */}
            <Route 
              path="/head-admin/calendar" 
              element={<DashboardLayout><SuperAdminCalendarPage /></DashboardLayout>} 
            />
            <Route 
              path="/sales/calendar" 
              element={<DashboardLayout><SalesExecutiveCalendarPage /></DashboardLayout>} 
            />
            <Route 
              path="/clinic-admin/calendar" 
              element={<DashboardLayout><ClinicAdminCalendarPage /></DashboardLayout>} 
            />
            <Route 
              path="/practitioner/calendar" 
              element={<DashboardLayout><PractitionerCalendarPage /></DashboardLayout>} 
            />

            {/* Custom Clinic Admin Menu Overrides */}
            <Route path="/clinic-admin/patients" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="patients" /></DashboardLayout>} />
            <Route path="/clinic-admin/contacts" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="contacts" /></DashboardLayout>} />
            <Route path="/clinic-admin/waitlist" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="waitlist" /></DashboardLayout>} />
            <Route path="/clinic-admin/invoices" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="invoices" /></DashboardLayout>} />
            <Route path="/clinic-admin/payments-centre" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="payments-centre" /></DashboardLayout>} />
            <Route path="/clinic-admin/products" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="products" /></DashboardLayout>} />
            <Route path="/clinic-admin/reports" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="reports" /></DashboardLayout>} />
            <Route path="/clinic-admin/documents" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="documents" /></DashboardLayout>} />
            <Route path="/clinic-admin/consultations" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="consultations" /></DashboardLayout>} />
            <Route path="/clinic-admin/details" element={<DashboardLayout><ClinicAdminDashboardPage sectionOverride="details" /></DashboardLayout>} />

            {['head-admin', 'sales', 'clinic-admin', 'practitioner', 'patient'].map(role => (
              <Route key={role} path={`/${role}`}>
<Route 
              path="patients" 
              element={
                <DashboardLayout>
                  <PatientsPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="patients/:id" 
              element={
                <DashboardLayout>
                  <ClientProfilePage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="contacts" 
              element={
                <DashboardLayout>
                  <ContactsPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="contacts/:id" 
              element={
                <DashboardLayout>
                  <ContactProfilePage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="waitlist" 
              element={
                <DashboardLayout>
                  <WaitlistPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="invoices" 
              element={
                <DashboardLayout>
                  <InvoicesPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="reports" 
              element={
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="documents" 
              element={
                <DashboardLayout>
                  <DocumentsPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="settings" 
              element={
                <DashboardLayout>
                  {role === 'head-admin' && <SuperAdminSettingsPage />}
                  {role === 'sales' && <SalesExecutiveSettingsPage />}
                  {role === 'clinic-admin' && <ClinicAdminSettingsPage />}
                  {role === 'practitioner' && <PractitionerSettingsPage />}
                  {role === 'patient' && <PatientPortalSettingsPage />}
                </DashboardLayout>
              } 
            />

            <Route 
              path="details" 
              element={
                <DashboardLayout>
                  <ClientProfilePage />
                </DashboardLayout>
              } 
            />

            <Route 
              path="profile" 
              element={
                <DashboardLayout>
                  <AdminProfilePage />
                </DashboardLayout>
              } 
            />

            <Route 
              path="profile/:id" 
              element={
                <DashboardLayout>
                  <AdminProfilePage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="branch" 
              element={
                <DashboardLayout>
                  <BranchPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="admin" 
              element={
                <DashboardLayout>
                  <AdminPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="practitioners" 
              element={
                <DashboardLayout>
                  <DoctorsManagePage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="subscription" 
              element={
                <DashboardLayout>
                  <SubscriptionPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="ai-notes" 
              element={
                <DashboardLayout>
                  <AiNotePage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="tenants" 
              element={
                <DashboardLayout>
                  <TenantPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="payment-terms" 
              element={
                <DashboardLayout>
                  <PaymentTermsPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="templates" 
              element={
                <DashboardLayout>
                  <TemplateManagePage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="payments-centre" 
              element={
                <DashboardLayout>
                  <PaymentsPage />
                </DashboardLayout>
              } 
            />
            <Route 
              path="products" 
              element={
                <DashboardLayout>
                  <ProductsPage />
                </DashboardLayout>
              } 
            />
            
            
              </Route>
            ))}
            <Route path="/head-admin/:section" element={<DashboardLayout><SuperAdminDashboardPage /></DashboardLayout>} />
            <Route path="/sales/:section" element={<DashboardLayout><SalesExecutiveDashboardPage /></DashboardLayout>} />
            <Route path="/clinic-admin/:section" element={<DashboardLayout><ClinicAdminDashboardPage /></DashboardLayout>} />
            <Route path="/practitioner/:section" element={<DashboardLayout><PractitionerDashboardPage /></DashboardLayout>} />
            <Route path="/patient/:section" element={<DashboardLayout><PatientPortalDashboardPage /></DashboardLayout>} />
            
            {/* Catch-all redirects to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{ duration: 1500 }} />
        </BrowserRouter>
      </ConfigProvider>
    </SocketProvider>
  </QueryClientProvider>
  )
}

export default App
