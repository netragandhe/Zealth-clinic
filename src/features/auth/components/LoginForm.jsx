import React from 'react'
import { Form, Input, Button, Checkbox } from 'antd'
import { MailOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import { useClinicStore } from '../../../store/clinicStore'
import { API_BASE_URL } from '../../../api/axios'

const CREDENTIALS = [
  {
    label: 'Super Admin',
    role: 'head_admin',
    email: 'admin@zhealth.com',
    password: '12345678',
    description: 'Platform Owner Control',
    color: '#0E1B33',
    bg: '#EEF2F6',
  },
  {
    label: 'Sales Executive',
    role: 'sales',
    email: 'sales@gmail.com',
    password: '12345678',
    description: 'CRM & Pipeline Leads',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    label: 'Clinic Admin',
    role: 'clinic',
    email: 'jupiter@gmail.com',
    password: '12345678',
    description: 'Clinic Operations Manager',
    color: '#8C4BFF',
    bg: '#F3EEFF',
  },
  {
    label: 'Practitioner',
    role: 'practitioner',
    email: 'practitioners@gmail.com',
    password: 'password123',
    description: 'Doctor / Treatment Board',
    color: '#30D2BE',
    bg: '#E6FAF8',
  },
  {
    label: 'Patient Portal',
    role: 'patient',
    email: 'mypatinent@gmail.com',
    password: '12345678',
    description: 'Client Personal Bookings',
    color: '#3B82F6',
    bg: '#EBF5FF',
  },
]

export default function LoginForm() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const store = useClinicStore()

  const onFinish = async (values) => {
    const { email, password } = values

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const json = await res.json()

      if (!json || !json.success) {
        toast.error(json?.message || 'Invalid email or password!')
        return
      }

      if (json.data?.accessToken) {
        localStorage.setItem('accessToken', json.data.accessToken)
        localStorage.setItem('token', json.data.accessToken)
      }
      if (json.data?.refreshToken) {
        localStorage.setItem('refreshToken', json.data.refreshToken)
      }
      if (json.data?.user) {
        localStorage.setItem('user', JSON.stringify(json.data.user))
        if (json.data.user.id) localStorage.setItem('userId', json.data.user.id)
        if (json.data.user.name) localStorage.setItem('userName', json.data.user.name)
        else if (json.data.user.email) localStorage.setItem('userName', json.data.user.email)
      }

      const userRoleFromBackend = json.data?.user?.role
      let role = 'clinic'
      let label = json.data?.user?.name || 'User'

      if (userRoleFromBackend === 'SUPER_ADMIN') role = 'head_admin'
      else if (userRoleFromBackend === 'SALES_EXECUTIVE') role = 'sales'
      else if (userRoleFromBackend === 'PRACTITIONER') role = 'practitioner'
      else if (userRoleFromBackend === 'PATIENT') role = 'patient'
      else if (userRoleFromBackend === 'CLINIC_ADMIN') role = 'clinic'

      let dashboardRoute = '/clinic-admin/dashboard'
      if (role === 'head_admin') dashboardRoute = '/head-admin/dashboard'
      else if (role === 'sales') dashboardRoute = '/sales/dashboard'
      else if (role === 'practitioner') dashboardRoute = '/practitioner/dashboard'
      else if (role === 'patient') dashboardRoute = '/patient/dashboard'

      localStorage.setItem('userRole', role)
      store.setUserRole(role)
      toast.success(`Welcome back, ${label}!`)
      navigate(dashboardRoute)
    } catch (err) {
      // Fallback for quick credentials simulation if backend unreachable
      const matched = CREDENTIALS.find(c => c.email === email)
      if (matched) {
        store.setUserRole(matched.role)
        toast.success(`Welcome back, ${matched.label}!`)
        let dashboardRoute = '/clinic-admin/dashboard'
        if (matched.role === 'head_admin') dashboardRoute = '/head-admin/dashboard'
        else if (matched.role === 'sales') dashboardRoute = '/sales/dashboard'
        else if (matched.role === 'practitioner') dashboardRoute = '/practitioner/dashboard'
        else if (matched.role === 'patient') dashboardRoute = '/patient/dashboard'
        navigate(dashboardRoute)
      } else {
        toast.error('Unable to verify login. Please check server.')
      }
    }
  }

  const fillCredentials = (email, password) => {
    form.setFieldsValue({ email, password })
  }

  return (
    <div className="w-full max-w-md bg-transparent px-1">
      <div className="mb-5 text-center">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Hello There! 👋</h3>
        <p className="text-slate-400 dark:text-slate-300 text-xs mt-1">Sign in to access your clinic panel</p>
      </div>

      <Form
        form={form}
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="w-full"
        initialValues={{ email: '', password: '' }}
        autoComplete="off"
      >
        <Form.Item
          name="email"
          label={<span className="text-slate-700 dark:text-slate-200 text-xs font-bold">Email Address</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
          className="mb-4"
        >
          <Input
            prefix={<MailOutlined className="text-slate-400 mr-2 text-sm flex-shrink-0" />}
            placeholder="you@organization.com"
            size="large"
            autoComplete="new-password"
            className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-slate-800 dark:text-white placeholder:text-slate-400 font-medium transition-all shadow-none hover:border-[#8C4BFF] focus:border-[#8C4BFF] focus:bg-white dark:focus:bg-slate-900"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-slate-700 dark:text-slate-200 text-xs font-bold">Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
          className="mb-4"
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400 mr-2 text-sm flex-shrink-0" />}
            placeholder="Enter your password"
            size="large"
            autoComplete="new-password"
            className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-slate-800 dark:text-white placeholder:text-slate-400 font-medium transition-all shadow-none hover:border-[#8C4BFF] focus:border-[#8C4BFF] focus:bg-white dark:focus:bg-slate-900"
          />
        </Form.Item>

        <div className="flex justify-between items-center w-full mb-4">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-slate-500 dark:text-slate-300 text-xs font-semibold select-none">Remember me</Checkbox>
          </Form.Item>
          <Link
            to="/forgot-password"
            className="text-slate-500 dark:text-slate-300 dark:hover:text-brand-purple hover:text-brand-purple text-xs font-semibold transition-colors duration-200"
          >
            Forgot password?
          </Link>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="w-full h-11 bg-brand-purple hover:bg-brand-purple/90 border-none font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Sign in</span>
            <span className="text-lg leading-none">→</span>
          </Button>
        </Form.Item>
      </Form>

      {/* Divider */}
      <div className="w-full flex items-center my-5">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="mx-4 text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
          <ThunderboltOutlined style={{ fontSize: 10 }} /> Quick Access
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      {/* Click-to-fill credentials side-by-side */}
      <div className="flex flex-wrap justify-center gap-2">
        {CREDENTIALS.map((cred) => (
          <div
            key={cred.label}
            onClick={() => fillCredentials(cred.email, cred.password)}
            className="cursor-pointer px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:border-[#8C4BFF] bg-white dark:bg-slate-900 hover:bg-[#8C4BFF]/5 text-slate-700 dark:text-slate-300 hover:text-[#8C4BFF] transition-all text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cred.color }} />
            <span>{cred.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
