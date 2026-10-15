import React, { useState } from 'react'
import { Card, Table, Button, Tag, Input, Select, Space, Timeline } from 'antd'
import { SearchOutlined, PlusOutlined, PhoneOutlined, MailOutlined, EditOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'

const { Option } = Select

export default function SalesLeads({ store, modalContext }) {
  const [searchText, setSearchText] = useState('')
  const [selectedStage, setSelectedStage] = useState('All')
  const [selectedLead, setSelectedLead] = useState(null)
  const [noteInput, setNoteInput] = useState('')

  const { leads } = store

  React.useEffect(() => {
    store.fetchLeads()
  }, [])

  const getLoggedInSalesName = () => {
    if (store.user?.name) return store.user.name
    if (store.salesProfile?.name) return store.salesProfile.name
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName')
      if (storedName) return storedName
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed?.name) return parsed.name
        } catch (e) {}
      }
    }
    return store.userRole === 'sales' ? 'Sales Executive' : ''
  }

  const currentRepName = getLoggedInSalesName()

  const isMatchingRep = (salespersonField) => {
    if (!salespersonField) return true
    if (!currentRepName) return true
    const sp = salespersonField.toLowerCase().trim()
    const cur = currentRepName.toLowerCase().trim()
    return sp.includes(cur) || cur.includes(sp) || sp === 'unassigned' || sp === 'sales executive'
  }

  // Filters
  const filteredLeads = (leads || [])
    .filter(l => isMatchingRep(l.assignedTo || l.salesperson))
    .filter(l => {
      const nameStr = l.name || l.companyName || ''
      const contactStr = l.contactPerson || ''
      const locStr = l.location || l.territory || ''
      const matchesSearch = nameStr.toLowerCase().includes(searchText.toLowerCase()) ||
                            contactStr.toLowerCase().includes(searchText.toLowerCase()) ||
                            locStr.toLowerCase().includes(searchText.toLowerCase())
      
      const matchesStage = selectedStage === 'All' || l.stage === selectedStage
      return matchesSearch && matchesStage
    })

  const handleAddNoteSubmit = () => {
    if (!noteInput.trim()) return
    store.addLeadActivity(selectedLead.id, `Note added: "${noteInput}"`)
    
    // Update local state to reflect history in open drawer
    const updatedLead = store.leads.find(l => l.id === selectedLead.id)
    setSelectedLead(updatedLead)
    setNoteInput('')
    toast.success('Note added successfully!')
  }

  const handleLogActivity = (type) => {
    const text = type === 'call' ? 'Logged Outbound Call with client' : 'Logged Outbound Email sent to client'
    store.addLeadActivity(selectedLead.id, text)
    const updatedLead = store.leads.find(l => l.id === selectedLead.id)
    setSelectedLead(updatedLead)
    toast.success(`${type === 'call' ? 'Call' : 'Email'} activity logged!`)
  }

  const handleStageChange = (newStage) => {
    if (newStage === 'Converted') {
      modalContext.setSelectedLeadId(selectedLead.id)
      modalContext.setConvertModalOpen(true)
      setSelectedLead(null) // Close drawer
      return
    }
    store.moveLeadStage(selectedLead.id, newStage)
    const updatedLead = store.leads.find(l => l.id === selectedLead.id)
    setSelectedLead(updatedLead)
    toast.success(`Stage updated to ${newStage}`)
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case 'New Lead': return 'blue'
      case 'Discovery Call': return 'purple'
      case 'Demo Scheduled': return 'cyan'
      case 'Proposal Sent': return 'orange'
      case 'Negotiating': return 'gold'
      case 'Trial Started': return 'magenta'
      case 'Converted': return 'green'
      default: return 'default'
    }
  }

  const activeLead = selectedLead ? (store.leads.find(l => l.id === selectedLead.id) || selectedLead) : null

  if (activeLead) {
    return (
      <div className="space-y-6">
        
        {/* Navigation & Action Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setSelectedLead(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer transition-colors"
          >
            <span className="text-sm">←</span>
            <span>Back to Leads</span>
          </button>
          <span className="font-bold text-slate-805 dark:text-white text-base">Lead Activity Operations</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-full">
          
          {/* Left Column: Lead Brief Details & Note Form */}
          <div className="space-y-6">
            {/* Lead Brief Detail Cards */}
            <div className="p-4 bg-slate-55 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-850 dark:text-white m-0">{activeLead.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-550 dark:text-slate-400">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block font-bold">Contact</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeLead.contactPerson}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">Location</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeLead.location || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">Practitioners</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeLead.practitioners || 1} staff seats</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">Est Value</span>
                  <span className="text-[#8C4BFF] font-extrabold">${activeLead.value}/mo</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">Initial Prospect Notes</span>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 mb-0 italic">{activeLead.notes || 'No custom notes provided.'}</p>
              </div>
            </div>

            {/* Note Appending Form */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold block">Append Internal Note</span>
              <Input.TextArea
                placeholder="Log prospect priorities, trial feedback..."
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                rows={3}
                className="rounded-xl dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              />
              <Button 
                type="primary" 
                onClick={handleAddNoteSubmit} 
                className="rounded-xl font-bold text-xs h-9 bg-slate-900 border-none w-full dark:bg-slate-950 text-white"
              >
                + Save Note Log
              </Button>
            </div>
          </div>

          {/* Right Column: Operations Console & Timeline */}
          <div className="space-y-6">
            {/* Stage Modifier and Quick Scheduling Actions */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-755 dark:text-white text-xs uppercase tracking-wider">Operations Console</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  icon={<PhoneOutlined />} 
                  onClick={() => handleLogActivity('call')} 
                  className="rounded-xl text-xs font-bold dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
                >
                  Log Call
                </Button>
                <Button 
                  icon={<MailOutlined />} 
                  onClick={() => handleLogActivity('email')} 
                  className="rounded-xl text-xs font-bold dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
                >
                  Log Email
                </Button>
                <Button 
                  icon={<CalendarOutlined />} 
                  onClick={() => {
                    modalContext.setDemoModalOpen(true)
                  }}
                  className="rounded-xl text-xs font-bold bg-[#8C4BFF] text-white border-none"
                >
                  Book Demo
                </Button>
                <Button 
                  icon={<ClockCircleOutlined />} 
                  onClick={() => {
                    modalContext.setSelectedLeadId(activeLead.id)
                    modalContext.setTaskModalOpen(true)
                  }}
                  className="rounded-xl text-xs font-bold dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
                >
                  Create Task
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Transition Funnel Stage</span>
                <Select
                  value={activeLead.stage}
                  onChange={handleStageChange}
                  className="w-full rounded-xl dark:bg-slate-950 dark:border-slate-805"
                >
                  <Option value="New Lead">New Lead</Option>
                  <Option value="Discovery Call">Discovery Call</Option>
                  <Option value="Demo Scheduled">Demo Scheduled</Option>
                  <Option value="Proposal Sent">Proposal Sent</Option>
                  <Option value="Negotiating">Negotiating</Option>
                  <Option value="Trial Started">Trial Started</Option>
                  <Option value="Converted">Convert & Launch Clinic 🚀</Option>
                </Select>
              </div>
            </div>

            {/* Activity History Timeline */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-750 dark:text-white text-xs uppercase tracking-wider">Activity History log</h4>
              <div className="max-h-36 overflow-y-auto pr-2 scrollbar-thin">
                <Timeline className="mt-2 dark:text-slate-300">
                  {(activeLead.history || []).map((h, idx) => (
                    <Timeline.Item key={idx} color="gray">
                      <span className="text-slate-600 dark:text-slate-350 text-xs block">{h.text}</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">{h.time}</span>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Filter Controls */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="shrink-0">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">Sales Leads Directory</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Filter by sales funnel status or search for specific allied health practices.
            </p>
          </div>

          {/* Search Bar in Middle */}
          <div className="flex-1 max-w-md w-full md:mx-4">
            <Input
              placeholder="Search clinic or contact person..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined className="text-slate-400 mr-1" />}
              className="w-full rounded-xl h-9 dark:bg-slate-950 dark:border-slate-800"
            />
          </div>

          {/* Filters and Action Button on Right Corner */}
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full md:w-auto shrink-0">
            <Select
              value={selectedStage}
              onChange={setSelectedStage}
              className="min-w-36 rounded-xl h-9"
            >
              <Option value="All">All Funnel Stages</Option>
              <Option value="New Lead">New Lead</Option>
              <Option value="Discovery Call">Discovery Call</Option>
              <Option value="Demo Scheduled">Demo Scheduled</Option>
              <Option value="Proposal Sent">Proposal Sent</Option>
              <Option value="Negotiating">Negotiating</Option>
              <Option value="Trial Started">Trial Started</Option>
              <Option value="Converted">Converted</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => modalContext.setLeadModalOpen(true)}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-xl font-bold text-xs h-9 px-4 text-white"
            >
               Register Lead
            </Button>
          </div>
        </div>
      </Card>

      {/* Directory Log Table */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <Table
          dataSource={filteredLeads}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          className="border-none"
          onRow={(record) => ({
            onClick: () => setSelectedLead(record),
            className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors'
          })}
          columns={[
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinic Lead</span>,
              dataIndex: 'name',
              render: (name) => <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">{name}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>,
              dataIndex: 'contactPerson',
              render: (cp, rec) => (
                <div>
                  <span className="text-slate-700 dark:text-slate-350 text-xs font-semibold block">{cp}</span>
                  <span className="text-[10px] text-slate-450 block mt-0.5">{rec.email}</span>
                </div>
              )
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>,
              dataIndex: 'contact',
              render: (c) => <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">{c}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>,
              dataIndex: 'location',
              render: (l) => <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{l || '—'}</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Contract Value</span>,
              dataIndex: 'value',
              render: (v) => <span className="font-extrabold text-[#8C4BFF] text-xs">${v}/mo</span>
            },
            {
              title: <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funnel Stage</span>,
              dataIndex: 'stage',
              render: (s) => (
                <Tag color={getStageColor(s)} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                  {s}
                </Tag>
              )
            }
          ]}
        />
      </Card>

    </div>
  )
}
