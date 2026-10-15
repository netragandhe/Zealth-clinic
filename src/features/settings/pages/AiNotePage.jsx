import React, { useState } from 'react'
import { Input, Button, DatePicker, Avatar, Card, List } from 'antd'
import {
  RobotOutlined,
  DeleteOutlined,
  SendOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '../../../store/clinicStore'
import api from '../../../api/axios'

export default function AiNotePage() {
  const navigate = useNavigate()
  const darkMode = useClinicStore((state) => state.darkMode)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [recentPrompts, setRecentPrompts] = useState([])

  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!inputValue.trim()) return
    const newMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: inputValue
    }
    setMessages(prev => [...prev, newMsg])
    setRecentPrompts(prev => [inputValue, ...prev])
    setInputValue('')
    setIsLoading(true)

    try {
      const { data } = await api.post('/api/ai/chat', { 
        prompt: newMsg.text,
        history: messages 
      })
      if (data.success) {
        const aiMsg = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: data.data.reply
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        toast.error(data.message || 'Failed to get AI response')
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Error communicating with AI server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setRecentPrompts([])
    toast.success('Chat history cleared')
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/clinic')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#8C4BFF] font-semibold text-xs border-none bg-transparent cursor-pointer transition-colors w-fit p-0"
      >
        <span className="text-sm">←</span>
        <span>Back to Dashboard</span>
      </button>

      {/* Main Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Chat Workspace (3/4 width) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[600px] overflow-hidden">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center text-violet-500">
                <RobotOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm m-0">Ask Your AI</h3>
                <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Zealth AI</span>
              </div>
            </div>
            
            <Button
              type="text"
              icon={<DeleteOutlined className="text-slate-400 hover:text-red-500" />}
              onClick={handleClear}
              className="flex items-center justify-center font-bold text-xs text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-9"
            >
              Clear
            </Button>
          </div>

          {/* Chat Bubble Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-center">
            {messages.length === 0 ? (
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center text-violet-500 mx-auto text-2xl animate-bounce">
                  <RobotOutlined />
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Hi Enrico!
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white leading-tight">
                  Where Should We Start?
                </h2>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col justify-start h-full overflow-y-auto">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                      msg.sender === 'user' ? 'bg-[#0E1B33] text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20' : 'bg-violet-100 text-violet-600'
                    }`}>
                      {msg.sender === 'user' ? 'U' : <RobotOutlined />}
                    </div>
                    <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#EFEEFF] text-[#5E17EB] dark:bg-violet-950/30 dark:text-violet-350 rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-tl-none border border-slate-100 dark:border-slate-805'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold bg-violet-100 text-violet-600">
                      <RobotOutlined />
                    </div>
                    <div className="p-4 rounded-2xl text-xs font-semibold leading-relaxed bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-tl-none border border-slate-100 dark:border-slate-805 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Panel */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/30 dark:bg-slate-850/10">
            <Input
              placeholder="Ask a follow up"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              className="rounded-full h-11 px-5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold shadow-inner"
            />
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              onClick={handleSend}
              style={{ backgroundColor: '#8F9BBA', border: 'none' }}
              className="w-11 h-11 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            />
          </div>

        </div>

        {/* Right Side: Date & Recent Prompts Sidebar (1/4 width) */}
        <div className="space-y-6">
          {/* Calendar Picker Panel */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-sm text-slate-700 dark:text-white">August 2025</span>
              <Button 
                type="text" 
                icon={<CalendarOutlined className="text-slate-400" />} 
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-850"
              />
            </div>
            
            <DatePicker 
              className="w-full rounded-xl h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
              placeholder="dd-mm-yyyy"
              format="DD-MM-YYYY"
            />
          </div>

          {/* Recent Prompts Panel */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 h-[350px] overflow-y-auto flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-2">
              Recent Prompts
            </span>
            
            {recentPrompts.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold italic my-auto text-center block">
                No prompts yet.
              </span>
            ) : (
              <List
                dataSource={recentPrompts}
                renderItem={item => (
                  <List.Item className="border-none py-1.5 px-0">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-bold truncate block w-full hover:text-[#8C4BFF] cursor-pointer">
                      {item}
                    </span>
                  </List.Item>
                )}
                className="mt-2"
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
