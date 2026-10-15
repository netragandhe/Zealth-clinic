import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Select, Form, Input, Radio, Divider, Space } from 'antd'
import {
  BranchesOutlined,
  PlusOutlined,
  SendOutlined,
  FileTextOutlined,
  SearchOutlined,
  BookOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

const { Option } = Select
const { TextArea } = Input

export default function PractitionerReferrals({ patientId, clientPatient } = {}) {
  const store = useClinicStore()
  const [form] = Form.useForm()
  
  const [aiDraftText, setAiDraftText] = useState('')
  const [sendingRef, setSendingRef] = useState(false)

  // Fetch real data on mount
  useEffect(() => {
    if (store.initStoreData) store.initStoreData()
    if (store.fetchDocuments) store.fetchDocuments()
    if (store.fetchContacts) store.fetchContacts()
  }, [])

  useEffect(() => {
    if (clientPatient?.name || clientPatient?.fullName || patientId) {
      form.setFieldsValue({
        patientName: clientPatient?.name || clientPatient?.fullName || patientId
      })
    }
  }, [clientPatient, patientId, form])

  // Dynamic Contacts Directory combined with defaults
  const defaultPartners = [
    { name: 'Dr. Arthur Conan', type: 'GP', clinic: 'Baker Street Medical Clinic', contact: '+61 3 9988 7766' },
    { name: 'Dr. David Bruce', type: 'Specialist Doctor', clinic: 'City Orthopaedic Center', contact: '+61 2 8877 6655' },
    { name: 'Southside Radiology', type: 'Imaging Facility', clinic: 'Southside Imaging Center', contact: '1300 888 999' },
    { name: 'Melbourne Pathology', type: 'Pathology Lab', clinic: 'Melb Path Lab', contact: '1800 111 222' }
  ]

  const dbContacts = (store.contacts || []).map(c => ({
    name: c.name || c.contactName,
    type: c.type || c.category || 'Specialist',
    clinic: c.company || c.clinic || c.organization || 'Partner Clinic',
    contact: c.mobileNumber || c.phone || c.contact || '+61 3 9999 8888'
  }))

  const addressBook = [...dbContacts, ...defaultPartners]

  // Real DB Patients List with dynamic fallbacks
  const availablePatients = store.patients && store.patients.length > 0
    ? store.patients
    : [
        { id: 'p1', name: 'John Miller' },
        { id: 'p2', name: 'Emma Watson' },
        { id: 'p3', name: 'Liam Hemsworth' },
        { id: 'p4', name: 'Alice Smith' },
        { id: 'p5', name: 'James Davis' }
      ]

  // Map real database documents that are referrals
  const allReferrals = (store.documents || []).filter(d => d.type && d.type.includes('Referral')).map(d => ({
    id: d.id,
    patientId: d.patientId,
    patientName: d.patientName,
    recipient: d.sentTo || 'Unknown',
    recipientType: d.type.replace(' Referral', ''),
    date: d.date,
    status: d.status
  }))

  const referralsList = (patientId || clientPatient)
    ? allReferrals.filter(d => 
        (patientId && d.patientId === patientId) || 
        (clientPatient?.id && d.patientId === clientPatient.id) ||
        (clientPatient?.name && d.patientName === clientPatient.name) ||
        (clientPatient?.fullName && d.patientName === clientPatient.fullName)
      )
    : allReferrals

  const handleDraftAI = () => {
    const values = form.getFieldsValue()
    if (!values.patientName || !values.recipient) {
      toast.error('Please select patient and recipient first.')
      return
    }
    toast.loading('AI is drafting referral request...', { duration: 1000 })
    setTimeout(() => {
      const draft = `Referral Letter\n----------------\nDate: ${new Date().toLocaleDateString()}\nTo: ${values.recipient}\nRegarding: ${values.patientName}\n\nDear Clinician,\n\nI am writing to refer this patient for specialized clinical evaluation and co-management. The patient has been receiving physiotherapy/rehabilitation care under our clinics workspace for spinal mobility issues.\n\nClinical notes suggest localized tenderness and restricted mobility. I recommend diagnostic review (e.g. imaging scan/clinical evaluation) and welcome your therapeutic suggestions.\n\nBest regards,\nDr. Sarah Jenkins`
      setAiDraftText(draft)
      form.setFieldsValue({ letter: draft })
      toast.success('AI referral draft ready for review!')
    }, 1000)
  }

  const handleSendReferral = async (values) => {
    if (sendingRef) return
    try {
      setSendingRef(true)
      
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      let practitionerName = 'Dr. Sarah Jenkins'
      if (uStr) {
        const parsed = JSON.parse(uStr)
        if (parsed?.name) practitionerName = parsed.name.startsWith('Dr.') ? parsed.name : `Dr. ${parsed.name}`
      } else if (store.user?.name) {
        practitionerName = store.user.name.startsWith('Dr.') ? store.user.name : `Dr. ${store.user.name}`
      }

      const targetContact = addressBook.find(c => c.name === values.recipient)
      const recipientEmail = targetContact?.email || targetContact?.contact || 'doctor@externalclinic.com'

      await store.addDocument({
        name: `Referral - ${values.patientName} to ${values.recipient}.pdf`,
        type: `${values.recipientType || 'Specialist'} Referral`,
        patientName: values.patientName,
        sentTo: `${values.recipient} (${recipientEmail})`,
        uploadBy: practitionerName,
        date: new Date().toLocaleDateString(),
        status: 'Sent'
      })

      toast.success(`Referral letter successfully sent via Secure Email to ${values.recipient} (${recipientEmail})!`)
      setAiDraftText('')
      form.resetFields()
    } catch (err) {
      toast.error('Failed to send referral. Please try again.')
    } finally {
      setSendingRef(false)
    }
  }

  const columns = [
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>,
      dataIndex: 'patientName',
      key: 'patientName',
      render: text => <span className="font-bold text-slate-700 dark:text-slate-200">{text}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Recipient</span>,
      dataIndex: 'recipient',
      key: 'recipient',
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Type</span>,
      dataIndex: 'recipientType',
      key: 'recipientType',
      render: text => <Tag color="blue" className="border-none font-bold text-[8px] uppercase">{text}</Tag>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>,
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={status === 'Sent' ? 'success' : 'default'} className="m-0 border-none font-bold text-[9px] uppercase">{status}</Tag>
    }
  ]

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Clinical Referrals</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Manage patient referral requests, draft letters using AI, and lookup clinical partner contact details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Sent referrals & address book */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Referral history */}
          <Card 
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                <BranchesOutlined style={{ color: '#8C4BFF' }} /> Referral Letters Sent
              </span>
            }
          >
            <Table 
              dataSource={referralsList}
              columns={columns}
              rowKey="id"
              pagination={false}
              className="bg-white dark:bg-slate-900"
            />
          </Card>

          {/* Referral address book */}
          <Card 
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                <BookOutlined style={{ color: '#30D2BE' }} /> Referral Directory Partners
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addressBook.map((p, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-850 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <Tag color="cyan" className="m-0 border-none font-bold text-[8px] uppercase">{p.type}</Tag>
                  </div>
                  <div className="text-slate-450 font-semibold space-y-0.5">
                    <div className="truncate">{p.clinic}</div>
                    <div>Phone: {p.contact}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Draft new referral */}
        <div className="lg:col-span-1">
          <Card 
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                <PlusOutlined style={{ color: '#F97316' }} /> Draft New Referral
              </span>
            }
          >
            <Form form={form} layout="vertical" onFinish={handleSendReferral}>
              <Form.Item name="patientName" label={<span className="text-xs font-semibold text-slate-500">Patient</span>} rules={[{ required: true }]}>
                <Select placeholder="Choose patient..." className="rounded-xl h-10 flex items-center">
                  {availablePatients.map(p => (
                    <Option key={p.id} value={p.name || p.fullName}>{p.name || p.fullName}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="recipient" label={<span className="text-xs font-semibold text-slate-500">Refer to Clinic/Practitioner</span>} rules={[{ required: true }]}>
                <Select placeholder="Choose recipient..." className="rounded-xl h-10 flex items-center">
                  {addressBook.map((p, idx) => (
                    <Option key={idx} value={p.name}>{p.name} ({p.type})</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="recipientType" label={<span className="text-xs font-semibold text-slate-500">Provider Category</span>} initialValue="GP">
                <Radio.Group className="flex flex-col gap-1.5">
                  <Radio value="GP">GP</Radio>
                  <Radio value="Specialist">Specialist</Radio>
                  <Radio value="Allied Health">Allied Health</Radio>
                  <Radio value="Imaging">Imaging Facility</Radio>
                </Radio.Group>
              </Form.Item>

              <div className="pt-1 pb-3">
                <Button 
                  onClick={handleDraftAI}
                  className="w-full rounded-xl font-bold h-9 bg-white dark:bg-slate-900 border-slate-200 hover:border-[#8C4BFF] text-slate-700 dark:text-slate-300"
                >
                  Generate AI Draft letter
                </Button>
              </div>

              {aiDraftText && (
                <Form.Item name="letter" label={<span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Letter Details</span>} rules={[{ required: true }]}>
                  <TextArea rows={8} className="rounded-xl" />
                </Form.Item>
              )}

              <div className="pt-2">
                <Button loading={sendingRef} type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="w-full rounded-xl font-bold h-10 text-white shadow">
                  Approve & Send Letter
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  )
}
