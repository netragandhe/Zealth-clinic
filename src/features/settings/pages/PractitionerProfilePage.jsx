import React, { useState, useEffect } from 'react'
import { Tabs, Form, Input, Select, Button, Upload, Checkbox, Table, Space, Row, Col, Divider } from 'antd'
import { PlusOutlined, DeleteOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../store/clinicStore'
import { getPractitionerProfile, updatePractitionerProfile } from '../../calendar/api/clinicAdminApi'

const { Option } = Select

export default function PractitionerProfilePage() {
  const [form] = Form.useForm()
  const store = useClinicStore()
  
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getPractitionerProfile()
        if (res && res.success && res.data) {
          const d = res.data
          if (d.avatarUrl) {
            setAvatarUrl(d.avatarUrl)
          }
          form.setFieldsValue({
            title: d.title || 'Dr',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            gender: d.gender || 'Male',
            email: d.email || '',
            phone: d.phone || '',
            profTitle: d.profTitle || 'Practitioner',
            locations: d.locations || ['Melbourne Clinic'],
            services: d.services || []
          })
        }
      } catch (err) {
        console.error('Failed to load profile from live DB:', err)
      }
    }
    loadProfile()
  }, [form])

  const compressImage = (file, maxWidth = 400, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            } else {
              width = Math.round((width * maxWidth) / height)
              height = maxWidth
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = () => resolve(e.target.result)
        img.src = e.target.result
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  const handlePhotoUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP, etc.)')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return false
    }
    setAvatarUploading(true)
    try {
      const base64Data = await compressImage(file)
      if (!base64Data) throw new Error('Image compression failed')
      setAvatarUrl(base64Data)
      await updatePractitionerProfile({ avatarUrl: base64Data })
      if (store.setUser && store.user) {
        store.setUser({ ...store.user, avatarUrl: base64Data })
      }
      toast.success('Profile photo uploaded & saved to database!')
    } catch (err) {
      console.error('Photo upload error:', err)
      toast.error('Failed to save profile photo')
    } finally {
      setAvatarUploading(false)
    }
    return false
  }

  const handlePhotoRemove = async () => {
    try {
      setAvatarUploading(true)
      await updatePractitionerProfile({ avatarUrl: null })
      setAvatarUrl(null)
      if (store.setUser && store.user) {
        store.setUser({ ...store.user, avatarUrl: null })
      }
      toast.success('Profile photo removed from database!')
    } catch (err) {
      toast.error('Failed to remove profile photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  // State for provider numbers
  const [providers, setProviders] = useState([
    { id: 1, type: 'AHPRA', number: 'PHY000278016', location: 'NDIS' },
    { id: 2, type: 'AHPRA', number: 'PHY000278016', location: 'CEO Therapy Mobile' },
    { id: 3, type: 'Medicare', number: '6683896B', location: 'CEO Therapy Mobile' }
  ])

  const handleSave = async (values) => {
    try {
      await updatePractitionerProfile({ ...values, avatarUrl })
      if (store.setUser && store.user) {
        store.setUser({ ...store.user, avatarUrl })
      }
      toast.success('Practitioner profile settings saved successfully in live database!')
    } catch (err) {
      toast.error('Failed to save profile settings in live database')
    }
  }

  const addProvider = () => {
    setProviders([...providers, { id: Date.now(), type: '', number: '', location: '' }])
  }

  const removeProvider = (id) => {
    setProviders(providers.filter(p => p.id !== id))
  }

  const providerColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => (
        <Input 
          defaultValue={text} 
          className="rounded-lg h-9 border-slate-200" 
          placeholder="e.g. AHPRA"
        />
      ),
    },
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
      render: (text, record) => (
        <Input 
          defaultValue={text} 
          className="rounded-lg h-9 border-slate-200"
        />
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (text, record) => (
        <Select 
          defaultValue={text || undefined} 
          className="w-full h-9 rounded-lg"
          placeholder="Select location"
        >
          <Option value="NDIS">NDIS</Option>
          <Option value="CEO Therapy Mobile">CEO Therapy Mobile</Option>
        </Select>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => removeProvider(record.id)} 
        />
      ),
    },
  ]

  const servicesList = [
    'Physiotherapy Subsequent Session (Therapeutic Supports)',
    'Progress report (Non-Face-to-Face Services)',
    'Initial Physiotherapy Session (Therapeutic Supports)',
    'Creation of resources (e.g. exercise program) (Therapeutic Supports)',
    '(ECS) Subsequent Physiotherapy Session (Early Childhood Supports)',
    'Mobile Physio – Initial (0-10km) (Private)',
    'Mobile Physio – Follow-Up (0-10km) (Private)',
    'Correspondence (inc phone calls and emails) (Physiotherapy)',
    'Mobile Physio – Initial (20-30km) (Private)',
    'Mobile Physio – Initial (30-40km) (Private)',
    'Mobile Physio – Initial (10-20km) (Private)',
    'Mobile Physio – Follow-Up (10-20km) (Private)',
    'Mobile Physio – Follow-Up (30-40km) (Private)',
    'Mobile Physio – Follow-Up (20-30km) (Private)',
    'Copy of Progress report (Non-Face-to-Face Services)'
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 max-w-[900px] mx-auto animate-fade-in">
      <Tabs 
        defaultActiveKey="details"
        className="profile-tabs"
        items={[
          {
            key: 'details',
            label: <span className="font-bold">Details</span>,
            children: (
              <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSave}
                initialValues={{
                  title: 'Mr',
                  firstName: 'Colin',
                  lastName: 'Edegbe',
                  gender: 'Male',
                  profTitle: 'Physiotherapist',
                  locations: ['NDIS', 'CEO Therapy Mobile'],
                  services: servicesList.slice(0, 14) // first 14 checked as in screenshot
                }}
                className="mt-4"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="flex-1 space-y-4">
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item name="title" label={<span className="text-slate-600 font-semibold text-xs">Title</span>}>
                          <Select className="h-10 rounded-lg">
                            <Option value="Mr">Mr</Option>
                            <Option value="Mrs">Mrs</Option>
                            <Option value="Dr">Dr</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={9}>
                        <Form.Item name="firstName" label={<span className="text-slate-600 font-semibold text-xs">First name <span className="text-red-500">*</span></span>} rules={[{ required: true }]}>
                          <Input className="h-10 rounded-lg border-slate-200" />
                        </Form.Item>
                      </Col>
                      <Col span={9}>
                        <Form.Item name="lastName" label={<span className="text-slate-600 font-semibold text-xs">Last name <span className="text-red-500">*</span></span>} rules={[{ required: true }]}>
                          <Input className="h-10 rounded-lg border-slate-200" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="gender" label={<span className="text-slate-600 font-semibold text-xs">Gender</span>}>
                      <Select className="h-10 rounded-lg">
                        <Option value="Male">Male</Option>
                        <Option value="Female">Female</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item name="email" label={<span className="text-slate-600 font-semibold text-xs">Email <span className="text-red-500">*</span></span>} rules={[{ required: true }]}>
                      <Input className="h-10 rounded-lg border-2 border-slate-800" />
                    </Form.Item>

                    <div className="mb-4">
                      <label className="block text-slate-600 font-semibold text-xs mb-2">Date of birth</label>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Select placeholder="Day" className="w-full h-10 rounded-lg" />
                        </Col>
                        <Col span={8}>
                          <Select placeholder="Month" className="w-full h-10 rounded-lg" />
                        </Col>
                        <Col span={8}>
                          <Select placeholder="Year" className="w-full h-10 rounded-lg" />
                        </Col>
                      </Row>
                    </div>

                    <div className="mb-4">
                      <label className="block text-slate-600 font-semibold text-xs mb-2">Phone numbers</label>
                      <Button icon={<PlusOutlined />} className="h-10 rounded-lg font-semibold border-slate-300">
                        Add new phone number
                      </Button>
                    </div>

                    <Form.Item name="profTitle" label={<span className="text-slate-600 font-semibold text-xs">Professional title (Occupational Therapist, Physiotherapist, etc.) <span className="text-red-500">*</span></span>}>
                      <Input className="h-10 rounded-lg border-slate-200" />
                    </Form.Item>

                    <Form.Item name="groups" label={<span className="text-slate-600 font-semibold text-xs">Groups</span>}>
                      <Select placeholder="Select a user group" className="h-10 rounded-lg" />
                    </Form.Item>
                  </div>

                  {/* Right Column: Photo */}
                  <div className="w-[200px] flex flex-col items-center">
                    <div className="w-[200px] h-[220px] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 mb-4 flex items-center justify-center relative shadow-sm">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          <UserOutlined className="text-[72px]" />
                          <span className="text-xs text-slate-400 mt-2 font-medium">No photo</span>
                        </div>
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Upload showUploadList={false} beforeUpload={handlePhotoUpload} accept="image/*">
                        <Button loading={avatarUploading} className="font-semibold px-4 rounded-lg border-slate-300">
                          {avatarUrl ? 'Change Photo' : 'Upload'}
                        </Button>
                      </Upload>
                      {avatarUrl && (
                        <Button danger type="text" onClick={handlePhotoRemove} className="text-xs font-semibold">
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Divider className="my-8 border-slate-200" />

                {/* PRACTITIONER SETTINGS SECTION */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Practitioner settings</h3>

                  <Form.Item name="locations" label={<span className="text-slate-800 dark:text-slate-200 font-bold text-sm">Locations you work at</span>} className="mb-6">
                    <Checkbox.Group className="flex flex-col gap-2">
                      <Checkbox value="NDIS" className="font-medium text-slate-700 dark:text-slate-300">NDIS</Checkbox>
                      <Checkbox value="CEO Therapy Mobile" className="font-medium text-slate-700 dark:text-slate-300">CEO Therapy Mobile</Checkbox>
                    </Checkbox.Group>
                  </Form.Item>

                  <div className="mb-8">
                    <label className="block text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">Services provided by you</label>
                    <Input 
                      placeholder="Search options" 
                      className="mb-4 h-10 rounded-lg border-slate-200 max-w-sm" 
                    />
                    <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <Checkbox className="font-medium">Check all</Checkbox>
                    </div>
                    
                    <Form.Item name="services" noStyle>
                      <Checkbox.Group className="flex flex-col gap-2.5">
                        {servicesList.map(srv => (
                          <Checkbox key={srv} value={srv} className="font-medium text-slate-700 dark:text-slate-300 m-0">
                            {srv}
                          </Checkbox>
                        ))}
                      </Checkbox.Group>
                    </Form.Item>
                  </div>

                  <div className="mb-8">
                    <label className="block text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">Signature</label>
                    <div className="h-20 max-w-sm border-b border-slate-200 flex items-end pb-2 mb-4">
                      {/* Mock signature */}
                      <span className="font-serif text-3xl text-slate-700 dark:text-slate-300 italic ml-4">
                        {form.getFieldValue('firstName') ? `${form.getFieldValue('firstName')} ${form.getFieldValue('lastName')}` : 'Dr. Signature'}
                      </span>
                    </div>
                    <Space>
                      <Button className="rounded-lg font-semibold border-slate-300">Re-sign</Button>
                      <Button icon={<CloseOutlined />} className="rounded-lg font-semibold border-slate-300">Clear signature</Button>
                    </Space>
                  </div>

                  <div className="mb-8">
                    <label className="block text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">Provider numbers</label>
                    <Table 
                      dataSource={providers} 
                      columns={providerColumns} 
                      pagination={false} 
                      rowKey="id"
                      bordered
                      className="mb-4 shadow-sm rounded-xl overflow-hidden"
                      rowClassName={() => 'bg-white dark:bg-slate-900'}
                      components={{
                        header: {
                          cell: (props) => <th {...props} className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase" />
                        }
                      }}
                    />
                    <Button icon={<PlusOutlined />} onClick={addProvider} className="rounded-lg font-semibold border-slate-300">
                      Add a provider number
                    </Button>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button type="primary" htmlType="submit" className="bg-[#8C4BFF] hover:bg-[#7b3fe0] border-none font-bold rounded-lg h-10 px-8">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Form>
            )
          },
          {
            key: 'notes',
            label: <span className="font-bold text-slate-500">Notes & Letter Templates</span>,
            children: (
              <div className="py-6 min-h-[300px]">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Your Templates</h3>
                <p className="text-slate-500 mb-6">Manage your personal clinical notes and letter templates here.</p>
                <Button type="primary" icon={<PlusOutlined />} className="bg-[#30D2BE] border-none font-bold rounded-lg h-10">
                  Create Template
                </Button>
              </div>
            )
          },
          {
            key: 'security',
            label: <span className="font-bold text-slate-500">Security</span>,
            children: (
              <div className="py-6 max-w-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Account Security</h3>
                <Form layout="vertical">
                  <Form.Item label={<span className="font-semibold text-slate-600">Current Password</span>}>
                    <Input.Password className="h-10 rounded-lg" />
                  </Form.Item>
                  <Form.Item label={<span className="font-semibold text-slate-600">New Password</span>}>
                    <Input.Password className="h-10 rounded-lg" />
                  </Form.Item>
                  <Button type="primary" className="bg-[#0E1B33] border-none font-bold rounded-lg h-10 w-full mt-2">
                    Update Password
                  </Button>
                </Form>
              </div>
            )
          }
        ]}
      />
    </div>
  )
}
