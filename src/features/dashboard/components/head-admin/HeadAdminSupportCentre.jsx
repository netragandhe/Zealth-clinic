import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Table, Card, Button, Tag, Space, Modal } from 'antd'
import {
  EyeOutlined,
  PlusOutlined,
  LikeOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  BugOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

const { Option } = Select

export default function HeadAdminSupportCentre() {
  const [activeSubTab, setActiveSubTab] = useState('Tickets')
  const [loading, setLoading] = useState(false)

  // ── 1. TICKETS TAB STATES ──
  const [tickets, setTickets] = useState([])
  const [ticketSearch, setTicketSearch] = useState('')
  const [ticketStatus, setTicketStatus] = useState('All')
  const [ticketPriority, setTicketPriority] = useState('All')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [ticketForm] = Form.useForm()
  const [currentPage, setCurrentPage] = useState(1)

  // ── 2. LIVE CHAT STATES ──
  const [activeChats, setActiveChats] = useState([])
  const [selectedChatId, setSelectedChatId] = useState('1')
  const [chatInput, setChatInput] = useState('')

  // ── 3. BUG REPORTS STATES ──
  const [bugs, setBugs] = useState([])
  const [bugSeverityFilter, setBugSeverityFilter] = useState('All')
  const [bugStatusFilter, setBugStatusFilter] = useState('All')
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)
  const [bugForm] = Form.useForm()

  // ── 4. FEATURE REQUESTS STATES ──
  const [features, setFeatures] = useState([])
  const [featureStatusFilter, setFeatureStatusFilter] = useState('All')
  const [featureSort, setFeatureSort] = useState('Most votes')
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false)
  const [featureForm] = Form.useForm()

  // ── 5. CLINIC HISTORY STATES ──
  const [clinicHistory, setClinicHistory] = useState([])

  const fetchSupportData = async () => {
    setLoading(true)
    try {
      const [ticketsRes, bugsRes, featuresRes, chatsRes, historyRes] = await Promise.all([
        api.get('/api/super-admin/support-tickets').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/super-admin/support-bugs').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/super-admin/support-features').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/super-admin/support-chats').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/super-admin/support-history').catch(() => ({ data: { success: false, data: [] } }))
      ])

      if (ticketsRes.data?.success) setTickets(ticketsRes.data.data)
      if (bugsRes.data?.success) setBugs(bugsRes.data.data)
      if (featuresRes.data?.success) setFeatures(featuresRes.data.data)
      if (chatsRes.data?.success) setActiveChats(chatsRes.data.data)
      if (historyRes.data?.success) setClinicHistory(historyRes.data.data)
    } catch (err) {
      console.error('Failed to fetch support centre data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupportData()
  }, [])

  // Handle Ticket Update in DB
  const handleUpdateTicket = async (values) => {
    if (!selectedTicket) return
    try {
      const res = await api.put(`/api/super-admin/support-tickets/${selectedTicket.id}`, values)
      if (res.data?.success) {
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, ...values } : t))
        toast.success(`Ticket ${selectedTicket.displayId || selectedTicket.id} updated!`)
        setIsTicketModalOpen(false)
      }
    } catch (err) {
      toast.error('Failed to update ticket')
    }
  }

  // Handle SLA Escalation in DB
  const handleEscalateSLA = async (id, displayId) => {
    try {
      const res = await api.put(`/api/super-admin/support-tickets/${id}`, {
        priority: 'Urgent',
        status: 'In progress'
      })
      if (res.data?.success) {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, priority: 'Urgent', status: 'In progress' } : t))
        toast.success(`Ticket ${displayId || id} escalated to Senior Tech Squad! Priority set to Urgent.`)
      }
    } catch (err) {
      toast.error('Failed to escalate ticket SLA')
    }
  }

  // Handle Bug Submit in DB
  const handleBugSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        category: values.category || 'Auth',
        severity: values.severity || 'High',
        status: 'New',
        clinic: values.clinic || 'System',
        reporter: 'Support Agent',
        steps: values.steps || null,
        affected: parseInt(values.affected) || 1
      }
      const res = await api.post('/api/super-admin/support-bugs', payload)
      if (res.data?.success) {
        const created = res.data.data
        setBugs(prev => [created, ...prev])
        setIsBugModalOpen(false)
        bugForm.resetFields()
        toast.success(`Bug report ${created.displayId || ''} created!`)
      }
    } catch (err) {
      toast.error('Failed to create bug report')
    }
  }

  const handleUpdateBugStatus = async (id, newStatus, displayId) => {
    try {
      const res = await api.put(`/api/super-admin/support-bugs/${id}`, { status: newStatus })
      if (res.data?.success) {
        setBugs(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
        toast.success(`Bug ${displayId || ''} status updated to ${newStatus}`)
      }
    } catch (err) {
      toast.error('Failed to update bug status')
    }
  }

  // Handle Feature Submit in DB
  const handleFeatureSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        desc: values.desc,
        category: values.category || 'General',
        status: 'Under Review',
        clinic: values.clinic || 'System',
        submitter: 'Support Agent'
      }
      const res = await api.post('/api/super-admin/support-features', payload)
      if (res.data?.success) {
        const created = res.data.data
        setFeatures(prev => [created, ...prev])
        setIsFeatureModalOpen(false)
        featureForm.resetFields()
        toast.success(`Feature request ${created.displayId || ''} submitted!`)
      }
    } catch (err) {
      toast.error('Failed to submit feature request')
    }
  }

  const handleVote = async (id) => {
    try {
      const res = await api.put(`/api/super-admin/support-features/${id}/vote`, {})
      if (res.data?.success) {
        setFeatures(prev => prev.map(f => f.id === id ? { ...f, votes: f.votes + 1 } : f))
        toast.success('Vote recorded!')
      }
    } catch (err) {
      toast.error('Failed to register vote')
    }
  }

  // Send Chat Message to DB
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChat) return
    try {
      const payload = {
        chatId: selectedChat.chatId,
        name: selectedChat.name,
        clinic: selectedChat.clinic,
        sender: 'Support Agent',
        text: chatInput
      }
      const res = await api.post('/api/super-admin/support-chats', payload)
      if (res.data?.success) {
        const newMsg = res.data.data
        setActiveChats(prev => [...prev, newMsg])
        setChatInput('')
        toast.success('Message sent!')
      }
    } catch (err) {
      toast.error('Failed to send chat message')
    }
  }

  // Filters
  const filteredTickets = tickets.filter(t => {
    const searchLower = ticketSearch.toLowerCase()
    const matchesSearch = (t.desc || '').toLowerCase().includes(searchLower) || 
                          (t.clinic || '').toLowerCase().includes(searchLower) || 
                          (t.displayId || '').toLowerCase().includes(searchLower)
    const matchesStatus = ticketStatus === 'All' || t.status === ticketStatus
    const matchesPriority = ticketPriority === 'All' || t.priority === ticketPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Priority Queue Derived Data
  const priorityQueue = tickets.filter(t => t.priority === 'Urgent' || t.priority === 'High' || t.status === 'Open')

  // Bug Reports Filters
  const filteredBugs = bugs.filter(b => {
    const matchesSeverity = bugSeverityFilter === 'All' || b.severity === bugSeverityFilter
    const matchesStatus = bugStatusFilter === 'All' || b.status === bugStatusFilter
    return matchesSeverity && matchesStatus
  })

  // Feature Requests Filter & Sort
  const filteredFeatures = features
    .filter(f => featureStatusFilter === 'All' || f.status === featureStatusFilter)
    .sort((a, b) => {
      if (featureSort === 'Most votes') return (b.votes || 0) - (a.votes || 0)
      return (a.votes || 0) - (b.votes || 0)
    })

  // Group Live Chat by ChatId
  const chatGroups = {}
  activeChats.forEach(c => {
    const cid = c.chatId || '1'
    if (!chatGroups[cid]) {
      chatGroups[cid] = {
        id: cid,
        name: c.name,
        clinic: c.clinic,
        lastMsg: c.text,
        status: c.status || 'Active',
        unread: c.unread || 0,
        messages: []
      }
    }
    chatGroups[cid].messages.push(c)
    chatGroups[cid].lastMsg = c.text
  })
  const chatList = Object.values(chatGroups)
  const selectedChat = chatGroups[selectedChatId] || chatList[0]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Banner */}
      <div>
        <h1 className="text-xl font-bold text-slate-850 dark:text-white m-0 tracking-tight">Support Centre</h1>
        <p className="text-slate-400 dark:text-slate-455 text-xs mt-1 font-semibold">Manage tickets, live chat, bugs, feature requests, and clinic support history</p>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['Tickets', 'Priority Queue', 'Live Chat', 'Bug Reports', 'Clinic History'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border border-solid rounded-full cursor-pointer ${
              activeSubTab === tab 
                ? 'bg-[#8C4BFF] text-white border-[#8C4BFF]' 
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 1. TICKETS TAB ── */}
      {activeSubTab === 'Tickets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tickets</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-0">{tickets.length}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Open</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-0">
                {tickets.filter(t => t.status === 'Open').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">In Progress</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-0">
                {tickets.filter(t => t.status === 'In progress').length}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resolved</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-0">
                {tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length}
              </h3>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden" title={
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white text-base block">All Support Tickets</span>
                <span className="text-slate-455 dark:text-slate-400 text-[10px] block mt-0.5 font-semibold">Showing {filteredTickets.length} of {tickets.length} tickets</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <Input
                  placeholder="Search tickets, requester..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                  style={{ width: 220 }}
                />
                <Select value={ticketStatus} onChange={setTicketStatus} className="rounded-xl h-9 text-xs" style={{ width: 120 }}>
                  <Option value="All">All Status</Option>
                  <Option value="Open">Open</Option>
                  <Option value="In progress">In progress</Option>
                  <Option value="Resolved">Resolved</Option>
                  <Option value="Closed">Closed</Option>
                </Select>
                <Select value={ticketPriority} onChange={setTicketPriority} className="rounded-xl h-9 text-xs" style={{ width: 120 }}>
                  <Option value="All">All Priority</Option>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                  <Option value="Urgent">Urgent</Option>
                </Select>
              </div>
            </div>
          }>
            <Table
              dataSource={filteredTickets.slice((currentPage - 1) * 10, currentPage * 10)}
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: 10,
                total: filteredTickets.length,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false
              }}
              rowKey="id"
              columns={[
                {
                  title: 'Ticket',
                  dataIndex: 'displayId',
                  render: (displayId, rec) => (
                    <div>
                      <span className="font-mono text-purple-700 dark:text-purple-300 font-bold text-xs block">{displayId || rec.id}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{rec.desc}</span>
                    </div>
                  )
                },
                {
                  title: 'Requester',
                  dataIndex: 'clinic',
                  render: (c, rec) => (
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-350 text-xs block">{c}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{rec.email}</span>
                    </div>
                  )
                },
                {
                  title: 'Category',
                  dataIndex: 'category',
                  render: (cat) => <Tag className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">{cat || 'Technical'}</Tag>
                },
                {
                  title: 'Priority',
                  dataIndex: 'priority',
                  render: (p) => (
                    <Tag color={p === 'Urgent' || p === 'High' ? 'error' : p === 'Medium' ? 'warning' : 'default'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {p}
                    </Tag>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Open' ? 'processing' : s === 'In progress' ? 'warning' : 'success'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                      {s}
                    </Tag>
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  align: 'right',
                  render: (_, rec) => (
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      className="rounded-lg text-xs font-bold"
                      onClick={() => {
                        setSelectedTicket(rec)
                        ticketForm.setFieldsValue({ status: rec.status, priority: rec.priority })
                        setIsTicketModalOpen(true)
                      }}
                    >
                      Manage
                    </Button>
                  )
                }
              ]}
            />
          </Card>

          {/* Manage Ticket Modal */}
          <Modal
            open={isTicketModalOpen}
            onCancel={() => setIsTicketModalOpen(false)}
            footer={null}
            destroyOnHidden
            title={<span className="font-bold text-base text-slate-800 dark:text-white">Manage Ticket {selectedTicket?.displayId || selectedTicket?.id}</span>}
          >
            {selectedTicket && (
              <Form form={ticketForm} layout="vertical" onFinish={handleUpdateTicket}>
                <div className="mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">{selectedTicket.desc}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Requested by {selectedTicket.clinic} ({selectedTicket.email})</span>
                </div>
                <Form.Item name="status" label={<span className="text-xs font-bold">Update Ticket Status</span>}>
                  <Select className="rounded-xl h-10">
                    <Option value="Open">Open</Option>
                    <Option value="In progress">In progress</Option>
                    <Option value="Resolved">Resolved</Option>
                    <Option value="Closed">Closed</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="priority" label={<span className="text-xs font-bold">Update Priority</span>}>
                  <Select className="rounded-xl h-10">
                    <Option value="Low">Low</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="High">High</Option>
                    <Option value="Urgent">Urgent</Option>
                  </Select>
                </Form.Item>
                <div className="text-right">
                  <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl h-10 font-bold px-5">
                    Save Changes
                  </Button>
                </div>
              </Form>
            )}
          </Modal>
        </div>
      )}

      {/* ── 2. PRIORITY QUEUE TAB ── */}
      {activeSubTab === 'Priority Queue' && (
        <div className="space-y-6">
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-bold text-base text-rose-600 flex items-center gap-2"><ExclamationCircleOutlined /> Priority & Urgent SLA Breach Queue</span>}>
            <Table
              dataSource={priorityQueue}
              pagination={false}
              loading={loading}
              rowKey="id"
              columns={[
                { title: 'Ticket ID', dataIndex: 'displayId', render: (id, rec) => <span className="font-mono text-purple-700 dark:text-purple-300 font-bold text-xs">{id || rec.id}</span> },
                { title: 'Priority', dataIndex: 'priority', render: (p) => <Tag color="error" className="rounded-full font-bold text-[9px] px-2.5 py-0.5">{p}</Tag> },
                { title: 'Clinic', dataIndex: 'clinic', render: (c, rec) => <span className="font-bold text-xs text-slate-800 dark:text-white">{c} ({rec.email})</span> },
                { title: 'Issue Summary', dataIndex: 'desc', render: (d) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{d}</span> },
                { title: 'Status', dataIndex: 'status', render: (s) => <Tag color="warning" className="rounded-full font-bold text-[9px] px-2.5 py-0.5">{s}</Tag> },
                {
                  title: 'Escalation',
                  key: 'esc',
                  align: 'right',
                  render: (_, rec) => (
                    <Button size="small" type="primary" danger className="rounded-lg text-[10px] font-bold cursor-pointer" onClick={() => handleEscalateSLA(rec.id, rec.displayId)}>
                      Escalate SLA
                    </Button>
                  )
                }
              ]}
            />
          </Card>
        </div>
      )}

      {/* ── 3. LIVE CHAT TAB ── */}
      {activeSubTab === 'Live Chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-bold text-sm">Active Support Chats ({chatList.length})</span>}>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {chatList.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedChatId(c.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedChatId === c.id ? 'border-[#8C4BFF] bg-purple-50/40 dark:bg-purple-950/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-800 dark:text-white">{c.name}</span>
                    <Tag color={c.status === 'Active' ? 'processing' : 'default'} className="rounded-full text-[8px] border-none font-bold">{c.status}</Tag>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{c.clinic}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block mt-1 truncate">{c.lastMsg}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 md:col-span-2 flex flex-col justify-between" title={
            selectedChat ? (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-white block">{selectedChat.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{selectedChat.clinic}</span>
                </div>
                <Tag color="success" className="rounded-full text-[9px] font-bold border-none">Live Agent Connected</Tag>
              </div>
            ) : 'Live Chat Console'
          }>
            <div className="min-h-[350px] max-h-[400px] overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-4">
              {selectedChat?.messages?.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'Support Agent' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">{msg.sender}</span>
                  <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${msg.sender === 'Support Agent' ? 'bg-[#0E1B33] text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type response to clinic..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPressEnter={handleSendChatMessage}
                className="rounded-xl h-10 text-xs"
              />
              <Button type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl h-10 px-5 font-bold" onClick={handleSendChatMessage}>
                <SendOutlined />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── 4. BUG REPORTS TAB ── */}
      {activeSubTab === 'Bug Reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Open Bugs</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-0">{bugs.filter(b => b.status !== 'Fixed').length}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Critical Severity</span>
              <h3 className="text-2xl font-black text-rose-500 mt-2 mb-0">{bugs.filter(b => b.severity === 'Critical').length}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Users Affected</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2 mb-0">
                {bugs.reduce((acc, curr) => acc + (curr.affected || 0), 0)}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fixed (Recent)</span>
              <h3 className="text-2xl font-black text-emerald-500 mt-2 mb-0">{bugs.filter(b => b.status === 'Fixed').length}</h3>
            </div>
          </div>

          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Active Platform Bug Reports</span>
              <Button type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs h-9 px-4 flex items-center gap-1.5" onClick={() => setIsBugModalOpen(true)}>
                <BugOutlined /> + Report Bug
              </Button>
            </div>
          }>
            <div className="space-y-4">
              {filteredBugs.map(bug => (
                <div key={bug.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-purple-700 dark:text-purple-300 font-bold text-xs">{bug.displayId || bug.id}</span>
                      <Tag color={bug.severity === 'Critical' ? 'error' : bug.severity === 'High' ? 'warning' : 'default'} className="rounded-full border-none font-bold text-[9px]">{bug.severity}</Tag>
                      <Tag color={bug.status === 'Fixed' ? 'success' : 'processing'} className="rounded-full border-none font-bold text-[9px]">{bug.status}</Tag>
                      <Tag className="rounded-full border-none font-bold text-[9px]">{bug.category}</Tag>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white m-0 mt-1">{bug.title}</h4>
                    <span className="text-[10px] text-slate-400 block font-semibold">{bug.clinic} · reported by {bug.reporter} on {bug.date || 'Recently'}</span>
                    {bug.steps && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[10px]">Steps: {bug.steps}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{bug.affected || 1} users affected</span>
                    {bug.status !== 'Fixed' ? (
                      <Button size="small" type="primary" className="bg-emerald-600 border-none font-bold text-xs rounded-lg" onClick={() => handleUpdateBugStatus(bug.id, 'Fixed', bug.displayId)}>
                        Mark Fixed
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-extrabold flex items-center gap-1"><CheckCircleOutlined /> Fixed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Report Bug Modal */}
          <Modal open={isBugModalOpen} onCancel={() => setIsBugModalOpen(false)} footer={null} destroyOnHidden title={<span className="font-bold text-base text-slate-800 dark:text-white">Report New Platform Bug</span>}>
            <Form form={bugForm} layout="vertical" onFinish={handleBugSubmit} initialValues={{ severity: 'High', category: 'Auth' }}>
              <Form.Item name="title" label={<span className="text-xs font-bold">Bug Title *</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Add Staff form returns 500 error" className="rounded-xl h-10" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="category" label={<span className="text-xs font-bold">Module</span>}>
                  <Select className="rounded-xl h-10">
                    <Option value="Auth">Auth & Security</Option>
                    <Option value="Billing">Billing & Subscription</Option>
                    <Option value="Clinical Notes">Clinical Notes</Option>
                    <Option value="Mobile">Mobile App</Option>
                    <Option value="Scheduling">Scheduling</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="severity" label={<span className="text-xs font-bold">Severity</span>}>
                  <Select className="rounded-xl h-10">
                    <Option value="Low">Low</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="High">High</Option>
                    <Option value="Critical">Critical</Option>
                  </Select>
                </Form.Item>
              </div>
              <Form.Item name="steps" label={<span className="text-xs font-bold">Steps to Reproduce</span>}>
                <Input.TextArea rows={3} placeholder="1. Go to page X... 2. Click button Y..." className="rounded-xl" />
              </Form.Item>
              <div className="text-right">
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl h-10 font-bold px-5">
                  Submit Bug Report
                </Button>
              </div>
            </Form>
          </Modal>
        </div>
      )}

      {/* ── 5. FEATURE REQUESTS TAB ── */}
      {activeSubTab === 'Feature Requests' && (
        <div className="space-y-6">
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-sm text-slate-800 dark:text-white">Community Feature Requests Pipeline</span>
              <Button type="primary" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl font-bold text-xs h-9 px-4 flex items-center gap-1.5" onClick={() => setIsFeatureModalOpen(true)}>
                <PlusOutlined /> Request Feature
              </Button>
            </div>
          }>
            <div className="space-y-4">
              {filteredFeatures.map(feat => (
                <div key={feat.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-purple-700 dark:text-purple-300 font-bold text-xs">{feat.displayId || feat.id}</span>
                      <Tag color={feat.status === 'Shipped' ? 'success' : feat.status === 'In Progress' ? 'processing' : 'warning'} className="rounded-full border-none font-bold text-[9px]">{feat.status}</Tag>
                      <Tag className="rounded-full border-none font-bold text-[9px]">{feat.category}</Tag>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white m-0 mt-1">{feat.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0">{feat.desc}</p>
                    <span className="text-[10px] text-slate-400 block font-semibold mt-1">Requested by {feat.clinic} ({feat.submitter})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button icon={<LikeOutlined />} className="rounded-xl font-bold text-xs h-9 px-4" onClick={() => handleVote(feat.id)}>
                      {feat.votes || 0} Votes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Feature Modal */}
          <Modal open={isFeatureModalOpen} onCancel={() => setIsFeatureModalOpen(false)} footer={null} destroyOnHidden title={<span className="font-bold text-base text-slate-800 dark:text-white">Submit Feature Request</span>}>
            <Form form={featureForm} layout="vertical" onFinish={handleFeatureSubmit} initialValues={{ category: 'General' }}>
              <Form.Item name="title" label={<span className="text-xs font-bold">Feature Title *</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. AI-generated SOAP note summaries" className="rounded-xl h-10" />
              </Form.Item>
              <Form.Item name="category" label={<span className="text-xs font-bold">Category</span>}>
                <Select className="rounded-xl h-10">
                  <Option value="AI">AI & Automation</Option>
                  <Option value="Reporting">Analytics & Reports</Option>
                  <Option value="Integrations">Integrations</Option>
                  <Option value="Mobile">Mobile App</Option>
                  <Option value="Billing">Billing & Remittance</Option>
                </Select>
              </Form.Item>
              <Form.Item name="desc" label={<span className="text-xs font-bold">Description *</span>} rules={[{ required: true }]}>
                <Input.TextArea rows={3} placeholder="Describe the requested feature and workflow..." className="rounded-xl" />
              </Form.Item>
              <div className="text-right">
                <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }} className="rounded-xl h-10 font-bold px-5">
                  Submit Feature
                </Button>
              </div>
            </Form>
          </Modal>
        </div>
      )}

      {/* ── 6. CLINIC HISTORY TAB ── */}
      {activeSubTab === 'Clinic History' && (
        <div className="space-y-6">
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-bold text-sm text-slate-800 dark:text-white">Clinic Support Resolution & CSAT Ledger</span>}>
            <Table
              dataSource={clinicHistory}
              pagination={false}
              loading={loading}
              rowKey="id"
              columns={[
                { title: 'History ID', dataIndex: 'displayId', render: (id) => <span className="font-mono text-purple-700 dark:text-purple-300 font-bold text-xs">{id || 'HST-000001'}</span> },
                { title: 'Clinic Name', dataIndex: 'clinic', render: (c) => <span className="font-bold text-slate-800 dark:text-white text-xs">{c}</span> },
                { title: 'Tickets Resolved', dataIndex: 'ticketsResolved', render: (t) => <span className="font-bold text-xs text-emerald-600">{t} resolved</span> },
                { title: 'Bugs Reported', dataIndex: 'bugsReported', render: (b) => <span className="font-bold text-xs">{b} bugs</span> },
                { title: 'Last Contact', dataIndex: 'lastContact', render: (d) => <span className="text-xs text-slate-400">{d}</span> },
                { title: 'Satisfaction (CSAT)', dataIndex: 'satisfaction', render: (csat) => <Tag color="purple" className="rounded-full font-bold text-[9px] px-2.5 py-0.5">{csat}</Tag> }
              ]}
            />
          </Card>
        </div>
      )}

    </div>
  )
}
