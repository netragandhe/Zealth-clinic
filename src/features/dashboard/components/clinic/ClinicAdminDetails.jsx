import React from 'react'
import { Card, Form, Input, Button, Upload, TimePicker, Row, Col, Divider, Space } from 'antd'
import { ShopOutlined, UploadOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, SaveOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'

export default function ClinicAdminDetails() {
  const [form] = Form.useForm()

  const handleSave = () => {
    toast.success('Clinic profile details updated successfully!')
  }

  const defaultHours = dayjs('09:00', 'HH:mm')
  const defaultClose = dayjs('17:00', 'HH:mm')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white m-0 flex items-center gap-2">
            <ShopOutlined className="text-[#8C4BFF]" /> Clinic Profile & Details
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Manage your clinic's public identity, branding, and operating hours.</p>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSave}
          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
          className="font-bold rounded-xl h-10 px-6 shadow-sm"
        >
          Save Changes
        </Button>
      </div>

      <Form form={form} layout="vertical" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm dark:bg-slate-900" title={<span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">General Information</span>}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span className="text-xs font-bold text-slate-500">Clinic Name</span>} name="clinicName" initialValue="ZealthOS Clinic Melbourne">
                  <Input className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 font-semibold" placeholder="Enter clinic name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span className="text-xs font-bold text-slate-500">ABN / Tax ID</span>} name="abn" initialValue="12 345 678 901">
                  <Input className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 font-semibold" placeholder="Enter ABN" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label={<span className="text-xs font-bold text-slate-500">Physical Address</span>} name="address" initialValue="123 Healthway St, Medical Precinct, VIC 3000">
              <Input.TextArea rows={2} className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold" placeholder="Full address" />
            </Form.Item>

            <Divider className="my-4 dark:border-slate-800" />
            <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200 mb-4">Contact Details</h4>
            
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label={<span className="text-xs font-bold text-slate-500">Phone Number</span>} name="phone" initialValue="+61 3 9999 8888">
                  <Input prefix={<PhoneOutlined className="text-slate-400 mr-1" />} className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 font-semibold" placeholder="Phone" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span className="text-xs font-bold text-slate-500">Support Email</span>} name="email" initialValue="support@zealthos.com">
                  <Input prefix={<MailOutlined className="text-slate-400 mr-1" />} className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 font-semibold" placeholder="Email" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span className="text-xs font-bold text-slate-500">Website URL</span>} name="website" initialValue="https://www.zealthos.com">
                  <Input prefix={<GlobalOutlined className="text-slate-400 mr-1" />} className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 font-semibold" placeholder="Website" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Branding & Logo */}
          <div className="space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm dark:bg-slate-900" title={<span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Branding</span>}>
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 mx-auto flex items-center justify-center mb-4">
                  <span className="text-3xl font-black text-[#8C4BFF]">Z</span>
                </div>
                <Upload showUploadList={false}>
                  <Button icon={<UploadOutlined />} className="rounded-lg font-semibold text-xs border-slate-200 dark:border-slate-700">
                    Upload New Logo
                  </Button>
                </Upload>
                <p className="text-[10px] text-slate-400 mt-2 font-semibold">Recommended size: 512x512px. Max 2MB.</p>
              </div>
              
              <Divider className="my-4 dark:border-slate-800" />
              
              <Form.Item label={<span className="text-xs font-bold text-slate-500">Brand Primary Color</span>} name="color" initialValue="#8C4BFF" className="mb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: '#8C4BFF' }} />
                  <Input className="rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-10 font-semibold flex-1" />
                </div>
              </Form.Item>
            </Card>

            {/* Operating Hours */}
            <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm dark:bg-slate-900" title={<span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Operating Hours</span>}>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-20">{day}</span>
                    <Space>
                      <TimePicker defaultValue={defaultHours} format="HH:mm" className="w-20 rounded-lg text-xs" />
                      <span className="text-slate-400">-</span>
                      <TimePicker defaultValue={defaultClose} format="HH:mm" className="w-20 rounded-lg text-xs" />
                    </Space>
                  </div>
                ))}
                <div className="flex items-center justify-between opacity-50 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-20">Saturday</span>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">Closed</span>
                </div>
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-20">Sunday</span>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">Closed</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  )
}
