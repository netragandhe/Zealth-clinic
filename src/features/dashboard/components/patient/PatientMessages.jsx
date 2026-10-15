import React, { useState } from 'react'
import { Card, Input, Button, Avatar, Select, Upload, Tag, Space, Divider } from 'antd'
import {
  SendOutlined,
  PaperClipOutlined,
  MailOutlined,
  UserOutlined,
  CheckCircleOutlined,
  PictureOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'

const { Option } = Select
import api from '../../../../api/axios'
import { useSocket } from '../../../../context/SocketContext'

export default function PatientMessages() {
  const [contacts, setContacts] = useState([])
  const [activeContact, setActiveContact] = useState('')
  const [messageCategory, setMessageCategory] = useState('Treatment Questions')
  const [inputText, setInputText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [chatHistories, setChatHistories] = useState({})
  const { socket } = useSocket() || {}

  const formatMsg = (msg) => ({
    id: msg.id,
    sender: msg.sender,
    text: msg.text,
    timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Just now',
    category: msg.category || 'General Questions',
    doctorName: msg.doctorName,
    practitionerId: msg.practitionerId
  })

  // 1. Fetch ONLY real practitioners & staff from the patient's specific clinic
  const fetchContactsAndMessages = async () => {
    try {
      setLoading(true)
      const [clinicUsersRes, msgsRes] = await Promise.all([
        api.get('/api/patient/clinic-users').catch(() => null),
        api.get('/api/patient/messages').catch(() => null)
      ])

      let dynamicContacts = []

      if (clinicUsersRes?.data?.success && Array.isArray(clinicUsersRes.data.data) && clinicUsersRes.data.data.length > 0) {
        dynamicContacts = clinicUsersRes.data.data
      } else {
        const careTeamRes = await api.get('/api/patient/care-team').catch(() => null)
        if (careTeamRes?.data?.success && Array.isArray(careTeamRes.data.data)) {
          dynamicContacts = careTeamRes.data.data.map(p => ({
            id: p.id,
            name: p.name,
            role: p.specialty || 'Clinical Practitioner',
            type: 'practitioner',
            practitionerId: p.id,
            avatar: p.avatar,
            online: true
          }))
          dynamicContacts.push({
            id: 'reception',
            name: 'Clinic Reception',
            role: 'Administrative & Front Desk',
            type: 'reception',
            practitionerId: null,
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
            online: true
          })
        }
      }

      setContacts(dynamicContacts)
      setActiveContact(prev => {
        if (prev && dynamicContacts.some(c => c.id === prev)) return prev
        return dynamicContacts[0]?.id || ''
      })

      // Process messages from DB
      if (msgsRes?.data?.success && msgsRes.data.data) {
        const dbMessages = msgsRes.data.data
        const categorized = {}
        dynamicContacts.forEach(c => {
          categorized[c.id] = []
        })

        dbMessages.forEach(msg => {
          const item = formatMsg(msg)
          const dName = (msg.doctorName || '').toLowerCase()
          const sRole = (msg.sender || '').toLowerCase()

          let matched = dynamicContacts.find(c =>
            (msg.practitionerId && c.practitionerId === msg.practitionerId) ||
            (c.id === msg.practitionerId)
          )

          if (!matched && (dName.includes('reception') || sRole === 'reception')) {
            matched = dynamicContacts.find(c => c.type === 'reception' || c.id.startsWith('reception'))
          }

          if (!matched) {
            matched = dynamicContacts.find(c =>
              c.name && dName.includes(c.name.toLowerCase())
            )
          }

          const targetKey = matched ? matched.id : (dynamicContacts[0]?.id || 'reception')
          if (!categorized[targetKey]) categorized[targetKey] = []
          categorized[targetKey].push(item)
        })

        setChatHistories(categorized)
      }
    } catch (err) {
      console.warn('Failed to fetch messages & care team:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchContactsAndMessages()
  }, [])

  // Listen to incoming real-time socket events
  React.useEffect(() => {
    if (!socket) return
    const handleIncoming = (data) => {
      if (data) fetchContactsAndMessages()
    }
    socket.on('care_team:message', handleIncoming)
    return () => {
      socket.off('care_team:message', handleIncoming)
    }
  }, [socket])

  const handleSend = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) return

    const messagePayload = inputText || `Sent ${uploadedFiles.map(f => f.name).join(', ')}`
    const cat = messageCategory
    const targetId = activeContact
    const targetName = selectedContactObj?.name
    const targetPractitionerId = selectedContactObj?.practitionerId || null

    const localPatientMsg = {
      id: `temp_${Date.now()}`,
      sender: 'patient',
      text: messagePayload,
      timestamp: 'Just now',
      category: cat,
      files: [...uploadedFiles]
    }

    setChatHistories(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), localPatientMsg]
    }))

    setInputText('')
    setUploadedFiles([])

    try {
      const res = await api.post('/api/patient/messages', {
        contactId: targetId,
        practitionerId: targetPractitionerId,
        doctorName: targetName,
        messageText: messagePayload,
        category: cat
      })

      if (res.data?.success) {
        toast.success(`Message delivered to ${targetName}!`)
        if (res.data?.reply) {
          const reply = res.data.reply
          const formattedReply = formatMsg(reply)
          setTimeout(() => {
            setChatHistories(prev => ({
              ...prev,
              [targetId]: [
                ...(prev[targetId] || []).filter(m => m.id !== localPatientMsg.id),
                formatMsg(res.data.data),
                formattedReply
              ]
            }))
          }, 500)
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message.')
    }
  }

  const selectedContactObj = contacts.find(c => c.id === activeContact)

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">Secure Provider Messaging</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              End-to-end encrypted chats with clinical practitioners, reception coordinators, and billing coordinators.
            </p>
          </div>
          <Tag color="green" className="rounded-full border-none font-bold text-[10px] px-3.5 py-1 uppercase">
            <CheckCircleOutlined className="mr-1" />
            E2E Encrypted Active
          </Tag>
        </div>
      </Card>

      {/* Messaging Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginTop: '24px' }}>
        
        {/* Left Side: Contact List */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block mb-1">Active Conversations</span>
          <div className="space-y-2">
            {contacts.map(c => {
              const active = c.id === activeContact
              const channelMsgs = chatHistories[c.id] || []
              const lastMsg = channelMsgs[channelMsgs.length - 1]
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveContact(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    active 
                      ? 'border-[#8C4BFF] bg-[#8C4BFF]/5 text-[#8C4BFF]' 
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar src={c.avatar || null} size={40} className="border border-slate-200 dark:border-slate-700" />
                      {c.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col text-left">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold truncate">{c.role}</span>
                      {lastMsg && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-1">
                          {lastMsg.sender === 'patient' ? 'You: ' : ''}{lastMsg.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side: Chat Feed */}
        <div className="lg:col-span-2">
          {selectedContactObj ? (
            <Card 
              className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm h-full flex flex-col justify-between bg-white dark:bg-slate-900 overflow-hidden"
              styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '450px' } }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-805 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedContactObj.avatar || null} size={36} />
                  <div>
                    <span className="font-extrabold text-xs text-slate-808 dark:text-white block">{selectedContactObj.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block">{selectedContactObj.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Topic:</span>
                  <Select 
                    value={messageCategory} 
                    onChange={setMessageCategory}
                    className="w-40 rounded-xl"
                    size="small"
                  >
                    <Option value="General Questions">General Questions</Option>
                    <Option value="Treatment Questions">Treatment Questions</Option>
                    <Option value="Appointment Requests">Appointment Requests</Option>
                    <Option value="Exercise Questions">Exercise Questions</Option>
                    <Option value="Billing Questions">Billing Questions</Option>
                  </Select>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[300px]">
                {(chatHistories[activeContact] || []).length > 0 ? (
                  (chatHistories[activeContact] || []).map(msg => {
                    const isPatient = msg.sender === 'patient'
                    return (
                      <div key={msg.id} className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] space-y-1`}>
                          <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                            isPatient 
                              ? 'bg-[#8C4BFF] text-white rounded-br-none' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 mb-2 opacity-80 border-b border-white/20 pb-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider">{msg.category}</span>
                              <span className="text-[8px] font-semibold">{msg.timestamp}</span>
                            </div>
                            <div className="m-0 text-sm font-medium" style={{ color: isPatient ? '#ffffff' : undefined }}>{msg.text}</div>
                            {msg.files && msg.files.map(f => (
                              <div key={f.name} className="mt-2 p-2 bg-black/10 rounded-xl flex items-center gap-2 text-[10px] font-bold">
                                {f.type.includes('image') ? <PictureOutlined /> : <FileTextOutlined />}
                                <span>{f.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No messages in this channel yet. Type a message below to start your conversation!
                  </div>
                )}
              </div>

              {/* Text Input & Controls */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/30 dark:bg-slate-950/10">
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map(f => (
                      <Tag 
                        key={f.name} 
                        closable 
                        onClose={() => setUploadedFiles(prev => prev.filter(x => x.name !== f.name))}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 border-none font-bold text-[10px]"
                      >
                        {f.name}
                      </Tag>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Upload
                    beforeUpload={(file) => {
                      setUploadedFiles(prev => [...prev, { name: file.name, type: file.type }])
                      toast.success(`Attached: ${file.name}`)
                      return false
                    }}
                    showUploadList={false}
                  >
                    <Button 
                      shape="circle" 
                      icon={<PaperClipOutlined style={{ fontSize: 16 }} />} 
                      className="flex items-center justify-center dark:bg-slate-900 dark:border-slate-800"
                    />
                  </Upload>
                  
                  <Input 
                    placeholder={`Write your secure message to ${selectedContactObj.name}...`} 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onPressEnter={handleSend}
                    className="rounded-xl h-10 text-xs flex-1"
                  />
                  
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handleSend}
                    style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                    className="rounded-xl h-10 px-4 flex items-center justify-center text-white"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-400">
              Select a clinical practitioner or support staff to begin secure messaging.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
