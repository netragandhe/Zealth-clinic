import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useClinicStore } from '../store/clinicStore'
import { API_BASE_URL } from '../api/axios'
import { toast } from 'react-hot-toast'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const store = useClinicStore()

  useEffect(() => {
    const SOCKET_URL = API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5001' : window.location.origin)

    console.log(`🔌 Initializing WebSocket connection to ${SOCKET_URL}...`)

    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('⚡ Connected to WebSocket server:', newSocket.id)
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server')
      setConnected(false)
    })

    // Listen to real-time Lead events
    newSocket.on('lead:created', (data) => {
      console.log('📡 Real-time event: lead:created', data)
      if (store.fetchLeads) store.fetchLeads()
      toast.success(`⚡ Real-time: New lead registered (${data?.name || 'Lead'})`, { id: `rt_lead_${data?.id}` })
    })

    newSocket.on('lead:stage_moved', (data) => {
      console.log('📡 Real-time event: lead:stage_moved', data)
      if (store.fetchLeads) store.fetchLeads()
      toast.success(`⚡ Real-time: Lead "${data?.name}" moved to ${data?.stage}`, { id: `rt_stage_${data?.id}` })
    })

    newSocket.on('lead:updated', () => {
      if (store.fetchLeads) store.fetchLeads()
    })

    newSocket.on('lead:deleted', () => {
      if (store.fetchLeads) store.fetchLeads()
    })

    newSocket.on('lead:converted', (data) => {
      console.log('📡 Real-time event: lead:converted', data)
      if (store.fetchLeads) store.fetchLeads()
      if (store.fetchSalesClinics) store.fetchSalesClinics()
      toast.success(`🎉 Real-time: Clinic "${data?.clinic?.name}" converted & launched!`, { id: `rt_conv_${data?.clinic?.id}` })
    })

    // Listen to real-time Sales Tasks events
    newSocket.on('task:created', () => {
      if (store.fetchSalesTasks) store.fetchSalesTasks()
    })

    newSocket.on('task:updated', () => {
      if (store.fetchSalesTasks) store.fetchSalesTasks()
    })

    newSocket.on('task:deleted', () => {
      if (store.fetchSalesTasks) store.fetchSalesTasks()
    })

    // Listen to Calendar & Messages
    newSocket.on('calendar_event:created', () => {
      if (store.fetchSalesCalendarEvents) store.fetchSalesCalendarEvents()
    })

    newSocket.on('calendar_event:updated', () => {
      if (store.fetchSalesCalendarEvents) store.fetchSalesCalendarEvents()
    })

    newSocket.on('message:sent', (data) => {
      console.log('📡 Real-time event: message:sent', data)
      if (store.fetchSalesMessages) store.fetchSalesMessages()
      
      if (data) {
        const textSnippet = data.text ? (data.text.length > 35 ? data.text.substring(0, 35) + '...' : data.text) : ''
        toast.success(`💬 Message from ${data.sender || 'Workspace User'}: "${textSnippet}"`, {
          id: `rt_msg_${data.id || Date.now()}`,
          duration: 4000
        })
      }
      window.dispatchEvent(new CustomEvent('notification:refetch'))
    })

    // Listen to real-time Notifications
    newSocket.on('notification:new', (data) => {
      console.log('📡 Real-time event: notification:new', data)
      toast.success(`🔔 Notification: ${data?.title || 'New Alert'}`, { id: `rt_notif_${data?.id}` })
      window.dispatchEvent(new CustomEvent('notification:refetch'))
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
