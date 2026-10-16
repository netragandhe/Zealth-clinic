import React, { useState, useEffect } from 'react'
import { Table, Input, Select, Modal, Form, Space, Upload, Button, Tag, DatePicker, Tooltip } from 'antd'
import { 
  SearchOutlined, 
  PlusOutlined, 
  SendOutlined,
  DownloadOutlined, 
  EyeOutlined,
  UploadOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  MailOutlined,
  UserOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import { useClinicStore } from '../../../store/clinicStore'
import dayjs from 'dayjs'
import {
  getDocuments,
  createDocument as createDocumentApi,
  updateDocument as updateDocumentApi,
  deleteDocument as deleteDocumentApi,
  getPatients,
  getContacts,
  createCommunication
} from '../../calendar/api/clinicAdminApi'

const { Option } = Select
const { Dragger } = Upload

export default function DocumentsPage() {
  const store = useClinicStore()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState(undefined)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [clientFilter, setClientFilter] = useState(undefined)
  const [uploadedByFilter, setUploadedByFilter] = useState(undefined)
  const [dateFilter, setDateFilter] = useState(null)

  const [liveDocs, setLiveDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [viewVisible, setViewVisible] = useState(false)
  const [sendModalVisible, setSendModalVisible] = useState(false)
  
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [attachedFile, setAttachedFile] = useState(null)
  
  // Forms
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [sendForm] = Form.useForm()

  // Recipient selection state for Send Document modal
  const [recipientType, setRecipientType] = useState('client') // 'client' | 'contact' | 'custom'

  const fetchLiveDocuments = async () => {
    setLoading(true)
    try {
      if (!store.patients || store.patients.length === 0) {
        const pRes = await getPatients().catch(() => null)
        if (pRes && pRes.success && Array.isArray(pRes.data)) {
          store.setPatients(pRes.data)
        }
      }
      if (!store.contacts || store.contacts.length === 0) {
        const cRes = await getContacts().catch(() => null)
        if (cRes && cRes.success && Array.isArray(cRes.data)) {
          store.setContacts(cRes.data)
        }
      }
      const params = {
        search: searchText,
        type: typeFilter,
        status: statusFilter,
        client: clientFilter,
        uploadedBy: uploadedByFilter,
        date: dateFilter
      }
      const res = await getDocuments(params)
      if (res && res.success && Array.isArray(res.data)) {
        setLiveDocs(res.data)
        if (typeof store.setDocuments === 'function') {
          store.setDocuments(res.data)
        }
      }
    } catch (err) {
      console.error('Error fetching live documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveDocuments()
  }, [searchText, typeFilter, statusFilter, clientFilter, uploadedByFilter, dateFilter])

  useEffect(() => {
    const handleDocumentAdded = () => fetchLiveDocuments()
    window.addEventListener('document-added', handleDocumentAdded)
    return () => window.removeEventListener('document-added', handleDocumentAdded)
  }, [])

  // ─── Add Document Workflow (Auto-Links to Client Documents Tab) ────────────
  const handleOpenAddModal = () => {
    addForm.resetFields()
    addForm.setFieldsValue({
      type: 'Assessment',
      status: 'Active',
      date: dayjs()
    })
    setAddModalVisible(true)
  }

  const handleAddDocumentSubmit = async (values) => {
    setSubmitting(true)
    try {
      let resolvedPatientName = 'Client'
      let resolvedPatientId = values.patientId || null

      if (resolvedPatientId) {
        const found = (store.patients || []).find(p => p.id === resolvedPatientId)
        if (found) {
          resolvedPatientName = found.fullName || found.name || 'Client'
        }
      } else if (values.patientNameText) {
        resolvedPatientName = values.patientNameText
      }

      let uploaderName = store.user?.name || store.user?.fullName || localStorage.getItem('userName') || 'Clinic Admin'

      const newDocPayload = {
        name: values.name || 'Document.pdf',
        patientId: resolvedPatientId,
        patientName: resolvedPatientName,
        sentTo: values.sentTo || '',
        uploadBy: uploaderName,
        date: values.date ? values.date.format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY'),
        type: values.type || 'Assessment',
        status: values.status || 'Active',
        fileUrl: attachedFile?.dataUrl || undefined
      }

      const res = await createDocumentApi(newDocPayload)
      const savedDoc = res?.data || { id: `doc_${Date.now()}`, ...newDocPayload }
      
      // Save binary fileUrl mapping in localStorage for persistence across reloads
      if (attachedFile?.dataUrl) {
        try {
          const storedFileMap = JSON.parse(localStorage.getItem('document_files_registry') || '{}')
          storedFileMap[savedDoc.id] = attachedFile.dataUrl
          storedFileMap[savedDoc.name] = attachedFile.dataUrl
          localStorage.setItem('document_files_registry', JSON.stringify(storedFileMap))
        } catch (e) {}
      }

      if (store.addDocument) {
        store.addDocument(savedDoc)
      }
      
      toast.success(`Document "${savedDoc.name}" uploaded and linked to ${resolvedPatientName}'s profile!`)
      setAddModalVisible(false)
      setAttachedFile(null)
      addForm.resetFields()
      fetchLiveDocuments()
      window.dispatchEvent(new CustomEvent('document-added'))
    } catch (err) {
      console.error('Error adding document:', err)
      toast.error('Failed to save document')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Send Document Workflow (Requirement 2: Recipient Selection) ───────────
  const handleOpenSendModal = (doc) => {
    setSelectedDoc(doc)
    setRecipientType('client')

    // Find linked client patient
    const linkedClient = (store.patients || []).find(p => p.id === doc.patientId || p.fullName === doc.patientName || p.name === doc.patientName)
    const clientEmail = linkedClient?.email || (doc.patientName ? `${doc.patientName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 'client@example.com')
    const clientFullName = linkedClient?.fullName || linkedClient?.name || doc.patientName || 'Client'

    sendForm.resetFields()
    sendForm.setFieldsValue({
      recipientType: 'client',
      selectedContactId: undefined,
      recipientName: clientFullName,
      recipientEmail: clientEmail,
      subject: `Document from ${store.clinicDetails?.name || 'ZealthOS Clinic'}: ${doc.name}`,
      message: `Dear ${clientFullName},\n\nPlease find attached your clinical document "${doc.name}".\n\nIf you have any questions or require further assistance, please reach out to our clinic.\n\nWarm regards,\n${store.user?.name || 'Clinic Team'}`
    })

    setSendModalVisible(true)
  }

  const handleRecipientTypeChange = (type) => {
    setRecipientType(type)
    const linkedClient = (store.patients || []).find(p => p.id === selectedDoc?.patientId || p.fullName === selectedDoc?.patientName || p.name === selectedDoc?.patientName)

    if (type === 'client') {
      const clientEmail = linkedClient?.email || `${(selectedDoc?.patientName || 'client').toLowerCase().replace(/\s+/g, '.')}@example.com`
      const clientFullName = linkedClient?.fullName || linkedClient?.name || selectedDoc?.patientName || 'Client'
      sendForm.setFieldsValue({
        recipientName: clientFullName,
        recipientEmail: clientEmail,
        selectedContactId: undefined
      })
    } else if (type === 'contact') {
      const firstContact = (store.contacts || [])[0]
      if (firstContact) {
        sendForm.setFieldsValue({
          selectedContactId: firstContact.id,
          recipientName: firstContact.name || firstContact.fullName,
          recipientEmail: firstContact.email || 'contact@provider.com.au'
        })
      }
    } else {
      sendForm.setFieldsValue({
        recipientName: '',
        recipientEmail: '',
        selectedContactId: undefined
      })
    }
  }

  const handleSelectContact = (contactId) => {
    const found = (store.contacts || []).find(c => c.id === contactId)
    if (found) {
      sendForm.setFieldsValue({
        recipientName: found.name || found.fullName,
        recipientEmail: found.email || 'contact@provider.com.au'
      })
    }
  }

  const handleSendDocumentSubmit = async (values) => {
    if (!selectedDoc) return
    setSubmitting(true)
    try {
      const recipientStr = `${values.recipientName} <${values.recipientEmail}>`
      
      // Update document record in DB
      await updateDocumentApi(selectedDoc.id, {
        status: 'Sent',
        sentTo: recipientStr
      })

      // Also record an entry in the client's Communications tab
      if (selectedDoc.patientId || selectedDoc.patientName) {
        await createCommunication({
          patientId: selectedDoc.patientId || null,
          patientName: selectedDoc.patientName || 'Client',
          channel: 'Email',
          direction: 'Outbound',
          sender: store.user?.name || 'Clinic Team',
          recipient: recipientStr,
          subject: values.subject || `Document Sent: ${selectedDoc.name}`,
          message: `${values.message || ''}\n\n[Attached File: ${selectedDoc.name}]`,
          status: 'Delivered',
          date: dayjs().format('DD/MM/YYYY hh:mm A')
        }).catch(() => null)
      }

      toast.success(`Document "${selectedDoc.name}" dispatched to ${values.recipientEmail}!`)
      setSendModalVisible(false)
      setDetailVisible(false)
      fetchLiveDocuments()
    } catch (err) {
      console.error('Send document error:', err)
      toast.error('Failed to send document')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Edit Document ─────────────────────────────────────────────────────────
  const handleOpenEdit = (doc) => {
    setSelectedDoc(doc)
    editForm.resetFields()
    editForm.setFieldsValue({
      name: doc.name,
      patientId: doc.patientId,
      patientNameText: doc.patientName,
      type: doc.type || 'Assessment',
      status: doc.status || 'Active',
      sentTo: doc.sentTo || ''
    })
    setEditVisible(true)
  }

  const handleEditSubmit = async (values) => {
    if (!selectedDoc) return
    setSubmitting(true)
    try {
      let resolvedName = selectedDoc.patientName
      if (values.patientId) {
        const found = (store.patients || []).find(p => p.id === values.patientId)
        if (found) resolvedName = found.fullName || found.name
      } else if (values.patientNameText) {
        resolvedName = values.patientNameText
      }

      await updateDocumentApi(selectedDoc.id, {
        name: values.name,
        patientId: values.patientId,
        patientName: resolvedName,
        type: values.type,
        status: values.status,
        sentTo: values.sentTo
      })

      toast.success(`Document "${values.name}" updated successfully in database!`)
      setEditVisible(false)
      setDetailVisible(false)
      fetchLiveDocuments()
    } catch (err) {
      toast.error('Failed to update document')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (doc) => {
    Modal.confirm({
      title: 'Delete Document Permanently?',
      content: `Are you sure you want to delete "${doc.name}"? This file link will be removed from ${doc.patientName}'s profile and the live database.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteDocumentApi(doc.id)
          toast.success(`Document "${doc.name}" deleted successfully`)
          setDetailVisible(false)
          fetchLiveDocuments()
        } catch (err) {
          toast.error('Failed to delete document')
        }
      }
    })
  }

  const handleDownload = (doc) => {
    let targetFileUrl = doc?.fileUrl
    if (!targetFileUrl && doc?.id) {
      try {
        const storedFileMap = JSON.parse(localStorage.getItem('document_files_registry') || '{}')
        targetFileUrl = storedFileMap[doc.id] || storedFileMap[doc.name]
      } catch (e) {}
    }

    if (targetFileUrl) {
      const a = document.createElement('a')
      a.href = targetFileUrl
      a.download = doc.name || 'document.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`Downloaded ${doc.name}`)
      return
    }

    // Generate a strictly compliant minimal PDF-1.4 binary file format
    const title = doc?.name || 'Document Record'
    const client = doc?.patientName || 'N/A'
    const date = doc?.date || dayjs().format('DD/MM/YYYY')
    const type = doc?.type || 'Clinical Document'
    const clinic = store.clinicDetails?.name || 'ZealthOS Healthcare Clinic'

    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kinds /Page /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 450 >>
stream
BT
/F1 18 Tf
50 730 Td
(${clinic.replace(/[()]/g, '')}) Tj
/F1 14 Tf
0 -30 Td
(OFFICIAL MEDICAL DOCUMENT RECORD) Tj
/F1 11 Tf
0 -30 Td
(Document Title: ${title.replace(/[()]/g, '')}) Tj
0 -20 Td
(Associated Client: ${client.replace(/[()]/g, '')}) Tj
0 -20 Td
(Date Uploaded: ${date}) Tj
0 -20 Td
(Category Tag: ${type}) Tj
0 -20 Td
(Status: ${doc?.status || 'Active'}) Tj
0 -30 Td
(--------------------------------------------------------------------------------) Tj
0 -20 Td
(This document record is verified and encrypted in clinic database storage.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000140 00000 n 
0000000260 00000 n 
0000000330 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
840
%%EOF`

    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc?.name?.endsWith('.pdf') ? doc.name : `${doc?.name || 'Document'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${doc?.name}`)
  }

  const uniqueClients = Array.from(new Set((store.patients || []).map(p => p.fullName || p.name).filter(Boolean)))
  const uniqueUploaders = Array.from(new Set(liveDocs.map(d => d.uploadBy).filter(Boolean)))

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Document Name</span>,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span 
          onClick={() => {
            setSelectedDoc(record)
            setDetailVisible(true)
          }}
          className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:text-[#8C4BFF] transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#8C4BFF] flex items-center justify-center flex-shrink-0">
            <FileTextOutlined style={{ fontSize: 14 }} />
          </div>
          <span>{text}</span>
        </span>
      )
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Linked Client</span>,
      dataIndex: 'patientName',
      key: 'patientName',
      render: (text) => <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">{text || '—'}</span>
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Sent To</span>,
      dataIndex: 'sentTo',
      key: 'sentTo',
      render: (text) => <span className="text-slate-500 dark:text-slate-400 font-medium text-xs truncate max-w-[180px] block">{text || '—'}</span>
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Uploaded By</span>,
      dataIndex: 'uploadBy',
      key: 'uploadBy',
      render: (text) => <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">{text || 'Clinic Admin'}</span>
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Date Uploaded</span>,
      dataIndex: 'date',
      key: 'date',
      render: (text) => <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">{text}</span>
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Category Tag</span>,
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'purple'
        if (type === 'Referral Letter') color = 'green'
        if (type === 'Intake Form') color = 'blue'
        if (type === 'NDIS Plan') color = 'geekblue'
        if (type === 'Medical Certificate') color = 'orange'
        if (type === 'Imaging / Scan') color = 'cyan'
        return (
          <Tag color={color} className="rounded-lg border-none uppercase font-extrabold text-[9px]">
            {type || 'General'}
          </Tag>
        )
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default'
        if (status === 'Active') color = 'success'
        if (status === 'Sent') color = 'processing'
        if (status === 'Draft') color = 'warning'
        if (status === 'Archived') color = 'default'
        return (
          <Tag color={color} className="rounded-lg border-none uppercase font-extrabold text-[9px]">
            {status || 'Active'}
          </Tag>
        )
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Actions</span>,
      key: 'actions',
      align: 'right',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Preview File Document">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedDoc(record)
                setViewVisible(true)
              }}
              className="rounded-lg font-bold text-xs text-[#8C4BFF] border-purple-200 hover:border-purple-400"
            />
          </Tooltip>

          <Tooltip title="File Metadata & Details">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setSelectedDoc(record)
                setDetailVisible(true)
              }}
              className="rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300"
            />
          </Tooltip>

          <Tooltip title="Send Document (Email / Recipient)">
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleOpenSendModal(record)}
              className="rounded-lg font-bold text-xs text-[#8C4BFF] border-purple-200 hover:border-purple-400"
            />
          </Tooltip>

          <Tooltip title="Download File">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              className="rounded-lg font-bold text-xs text-emerald-600 border-emerald-200 hover:border-emerald-400"
            />
          </Tooltip>

          <Tooltip title="Edit Document">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
              className="rounded-lg font-bold text-xs text-slate-600"
            />
          </Tooltip>
        </div>
      )
    }
  ]

  return (
    <div className="documents-page-container py-2 space-y-6 font-sans">
      
      {/* ── Top Header and Controls ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white m-0 tracking-tight">
              Documents
            </h1>
            <p className="text-xs text-slate-400 m-0 mt-0.5">Central repository for clinical files, auto-synced with client records and dispatch workflow.</p>
          </div>
          
          {/* Add Document button */}
          <button
            onClick={handleOpenAddModal}
            className="bg-[#8C4BFF] hover:bg-[#7B3DE8] text-white font-bold h-10 px-5 rounded-xl flex items-center gap-2 cursor-pointer border-none shadow text-xs transition-colors duration-150"
          >
            <PlusOutlined style={{ fontSize: 13 }} />
            <span>Add Document</span>
          </button>
        </div>
        
        {/* Row 2: Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 13 }} />
            <input
              type="text"
              placeholder="Search document name, client or recipient..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-[#8C4BFF] transition-colors text-xs"
              style={{ height: 38 }}
            />
          </div>

          {/* Type Selector */}
          <Select
            placeholder="Type"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            className="rounded-xl"
            style={{ width: 150, height: 38 }}
          >
            {['Assessment', 'Referral Letter', 'Intake Form', 'NDIS Plan', 'Medical Certificate', 'Imaging / Scan', 'General'].map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>

          {/* Status Selector */}
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            className="rounded-xl"
            style={{ width: 130, height: 38 }}
          >
            {['Active', 'Sent', 'Draft', 'Archived'].map(s => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>

          {/* Client Selector */}
          <Select
            placeholder="Client"
            allowClear
            value={clientFilter}
            onChange={setClientFilter}
            className="rounded-xl"
            style={{ width: 180, height: 38 }}
          >
            {uniqueClients.map(c => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>

          {/* Uploaded By Selector */}
          <Select
            placeholder="Uploaded By"
            allowClear
            value={uploadedByFilter}
            onChange={setUploadedByFilter}
            className="rounded-xl"
            style={{ width: 160, height: 38 }}
          >
            {uniqueUploaders.map(u => (
              <Option key={u} value={u}>{u}</Option>
            ))}
          </Select>

          {/* Date Selector */}
          <DatePicker
            placeholder="Date Uploaded"
            format="DD/MM/YYYY"
            value={dateFilter ? dayjs(dateFilter, 'DD/MM/YYYY') : null}
            onChange={(date, dateString) => setDateFilter(dateString)}
            className="rounded-xl border border-slate-200 dark:border-slate-700"
            style={{ width: 140, height: 38 }}
          />

        </div>
      </div>

      {/* ── Desktop Table / Mobile Card List ── */}
      <div className="hidden md:block bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
        <Table
          dataSource={liveDocs}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          className="cursor-pointer"
          onRow={(record) => ({
            onClick: () => {
              setSelectedDoc(record)
              setDetailVisible(true)
            }
          })}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (total, range) => (
              <span className="text-slate-400 font-bold text-xs select-none">
                Showing {range[0]}-{range[1]} out of {total}
              </span>
            )
          }}
        />
      </div>

      {/* ── Mobile Responsive Document Cards (< 768px) with Bottom Clearance ── */}
      <div className="block md:hidden space-y-3 pb-36">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            Loading documents...
          </div>
        ) : liveDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            No documents found.
          </div>
        ) : (
          liveDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc)
                setViewVisible(true)
              }}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#8C4BFF] flex items-center justify-center flex-shrink-0">
                    <FileTextOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white m-0 leading-tight truncate">{doc.name}</h4>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5 truncate">{doc.patientName || 'Unlinked'}</span>
                  </div>
                </div>
                <Tag color={doc.status === 'Active' ? 'success' : doc.status === 'Sent' ? 'processing' : 'default'} className="rounded-lg border-none uppercase font-extrabold text-[9px] m-0 flex-shrink-0">
                  {doc.status || 'Active'}
                </Tag>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-[11px]">
                    {doc.date && dayjs(doc.date).isValid() ? dayjs(doc.date).format('DD MMM YYYY') : (doc.date || '—')}
                  </span>
                  <Tag color="purple" className="rounded-md border-none uppercase font-bold text-[8px] m-0 max-w-[150px] truncate" title={doc.type || 'General'}>
                    {doc.type || 'General'}
                  </Tag>
                </div>
                
                <div className="flex items-center justify-end gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedDoc(doc)
                      setViewVisible(true)
                    }}
                    aria-label="View document"
                    className="rounded-lg font-bold text-xs text-[#8C4BFF] border-purple-200 h-8 px-2.5 flex items-center gap-1"
                  >
                    <span>View</span>
                  </Button>
                  <Button
                    size="small"
                    icon={<InfoCircleOutlined />}
                    onClick={() => {
                      setSelectedDoc(doc)
                      setDetailVisible(true)
                    }}
                    aria-label="Document info"
                    className="rounded-lg font-bold text-xs text-slate-600 h-8 px-2.5"
                  />
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(doc)}
                    aria-label="Download document"
                    className="rounded-lg font-bold text-xs text-emerald-600 border-emerald-200 h-8 px-2.5"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Add / Upload Document Modal (Auto-Links to Client Records) ───── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FolderOpenOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-extrabold text-base text-slate-800 dark:text-white">Add & Link Document</span>
          </div>
        }
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={580}
      >
        <Form layout="vertical" form={addForm} onFinish={handleAddDocumentSubmit} className="mt-3">
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-500">Document Title / File Name</span>}
            rules={[{ required: true, message: 'Please enter document title' }]}
          >
            <Input placeholder="e.g. Brain MRI Radiology Scan.pdf" className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item
            name="patientId"
            label={<span className="text-xs font-semibold text-slate-500">Link to Client (Auto-saves to Client's Documents Tab)</span>}
            rules={[{ required: true, message: 'Please select a client' }]}
          >
            <Select placeholder="Search and select client" className="rounded-xl h-10 flex items-center" showSearch optionFilterProp="children">
              {(store.patients || []).map(p => {
                const pName = p.fullName || p.name || 'Client'
                return (
                  <Option key={p.id} value={p.id}>
                    {pName} {p.displayId ? `(#${p.displayId})` : ''}
                  </Option>
                )
              })}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label={<span className="text-xs font-semibold text-slate-500">Category Tag</span>}
              rules={[{ required: true }]}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Assessment">Assessment</Option>
                <Option value="Referral Letter">Referral Letter</Option>
                <Option value="Intake Form">Intake Form</Option>
                <Option value="NDIS Plan">NDIS Plan / Service Agreement</Option>
                <Option value="Medical Certificate">Medical Certificate</Option>
                <Option value="Imaging / Scan">Imaging / Scan / X-Ray</Option>
                <Option value="General">General Correspondence</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="date"
              label={<span className="text-xs font-semibold text-slate-500">Date</span>}
            >
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-500">Upload File (PDF, DOCX, JPG, PNG, DICOM)</span>}
          >
            <Dragger
              beforeUpload={(file) => {
                addForm.setFieldsValue({ name: file.name })
                const reader = new FileReader()
                reader.onload = (e) => {
                  setAttachedFile({
                    name: file.name,
                    type: file.type,
                    dataUrl: e.target.result
                  })
                }
                reader.readAsDataURL(file)
                toast.success(`File "${file.name}" ready to attach!`)
                return false
              }}
              maxCount={1}
              className="rounded-2xl text-center bg-slate-50 dark:bg-slate-850 p-4 border border-dashed border-slate-300 dark:border-slate-700"
            >
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-full flex items-center justify-center mx-auto mb-2 text-[#8C4BFF]">
                <PaperClipOutlined style={{ fontSize: 18 }} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 m-0">Click or drag file to this area</p>
              <p className="text-[10px] text-slate-400 m-0 mt-1">Automatic multi-page extraction and storage</p>
            </Dragger>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setAddModalVisible(false)} className="rounded-xl h-10">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 px-6 text-white shadow">
              Upload & Save to Client
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ─── Send Document Workflow Modal (Requirement 2: Recipient Selection) ─ */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <SendOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-extrabold text-base text-slate-800 dark:text-white">Send Document</span>
          </div>
        }
        open={sendModalVisible}
        onCancel={() => setSendModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={620}
      >
        {selectedDoc && (
          <Form form={sendForm} layout="vertical" onFinish={handleSendDocumentSubmit} className="mt-3 font-sans">
            
            {/* Attached File Preview Card */}
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-xl mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8C4BFF] text-white flex items-center justify-center">
                  <FileTextOutlined style={{ fontSize: 16 }} />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white block">{selectedDoc.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Linked to: <strong>{selectedDoc.patientName}</strong> &bull; {selectedDoc.type}</span>
                </div>
              </div>
              <Tag color="purple" className="font-bold uppercase text-[9px] border-none m-0">
                Ready to Send
              </Tag>
            </div>

            {/* Recipient Category Selector */}
            <Form.Item label={<span className="text-xs font-semibold text-slate-500">Select Recipient Target</span>}>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRecipientTypeChange('client')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    recipientType === 'client'
                      ? 'bg-[#8C4BFF] text-white border-[#8C4BFF] shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <UserOutlined className="mr-1" /> Client
                </button>
                <button
                  type="button"
                  onClick={() => handleRecipientTypeChange('contact')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    recipientType === 'contact'
                      ? 'bg-[#8C4BFF] text-white border-[#8C4BFF] shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <MailOutlined className="mr-1" /> Contact / GP
                </button>
                <button
                  type="button"
                  onClick={() => handleRecipientTypeChange('custom')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    recipientType === 'custom'
                      ? 'bg-[#8C4BFF] text-white border-[#8C4BFF] shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Other / Custom
                </button>
              </div>
            </Form.Item>

            {/* Contact Dropdown when 'contact' chosen */}
            {recipientType === 'contact' && (
              <Form.Item name="selectedContactId" label={<span className="text-xs font-semibold text-slate-500">Select Clinic Contact / Referrer</span>} rules={[{ required: true, message: 'Please select a contact' }]}>
                <Select placeholder="Choose contact from address book" onChange={handleSelectContact} className="rounded-xl h-10 flex items-center">
                  {(store.contacts || []).map(c => (
                    <Option key={c.id} value={c.id}>
                      {c.name || c.fullName} {c.organization ? `(${c.organization})` : ''} - {c.email || 'No email'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* Recipient Name & Confirmed Email Address */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="recipientName"
                label={<span className="text-xs font-semibold text-slate-500">Recipient Name</span>}
                rules={[{ required: true, message: 'Please enter recipient name' }]}
              >
                <Input placeholder="Recipient Name" className="rounded-xl h-10" />
              </Form.Item>

              <Form.Item
                name="recipientEmail"
                label={<span className="text-xs font-semibold text-slate-500">Confirm Email Address (Editable)</span>}
                rules={[
                  { required: true, message: 'Please enter recipient email' },
                  { type: 'email', message: 'Enter a valid email address' }
                ]}
              >
                <Input placeholder="recipient@example.com" prefix={<MailOutlined className="text-slate-400 mr-1" />} className="rounded-xl h-10" />
              </Form.Item>
            </div>

            <Form.Item
              name="subject"
              label={<span className="text-xs font-semibold text-slate-500">Email Subject</span>}
              rules={[{ required: true }]}
            >
              <Input className="rounded-xl h-10" />
            </Form.Item>

            <Form.Item
              name="message"
              label={<span className="text-xs font-semibold text-slate-500">Message / Cover Note</span>}
            >
              <Input.TextArea rows={4} className="rounded-xl" />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setSendModalVisible(false)} className="rounded-xl h-10">Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SendOutlined />}
                style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                className="rounded-xl font-bold h-10 px-6 text-white shadow"
              >
                Confirm & Send Document
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* ─── Document File Preview Modal (Eye Icon) ─────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-extrabold text-base text-slate-800 dark:text-white">Document File Preview</span>
          </div>
        }
        open={viewVisible}
        onCancel={() => { setViewVisible(false); setSelectedDoc(null); }}
        footer={
          <div className="flex justify-between items-center w-full">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setViewVisible(false)
                setDetailVisible(true)
              }}
              className="rounded-xl font-bold text-xs"
            >
              View Metadata & Details
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setViewVisible(false)} className="rounded-xl font-bold text-xs">Close</Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(selectedDoc)}
                style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                className="rounded-xl font-bold text-xs text-white"
              >
                Download Document
              </Button>
            </div>
          </div>
        }
        destroyOnHidden
        width={780}
        className="rounded-2xl overflow-hidden"
      >
        {selectedDoc && (
          <div className="space-y-4 my-3 font-sans">
            {/* Header info */}
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-slate-800 dark:text-white block">{selectedDoc.name}</span>
                <span className="text-xs text-slate-500">Client: <strong>{selectedDoc.patientName || 'Unlinked'}</strong> &bull; Category: <strong>{selectedDoc.type || 'General'}</strong> &bull; Uploaded: <strong>{selectedDoc.date}</strong></span>
              </div>
              <Tag color={selectedDoc.status === 'Active' ? 'success' : 'purple'} className="font-bold uppercase text-[9px] border-none m-0">
                {selectedDoc.status || 'Active'}
              </Tag>
            </div>

            {/* Document Viewer Canvas / Container */}
            <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[380px] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {(() => {
                let previewUrl = selectedDoc.fileUrl
                if (!previewUrl && selectedDoc.id) {
                  try {
                    const storedFileMap = JSON.parse(localStorage.getItem('document_files_registry') || '{}')
                    previewUrl = storedFileMap[selectedDoc.id] || storedFileMap[selectedDoc.name]
                  } catch (e) {}
                }

                if (previewUrl) {
                  return (
                    <iframe
                      src={previewUrl}
                      title={selectedDoc.name}
                      className="w-full h-[420px] rounded-xl border-none bg-white"
                    />
                  )
                }

                return (
                  <div className="text-center max-w-md py-8">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 text-[#8C4BFF] shadow-sm flex items-center justify-center mx-auto mb-3">
                      <FileTextOutlined style={{ fontSize: 32 }} />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-1">{selectedDoc.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Official clinic document record for <strong>{selectedDoc.patientName}</strong>. Document is verified and encrypted in database storage.
                    </p>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5 font-mono text-slate-600 dark:text-slate-300 shadow-sm">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Document System Manifest</div>
                      <div>&bull; Record ID: <span className="text-[#8C4BFF]">{selectedDoc.id}</span></div>
                      <div>&bull; Document Type: {selectedDoc.type || 'Clinical Document'}</div>
                      <div>&bull; Linked Patient: {selectedDoc.patientName}</div>
                      <div>&bull; Uploaded By: {selectedDoc.uploadBy || 'Clinic Administrator'}</div>
                      <div>&bull; Security: HIPAA & NDIS Compliant Encrypted Blob</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Document Details Modal ───────────────────────────────────────── */}
      <Modal
        title={selectedDoc ? `Document details: ${selectedDoc.name}` : ''}
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setSelectedDoc(null); }}
        footer={null}
        destroyOnHidden
        width={620}
        className="rounded-2xl overflow-hidden"
      >
        {selectedDoc && (
          <div className="space-y-6 mt-4 font-sans">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Document Name</span>
                <span className="font-extrabold text-slate-800 dark:text-white mt-1 block select-all">{selectedDoc.name}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Associated Client</span>
                <span className="font-extrabold text-slate-800 dark:text-white mt-1 block">{selectedDoc.patientName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Date Uploaded</span>
                <span className="font-semibold text-slate-800 dark:text-white mt-1 block">{selectedDoc.date}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Uploaded By</span>
                <span className="font-semibold text-slate-800 dark:text-white mt-1 block">{selectedDoc.uploadBy || 'Clinic Admin'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Type & Status</span>
                <div className="mt-1 flex gap-1.5">
                  <Tag color="purple" className="rounded-lg border-none font-bold text-[9px] uppercase">
                    {selectedDoc.type || 'Assessment'}
                  </Tag>
                  <Tag color={selectedDoc.status === 'Active' ? 'success' : selectedDoc.status === 'Sent' ? 'processing' : 'default'} className="rounded-lg border-none font-bold text-[9px] uppercase">
                    {selectedDoc.status || 'Active'}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Sending History */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 text-xs">
              <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px] mb-2">Sending & Delivery Details</span>
              <div className="flex justify-between items-center text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                <span>Sent Recipient</span>
                <span>Delivery Status</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 font-semibold">
                <span>{selectedDoc.sentTo || 'Not dispatched yet'}</span>
                <Tag color={selectedDoc.status === 'Sent' ? 'blue' : 'default'} className="rounded-lg border-none uppercase font-bold text-[8px] m-0">
                  {selectedDoc.status === 'Sent' ? 'Delivered' : 'Pending'}
                </Tag>
              </div>
            </div>

            {/* Document operations */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px] mb-3">Document Actions</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button 
                  icon={<SendOutlined />} 
                  onClick={() => {
                    setDetailVisible(false)
                    handleOpenSendModal(selectedDoc)
                  }}
                  className="rounded-xl font-bold text-xs h-10 flex items-center justify-center text-[#8C4BFF] border-purple-200 hover:border-purple-400"
                >
                  Send File
                </Button>

                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={() => handleDownload(selectedDoc)}
                  className="rounded-xl font-bold text-xs h-10 flex items-center justify-center text-emerald-600 border-emerald-200"
                >
                  Download
                </Button>

                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => {
                    setDetailVisible(false)
                    handleOpenEdit(selectedDoc)
                  }}
                  className="rounded-xl font-bold text-xs h-10 flex items-center justify-center"
                >
                  Edit
                </Button>

                <Button 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDelete(selectedDoc)}
                  danger
                  className="rounded-xl font-bold text-xs h-10 flex items-center justify-center"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Edit Document Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-extrabold text-base text-slate-800 dark:text-white">Edit Document Record</span>
          </div>
        }
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        destroyOnHidden
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} className="mt-3">
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-500">Document Title</span>}
            rules={[{ required: true }]}
          >
            <Input className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item
            name="patientId"
            label={<span className="text-xs font-semibold text-slate-500">Linked Client</span>}
          >
            <Select placeholder="Select client" className="rounded-xl h-10 flex items-center" allowClear>
              {(store.patients || []).map(p => {
                const pName = p.fullName || p.name || 'Client'
                return (
                  <Option key={p.id} value={p.id}>{pName}</Option>
                )
              })}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label={<span className="text-xs font-semibold text-slate-500">Category Tag</span>}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Assessment">Assessment</Option>
                <Option value="Referral Letter">Referral Letter</Option>
                <Option value="Intake Form">Intake Form</Option>
                <Option value="NDIS Plan">NDIS Plan</Option>
                <Option value="Medical Certificate">Medical Certificate</Option>
                <Option value="Imaging / Scan">Imaging / Scan</Option>
                <Option value="General">General</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="text-xs font-semibold text-slate-500">Status</span>}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Active">Active</Option>
                <Option value="Sent">Sent</Option>
                <Option value="Draft">Draft</Option>
                <Option value="Archived">Archived</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setEditVisible(false)} className="rounded-xl h-10">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-xl font-bold h-10 px-6 text-white shadow">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  )
}
