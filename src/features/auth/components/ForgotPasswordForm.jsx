import React, { useState } from 'react'
import { Form, Input, Button } from 'antd'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)

  const onFinish = (values) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(`Reset link successfully sent to ${values.email}!`)
    }, 1200)
  }

  return (
    <div className="w-full max-w-md bg-transparent px-4">
      <div className="mb-4">
        <Link
          to="/login"
          className="inline-flex items-center text-slate-500 dark:text-slate-300 dark:hover:text-brand-purple hover:text-brand-purple text-xs font-semibold transition-colors duration-200 mb-3"
        >
          <ArrowLeftOutlined className="mr-2" /> Back to Sign In
        </Link>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Reset Password</h3>
        <p className="text-slate-500 dark:text-slate-300 text-xs mt-0.5">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <Form
        name="forgot_password_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="w-full space-y-3"
      >
        <Form.Item
          name="email"
          label={<span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">Email</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-slate-400 mr-2" />}
            placeholder="you@organization.com"
            size="large"
            className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white focus:bg-white dark:bg-slate-900 focus:border-brand-purple transition-all duration-200"
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full h-11 bg-brand-purple hover:bg-brand-purple/90 border-none font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-1"
          >
            <span>Send Reset Link</span>
            <span className="text-lg leading-none font-normal">→</span>
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
