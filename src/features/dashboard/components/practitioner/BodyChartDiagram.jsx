import React, { useState, useEffect } from 'react'
import { Card, Button, Form, Input, Select, Slider, Tag, Table, Space, Badge, Modal, Tooltip, Popover } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { getBodyChartTemplates } from '../../../calendar/api/clinicAdminApi'

const { Option } = Select
const { TextArea } = Input

const BODY_REGIONS = [
  { id: 'head', name: 'Head & Cranium', view: 'front', x: 50, y: 12 },
  { id: 'neck', name: 'Neck / Cervical Spine', view: 'front', x: 50, y: 22 },
  { id: 'l_shoulder', name: 'Left Shoulder', view: 'front', x: 30, y: 28 },
  { id: 'r_shoulder', name: 'Right Shoulder', view: 'front', x: 70, y: 28 },
  { id: 'chest', name: 'Chest / Thorax', view: 'front', x: 50, y: 35 },
  { id: 'abdomen', name: 'Abdomen / Core', view: 'front', x: 50, y: 48 },
  { id: 'l_arm', name: 'Left Arm / Elbow / Wrist', view: 'front', x: 22, y: 45 },
  { id: 'r_arm', name: 'Right Arm / Elbow / Wrist', view: 'front', x: 78, y: 45 },
  { id: 'hips', name: 'Pelvis / Hips', view: 'front', x: 50, y: 60 },
  { id: 'l_knee', name: 'Left Knee', view: 'front', x: 38, y: 78 },
  { id: 'r_knee', name: 'Right Knee', view: 'front', x: 62, y: 78 },
  { id: 'l_ankle', name: 'Left Ankle / Foot', view: 'front', x: 38, y: 92 },
  { id: 'r_ankle', name: 'Right Ankle / Foot', view: 'front', x: 62, y: 92 },

  // Back View
  { id: 'occiput', name: 'Occiput / Head (Back)', view: 'back', x: 50, y: 12 },
  { id: 'c_spine', name: 'Cervical Spine (C1-C7)', view: 'back', x: 50, y: 22 },
  { id: 'upper_back', name: 'Upper Back / Thoracic Spine', view: 'back', x: 50, y: 35 },
  { id: 'lower_back', name: 'Lower Back / Lumbar Spine (L1-L5)', view: 'back', x: 50, y: 50 },
  { id: 'sacrum', name: 'Sacrum / Glutes', view: 'back', x: 50, y: 62 },
  { id: 'l_scapula', name: 'Left Scapula', view: 'back', x: 32, y: 30 },
  { id: 'r_scapula', name: 'Right Scapula', view: 'back', x: 68, y: 30 },
  { id: 'l_hamstring', name: 'Left Hamstring', view: 'back', x: 40, y: 75 },
  { id: 'r_hamstring', name: 'Right Hamstring', view: 'back', x: 60, y: 75 },
  { id: 'l_calf', name: 'Left Calf / Achilles', view: 'back', x: 40, y: 88 },
  { id: 'r_calf', name: 'Right Calf / Achilles', view: 'back', x: 60, y: 88 }
]

const CONDITION_TYPES = [
  'Pain / Discomfort',
  'Tenderness / Soreness',
  'Stiffness / Restricted ROM',
  'Numbness / Paresthesia',
  'Swelling / Inflammation',
  'Weakness / Instability',
  'Trigger Point / Spasm'
]

