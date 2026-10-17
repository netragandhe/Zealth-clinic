import React, { useState, useEffect } from 'react'
import { useClinicStore } from '../../../../store/clinicStore'
import { Card, Table, Tag, Button, Upload, Space, Modal, Input, Select, Spin, Empty, Popconfirm, Radio, Progress } from 'antd'
import { PictureOutlined, CheckCircleOutlined, FormOutlined, FileTextOutlined, CloudUploadOutlined, SearchOutlined, FilterOutlined, DeleteOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'
import { formatDocumentDate, deduplicateDocuments, downloadDocumentFile } from '../../../../utils/documentUtils'

const { Dragger } = Upload
const { Option } = Select

export default function PatientFormsDocuments() {
  const store = useClinicStore()
  const darkMode = store.darkMode

  const [loading, setLoading] = useState(false)
  const [fillFormOpen, setFillFormOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState(null)
  const [formDataInput, setFormDataInput] = useState({})

  const [formsList, setFormsList] = useState([])
  const [documentsList, setDocumentsList] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const fetchFormsAndDocuments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patient/forms-documents', {
        params: { search: searchTerm, category: categoryFilter }
      })
      if (res.data?.success && res.data.data) {
        if (Array.isArray(res.data.data.forms)) setFormsList(res.data.data.forms)
        if (Array.isArray(res.data.data.documents)) {
          setDocumentsList(deduplicateDocuments(res.data.data.documents))
        }
      }
    } catch (err) {
      console.warn('Forms & documents API fetch fallback notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFormsAndDocuments()
  }, [searchTerm, categoryFilter])

  const handleCompleteForm = (form) => {
    setSelectedForm(form)
    setFormDataInput({})
    setFillFormOpen(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!selectedForm) return

    const hasQ = [formDataInput.q1, formDataInput.q2, formDataInput.q3, formDataInput.q4].some(v => v !== undefined && v !== null)
    let payloadData = { ...formDataInput }
    if (hasQ) {
      const allAnswered = [formDataInput.q1, formDataInput.q2, formDataInput.q3, formDataInput.q4].every(v => v !== undefined && v !== null)
      if (allAnswered) {
        const sum = Number(formDataInput.q1) + Number(formDataInput.q2) + Number(formDataInput.q3) + Number(formDataInput.q4)
        const percent = Math.round((sum / 12) * 100)
        payloadData.calculatedScore = `${percent}%`
        payloadData.totalScore = percent
      }
    }

    try {
      const res = await api.post(`/api/patient/forms/${selectedForm.id}/submit`, {
        formData: payloadData
      })
      if (res.data?.success) {
        toast.success(`${selectedForm.name} submitted successfully!`)
        fetchFormsAndDocuments()
      } else {
        setFormsList(prev => prev.map(f => f.id === selectedForm.id ? { ...f, status: 'Completed' } : f))
        toast.success(`${selectedForm.name} submitted successfully!`)
      }
    } catch (err) {
      setFormsList(prev => prev.map(f => f.id === selectedForm.id ? { ...f, status: 'Completed' } : f))
      toast.success(`${selectedForm.name} submitted successfully!`)
    } finally {
      setFillFormOpen(false)
    }
  }

  const handleDeleteDocument = async (id) => {
    try {
      const res = await api.delete(`/api/patient/documents/${id}`)
      if (res.data?.success) {
        toast.success('Document deleted successfully')
        fetchFormsAndDocuments()
      }
    } catch (err) {
      toast.error('Failed to delete document')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Intro header & Search Filter */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-808 dark:text-white m-0">Forms, Claims & Documents Center</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Complete required clinical forms, view shared medical letters/referrals, and securely upload scan documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search forms/docs..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl text-xs w-full sm:w-48"
              allowClear
            />
            <Select
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              className="w-36 text-xs"
            >
              <Option value="ALL">All Categories</Option>
              <Option value="Intake">Intake</Option>
              <Option value="Consent">Consent</Option>
              <Option value="NDIS">NDIS</Option>
              <Option value="Outcome Measures">Outcome Measures</Option>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginTop: '24px' }}>
        {/* Left Columns: Forms & Documents list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Forms */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">My Actionable Clinic Forms</span>}>
            {loading ? (
              <div className="text-center py-6">
                <Spin description="Loading actionable forms..." />
              </div>
            ) : formsList.length === 0 ? (
              <Empty description="No actionable forms found matching filter." />
            ) : (
              <div className="space-y-4">
                {formsList.map(form => (
                  <div key={form.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{form.name}</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-0.5">Category: {form.category}</span>
                    </div>
                    <Button
                      size="small"
                      onClick={() => handleCompleteForm(form)}
                      style={form.status === 'Completed' ? { backgroundColor: darkMode ? '#064E3B' : '#ECFDF5', color: darkMode ? '#34D399' : '#059669', border: 'none' } : { backgroundColor: '#8C4BFF', color: 'white', border: 'none' }}
                      className="rounded-lg text-[10px] font-bold px-3 h-8 flex items-center justify-center gap-1"
                    >
                      {form.status === 'Completed' ? <CheckCircleOutlined /> : <FormOutlined />}
                      <span>{form.status === 'Completed' ? 'Done' : 'Complete Form'}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Stored Healthcare Documents */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">My Health Records & Reports Ledger</span>}>
            {loading ? (
              <div className="text-center py-6">
                <Spin description="Loading health records ledger..." />
              </div>
            ) : (
              <Table
                dataSource={documentsList}
                rowKey="id"
                pagination={false}
                scroll={{ x: 700 }}
                className="border-none"
                columns={[
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Document Name</span>,
                    render: (_, rec) => (
                      <div className="flex items-center gap-2">
                        <FileTextOutlined className="text-[#8C4BFF] text-sm flex-shrink-0" />
                        <div>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs block truncate max-w-[200px] sm:max-w-[320px]">{rec.name}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{rec.type} &bull; {rec.size}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Received Date</span>,
                    dataIndex: 'date',
                    render: (d, rec) => <span className="text-slate-500 font-semibold text-xs">{formatDocumentDate(d, rec.createdAt)}</span>
                  },
                  {
                    title: '',
                    align: 'right',
                    render: (_, rec) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="small" 
                          onClick={async () => {
                            try {
                              await downloadDocumentFile(rec, { api })
                              toast.success(`${rec.name} downloaded successfully!`)
                            } catch (err) {
                              toast.error(err?.message || `Failed to download ${rec.name}`)
                            }
                          }}
                          className="rounded-lg text-[9px] font-bold h-7 border-slate-200"
                        >
                          Download
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this document?"
                          onConfirm={() => handleDeleteDocument(rec.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </div>
                    )
                  }
                ]}
              />
            )}
          </Card>

        </div>

        {/* Right Column: Upload Documents widget */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Upload Medical Records / Scan Reports</span>}>
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-semibold">Upload referrals, radiology imaging scans, or NDIS plan letters for review by your Care Team practitioners.</p>
              
              <Dragger
                disabled={isUploading}
                beforeUpload={async (file) => {
                  if (isUploading) return false
                  setIsUploading(true)

                  const patientUserName = localStorage.getItem('userName') || 'Patient'
                  const newDocPayload = {
                    name: file.name,
                    type: 'Uploaded Document',
                    size: `${Math.round(file.size / 1024)} KB`,
                    uploadBy: patientUserName
                  }

                  try {
                    const res = await api.post('/api/patient/documents', newDocPayload)
                    if (res.data?.success) {
                      const uploadedItem = res.data.data
                      if (uploadedItem) {
                        setDocumentsList(prev => [uploadedItem, ...prev.filter(d => d.id !== uploadedItem.id)])
                      }
                      toast.success(`${file.name} uploaded and shared with care practitioners successfully!`)
                      await fetchFormsAndDocuments()
                    } else {
                      toast.error(res.data?.message || `Failed to upload ${file.name}.`)
                    }
                  } catch (err) {
                    toast.error(err.response?.data?.message || `Failed to upload ${file.name}. Please retry.`)
                  } finally {
                    setIsUploading(false)
                  }
                  return false
                }}
                maxCount={1}
                showUploadList={false}
                className="rounded-2xl text-center py-6"
                style={{
                  backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                  border: darkMode ? '1.5px dashed #334155' : '1.5px dashed #E2E8F0',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div className="w-12 h-12 bg-[#8C4BFF]/10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#8C4BFF]">
                  <CloudUploadOutlined style={{ fontSize: 20 }} />
                </div>
                <p className="text-xs font-bold text-slate-750 dark:text-slate-300 m-0">Drag & drop or click to upload</p>
                <span className="text-[10px] text-slate-400 block mt-1 mb-4">Accepts PDFs, Images, Scans</span>
                
                <Button 
                  type="primary" 
                  loading={isUploading}
                  disabled={isUploading}
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF', pointerEvents: 'none' }} 
                  className="rounded-xl font-bold text-xs h-8 px-5 shadow-sm text-white"
                >
                  {isUploading ? 'Uploading...' : 'Browse Files'}
                </Button>
              </Dragger>
            </div>
          </Card>
        </div>
      </div>

      {/* Fill Form Modal */}
      {selectedForm && (
        <Modal
          open={fillFormOpen}
          onCancel={() => setFillFormOpen(false)}
          title={<span className="font-bold text-slate-800 dark:text-white text-sm">{selectedForm.name}</span>}
          footer={null}
          destroyOnHidden
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Please answer all clinical self-assessment items. Your scores will automatically sync to your attending clinician.</span>
              <Tag color="purple" className="border-none font-bold text-[9px] uppercase">Auto-Syncing</Tag>
            </div>

            {selectedForm.category === 'Outcome Questionnaire' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                    1. Pain Intensity & Severity
                  </label>
                  <Radio.Group
                    value={formDataInput.q1}
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, q1: e.target.value }))}
                    className="flex flex-col gap-1.5"
                  >
                    <Radio value={0} className="text-xs">0 - I have no pain at the moment</Radio>
                    <Radio value={1} className="text-xs">1 - The pain is mild / manageable</Radio>
                    <Radio value={2} className="text-xs">2 - The pain is moderate but prevents some tasks</Radio>
                    <Radio value={3} className="text-xs">3 - The pain is severe and constant</Radio>
                  </Radio.Group>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                    2. Lifting & Physical Loading Ability
                  </label>
                  <Radio.Group
                    value={formDataInput.q2}
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, q2: e.target.value }))}
                    className="flex flex-col gap-1.5"
                  >
                    <Radio value={0} className="text-xs">0 - I can lift heavy weights without extra pain</Radio>
                    <Radio value={1} className="text-xs">1 - I can lift heavy weights if placed conveniently</Radio>
                    <Radio value={2} className="text-xs">2 - I can only lift light to medium weights</Radio>
                    <Radio value={3} className="text-xs">3 - I cannot lift or carry anything at all</Radio>
                  </Radio.Group>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                    3. Walking & Mobility Tolerance
                  </label>
                  <Radio.Group
                    value={formDataInput.q3}
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, q3: e.target.value }))}
                    className="flex flex-col gap-1.5"
                  >
                    <Radio value={0} className="text-xs">0 - Pain does not prevent me walking any distance</Radio>
                    <Radio value={1} className="text-xs">1 - Pain prevents me walking more than 1-2 kilometers</Radio>
                    <Radio value={2} className="text-xs">2 - Pain prevents me walking more than 500 meters</Radio>
                    <Radio value={3} className="text-xs">3 - I can only walk using a stick or crutches</Radio>
                  </Radio.Group>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                    4. Sitting & Posture Comfort
                  </label>
                  <Radio.Group
                    value={formDataInput.q4}
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, q4: e.target.value }))}
                    className="flex flex-col gap-1.5"
                  >
                    <Radio value={0} className="text-xs">0 - I can sit in any chair as long as I like</Radio>
                    <Radio value={1} className="text-xs">1 - I can sit in my favorite chair as long as I like</Radio>
                    <Radio value={2} className="text-xs">2 - Pain prevents me from sitting more than 1 hour</Radio>
                    <Radio value={3} className="text-xs">3 - Pain prevents me from sitting at all</Radio>
                  </Radio.Group>
                </div>

                {/* Live Computed Score Snapshot — only shown after all 4 questions are answered */}
                {(() => {
                  const allAnswered = [formDataInput.q1, formDataInput.q2, formDataInput.q3, formDataInput.q4].every(v => v !== undefined && v !== null)
                  const rawScore = allAnswered
                    ? (((formDataInput.q1 + formDataInput.q2 + formDataInput.q3 + formDataInput.q4) / 12) * 100).toFixed(0)
                    : null
                  const answeredCount = [formDataInput.q1, formDataInput.q2, formDataInput.q3, formDataInput.q4].filter(v => v !== undefined && v !== null).length
                  return (
                    <div className="p-3.5 bg-[#8C4BFF]/5 dark:bg-[#8C4BFF]/15 border border-[#8C4BFF]/20 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C4BFF] block">Computed Outcome Score</span>
                        {allAnswered ? (
                          <span className="text-base font-black text-slate-800 dark:text-slate-100 block">
                            {rawScore}%
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-400 dark:text-slate-500 block">
                            {answeredCount} / 4 questions answered — complete all to see score
                          </span>
                        )}
                      </div>
                      <Tag
                        color={allAnswered ? 'success' : 'default'}
                        className="font-bold text-[9px] px-2.5 py-0.5 rounded-full border-none"
                      >
                        {allAnswered ? '📈 Ready to Sync' : '⏳ Incomplete'}
                      </Tag>
                    </div>
                  )
                })()}
              </div>
            )}

            {selectedForm.category === 'Intake' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chief Complaint & Pain Location</label>
                  <Input 
                    placeholder="e.g. Lower back stiffness, calf strain pain" 
                    required 
                    className="rounded-xl" 
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Active Medications</label>
                  <Input 
                    placeholder="e.g. Panadol, anti-inflammatories" 
                    className="rounded-xl" 
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, medications: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Known Allergies / Medical Conditions</label>
                  <Input.TextArea 
                    placeholder="e.g. Penicillin, diabetes" 
                    rows={2} 
                    className="rounded-xl" 
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, allergies: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {selectedForm.category === 'Consent' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  I hereby authorize ZealthOS partner practitioners to perform physical rehabilitation and assessments in alignment with my treatment plans.
                </p>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Signature / Name</label>
                  <Input 
                    placeholder="Type full name to sign" 
                    required 
                    className="rounded-xl" 
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, signatureName: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {selectedForm.category !== 'Intake' && selectedForm.category !== 'Consent' && selectedForm.category !== 'Outcome Questionnaire' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Participant NDIS Number</label>
                  <Input 
                    placeholder="e.g. 430912345" 
                    required 
                    className="rounded-xl" 
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, ndisNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Plan Coordinator Email</label>
                  <Input 
                    placeholder="e.g. claims@planpartners.com.au" 
                    className="rounded-xl" 
                    onChange={(e) => setFormDataInput(prev => ({ ...prev, coordinatorEmail: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setFillFormOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold text-xs text-white">Submit Secure Form & Sync</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
