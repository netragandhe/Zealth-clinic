import React, { useState, useEffect } from 'react'
import { Card, Progress, Timeline, Tag, Input, Select, Button, Modal, Form, Spin, Empty, Popconfirm, Slider, InputNumber, Tooltip } from 'antd'
import { FieldTimeOutlined, SafetyCertificateOutlined, TrophyOutlined, SearchOutlined, FilterOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, CheckOutlined, PlayCircleOutlined, MedicineBoxOutlined, SmileOutlined, AppstoreOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

const { Option } = Select

export default function PatientTreatmentPlans() {
  const [loading, setLoading] = useState(false)
  const [treatmentPlans, setTreatmentPlans] = useState([])
  const [exercisesList, setExercisesList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [disciplineFilter, setDisciplineFilter] = useState('ALL')

  // Add / Edit Plan Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [form] = Form.useForm()

  // Add / Edit Goal Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [activePlanForGoal, setActivePlanForGoal] = useState(null)
  const [goalForm] = Form.useForm()

  // Exercise Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [selectedPlanContext, setSelectedPlanContext] = useState(null)

  const handleOpenExerciseDetail = (ex, plan) => {
    setSelectedExercise(ex)
    setSelectedPlanContext(plan)
    setDetailModalOpen(true)
  }

  const handleToggleFromModal = async () => {
    if (!selectedExercise) return
    const currentDone = !!selectedExercise.done
    await handleToggleExercise(selectedExercise.id, currentDone)
    setSelectedExercise(prev => prev ? { ...prev, done: !currentDone } : null)
  }

  const fetchTreatmentPlansAndExercises = async () => {
    setLoading(true)
    try {
      const [plansRes, exercisesRes] = await Promise.all([
        api.get('/api/patient/treatment-plans', {
          params: { search: searchTerm, status: statusFilter }
        }).catch(() => null),
        api.get('/api/patient/exercises').catch(() => null)
      ])

      if (plansRes?.data?.success && Array.isArray(plansRes.data.data)) {
        setTreatmentPlans(plansRes.data.data)
      }
      if (exercisesRes?.data?.success && Array.isArray(exercisesRes.data.data)) {
        setExercisesList(exercisesRes.data.data)
      }
    } catch (err) {
      console.warn('Treatment plans API fetch fallback notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTreatmentPlansAndExercises()
  }, [searchTerm, statusFilter])

  const handleToggleExercise = async (exId, currentDone) => {
    // Optimistic UI update
    const nextExercises = exercisesList.map(e => e.id === exId ? { ...e, done: !currentDone } : e)
    setExercisesList(nextExercises)
    if (!currentDone) toast.success('Great job! Task marked as completed.')

    // Recalculate dynamic daily practice percentage
    const totalEx = nextExercises.length
    const doneEx = nextExercises.filter(e => e.done).length
    const newPracticePercent = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0

    // Update goals in treatment plans optimistically
    setTreatmentPlans(prev => prev.map(p => {
      if (Array.isArray(p.goals)) {
        const updatedGoals = p.goals.map(g => {
          const t = (g.title || '').toLowerCase()
          if (t.includes('daily practice') || t.includes('milestone routine') || t.includes('practice') || t.includes('exercise')) {
            return { ...g, percent: newPracticePercent }
          }
          return g
        })
        return { ...p, goals: updatedGoals }
      }
      return p
    }))

    try {
      const res = await api.put(`/api/patient/exercises/${exId}/toggle`)
      if (res.data?.success && res.data.data) {
        setExercisesList(prev => prev.map(e => e.id === exId ? res.data.data : e))
      }
    } catch (err) {
      console.warn('Toggle exercise DB sync notice:', err?.message)
    }
  }

  // --- Dynamic Treatment Goals & Targets Handlers ---
  const handleOpenAddGoal = (plan) => {
    setActivePlanForGoal(plan)
    setEditingGoal(null)
    goalForm.resetFields()
    goalForm.setFieldsValue({
      title: 'Target Clinical Goal & Functional Recovery',
      percent: 50,
      status: 'Active',
      milestone: 'Targeting functional recovery milestone'
    })
    setGoalModalOpen(true)
  }

  const handleOpenEditGoal = (goal, plan) => {
    setActivePlanForGoal(plan)
    setEditingGoal(goal)
    goalForm.setFieldsValue({
      title: goal.title,
      percent: goal.percent !== undefined ? goal.percent : 50,
      status: goal.status || 'Active',
      milestone: goal.milestone || ''
    })
    setGoalModalOpen(true)
  }

  const handleSaveGoal = async (values) => {
    if (!activePlanForGoal) return
    const currentGoals = Array.isArray(activePlanForGoal.goals) ? [...activePlanForGoal.goals] : []
    let updatedGoals = []

    if (editingGoal) {
      updatedGoals = currentGoals.map(g => g.id === editingGoal.id ? { ...g, ...values, percent: Number(values.percent) } : g)
    } else {
      const newGoalObj = {
        id: `g_${Date.now()}`,
        title: values.title,
        percent: Number(values.percent) || 0,
        status: values.status || 'Active',
        milestone: values.milestone || ''
      }
      updatedGoals = [...currentGoals, newGoalObj]
    }

    // Optimistically update state
    setTreatmentPlans(prev => prev.map(p => p.id === activePlanForGoal.id ? { ...p, goals: updatedGoals } : p))
    setGoalModalOpen(false)
    toast.success(editingGoal ? 'Goal progress updated in DB!' : 'New recovery goal added to treatment plan!')

    try {
      await api.put(`/api/patient/treatment-plans/${activePlanForGoal.id}`, {
        goals: updatedGoals
      })
    } catch (err) {
      console.warn('DB goal update sync notice:', err?.message)
    }
  }

  const handleDeleteGoal = async (goalId, plan) => {
    const currentGoals = Array.isArray(plan.goals) ? plan.goals : []
    const updatedGoals = currentGoals.filter(g => g.id !== goalId)

    setTreatmentPlans(prev => prev.map(p => p.id === plan.id ? { ...p, goals: updatedGoals } : p))
    toast.success('Goal removed from treatment plan')

    try {
      await api.put(`/api/patient/treatment-plans/${plan.id}`, {
        goals: updatedGoals
      })
    } catch (err) {
      console.warn('DB goal delete sync notice:', err?.message)
    }
  }

  const handleQuickAdjustGoalProgress = async (goal, delta, plan) => {
    const currentGoals = Array.isArray(plan.goals) ? [...plan.goals] : []
    const updatedGoals = currentGoals.map(g => {
      if (g.id === goal.id) {
        const newP = Math.min(100, Math.max(0, (g.percent || 0) + delta))
        return { ...g, percent: newP, status: newP === 100 ? 'Completed' : 'Active' }
      }
      return g
    })

    setTreatmentPlans(prev => prev.map(p => p.id === plan.id ? { ...p, goals: updatedGoals } : p))
    const updatedP = Math.min(100, Math.max(0, (goal.percent || 0) + delta))
    toast.success(`Goal target updated to ${updatedP}%`)

    try {
      await api.put(`/api/patient/treatment-plans/${plan.id}`, {
        goals: updatedGoals
      })
    } catch (err) {
      console.warn('DB goal adjustment sync notice:', err?.message)
    }
  }

  const getTimelineColor = (status) => {
    switch (status) {
      case 'Completed': return 'green'
      case 'Active': return 'blue'
      default: return 'gray'
    }
  }

  const getDisciplineInfo = (plan) => {
    const text = `${plan.discipline || ''} ${plan.condition || ''} ${plan.practitioner || ''}`.toLowerCase()
    if (text.includes('speech') || text.includes('voice') || text.includes('swallow') || text.includes('aphasia')) {
      return {
        name: 'Speech Pathology',
        color: 'purple',
        practiceLabel: 'Discipline Goals & Home Practice',
        taskType: 'Home Practice Routine',
        icon: <SmileOutlined />
      }
    }
    if (text.includes('occupational') || text.includes('ot') || text.includes('adl') || text.includes('dexterity') || text.includes('ergonomic')) {
      return {
        name: 'Occupational Therapy',
        color: 'cyan',
        practiceLabel: 'Discipline Goals & Home Practice',
        taskType: 'Functional Daily Activity Practice',
        icon: <AppstoreOutlined />
      }
    }
    return {
      name: 'Physiotherapy',
      color: 'blue',
      practiceLabel: 'Treatment Goals & Prescribed Exercises',
      taskType: 'Prescribed Exercise Routine',
      icon: <MedicineBoxOutlined />
    }
  }

  const handleOpenAddModal = () => {
    setEditingPlan(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan)
    const disc = plan.discipline || getDisciplineInfo(plan).name
    form.setFieldsValue({
      discipline: disc,
      condition: plan.condition,
      practitioner: plan.practitioner,
      stage: plan.stage,
      overallProgress: plan.overallProgress,
      status: plan.status || 'Active'
    })
    setModalOpen(true)
  }

  const handleDeletePlan = async (id) => {
    try {
      const res = await api.delete(`/api/patient/treatment-plans/${id}`)
      if (res.data?.success) {
        toast.success('Treatment plan removed successfully')
        fetchTreatmentPlansAndExercises()
      }
    } catch (err) {
      toast.error('Failed to delete treatment plan')
    }
  }

  const handleSavePlan = async (values) => {
    try {
      if (editingPlan) {
        const res = await api.put(`/api/patient/treatment-plans/${editingPlan.id}`, values)
        if (res.data?.success) {
          toast.success('Treatment plan updated successfully!')
        }
      } else {
        const res = await api.post('/api/patient/treatment-plans', {
          ...values,
          goals: [
            { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 40, status: 'Active' },
            { id: 'g2', title: 'Home Adherence & Stage Milestone Routine', percent: 20, status: 'Active' }
          ],
          timeline: [
            { id: 't1', label: 'Initial Assessment & Goal Setting', date: 'Today', desc: 'Baseline evaluation conducted.', status: 'Active' },
            { id: 't2', label: 'Progress Review Milestone', date: 'Expected: 30 Days', desc: 'Clinical progress audit.', status: 'Pending' }
          ]
        })
        if (res.data?.success) {
          toast.success('New Treatment Plan added successfully!')
        }
      }
      setModalOpen(false)
      form.resetFields()
      fetchTreatmentPlansAndExercises()
    } catch (err) {
      toast.error('Failed to save treatment plan')
    }
  }

  const filteredPlans = treatmentPlans.filter(p => {
    if (disciplineFilter !== 'ALL') {
      const info = getDisciplineInfo(p)
      if (info.name !== disciplineFilter) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      
      {/* Intro Header & Search/Filter Controls */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">My Multidisciplinary Treatment Plans</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Unified discipline view with treatment goals, prescribed exercises, and home practice routines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search condition / doctor..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl text-xs w-full sm:w-44"
              allowClear
            />
            <Select
              value={disciplineFilter}
              onChange={(val) => setDisciplineFilter(val)}
              className="w-44 text-xs"
            >
              <Option value="ALL">All Disciplines</Option>
              <Option value="Physiotherapy">Physiotherapy</Option>
              <Option value="Speech Pathology">Speech Pathology</Option>
              <Option value="Occupational Therapy">Occupational Therapy</Option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-28 text-xs"
            >
              <Option value="ALL">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Unified Discipline Cards List */}
      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" description="Loading multidisciplinary treatment plans..." />
        </div>
      ) : filteredPlans.length === 0 ? (
        <Card className="text-center py-12 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Empty description="No treatment plans found matching filters." />
        </Card>
      ) : (
        filteredPlans.map((plan, idx) => {
          const discInfo = getDisciplineInfo(plan)
          const isSpeechOrOT = discInfo.name === 'Speech Pathology' || discInfo.name === 'Occupational Therapy'
          
          const completedExercisesCount = exercisesList.filter(e => e.done).length
          const totalExercisesCount = exercisesList.length
          const liveDailyPracticePercent = totalExercisesCount > 0 
            ? Math.round((completedExercisesCount / totalExercisesCount) * 100) 
            : 0

          const planGoals = (Array.isArray(plan.goals) && plan.goals.length > 0 ? plan.goals : [
            { id: 'g1', title: 'Target Clinical Goal & Functional Recovery', percent: 40, status: 'Active', milestone: 'Functional recovery milestone' },
            { id: 'g2', title: 'Daily Practice & Stage Milestone Routine', percent: liveDailyPracticePercent, status: 'Active', milestone: 'Daily home exercise adherence' }
          ])

          return (
            <div key={plan.id || idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
              
              {/* Card Header: Discipline & Status Tags */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Tag color={discInfo.color} className="font-bold text-xs uppercase px-3 py-0.5 rounded-full flex items-center gap-1.5 m-0">
                    {discInfo.icon} {discInfo.name}
                  </Tag>
                  <Tag color={plan.status === 'Completed' ? 'green' : 'blue'} className="rounded-full font-bold text-[9px] uppercase px-2.5 m-0">
                    {plan.status || 'Active'}
                  </Tag>
                </div>
              </div>

              {/* Shared Treatment Goals & Milestones (Fully Dynamic & Interactive) */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                      🎯 Treatment Goals & Recovery Targets
                    </span>
                    <Tag color="cyan" className="m-0 font-bold border-none text-[9px] uppercase px-2 py-0.5 rounded-full">
                      {planGoals.length} Active {planGoals.length === 1 ? 'Goal' : 'Goals'}
                    </Tag>
                  </div>

                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenAddGoal(plan)}
                    className="rounded-lg text-[11px] font-bold text-[#8C4BFF] border-[#8C4BFF]/40 hover:border-[#8C4BFF] hover:bg-[#8C4BFF]/5 flex items-center gap-1 h-7"
                  >
                    Add Target Goal
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planGoals.map((g, gIdx) => {
                    const isPracticeGoal = (g.title || '').toLowerCase().includes('daily practice') || 
                                           (g.title || '').toLowerCase().includes('milestone routine') || 
                                           (g.title || '').toLowerCase().includes('practice') ||
                                           (g.title || '').toLowerCase().includes('exercise')
                    const displayPercent = isPracticeGoal ? liveDailyPracticePercent : (g.percent !== undefined ? g.percent : 50)
                    const isCompleted = displayPercent >= 100

                    return (
                      <div 
                        key={g.id || gIdx} 
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs hover:border-[#8C4BFF]/30 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">
                                {g.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-medium mt-0.5 truncate">
                              {isPracticeGoal 
                                ? `${completedExercisesCount} of ${totalExercisesCount} Prescribed Routine Tasks Done Today` 
                                : (g.milestone || 'Clinical Target & Recovery Milestone')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Tag color={isCompleted ? 'success' : 'purple'} className="font-black text-[11px] px-2 py-0.5 rounded-full m-0 border-none">
                              {displayPercent}%
                            </Tag>
                          </div>
                        </div>

                        {/* Animated Live Progress Bar */}
                        <Progress 
                          percent={displayPercent} 
                          strokeColor={isCompleted ? '#10B981' : '#8C4BFF'} 
                          trailColor={undefined}
                          size="small" 
                          showInfo={false} 
                        />

                        {/* Interactive Controls / Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 dark:border-slate-800/80 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              Status:
                            </span>
                            <Tag color={isCompleted ? 'green' : g.status === 'Completed' ? 'green' : 'blue'} className="text-[9px] font-bold px-1.5 py-0 m-0 rounded">
                              {isCompleted ? 'Achieved' : g.status || 'Active'}
                            </Tag>
                          </div>

                          <div className="flex items-center gap-1">
                            {!isPracticeGoal && (
                              <div className="flex items-center gap-0.5 mr-1">
                                <Tooltip title="Decrease progress by 10%">
                                  <button
                                    onClick={() => handleQuickAdjustGoalProgress(g, -10, plan)}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                                  >
                                    -10%
                                  </button>
                                </Tooltip>
                                <Tooltip title="Increase progress by 10%">
                                  <button
                                    onClick={() => handleQuickAdjustGoalProgress(g, 10, plan)}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                                  >
                                    +10%
                                  </button>
                                </Tooltip>
                              </div>
                            )}

                            <Button 
                              size="small" 
                              type="text"
                              icon={<EditOutlined className="text-[#8C4BFF] text-[11px]" />} 
                              onClick={() => handleOpenEditGoal(g, plan)}
                              className="h-6 px-1.5 text-[10px] font-bold text-[#8C4BFF] hover:bg-[#8C4BFF]/10 rounded"
                            >
                              Edit
                            </Button>

                            <Popconfirm
                              title="Delete Goal"
                              description="Are you sure you want to remove this goal from the treatment plan?"
                              onConfirm={() => handleDeleteGoal(g.id, plan)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <Button 
                                size="small" 
                                type="text"
                                danger
                                icon={<DeleteOutlined className="text-[11px]" />} 
                                className="h-6 px-1.5 text-[10px] hover:bg-rose-50 rounded"
                              />
                            </Popconfirm>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Prescribed Exercises or Home Practice (Discipline Adaptive) */}
              <div className="p-5 bg-slate-50/60 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    {isSpeechOrOT ? 'Home Practice & Daily Tasks' : 'Prescribed Exercises & Routine'}
                  </span>
                  <Tag color="purple" className="m-0 font-bold border-none text-[9px] uppercase px-2.5 py-0.5 rounded-full">
                    {isSpeechOrOT ? 'Home Practice' : 'Prescribed Exercises'}
                  </Tag>
                </div>

                <div className="space-y-2.5 pt-1">
                  {exercisesList.length > 0 ? (
                    exercisesList.map((ex) => (
                      <div 
                        key={ex.id} 
                        onClick={() => handleOpenExerciseDetail(ex, plan)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 hover:shadow-md ${ex.done ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-[#8C4BFF]/40'}`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 ${ex.done ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'bg-[#8C4BFF]/10 text-[#8C4BFF]'}`}>
                            {ex.done ? <CheckOutlined style={{ fontSize: 14 }} /> : <PlayCircleOutlined style={{ fontSize: 16 }} />}
                          </div>
                          <div className="truncate">
                            <span className={`font-bold text-xs block truncate ${ex.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                              {ex.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                              {ex.reps} &bull; {isSpeechOrOT ? 'Daily Practice Task' : 'Prescribed Routine'} &bull; <span className="text-[#8C4BFF] underline">View Details →</span>
                            </span>
                          </div>
                        </div>

                        <Button 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleExercise(ex.id, ex.done)
                          }}
                          className={`rounded-lg text-[10px] font-bold h-7 flex items-center gap-1 ${ex.done ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'border-[#8C4BFF] text-[#8C4BFF] hover:bg-[#8C4BFF]/5'}`}
                        >
                          {ex.done ? <><CheckCircleOutlined /> Done</> : 'Mark Complete'}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">
                      No {isSpeechOrOT ? 'home practice tasks' : 'prescribed exercises'} assigned currently.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )
        })
      )}

      {/* Exercise / Practice Detailed View Modal */}
      <Modal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        destroyOnHidden
        centered
        width={560}
      >
        {selectedExercise && (
          <div className="space-y-5 pt-2">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag color="purple" className="font-bold text-[10px] uppercase rounded-full px-2.5 py-0.5 m-0">
                    {selectedPlanContext ? getDisciplineInfo(selectedPlanContext).name : 'Prescribed Care'}
                  </Tag>
                  <Tag color={selectedExercise.done ? 'success' : 'blue'} className="font-bold text-[10px] uppercase rounded-full px-2.5 py-0.5 m-0">
                    {selectedExercise.done ? 'Completed' : 'Pending Completion'}
                  </Tag>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white m-0">
                  {selectedExercise.name}
                </h3>
                <span className="text-slate-400 text-xs font-semibold block mt-0.5">
                  Assigned Program: {selectedPlanContext?.condition || 'Clinical Rehabilitation'}
                </span>
              </div>
            </div>

            {/* Routine & Reps Snapshot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Prescribed Volume</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm block mt-0.5">
                  {selectedExercise.reps || '3 sets of 10 reps'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Delivery & Channel</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm block mt-0.5">
                  Patient Portal & App
                </span>
              </div>
            </div>

            {/* Clinical Notes & Instructions */}
            <div className="p-4 bg-[#8C4BFF]/5 dark:bg-slate-950 rounded-xl border border-[#8C4BFF]/15 space-y-2">
              <span className="text-[10px] text-[#8C4BFF] uppercase font-bold tracking-wider block">
                Clinical Instructions & Technique
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium m-0 leading-relaxed">
                {selectedExercise.note || 'Perform this exercise with controlled tempo and steady breathing. Avoid forcing movement into painful ranges and ensure proper posture as instructed by your clinician.'}
              </p>
            </div>

            {/* Video or Visual Demo */}
            {selectedExercise.videoUrl ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircleOutlined className="text-[#8C4BFF] text-lg" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Video Guide Available</span>
                </div>
                <a href={selectedExercise.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-[#8C4BFF] font-bold hover:underline">
                  Watch Video ↗
                </a>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3">
              <Button 
                onClick={() => setDetailModalOpen(false)} 
                className="rounded-xl font-bold text-xs h-9 px-4"
              >
                Close
              </Button>
              <Button 
                type="primary"
                onClick={handleToggleFromModal}
                style={{ 
                  backgroundColor: selectedExercise.done ? '#10B981' : '#8C4BFF', 
                  borderColor: selectedExercise.done ? '#10B981' : '#8C4BFF' 
                }}
                className="rounded-xl font-bold text-xs h-9 px-5 text-white flex items-center gap-1.5"
              >
                {selectedExercise.done ? (
                  <><CheckCircleOutlined /> Completed &bull; Click to Undo</>
                ) : (
                  <><CheckOutlined /> Mark as Completed Today</>
                )}
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* Add / Edit Treatment Plan Modal */}
      <Modal
        title={<span className="font-bold">{editingPlan ? 'Edit Treatment Plan' : 'Add New Treatment Plan'}</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSavePlan} className="mt-4">
          <Form.Item name="discipline" label="Clinical Discipline" rules={[{ required: true, message: 'Please select discipline' }]}>
            <Select placeholder="Select discipline" className="rounded-lg">
              <Option value="Physiotherapy">Physiotherapy</Option>
              <Option value="Speech Pathology">Speech Pathology</Option>
              <Option value="Occupational Therapy">Occupational Therapy</Option>
            </Select>
          </Form.Item>
          <Form.Item name="condition" label="Assigned Condition / Program" rules={[{ required: true, message: 'Please enter condition' }]}>
            <Input placeholder="e.g. Lumbar Disc Rehabilitation or Speech Fluency Practice" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="practitioner" label="Directed Practitioner" rules={[{ required: true, message: 'Please enter practitioner name' }]}>
            <Input placeholder="e.g. Dr. Sarah Jenkins" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="stage" label="Current Active Stage" rules={[{ required: true, message: 'Please enter active stage' }]}>
            <Input placeholder="e.g. Phase 2: Active Mobilisation / Daily Practice" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="overallProgress" label="Overall Progress (%)" rules={[{ required: true, message: 'Please enter progress percentage' }]}>
            <Input type="number" min={0} max={100} placeholder="e.g. 65" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="status" label="Program Status">
            <Select className="rounded-lg">
              <Option value="Active">Active</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-lg font-bold">
              Save Plan
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add / Edit Treatment Goal Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8C4BFF]/10 text-[#8C4BFF] flex items-center justify-center font-bold text-base">
              🎯
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-800 dark:text-white block">
                {editingGoal ? 'Edit Treatment Goal & Recovery Target' : 'Add New Recovery Target Goal'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Dynamic clinical milestone tracking & progress metrics
              </span>
            </div>
          </div>
        }
        open={goalModalOpen}
        onCancel={() => setGoalModalOpen(false)}
        footer={null}
        destroyOnHidden
        centered
        width={520}
      >
        <Form form={goalForm} layout="vertical" onFinish={handleSaveGoal} className="mt-4 space-y-3">
          <Form.Item 
            name="title" 
            label={<span className="text-xs font-bold">Goal / Target Name</span>} 
            rules={[{ required: true, message: 'Please enter goal title' }]}
          >
            <Input 
              placeholder="e.g. Target Clinical Goal & Functional Recovery" 
              className="rounded-xl text-xs py-2" 
            />
          </Form.Item>

          {/* Quick Preset Badges */}
          <div className="space-y-1 pb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Target Clinical Goal & Functional Recovery',
                'Daily Practice & Stage Milestone Routine',
                'Full Pain-Free Range of Motion (ROM)',
                'Functional Strength & Weight-Bearing Stability',
                'Task Independence & ADL Mastery'
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => goalForm.setFieldsValue({ title: preset })}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#8C4BFF]/10 hover:text-[#8C4BFF] rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer text-left truncate max-w-full"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <Form.Item 
            name="percent" 
            label={<span className="text-xs font-bold">Target Progress Percentage (%)</span>}
            rules={[{ required: true, message: 'Please set progress percentage' }]}
          >
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <Form.Item name="percent" noStyle>
                <Slider min={0} max={100} tooltip={{ formatter: val => `${val}%` }} />
              </Form.Item>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-bold text-slate-400">Current Progress:</span>
                <Form.Item name="percent" noStyle>
                  <InputNumber min={0} max={100} addonAfter="%" className="w-24 text-xs font-bold" />
                </Form.Item>
              </div>
            </div>
          </Form.Item>

          <Form.Item 
            name="status" 
            label={<span className="text-xs font-bold">Goal Status</span>}
          >
            <Select className="rounded-xl text-xs">
              <Option value="Active">Active</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Achieved / Completed (100%)</Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="milestone" 
            label={<span className="text-xs font-bold">Clinical Milestone Note / Target Note</span>}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="e.g. Target MCID baseline improvement, full pain-free extension, 5 daily sets" 
              className="rounded-xl text-xs" 
            />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setGoalModalOpen(false)} className="rounded-xl font-bold text-xs h-9 px-4">
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} 
              className="rounded-xl font-bold text-xs h-9 px-5 text-white"
            >
              Save Goal
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  )
}

