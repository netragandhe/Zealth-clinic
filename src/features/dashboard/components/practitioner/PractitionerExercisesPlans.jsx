import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Select, Form, Input, InputNumber, Modal, Tooltip, Popconfirm, Divider, Dropdown } from 'antd'
import {
  HeartOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  DownOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../../store/clinicStore'

const { Option } = Select
const { TextArea } = Input

export default function PractitionerExercisesPlans({ patientId, clientPatient } = {}) {
  const store = useClinicStore()
  const [assignForm] = Form.useForm()

  const [selectedBodyPart, setSelectedBodyPart] = useState(undefined)
  const [submitting, setSubmitting] = useState(false)
  
  // Multi-exercise state for new treatment plan
  const [exercisesList, setExercisesList] = useState([
    {
      id: `ex_${Date.now()}_1`,
      name: '',
      videoUrl: '',
      sets: 3,
      reps: 10,
      frequency: 'Daily',
      instructions: ''
    }
  ])

  // Modal State for viewing/managing an existing treatment plan
  const [manageModalVisible, setManageModalVisible] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [newExForm] = Form.useForm()
  const [showAddExInline, setShowAddExInline] = useState(false)

  useEffect(() => {
    if (store.fetchPrescribedExercises) {
      store.fetchPrescribedExercises()
    }
    if (store.fetchPatients) {
      store.fetchPatients()
    }
  }, [])

  useEffect(() => {
    if (clientPatient?.id || patientId) {
      assignForm.setFieldsValue({
        patientName: clientPatient?.id || patientId
      })
    }
  }, [clientPatient, patientId, assignForm])

  const allPrograms = store.prescribedExercises || []
  const activePrograms = (patientId || clientPatient)
    ? allPrograms.filter(prog => 
        (patientId && prog.patientId === patientId) || 
        (clientPatient?.id && prog.patientId === clientPatient.id) ||
        (clientPatient?.name && prog.patientName === clientPatient.name) ||
        (clientPatient?.fullName && prog.patientName === clientPatient.fullName)
      )
    : allPrograms

  // Optional Exercise Reference Library
  const exerciseLibrary = [
    { name: 'Cat-Cow Lumbar Mobilisation', bodyPart: 'Lumbar Spine', duration: '5 min', code: 'EX-LS-01', defaultSets: 3, defaultReps: 10, defaultFreq: 'Daily', instructions: 'Perform slow alternating arch and flex in cat-cow position.' },
    { name: 'Prone Bird-Dog holds', bodyPart: 'Core Stability', duration: '8 min', code: 'EX-LS-02', defaultSets: 3, defaultReps: 12, defaultFreq: '2x Daily', instructions: 'Maintain neutral spine while extending opposite arm and leg.' },
    { name: 'Supine Dead Bug core press', bodyPart: 'Core Stability', duration: '10 min', code: 'EX-LS-03', defaultSets: 3, defaultReps: 10, defaultFreq: 'Daily', instructions: 'Keep lower back pressed flat into the mat during opposite arm/leg lowers.' },
    { name: 'Scapular Pull-Down isometric', bodyPart: 'Upper Back / Shoulders', duration: '6 min', code: 'EX-US-01', defaultSets: 3, defaultReps: 15, defaultFreq: '3x per week', instructions: 'Engage lower lats and hold for 3 seconds per repetition.' },
    { name: 'Cervical rotation stretch', bodyPart: 'Neck Stiffness', duration: '4 min', code: 'EX-N-01', defaultSets: 2, defaultReps: 8, defaultFreq: '3x Daily', instructions: 'Gentle neck rotation to each shoulder without forcing range.' },
    { name: 'Glute bridge alignment holds', bodyPart: 'Hip / Lower Limb', duration: '7 min', code: 'EX-HL-01', defaultSets: 3, defaultReps: 12, defaultFreq: 'Daily', instructions: 'Squeeze glutes at the top of the bridge and hold for 2 seconds.' }
  ]

  // Handlers for dynamic exercises list in prescription form
  const handleAddExerciseRow = () => {
    setExercisesList(prev => [
      ...prev,
      {
        id: `ex_${Date.now()}_${prev.length + 1}`,
        name: '',
        videoUrl: '',
        sets: 3,
        reps: 10,
        frequency: 'Daily',
        instructions: ''
      }
    ])
  }

  const handleRemoveExerciseRow = (index) => {
    if (exercisesList.length <= 1) {
      toast.error('A treatment plan must have at least one exercise.')
      return
    }
    setExercisesList(prev => prev.filter((_, i) => i !== index))
  }

  const handleExerciseChange = (index, field, value) => {
    setExercisesList(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleUseLibraryExercise = (item) => {
    // If the only exercise in list is completely empty, replace it; otherwise append
    setExercisesList(prev => {
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{
          id: `ex_${Date.now()}_1`,
          name: item.name,
          videoUrl: '',
          sets: item.defaultSets || 3,
          reps: item.defaultReps || 10,
          frequency: item.defaultFreq || 'Daily',
          instructions: item.instructions || ''
        }]
      }
      return [
        ...prev,
        {
          id: `ex_${Date.now()}_${prev.length + 1}`,
          name: item.name,
          videoUrl: '',
          sets: item.defaultSets || 3,
          reps: item.defaultReps || 10,
          frequency: item.defaultFreq || 'Daily',
          instructions: item.instructions || ''
        }
      ]
    })
    toast.success(`Added "${item.name}" to treatment plan exercises!`)
  }

  const handleAssignProgram = async (values) => {
    try {
      // Validate exercises
      const validExercises = exercisesList.filter(ex => ex.name && ex.name.trim() !== '')
      if (validExercises.length === 0) {
        toast.error('Please specify at least one exercise title in the treatment plan.')
        return
      }

      setSubmitting(true)
      const pInput = values.patientName
      const selectedPatient = store.patients?.find(p => p.id === pInput || p.name === pInput || p.fullName === pInput)
      
      const targetPatientId = selectedPatient ? selectedPatient.id : (pInput && pInput.length > 2 ? pInput : 'p1')
      const targetPatientName = selectedPatient ? (selectedPatient.fullName || selectedPatient.name || selectedPatient.email) : (clientPatient?.fullName || clientPatient?.name || 'Client')

      const prog = {
        patientId: targetPatientId,
        patientName: targetPatientName,
        programName: values.programName || `${validExercises[0].name} Rehabilitation Plan`,
        practitionerName: store.user?.name || 'Dr. Sarah Jenkins',
        delivery: values.delivery || 'Portal',
        instructions: values.instructions || '',
        exercises: validExercises.map(ex => ({
          name: ex.name.trim(),
          videoName: ex.name.trim(),
          videoUrl: ex.videoUrl ? ex.videoUrl.trim() : '',
          sets: ex.sets || 3,
          reps: ex.reps || 10,
          frequency: ex.frequency || 'Daily',
          instructions: ex.instructions || ''
        }))
      }

      await store.addPrescribedExercise(prog)
      toast.success(`Treatment plan with ${validExercises.length} exercise(s) successfully assigned to ${targetPatientName}!`)
      
      assignForm.resetFields()
      setExercisesList([
        {
          id: `ex_${Date.now()}_1`,
          name: '',
          videoUrl: '',
          sets: 3,
          reps: 10,
          frequency: 'Daily',
          instructions: ''
        }
      ])

      if (clientPatient?.id || patientId) {
        assignForm.setFieldsValue({ patientName: clientPatient?.id || patientId })
      }
    } catch (err) {
      toast.error('Failed to save treatment plan. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Manage existing plan modal handlers (Add / Remove exercise on the fly)
  const handleOpenManageModal = (plan) => {
    setSelectedPlan(plan)
    setShowAddExInline(false)
    newExForm.resetFields()
    setManageModalVisible(true)
  }

  const handleAddExerciseToOngoingPlan = async (values) => {
    if (!selectedPlan) return
    const newEx = {
      name: values.name,
      videoName: values.name,
      videoUrl: values.videoUrl || '',
      sets: values.sets || 3,
      reps: values.reps || 10,
      frequency: values.frequency || 'Daily',
      instructions: values.instructions || ''
    }

    const currentExercises = Array.isArray(selectedPlan.exercises) ? [...selectedPlan.exercises] : []
    const updatedExercises = [...currentExercises, newEx]
    const updatedPlan = { ...selectedPlan, exercises: updatedExercises }

    try {
      if (store.updatePrescribedExercise) {
        await store.updatePrescribedExercise(selectedPlan.id, { exercises: updatedExercises })
      }
      setSelectedPlan(updatedPlan)
      setShowAddExInline(false)
      newExForm.resetFields()
      toast.success(`Added "${newEx.name}" to active treatment plan!`)
    } catch (err) {
      toast.error('Failed to update treatment plan.')
    }
  }

  const handleRemoveExerciseFromOngoingPlan = async (exIndex) => {
    if (!selectedPlan) return
    const currentExercises = Array.isArray(selectedPlan.exercises) ? [...selectedPlan.exercises] : []
    if (currentExercises.length <= 1) {
      toast.error('Treatment plan must retain at least one exercise. You can delete the whole plan if no longer needed.')
      return
    }

    const updatedExercises = currentExercises.filter((_, i) => i !== exIndex)
    const updatedPlan = { ...selectedPlan, exercises: updatedExercises }

    try {
      if (store.updatePrescribedExercise) {
        await store.updatePrescribedExercise(selectedPlan.id, { exercises: updatedExercises })
      }
      setSelectedPlan(updatedPlan)
      toast.success('Exercise removed from ongoing treatment plan!')
    } catch (err) {
      toast.error('Failed to update treatment plan.')
    }
  }

  const handleDeletePlan = async (planId, planTitle) => {
    Modal.confirm({
      title: 'Delete Treatment Plan?',
      content: `Are you sure you want to delete "${planTitle || 'this treatment plan'}"? This action will remove it permanently.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (store.deletePrescribedExercise) {
            await store.deletePrescribedExercise(planId)
          }
          if (selectedPlan && selectedPlan.id === planId) {
            setManageModalVisible(false)
          }
          toast.success('Treatment plan removed!')
        } catch (err) {
          toast.error('Failed to delete treatment plan.')
        }
      }
    })
  }

  const getPatientDisplayName = (record) => {
    if (record.patientName && record.patientName.trim() !== '' && record.patientName !== 'Client Patient' && record.patientName !== 'John Miller') {
      return record.patientName.trim()
    }
    const match = store.patients?.find(p => p.id === record.patientId || p.id === record.patientName || p.name === record.patientName || p.fullName === record.patientName)
    if (match) {
      return match.fullName || match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim() || 'Patient'
    }
    return record.patientName || 'Patient'
  }

  const columns = [
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>,
      key: 'patientName',
      render: (_, record) => <span className="font-bold text-slate-700 dark:text-slate-200">{getPatientDisplayName(record)}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Plan Title & Exercises</span>,
      key: 'programName',
      render: (_, record) => {
        const exercises = Array.isArray(record.exercises) ? record.exercises : []
        const count = exercises.length > 0 ? exercises.length : 1
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">{record.programName || record.name || 'Treatment Plan'}</span>
              <Tag color="purple" className="m-0 border-none font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                {count} {count === 1 ? 'Exercise' : 'Exercises'}
              </Tag>
            </div>
            {exercises.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {exercises.slice(0, 3).map((ex, i) => (
                  <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                    {ex.name || ex.videoName || `Ex ${i + 1}`}
                  </span>
                ))}
                {exercises.length > 3 && (
                  <span className="text-[10px] text-[#8C4BFF] font-bold">
                    +{exercises.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Date</span>,
      key: 'date',
      render: (_, record) => <span className="text-slate-500 font-semibold">{record.date || (record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : 'Today')}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
      key: 'compliance',
      render: (_, record) => {
        const c = record.compliance || { viewed: false, started: false, completed: false }
        if (c.completed) {
          return <Tag color="success" className="m-0 border-none font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full">Completed</Tag>
        }
        if (c.started) {
          return <Tag color="warning" className="m-0 border-none font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full">Started</Tag>
        }
        if (c.viewed) {
          return <Tag color="blue" className="m-0 border-none font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full">Viewed</Tag>
        }
        return <Tag color="purple" className="m-0 border-none font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full">Active Plan</Tag>
      }
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Actions</span>,
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleOpenManageModal(record)}
            className="rounded-lg font-bold text-xs bg-[#8C4BFF]/10 text-[#8C4BFF] border-none hover:bg-[#8C4BFF]/20"
          >
            Manage Exercises
          </Button>
          <Button 
            size="small" 
            onClick={() => {
              store.updatePrescribedExerciseCompliance(record.id, { completed: true })
              toast.success(`Marked program completed for ${record.patientName}!`)
            }}
            className="rounded-lg font-semibold border-slate-200"
          >
            Complete
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePlan(record.id, record.programName)}
            className="rounded-lg font-semibold border-rose-200 text-rose-500 hover:bg-rose-50"
          />
        </div>
      )
    }
  ]

  const filteredLibrary = exerciseLibrary.filter(ex => selectedBodyPart ? ex.bodyPart === selectedBodyPart : true)

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Treatment Plan & Multi-Exercise Management</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Prescribe multi-exercise home rehabilitation routines, add or remove exercises on-the-fly, and sync with the patient portal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Active Treatment Plans & Reference Library */}
        <div className="lg:col-span-7 space-y-6">
          <Card 
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                  <HeartOutlined style={{ color: '#10B981' }} /> Active Treatment Plans
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {activePrograms.length} {activePrograms.length === 1 ? 'Plan' : 'Plans'} Active
                </span>
              </div>
            }
          >
            <Table 
              dataSource={activePrograms}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 6 }}
              className="bg-white dark:bg-slate-900 overflow-hidden"
              locale={{
                emptyText: (
                  <div className="text-center py-8 space-y-2">
                    <HeartOutlined style={{ fontSize: 24, color: '#94a3b8' }} />
                    <p className="text-xs text-slate-400 font-semibold m-0">No active treatment plans found for this client.</p>
                  </div>
                )
              }}
            />
          </Card>

          {/* Optional Exercise Reference Library */}
          <Card 
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                  <PlayCircleOutlined style={{ color: '#3B82F6' }} /> Exercise Reference Library
                </span>
                
                <Select 
                  placeholder="Filter Body Part"
                  allowClear
                  value={selectedBodyPart}
                  onChange={setSelectedBodyPart}
                  style={{ width: 170, height: 32 }}
                  className="text-xs"
                >
                  <Option value="Lumbar Spine">Lumbar Spine</Option>
                  <Option value="Core Stability">Core Stability</Option>
                  <Option value="Upper Back / Shoulders">Upper Back / Shoulders</Option>
                  <Option value="Neck Stiffness">Neck Stiffness</Option>
                  <Option value="Hip / Lower Limb">Hip / Lower Limb</Option>
                </Select>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredLibrary.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex items-center justify-center text-[#8C4BFF] text-base flex-shrink-0">
                      <PlayCircleOutlined />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{item.name}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{item.bodyPart} &bull; {item.duration}</span>
                    </div>
                  </div>
                  <Button
                    size="small"
                    onClick={() => handleUseLibraryExercise(item)}
                    icon={<PlusOutlined />}
                    className="text-[10px] font-bold rounded-lg h-7 bg-white dark:bg-slate-800 border-slate-200 hover:border-[#8C4BFF] text-[#8C4BFF]"
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 5 Columns: Prescribe Multi-Exercise Plan Form */}
        <div className="lg:col-span-5">
          <Card 
            className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                    <SendOutlined style={{ color: '#8C4BFF' }} /> Prescribe Treatment Plan
                  </span>
                  
                  {/* Point 2: Create With External Platforms (Physitrack / TeleHab) */}
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'physitrack',
                          label: (
                            <span className="font-bold text-xs flex items-center gap-2 py-1 text-slate-700 dark:text-slate-200">
                              <span>🏃‍♂️</span> Open with Physitrack
                            </span>
                          ),
                          onClick: () => {
                            window.open('https://www.physitrack.com', '_blank')
                            toast.success('Connected to Physitrack! External video/exercise links can be pasted into this plan.')
                          }
                        },
                        {
                          key: 'telehab',
                          label: (
                            <span className="font-bold text-xs flex items-center gap-2 py-1 text-slate-700 dark:text-slate-200">
                              <span>💪</span> Open with TeleHab
                            </span>
                          ),
                          onClick: () => {
                            window.open('https://telehab.com', '_blank')
                            toast.success('Connected to TeleHab! External video/exercise links can be pasted into this plan.')
                          }
                        }
                      ]
                    }}
                    trigger={['click']}
                  >
                    <Button 
                      size="small"
                      icon={<LinkOutlined />} 
                      className="rounded-lg text-xs font-bold border-purple-200 dark:border-purple-800 text-[#8C4BFF] hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-1 shadow-xs"
                    >
                      Create With <DownOutlined style={{ fontSize: 9 }} />
                    </Button>
                  </Dropdown>
                </div>

                <span className="text-[11px] bg-[#8C4BFF]/10 text-[#8C4BFF] font-black px-2.5 py-0.5 rounded-full">
                  {exercisesList.length} {exercisesList.length === 1 ? 'Exercise' : 'Exercises'}
                </span>
              </div>
            }
          >
            <Form form={assignForm} layout="vertical" onFinish={handleAssignProgram} initialValues={{ delivery: 'Portal' }}>
              <Form.Item name="patientName" label={<span className="text-xs font-semibold text-slate-500">Client / Patient</span>} rules={[{ required: true, message: 'Please select patient' }]}>
                <Select placeholder="Select patient..." className="rounded-xl h-10 flex items-center">
                  {store.patients.map(p => (
                    <Option key={p.id} value={p.id}>{p.fullName || p.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="programName" label={<span className="text-xs font-semibold text-slate-500">Plan Title</span>} rules={[{ required: true, message: 'Please enter plan title' }]}>
                <Input placeholder="e.g. Lumbar Stabilization & Functional Rehab Routine" className="rounded-xl h-10" />
              </Form.Item>

              {/* Multi-Exercise Dynamic Container */}
              <div className="space-y-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Exercises in this Plan ({exercisesList.length})
                  </span>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddExerciseRow}
                    className="rounded-lg text-xs font-bold text-[#8C4BFF] border-[#8C4BFF]/40 hover:border-[#8C4BFF]"
                  >
                    Add Exercise
                  </Button>
                </div>

                {exercisesList.map((exercise, idx) => (
                  <div key={exercise.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-150 dark:border-slate-850">
                      <span className="font-extrabold text-xs text-[#8C4BFF] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#8C4BFF] text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        Exercise #{idx + 1}
                      </span>
                      {exercisesList.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveExerciseRow(idx)}
                          className="text-xs text-rose-500 hover:bg-rose-50 rounded-md"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Exercise Title / Name *</label>
                      <Input 
                        placeholder="e.g. Cat-Cow Lumbar Mobilisation" 
                        value={exercise.name} 
                        onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">Sets</label>
                        <InputNumber 
                          min={1} 
                          max={20} 
                          value={exercise.sets} 
                          onChange={val => handleExerciseChange(idx, 'sets', val)}
                          className="w-full rounded-xl text-xs" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">Reps / Hold</label>
                        <InputNumber 
                          min={1} 
                          max={120} 
                          value={exercise.reps} 
                          onChange={val => handleExerciseChange(idx, 'reps', val)}
                          className="w-full rounded-xl text-xs" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">Frequency</label>
                        <Input 
                          placeholder="e.g. Daily" 
                          value={exercise.frequency} 
                          onChange={e => handleExerciseChange(idx, 'frequency', e.target.value)}
                          className="rounded-xl text-xs h-8"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Video Link (Optional YouTube / Vimeo / Physitrack)</label>
                      <Input 
                        placeholder="https://youtu.be/... or Physitrack video ID" 
                        value={exercise.videoUrl} 
                        onChange={e => handleExerciseChange(idx, 'videoUrl', e.target.value)}
                        prefix={<VideoCameraOutlined className="text-slate-400 text-xs" />}
                        className="rounded-xl text-xs h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Clinical Instructions</label>
                      <TextArea 
                        rows={2} 
                        placeholder="e.g. Keep spine neutral, avoid sharp pain..." 
                        value={exercise.instructions} 
                        onChange={e => handleExerciseChange(idx, 'instructions', e.target.value)}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={handleAddExerciseRow}
                  className="rounded-xl h-10 font-bold text-xs text-[#8C4BFF] border-[#8C4BFF]/30 hover:border-[#8C4BFF] bg-purple-50/20"
                >
                  + Add Another Exercise to Plan
                </Button>
              </div>

              <Form.Item name="delivery" label={<span className="text-xs font-semibold text-slate-500">Delivery Channel</span>}>
                <Select className="rounded-xl h-10 flex items-center">
                  <Option value="Portal">Patient Portal & App</Option>
                  <Option value="Email">Direct Email PDF</Option>
                  <Option value="SMS">SMS Link</Option>
                </Select>
              </Form.Item>

              <Form.Item name="instructions" label={<span className="text-xs font-semibold text-slate-500">Overall Plan Summary & Notes</span>}>
                <TextArea rows={2} placeholder="e.g. Review rehabilitation progress in next consultation..." className="rounded-xl" />
              </Form.Item>

              <div className="pt-2">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting} 
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} 
                  className="w-full rounded-xl font-bold h-11 text-white shadow-md text-sm flex items-center justify-center gap-2"
                >
                  <SendOutlined /> Assign Treatment Plan ({exercisesList.length} {exercisesList.length === 1 ? 'Exercise' : 'Exercises'})
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>

      {/* View & Manage Ongoing Treatment Plan Modal (Add / Remove on-the-fly) */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-6">
            <span className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <HeartOutlined style={{ color: '#8C4BFF' }} />
              {selectedPlan?.programName || 'Treatment Plan Details'}
            </span>
            <Tag color="purple" className="font-bold text-xs rounded-full px-3 py-0.5">
              {Array.isArray(selectedPlan?.exercises) ? selectedPlan.exercises.length : 1} Exercises
            </Tag>
          </div>
        }
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        footer={
          <div className="flex justify-between items-center w-full">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeletePlan(selectedPlan?.id, selectedPlan?.programName)}
              className="rounded-xl font-bold text-xs"
            >
              Delete Plan
            </Button>
            <Button 
              type="primary" 
              onClick={() => setManageModalVisible(false)}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-xl font-bold text-xs px-6"
            >
              Done
            </Button>
          </div>
        }
        width={700}
      >
        <div className="space-y-4 py-2">
          {/* Metadata Row */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex flex-wrap justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 font-semibold">Client:</span>{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPlan ? getPatientDisplayName(selectedPlan) : '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Practitioner:</span>{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPlan?.practitionerName || 'Dr. Sarah Jenkins'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Date:</span>{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPlan?.date || 'Today'}</span>
            </div>
          </div>

          {/* Exercises in Plan */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider m-0">
                Prescribed Exercises
              </h4>
              {!showAddExInline && (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddExInline(true)}
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                  className="rounded-lg font-bold text-xs"
                >
                  + Add Exercise on-the-fly
                </Button>
              )}
            </div>

            {/* Inline Add Exercise Form inside Modal */}
            {showAddExInline && (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-[#8C4BFF] flex items-center gap-1">
                    <PlusOutlined /> Add New Exercise to Active Plan
                  </span>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseCircleOutlined />} 
                    onClick={() => setShowAddExInline(false)}
                    className="text-slate-400 hover:text-slate-600"
                  />
                </div>
                <Form form={newExForm} layout="vertical" onFinish={handleAddExerciseToOngoingPlan} initialValues={{ sets: 3, reps: 10, frequency: 'Daily' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Form.Item name="name" label={<span className="text-[11px] font-semibold text-slate-500">Exercise Name</span>} rules={[{ required: true, message: 'Please enter exercise name' }]} className="mb-2">
                      <Input placeholder="e.g. Scapular Retraction" className="rounded-xl text-xs h-9" />
                    </Form.Item>
                    <Form.Item name="videoUrl" label={<span className="text-[11px] font-semibold text-slate-500">Video Link (Optional)</span>} className="mb-2">
                      <Input placeholder="https://youtu.be/..." className="rounded-xl text-xs h-9" />
                    </Form.Item>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <Form.Item name="sets" label={<span className="text-[10px] font-semibold text-slate-400">Sets</span>} className="mb-0">
                      <InputNumber min={1} max={20} className="w-full rounded-xl text-xs" />
                    </Form.Item>
                    <Form.Item name="reps" label={<span className="text-[10px] font-semibold text-slate-400">Reps / Hold</span>} className="mb-0">
                      <InputNumber min={1} max={120} className="w-full rounded-xl text-xs" />
                    </Form.Item>
                    <Form.Item name="frequency" label={<span className="text-[10px] font-semibold text-slate-400">Frequency</span>} className="mb-0">
                      <Input placeholder="Daily" className="rounded-xl text-xs h-8" />
                    </Form.Item>
                  </div>
                  <Form.Item name="instructions" label={<span className="text-[10px] font-semibold text-slate-400">Instructions</span>} className="mb-3">
                    <Input.TextArea rows={2} placeholder="Clinical guidance for patient..." className="rounded-xl text-xs" />
                  </Form.Item>
                  <div className="flex justify-end gap-2">
                    <Button size="small" onClick={() => setShowAddExInline(false)} className="rounded-lg text-xs font-semibold">
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" size="small" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-lg text-xs font-bold">
                      Add to Plan
                    </Button>
                  </div>
                </Form>
              </div>
            )}

            {/* Existing Exercises list in modal */}
            {Array.isArray(selectedPlan?.exercises) && selectedPlan.exercises.length > 0 ? (
              selectedPlan.exercises.map((ex, idx) => (
                <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#8C4BFF]/10 text-[#8C4BFF] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                        {ex.name || ex.videoName || `Exercise ${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-semibold">
                        <span>{ex.sets || 3} Sets &bull; {ex.reps || 10} Reps</span>
                        <span>&bull;</span>
                        <span className="text-[#8C4BFF]">{ex.frequency || 'Daily'}</span>
                        {ex.videoUrl && (
                          <>
                            <span>&bull;</span>
                            <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              <PlayCircleOutlined /> Video
                            </a>
                          </>
                        )}
                      </div>
                      {ex.instructions && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic m-0">
                          "{ex.instructions}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    type="text" 
                    danger 
                    size="small" 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleRemoveExerciseFromOngoingPlan(idx)}
                    className="text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-xs text-slate-400 font-semibold">
                No exercise items found in this plan.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
