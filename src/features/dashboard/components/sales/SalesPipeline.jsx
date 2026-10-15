import React, { useState } from 'react'
import { Card, Tag, Button, Select } from 'antd'
import { PlusOutlined, ThunderboltOutlined, SwapOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'

const { Option } = Select

export default function SalesPipeline({ store, modalContext }) {
  const { leads } = store

  React.useEffect(() => {
    store.fetchLeads()
  }, [])
  
  const stages = [
    'New Lead',
    'Contacted',
    'Discovery Call',
    'Demo Scheduled',
    'Proposal Sent',
    'Negotiating',
    'Trial Started',
    'Converted',
    'Lost'
  ]

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

  const myLeads = (leads || []).filter(l => isMatchingRep(l.assignedTo || l.salesperson))

  // Group leads by stage
  const groupedLeads = stages.reduce((acc, stage) => {
    acc[stage] = myLeads.filter(l => l.stage === stage)
    return acc
  }, {})

  // Drag and drop handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId)
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('text/plain')
    if (!leadId) return

    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    if (targetStage === 'Converted') {
      modalContext.setSelectedLeadId(leadId)
      modalContext.setConvertModalOpen(true)
      return
    }

    if (lead.stage !== targetStage) {
      store.moveLeadStage(leadId, targetStage)
      toast.success(`Moved ${lead.name} to ${targetStage}`)
    }
  }

  const handleQuickMove = (leadId, targetStage) => {
    if (targetStage === 'Converted') {
      modalContext.setSelectedLeadId(leadId)
      modalContext.setConvertModalOpen(true)
      return
    }
    store.moveLeadStage(leadId, targetStage)
    toast.success(`Moved deal to ${targetStage}`)
  }

  const getPriorityTag = (value) => {
    const num = parseFloat(value) || 0
    if (num >= 500) return <Tag color="error" className="m-0 text-[8px] font-black uppercase rounded-full border-none">High Priority</Tag>
    if (num >= 300) return <Tag color="warning" className="m-0 text-[8px] font-bold uppercase rounded-full border-none">Medium</Tag>
    return <Tag color="blue" className="m-0 text-[8px] font-bold uppercase rounded-full border-none">Low</Tag>
  }

  return (
    <div className="space-y-6">
      
      {/* Title & Stats */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">Visual Pipeline Kanban Board</span>
          <p className="text-slate-400 text-xs m-0">Drag deal cards across stages, or use the click selector for quick movement.</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => modalContext.setLeadModalOpen(true)}
          style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
          className="rounded-xl font-bold text-xs h-9"
        >
          New Lead
        </Button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none" style={{ minHeight: '520px' }}>
        {stages.map(stage => {
          const items = groupedLeads[stage] || []
          const isConverted = stage === 'Converted'
          const isLost = stage === 'Lost'
          
          return (
            <div 
              key={stage} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className={`w-full rounded-2xl p-4 flex flex-col transition-all border min-h-[220px] ${
                isConverted 
                  ? 'bg-emerald-50/10 dark:bg-emerald-950/10 border-emerald-500/10' 
                  : isLost
                    ? 'bg-rose-50/5 dark:bg-rose-950/5 border-rose-500/10'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-750 dark:text-slate-350">{stage}</span>
                <span className="text-[10px] bg-slate-200/50 dark:bg-slate-800 font-extrabold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Deal Cards Container */}
              <div className="space-y-2 flex-grow overflow-y-auto">
                {items.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-[#8C4BFF] transition-all cursor-grab active:cursor-grabbing group ${isLost ? 'opacity-60 border-rose-200/50 dark:border-rose-900/50' : ''}`}
                  >
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block group-hover:text-[#8C4BFF] transition-colors">
                      {item.name}
                    </span>
                    <div className="flex justify-between items-center mt-3 text-[10px] text-slate-440 dark:text-slate-400 font-semibold">
                      <span>{item.practitioners || 1} staff seats</span>
                      <span className="font-black text-[#8C4BFF]">${item.value}/mo</span>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                      {getPriorityTag(item.value)}
                      
                      {/* Quick click fallback selector */}
                      <Select
                        size="small"
                        variant="borderless"
                        popupMatchSelectWidth={false}
                        value={item.stage}
                        className="text-[9px] font-bold text-slate-400 m-0"
                        onChange={(val) => handleQuickMove(item.id, val)}
                        suffixIcon={<SwapOutlined style={{ fontSize: 8 }} />}
                      >
                        {stages.map(stg => (
                          <Option key={stg} value={stg}>{stg}</Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="h-44 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-350 dark:text-slate-650 text-[10px] font-bold">
                    No Deals
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
