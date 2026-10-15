import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Avatar, Badge, Tag, Tooltip, Spin, Upload } from 'antd'
import {
  SendOutlined,
  PaperClipOutlined,
  SearchOutlined,
  CheckOutlined,
  CheckCircleFilled,
  MessageFilled,
  ThunderboltFilled,
  SmileOutlined,
  PictureOutlined,
  FileTextOutlined,
  CloseCircleFilled,
  SyncOutlined,
  UndoOutlined,
  RollbackOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  StopOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../api/axios'
import { useSocket } from '../../../context/SocketContext'

export default function UniversalLiveChat({ isDrawer = false, defaultContactId = null }) {
  const [contacts, setContacts] = useState([])
  const [activeContact, setActiveContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState('')
  const [attachments, setAttachments] = useState([])
  const [pendingSend, setPendingSend] = useState(null) // { id, text, attachments, targetContact, secondsLeft }

  const { socket } = useSocket() || {}
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const pendingTimerRef = useRef(null)
  const pendingCountdownRef = useRef(null)

  const currentUserId = localStorage.getItem('userId') || ''
  const currentUserRole = (localStorage.getItem('userRole') || '').toUpperCase()

  // 1. Fetch available contacts for current logged in user & role
  const fetchContacts = async (isInitial = false) => {
    try {
      if (isInitial) setLoadingContacts(true)
      const res = await api.get('/api/chat/contacts')
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list = res.data.data
        setContacts(list)

        // Join all conversation rooms via socket
        if (socket && list.length > 0) {
          list.forEach(c => {
            if (c.conversationId) socket.emit('chat:join', c.conversationId)
          })
          if (currentUserId) socket.emit('join:room', `room:user_${currentUserId}`)
        }

        // Select initial contact if none selected
        setActiveContact(prev => {
          if (prev) {
            const updated = list.find(c => c.targetId === prev.targetId || c.id === prev.id)
            return updated || prev
          }
          if (list.length > 0) {
            const matchDefault = defaultContactId ? list.find(c => c.id === defaultContactId || c.targetId === defaultContactId) : null
            return matchDefault || list[0]
          }
          return null
        })
      }
    } catch (err) {
      console.warn('Live chat contacts fetch notice:', err?.message)
    } finally {
      if (isInitial) setLoadingContacts(false)
    }
  }

  useEffect(() => {
    fetchContacts(true)
  }, [defaultContactId])

  // 2. Fetch conversation messages when activeContact changes
  const fetchMessages = async (convId, isInitial = false) => {
    if (!convId) return
    try {
      if (isInitial) setLoadingMessages(true)
      const res = await api.get(`/api/chat/messages/${convId}`)
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Deduplicate messages by unique id
        const unique = []
        const seen = new Set()
        for (const item of res.data.data) {
          if (item?.id && !seen.has(item.id)) {
            seen.add(item.id)
            unique.push(item)
          }
        }
        setMessages(unique)
        // Mark as read in DB
        api.put(`/api/chat/read/${convId}`).catch(() => null)
        // Update contact unread count locally
        setContacts(prev => prev.map(c => c.conversationId === convId ? { ...c, unreadCount: 0 } : c))
      }
    } catch (err) {
      console.warn('Live chat messages fetch notice:', err?.message)
    } finally {
      if (isInitial) setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (activeContact?.conversationId) {
      fetchMessages(activeContact.conversationId, true)
      // Join WebSocket chat room
      if (socket) {
        socket.emit('chat:join', activeContact.conversationId)
        if (currentUserId) socket.emit('join:room', `room:user_${currentUserId}`)
      }
    }

    return () => {
      if (socket && activeContact?.conversationId) {
        socket.emit('chat:leave', activeContact.conversationId)
      }
    }
  }, [activeContact?.conversationId])

  // 3. Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // 4. WebSocket Real-time Event Listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (msg) => {
      if (!msg) return
      
      const isCurrentActive = activeContact && (
        activeContact.conversationId === msg.conversationId ||
        msg.senderId === activeContact.targetId ||
        (msg.recipientId === activeContact.targetId && msg.senderId === currentUserId)
      )

      if (isCurrentActive) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) {
            return prev
          }
          return [...prev, msg]
        })
        // Mark as read immediately if current chat is open
        if (msg.senderId !== currentUserId && msg.conversationId) {
          api.put(`/api/chat/read/${msg.conversationId}`).catch(() => null)
        }
      }

      // Update last message in contact list
      setContacts(prev => prev.map(c => {
        const isThisContact = c.conversationId === msg.conversationId ||
          c.targetId === msg.senderId ||
          (c.targetId === msg.recipientId && msg.senderId === currentUserId)

        if (isThisContact) {
          return {
            ...c,
            lastMessage: {
              text: msg.text,
              time: msg.time || 'Just now',
              senderName: msg.senderName,
              isSelf: msg.senderId === currentUserId
            },
            unreadCount: (activeContact?.conversationId === msg.conversationId || msg.senderId === currentUserId)
              ? 0
              : (c.unreadCount || 0) + 1
          }
        }
        return c
      }))
    }

    const handleTyping = (data) => {
      if (data?.conversationId === activeContact?.conversationId && data?.userId !== currentUserId) {
        setIsTyping(true)
        setTypingUser(data.userName || 'Someone')
      }
    }

    const handleStopTyping = (data) => {
      if (data?.conversationId === activeContact?.conversationId) {
        setIsTyping(false)
      }
    }

    const handleRecalledMessage = (data) => {
      if (!data?.messageId) return
      setMessages(prev => prev.filter(m => m.id !== data.messageId))
      
      // Update contact list preview if needed
      setContacts(prev => prev.map(c => {
        if (c.conversationId === data.conversationId) {
          return {
            ...c,
            lastMessage: c.lastMessage?.id === data.messageId ? null : c.lastMessage
          }
        }
        return c
      }))
      
      if (data.recalledBy !== currentUserId) {
        toast('A message was recalled by sender.', { icon: '↩️' })
      }
    }

    socket.on('chat:message', handleNewMessage)
    socket.on('chat:incoming', handleNewMessage)
    socket.on('chat:recalled', handleRecalledMessage)
    socket.on('chat:typing', handleTyping)
    socket.on('chat:stop_typing', handleStopTyping)

    return () => {
      socket.off('chat:message', handleNewMessage)
      socket.off('chat:incoming', handleNewMessage)
      socket.off('chat:recalled', handleRecalledMessage)
      socket.off('chat:typing', handleTyping)
      socket.off('chat:stop_typing', handleStopTyping)
    }
  }, [socket, activeContact?.conversationId, activeContact?.targetId, currentUserId])

  // Clean up pending timer on unmount
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      if (pendingCountdownRef.current) clearInterval(pendingCountdownRef.current)
    }
  }, [])

  // Handle typing indicator emissions
  const handleInputChange = (e) => {
    const val = e.target.value
    setInputText(val)

    if (socket && activeContact?.conversationId) {
      socket.emit('chat:typing', {
        conversationId: activeContact.conversationId,
        userId: currentUserId,
        userName: localStorage.getItem('userName') || 'User'
      })

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:stop_typing', {
          conversationId: activeContact.conversationId,
          userId: currentUserId
        })
      }, 1500)
    }
  }

  // Actual API dispatch function
  const executeActualSend = async (payload) => {
    const { text, attachments: currentAttachments, targetContact } = payload
    if (!targetContact?.conversationId) return

    const tempId = `temp_${Date.now()}`
    const tempMsg = {
      id: tempId,
      conversationId: targetContact.conversationId,
      senderId: currentUserId,
      senderName: localStorage.getItem('userName') || 'You',
      text,
      attachments: currentAttachments,
      isRead: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today'
    }

    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await api.post('/api/chat/messages', {
        conversationId: targetContact.conversationId,
        recipientId: targetContact.targetId,
        recipientName: targetContact.name,
        recipientRole: targetContact.roleCategory,
        text,
        attachments: currentAttachments
      })

      if (res.data?.success && res.data.data) {
        const savedMsg = res.data.data
        setMessages(prev => {
          if (prev.some(m => m.id === savedMsg.id)) {
            return prev.filter(m => m.id !== tempId)
          }
          return prev.map(m => m.id === tempId ? savedMsg : m)
        })
      }
    } catch (err) {
      console.error('Failed to send live chat message:', err)
      toast.error('Failed to deliver message.')
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  // Trigger immediate send if user doesn't want to wait
  const triggerImmediateSend = (item) => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
    if (pendingCountdownRef.current) clearInterval(pendingCountdownRef.current)
    setPendingSend(null)
    executeActualSend(item)
  }

  // Undo Send within cancellation window
  const handleUndoSend = () => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
    if (pendingCountdownRef.current) clearInterval(pendingCountdownRef.current)
    if (pendingSend) {
      setInputText(pendingSend.text)
      setAttachments(pendingSend.attachments || [])
      setPendingSend(null)
      toast.success('Message sending cancelled. Text restored.', { icon: '↩️' })
    }
  }

  // 5. Send message with 5s cancellation countdown window
  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return
    if (!activeContact) return

    // If already have a pending message, immediately send it before starting the next
    if (pendingSend) {
      triggerImmediateSend(pendingSend)
    }

    const textToSend = inputText.trim()
    const currentAttachments = [...attachments]

    setInputText('')
    setAttachments([])

    if (socket && activeContact?.conversationId) {
      socket.emit('chat:stop_typing', {
        conversationId: activeContact.conversationId,
        userId: currentUserId
      })
    }

    const newPendingItem = {
      id: `pending_${Date.now()}`,
      text: textToSend,
      attachments: currentAttachments,
      targetContact: activeContact,
      secondsLeft: 5
    }

    setPendingSend(newPendingItem)

    // Countdown interval
    pendingCountdownRef.current = setInterval(() => {
      setPendingSend(prev => {
        if (!prev) return null
        if (prev.secondsLeft <= 1) {
          clearInterval(pendingCountdownRef.current)
          return null
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 }
      })
    }, 1000)

    // Timer to trigger actual send after 5 seconds
    pendingTimerRef.current = setTimeout(() => {
      clearInterval(pendingCountdownRef.current)
      setPendingSend(null)
      executeActualSend(newPendingItem)
    }, 5000)
  }

  // Recall / Delete a message that has already been sent
  const handleRecallMessage = async (msgId) => {
    if (!msgId || msgId.startsWith('temp_')) return
    try {
      // Optimistic local update
      setMessages(prev => prev.filter(m => m.id !== msgId))

      const res = await api.post(`/api/chat/messages/${msgId}/recall`)
      if (res.data?.success) {
        toast.success('Message recalled for everyone.', { icon: '↩️' })
      }
    } catch (err) {
      console.error('Failed to recall message:', err)
      toast.error(err.response?.data?.message || 'Failed to recall message.')
      // Refresh messages to sync state
      if (activeContact?.conversationId) {
        fetchMessages(activeContact.conversationId)
      }
    }
  }

  const isSuperAdmin = ['HEAD_ADMIN', 'SUPER_ADMIN', 'SUPER-ADMIN'].includes(currentUserRole)

  // Filter contacts by search & role
  const filteredContacts = contacts.filter(c => {
    // Super Admin should strictly only see Clinic Admin and Sales Executive
    if (isSuperAdmin && c.roleCategory !== 'CLINIC_ADMIN' && c.roleCategory !== 'SALES_EXECUTIVE') {
      return false
    }
    const matchesSearch = !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.role?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || c.roleCategory === roleFilter
    return matchesSearch && matchesRole
  })

  // Dynamic role filter pills
  const roleFilterTabs = isSuperAdmin
    ? [
        { key: 'ALL', label: 'All Channels' },
        { key: 'CLINIC_ADMIN', label: 'Clinic Admin' },
        { key: 'SALES_EXECUTIVE', label: 'Sales Executive' }
      ]
    : [
        { key: 'ALL', label: 'All Channels' },
        ...Array.from(new Set(contacts.map(c => c.roleCategory).filter(Boolean))).map(role => ({
          key: role,
          label: role.replace('_', ' ')
        }))
      ]

  return (
    <div className={`w-full flex flex-col ${isDrawer ? 'h-[85vh]' : 'h-full'} rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl transition-all`}>
      
      {/* Top Banner */}
      <div className="px-6 py-3 bg-gradient-to-r from-[#0E1B33] via-[#1E293B] to-[#8C4BFF] flex items-center justify-between text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 font-bold">
            <ThunderboltFilled />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight">ZealthOS Real-Time Live Chat</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> WebSocket Live
              </span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Instant end-to-end encrypted direct messaging across care teams & clinics</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip title="Refresh Contacts">
            <Button
              type="text"
              size="small"
              icon={<SyncOutlined className={loadingContacts ? 'animate-spin' : ''} />}
              onClick={fetchContacts}
              className="text-white hover:bg-white/10 rounded-lg"
            />
          </Tooltip>
        </div>
      </div>

      {/* Main Chat Layout: 2 Columns */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Column: Contact Sidebar */}
        <div className="w-full md:w-80 lg:w-88 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0 min-h-0 h-full overflow-hidden">
          
          {/* Search & Filter Bar */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2 flex-shrink-0">
            <Input
              prefix={<SearchOutlined className="text-slate-400 mr-1" />}
              placeholder="Search people, doctors, staff..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="rounded-xl h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              allowClear
            />
            {/* Quick role filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {roleFilterTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRoleFilter(key)}
                  className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                    roleFilter === key
                      ? 'bg-[#8C4BFF] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60 min-h-0">
            {loadingContacts ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Spin size="small" />
                <span className="text-xs">Loading live channels...</span>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(c => {
                const isSelected = activeContact?.id === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveContact(c)}
                    className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#8C4BFF]/10 dark:bg-[#8C4BFF]/20 border-l-4 border-[#8C4BFF]'
                        : 'hover:bg-white dark:hover:bg-slate-900/80 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <Avatar src={c.avatar || null} size={42} className="border border-slate-200 dark:border-slate-700 shadow-sm" />
                        {c.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                          {c.lastMessage?.time && (
                            <span className="text-[9px] text-slate-400 font-medium flex-shrink-0">{c.lastMessage.time}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">{c.role}</span>
                          {c.clinicName && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium truncate">
                              {c.clinicName}
                            </span>
                          )}
                        </div>
                        {c.lastMessage && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-1 mb-0">
                            {c.lastMessage.isSelf ? 'You: ' : ''}{c.lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#8C4BFF] text-white text-[10px] font-black animate-pulse shadow-sm">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs font-medium px-4">
                No active conversations found matching your filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Feed */}
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 min-w-0 min-h-0 h-full overflow-hidden">
          {activeContact ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/20 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar src={activeContact.avatar || null} size={40} className="border border-slate-200 dark:border-slate-700" />
                    {activeContact.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{activeContact.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${activeContact.badgeColor || '#8C4BFF'}15`, color: activeContact.badgeColor || '#8C4BFF' }}>
                        {activeContact.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active in room • {activeContact.clinicName || 'ZealthOS Platform'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Feed Scroll Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/10 min-h-0">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
                    <Spin size="small" />
                    <span className="text-xs font-medium">Decrypting live messages...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m, idx) => {
                    const isSelf = m.senderId === currentUserId
                    const messageKey = m.id ? `${m.id}-${idx}` : `msg-${idx}`
                    return (
                      <div key={messageKey} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} transition-all`}>
                        <div className={`max-w-[78%] md:max-w-[65%] space-y-1`}>
                          {!isSelf && (
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1 block">
                              {m.senderName} • {m.senderRole}
                            </span>
                          )}
                          <div
                            className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm relative group/bubble ${
                              isSelf
                                ? 'bg-[#8C4BFF] text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/60 rounded-bl-none'
                            }`}
                          >
                            {/* Recall / Undo button for user's sent message */}
                            {isSelf && !m.id?.startsWith('temp_') && (
                              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-black/30 rounded-lg p-0.5 backdrop-blur-sm">
                                <Tooltip title="Recall / Undo message (Removes for everyone)">
                                  <button
                                    onClick={() => handleRecallMessage(m.id)}
                                    className="px-1.5 py-0.5 rounded text-[10px] text-white/90 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1 border-none bg-transparent cursor-pointer"
                                  >
                                    <RollbackOutlined style={{ fontSize: 10 }} />
                                    <span>Recall</span>
                                  </button>
                                </Tooltip>
                              </div>
                            )}

                            <p className="m-0 text-sm whitespace-pre-wrap font-normal" style={{ color: isSelf ? '#ffffff' : undefined }}>
                              {m.text}
                            </p>

                            {/* Attachments preview */}
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/20 dark:border-slate-700 flex flex-wrap gap-2">
                                {m.attachments.map((att, attIdx) => (
                                  <div key={att.name || att.url ? `${att.name || 'att'}-${attIdx}` : `att-${attIdx}`} className="px-2.5 py-1.5 rounded-xl bg-black/15 flex items-center gap-2 text-[10px] font-bold">
                                    {att.type?.includes('image') ? <PictureOutlined /> : <FileTextOutlined />}
                                    <span className="truncate max-w-[150px]">{att.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-[9px]">
                              <span>{m.time || 'Just now'}</span>
                              {isSelf && (
                                <CheckOutlined style={{ fontSize: 10 }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#8C4BFF]/10 text-[#8C4BFF] flex items-center justify-center text-xl font-bold">
                      <MessageFilled />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">No messages in this chat room yet</span>
                    <span className="text-[11px] text-slate-400">Send a note below to start the conversation!</span>
                  </div>
                )}

                {/* Real-time typing bubble */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium animate-pulse px-2">
                    <span className="w-2 h-2 rounded-full bg-[#8C4BFF] animate-bounce" />
                    <span>{typingUser} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex-shrink-0">
                {/* Active Undo Send Cancellation Window Bar */}
                {pendingSend && (
                  <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border border-amber-400/40 text-xs font-semibold shadow-sm mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ClockCircleOutlined className="text-amber-500 animate-spin text-sm" />
                      <span className="text-slate-700 dark:text-slate-200">
                        Sending in <strong className="text-amber-600 dark:text-amber-400 font-bold">{pendingSend.secondsLeft}s</strong>: 
                        <span className="italic text-slate-500 dark:text-slate-400 truncate ml-1">"{pendingSend.text.slice(0, 30)}{pendingSend.text.length > 30 ? '...' : ''}"</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="small"
                        danger
                        icon={<UndoOutlined />}
                        onClick={handleUndoSend}
                        className="font-bold text-xs rounded-lg shadow-sm"
                      >
                        Undo Send
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => triggerImmediateSend(pendingSend)}
                        style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                        className="font-bold text-xs rounded-lg"
                      >
                        Send Now
                      </Button>
                    </div>
                  </div>
                )}

                {/* Uploaded attachments preview pills */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map(f => (
                      <Tag
                        key={f.name}
                        closable
                        onClose={() => setAttachments(prev => prev.filter(x => x.name !== f.name))}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 border-none font-bold text-[10px] py-1 px-3"
                      >
                        {f.name}
                      </Tag>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Upload
                    beforeUpload={(file) => {
                      setAttachments(prev => [...prev, { name: file.name, type: file.type }])
                      toast.success(`Attached: ${file.name}`)
                      return false
                    }}
                    showUploadList={false}
                  >
                    <Button
                      shape="circle"
                      icon={<PaperClipOutlined style={{ fontSize: 16 }} />}
                      className="flex items-center justify-center dark:bg-slate-800 dark:border-slate-700"
                    />
                  </Upload>

                  <Input
                    placeholder={`Type your live message to ${activeContact.name}... (Press Enter to send)`}
                    value={inputText}
                    onChange={handleInputChange}
                    onPressEnter={handleSend}
                    className="rounded-xl h-11 text-xs flex-1 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                  />

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                    className="rounded-xl h-11 px-5 flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
              <div className="w-16 h-16 rounded-3xl bg-[#8C4BFF]/10 text-[#8C4BFF] flex items-center justify-center text-2xl">
                <MessageFilled />
              </div>
              <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">Select a channel to begin messaging</span>
              <span className="text-xs text-slate-400 max-w-sm text-center">
                Choose a colleague, doctor, patient, or administrative desk from the left sidebar to start live chatting.
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