export default function BodyChartDiagram({ value = [], onChange, readOnly = false }) {
  const [activeView, setActiveView] = useState('front')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [editingFinding, setEditingFinding] = useState(null)
  const [form] = Form.useForm()

  // Live Body Chart Templates dropdown state
  const [templatesList, setTemplatesList] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const res = await getBodyChartTemplates()
        if (res && res.success && Array.isArray(res.data)) {
          setTemplatesList(res.data)
        }
      } catch (err) {
        console.warn('Body chart templates fetch notice:', err?.message)
      } finally {
        setLoadingTemplates(false)
      }
    }
    loadTemplates()
  }, [])

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId)
    const found = templatesList.find(t => t.id === templateId)
    if (found) {
      toast.success(`Loaded Body Chart Template: "${found.name}"`)
    }
  }

  const findings = Array.isArray(value) ? value : []

  const handleRegionClick = (region) => {
    if (readOnly) return
    setSelectedRegion(region)
    form.resetFields()
    form.setFieldsValue({
      regionName: region.name,
      condition: 'Pain / Discomfort',
      severity: 5,
      notes: ''
    })
  }

  const handleAddFinding = (values) => {
    if (!selectedRegion && !editingFinding) {
      toast.error('Please select a body region first')
      return
    }

    const regionInfo = selectedRegion || BODY_REGIONS.find(r => r.name === values.regionName)

    const newFinding = {
      id: editingFinding ? editingFinding.id : `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      regionId: regionInfo?.id || 'general',
      regionName: values.regionName || regionInfo?.name || 'General Body Area',
      view: regionInfo?.view || activeView,
      x: regionInfo?.x || 50,
      y: regionInfo?.y || 50,
      condition: values.condition,
      severity: values.severity || 5,
      notes: values.notes || '',
      recordedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    let updatedList = []
    if (editingFinding) {
      updatedList = findings.map(f => f.id === editingFinding.id ? newFinding : f)
      toast.success(`Updated clinical finding for ${newFinding.regionName}`)
    } else {
      updatedList = [newFinding, ...findings]
      toast.success(`Added clinical finding for ${newFinding.regionName}`)
    }

    if (onChange) onChange(updatedList)
    setSelectedRegion(null)
    setEditingFinding(null)
    form.resetFields()
  }

  const handleDeleteFinding = (id) => {
    if (readOnly) return
    const updatedList = findings.filter(f => f.id !== id)
    if (onChange) onChange(updatedList)
    toast.success('Clinical finding removed')
  }

  const handleEditFinding = (finding) => {
    if (readOnly) return
    setEditingFinding(finding)
    const region = BODY_REGIONS.find(r => r.id === finding.regionId)
    setSelectedRegion(region || { id: finding.regionId, name: finding.regionName, view: finding.view, x: finding.x, y: finding.y })
    form.setFieldsValue({
      regionName: finding.regionName,
      condition: finding.condition,
      severity: finding.severity,
      notes: finding.notes
    })
  }

  const getSeverityBadgeColor = (severity) => {
    if (severity >= 8) return '#EF4444' // Red
    if (severity >= 5) return '#F59E0B' // Amber
    return '#10B981' // Green
  }

  const filteredRegions = BODY_REGIONS.filter(r => r.view === activeView)

  return (
    <div className="space-y-6 font-sans">
      {/* Top Bar: View Toggle, Template Selector & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase text-[#8C4BFF] tracking-widest block">Interactive Clinical Assessment</span>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white m-0">Patient Body Chart Findings</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Body Chart Template Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Template:</span>
            <Select
              placeholder="Select Saved Template"
              value={selectedTemplateId}
              onChange={handleSelectTemplate}
              loading={loadingTemplates}
              allowClear
              className="w-48 text-xs rounded-xl"
              size="small"
            >
              {templatesList.map(tmpl => (
                <Option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </Option>
              ))}
            </Select>
          </div>

          <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setActiveView('front')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                activeView === 'front'
                  ? 'bg-white dark:bg-slate-900 text-[#8C4BFF] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent'
              }`}
            >
              Anterior (Front)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('back')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                activeView === 'back'
                  ? 'bg-white dark:bg-slate-900 text-[#8C4BFF] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent'
              }`}
            >
              Posterior (Back)
            </button>
          </div>

          <Tag color="purple" className="m-0 font-bold px-3 py-1 rounded-xl text-xs">
            {findings.length} Finding{findings.length === 1 ? '' : 's'} Recorded
          </Tag>
        </div>
      </div>

      {/* Main Grid: Body Diagram + Finding Input/List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Anatomical Body Diagram (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center relative min-h-[460px] shadow-sm">
          <span className="absolute top-3 left-4 text-[10px] uppercase font-bold text-slate-400">
            {activeView === 'front' ? 'Anterior View' : 'Posterior View'} — Click region to record
          </span>

          {/* SVG Silhouette Container */}
          <div className="w-[240px] h-[400px] relative border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-2 flex items-center justify-center bg-slate-50/50 dark:bg-slate-850/30">
            
            {/* Anatomical Outline SVG */}
            <svg viewBox="0 0 100 200" className="w-full h-full text-slate-300 dark:text-slate-700 stroke-current fill-slate-100 dark:fill-slate-850">
              {/* Head */}
              <circle cx="50" cy="20" r="12" strokeWidth="1.5" />
              {/* Neck */}
              <rect x="46" y="32" width="8" height="10" rx="2" strokeWidth="1.5" />
              {/* Torso */}
              <path d="M 30 42 L 70 42 L 64 110 L 36 110 Z" strokeWidth="1.5" />
              {/* Arms */}
              <path d="M 28 44 L 14 105 A 4 4 0 0 0 22 107 L 34 52 Z" strokeWidth="1.5" />
              <path d="M 72 44 L 86 105 A 4 4 0 0 1 78 107 L 66 52 Z" strokeWidth="1.5" />
              {/* Legs */}
              <path d="M 36 110 L 33 185 A 5 5 0 0 0 44 185 L 48 110 Z" strokeWidth="1.5" />
              <path d="M 64 110 L 67 185 A 5 5 0 0 1 56 185 L 52 110 Z" strokeWidth="1.5" />
            </svg>

            {/* Clickable Region Hotspots */}
            {filteredRegions.map((region) => {
              const regionFinding = findings.find(f => f.regionId === region.id || f.regionName === region.name)
              const isSelected = selectedRegion?.id === region.id

              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleRegionClick(region)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-none cursor-pointer transition-all duration-200 flex items-center justify-center font-bold text-[10px] shadow-md ${
                    regionFinding
                      ? 'w-7 h-7 ring-4 ring-white dark:ring-slate-900 text-white animate-pulse'
                      : isSelected
                      ? 'w-6 h-6 bg-[#8C4BFF] text-white ring-2 ring-purple-300'
                      : 'w-4.5 h-4.5 bg-slate-300 dark:bg-slate-700 hover:bg-[#8C4BFF] hover:scale-125 text-transparent hover:text-white'
                  }`}
                  style={{
                    left: `${region.x}%`,
                    top: `${(region.y / 100) * 100}%`,
                    backgroundColor: regionFinding ? getSeverityBadgeColor(regionFinding.severity) : undefined
                  }}
                  title={`${region.name}${regionFinding ? `: ${regionFinding.condition} (${regionFinding.severity}/10)` : ''}`}
                >
                  {regionFinding ? regionFinding.severity : ''}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Mild (1-4)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Moderate (5-7)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Severe (8-10)</span>
          </div>
        </div>

        {/* Right Column: Finding Form & List (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Finding Form */}
          {!readOnly && (selectedRegion || editingFinding) && (
            <Card
              className="border border-[#8C4BFF]/30 dark:border-[#8C4BFF]/40 dark:bg-slate-900 rounded-2xl shadow-sm bg-purple-50/20"
              title={
                <span className="font-extrabold text-sm text-[#8C4BFF] flex items-center gap-2">
                  <EnvironmentOutlined /> {editingFinding ? `Edit Finding: ${editingFinding.regionName}` : `Record Finding for ${selectedRegion?.name}`}
                </span>
              }
              extra={
                <Button
                  size="small"
                  type="text"
                  onClick={() => { setSelectedRegion(null); setEditingFinding(null); form.resetFields() }}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </Button>
              }
            >
              <Form form={form} layout="vertical" onFinish={handleAddFinding} className="space-y-4">
                <Form.Item name="regionName" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Body Region</span>} rules={[{ required: true }]}>
                  <Input readOnly className="rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-none" />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item name="condition" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Condition / Finding Type</span>} rules={[{ required: true }]}>
                    <Select className="rounded-xl font-semibold">
                      {CONDITION_TYPES.map(c => (
                        <Option key={c} value={c}>{c}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="severity" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Pain / Severity Rating (1-10)</span>}>
                    <Slider min={1} max={10} marks={{ 1: '1', 5: '5', 10: '10' }} />
                  </Form.Item>
                </div>

                <Form.Item name="notes" label={<span className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinical Details / Observations</span>}>
                  <TextArea rows={2} placeholder="Describe symptom triggers, palpatory findings, range of motion restrictions..." className="rounded-xl" />
                </Form.Item>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<PlusOutlined />}
                    className="rounded-xl font-bold border-none text-white h-9 px-5"
                    style={{ backgroundColor: '#8C4BFF' }}
                  >
                    {editingFinding ? 'Update Finding' : 'Save Finding to Consultation'}
                  </Button>
                </div>
              </Form>
            </Card>
          )}

          {/* Saved Findings Table */}
          <Card
            className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-sm"
            title={<span className="font-extrabold text-sm text-slate-800 dark:text-white">Consultation Body Chart Summary</span>}
          >
            {findings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                No body chart findings recorded for this consultation session.
                {!readOnly && <span className="block mt-1 text-[#8C4BFF] font-bold">Click any body region on the diagram to add a finding.</span>}
              </div>
            ) : (
              <div className="space-y-3">
                {findings.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{f.regionName}</span>
                        <Tag color={f.severity >= 8 ? 'red' : f.severity >= 5 ? 'orange' : 'green'} className="font-bold rounded-lg border-none text-[10px]">
                          Severity {f.severity}/10
                        </Tag>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{f.condition}</span>
                      </div>
                      {f.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-350 m-0 italic leading-relaxed">
                          "{f.notes}"
                        </p>
                      )}
                    </div>

                    {!readOnly && (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditFinding(f)}
                          className="rounded-lg text-xs font-semibold"
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteFinding(f.id)}
                          className="rounded-lg text-xs font-semibold"
                        />
                      </Space>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  )
}
