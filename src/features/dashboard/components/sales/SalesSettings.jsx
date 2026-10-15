import React, { useState } from 'react'
import { Card, Form, Input, Button, Switch, Divider, Spin } from 'antd'
import { UserOutlined, LockOutlined, LoadingOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

export default function SalesSettings({ store: propStore }) {
  const localStore = useClinicStore()
  const store = propStore || localStore

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Fetch profile from live DB on mount and pre-fill form
  React.useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        if (store.fetchSalesProfile) {
          const profile = await store.fetchSalesProfile()
          if (profile) {
            profileForm.setFieldsValue({
              name: profile.name || '',
              email: profile.email || '',
              phone: profile.phone || '',
              territory: profile.territory || '',
              emailAlerts: profile.emailAlerts !== undefined ? profile.emailAlerts : true,
              smsAlerts: profile.smsAlerts !== undefined ? profile.smsAlerts : false,
              browserAlerts: profile.browserAlerts !== undefined ? profile.browserAlerts : true,
            })
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async (values) => {
    setSavingProfile(true)
    try {
      const result = await store.updateSalesProfile({
        name: values.name,
        phone: values.phone,
        territory: values.territory,
        emailAlerts: values.emailAlerts,
        smsAlerts: values.smsAlerts,
        browserAlerts: values.browserAlerts,
      })
      if (result && result.success) {
        toast.success('Profile settings saved successfully!')
      } else {
        toast.error(result?.message || 'Failed to save profile. Please try again.')
      }
    } catch (err) {
      toast.error('An error occurred while saving.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      const result = await store.changeSalesPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (result && result.success) {
        toast.success('Password changed successfully!')
        passwordForm.resetFields()
      } else {
        toast.error(result?.message || 'Failed to change password.')
      }
    } catch (err) {
      toast.error('An error occurred while changing password.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: '#8C4BFF' }} spin />} />
        <span className="ml-3 text-slate-400 font-semibold text-sm">Loading your settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">Sales Executive Settings</h2>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
          Manage your personal profile, preferred sales territory, and alert notification triggers.
        </p>
      </div>

      {/* Profile Form Card */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserOutlined style={{ color: '#8C4BFF' }} />
            <h3 className="text-xs font-bold text-[#8C4BFF] uppercase tracking-wider m-0">Account Profile Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Full Name</span>} rules={[{ required: true, message: 'Name is required' }]}>
              <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" />
            </Form.Item>
            <Form.Item name="email" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Email Address</span>}>
              <Input disabled className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Mobile Number</span>}>
              <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" />
            </Form.Item>
            <Form.Item name="territory" label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Sales Territory</span>}>
              <Input className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" placeholder="e.g. APAC · Australia, NZ" />
            </Form.Item>
          </div>

          <Divider className="my-6 border-slate-100 dark:border-slate-800" />

          <h3 className="text-xs font-bold text-[#8C4BFF] uppercase tracking-wider mb-4">Notification Subscriptions</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Email Payout Alerts</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Get notified immediately when the Head Admin marks your commissions as paid.</span>
              </div>
              <Form.Item name="emailAlerts" valuePropName="checked" className="m-0">
                <Switch />
              </Form.Item>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">SMS Task Reminders</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Receive SMS notifications for hot lead follow-ups and scheduled demo sessions.</span>
              </div>
              <Form.Item name="smsAlerts" valuePropName="checked" className="m-0">
                <Switch />
              </Form.Item>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Browser Alerts</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Receive real-time desktop popups for direct support tickets or Admin chats.</span>
              </div>
              <Form.Item name="browserAlerts" valuePropName="checked" className="m-0">
                <Switch />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={savingProfile}
              style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
              className="rounded-xl h-10 font-bold text-xs px-6"
            >
              Save Preferences
            </Button>
          </div>
        </Form>
      </Card>

      {/* Password Change Card */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <div className="flex items-center gap-2 mb-4">
            <LockOutlined style={{ color: '#8C4BFF' }} />
            <h3 className="text-xs font-bold text-[#8C4BFF] uppercase tracking-wider m-0">Change Account Password</h3>
          </div>

          <Form.Item
            name="currentPassword"
            label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Current Password</span>}
            rules={[{ required: true, message: 'Current password is required' }]}
          >
            <Input.Password className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" placeholder="Enter current password" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="newPassword"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">New Password</span>}
              rules={[
                { required: true, message: 'New password is required' },
                { min: 6, message: 'Must be at least 6 characters' }
              ]}
            >
              <Input.Password className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" placeholder="Min. 6 characters" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={<span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Confirm New Password</span>}
              rules={[{ required: true, message: 'Please confirm your new password' }]}
            >
              <Input.Password className="rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-950" placeholder="Re-enter new password" />
            </Form.Item>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={savingPassword}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-xl h-10 font-bold text-xs px-6"
            >
              Change Password
            </Button>
          </div>
        </Form>
      </Card>

    </div>
  )
}
