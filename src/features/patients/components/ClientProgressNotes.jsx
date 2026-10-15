import React, { useState, useEffect } from 'react'
import { Card, Select, Button, Form, Input, Tabs, Tag, Table, Space, Radio, Divider, InputNumber, Badge, Alert, Switch, Modal } from 'antd'
import {
  UserOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HeartOutlined,
  BranchesOutlined,
  DollarOutlined,
  AudioOutlined,
  CheckOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  LinkOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignLeftOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ThunderboltOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { useClinicStore } from '../../../store/clinicStore'
import BodyChartDiagram from '../../dashboard/components/practitioner/BodyChartDiagram'

const { Option } = Select
const { TextArea } = Input

export default function ClientProgressNotes({ patientId: embeddedPatientId = null }) {
  const location = useLocation()
  const navigate = useNavigate()
  const store = useClinicStore()
  const darkMode = store.darkMode

  // Extract patientId from URL query parameters or embedded prop
  const queryParams = new URLSearchParams(location.search)
  const queryProfession = queryParams.get('profession') || queryParams.get('specialty')

  // Get active simulated or actual specialty from logged in practitioner profile
  const loggedInUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const loggedInPrac = (store.practitioners || []).find(p => p.id === loggedInUserId || p.email === store.user?.email)
  const pracSpecialty = loggedInPrac?.specialty || loggedInPrac?.profession || loggedInPrac?.title || store.user?.specialty
  const activeSpecialty = queryProfession || pracSpecialty || (store.getActiveSpecialty ? store.getActiveSpecialty() : (store.simulatedSpecialty || 'Physiotherapy'))
  const isSoapSpecialty = activeSpecialty !== 'Speech Pathologist' && activeSpecialty !== 'Speech Therapist' && activeSpecialty !== 'Occupational Therapist'

  const isNew = queryParams.get('new') === 'true'
  const initialPatientId = isNew ? null : (embeddedPatientId || queryParams.get('patientId') || 'p1')

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId)

  useEffect(() => {
    if (embeddedPatientId && embeddedPatientId !== selectedPatientId) {
      setSelectedPatientId(embeddedPatientId)
    }
  }, [embeddedPatientId])
  const [activeTab, setActiveTab] = useState('notes')



  // AI & Voice Dictation Simulation States
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscription, setLiveTranscription] = useState('')
  const [aiAnalysisResults, setAiAnalysisResults] = useState(null)

  // Custom Progress Notes States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(isSoapSpecialty ? 'Default SOAP Template' : 'Clinical Progress Notes')
  const [noteText, setNoteText] = useState('')
  const [bodyChartFindings, setBodyChartFindings] = useState([])
  const [showBodyDiagram, setShowBodyDiagram] = useState(false)
  const [selectedHistoryNoteId, setSelectedHistoryNoteId] = useState(null)
  const [lastSavedTime, setLastSavedTime] = useState('')
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [aiModalVisible, setAiModalVisible] = useState(false)

  const isPhysiotherapy = Boolean(
    (activeSpecialty && activeSpecialty.toLowerCase().includes('physio')) ||
    (store.simulatedSpecialty && store.simulatedSpecialty.toLowerCase().includes('physio'))
  )

  // Format YYYY-MM-DD date to "Apr 26, 2024" format
  const formatDateString = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.includes('-')) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    }
    return dateStr
  }

  // Get note date display based on selected appointment
  const getNoteDateDisplay = () => {
    if (selectedAppointment && selectedAppointment.includes(' - ')) {
      return selectedAppointment.split(' - ')[0]
    }
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Get history for a patient from DB
  const getPatientNotesHistory = (patientId) => {
    return store.consultations
      .filter(c => c.patientId === patientId)
      .map(c => ({
        id: c.id,
        date: formatDateString(c.date),
        title: c.notes || (c.soap ? 'SOAP Note' : 'Clinical Note'),
        status: c.status === 'Completed' ? 'Final' : c.status,
        content: c.notes || (c.soap ? `S: ${c.soap.subjective}\n\nO: ${c.soap.objective}\n\nA: ${c.soap.assessment}\n\nP: ${c.soap.plan}` : '')
      }))
  }

  // Get display patient ID (clean & dynamic)
  const getPatientDisplayId = (id) => {
    if (!id) return 'P-88415'
    const targetPatient = store.patients?.find(p => p.id === id)
    if (targetPatient?.displayId) return targetPatient.displayId
    if (id === 'p1') return 'P-88412'
    if (id === 'p2') return 'P-88413'
    if (id === 'p3') return 'P-88414'
    const cleanId = String(id).replace(/[^a-zA-Z0-9]/g, '')
    return `P-${cleanId.slice(-5).toUpperCase()}`
  }

  // Get list of appointments for a patient
  const getPatientAppointments = (patientId) => {
    if (!Array.isArray(store.appointments)) return []
    const list = store.appointments
      .filter(a => a && a.patientId === patientId)
      .map(a => `${formatDateString(a?.date)} - ${a?.time || a?.startTime || '10:00 AM'} (${a?.appointmentType || 'Follow-up'})`)
    
    if (list.length === 0) {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return [`${todayStr} - 10:00 AM (Follow-up)`]
    }
    return list
  }

  // Insert formatting at textarea cursor
  const insertAtCursor = (beforeVal, afterVal) => {
    const textarea = document.getElementById('progress-note-editor')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)
    const replacement = beforeVal + selectedText + afterVal
    setNoteText(text.substring(0, start) + replacement + text.substring(end))
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + beforeVal.length, start + beforeVal.length + selectedText.length)
    }, 0)
  }

  // Copy previous final note
  const handleCopyPrevious = () => {
    const history = getPatientNotesHistory(selectedPatientId)
    const previousFinal = history.find(n => n.status === 'Final')
    if (previousFinal) {
      setNoteText(previousFinal.content)
      toast.success('Copied previous final note content!')
    } else {
      toast.error('No previous final note found for this patient.')
    }
  }

  // Copy selected history note
  const handleCopySelected = () => {
    const history = getPatientNotesHistory(selectedPatientId)
    const selectedNote = history.find(n => n.id === selectedHistoryNoteId)
    if (selectedNote) {
      setNoteText(selectedNote.content)
      toast.success('Copied selected note content!')
    } else {
      toast.error('Please select a note from the history log first.')
    }
  }

  // Get selected appointment object helper
  const getSelectedAppointmentObj = () => {
    if (!selectedAppointment || !Array.isArray(store.appointments)) return null
    return store.appointments.find(a => {
      if (!a) return false
      const matchStr = `${formatDateString(a?.date)} - ${a?.time || a?.startTime || '10:00 AM'} (${a?.appointmentType || 'Follow-up'})`
      return matchStr === selectedAppointment && a?.patientId === selectedPatientId
    })
  }

  // Get active logged-in user dynamically from localStorage or store
  const getLoggedInUser = () => {
    try {
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (uStr) {
        const parsed = JSON.parse(uStr)
        if (parsed && (parsed.name || parsed.email)) return parsed
      }
    } catch (e) {}
    return store.user || null
  }

  const loggedInUser = getLoggedInUser()
  const selectedApptObj = getSelectedAppointmentObj()

  const activeDoctorName = selectedApptObj?.practitionerName 
    || loggedInUser?.name 
    || store.user?.name 
    || (store.userRole === 'clinic' ? 'Clinic Manager' : 'Dr. Treating Clinician')

  const activeDoctorId = loggedInUser?.displayId 
    || loggedInUser?.practitionerId 
    || (loggedInUser?.id ? `D-${String(loggedInUser.id).slice(-4).toUpperCase()}` : (store.userRole === 'clinic' ? 'A0912' : 'D-1001'))

  const getSoapPayload = () => {
    const fields = soapForm.getFieldsValue() || {}
    return {
      ...fields,
      bodyChart: bodyChartFindings
    }
  }

  // Save as Draft
  const handleSaveDraft = async () => {
    const apptObj = getSelectedAppointmentObj()
    const existingNoteObj = apptObj ? store.consultations.find(c => c.appointmentId === apptObj.id) : null
    const soapData = getSoapPayload()

    if (existingNoteObj) {
      await store.updateConsultation(existingNoteObj.id, {
        notes: noteText,
        soap: soapData,
        status: 'Draft',
        date: new Date().toISOString().split('T')[0]
      })
      toast.success(`Progress note draft updated in DB for ${patient?.name || 'Client'}!`)
    } else {
      const newCons = {
        patientId: selectedPatientId,
        patientName: patient?.name || 'Client',
        notes: noteText,
        soap: soapData,
        status: 'Draft',
        practitionerName: activeDoctorName,
        profession: activeSpecialty,
        appointmentId: apptObj ? apptObj.id : undefined,
        date: new Date().toISOString().split('T')[0]
      }
      await store.addConsultation(newCons)
      toast.success(`Progress note draft saved to DB for ${patient?.name || 'Client'}!`)
    }
  }

  // Save as Final
  const handleSaveFinal = async () => {
    const apptObj = getSelectedAppointmentObj()
    const existingNoteObj = apptObj ? store.consultations.find(c => c.appointmentId === apptObj.id) : null
    const soapData = getSoapPayload()

    if (existingNoteObj) {
      await store.updateConsultation(existingNoteObj.id, {
        notes: noteText,
        soap: soapData,
        status: 'Completed',
        date: new Date().toISOString().split('T')[0]
      })
      toast.success(`Progress note saved as final in DB for ${patient?.name || 'Client'}!`)
    } else {
      const newCons = {
        patientId: selectedPatientId,
        patientName: patient?.name || 'Client',
        notes: noteText,
        soap: soapData,
        status: 'Completed',
        practitionerName: activeDoctorName,
        profession: activeSpecialty,
        appointmentId: apptObj ? apptObj.id : undefined,
        date: new Date().toISOString().split('T')[0]
      }
      await store.addConsultation(newCons)
      toast.success(`Progress note saved as final in DB for ${patient?.name || 'Client'}!`)
    }
  }

  // Sync URL parameters on mount or when search changes
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pId = params.get('patientId')
    const apptId = params.get('appointmentId')
    
    if (pId) {
      setSelectedPatientId(pId)
    }
    
    if (apptId) {
      const apptObj = store.appointments.find(a => a.id === apptId)
      if (apptObj) {
        const matchStr = `${formatDateString(apptObj.date)} - ${apptObj.time} (${apptObj.appointmentType || 'Follow-up'})`
        setSelectedAppointment(matchStr)
      }
      
      const existingNoteObj = store.consultations.find(c => c.appointmentId === apptId)
      if (existingNoteObj) {
        setNoteText(existingNoteObj.notes || '')
      }
    }
  }, [location.search])

  // Sync template selection when simulated specialty changes
  useEffect(() => {
    const isSoap = activeSpecialty !== 'Speech Pathologist' && activeSpecialty !== 'Speech Therapist' && activeSpecialty !== 'Occupational Therapist'
    setSelectedTemplate(isSoap ? 'Default SOAP Template' : 'Clinical Progress Notes')
  }, [activeSpecialty])

  // Sync noteText with selected appointment and template
  useEffect(() => {
    const apptObj = getSelectedAppointmentObj()
    if (apptObj) {
      const existingNoteObj = store.consultations.find(c => c.appointmentId === apptObj.id)
      if (existingNoteObj) {
        setNoteText(existingNoteObj.notes || '')
        return // Bypass template loading because there's already a saved note
      }
    }

    let text = ''
    if (selectedTemplate === 'Default SOAP Template') {
      text = `S: Patient presents for follow-up regarding chronic back pain, reporting moderate improvement.\n\nO: Physical exam reveals tenderness in the L5-S1 region.\n\nA: Chronic lower back pain, improving.\n\nP: Continue physical therapy, adjust medication, schedule 4-week follow-up.`
    } else if (selectedTemplate === 'Clinical Progress Notes') {
      text = `Subject/Issues: Patient presents for session, reports positive engagement and progress in activities.\n\nObservations: Participates actively in therapeutic exercises. Demonstrates cooperative communication and focus.\n\nIntervention: Applied tailored clinical strategies and exercises to support developmental goals.\n\nPlan: Continue regular treatment schedule and monitor progress.`
    } else if (selectedTemplate === 'Initial Assessment') {
      text = `Chief Complaint: Patient reports lower back soreness and stiffness.\nHistory of Present Illness: Discomfort started 3 weeks ago after lifting a heavy box.\nPhysical Exam: Active flexion limited to 60 degrees. Tenderness noted.\nAssessment & Plan: Stable lumbar strain. Recommend stretching exercises twice daily.`
    } else if (selectedTemplate === 'Discharge Summary') {
      text = `Reason for Treatment: Lower back pain rehabilitation.\nSummary of Treatment: Completed 6 sessions of physiotherapy and core stability training.\nCondition at Discharge: Patient reports zero back pain and 100% recovery of flexion range.\nDischarge Plan: Discharge to home exercise plan. No follow-up scheduled.`
    } else if (selectedTemplate === 'History and Physical (H&P)') {
      text = `History & Physical:\nSubjective: Patient reports general wellness, minor neck tightness.\nObjective Vitals: BP 120/80, Heart Rate 72 bpm.\nAssessment: Postural strain from desk work.\nPlan: Ergonomic advice and daily neck stretching.`
    } else if (selectedTemplate === 'Functional Capacity Assessment') {
      text = `Functional Capacity Assessment:\nADLs: Independent in basic self-care, requires assistance for complex tasks.\nSensory Profile: Moderate sensitivity to auditory stimuli.\nMobility: Steady gait, minor balance fatigue.\nRecommendations: Sensory modifications at school/work, follow up in 3 months.`
    }
    setNoteText(text)
  }, [selectedAppointment, selectedTemplate, selectedPatientId])

  // Sync default appointment when patient changes
  useEffect(() => {
    // If there is an appointmentId in URL, we want to keep it selected instead of defaulting
    const params = new URLSearchParams(location.search)
    if (params.get('appointmentId')) return

    const appts = getPatientAppointments(selectedPatientId)
    if (appts && appts.length > 0) {
      setSelectedAppointment(appts[0])
    }
    setSelectedHistoryNoteId(null)
  }, [selectedPatientId, location.search])

  // Auto-save simulator timer
  useEffect(() => {
    if (!noteText) return
    setIsAutoSaving(true)
    const timeout = setTimeout(() => {
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      setLastSavedTime(time)
      setIsAutoSaving(false)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [noteText])

  // Load the selected patient
  const patient = store.patients.find(p => p.id === selectedPatientId)



  if (!patient) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-12 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 font-sans h-[400px]">
        <div className="w-16 h-16 bg-[#8C4BFF]/10 text-[#8C4BFF] rounded-2xl flex items-center justify-center text-2xl mb-2">
          <UserOutlined />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Start a New Consultation</h2>
        <p className="text-slate-500 font-semibold text-sm max-w-md">
          Consultation dictation is now located inside the Client Profile tab for a better workflow.
        </p>
        <Button 
          type="primary" 
          onClick={() => navigate('/practitioner/patients')}
          className="mt-4 rounded-xl font-bold h-10 px-6 text-white border-none"
          style={{ backgroundColor: '#8C4BFF' }}
        >
          Go to Client Directory
        </Button>
      </div>
    )
  }

  // Calculate age from DOB
  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Simulation handlers
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      // Synthesize values depending on the specialty
      let generatedText = ""
      if (activeSpecialty === 'Physiotherapist') {
        generatedText = "Patient John Miller presents with low back tightness. Passive straight leg raise is 75 degrees on the right, 60 on the left. Lumbar extension reproduces localized L4 discomfort. Assessed as lower lumbar disc stress. Prescribed bird-dogs and pelvic tilts. Re-evaluating next Monday."
      } else if (activeSpecialty === 'Psychologist') {
        generatedText = "Client reports persistent social anxiety symptoms in work settings. Expresses high anxiety rating of 7/10. Cognitive restructuring drills applied. Recommended deep diaphragmatic breathing and cognitive reframing."
      } else if (activeSpecialty === 'Speech Pathologist') {
        generatedText = "Child completed articulation drills naming 10 items. Scored 80% accuracy on sibilants. Assigned tongue elevation worksheet."
      } else {
        generatedText = "Consultation completed. Patient shows positive response to active therapeutic movements. Prescribed follow-up rehabilitation exercises."
      }
      setLiveTranscription(generatedText)
      setAiModalVisible(true)
      toast.success('Dictation transcribed successfully!')
    } else {
      setIsRecording(true)
      setLiveTranscription('Recording...')
      setAiAnalysisResults(null)
    }
  }

  const handleAddTranscriptionToNote = () => {
    if (!liveTranscription || liveTranscription === 'Recording...') {
      toast.error('No transcription available to add.')
      return
    }
    setNoteText(prev => {
      const spacing = prev.trim() ? '\n\n' : ''
      return prev + spacing + liveTranscription
    })
    toast.success('Transcription added to progress note!')
    setLiveTranscription('')
  }

  const handleGenerateAINotes = () => {
    if (!liveTranscription || liveTranscription === 'Recording...') {
      toast.error('Please record/dictate some text first.')
      return
    }
    toast.loading('AI is structuring notes...', { duration: 1000 })
    setTimeout(() => {
      if (isSoapSpecialty) {
        // Structure transcription into SOAP format
        let soapData = {}
        if (activeSpecialty === 'Physiotherapist') {
          soapData = {
            subjective: 'Patient reports lower back stiffness. Reports discomfort during sitting prolonged periods.',
            objective: 'Passive straight leg raise (SLR): 75° right, 60° left. Discomfort on L4 spine extension.',
            assessment: 'Lower lumbar vertebral disc load stress with associated musculature spasms.',
            plan: 'Assigned Bird-Dogs and pelvic tilt stability drills. Follow-up consultation in 7 days.'
          }
        } else {
          soapData = {
            subjective: 'Client presents with symptoms related to ' + activeSpecialty + ' rehabilitation.',
            objective: 'Clinical assessments indicate moderate restrictions/difficulties in functional exercises.',
            assessment: 'Rehabilitation progressing. Client displays cooperative motor/cognitive focus.',
            plan: 'Assigned home program. Re-evaluate in next consultation.'
          }
        }
        const generatedSoap = `S: ${soapData.subjective}\n\nO: ${soapData.objective}\n\nA: ${soapData.assessment}\n\nP: ${soapData.plan}`
        setNoteText(generatedSoap)
        setAiAnalysisResults('SOAP Note Synthesized')
        toast.success('AI Notes compiled and loaded into progress notes!')
      } else {
        // Non-SOAP structure compiled directly into text notes
        let generatedNote = ""
        if (activeSpecialty === 'Speech Pathologist' || activeSpecialty === 'Speech Therapist') {
          generatedNote = `Subject/Issues: Child completed articulation drills for speech clarity.\n\nObservations: Articulation accuracy was 80% on target sibilants. Child was engaged and followed instructions.\n\nIntervention: Directed articulation exercises and tongue elevation practice.\n\nPlan: Assigned tongue elevation worksheet for home practice. Re-evaluate in 2 weeks.`
        } else if (activeSpecialty === 'Occupational Therapist') {
          generatedNote = `Subject/Issues: Client assessed for daily living independence and sensory needs.\n\nObservations: Needs moderate support for fine motor transitions. Sensory sensitivity to loud background noises noted.\n\nIntervention: Practiced sensory adaptation techniques and manual dexterity tasks.\n\nPlan: Advised sensory breaks at school. Review functional progress next month.`
        } else {
          generatedNote = `Subject/Issues: Client participated in general rehabilitation program.\n\nObservations: Client displays positive motivation and stable execution of exercises.\n\nIntervention: Guided client through targeted functional movements.\n\nPlan: Continue current program and review in subsequent session.`
        }
        setNoteText(generatedNote)
        toast.success('AI Notes compiled and loaded into progress notes!')
      }
    }, 1000)
  }

  const handleFormatToSOAP = () => {
    if (!noteText.trim()) {
      toast.error('Please dictate or type some notes first.')
      return
    }
    toast.loading(`AI is formatting your note into ${selectedTemplate || 'structured'} format...`, { duration: 1200 })
    setTimeout(() => {
      const formatted = `S: Patient presents for follow-up regarding chronic back pain, reporting moderate improvement.\n\nO: Physical exam reveals tenderness in the L5-S1 region.\n\nA: Chronic lower back pain, improving.\n\nP: Continue physical therapy, adjust medication, schedule 4-week follow-up.`;
      setNoteText(formatted);
      toast.success('Note structured successfully!')
    }, 1200)
  }

  const handleGenerateAIReport = () => {
    toast.loading('AI is drafting clinical report...', { duration: 1200 })
    setTimeout(() => {
      toast.success('Report Draft generated! Saved in Drafts folder.')
      navigate('/clinic/notes-reports?tab=reports')
    }, 1200)
  }

  const handleSaveSOAP = (values) => {
    const formatted = {
      patientId: patient.id,
      patientName: patient.name,
      soap: values,
      status: 'Completed',
      practitionerName: 'Dr. Sarah Jenkins',
      profession: activeSpecialty
    }
    store.addConsultation(formatted)
    toast.success('Clinical SOAP note saved successfully!')
  }

  // Prescribe exercises handler
  const handlePrescribeExercises = (values) => {
    const prog = {
      patientId: patient.id,
      patientName: patient.name,
      programName: values.programName || 'Home Recovery Program',
      practitionerName: 'Dr. Sarah Jenkins',
      exercises: [
        { videoName: values.exVideo1, instructions: values.inst1, sets: values.sets1 || 3, reps: values.reps1 || 10, frequency: values.freq1 || 'Daily' }
      ]
    }
    store.addPrescribedExercise(prog)
    toast.success(`Exercises assigned to ${patient.name} via Patient Portal!`)
    exerciseForm.resetFields()
  }

  // AI Referral Letter generation
  const handleDraftReferralLetter = () => {
    const values = referralForm.getFieldsValue()
    if (!values.recipient) {
      toast.error('Please select referral recipient first.')
      return
    }
    toast.loading('AI is drafting referral letter...', { duration: 1000 })
    setTimeout(() => {
      const diagStr = Array.isArray(patient.diagnosis) ? (patient.diagnosis.join(', ') || 'Injury') : (typeof patient.diagnosis === 'string' && patient.diagnosis.trim() ? patient.diagnosis : 'Injury')
      const draft = `Dear ${values.recipient},\n\nI am writing to refer my patient, ${patient.name} (${calculateAge(patient.dob)}yo), for diagnostic review and co-management regarding their condition (${diagStr}).\n\nClinical notes: Patient presents with musculoskeletal symptoms under our treating clinical workspace. I appreciate your expert review.\n\nSincerely,\nDr. Sarah Jenkins\nSpecialist in ${activeSpecialty}`
      referralForm.setFieldsValue({ letter: draft })
      toast.success('AI referral letter drafted! Please review and approve.')
    }, 1000)
  }

  const handleSendReferral = (values) => {
    const formatted = {
      patientId: patient.id,
      patientName: patient.name,
      recipient: values.recipient,
      recipientType: values.recipientType || 'Specialist',
      letter: values.letter,
      status: 'Sent'
    }
    store.addReferral(formatted)
    toast.success(`Referral letter successfully sent to ${values.recipient}!`)
    referralForm.resetFields()
  }

  // Invoicing handler
  const handleCreateInvoice = (values) => {
    // Generate invoice in store
    const item = store.services.find(s => s.name === values.serviceName) || store.services[0]
    const price = item ? item.price : 120
    const claim = values.fundingType || 'Private'
    
    // Add invoice to store
    const newInv = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      clientName: patient.name,
      patientId: patient.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: price,
      due: price,
      status: 'Sent',
      serviceType: item.name
    }
    // Append to invoices array in store
    store.invoices = [newInv, ...store.invoices]
    
    toast.success(`Invoice ${newInv.id} issued under ${claim} funding!`)
    invoiceForm.resetFields()
  }

  // Dynamically load templates & details based on active simulated profession
  const renderProfessionSpecificFields = () => {
    switch (activeSpecialty) {
      case 'Physiotherapist':
      case 'Chiropractor':
      case 'Osteopath':
        return (
          <div className="p-4 bg-blue-50/50 dark:bg-slate-950/40 border border-blue-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h5 className="font-extrabold text-xs text-blue-500 uppercase tracking-wider">Joint Mobilisation & Spine Alignment Checks</h5>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="rangeOfMotion" label={<span className="text-[11px] font-bold text-slate-500">Active ROM limitation</span>}>
                <Input placeholder="e.g. Lumbar Flexion 60 deg, Extension limited" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="spinePalpation" label={<span className="text-[11px] font-bold text-slate-500">Palpation Tenderness / Spine alignment</span>}>
                <Input placeholder="e.g. Local L4-L5 vertebrae tenderness" className="rounded-xl" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item name="muscleStrength" label={<span className="text-[11px] font-bold text-slate-500">Muscle Testing (0-5)</span>}>
                <Input placeholder="e.g. Left quad 4/5" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="outcomeMeasure" label={<span className="text-[11px] font-bold text-slate-500">Outcome Measure Score</span>}>
                <Input placeholder="e.g. Oswestry Back Pain: 32%" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="postureDetails" label={<span className="text-[11px] font-bold text-slate-500">Postural alignment details</span>}>
                <Input placeholder="e.g. Forward head, elevated R shoulder" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )
      case 'Occupational Therapist':
        return (
          <div className="p-4 bg-purple-50/50 dark:bg-slate-950/40 border border-purple-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h5 className="font-extrabold text-xs text-purple-600 uppercase tracking-wider">Functional Capacity Assessment (NDIS Focus)</h5>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="adlRestricted" label={<span className="text-[11px] font-bold text-slate-500">Activities of Daily Living (ADLs) Restrictions</span>}>
                <Input placeholder="e.g. Needs physical assistance for shower & dressing" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="assistiveTech" label={<span className="text-[11px] font-bold text-slate-500">Recommended Assistive Technology</span>}>
                <Input placeholder="e.g. Over-toilet frame, shower chair, front rails" className="rounded-xl" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="homeModifications" label={<span className="text-[11px] font-bold text-slate-500">Home Modifications Required</span>}>
                <Input placeholder="e.g. Ramp installation for front entrance" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="cognitiveSkill" label={<span className="text-[11px] font-bold text-slate-500">Cognitive & Focus parameters</span>}>
                <Input placeholder="e.g. High focus during guided tasks, easily distracted" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )
      case 'Psychologist':
        return (
          <div className="p-4 bg-amber-50/50 dark:bg-slate-950/40 border border-amber-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h5 className="font-extrabold text-xs text-amber-600 uppercase tracking-wider">Mental Health Indicators & Cognitive Parameters</h5>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="moodAffect" label={<span className="text-[11px] font-bold text-slate-500">Mood and Affect</span>}>
                <Input placeholder="e.g. Anxious mood, flat affect" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="anxietyRating" label={<span className="text-[11px] font-bold text-slate-500">Anxiety Rating (0-10)</span>}>
                <Input placeholder="e.g. 7 out of 10" className="rounded-xl" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="cognitiveDistortions" label={<span className="text-[11px] font-bold text-slate-500">Observed Cognitive Distortions</span>}>
                <Input placeholder="e.g. Catastrophizing, all-or-nothing thinking" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="copingMechanisms" label={<span className="text-[11px] font-bold text-slate-500">Coping Strategies discussed</span>}>
                <Input placeholder="e.g. Cognitive restructuring, square breathing" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )
      case 'Speech Pathologist':
        return (
          <div className="p-4 bg-emerald-50/50 dark:bg-slate-950/40 border border-emerald-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h5 className="font-extrabold text-xs text-emerald-600 uppercase tracking-wider">Speech & Language Scoring Logs</h5>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="articulationScore" label={<span className="text-[11px] font-bold text-slate-500">Articulation Card accuracy</span>}>
                <Input placeholder="e.g. Named 8/10 items, difficulty with sibilants" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="swallowingSafety" label={<span className="text-[11px] font-bold text-slate-500">Dysphagia / Swallowing assessment</span>}>
                <Input placeholder="e.g. Clean swallow test with thin liquids" className="rounded-xl" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="receptiveLanguage" label={<span className="text-[11px] font-bold text-slate-500">Receptive Language scoring</span>}>
                <Input placeholder="e.g. Followed 3-step directions with minimal prompts" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="aacDevice" label={<span className="text-[11px] font-bold text-slate-500">AAC Device training logs</span>}>
                <Input placeholder="e.g. Used screen-select to indicate basic needs" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )
      case 'Exercise Physiologist':
        return (
          <div className="p-4 bg-teal-50/50 dark:bg-slate-950/40 border border-teal-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h5 className="font-extrabold text-xs text-teal-600 uppercase tracking-wider">Cardiac & Rehabilitation Parameters</h5>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="restingHeartRate" label={<span className="text-[11px] font-bold text-slate-500">Resting Heart Rate / BP</span>}>
                <Input placeholder="e.g. 72 bpm, BP 120/80" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="rpeTesting" label={<span className="text-[11px] font-bold text-slate-500">RPE (Borg Scale 6-20) during loads</span>}>
                <Input placeholder="e.g. RPE 13 (somewhat hard) at 60W load" className="rounded-xl" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="aerobicCapacity" label={<span className="text-[11px] font-bold text-slate-500">Aerobic Workout limitations</span>}>
                <Input placeholder="e.g. Fatigue onset after 10 mins treadmill walking" className="rounded-xl" />
              </Form.Item>
              <Form.Item name="resistiveLoads" label={<span className="text-[11px] font-bold text-slate-500">Active Resistance Loads applied</span>}>
                <Input placeholder="e.g. Leg press 40kg, chest press 15kg" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )
      default:
        return (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <h5 className="font-extrabold text-xs text-slate-600 uppercase tracking-wider">General Health physical assessment</h5>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Form.Item name="clinicalSymptoms" label={<span className="text-[11px] font-bold text-slate-500">Chief complaints / symptoms</span>}>
                <Input placeholder="Enter details..." className="rounded-xl" />
              </Form.Item>
              <Form.Item name="clinicalVitals" label={<span className="text-[11px] font-bold text-slate-500">Vitals check</span>}>
                <Input placeholder="e.g. Temperature, BP, heart rate" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )
    }
  }

  const apptObjForLock = getSelectedAppointmentObj()
  const existingNoteForLock = apptObjForLock ? store.consultations.find(c => c.appointmentId === apptObjForLock.id) : null
  const isNoteFinal = existingNoteForLock && existingNoteForLock.status === 'Completed'

  return (
    <div className="space-y-6 font-sans">
      <Card className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden select-none">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 min-h-[720px]">
          
          {/* Left Panel: Past Session Notes (1/3 Screen Width - col-span-4) */}
          <div className="xl:col-span-4 bg-slate-50 dark:bg-slate-950/60 border-b xl:border-b-0 xl:border-r border-slate-150 dark:border-slate-800 p-4 sm:p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileTextOutlined style={{ color: '#8C4BFF' }} />
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Past Session Notes
                </span>
                <Badge 
                  count={getPatientNotesHistory(selectedPatientId).length} 
                  style={{ backgroundColor: '#8C4BFF', fontSize: '10px' }} 
                />
              </div>
            </div>

            {/* Quick Search for Past Notes */}
            <Input 
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search past notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-xl h-9 text-xs"
              allowClear
            />

            {/* Past Notes Scrollable List */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[700px]">
              {getPatientNotesHistory(selectedPatientId)
                .filter(n => !searchQuery || n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || n.content?.toLowerCase().includes(searchQuery.toLowerCase()) || n.date?.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                  No note history found matching query.
                </div>
              ) : (
                getPatientNotesHistory(selectedPatientId)
                  .filter(n => !searchQuery || n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || n.content?.toLowerCase().includes(searchQuery.toLowerCase()) || n.date?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((note, idx) => {
                    const isSelected = selectedHistoryNoteId === (note.id || idx)
                    return (
                      <div 
                        key={note.id || idx} 
                        onClick={() => setSelectedHistoryNoteId(isSelected ? null : (note.id || idx))}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected 
                            ? 'border-[#8C4BFF] bg-[#8C4BFF]/5 dark:bg-[#8C4BFF]/10 shadow-sm ring-1 ring-[#8C4BFF]' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{note.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            note.status === 'Draft' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {note.status}
                          </span>
                        </div>
                        <span className="block text-xs font-extrabold text-[#8C4BFF]">{note.title}</span>
                        <div className="text-xs text-slate-600 dark:text-slate-450 whitespace-pre-wrap leading-relaxed line-clamp-3">
                          {note.content}
                        </div>
                        {isSelected && (
                          <div className="pt-1.5 flex justify-between items-center text-[10px] text-[#8C4BFF] font-bold border-t border-[#8C4BFF]/20">
                            <span>Selected for Copy</span>
                            <CheckCircleFilled />
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          </div>

          {/* Right Panel: Main Note-Writing Area (2/3 Screen Width - col-span-8) */}
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between space-y-5">
            
            {/* Top Workflow Controls (Repositioned: Appointment Selector, Note Template, Copy Actions, Body Diagram Toggle) */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white m-0">
                    New Progress Note - {getNoteDateDisplay()}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircleFilled className="text-emerald-500 text-xs" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                      {isAutoSaving ? 'Auto-saving draft...' : `Draft auto-saved at ${lastSavedTime || '10:15 AM'}`}
                    </span>
                  </div>
                </div>

                {/* Physiotherapy-Only Show / Hide Body Diagram Toggle */}
                {isPhysiotherapy && (
                  <Button 
                    onClick={() => setShowBodyDiagram(prev => !prev)}
                    icon={<ThunderboltOutlined />}
                    style={{
                      backgroundColor: showBodyDiagram ? '#8C4BFF' : 'transparent',
                      color: showBodyDiagram ? '#ffffff' : '#8C4BFF',
                      borderColor: '#8C4BFF'
                    }}
                    className="rounded-xl font-bold text-xs h-8 flex items-center gap-1.5"
                  >
                    {showBodyDiagram ? 'Hide Body Diagram' : 'Show Body Diagram'}
                  </Button>
                )}
              </div>

              {/* Repositioned Workflow Controls Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Appointment Selector */}
                <div className="md:col-span-4">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Appointment</span>
                  <Select 
                    value={selectedAppointment}
                    onChange={setSelectedAppointment}
                    className="w-full rounded-xl"
                    placeholder="Select appointment"
                  >
                    {getPatientAppointments(selectedPatientId).map((appt, idx) => (
                      <Option key={idx} value={appt}>{appt}</Option>
                    ))}
                  </Select>
                </div>

                {/* Clinical Note Templates */}
                <div className="md:col-span-4">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Default Template</span>
                  <Select 
                    value={selectedTemplate}
                    onChange={setSelectedTemplate}
                    className="w-full rounded-xl"
                  >
                    {isSoapSpecialty ? (
                      <>
                        <Option value="Default SOAP Template">Default SOAP Template</Option>
                        <Option value="Initial Assessment">Initial Assessment Template</Option>
                        <Option value="Discharge Summary">Discharge Summary Template</Option>
                        <Option value="History and Physical (H&P)">History & Physical (H&P)</Option>
                      </>
                    ) : (
                      <>
                        <Option value="Clinical Progress Notes">Clinical Progress Notes</Option>
                        <Option value="Initial Assessment">Initial Assessment Template</Option>
                        <Option value="Discharge Summary">Discharge Summary Template</Option>
                        <Option value="Functional Capacity Assessment">Functional Capacity Assessment</Option>
                      </>
                    )}
                  </Select>
                </div>

                {/* Copy Notes Actions */}
                <div className="md:col-span-4 flex items-end gap-2 pt-1 md:pt-4">
                  <Button 
                    onClick={handleCopyPrevious}
                    icon={<CopyOutlined />}
                    size="small"
                    className="rounded-xl text-[11px] font-bold h-9 flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#8C4BFF]"
                  >
                    Copy Prev
                  </Button>
                  <Button 
                    onClick={handleCopySelected}
                    icon={<CopyOutlined />}
                    disabled={!selectedHistoryNoteId}
                    size="small"
                    className={`rounded-xl text-[11px] font-bold h-9 flex-1 ${
                      selectedHistoryNoteId 
                        ? 'bg-[#8C4BFF]/10 text-[#8C4BFF] border-[#8C4BFF]' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Copy Sel
                  </Button>
                </div>
              </div>
            </div>

            {/* Patient & Practitioner Metadata Row */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl p-3 flex flex-wrap justify-between items-center text-xs gap-3">
              <div>
                <span className="font-bold text-slate-400 dark:text-slate-500">Patient:</span>{' '}
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{patient.name}</span>
                <span className="mx-2 text-slate-350">|</span>
                <span className="font-bold text-slate-400 dark:text-slate-500">DOB:</span>{' '}
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatDateString(patient.dob)}</span>
                <span className="mx-2 text-slate-355">|</span>
                <span className="font-bold text-slate-400 dark:text-slate-500">ID:</span>{' '}
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{getPatientDisplayId(selectedPatientId)}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 dark:text-slate-500">
                  {store.userRole === 'clinic' ? 'Admin:' : 'Doctor:'}
                </span>{' '}
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {activeDoctorName}
                </span>
                <span className="mx-2 text-slate-350">|</span>
                <span className="font-bold text-slate-400 dark:text-slate-500">Specialty:</span>{' '}
                <span className="font-extrabold text-[#8C4BFF]">
                  {activeSpecialty}
                </span>
              </div>
            </div>

            {/* Voice Dictation Assistant Widget */}
            <div className="bg-gradient-to-r from-[#8C4BFF]/5 to-[#30D2BE]/5 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-slate-700 dark:text-white flex items-center gap-2">
                  <AudioOutlined style={{ color: '#8C4BFF' }} /> Voice Dictation Assistant
                </span>
                {isRecording && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-500/10 text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Recording
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  onClick={toggleRecording}
                  type={isRecording ? "primary" : "default"}
                  danger={isRecording}
                  icon={<AudioOutlined />}
                  className="rounded-xl font-bold h-10 px-5 text-xs flex items-center gap-2"
                  style={!isRecording ? { borderColor: '#cbd5e1' } : {}}
                >
                  {isRecording ? 'Stop & Transcribe' : 'Start Live Dictation'}
                </Button>
                
                {isRecording && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 bg-[#8C4BFF] h-6 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 bg-[#30D2BE] h-4 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 bg-[#8C4BFF] h-8 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="w-1 bg-[#30D2BE] h-5 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <div className="w-1 bg-[#8C4BFF] h-3 rounded animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                )}
                
                {!isRecording && liveTranscription && liveTranscription !== 'Recording...' && (
                  <Button
                    onClick={handleAddTranscriptionToNote}
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                    className="rounded-xl font-bold h-10 px-5 text-xs text-white"
                  >
                    Add to Note
                  </Button>
                )}
              </div>

              {liveTranscription && (
                <div className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Live Transcription Preview</span>
                  <p className="text-slate-650 dark:text-slate-350 italic m-0 text-xs leading-relaxed">
                    "{liveTranscription}"
                  </p>
                </div>
              )}
            </div>

            {/* Rich Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl select-none">
              <Button 
                type="text" 
                size="small" 
                icon={<BoldOutlined />} 
                onClick={() => insertAtCursor('**', '**')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Button 
                type="text" 
                size="small" 
                icon={<ItalicOutlined />} 
                onClick={() => insertAtCursor('*', '*')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Button 
                type="text" 
                size="small" 
                icon={<UnderlineOutlined />} 
                onClick={() => insertAtCursor('<u>', '</u>')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Button 
                type="text" 
                size="small" 
                icon={<StrikethroughOutlined />} 
                onClick={() => insertAtCursor('~~', '~~')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Divider orientation="vertical" className="border-slate-200 dark:border-slate-800 h-4 m-0 mx-1" />
              <Button 
                type="text" 
                size="small" 
                icon={<LinkOutlined />} 
                onClick={() => insertAtCursor('[', '](url)')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Button 
                type="text" 
                size="small" 
                icon={<UnorderedListOutlined />} 
                onClick={() => insertAtCursor('\n- ', '')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Button 
                type="text" 
                size="small" 
                icon={<OrderedListOutlined />} 
                onClick={() => insertAtCursor('\n1. ', '')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
              <Divider orientation="vertical" className="border-slate-200 dark:border-slate-800 h-4 m-0 mx-1" />
              <Button 
                type="text" 
                size="small" 
                icon={<AlignLeftOutlined />} 
                onClick={() => toast.success('Paragraph alignment toggled')}
                className="font-bold text-slate-650 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              />
            </div>

            {/* Interactive Body Chart Diagram (Only Physiotherapy & only when toggled ON) */}
            {isPhysiotherapy && showBodyDiagram && (
              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/10 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8C4BFF]">Physiotherapy Body Chart Diagram</span>
                  <Button 
                    type="text" 
                    size="small" 
                    onClick={() => setShowBodyDiagram(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hide
                  </Button>
                </div>
                <BodyChartDiagram value={bodyChartFindings} onChange={setBodyChartFindings} readOnly={isNoteFinal} />
              </div>
            )}

            {/* Enlarged Text Editor Area (2/3 width, min-h-[460px]) */}
            <div className="flex-1 flex flex-col">
              <textarea
                id="progress-note-editor"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                readOnly={isNoteFinal}
                className={`flex-1 w-full min-h-[460px] p-5 border rounded-2xl font-sans text-sm resize-y leading-relaxed transition-all focus:outline-none shadow-inner ${
                  isNoteFinal 
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#8C4BFF]/30 focus:border-[#8C4BFF]'
                }`}
                placeholder="Start typing your clinical progress notes here, or use the Voice Dictation Assistant above..."
              />
            </div>

            {/* Bottom Footer Actions */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-150 dark:border-slate-850 select-none">
              {isNoteFinal ? (
                <Button 
                  onClick={() => {
                    store.updateConsultation(existingNoteForLock.id, { status: 'Draft' })
                    toast.success('Note reopened for editing!')
                  }}
                  style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
                  className="rounded-xl font-bold h-10 px-6 text-white hover:opacity-90 animate-pulse-subtle"
                >
                  Reopen Note
                </Button>
              ) : (
                <>
                  <div className="flex-1">
                    <Button 
                      onClick={handleFormatToSOAP}
                      icon={<ThunderboltOutlined />}
                      style={{ color: '#8C4BFF', borderColor: '#8C4BFF', backgroundColor: 'transparent' }}
                      className="rounded-xl font-bold h-10 px-4 hover:bg-[#8C4BFF]/5"
                    >
                      {selectedTemplate && selectedTemplate.includes('SOAP') ? 'AI Format SOAP' : `AI Format ${selectedTemplate || 'Note'}`}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSaveDraft}
                    className="rounded-xl font-bold h-10 px-5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-750 dark:hover:bg-slate-700"
                  >
                    Save Draft
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleSaveFinal}
                    style={{ backgroundColor: '#0E1B33', borderColor: '#0E1B33' }}
                    className="rounded-xl font-bold h-10 px-6 text-white hover:opacity-90"
                  >
                    Save as Final
                  </Button>
                </>
              )}
            </div>
          </div>

        </div>
      </Card>
      {/* AI Template Generation Modal */}
      <Modal
        title={
          <div className="flex items-center px-2 py-1">
            <SearchOutlined className="text-slate-500 text-lg mr-3" />
            <input 
              type="text"
              placeholder="Search or generate anything" 
              className="flex-1 bg-transparent border-none outline-none font-bold text-[17px] text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>
        }
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        footer={
          <div className="flex items-center justify-center gap-3 pt-3 pb-2 mt-4 border-t border-slate-150 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              You have <span className="font-bold text-slate-800 dark:text-white">10</span> Note or Document actions remaining this month
            </span>
            <div className="bg-[#8C4BFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-[#7b3dec]">
              <ThunderboltOutlined /> Get unlimited
            </div>
          </div>
        }
        width={650}
        styles={{ 
          content: { 
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            border: darkMode ? '1px solid #1e293b' : '1px solid #f1f5f9',
            borderRadius: '20px',
            padding: '20px 24px'
          },
          header: {
            backgroundColor: 'transparent',
            borderBottom: '1px solid ' + (darkMode ? '#1e293b' : '#f1f5f9'),
            paddingBottom: '12px',
            marginBottom: '16px'
          }
        }}
        closeIcon={<CloseCircleOutlined className="text-slate-300 hover:text-slate-500 text-lg transition-colors mt-1" />}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:bg-slate-800">
              <SwapOutlined rotate={90} className="text-[10px]" /> Sort
            </div>
            <div className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:bg-slate-800">
              <FileTextOutlined className="text-[10px]" /> Type
            </div>
            <div className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:bg-slate-800">
              <UserOutlined className="text-[10px]" /> Creator
            </div>
            <div className="ml-auto flex items-center gap-2 text-[11px] font-bold text-slate-500">
              Hide Pro <Switch size="small" />
            </div>
          </div>

          <div className="space-y-1">
            <div 
              onClick={() => {
                setAiModalVisible(false)
                toast.loading('AI is analyzing session and generating progress note...', { id: 'ai-gen' })
                setTimeout(() => {
                  setNoteText("Physiotherapy Progress Note\n\n" + liveTranscription)
                  toast.success('Generated Physiotherapy Progress Note!', { id: 'ai-gen' })
                }, 1500)
              }}
              className="px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-900 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f3e8ff] dark:bg-[#8C4BFF]/20 text-[#8C4BFF] flex items-center justify-center border border-[#e9d5ff]">
                  <EditOutlined className="text-[12px]" />
                </div>
                <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200">Write a physiotherapy progress note detailing today's session.</span>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#8C4BFF] text-white">
                <ThunderboltOutlined className="text-[10px]" />
              </div>
            </div>

            <div 
              onClick={() => {
                setAiModalVisible(false)
                toast.loading('AI is crafting a home exercise program...', { id: 'ai-gen' })
                setTimeout(() => {
                  setNoteText("Home Exercise Program\n\nBased on today's session: " + liveTranscription + "\n\nRecommended exercises:\n1. Pelvic Tilts\n2. Bird-Dogs")
                  toast.success('Generated Home Exercise Program!', { id: 'ai-gen' })
                }, 1500)
              }}
              className="px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-900 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f3e8ff] dark:bg-[#8C4BFF]/20 text-[#8C4BFF] flex items-center justify-center border border-[#e9d5ff]">
                  <BranchesOutlined className="text-[12px]" />
                </div>
                <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200">Generate a home exercise program handout for the patient.</span>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#8C4BFF] text-white">
                <ThunderboltOutlined className="text-[10px]" />
              </div>
            </div>

            <div 
              onClick={() => {
                setAiModalVisible(false)
                toast.loading('AI is drafting a referral letter...', { id: 'ai-gen' })
                setTimeout(() => {
                  setNoteText("Referral Letter\n\nTo Dietitian,\n\nPlease review the following patient.\n\nNotes: " + liveTranscription)
                  toast.success('Generated Referral Letter!', { id: 'ai-gen' })
                }, 1500)
              }}
              className="px-3 py-2.5 rounded-xl cursor-pointer transition-all bg-[#FAF5F0] dark:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f3e8ff] dark:bg-[#8C4BFF]/20 text-[#8C4BFF] flex items-center justify-center border border-[#e9d5ff]">
                  <UserOutlined className="text-[12px]" />
                </div>
                <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200">Create a referral letter to the dietitian.</span>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#8C4BFF] text-white">
                <ThunderboltOutlined className="text-[10px]" />
              </div>
            </div>
            
            <div className="text-[10px] text-slate-500 mt-1 px-3">
              Created by Heidi <span className="font-bold text-slate-700 dark:text-slate-300 ml-1 cursor-pointer hover:underline">See more</span>
            </div>
          </div>
          
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-3">Templates</span>
            
            <div 
              onClick={() => {
                setSelectedTemplate('Physiotherapist\'s Note')
                setNoteText(liveTranscription ? liveTranscription : 'Generated from template: Physiotherapist\'s Note')
                setAiModalVisible(false)
              }}
              className="px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-900 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <EditOutlined className="text-slate-600 dark:text-slate-400 text-[13px]" />
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Physiotherapist's Note</span>
              </div>
            </div>

            <div 
              onClick={() => {
                setSelectedTemplate('SOAP Note')
                setNoteText(liveTranscription ? liveTranscription : 'Generated from template: SOAP Note')
                setAiModalVisible(false)
              }}
              className="px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-900 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <EditOutlined className="text-slate-600 dark:text-slate-400 text-[13px]" />
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">SOAP Note</span>
              </div>
            </div>

            <div 
              onClick={() => {
                setSelectedTemplate('Physio Initial MSK outpatient')
                setNoteText(liveTranscription ? liveTranscription : 'Generated from template: Physio Initial MSK outpatient')
                setAiModalVisible(false)
              }}
              className="px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-900 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <EditOutlined className="text-slate-600 dark:text-slate-400 text-[13px]" />
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Physio Initial MSK outpatient</span>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#8C4BFF] text-white">
                <ThunderboltOutlined className="text-[10px]" />
              </div>
            </div>

            <div className="px-3 py-2 mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 font-bold text-[13px]">
                <PlusOutlined className="text-slate-500 text-[13px]" /> Create new template
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                Set as default <Switch size="small" />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
