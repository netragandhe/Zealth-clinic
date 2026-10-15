import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, Avatar, Tag } from 'antd'
import { SendOutlined, UserOutlined, TeamOutlined, CustomerServiceOutlined, CrownOutlined, ApartmentOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

export default function SalesMessages({ store: propStore }) {
  const localStore = useClinicStore()
  const store = propStore || localStore
  const { salesMessages, clinics, leads } = store
  
  const [activeChannel, setActiveChannel] = useState('Head Admin')
  const [textInput, setTextInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (store.fetchSalesMessages) store.fetchSalesMessages()
    if (store.fetchSalesClinics) store.fetchSalesClinics()
    if (store.fetchLeads) store.fetchLeads()
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
    return store.userRole === 'head_admin' ? 'Head Admin' : 'Sales Executive'
  }

  const currentRepName = getLoggedInSalesName() || 'Sales Executive'
  const isHeadAdmin = store.userRole === 'head_admin' || store.user?.role === 'super_admin'

  const isMatchingRep = (salespersonField) => {
    if (isHeadAdmin) return true // Super Admin sees multi-tenant options
    if (!salespersonField) return true
    if (!currentRepName) return true
    const sp = salespersonField.toLowerCase().trim()
    const cur = currentRepName.toLowerCase().trim()
    return sp.includes(cur) || cur.includes(sp) || sp === 'unassigned' || sp === 'sales executive'
  }

  // Base System Channels
  const baseChannels = [
    { name: 'Head Admin', role: 'Platform Owner', icon: <CrownOutlined />, color: '#8C4BFF', badge: 'Admin' },
    { name: 'Support Team', role: 'Technical Desk', icon: <CustomerServiceOutlined />, color: '#3B82F6', badge: 'Desk' },
    { name: 'Sales Reps Group', role: 'Colleague Forum', icon: <TeamOutlined />, color: '#10B981', badge: 'Team' }
  ]

  // Extract ONLY real Sales Representatives for Super Admin 1-on-1 chat channels
  const salesRepNamesFromStore = new Set()
  ;(leads || []).forEach(l => {
    if (l.assignedTo && l.assignedTo !== 'Head Admin' && l.assignedTo !== 'Unassigned') salesRepNamesFromStore.add(l.assignedTo)
    if (l.salesperson && l.salesperson !== 'Head Admin' && l.salesperson !== 'Unassigned') salesRepNamesFromStore.add(l.salesperson)
  })
  ;(clinics || []).forEach(c => {
    if (c.salesperson && c.salesperson !== 'Head Admin' && c.salesperson !== 'Unassigned') salesRepNamesFromStore.add(c.salesperson)
  })
  ;(salesMessages || []).forEach(m => {
    if (m.recipient === 'Head Admin' && m.sender && m.sender !== 'Head Admin' && m.sender !== 'Support Team') {
      salesRepNamesFromStore.add(m.sender)
    }
  })

  const salesRepChannels = isHeadAdmin ? Array.from(salesRepNamesFromStore).map(repName => ({
    name: repName,
    role: 'Sales Representative',
    icon: <UserOutlined />,
    color: '#EC4899',
    badge: 'Sales Rep'
  })) : []

  // Multi-tenant Converted Clinic channels
  const repClinics = (clinics || []).filter(c => isMatchingRep(c.salesperson))
  const clinicChannels = repClinics.slice(0, 5).map(c => ({
    name: c.name,
    role: `Converted Clinic (${c.tier || 'Basic'})`,
    icon: <ApartmentOutlined />,
    color: '#06B6D4',
    badge: 'Clinic'
  }))

  // Multi-tenant Prospect Lead channels
  const repLeads = (leads || []).filter(l => isMatchingRep(l.assignedTo || l.salesperson))
  const leadChannels = repLeads.slice(0, 5).map(l => ({
    name: l.companyName || l.name,
    role: `Prospect Lead (${l.stage || 'New'})`,
    icon: <UserOutlined />,
    color: '#F59E0B',
    badge: 'Lead'
  }))

  // Combine channels avoiding duplicates
  const channelMap = new Map()
  ;[...baseChannels, ...salesRepChannels, ...clinicChannels, ...leadChannels].forEach(ch => {
    if (!channelMap.has(ch.name)) {
      channelMap.set(ch.name, ch)
    }
  })
  const channels = Array.from(channelMap.values())

  const isMyMessage = (msg) => {
    if (!msg.sender) return false
    const sLower = msg.sender.toLowerCase().trim()
    if (isHeadAdmin) {
      return sLower === 'head admin' || sLower.includes('head admin') || sLower.includes('super admin') || sLower === currentRepName.toLowerCase().trim()
    }
    const cLower = currentRepName.toLowerCase().trim()
    return sLower === cLower || sLower === 'sales executive' || sLower.includes(cLower) || cLower.includes(sLower)
  }

  // Strict 1-on-1 & Channel Message Filter (fixes intercepting private messages bug)
  const isMessageInChannel = (m, channelName) => {
    const sLower = (m.sender || '').toLowerCase().trim()
    const rLower = (m.recipient || '').toLowerCase().trim()
    const cLower = channelName.toLowerCase().trim()

    if (cLower === 'sales reps group') {
      return rLower === 'sales reps group' || sLower === 'sales reps group'
    }
    if (cLower === 'head admin') {
      return rLower === 'head admin' || sLower === 'head admin'
    }
    if (cLower === 'support team') {
      return rLower === 'support team' || sLower === 'support team'
    }

    // For 1-on-1 chats with a specific Sales Rep or Clinic/Lead
    if (isHeadAdmin) {
      // Super Admin viewing a specific Sales Rep or Clinic thread
      return (sLower === cLower && rLower === 'head admin') || (sLower === 'head admin' && rLower === cLower)
    } else {
      // Sales Exec viewing a specific Clinic/Lead thread
      const myNameLower = currentRepName.toLowerCase().trim()
      return (sLower === cLower && (rLower === myNameLower || rLower === 'sales executive')) ||
             (rLower === cLower && (sLower === myNameLower || sLower === 'sales executive'))
    }
  }

  const filteredMessages = (salesMessages || []).filter(m => isMessageInChannel(m, activeChannel))

  // Helper to get last message snippet for a channel
  const getLastMessage = (channelName) => {
    const msgs = (salesMessages || []).filter(m => isMessageInChannel(m, channelName))
    if (msgs.length === 0) return 'No messages yet'
    return msgs[msgs.length - 1].text
  }

  const handleSendMessage = async () => {
    if (!textInput.trim()) return
    const text = textInput.trim()
    setTextInput('')

    try {
      if (store.addSalesMessage) {
        await store.addSalesMessage({
          sender: isHeadAdmin ? 'Head Admin' : currentRepName,
          recipient: activeChannel,
          text: text
        })
      }
      toast.success('Message sent!')
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message')
    }
  }

  // Auto-scroll to bottom on activeChannel change or new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filteredMessages, activeChannel])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row" style={{ height: '580px' }}>
      
      {/* Sidebar Channels List */}
      <div className="w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider m-0">Conversations</h3>
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            {isHeadAdmin ? 'Super Admin Mode' : 'Live DB'}
          </span>
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {channels.map(ch => {
            const isActive = activeChannel === ch.name
            const lastMsg = getLastMessage(ch.name)
            return (
              <div
                key={ch.name}
                onClick={() => setActiveChannel(ch.name)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                  isActive 
                    ? 'bg-purple-500/10 text-[#8C4BFF] border border-purple-200/30' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-350 border border-transparent'
                }`}
              >
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 text-white shadow-sm"
                  style={{ backgroundColor: ch.color }}
                >
                  {ch.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs truncate block">{ch.name}</span>
                    {ch.badge && (
                      <Tag color={ch.badge === 'Admin' ? 'purple' : ch.badge === 'Desk' ? 'blue' : ch.badge === 'Sales Rep' ? 'pink' : ch.badge === 'Clinic' ? 'cyan' : ch.badge === 'Lead' ? 'orange' : 'green'} className="rounded-full border-none font-bold text-[8px] px-2 py-0 m-0">
                        {ch.badge}
                      </Tag>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
                    {lastMsg}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="flex-grow flex flex-col h-full bg-slate-50/40 dark:bg-slate-950/30">
        
        {/* Active Channel Header */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white"
              style={{ backgroundColor: channels.find(c => c.name === activeChannel)?.color || '#8C4BFF' }}
            >
              {channels.find(c => c.name === activeChannel)?.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-xs m-0">{activeChannel}</h3>
              <span className="text-[9px] text-slate-400 font-semibold">
                {channels.find(c => c.name === activeChannel)?.role || 'Direct Workspace Connection'} &bull; Real-Time Database Sync
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Message Logs */}
        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-3.5">
          {filteredMessages.map((msg, index) => {
            const isMe = isMyMessage(msg)
            return (
              <div 
                key={msg.id || `msg_${index}`} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-xs font-semibold ${
                  isMe 
                    ? 'bg-[#8C4BFF] text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                }`}>
                  {!isMe && (
                    <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase tracking-wide">
                      {msg.sender || activeChannel}
                    </span>
                  )}
                  <p className="m-0 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[8px] text-right block mt-1.5 ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                    {msg.timestamp || 'Just now'}
                  </span>
                </div>
              </div>
            )
          })}
          {filteredMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold py-12">
              <span className="text-2xl mb-2">💬</span>
              <span>No messages in {activeChannel} yet. Send a message to start!</span>
            </div>
          )}
        </div>

        {/* Input Box footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <Input 
            placeholder={`Send message to ${activeChannel}...`}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onPressEnter={handleSendMessage}
            className="rounded-xl h-10 border-slate-200 dark:border-slate-850 dark:bg-slate-950 flex-grow text-xs"
          />
          <Button 
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl h-10 px-5 flex items-center justify-center shrink-0 text-white font-bold"
          >
            Send
          </Button>
        </div>

      </div>

    </div>
  )
}
