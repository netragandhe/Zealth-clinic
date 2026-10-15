import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, DatePicker, Select, Radio, Space, Upload, Card, Divider } from 'antd'
import { UploadOutlined, DeleteOutlined, LockOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import PractitionerProfilePage from './PractitionerProfilePage'
import SalesSettings from '../../dashboard/components/sales/SalesSettings'
import { getSuperAdminProfile, updateSuperAdminProfile } from '../api/settingsApi'
import { getClinicAdminProfile, updateClinicAdminProfile } from '../../calendar/api/clinicAdminApi'
import api from '../../../api/axios'

const { Option } = Select

export default function AdminProfilePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const store = useClinicStore()
  const [saving, setSaving] = useState(false)
  const [initialProfileValues, setInitialProfileValues] = useState(null)
  
  if (store.userRole === 'practitioner') {
    return <PractitionerProfilePage />
  }
  
  const storedRole = (store.userRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null) || '').toLowerCase()
  const isSalesContext = storedRole === 'sales'
  const isClinicAdminContext = window.location.pathname.startsWith('/clinic-admin') || storedRole === 'clinic' || storedRole === 'clinic_admin'
  const isPatientContext = window.location.pathname.startsWith('/patient') || storedRole === 'patient'

  // This state holds the loaded user details to display in the header card
  const [userInfo, setUserInfo] = useState({
    name: '',
    role: '',
    id: '',
    username: '',
    status: 'Active',
    avatar: null
  })

  useEffect(() => {
    let isMounted = true
    const loadLiveProfile = async () => {
      try {
        let loggedUser = null
        try {
          const stored = localStorage.getItem('user')
          if (stored) loggedUser = JSON.parse(stored)
        } catch (e) {}

        const activeRole = (store.userRole || localStorage.getItem('userRole') || loggedUser?.role || '').toLowerCase()
        const isClinic = window.location.pathname.startsWith('/clinic-admin') || activeRole === 'clinic' || activeRole === 'clinic_admin' || activeRole === 'clinic manager'
        const isPatient = window.location.pathname.startsWith('/patient') || activeRole === 'patient'
        const isSales = activeRole === 'sales'

        let res;
        if (isPatient) {
          const response = await api.get('/api/patient/profile')
          res = response.data
        } else if (isSales && store.fetchSalesProfile) {
          const rawProfile = await store.fetchSalesProfile()
          if (rawProfile) {
            res = { success: true, data: rawProfile }
          }
        } else if (isClinic) {
          res = await getClinicAdminProfile()
        } else {
          res = await getSuperAdminProfile()
        }

        if (res && res.success && res.data && isMounted) {
          const userData = res.data
          const pData = userData.profileData || {}

          const realName = userData.name || loggedUser?.name || 'Admin User'
          const realEmail = userData.email || loggedUser?.email || ''
          const realPhone = userData.phone || loggedUser?.phone || ''
          const realRole = userData.role === 'SUPER_ADMIN' ? 'Super Admin' : (userData.role === 'CLINIC_ADMIN' ? 'Clinic Admin' : (userData.role || 'Clinic Admin'))
          const realId = userData.displayId || userData.id || loggedUser?.id || 'ADM-000001'

          setUserInfo({
            name: realName,
            role: realRole,
            id: realId,
            username: realEmail ? realEmail.split('@')[0] : 'admin',
            status: userData.status === 'ACTIVE' ? 'Active' : (userData.status || 'Active'),
            avatar: userData.avatarUrl || null
          })

          const profileFields = {
            name: realName,
            email: realEmail,
            mobile: realPhone,
            dob: pData.dob ? dayjs(pData.dob) : dayjs('1990-01-01'),
            gender: pData.gender || 'Female',
            street: pData.street || '',
            city: pData.city || '',
            state: pData.state || 'NSW',
            country: pData.country || 'Australia',
            postalCode: pData.postalCode || '2000'
          }

          setInitialProfileValues(profileFields)
          form.setFieldsValue(profileFields)
        }
      } catch (err) {
        console.error("Failed to load live profile from database:", err)
      }
    }

    loadLiveProfile()
    return () => { isMounted = false }
  }, [form, isClinicAdminContext])

  const handleCancel = () => {
    if (initialProfileValues) {
      form.setFieldsValue({
        ...initialProfileValues,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else {
      form.resetFields()
    }

    if (window.history.length > 1) {
      navigate(-1)
    } else if (isSalesContext) {
      navigate('/sales')
    } else if (isClinicAdminContext) {
      navigate('/clinic-admin')
    } else if (isPatientContext) {
      navigate('/patient')
    } else {
      navigate('/head-admin')
    }
  }

  const handleSave = async (values) => {
    if (values.newPassword && values.newPassword !== values.confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.mobile,
        avatarUrl: userInfo.avatar,
        profileData: {
          dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
          gender: values.gender,
          street: values.street,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode
        },
        ...(values.newPassword && {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      }

      let res;
      if (isPatientContext) {
        const response = await api.put('/api/patient/profile', payload)
        res = response.data
      } else if (isSalesContext && store.updateSalesProfile) {
        res = await store.updateSalesProfile(payload)
        if (values.newPassword) {
          await store.changeSalesPassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
          })
        }
      } else {
        res = isClinicAdminContext ? await updateClinicAdminProfile(payload) : await updateSuperAdminProfile(payload)
      }

      if (res && res.success) {
        toast.success('Profile updated in live database successfully!')
        const updated = res.data || payload
        setUserInfo(prev => ({
          ...prev,
          name: updated.name || values.name,
          avatar: updated.avatarUrl || prev.avatar
        }))
        const newSavedFields = {
          name: values.name,
          email: values.email,
          mobile: values.mobile,
          dob: values.dob,
          gender: values.gender,
          street: values.street,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode
        }
        setInitialProfileValues(newSavedFields)
        form.setFieldsValue({ ...newSavedFields, currentPassword: '', newPassword: '', confirmPassword: '' })
        
        // Return to Dashboard after saving
        setTimeout(() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else if (isSalesContext) {
            navigate('/sales')
          } else if (isClinicAdminContext) {
            navigate('/clinic-admin')
          } else if (isPatientContext) {
            navigate('/patient')
          } else {
            navigate('/head-admin')
          }
        }, 500)
      } else {
        toast.error(res?.message || 'Failed to update profile in database')
      }
    } catch (err) {
      console.error("Error saving profile to database:", err)
      toast.error('Error saving profile to live database')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarRemove = async () => {
    setUserInfo(prev => ({ ...prev, avatar: null }))
    try {
      if (isPatientContext) {
        await api.put('/api/patient/profile', { avatarUrl: null })
      } else if (isSalesContext && store.updateSalesProfile) {
        await store.updateSalesProfile({ avatarUrl: null })
      } else {
        isClinicAdminContext ? await updateClinicAdminProfile({ avatarUrl: null }) : await updateSuperAdminProfile({ avatarUrl: null })
      }
      toast.success('Profile photo removed from live database')
    } catch (err) {
      toast.error('Failed to update avatar in database')
    }
  }

  const beforeUpload = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setUserInfo(prev => ({ ...prev, avatar: dataUrl }))
      try {
        if (isSalesContext && store.updateSalesProfile) {
          await store.updateSalesProfile({ avatarUrl: dataUrl })
        } else {
          isClinicAdminContext ? await updateClinicAdminProfile({ avatarUrl: dataUrl }) : await updateSuperAdminProfile({ avatarUrl: dataUrl })
        }
        toast.success('Profile photo updated in live database!')
      } catch (err) {
        console.error("Avatar update error:", err)
      }
    }
    reader.readAsDataURL(file)
    return false // Prevent automatic upload
  }

  return (
    <div className="w-full h-full max-w-4xl mx-auto p-4 lg:p-6 text-slate-800 dark:text-slate-200">
      
      {/* Top Card: Profile Summary */}
      <div className="bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl p-5 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex gap-5 items-center">
          {/* Avatar Box & Actions */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-[100px] h-[100px] rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-[#252836] flex items-center justify-center">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-xs text-center px-2">No Photo</span>
              )}
            </div>
            <div className="flex gap-1 mt-1">
              <Upload showUploadList={false} beforeUpload={beforeUpload}>
                <Button size="small" type="text" className="text-[10px] uppercase font-bold text-[#8C4BFF] hover:bg-[#8C4BFF]/10">Change</Button>
              </Upload>
              {userInfo.avatar && (
                <Button size="small" type="text" danger className="text-[10px] uppercase font-bold" onClick={handleAvatarRemove}>Remove</Button>
              )}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex flex-col justify-center h-full">
            <h2 className="text-xl font-medium m-0 text-slate-800 dark:text-slate-200 tracking-wide">
              {userInfo.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-[13px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{userInfo.role}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span>@{userInfo.username}</span>
            </div>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 m-0 mt-1">
              Account ID: {userInfo.id.replace('usr_', '')}
            </p>
          </div>
        </div>

        {/* Active Badge */}
        <div className="border border-slate-300 dark:border-slate-600 rounded-full px-4 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
          ● {userInfo.status}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        requiredMark={false}
        className="admin-profile-form space-y-6"
      >
        {/* Personal Information */}
        <div className="bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-5">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <Form.Item name="name" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Full Name</span>} rules={[{ required: true }]}>
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="email" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Email Address</span>} rules={[{ required: true, type: 'email' }]}>
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="mobile" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Mobile Number</span>}>
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="dob" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Date of Birth</span>}>
              <DatePicker className="h-11 w-full rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item name="gender" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Gender</span>}>
              <Select className="h-11 w-full" classNames={{ popup: { root: 'dark:bg-[#1f222b]' } }}>
                <Option value="Female">Female</Option>
                <Option value="Male">Male</Option>
                <Option value="Non-binary">Non-binary</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </div>
        </div>

        {/* Address */}
        <div className="bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-5">Address Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <Form.Item name="street" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Street Address</span>} className="md:col-span-2">
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="city" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">City</span>}>
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="state" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">State/Province</span>}>
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="postalCode" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Postal Code</span>}>
              <Input className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="country" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Country</span>}>
              <Select className="h-11 w-full" classNames={{ popup: { root: 'dark:bg-[#1f222b]' } }}>
                <Option value="Australia">Australia</Option>
                <Option value="United States">United States</Option>
                <Option value="United Kingdom">United Kingdom</Option>
                <Option value="New Zealand">New Zealand</Option>
              </Select>
            </Form.Item>
          </div>
        </div>

        {/* Security */}
        <div className="bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <LockOutlined className="text-[#8C4BFF]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider m-0">Security & Password</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <Form.Item name="currentPassword" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Current Password</span>}>
              <Input.Password className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>
            <div className="hidden md:block"></div>
            
            <Form.Item name="newPassword" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">New Password</span>}>
              <Input.Password className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>

            <Form.Item name="confirmPassword" label={<span className="text-slate-600 dark:text-slate-400 text-[13px]">Confirm New Password</span>}>
              <Input.Password className="h-11 rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-slate-200" />
            </Form.Item>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button 
            type="button"
            className="h-11 px-6 rounded-lg bg-transparent border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 font-medium shadow-none cursor-pointer"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            className="h-11 px-8 rounded-lg bg-[#8C4BFF] hover:bg-[#7b3fe6] border-none text-white transition-colors shadow-md shadow-purple-500/20 font-bold"
          >
            Save Changes
          </Button>
        </div>
      </Form>

      <style>{`
        .admin-profile-form .ant-select-selector {
          background-color: transparent !important;
          border-color: #cbd5e1 !important;
          border-radius: 0.5rem !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
          color: inherit !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-select-selector {
          border-color: #334155 !important;
        }
        .admin-profile-form .ant-select-arrow {
          color: #94a3b8 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-select-selection-item {
          color: #e2e8f0 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-picker-input > input {
          color: #e2e8f0 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-input-password {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border-color: #334155 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-input-password:hover,
        :root[class~="dark"] .admin-profile-form .ant-input-password:focus-within {
          border-color: #475569 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-input-password input {
          background-color: transparent !important;
          color: #e2e8f0 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-input-password .anticon {
          color: #94a3b8 !important;
        }
        
        /* Ensure normal inputs also look right if Tailwind classes get overridden */
        :root[class~="dark"] .admin-profile-form .ant-input {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border-color: #334155 !important;
          color: #e2e8f0 !important;
        }
        :root[class~="dark"] .admin-profile-form .ant-input:hover,
        :root[class~="dark"] .admin-profile-form .ant-input:focus {
          border-color: #475569 !important;
        }
      `}</style>
    </div>
  )
}
