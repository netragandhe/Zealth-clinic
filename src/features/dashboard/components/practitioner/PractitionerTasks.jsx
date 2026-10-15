import React, { useState, useRef } from 'react'
import { Card, Button, Form, Input, Select, DatePicker, Tag, Modal, Space, Badge, Divider, Tooltip, Popconfirm } from 'antd'
import {
  FileDoneOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  TagOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { useClinicStore } from '../../../../store/clinicStore'

const { Option } = Select

// Color resolver for predefined & custom categories
export const getCategoryTagColor = (type) => {
  if (!type) return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }
  switch (type) {
    case 'Report Due':
      return { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' }
    case 'Funding Review Due':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FEE2E2' }
    case 'Referral Required':
      return { bg: '#FAF5FF', text: '#9333EA', border: '#F3E8FF' }
    case 'Follow-Up Required':
      return { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' }
    case 'General Assessment':
      return { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5' }
    case 'Discharge Note':
      return { bg: '#F0FDFA', text: '#0D9488', border: '#CCFBF1' }
    default: {
      // Dynamic hash-based aesthetic color for custom categories
      const colors = [
        { bg: '#FDF2F8', text: '#DB2777', border: '#FCE7F3' },
        { bg: '#F5F3FF', text: '#7C3AED', border: '#EDE9FE' },
        { bg: '#ECFEFF', text: '#0891B2', border: '#CFFAFE' },
        { bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A' },
        { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7' },
        { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
      ]
      let hash = 0
      for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash)
      return colors[Math.abs(hash) % colors.length]
    }
  }
}

export default function PractitionerTasks() {
  const store = useClinicStore()
  const [taskForm] = Form.useForm()
  const [editTaskForm] = Form.useForm()

  const tasksList = store.tasks || []
  const taskCategories = store.taskCategories || [
    'Report Due',
    'Funding Review Due',
    'Referral Required',
    'Follow-Up Required',
    'General Assessment',
    'Discharge Note'
  ]

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)

  // Inline custom category creation state
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const inputRef = useRef(null)

  // Category editing state for Manage Categories Modal
  const [editingCategoryOld, setEditingCategoryOld] = useState(null)
  const [editingCategoryNew, setEditingCategoryNew] = useState('')

  // Add custom category handler
  const handleAddCustomCategory = (e) => {
    e?.preventDefault()
    if (!customCategoryInput.trim()) return
    const newCat = customCategoryInput.trim()
    store.addTaskCategory(newCat)
    toast.success(`Category "${newCat}" added!`)
    setCustomCategoryInput('')
  }

  // Create Task Handler
  const handleAddTask = (values) => {
    const newTask = {
      id: `t_${Date.now()}`,
      patientName: values.patientName,
      type: values.type,
      title: values.title,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      status: 'Pending'
    }
    store.addTask(newTask)
    toast.success('Checklist task created!')
    setModalOpen(false)
    taskForm.resetFields()
  }

  // Edit Task Handler
  const openEditTask = (task) => {
    setEditingTask(task)
    setEditModalOpen(true)
    setTimeout(() => {
      editTaskForm.setFieldsValue({
        title: task.title,
        patientName: task.patientName,
        type: task.type,
        dueDate: task.dueDate ? dayjs(task.dueDate, 'YYYY-MM-DD') : null,
        status: task.status
      })
    }, 0)
  }

  const handleUpdateTask = (values) => {
    if (!editingTask) return
    const updated = {
      ...editingTask,
      title: values.title,
      patientName: values.patientName,
      type: values.type,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : editingTask.dueDate,
      status: values.status || editingTask.status
    }
    store.updateTask(updated)
    toast.success('Task updated successfully!')
    setEditModalOpen(false)
    setEditingTask(null)
  }

  const handleStatusChange = (id, newStatus) => {
    store.updateTaskStatus(id, newStatus)
    toast.success(`Task status updated to ${newStatus}`)
  }

  const handleDeleteTask = (id) => {
    store.deleteTask(id)
    toast.success('Task removed')
  }

  // Filter lists by status
  const pendingTasks = tasksList.filter(t => t.status === 'Pending')
  const inProgressTasks = tasksList.filter(t => t.status === 'In Progress')
  const completedTasks = tasksList.filter(t => t.status === 'Completed')

  // Render Category Select with Dropdown Creator
  const renderCategorySelect = (fieldName = "type") => (
    <Select
      placeholder="Choose or create category..."
      className="w-full rounded-xl"
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <div className="p-2 flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Enter custom category..."
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomCategory()
                }
              }}
              size="small"
              className="rounded-lg text-xs"
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddCustomCategory}
              className="rounded-lg text-xs font-bold bg-[#8C4BFF] border-[#8C4BFF]"
            >
              Add
            </Button>
          </div>
        </div>
      )}
    >
      {taskCategories.map(cat => (
        <Option key={cat} value={cat}>
          <div className="flex items-center justify-between">
            <span>{cat}</span>
          </div>
        </Option>
      ))}
    </Select>
  )

  const TaskCard = ({ task }) => {
    const tagStyle = getCategoryTagColor(task.type)

    return (
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3 shadow-sm text-xs transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <span
            className="font-extrabold text-[9px] uppercase px-2.5 py-0.5 rounded-full border inline-block tracking-wider"
            style={{
              backgroundColor: tagStyle.bg,
              color: tagStyle.text,
              borderColor: tagStyle.border
            }}
          >
            {task.type}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold">{task.dueDate}</span>
            <button
              onClick={() => openEditTask(task)}
              className="text-slate-400 hover:text-[#8C4BFF] border-none bg-transparent cursor-pointer p-0.5 transition-colors"
              title="Edit Task"
            >
              <EditOutlined style={{ fontSize: 11 }} />
            </button>
            <Popconfirm
              title="Delete Task?"
              description="Are you sure you want to remove this task?"
              onConfirm={() => handleDeleteTask(task.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <button
                className="text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer p-0.5 transition-colors"
                title="Delete Task"
              >
                <DeleteOutlined style={{ fontSize: 11 }} />
              </button>
            </Popconfirm>
          </div>
        </div>

        <div>
          <span className="font-extrabold text-slate-800 dark:text-white block leading-snug">{task.title}</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">Patient: <strong>{task.patientName}</strong></span>
        </div>

        {/* Change status actions */}
        <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 select-none">
          {task.status !== 'Pending' && (
            <Button size="small" className="rounded-lg font-bold text-[9px] px-2 py-0.5 h-6" onClick={() => handleStatusChange(task.id, 'Pending')}>
              To Do
            </Button>
          )}
          {task.status !== 'In Progress' && (
            <Button size="small" className="rounded-lg font-bold text-[9px] px-2 py-0.5 h-6" onClick={() => handleStatusChange(task.id, 'In Progress')}>
              Start
            </Button>
          )}
          {task.status !== 'Completed' && (
            <Button size="small" type="primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} className="rounded-lg font-bold text-[9px] px-2 py-0.5 h-6 text-white" onClick={() => handleStatusChange(task.id, 'Completed')}>
              Done
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-2xl shadow-sm flex-wrap gap-4 select-none">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Clinical Tasks Board</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Track follow-ups, diagnostic reports, and funding renewal review checklists with customizable categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<TagOutlined />}
            onClick={() => setManageCategoriesOpen(true)}
            className="rounded-xl font-bold h-10 border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
          >
            Edit Categories
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            onClick={() => {
              taskForm.resetFields()
              setModalOpen(true)
            }}
            className="rounded-xl font-bold h-10 text-white text-xs shadow-sm"
          >
            Add Checklist Task
          </Button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Pending */}
        <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl min-h-[450px]">
          <div className="flex justify-between items-center px-1">
            <span className="font-extrabold text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <ClockCircleOutlined /> Pending Tasks
            </span>
            <Badge count={pendingTasks.length} showZero style={{ backgroundColor: '#CBD5E1', color: '#475569', fontWeight: 'bold' }} />
          </div>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">No pending tasks</div>
            ) : (
              pendingTasks.map(t => <TaskCard key={t.id} task={t} />)
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl min-h-[450px]">
          <div className="flex justify-between items-center px-1">
            <span className="font-extrabold text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <ExclamationCircleOutlined className="text-amber-500" /> In Progress
            </span>
            <Badge count={inProgressTasks.length} showZero style={{ backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: 'bold' }} />
          </div>
          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">No tasks in progress</div>
            ) : (
              inProgressTasks.map(t => <TaskCard key={t.id} task={t} />)
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl min-h-[450px]">
          <div className="flex justify-between items-center px-1">
            <span className="font-extrabold text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircleOutlined className="text-emerald-500" /> Completed
            </span>
            <Badge count={completedTasks.length} showZero style={{ backgroundColor: '#D1FAE5', color: '#059669', fontWeight: 'bold' }} />
          </div>
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">No completed tasks</div>
            ) : (
              completedTasks.map(t => <TaskCard key={t.id} task={t} />)
            )}
          </div>
        </div>

      </div>

      {/* ===================== ADD TASK MODAL ===================== */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={<span className="font-bold text-slate-800 dark:text-white text-base">Add Checklist Task</span>}
        className="documents-modal"
      >
        <Form form={taskForm} layout="vertical" onFinish={handleAddTask}>
          <Form.Item name="title" label={<span className="text-xs font-semibold text-slate-500">Task Title</span>} rules={[{ required: true, message: 'Enter task title' }]}>
            <Input placeholder="e.g. Call plan manager to request funding update" className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item name="patientName" label={<span className="text-xs font-semibold text-slate-500">Patient / Client</span>} rules={[{ required: true, message: 'Select patient' }]}>
            <Select placeholder="Select patient..." className="rounded-xl flex items-center h-10" showSearch optionFilterProp="children">
              {(store.patients || []).map(p => {
                const pName = p.fullName || p.name || 'Patient'
                return (
                  <Option key={p.id} value={pName}>{pName}</Option>
                )
              })}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label={<span className="text-xs font-semibold text-slate-500">Task Category (Preset or Custom)</span>} rules={[{ required: true, message: 'Select or add category' }]}>
              {renderCategorySelect("type")}
            </Form.Item>

            <Form.Item name="dueDate" label={<span className="text-xs font-semibold text-slate-500">Due Date</span>} rules={[{ required: true, message: 'Select due date' }]}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Divider className="my-4" />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setModalOpen(false)} className="rounded-xl font-bold h-10">Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 text-white px-6">
              Create Task
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ===================== EDIT TASK MODAL ===================== */}
      <Modal
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingTask(null); }}
        footer={null}
        title={<span className="font-bold text-slate-800 dark:text-white text-base">Edit Checklist Task</span>}
        className="documents-modal"
      >
        <Form form={editTaskForm} layout="vertical" onFinish={handleUpdateTask}>
          <Form.Item name="title" label={<span className="text-xs font-semibold text-slate-500">Task Title</span>} rules={[{ required: true, message: 'Enter task title' }]}>
            <Input placeholder="Task title..." className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item name="patientName" label={<span className="text-xs font-semibold text-slate-500">Patient / Client</span>} rules={[{ required: true }]}>
            <Select placeholder="Select patient..." className="rounded-xl flex items-center h-10" showSearch optionFilterProp="children">
              {(store.patients || []).map(p => {
                const pName = p.fullName || p.name || 'Patient'
                return (
                  <Option key={p.id} value={pName}>{pName}</Option>
                )
              })}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label={<span className="text-xs font-semibold text-slate-500">Category Type</span>} rules={[{ required: true }]}>
              {renderCategorySelect("type")}
            </Form.Item>

            <Form.Item name="dueDate" label={<span className="text-xs font-semibold text-slate-500">Due Date</span>} rules={[{ required: true }]}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item name="status" label={<span className="text-xs font-semibold text-slate-500">Status</span>}>
            <Select className="rounded-xl h-10">
              <Option value="Pending">Pending (To Do)</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed (Done)</Option>
            </Select>
          </Form.Item>

          <Divider className="my-4" />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { setEditModalOpen(false); setEditingTask(null); }} className="rounded-xl font-bold h-10">Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 text-white px-6">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ===================== MANAGE / EDIT CATEGORIES MODAL (Requirement 2) ===================== */}
      <Modal
        open={manageCategoriesOpen}
        onCancel={() => {
          setManageCategoriesOpen(false)
          setEditingCategoryOld(null)
          setEditingCategoryNew('')
        }}
        footer={null}
        title={<span className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2"><TagOutlined className="text-[#8C4BFF]" /> Manage & Edit Task Categories</span>}
      >
        <div className="space-y-4 pt-2 font-sans">
          <p className="text-xs text-slate-400 m-0">
            Edit existing category labels or add custom ones. Any changes will automatically update all associated tasks.
          </p>

          {/* Add Category row */}
          <div className="flex gap-2">
            <Input
              placeholder="Add new custom category..."
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomCategory()
                }
              }}
              className="rounded-xl h-10"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCustomCategory}
              className="rounded-xl font-bold h-10 bg-[#8C4BFF] border-[#8C4BFF]"
            >
              Add
            </Button>
          </div>

          <Divider className="my-3" />

          {/* Categories List */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {taskCategories.map((cat) => {
              const tagColor = getCategoryTagColor(cat)
              const isEditingThis = editingCategoryOld === cat

              return (
                <div
                  key={cat}
                  className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingCategoryNew}
                        onChange={(e) => setEditingCategoryNew(e.target.value)}
                        size="small"
                        className="rounded-lg font-bold text-xs"
                        autoFocus
                      />
                      <Button
                        size="small"
                        type="primary"
                        style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                        className="rounded-lg font-bold text-xs"
                        onClick={() => {
                          if (editingCategoryNew.trim()) {
                            store.updateTaskCategory(cat, editingCategoryNew.trim())
                            toast.success(`Category updated to "${editingCategoryNew.trim()}"`)
                            setEditingCategoryOld(null)
                            setEditingCategoryNew('')
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        className="rounded-lg text-xs"
                        onClick={() => {
                          setEditingCategoryOld(null)
                          setEditingCategoryNew('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full border tracking-wider"
                        style={{
                          backgroundColor: tagColor.bg,
                          color: tagColor.text,
                          borderColor: tagColor.border
                        }}
                      >
                        {cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingCategoryOld(cat)
                            setEditingCategoryNew(cat)
                          }}
                          className="rounded-lg font-semibold text-[11px]"
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete Category?"
                          description={`Delete "${cat}"?`}
                          onConfirm={() => {
                            store.deleteTaskCategory(cat)
                            toast.success(`Category "${cat}" removed`)
                          }}
                          okText="Delete"
                          cancelText="Cancel"
                        >
                          <Button size="small" icon={<DeleteOutlined />} danger className="rounded-lg font-semibold text-[11px]" />
                        </Popconfirm>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={() => {
                setManageCategoriesOpen(false)
                setEditingCategoryOld(null)
              }}
              className="rounded-xl font-bold h-9"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
