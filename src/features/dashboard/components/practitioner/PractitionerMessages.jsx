import React, { useState } from 'react'
import { Card, Tabs, Table, Tag, Button, Select, Form, Input, Space } from 'antd'
import {
  MessageOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

const { Option } = Select
const { TextArea } = Input

export default function PractitionerMessages() {
  const store = useClinicStore()
  
  const [internalForm] = Form.useForm()
  const [patientForm] = Form.useForm()

  const [internalMsgs, setInternalMsgs] = useState(store.messages?.internal || [])
  const [patientMsgs, setPatientMsgs] = useState(store.messages?.patient || [])

  const handleSendInternal = (values) => {
    const newMsg = {
      sender: 'Dr. Sarah Jenkins',
      receiver: values.receiver,
      message: values.message,
      timestamp: 'Just now'
    }
    setInternalMsgs(prev => [...prev, newMsg])
    toast.success(`Message sent to ${values.receiver}!`)
    internalForm.resetFields()

    // Auto-reply simulation for demo
    setTimeout(() => {
      const replyMsg = {
        sender: values.receiver,
        receiver: 'Dr. Sarah Jenkins',
        message: values.message,
        timestamp: 'Just now'
      }
      setInternalMsgs(prev => [...prev, replyMsg])
    }, 1500)
  }

  const handleSendPatient = (values) => {
    const newMsg = {
      patientName: values.patientName,
      type: values.type || 'Follow-Up Instructions',
      message: values.message,
      status: 'Sent',
      timestamp: 'Just now'
    }
    setPatientMsgs([newMsg, ...patientMsgs])
    toast.success(`Reminder sent to ${values.patientName}!`)
    patientForm.resetFields()
  }

  // Columns for Patient messages
  const patientColumns = [
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>,
      dataIndex: 'patientName',
      key: 'patientName',
      render: text => <span className="font-bold text-slate-700 dark:text-slate-200">{text}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>,
      dataIndex: 'type',
      key: 'type',
      render: text => <Tag color="cyan" className="m-0 border-none font-bold text-[8.5px] uppercase">{text}</Tag>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Message</span>,
      dataIndex: 'message',
      key: 'message',
      width: '40%',
      render: text => <span className="text-slate-500 font-semibold">{text}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Sent Time</span>,
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={s === 'Read' ? 'success' : s === 'Delivered' ? 'processing' : 'default'} className="m-0 border-none font-bold text-[9px] uppercase">{s}</Tag>
    }
  ]

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Clinical Communications</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Send internal messages to front desk/practitioners or outbound reminders to patients.
          </p>
        </div>
      </div>

      <Card className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm">
        <Tabs
          type="card"
          className="p-1 rounded-2xl bg-slate-50/50 dark:bg-slate-955/20"
          items={[
            {
              key: 'internal',
              label: <span><TeamOutlined /> Internal Team Chat</span>,
              children: (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                  {/* Chat Thread */}
                  <div className="lg:col-span-3 space-y-4 flex flex-col justify-between min-h-[380px] bg-slate-50/50 dark:bg-slate-955/20 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {internalMsgs.map((msg, idx) => {
                        const isSarah = msg.sender === 'Dr. Sarah Jenkins'
                        return (
                          <div key={idx} className={`flex flex-col ${isSarah ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold">
                              <span>{msg.sender}</span>
                              <span>&bull;</span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div 
                              className={`p-3 rounded-2xl text-xs max-w-sm ${
                                isSarah ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              {msg.message}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Send Input */}
                    <Form form={internalForm} onFinish={handleSendInternal} className="mt-4">
                      <div className="flex gap-2">
                        <Form.Item name="receiver" initialValue="Reception" noStyle>
                          <Select style={{ width: 130, height: 38 }} className="font-bold">
                            <Option value="Reception">Reception</Option>
                            <Option value="Clinic Manager">Clinic Manager</Option>
                            <Option value="Dr. James Carter">Dr. James Carter</Option>
                            <Option value="Dr. Emily Smith">Dr. Emily Smith</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item name="message" noStyle rules={[{ required: true }]}>
                          <Input placeholder="Type internal team message..." className="flex-1 rounded-xl h-10 border-slate-200" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SendOutlined />} style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl h-10 text-white font-bold" />
                      </div>
                    </Form>
                  </div>

                  {/* Quick Contacts details */}
                  <div className="lg:col-span-2 space-y-4">
                    <h5 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider block">Quick Channels</h5>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Reception desk', status: 'Online', phone: 'Ext 101' },
                        { name: 'Clinic Manager (Alex)', status: 'Online', phone: 'Ext 102' },
                        { name: 'Dr. James Carter', status: 'In Consultation', phone: 'Ext 105' },
                        { name: 'Dr. Emily Smith', status: 'Offline', phone: 'Ext 106' }
                      ].map((chan, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-950 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-250 block">{chan.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{chan.phone}</span>
                          </div>
                          <Tag color={chan.status === 'Online' ? 'success' : chan.status === 'Offline' ? 'default' : 'warning'} className="m-0 border-none font-bold text-[8.5px] uppercase">
                            {chan.status}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'patient',
              label: <span><UserOutlined /> Patient SMS Reminders</span>,
              children: (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                  {/* Sent patient log */}
                  <div className="lg:col-span-3">
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider block mb-3">SMS Dispatch Log</h4>
                    <Table 
                      dataSource={patientMsgs}
                      columns={patientColumns}
                      rowKey={(r, idx) => idx}
                      pagination={false}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Outbound Dispatcher Form */}
                  <div className="lg:col-span-2">
                    <Card className="border border-slate-150 rounded-2xl bg-slate-50 dark:bg-slate-800/50" title={<span className="text-xs font-black uppercase text-slate-400">Send SMS Notification</span>}>
                      <Form form={patientForm} layout="vertical" onFinish={handleSendPatient}>
                        <Form.Item name="patientName" label={<span className="text-xs font-semibold text-slate-500">Select Patient</span>} rules={[{ required: true }]}>
                          <Select placeholder="Choose patient..." className="rounded-xl h-10 flex items-center">
                            {store.patients.map(p => (
                              <Option key={p.id} value={p.name}>{p.name}</Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item name="type" label={<span className="text-xs font-semibold text-slate-500">SMS Category Template</span>} rules={[{ required: true }]}>
                          <Select placeholder="Choose template type..." className="rounded-xl h-10 flex items-center">
                            <Option value="Follow-Up Instructions">Follow-Up Instructions</Option>
                            <Option value="Appointment Reminder">Appointment Reminder</Option>
                            <Option value="Exercise Reminder">Exercise Compliance Reminder</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item name="message" label={<span className="text-xs font-semibold text-slate-500">SMS Body text</span>} rules={[{ required: true }]}>
                          <TextArea rows={4} placeholder="Type SMS content..." className="rounded-xl" />
                        </Form.Item>

                        <div className="pt-2">
                          <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="w-full rounded-xl font-bold h-10 text-white shadow">
                            Dispatch Outbound SMS
                          </Button>
                        </div>
                      </Form>
                    </Card>
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
