import React, { useState } from 'react'
import { Button, Tag, Select } from 'antd'
import {
  PlusOutlined, ClockCircleOutlined, CheckCircleOutlined,
  PhoneOutlined, CalendarOutlined, AlertOutlined, ReloadOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'

const { Option } = Select

const TASK_TYPE_CONFIG = {
  'Calls': { icon: <PhoneOutlined />, color: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
  'Follow-ups': { icon: <ReloadOutlined />, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
  'Demos': { icon: <CalendarOutlined />, color: '#8C4BFF', bg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
  'Renewal reminders': { icon: <AlertOutlined />, color: '#EC4899', bg: 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' },
}

export default function SalesTasks({ store, modalContext }) {
  const { salesTasks } = store
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('Active')

  React.useEffect(() => {
    if (store.fetchSalesTasks) store.fetchSalesTasks()
  }, [])

  const handleToggleStatus = (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed'
    store.updateSalesTask(task.id, { status: nextStatus })
    toast.success(nextStatus === 'Completed' ? `✅ "${task.title}" completed!` : `Task "${task.title}" marked as Pending.`)
  }

  const handleDelete = (id) => {
    store.deleteSalesTask(id)
    toast.success('Task deleted.')
  }

  const filteredTasks = salesTasks.filter(t => {
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter
    let matchesStatus = true
    if (statusFilter === 'Active') matchesStatus = t.status !== 'Completed'
    else if (statusFilter === 'Completed') matchesStatus = t.status === 'Completed'
    else if (statusFilter === 'Overdue') {
      const today = new Date().toISOString().split('T')[0]
      matchesStatus = t.status !== 'Completed' && t.dueDate < today
    }
    return matchesCategory && matchesPriority && matchesStatus
  })

  // Summary counts
  const totalPending = salesTasks.filter(t => t.status !== 'Completed').length
  const totalCompleted = salesTasks.filter(t => t.status === 'Completed').length
  const today = new Date().toISOString().split('T')[0]
  const totalOverdue = salesTasks.filter(t => t.status !== 'Completed' && t.dueDate < today).length

  const summaryChips = [
    { label: 'Pending', count: totalPending, color: '#F59E0B', filter: 'Active' },
    { label: 'Completed', count: totalCompleted, color: '#10B981', filter: 'Completed' },
    { label: 'Overdue', count: totalOverdue, color: '#EF4444', filter: 'Overdue' },
  ]

  return (
    <div className="space-y-6">

      {/* Header + Filters */}
      <div className="bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white m-0">My Tasks Checklist</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Manage calls, follow-ups, demos, and renewal reminders.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => modalContext.setTaskModalOpen(true)}
            style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
            className="rounded-xl font-bold text-xs h-9"
          >
            Create Task
          </Button>
        </div>

        {/* Summary Status Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {summaryChips.map(chip => (
            <button
              key={chip.label}
              onClick={() => setStatusFilter(chip.filter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${statusFilter === chip.filter ? 'text-white border-transparent' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-current'}`}
              style={statusFilter === chip.filter ? { backgroundColor: chip.color, borderColor: chip.color } : { color: chip.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chip.color }} />
              {chip.label} <span className="font-black">({chip.count})</span>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onChange={setCategoryFilter} className="min-w-[150px] rounded-xl" size="small">
            <Option value="All">All Categories</Option>
            <Option value="Calls">📞 Calls</Option>
            <Option value="Follow-ups">🔁 Follow-ups</Option>
            <Option value="Demos">📅 Demos</Option>
            <Option value="Renewal reminders">🔔 Renewals</Option>
          </Select>
          <Select value={priorityFilter} onChange={setPriorityFilter} className="min-w-[130px] rounded-xl" size="small">
            <Option value="All">All Priorities</Option>
            <Option value="High">🔴 High</Option>
            <Option value="Medium">🟡 Medium</Option>
            <Option value="Low">🔵 Low</Option>
          </Select>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const isDone = task.status === 'Completed'
          const isOverdue = !isDone && task.dueDate < today
          const typeConfig = TASK_TYPE_CONFIG[task.category] || TASK_TYPE_CONFIG['Follow-ups']

          return (
            <div
              key={task.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${
                isDone
                  ? 'border-slate-100 dark:border-slate-800 opacity-60'
                  : isOverdue
                    ? 'border-red-200 dark:border-red-900/50 hover:border-red-300'
                    : 'border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* Left side */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggleStatus(task)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#8C4BFF] focus:ring-[#8C4BFF] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-extrabold text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </span>
                      {isOverdue && !isDone && (
                        <span className="text-[8px] font-black bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wide">Overdue</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      {/* Category type icon */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${typeConfig.bg}`}>
                        {typeConfig.icon} {task.category}
                      </span>
                      <span>Lead: <span className="text-slate-600 dark:text-slate-400 font-bold">{task.leadName}</span></span>
                      <span className={`font-bold ${isOverdue && !isDone ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        Due: {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Tag
                    color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'blue'}
                    className="rounded-full border-none font-bold text-[8px] px-2.5 m-0 uppercase"
                  >
                    {task.priority}
                  </Tag>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <CheckCircleOutlined className="text-4xl text-slate-300 dark:text-slate-700 block mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-semibold">No tasks match these filters.</p>
            <button onClick={() => { setCategoryFilter('All'); setPriorityFilter('All'); setStatusFilter('Active') }}
              className="mt-2 text-xs text-[#8C4BFF] font-bold hover:underline">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  )
}
