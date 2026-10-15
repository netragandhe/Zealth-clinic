import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Modal, Timeline, Checkbox } from 'antd'
import {
  SearchOutlined,
  SendOutlined,
  MailOutlined,
  InfoCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'
import api from '../../../../api/axios'

const { Option } = Select



export default function HeadAdminNotifications() {
  const store = useClinicStore()
  const userRole = store.userRole
  const darkMode = store.darkMode

  const [notificationsList, setNotificationsList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/notifications')
      if (data.success) {
        setNotificationsList(data.data)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const handleRefetch = () => fetchNotifications()
    window.addEventListener('notification:refetch', handleRefetch)

    return () => {
      window.removeEventListener('notification:refetch', handleRefetch)
    }
  }, [userRole])

  const [activeTab, setActiveTab] = useState('Inbox')
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handleBroadcast = async (values) => {
    try {
      const { data } = await api.post('/api/notifications/broadcast', {
        title: values.title,
        message: values.message,
        target: values.target
      })
      if (data.success) {
        toast.success('Message sent successfully!')
        fetchNotifications()
        form.resetFields()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to send message')
    }
  }

  // Filter list by tab first
  const tabNotifications = notificationsList.filter(item => 
    activeTab === 'Inbox' ? item.type === 'inbox' : item.type === 'sent'
  )

  // Filter list by search query
  const filteredNotifications = tabNotifications.filter(item => {
    const query = searchText.toLowerCase()
    return (
      item.title.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query) ||
      item.target.toLowerCase().includes(query)
    )
  })

  // Role based defaults for message modal
  const getDefaultRecipient = () => {
    if (userRole === 'sales') return 'Support Team'
    if (userRole === 'practitioner') return 'Clinic Manager'
    if (userRole === 'patient') return 'Dr. Sarah Jenkins'
    if (userRole === 'clinic') return 'Practitioners / Staff'
    return 'All Members'
  }

  return (
    <div className="space-y-6">
      {/* Search and Broadcast Controls Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors duration-300">
        {/* Left Side: Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl w-fit border border-slate-100 dark:border-slate-900">
          <button
            onClick={() => {
              setActiveTab('Inbox')
              setSearchText('')
            }}
            className={`px-6 py-2 text-xs font-bold rounded-lg cursor-pointer border-none transition-all ${
              activeTab === 'Inbox'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm'
                : 'bg-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => {
              setActiveTab('Sent')
              setSearchText('')
            }}
            className={`px-6 py-2 text-xs font-bold rounded-lg cursor-pointer border-none transition-all ${
              activeTab === 'Sent'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm'
                : 'bg-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Right Side: Filters & Send Button */}
        <div className="flex items-center flex-wrap gap-3 flex-1 md:justify-end">
          <Input
            placeholder="Search notifications..."
            prefix={<SearchOutlined className="text-slate-400 mr-2" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="rounded-xl h-10 w-full sm:w-64 border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-xs"
          />

          <Select
            placeholder="Filter Date"
            defaultValue="Date"
            className="rounded-xl h-10 w-32 flex items-center border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs"
          >
            <Option value="Date">Date</Option>
            <Option value="Today">Today</Option>
            <Option value="Yesterday">Yesterday</Option>
          </Select>

          <Button
            type="default"
            onClick={async () => {
              try {
                await api.put('/api/notifications/mark-all-read')
                setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })))
                toast.success('All notifications marked as read')
              } catch (err) {
                toast.error('Failed to mark all as read')
              }
            }}
            className="rounded-xl h-10 px-4 font-bold text-xs border-slate-200 dark:border-slate-800 dark:bg-slate-950"
          >
            Mark All Read
          </Button>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: '#0E1B33', border: 'none' }}
            className="rounded-xl h-10 px-5 font-bold flex items-center gap-2 text-white"
          >
            {userRole === 'head_admin' ? 'Broadcast Message' : userRole === 'sales' ? 'Message Support' : 'Contact Admin'}
          </Button>
        </div>
      </div>

      {/* Notifications Cards Container */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold text-xs">No notifications found in {activeTab}</div>
        ) : (
          filteredNotifications.map(item => (
            <div 
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !item.isRead
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
              }`}
            >
              {/* Left Side: Icon & Details */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !item.isRead ? 'bg-[#8C4BFF] text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <MailOutlined style={{ fontSize: 16 }} />
                  </div>
                  {!item.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm m-0">
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px]">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-semibold m-0">
                    {item.message}
                  </p>
                </div>
              </div>

              {/* Right Side: Meta & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0">
                <div className="flex flex-col sm:items-end text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Target: {item.target}</span>
                  <span className="mt-0.5 text-slate-600 dark:text-slate-300 font-bold">{item.date || new Date(item.createdAt).toLocaleDateString()} · {item.time || new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="text"
                    icon={<InfoCircleOutlined className="text-slate-400 hover:text-slate-600" />}
                    onClick={async () => {
                      // Mark read on click
                      if (!item.isRead) {
                        try {
                          await api.put(`/api/notifications/${item.id}/read`)
                          setNotificationsList(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n))
                        } catch (err) {
                          console.error(err)
                        }
                      }
                      Modal.info({
                        title: item.title,
                        content: (
                          <div className="space-y-2 text-xs font-semibold mt-3" style={{ color: '#475569' }}>
                            <p style={{ color: '#475569' }}><strong style={{ color: '#0F1B33' }}>Message:</strong> {item.message}</p>
                            <p style={{ color: '#475569' }}><strong style={{ color: '#0F1B33' }}>Recipient:</strong> {item.target}</p>
                            <p style={{ color: '#475569' }}><strong style={{ color: '#0F1B33' }}>Date:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                          </div>
                        ),
                        okButtonProps: { style: { backgroundColor: '#0E1B33', borderRadius: '8px' } }
                      })
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg dark:text-slate-400"
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={async () => {
                      try {
                        const { data } = await api.delete(`/api/notifications/${item.id}`)
                        if (data.success) {
                          setNotificationsList(prev => prev.filter(n => n.id !== item.id))
                          toast.success('Notification removed')
                        }
                      } catch (error) {
                        console.error(error)
                        toast.error('Failed to remove notification')
                      }
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination at the bottom */}
        {filteredNotifications.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <div>
              Showing 1-{filteredNotifications.length} out of {filteredNotifications.length}
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-transparent border-none text-slate-400 hover:text-slate-650 cursor-pointer font-bold flex items-center gap-1">
                &lt; Previous
              </button>
              <span className="w-6 h-6 bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20 flex items-center justify-center rounded-full text-[10px] font-bold">
                1
              </span>
              <button className="bg-transparent border-none text-slate-400 hover:text-slate-650 cursor-pointer font-bold flex items-center gap-1">
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messaging Modal */}
      <Modal
        title={
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-slate-800 dark:text-white">Compose Message</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 font-semibold font-sans">Send updates directly to the designated department</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="rounded-2xl overflow-hidden"
      >
        <Form form={form} layout="vertical" onFinish={handleBroadcast} initialValues={{ target: getDefaultRecipient() }} className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">To :</span>
          </div>
          <Form.Item name="target" rules={[{ required: true, message: 'Required' }]} className="mb-4">
            <Input 
              disabled={userRole !== 'head_admin'}
              placeholder="Add members" 
              className="rounded-xl h-10 pr-12 dark:bg-slate-900 dark:border-slate-800 dark:text-white" 
              suffix={
                <span className="bg-[#EFEEFF] text-[#8C4BFF] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {userRole === 'head_admin' ? 'Broadcast' : 'Direct'}
                </span>
              }
            />
          </Form.Item>

          <Form.Item name="title" label={<span className="font-bold text-xs text-slate-800 dark:text-slate-200">Subject</span>} rules={[{ required: true, message: 'Required' }]} className="mb-4">
            <Input placeholder="Include message topic" className="rounded-xl h-10 dark:bg-slate-900 dark:border-slate-800 dark:text-white" />
          </Form.Item>

          <Form.Item name="message" label={<span className="font-bold text-xs text-slate-800 dark:text-slate-200">Message</span>} rules={[{ required: true, message: 'Required' }]} className="mb-4">
            <Input.TextArea placeholder="Enter message details..." rows={5} className="rounded-xl dark:bg-slate-900 dark:border-slate-800 dark:text-white" />
          </Form.Item>

          <Form.Item name="confirm" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Please confirm changes')) }]} className="mb-4">
            <Checkbox className="text-xs text-slate-500 font-semibold dark:text-slate-400">Confirm changes of this message</Checkbox>
          </Form.Item>

          <div className="flex justify-end mt-6">
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SendOutlined />} 
              style={{ backgroundColor: '#8C4BFF', border: 'none' }} 
              className="rounded-xl h-10 px-6 font-bold flex items-center gap-2 text-white hover:opacity-90"
            >
              Send
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
