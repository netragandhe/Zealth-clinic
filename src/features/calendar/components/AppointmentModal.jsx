import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, DatePicker, TimePicker, Switch, Space, Button, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'

import { getPatients, getPractitioners } from '../api/clinicAdminApi'
import { getClinicServices } from '../../settings/api/settingsApi'

const { Option } = Select

export default function AppointmentModal({ open, visible, onCancel, defaultTimeSlot }) {
  const store = useClinicStore()
  const [form] = Form.useForm()
  const [extraNonLabourCosts, setExtraNonLabourCosts] = useState([])
  const isOpen = open !== undefined ? open : visible

  // Quick Add Diagnosis & Intervention state
  const [diagnosisOptions, setDiagnosisOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_diagnosis_options')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return ['Cerebral Palsy', 'Stroke', "Parkinson's Disease", 'Autism Spectrum Disorder', 'Low Back Pain', 'Neck Pain', 'Rotator Cuff Tear', 'ACL Reconstruction']
  })
  const [newDiagnosisInput, setNewDiagnosisInput] = useState('')

  const [interventionOptions, setInterventionOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_intervention_options')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return ['Shoulder', 'Knee', 'Hip', 'Ankle', 'Lumbar Spine', 'Cervical Spine', 'Manual Therapy', 'Therapeutic Exercise', 'Hydrotherapy', 'Gait Training', 'Dry Needling', 'Post-Op Rehab']
  })
  const [newInterventionInput, setNewInterventionInput] = useState('')

  const handleAddDiagnosis = (e) => {
    e?.preventDefault?.()
    if (!newDiagnosisInput.trim()) return
    const trimmed = newDiagnosisInput.trim()
    if (!diagnosisOptions.includes(trimmed)) {
      const updated = [...diagnosisOptions, trimmed]
      setDiagnosisOptions(updated)
      try { localStorage.setItem('clinic_diagnosis_options', JSON.stringify(updated)) } catch (err) {}
    }
    form.setFieldsValue({ diagnosis: trimmed })
    setNewDiagnosisInput('')
    toast.success(`Added diagnosis: ${trimmed}`)
  }

  const handleAddIntervention = (e) => {
    e?.preventDefault?.()
    if (!newInterventionInput.trim()) return
    const trimmed = newInterventionInput.trim()
    if (!interventionOptions.includes(trimmed)) {
      const updated = [...interventionOptions, trimmed]
      setInterventionOptions(updated)
      try { localStorage.setItem('clinic_intervention_options', JSON.stringify(updated)) } catch (err) {}
    }
    form.setFieldsValue({ bodyPart: trimmed })
    setNewInterventionInput('')
    toast.success(`Added option: ${trimmed}`)
  }

  const watchedPracId = Form.useWatch('practitionerId', form)
  const watchedServiceId = Form.useWatch('serviceId', form)
  const selectedPrac = (store.practitioners || []).find(p => p.id === watchedPracId) || (store.practitioners || []).find(p => p.id === defaultTimeSlot?.practitionerId)
  const selectedService = (store.services || []).find(s => s.id === watchedServiceId) || (store.services || []).find(s => s.id === defaultTimeSlot?.serviceId)

  // Dynamic Label: For Physiotherapy appointments -> "Body Part / Intervention", all other professions -> "Intervention"
  const isPhysiotherapy = Boolean(
    (selectedPrac && (
      (selectedPrac.specialty && selectedPrac.specialty.toLowerCase().includes('physio')) ||
      (selectedPrac.profession && selectedPrac.profession.toLowerCase().includes('physio')) ||
      (selectedPrac.title && selectedPrac.title.toLowerCase().includes('physio')) ||
      (selectedPrac.role && selectedPrac.role.toLowerCase().includes('physio'))
    )) ||
    (selectedService && (
      (selectedService.name && selectedService.name.toLowerCase().includes('physio')) ||
      (selectedService.category && selectedService.category.toLowerCase().includes('physio')) ||
      (selectedService.profession && selectedService.profession.toLowerCase().includes('physio'))
    ))
  )

  // Conditional NDIS Field: Show only when selected service is an NDIS service
  const isNdisService = Boolean(
    selectedService && (
      selectedService.isNDIS ||
      selectedService.fundingScheme === 'NDIS' ||
      selectedService.ndisCode ||
      (selectedService.category && selectedService.category.toLowerCase().includes('ndis')) ||
      (selectedService.type && selectedService.type.toLowerCase().includes('ndis')) ||
      (selectedService.name && selectedService.name.toLowerCase().includes('ndis'))
    )
  )

  // Auto-fetch patients, practitioners, services from Live DB if store is empty on modal open
  useEffect(() => {
    if (isOpen) {
      if (!store.patients || store.patients.length === 0 || !store.practitioners || store.practitioners.length === 0 || !store.services || store.services.length === 0) {
        Promise.allSettled([
          getPatients(),
          getPractitioners(),
          getClinicServices()
        ]).then(([patRes, pracRes, servRes]) => {
          if (patRes.status === 'fulfilled' && patRes.value?.success && Array.isArray(patRes.value.data)) {
            const mapped = patRes.value.data.map(p => ({
              ...p,
              name: p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Unnamed Client'
            }))
            if (typeof store.setPatients === 'function') store.setPatients(mapped)
          }
          if (pracRes.status === 'fulfilled' && pracRes.value?.success && Array.isArray(pracRes.value.data)) {
            if (typeof store.setPractitioners === 'function') store.setPractitioners(pracRes.value.data)
          }
          if (servRes.status === 'fulfilled' && servRes.value?.success && Array.isArray(servRes.value.data)) {
            const servList = servRes.value.data
            if (typeof store.setServices === 'function') store.setServices(servList)
            // Auto-populate fee if serviceId is present but fee is unset
            const currentServId = form.getFieldValue('serviceId')
            const currentFee = form.getFieldValue('fee')
            if (currentServId && (currentFee === undefined || currentFee === null || currentFee === '')) {
              const matchedS = servList.find(s => s.id === currentServId)
              if (matchedS) {
                const autoPrice = matchedS.price !== undefined && matchedS.price !== null ? matchedS.price : (matchedS.fee || 0)
                form.setFieldsValue({ fee: autoPrice })
              }
            }
          }
        })
      }
    }
  }, [isOpen])

  const onFinish = async (values) => {
    const patientObj = (store.patients || []).find(p => p.id === values.patientId)
    const practitionerObj = (store.practitioners || []).find(p => p.id === values.practitionerId)
    const serviceObj = (store.services || []).find(s => s.id === values.serviceId)

    const configuredPrice = values.fee !== undefined && values.fee !== '' && values.fee !== null
      ? parseFloat(values.fee)
      : (serviceObj?.price !== undefined && serviceObj?.price !== null ? parseFloat(serviceObj.price) : (serviceObj?.fee !== undefined ? parseFloat(serviceObj.fee) : 0))

    const newAppt = {
      patientId: values.patientId,
      patientName: patientObj ? (patientObj.fullName || patientObj.name || 'Unknown Client') : 'Unknown Client',
      practitionerId: values.practitionerId,
      practitionerName: practitionerObj ? (practitionerObj.name || practitionerObj.fullName) : 'Unknown Practitioner',
      specialty: practitionerObj?.specialty || values.specialty || '',
      practitionerSpecialty: practitionerObj?.specialty || '',
      serviceId: values.serviceId,
      serviceName: serviceObj ? serviceObj.name : (values.appointmentType || 'Consultation'),
      date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      time: values.time ? values.time.format('HH:mm') : '09:00',
      startTime: values.time ? values.time.format('HH:mm') : '09:00',
      endTime: values.endTime ? values.endTime.format('HH:mm') : '10:00',
      duration: serviceObj ? serviceObj.duration : 60,
      fee: configuredPrice,
      fundingScheme: values.fundingType || (patientObj ? patientObj.fundingScheme : 'Private'),
      notes: values.notes || '',
      location: values.location || 'Clinic',
      room: values.room || 'Room A',
      caseName: values.caseName || '',
      travel: {
        providerTravel: Boolean(values.providerTravel),
        nonLabourCosts: Boolean(values.nonLabourCosts),
        providerTravelDesc: values.providerTravelDesc || 'Provider Travel - Travel to participant location',
        providerTravelPricing: parseFloat(values.providerTravelPricing) || 193.99,
        travelToMins: parseInt(values.travelToMins, 10) || 30,
        travelBackMins: parseInt(values.travelBackMins, 10) || 0,
        nonLabourDesc: values.nonLabourDesc || 'Provider Travel - Non-Labour Costs (Kilometres / Tolls)',
        nonLabourQty: parseFloat(values.nonLabourQty) || 25,
        nonLabourPricing: parseFloat(values.nonLabourPricing) || 0.99
      },
      repeat: values.repeat || 'None',
      diagnosis: values.diagnosis || '',
      bodyPart: values.bodyPart || '',
      ndisLineItem: values.ndisLineItem || (serviceObj ? serviceObj.ndisCode : ''),
      invoiceStatus: values.doNotInvoice ? 'Do Not Invoice' : 'Not Invoiced',
    }

    try {
      await store.addAppointment(newAppt)
      toast.success(`Appointment scheduled for ${newAppt.patientName} with ${newAppt.practitionerName}!`)
    } catch (err) {
      console.error('Failed to create appointment:', err)
      toast.error('Failed to create appointment')
    }
    form.resetFields()
    onCancel()
  }

  const isRecurring = Form.useWatch('repeatToggle', form)

  // Set initial default date/time when clicked on grid
  useEffect(() => {
    if (isOpen) {
      let urlPatientId = null
      try {
        const searchParams = new URLSearchParams(window.location.search)
        urlPatientId = searchParams.get('patientId')
      } catch (e) {}

      const targetPatientId = defaultTimeSlot?.patientId || urlPatientId || undefined
      const matchedPatient = (store.patients || []).find(p => 
        p.id === targetPatientId || 
        (p.fullName && p.fullName === targetPatientId) || 
        (p.name && p.name === targetPatientId) ||
        (defaultTimeSlot?.patientName && (p.fullName === defaultTimeSlot.patientName || p.name === defaultTimeSlot.patientName))
      )
      const effectivePatientId = matchedPatient ? matchedPatient.id : targetPatientId

      const loggedInUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const matchedLoggedInPrac = (store.practitioners || []).find(p => p.id === loggedInUserId)
      const defaultPracId = defaultTimeSlot?.practitionerId || matchedLoggedInPrac?.id || (store.practitioners || [])[0]?.id

      const matchedService = (store.services || []).find(s => 
        s.id === defaultTimeSlot?.serviceId || 
        (defaultTimeSlot?.serviceName && s.name === defaultTimeSlot?.serviceName)
      )
      const servicePrice = matchedService?.price !== undefined && matchedService?.price !== null 
        ? matchedService.price 
        : (matchedService?.fee !== undefined && matchedService?.fee !== null ? matchedService.fee : '')

      const initialFee = (defaultTimeSlot?.fee !== undefined && defaultTimeSlot?.fee !== null && defaultTimeSlot?.fee !== '')
        ? defaultTimeSlot.fee
        : (servicePrice !== '' ? servicePrice : '')

      if (defaultTimeSlot) {
        form.setFieldsValue({
          patientId: effectivePatientId,
          diagnosis: matchedPatient?.diagnosis && matchedPatient.diagnosis[0] ? matchedPatient.diagnosis[0] : (defaultTimeSlot.diagnosis || ''),
          fundingType: matchedPatient?.fundingScheme || defaultTimeSlot.fundingType || 'Private',
          date: defaultTimeSlot.date ? dayjs(defaultTimeSlot.date) : dayjs(),
          time: defaultTimeSlot.time ? dayjs(`2026-06-09T${defaultTimeSlot.time}`) : dayjs('09:00', 'HH:mm'),
          endTime: defaultTimeSlot.time ? dayjs(`2026-06-09T${defaultTimeSlot.time}`).add(1, 'hour') : dayjs('10:00', 'HH:mm'),
          practitionerId: defaultPracId,
          serviceId: defaultTimeSlot.serviceId || undefined,
          fee: initialFee,
          repeat: 'None',
          providerTravel: false,
          providerTravelDesc: 'Provider Travel - Travel to participant location',
          providerTravelPricing: '193.99',
          travelToMins: '30',
          travelBackMins: '0',
          nonLabourCosts: false,
          nonLabourDesc: 'Provider Travel - Non-Labour Costs (Kilometres / Tolls)',
          nonLabourQty: '25',
          nonLabourPricing: '0.99',
          doNotInvoice: false,
          location: defaultTimeSlot.location || undefined,
          room: defaultTimeSlot.room || undefined,
        })
      } else {
        form.setFieldsValue({
          patientId: effectivePatientId,
          diagnosis: matchedPatient?.diagnosis && matchedPatient.diagnosis[0] ? matchedPatient.diagnosis[0] : '',
          fundingType: matchedPatient?.fundingScheme || 'Private',
          date: dayjs(),
          time: dayjs('09:00', 'HH:mm'),
          endTime: dayjs('10:00', 'HH:mm'),
          practitionerId: defaultPracId,
          serviceId: undefined,
          fee: '',
          repeat: 'None',
          providerTravel: false,
          providerTravelDesc: 'Provider Travel - Travel to participant location',
          providerTravelPricing: '193.99',
          travelToMins: '30',
          travelBackMins: '0',
          nonLabourCosts: false,
          nonLabourDesc: 'Provider Travel - Non-Labour Costs (Kilometres / Tolls)',
          nonLabourQty: '25',
          nonLabourPricing: '0.99',
          doNotInvoice: false,
          location: undefined,
          room: undefined,
        })
      }
    }
  }, [isOpen, defaultTimeSlot, store.patients, store.services])

  return (
    <Modal
      title="Create Appointment"
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={700}
      className="rounded-2xl overflow-hidden"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          providerTravel: false,
          providerTravelDesc: 'Provider Travel - Travel to participant location',
          providerTravelPricing: '193.99',
          travelToMins: '30',
          travelBackMins: '0',
          nonLabourCosts: false,
          nonLabourDesc: 'Provider Travel - Non-Labour Costs (Kilometres / Tolls)',
          nonLabourQty: '25',
          nonLabourPricing: '0.99',
          repeat: 'None',
          doNotInvoice: false,
          fundingType: 'Private',
        }}
        className="mt-4 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="patientId" label={<span className="text-slate-600 font-semibold text-xs">Client</span>} rules={[{ required: true }]} className="mb-0">
            <Select 
              showSearch
              optionFilterProp="children"
              placeholder="Select client" 
              className="rounded-xl h-10 flex items-center"
              onChange={(val) => {
                const pat = store.patients.find(p => p.id === val)
                if (pat) {
                  form.setFieldsValue({
                    diagnosis: pat.diagnosis && pat.diagnosis[0] ? pat.diagnosis[0] : '',
                    fundingType: pat.fundingScheme || 'Private',
                  })
                }
              }}
            >
              {store.patients.map(p => {
                const displayName = p.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || p.displayId || 'Unnamed Client'
                return <Option key={p.id} value={p.id}>{displayName}</Option>
              })}
            </Select>
          </Form.Item>
          
          <Form.Item name="practitionerId" label={<span className="text-slate-600 font-semibold text-xs">Practitioner</span>} rules={[{ required: true }]} className="mb-0">
            <Select 
              showSearch
              optionFilterProp="children"
              placeholder="Select practitioner" 
              className="rounded-xl h-10 flex items-center"
            >
              {store.practitioners.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.specialty || 'Practitioner'})</Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Form.Item name="serviceId" label={<span className="text-slate-600 font-semibold text-xs">Appointment Type / Service</span>} rules={[{ required: true }]} className="mb-0 md:col-span-2">
            <Select 
              showSearch
              optionFilterProp="children"
              placeholder="Select service" 
              className="rounded-xl h-10 flex items-center"
              onChange={(val) => {
                const s = (store.services || []).find(item => item.id === val)
                if (s) {
                  const configuredFee = s.price !== undefined && s.price !== null ? s.price : (s.fee !== undefined ? s.fee : 0)
                  form.setFieldsValue({
                    fee: configuredFee,
                    duration: s.duration || 60,
                    ndisLineItem: s.ndisCode || s.code || form.getFieldValue('ndisLineItem')
                  })
                }
              }}
            >
              {store.services.filter(s => !s.archived).map(s => (
                <Option key={s.id} value={s.id}>
                  {s.name} ({s.duration || 60}m) {s.price ? ` - $${s.price}` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="fee" label={<span className="text-slate-600 font-semibold text-xs">Price / Fee ($ AUD)</span>} className="mb-0">
            <Input 
              type="number" 
              step="any" 
              min="0" 
              prefix="$" 
              placeholder="0.00" 
              className="rounded-xl h-10" 
            />
          </Form.Item>

          <Form.Item name="location" label={<span className="text-slate-600 font-semibold text-xs">Location / Branch</span>} className="mb-0">
            <Select
              showSearch
              allowClear
              placeholder="Select branch / location"
              className="rounded-xl h-10 flex items-center"
              optionFilterProp="children"
            >
              {(store.branches || []).filter(b => b.isActive !== false).map(b => (
                <Option key={b.id} value={b.name}>{b.name}</Option>
              ))}
              {(store.branches || []).length === 0 && (
                <Option value="Main Clinic">Main Clinic</Option>
              )}
              <Option value="Telehealth">Telehealth (Remote)</Option>
              <Option value="Home Visit">Home Visit</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Form.Item name="room" label={<span className="text-slate-600 font-semibold text-xs">Room / Resource</span>} className="mb-0">
            <Select
              showSearch
              allowClear
              placeholder="Select room"
              className="rounded-xl h-10 flex items-center"
              optionFilterProp="children"
            >
              <Option value="Room 1">Room 1</Option>
              <Option value="Room 2">Room 2</Option>
              <Option value="Room 3">Room 3</Option>
              <Option value="Room 4">Room 4</Option>
              <Option value="Gym">Gym / Exercise Area</Option>
              <Option value="Hydrotherapy">Hydrotherapy Pool</Option>
              <Option value="Telehealth">Telehealth (Virtual)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="date" label={<span className="text-slate-600 font-semibold text-xs">Date</span>} rules={[{ required: true }]} className="mb-0">
            <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="time" label={<span className="text-slate-600 font-semibold text-xs">Start Time</span>} rules={[{ required: true }]} className="mb-0">
            <TimePicker className="w-full rounded-xl h-10" format="HH:mm" minuteStep={15} />
          </Form.Item>

          <Form.Item name="endTime" label={<span className="text-slate-600 font-semibold text-xs">End Time</span>} rules={[{ required: true }]} className="mb-0">
            <TimePicker className="w-full rounded-xl h-10" format="HH:mm" minuteStep={15} />
          </Form.Item>

          <Form.Item name="caseName" label={<span className="text-slate-600 font-semibold text-xs">Case (optional)</span>} className="mb-0">
            <Input placeholder="e.g. Back Injury" className="rounded-xl h-10" />
          </Form.Item>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-[#8C4BFF]/30 dark:border-purple-900/50 p-4 rounded-2xl relative mb-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8C4BFF] rounded-l-2xl"></div>
          
          <Form.Item name="repeatToggle" valuePropName="checked" className="mb-3">
            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
            <span className="ml-3 font-bold text-slate-700 dark:text-slate-200">Repeat</span>
          </Form.Item>

          {isRecurring && (
            <div className="pl-14 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700 dark:text-slate-200 w-12 text-sm">Repeat:</span>
                <Form.Item name="repeat" className="mb-0 flex-1">
                  <Select className="h-9">
                    <Option value="Daily">Daily</Option>
                    <Option value="Weekly">Weekly</Option>
                    <Option value="Fortnightly">Fortnightly</Option>
                    <Option value="Monthly on day 14">Monthly on day 14</Option>
                    <Option value="Monthly on the third Tuesday">Monthly on the third Tuesday</Option>
                    <Option value="Custom">Custom</Option>
                  </Select>
                </Form.Item>
              </div>
              
              <div className="flex items-start gap-4 mt-4">
                <span className="font-bold text-slate-700 dark:text-slate-200 w-12 text-sm">Ends:</span>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="ends" defaultChecked className="w-4 h-4 text-[#8C4BFF]" />
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">After</span>
                    <Input defaultValue="1" className="w-16 h-9 rounded-lg" />
                    <span className="text-slate-500 font-semibold text-sm">Occurrences</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="ends" className="w-4 h-4 text-[#8C4BFF]" />
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">On</span>
                    <DatePicker format="DD/MM/YYYY" placeholder="Select date" className="h-9 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="fundingType" label={<span className="text-slate-600 font-semibold text-xs">Funding Type</span>} className="mb-0">
            <Select className="rounded-xl h-10 flex items-center">
              <Option value="NDIS">NDIS</Option>
              <Option value="Private">Private</Option>
              <Option value="Medicare">Medicare</Option>
              <Option value="DVA">DVA</Option>
              <Option value="WorkCover">WorkCover</Option>
            </Select>
          </Form.Item>
        </div>

        {/* Travel Options (Exact Screenshot Match) */}
        <div className="bg-white dark:bg-slate-900 border border-[#8C4BFF]/30 dark:border-purple-900/50 p-5 rounded-2xl flex flex-col gap-5 mt-4 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8C4BFF] rounded-l-2xl"></div>
          
          {/* Main Provider Travel Toggle & Fields */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center">
              <Form.Item name="providerTravel" valuePropName="checked" className="mb-0">
                <Switch 
                  checkedChildren="ON" 
                  unCheckedChildren="OFF" 
                  onChange={(checked) => {
                    form.setFieldsValue({ providerTravel: checked })
                    if (checked) {
                      const curDesc = form.getFieldValue('providerTravelDesc')
                      form.setFieldsValue({
                        providerTravelDesc: (curDesc && curDesc.trim()) ? curDesc : 'Provider Travel - Travel to participant location',
                        providerTravelPricing: form.getFieldValue('providerTravelPricing') || '193.99',
                        travelToMins: form.getFieldValue('travelToMins') || '30',
                        travelBackMins: form.getFieldValue('travelBackMins') || '0'
                      })
                    }
                  }}
                />
              </Form.Item>
              <span className="ml-3 font-bold text-slate-700 dark:text-slate-200">Provider travel</span>
            </div>
            
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.providerTravel !== curr.providerTravel}>
              {({ getFieldValue }) => getFieldValue('providerTravel') ? (
                <>
                  <Form.Item name="providerTravelDesc" label={<span className="text-red-500 font-bold text-xs">Description *</span>} className="mb-0 flex-1" labelCol={{ span: 6 }}>
                    <Input placeholder="Provider Travel - Travel to participant location" className="rounded-lg h-9" />
                  </Form.Item>
                  
                  <Form.Item name="providerTravelPricing" label={<span className="text-red-500 font-bold text-xs">Pricing *</span>} className="mb-0 flex-1" labelCol={{ span: 6 }}>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        min="0"
                        step="any"
                        placeholder="193.99" 
                        className="rounded-lg h-9 w-32" 
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                        }}
                      />
                      <span className="text-slate-400 text-xs">/ hour</span>
                    </div>
                  </Form.Item>
                  
                  <Form.Item name="providerTravelAddress" label={<span className="text-slate-700 font-bold text-xs">Address :</span>} className="mb-0 flex-1" labelCol={{ span: 6 }}>
                    <Input placeholder="Search an address" className="rounded-lg h-9" />
                  </Form.Item>

                  <div className="border-t border-[#8C4BFF]/20 pt-4">
                    <h5 className="font-extrabold text-sm mb-3">Travel to the client</h5>
                    <Form.Item name="travelToMins" label={<span className="text-red-500 font-bold text-xs">Minutes *</span>} className="mb-0" labelCol={{ span: 6 }}>
                      <Input placeholder="30" className="rounded-lg h-9 w-24" />
                    </Form.Item>
                  </div>
                  
                  <div className="border-t border-[#8C4BFF]/20 pt-4">
                    <h5 className="font-extrabold text-sm mb-3">Travel back from the client</h5>
                    <Form.Item name="travelBackMins" label={<span className="text-red-500 font-bold text-xs">Minutes *</span>} className="mb-0" labelCol={{ span: 6 }}>
                      <Input placeholder="0" className="rounded-lg h-9 w-24" />
                    </Form.Item>
                  </div>
                </>
              ) : null}
            </Form.Item>
          </div>

          <div className="border-t border-[#8C4BFF]/20 pt-4 flex flex-col gap-4">
            <div className="flex items-center">
              <Form.Item name="nonLabourCosts" valuePropName="checked" className="mb-0">
                <Switch 
                  checkedChildren="ON" 
                  unCheckedChildren="OFF" 
                  onChange={(checked) => {
                    form.setFieldsValue({ nonLabourCosts: checked })
                    if (checked) {
                      const curDesc = form.getFieldValue('nonLabourDesc')
                      form.setFieldsValue({
                        nonLabourDesc: (curDesc && curDesc.trim()) ? curDesc : 'Provider Travel - Non-Labour Costs (Kilometres / Tolls)',
                        nonLabourQty: form.getFieldValue('nonLabourQty') || '25',
                        nonLabourPricing: form.getFieldValue('nonLabourPricing') || '0.99'
                      })
                    }
                  }}
                />
              </Form.Item>
              <span className="ml-3 font-bold text-slate-700 dark:text-slate-200">Provider Travel - non-labour costs</span>
            </div>
            
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.nonLabourCosts !== curr.nonLabourCosts}>
              {({ getFieldValue }) => getFieldValue('nonLabourCosts') ? (
                <>
                  <div className="flex flex-col gap-3">
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                      <Form.Item name="nonLabourDesc" label={<span className="text-red-500 font-bold text-xs">Description *</span>} className="mb-0" labelCol={{ span: 6 }}>
                        <Input placeholder="Provider Travel - Non-Labour Costs (Kilometres / Tolls)" className="rounded-lg h-9" />
                      </Form.Item>
                      
                      <Form.Item name="nonLabourQty" label={<span className="text-red-500 font-bold text-xs">Quantity *</span>} className="mb-0" labelCol={{ span: 6 }}>
                        <Input placeholder="28" className="rounded-lg h-9 w-24" />
                      </Form.Item>
                      
                      <Form.Item name="nonLabourPricing" label={<span className="text-red-500 font-bold text-xs">Pricing *</span>} className="mb-0" labelCol={{ span: 6 }}>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.99" 
                            className="rounded-lg h-9 w-24" 
                            onKeyDown={(e) => {
                              if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                            }}
                          />
                          <span className="text-slate-400 text-xs font-semibold">/ km</span>
                        </div>
                      </Form.Item>
                    </div>

                    {extraNonLabourCosts.map((item, index) => (
                      <div key={item.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3 relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-500">Additional Non-Labour Cost #{index + 1}</span>
                          <Button 
                            type="text" 
                            danger 
                            size="small" 
                            onClick={() => setExtraNonLabourCosts(prev => prev.filter(i => i.id !== item.id))}
                            className="text-xs font-semibold"
                          >
                            Remove
                          </Button>
                        </div>
                        <Form.Item name={['extraNonLabourDesc', item.id]} label={<span className="text-red-500 font-bold text-xs">Description *</span>} className="mb-0" labelCol={{ span: 6 }}>
                          <Input placeholder="Provider Travel - Non-Labour Costs (Kilometres / Tolls)" className="rounded-lg h-9" />
                        </Form.Item>
                        
                        <Form.Item name={['extraNonLabourQty', item.id]} label={<span className="text-red-500 font-bold text-xs">Quantity *</span>} className="mb-0" labelCol={{ span: 6 }}>
                          <Input placeholder="1" className="rounded-lg h-9 w-24" />
                        </Form.Item>
                        
                        <Form.Item name={['extraNonLabourPricing', item.id]} label={<span className="text-red-500 font-bold text-xs">Pricing *</span>} className="mb-0" labelCol={{ span: 6 }}>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0.99" 
                              className="rounded-lg h-9 w-24" 
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                              }}
                            />
                            <span className="text-slate-400 text-xs font-semibold">/ km</span>
                          </div>
                        </Form.Item>
                      </div>
                    ))}

                    <Button 
                      type="dashed" 
                      onClick={() => {
                        const newId = Date.now()
                        setExtraNonLabourCosts(prev => [...prev, { id: newId }])
                        form.setFieldsValue({
                          extraNonLabourDesc: {
                            ...(form.getFieldValue('extraNonLabourDesc') || {}),
                            [newId]: 'Provider Travel - Non-Labour Costs (Kilometres / Tolls)'
                          },
                          extraNonLabourQty: {
                            ...(form.getFieldValue('extraNonLabourQty') || {}),
                            [newId]: '1'
                          },
                          extraNonLabourPricing: {
                            ...(form.getFieldValue('extraNonLabourPricing') || {}),
                            [newId]: '0.99'
                          }
                        })
                      }}
                      className="w-64 h-9 flex items-center justify-center text-slate-500 font-semibold border-slate-300 hover:border-[#8C4BFF] hover:text-[#8C4BFF]"
                    >
                      + Provider Travel - Non-Labour Costs
                    </Button>
                    </Button>
                  </div>
                </>
              ) : null}
            </Form.Item>
          </div>
        </div>

        {/* Clinical Info */}
        <div className="bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/20 p-4 rounded-2xl mt-4">
          <span className="text-xs font-bold text-brand-purple block mb-3">Clinical Notes / Reason</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item 
              name="diagnosis" 
              label={<span className="text-slate-600 font-semibold text-xs">Diagnosis</span>} 
              className="mb-0"
            >
              <Select 
                showSearch
                placeholder="Select or add diagnosis"
                className="rounded-xl h-10 flex items-center"
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <Space style={{ padding: '0 8px 4px', width: '100%' }}>
                      <Input
                        placeholder="Add new diagnosis..."
                        value={newDiagnosisInput}
                        onChange={(e) => setNewDiagnosisInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddDiagnosis()
                          }
                        }}
                        className="rounded-lg text-xs"
                      />
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<PlusOutlined />} 
                        onClick={handleAddDiagnosis}
                        style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                        className="rounded-lg text-xs font-bold"
                      >
                        Add
                      </Button>
                    </Space>
                  </div>
                )}
              >
                {diagnosisOptions.map(opt => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="bodyPart" 
              label={
                <span className="text-slate-600 font-semibold text-xs">
                  {isPhysiotherapy ? 'Body Part / Intervention' : 'Intervention'}
                </span>
              } 
              className="mb-0"
            >
              <Select 
                showSearch
                placeholder={isPhysiotherapy ? 'Select or add body part / intervention' : 'Select or add intervention'}
                className="rounded-xl h-10 flex items-center"
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <Space style={{ padding: '0 8px 4px', width: '100%' }}>
                      <Input
                        placeholder={isPhysiotherapy ? 'Add new body part / intervention...' : 'Add new intervention...'}
                        value={newInterventionInput}
                        onChange={(e) => setNewInterventionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddIntervention()
                          }
                        }}
                        className="rounded-lg text-xs"
                      />
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<PlusOutlined />} 
                        onClick={handleAddIntervention}
                        style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                        className="rounded-lg text-xs font-bold"
                      >
                        Add
                      </Button>
                    </Space>
                  </div>
                )}
              >
                {interventionOptions.map(opt => (
                  <Option key={opt} value={opt}>{opt}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Point 2: Show NDIS line item ONLY when an NDIS service is selected */}
          {isNdisService && (
            <div className="mt-3">
              <Form.Item 
                name="ndisLineItem" 
                label={
                  <span className="text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C4BFF]"></span>
                    NDIS Line Item (NDIS Service Active)
                  </span>
                } 
                className="mb-0"
              >
                <Input placeholder="e.g. 15_056_0128_1_3" className="rounded-xl h-10 font-mono" />
              </Form.Item>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <Form.Item name="notes" label={<span className="text-slate-600 font-semibold text-xs">Notes</span>} className="mb-0">
            <Input.TextArea rows={2} className="rounded-xl" placeholder="Notes..." />
          </Form.Item>
        </div>

        {/* Billing */}
        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
          <Form.Item name="doNotInvoice" label={<span className="text-slate-600 font-semibold text-xs">Mark as Do Not Invoice</span>} valuePropName="checked" className="mb-0">
            <Switch />
          </Form.Item>
          
          <Space>
            <Button onClick={onCancel} className="rounded-xl">Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', color: 'white', border: 'none' }} className="rounded-xl font-bold px-6">
              Schedule Appointment
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}
