import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Select, Form, Input, InputNumber, Switch, Divider, Modal, Tooltip, Space, DatePicker } from 'antd'
import {
  DollarOutlined,
  PlusOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FilePdfOutlined,
  MailOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { useClinicStore } from '../../../../store/clinicStore'
import { useNavigate } from 'react-router-dom'

const { Option } = Select

export default function PractitionerBilling({ patientId, clientPatient } = {}) {
  const navigate = useNavigate()
  const store = useClinicStore()
  const [invoiceForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const billingPerm = store.practitionerBillingEnabled
  const [creatingInv, setCreatingInv] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  // Preview & Edit states
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [editVisible, setEditVisible] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [editLineItems, setEditLineItems] = useState([])
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Fetch real data on mount
  useEffect(() => {
    if (store.initStoreData) store.initStoreData()
    if (store.fetchInvoices) store.fetchInvoices()
  }, [])

  useEffect(() => {
    if (clientPatient?.name || clientPatient?.fullName || patientId) {
      invoiceForm.setFieldsValue({
        clientName: clientPatient?.name || clientPatient?.fullName || patientId
      })
    }
  }, [clientPatient, patientId, invoiceForm])

  const toggleBillingPermission = (checked) => {
    store.setPractitionerBillingEnabled(checked)
    toast.success(`Clinic Invoicing Permission: ${checked ? 'ENABLED' : 'DISABLED'}`)
  }

  const getInvoiceDisplayNumber = (inv) => {
    if (!inv) return 'INV-000001'
    if (inv.displayId) return inv.displayId
    if (inv.invoiceNumber) return inv.invoiceNumber
    if (inv.id) {
      if (inv.id.startsWith('INV-')) return inv.id
      return `INV-${inv.id.slice(0, 6).toUpperCase()}`
    }
    return 'INV-000001'
  }

  const handleCreateInvoice = async (values) => {
    const item = store.services.find(s => s.name === values.serviceName) || store.services[0]
    const price = item ? item.price : 120
    
    const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    let practitionerName = 'Dr. Sarah Jenkins'
    if (uStr) {
      const parsed = JSON.parse(uStr)
      if (parsed?.name) practitionerName = parsed.name.startsWith('Dr.') ? parsed.name : `Dr. ${parsed.name}`
    } else if (store.user?.name) {
      practitionerName = store.user.name.startsWith('Dr.') ? store.user.name : `Dr. ${store.user.name}`
    }

    try {
      setCreatingInv(true)
      const newInvData = {
        clientName: values.clientName,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: price,
        due: price,
        status: 'Sent',
        service: item?.name || 'Physiotherapy Session',
        practitionerName,
        items: [
          {
            description: item?.name || 'Physiotherapy Session',
            quantity: 1,
            rate: price,
            total: price
          }
        ]
      }
      
      const created = await store.addInvoice(newInvData)
      toast.success(`Invoice ${created?.invoiceNumber || created?.id} issued successfully!`)
      invoiceForm.resetFields()
    } catch (err) {
      toast.error('Failed to issue invoice. Please try again.')
    } finally {
      setCreatingInv(false)
    }
  }

  // ─── Edit Invoice Workflow (Requirement 2) ──────────────────────────────
  const handleOpenEdit = (invoice) => {
    setEditingInvoice(invoice)
    let parsedItems = []
    if (invoice.items) {
      if (Array.isArray(invoice.items)) parsedItems = invoice.items
      else if (typeof invoice.items === 'string') {
        try { parsedItems = JSON.parse(invoice.items) } catch (e) { parsedItems = [] }
      }
    }
    if (parsedItems.length === 0) {
      parsedItems = [
        {
          id: 1,
          description: invoice.service || 'Physiotherapy Clinical Consultation',
          quantity: 1,
          rate: parseFloat(invoice.amount) || 120.00,
          total: parseFloat(invoice.amount) || 120.00
        }
      ]
    }
    setEditLineItems(parsedItems)
    editForm.resetFields()
    editForm.setFieldsValue({
      clientName: invoice.clientName || invoice.patientName,
      recipient: invoice.recipient || invoice.clientName,
      practitionerName: invoice.practitionerName || store.user?.name || 'Dr. Sarah Jenkins',
      service: invoice.service || 'Physiotherapy Session',
      amount: parseFloat(invoice.amount) || 0,
      due: invoice.due !== undefined ? parseFloat(invoice.due) : parseFloat(invoice.amount) || 0,
      status: invoice.status || 'Processing',
      sentStatus: invoice.sentStatus || 'Not Sent',
      issueDate: invoice.issueDate ? dayjs(invoice.issueDate) : dayjs(),
      dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : dayjs().add(7, 'day')
    })
    setEditVisible(true)
  }

  const handleLineItemChange = (index, field, value) => {
    const updated = [...editLineItems]
    updated[index] = { ...updated[index], [field]: value }
    const qty = parseFloat(updated[index].quantity) || 0
    const rate = parseFloat(updated[index].rate) || 0
    updated[index].total = parseFloat((qty * rate).toFixed(2))
    setEditLineItems(updated)
    const newTotal = updated.reduce((sum, it) => sum + (it.total || 0), 0)
    editForm.setFieldsValue({
      amount: newTotal,
      due: editingInvoice?.status === 'Paid' ? 0 : newTotal
    })
  }

  const handleAddLineItem = () => {
    setEditLineItems(prev => [
      ...prev,
      {
        id: Date.now(),
        description: 'Clinical Therapy Service Item',
        quantity: 1,
        rate: 80.00,
        total: 80.00
      }
    ])
  }

  const handleRemoveLineItem = (index) => {
    if (editLineItems.length <= 1) {
      toast.error('Invoice must have at least one line item')
      return
    }
    const updated = editLineItems.filter((_, i) => i !== index)
    setEditLineItems(updated)
    const newTotal = updated.reduce((sum, it) => sum + (it.total || 0), 0)
    editForm.setFieldsValue({
      amount: newTotal,
      due: editingInvoice?.status === 'Paid' ? 0 : newTotal
    })
  }

  const handleSaveEdit = async (values) => {
    if (!editingInvoice) return
    setSubmittingEdit(true)
    const totalAmt = parseFloat(values.amount) || editLineItems.reduce((sum, it) => sum + (it.total || 0), 0)
    const dueAmt = values.status === 'Paid' ? 0 : (values.due !== undefined ? parseFloat(values.due) : totalAmt)

    const updatedData = {
      clientName: values.clientName,
      patientName: values.clientName,
      recipient: values.recipient || values.clientName,
      practitionerName: values.practitionerName,
      service: values.service || editLineItems[0]?.description || 'Clinical Care',
      amount: totalAmt,
      due: dueAmt,
      status: values.status || editingInvoice.status || 'Processing',
      sentStatus: values.sentStatus || editingInvoice.sentStatus || 'Not Sent',
      issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : (editingInvoice.issueDate || dayjs().format('YYYY-MM-DD')),
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : (editingInvoice.dueDate || dayjs().add(7, 'day').format('YYYY-MM-DD')),
      items: editLineItems
    }

    try {
      await store.updateInvoice({ id: editingInvoice.id, ...updatedData })
      toast.success(`Invoice ${getInvoiceDisplayNumber(editingInvoice)} updated successfully!`)
      setEditVisible(false)
      setEditingInvoice(null)
    } catch (err) {
      toast.error('Failed to update invoice.')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // ─── PDF Preview & Download (Requirement 1) ──────────────────────────────
  const handleOpenPreview = (invoice) => {
    setPreviewInvoice(invoice)
    setPreviewVisible(true)
  }

  const handlePrintOrDownloadPDF = (invoice) => {
    if (!invoice) return
    const invNum = getInvoiceDisplayNumber(invoice)
    const clientName = invoice.clientName || invoice.patientName || 'Client'
    const recipientName = invoice.recipient || clientName
    const practitionerName = invoice.practitionerName || 'Attending Clinician'
    const clinicFlags = (store.clinicDetails?.featureFlags && typeof store.clinicDetails.featureFlags === 'object') ? store.clinicDetails.featureFlags : {}
    const clinicName = store.clinicDetails?.name || 'Healthcare Clinic'
    const clinicAddress = store.clinicDetails?.address || clinicFlags.address || ''
    const clinicPhone = store.clinicDetails?.phone || clinicFlags.phone || ''
    const clinicEmail = store.clinicDetails?.email || clinicFlags.email || ''
    const clinicAbn = clinicFlags.abn || store.clinicDetails?.abn || ''
    const bankName = clinicFlags.bankName || 'Direct Deposit / EFT'
    const bankBsb = clinicFlags.bsb || ''
    const bankAccount = clinicFlags.accountNumber || ''
    const issueDateStr = invoice.issueDate ? dayjs(invoice.issueDate).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')
    const dueDateStr = invoice.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY') : dayjs().add(7, 'day').format('DD/MM/YYYY')
    const isPaid = (invoice.status || '').toLowerCase() === 'paid' || (invoice.status || '').toLowerCase() === 'completed' || parseFloat(invoice.due) === 0
    const totalAmountStr = (parseFloat(invoice.amount) || 0).toFixed(2)
    const dueAmountStr = isPaid ? '0.00' : (parseFloat(invoice.due) || 0).toFixed(2)
    const paidToDateStr = isPaid ? totalAmountStr : Math.max(0, (parseFloat(invoice.amount) || 0) - (parseFloat(invoice.due) || 0)).toFixed(2)

    let lines = []
    if (invoice.items) {
      if (Array.isArray(invoice.items)) lines = invoice.items
      else if (typeof invoice.items === 'string') {
        try { lines = JSON.parse(invoice.items) } catch (e) { lines = [] }
      }
    }
    if (lines.length === 0) {
      lines = [
        {
          description: invoice.service || 'Physiotherapy Clinical Consultation & Treatment',
          quantity: 1,
          rate: parseFloat(invoice.amount) || 120.00,
          total: parseFloat(invoice.amount) || 120.00
        }
      ]
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${invNum}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; background: #ffffff; }
            .invoice-box { max-width: 760px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; }
            .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8C4BFF; padding-bottom: 24px; margin-bottom: 28px; }
            .brand-name { font-size: 24px; font-weight: 900; color: #8C4BFF; letter-spacing: -0.02em; }
            .brand-sub { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5; }
            .inv-meta-right { text-align: right; }
            .inv-title { font-size: 28px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; }
            .inv-number { font-size: 14px; font-weight: 800; color: #8C4BFF; margin-top: 4px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .section-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 6px; }
            .section-title { font-size: 15px; font-weight: 800; color: #0f172a; }
            .section-detail { font-size: 12px; color: #64748b; margin-top: 3px; line-height: 1.4; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
            .items-table th { text-align: left; padding: 12px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; }
            .items-table td { padding: 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .text-right { text-align: right; }
            .totals-container { display: flex; justify-content: flex-end; margin-bottom: 32px; }
            .totals-card { width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
            .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px; }
            .totals-row.total-bold { font-size: 16px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 8px; }
            .totals-row.due-highlight { font-size: 18px; font-weight: 900; color: #dc2626; border-top: 2px solid #dc2626; padding-top: 10px; margin-top: 8px; }
            .paid-badge { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 900; font-size: 13px; text-transform: uppercase; padding: 4px 12px; border-radius: 8px; }
            .payment-info { background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 12px; padding: 18px; margin-bottom: 28px; font-size: 12px; color: #701a75; }
            .payment-info h4 { font-size: 13px; font-weight: 800; margin-bottom: 6px; }
            .footer-note { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; }
            @media print {
              body { padding: 0; background: none; }
              .invoice-box { border: none; padding: 0; max-width: 100%; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header-row">
              <div>
                <div class="brand-name">${clinicName}</div>
                ${clinicAddress ? `<div class="brand-sub">${clinicAddress}</div>` : ''}
                ${(clinicPhone || clinicEmail) ? `<div class="brand-sub">${clinicPhone ? `Phone: ${clinicPhone}` : ''} ${clinicPhone && clinicEmail ? '|' : ''} ${clinicEmail ? `Email: ${clinicEmail}` : ''}</div>` : ''}
                ${clinicAbn ? `<div class="brand-sub">ABN: ${clinicAbn}</div>` : ''}
              </div>
              <div class="inv-meta-right">
                <div class="inv-title">TAX INVOICE</div>
                <div class="inv-number">${invNum}</div>
                <div style="margin-top: 6px;">
                  ${isPaid ? '<span class="paid-badge">&#10003; PAID IN FULL</span>' : '<span style="font-weight: 800; color: #ea580c; font-size: 12px; text-transform: uppercase;">PAYMENT DUE</span>'}
                </div>
              </div>
            </div>

            <div class="grid-2">
              <div>
                <div class="section-label">Billed To (Client / Organization)</div>
                <div class="section-title">${clientName}</div>
                ${recipientName && recipientName !== clientName ? `<div class="section-detail">Care of: <strong>${recipientName}</strong></div>` : ''}
                <div class="section-detail">Attending: ${practitionerName}</div>
              </div>
              <div style="text-align: right;">
                <div class="section-label">Invoice Timeline & Terms</div>
                <div class="section-detail">Issue Date: <strong>${issueDateStr}</strong></div>
                <div class="section-detail">Payment Due: <strong style="color: ${isPaid ? '#0f172a' : '#dc2626'}">${dueDateStr}</strong></div>
                <div class="section-detail">Terms: Net 7 Days / Direct Remittance</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description / Clinical Service</th>
                  <th class="text-right" style="width: 80px;">Qty / Hrs</th>
                  <th class="text-right" style="width: 120px;">Unit Rate</th>
                  <th class="text-right" style="width: 120px;">Amount ($ AUD)</th>
                </tr>
              </thead>
              <tbody>
                ${lines.map(item => `
                  <tr>
                    <td>
                      <strong style="color: #0f172a;">${item.description || 'Clinical Care Service'}</strong>
                      <div style="font-size: 11px; color: #64748b;">Medical Consultation, Clinical Evaluation & Documentation</div>
                    </td>
                    <td class="text-right">${item.quantity || 1}</td>
                    <td class="text-right">$${(parseFloat(item.rate) || 0).toFixed(2)}</td>
                    <td class="text-right" style="font-weight: 800; color: #0f172a;">$${(parseFloat(item.total) || (parseFloat(item.rate) * (parseFloat(item.quantity) || 1)) || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-container">
              <div class="totals-card">
                <div class="totals-row">
                  <span>Subtotal:</span>
                  <span>$${totalAmountStr} AUD</span>
                </div>
                <div class="totals-row">
                  <span>GST (10% / GST-Free):</span>
                  <span>$0.00 AUD</span>
                </div>
                <div class="totals-row total-bold">
                  <span>Total Amount:</span>
                  <span>$${totalAmountStr} AUD</span>
                </div>
                <div class="totals-row" style="color: #16a34a; font-weight: 700; margin-top: 4px;">
                  <span>Paid to Date:</span>
                  <span>-$${paidToDateStr} AUD</span>
                </div>
                <div class="totals-row ${isPaid ? '' : 'due-highlight'}">
                  <span>Balance Due:</span>
                  <span style="${isPaid ? 'color: #16a34a; font-weight: 900; font-size: 16px;' : 'color: #dc2626; font-weight: 900; font-size: 18px;'}">$${dueAmountStr} AUD</span>
                </div>
              </div>
            </div>

            <div class="payment-info">
              <h4>Electronic Funds Transfer / Bank Remittance Details</h4>
              <p>
                <strong>Bank:</strong> ${bankName}
                ${bankBsb ? ` | <strong>BSB:</strong> ${bankBsb}` : ''}
                ${bankAccount ? ` | <strong>Account:</strong> ${bankAccount}` : ''}
              </p>
              <p style="margin-top: 3px;"><strong>Account Name:</strong> ${clinicName} | <strong>Reference:</strong> ${invNum}</p>
            </div>

            <div class="footer-note">
              <p>Thank you for choosing ${clinicName}. Please quote invoice number ${invNum} on all remittances.</p>
              <p>Certified Health Care Provider &bull; Conforms with Australian Health Practitioner Regulation Agency (AHPRA) standards.</p>
            </div>
          </div>
        </body>
      </html>
    `

    let iframe = document.getElementById('practitioner-invoice-print-frame')
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'practitioner-invoice-print-frame'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
    }

    try {
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(htmlContent)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        toast.success(`PDF compilation initiated for ${invNum}!`)
      }, 250)
    } catch (e) {
      const printWin = window.open('', '_blank')
      if (printWin) {
        printWin.document.write(htmlContent)
        printWin.document.close()
        printWin.focus()
        printWin.print()
      }
    }
  }

  const columns = [
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Invoice ID</span>,
      dataIndex: 'id',
      key: 'id',
      render: (text, record) => <span className="font-bold text-slate-800 dark:text-slate-200">{getInvoiceDisplayNumber(record)}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>,
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Service Description</span>,
      dataIndex: 'service',
      key: 'service',
      render: text => <span className="text-slate-500 font-semibold">{text || 'Physiotherapy Session'}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Total Price</span>,
      dataIndex: 'amount',
      key: 'amount',
      render: val => <span className="font-bold text-slate-800 dark:text-slate-200">${val ? parseFloat(val).toFixed(2) : '0.00'}</span>
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: stat => {
        let col = 'default'
        if ((stat || '').toLowerCase() === 'paid') col = 'success'
        if ((stat || '').toLowerCase() === 'sent') col = 'processing'
        if ((stat || '').toLowerCase() === 'draft') col = 'warning'
        return <Tag color={col} className="m-0 border-none font-bold text-[9px] uppercase">{stat}</Tag>
      }
    },
    {
      title: <span className="text-[10px] uppercase font-bold text-slate-400">Actions</span>,
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const isPaid = (record.status || '').toLowerCase() === 'paid'
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="PDF Preview">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleOpenPreview(record)}
                className="rounded-lg font-bold text-xs text-[#8C4BFF] border-purple-200 hover:border-purple-400"
              />
            </Tooltip>
            <Tooltip title="Edit Invoice">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
                className="rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300 hover:border-[#8C4BFF]"
              />
            </Tooltip>
            <Tooltip title="Download / Print PDF">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handlePrintOrDownloadPDF(record)}
                className="rounded-lg font-bold text-xs text-rose-500 border-rose-200 hover:border-rose-400"
              />
            </Tooltip>
            <Button 
              size="small" 
              onClick={() => {
                navigate('/payments', { state: { preselectInvoice: record } })
              }}
              disabled={isPaid}
              className="rounded-lg font-semibold border-slate-200 text-xs"
            >
              {isPaid ? 'Paid' : 'Record Payment'}
            </Button>
          </div>
        )
      }
    }
  ]

  // Filter invoices to match practitioner's patients or specific client
  const allMyInvoices = (store.invoices || []).filter(i => store.patients.some(p => p.name === i.clientName) || store.patients.some(p => p.name === i.patientName))
  const myInvoices = (patientId || clientPatient)
    ? (store.invoices || []).filter(i => 
        (patientId && (i.patientId === patientId || i.clientId === patientId)) ||
        (clientPatient?.id && (i.patientId === clientPatient.id || i.clientId === clientPatient.id)) ||
        (clientPatient?.name && (i.clientName === clientPatient.name || i.patientName === clientPatient.name)) ||
        (clientPatient?.fullName && (i.clientName === clientPatient.fullName || i.patientName === clientPatient.fullName))
      )
    : allMyInvoices

  // Calculated Stats
  const totalRevenue = myInvoices.reduce((sum, item) => sum + ((item.status || '').toLowerCase() === 'paid' ? parseFloat(item.amount) : 0), 0)
  const outstandingBalance = myInvoices.reduce((sum, item) => sum + ((item.status || '').toLowerCase() !== 'paid' ? parseFloat(item.amount) : 0), 0)

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Header with Permission Control Switch */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 p-5 rounded-2xl shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white m-0">Invoices & Financial Ledger</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Track claims invoices, PDF downloads, and review/edit billing line items.
          </p>
        </div>

        {/* Permission Switcher Widget */}
        <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinic Invoicing Permission:</span>
          <Switch 
            checked={billingPerm} 
            onChange={toggleBillingPermission} 
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Revenue Collected', value: `$${totalRevenue.toFixed(2)} AUD`, icon: <ArrowUpOutlined />, color: '#10B981', desc: 'Cleared claims' },
          { label: 'Outstanding Balance Ledger', value: `$${outstandingBalance.toFixed(2)} AUD`, icon: <ExclamationCircleOutlined />, color: '#EF4444', desc: 'Pending insurance claims' },
          { label: 'Total Invoices issued', value: `${myInvoices.length} Invoices`, icon: <DollarOutlined />, color: '#8C4BFF', desc: 'Processed this cycle' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">{kpi.label}</span>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs" 
                style={{ backgroundColor: kpi.color + '15', color: kpi.color }}
              >
                {kpi.icon}
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white m-0 mt-3">{kpi.value}</h3>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-1 block">{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Container */}
      {!billingPerm ? (
        <Card className="border border-red-100 dark:border-slate-850 dark:bg-slate-900 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto text-red-500 text-lg">
            <LockOutlined />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white m-0">Invoicing Access Disabled</h3>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-md mx-auto">
              Your practitioner profile does not have permission to issue invoices. Please enable the <b>Clinic Invoicing Permission</b> switch in the header to unlock billing.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Invoices ledger table */}
          <div className="lg:col-span-2">
            <Card 
              className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
              title={
                <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                  <DollarOutlined style={{ color: '#EC4899' }} /> Invoices Ledger Archives
                </span>
              }
            >
              <Table 
                dataSource={myInvoices}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 6 }}
                className="bg-white dark:bg-slate-900"
              />
            </Card>
          </div>

          {/* Right Column: Invoice Creator */}
          <div className="lg:col-span-1">
            <Card 
              className="border border-slate-150 dark:border-slate-850 dark:bg-slate-900 rounded-2xl shadow-sm"
              title={
                <span className="font-extrabold text-sm text-slate-700 dark:text-white flex items-center gap-2">
                  <PlusOutlined style={{ color: '#8C4BFF' }} /> Create Client Invoice
                </span>
              }
            >
              <Form form={invoiceForm} layout="vertical" onFinish={handleCreateInvoice}>
                <Form.Item name="clientName" label={<span className="text-xs font-semibold text-slate-500">Patient / Client</span>} rules={[{ required: true }]}>
                  <Select placeholder="Choose patient..." className="rounded-xl h-10 flex items-center">
                    {store.patients.map(p => (
                      <Option key={p.id} value={p.name}>{p.name}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="serviceName" label={<span className="text-xs font-semibold text-slate-500">Service Item</span>} rules={[{ required: true }]}>
                  <Select placeholder="Select consultation service..." className="rounded-xl h-10 flex items-center">
                    {store.services.map(s => (
                      <Option key={s.id} value={s.name}>{s.name} (${s.price} AUD)</Option>
                    ))}
                  </Select>
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item name="fundingType" label={<span className="text-xs font-semibold text-slate-500">Funding Type</span>} initialValue="NDIS">
                    <Select className="rounded-xl">
                      <Option value="NDIS">NDIS</Option>
                      <Option value="EPC">EPC Medicare</Option>
                      <Option value="Private">Private Health</Option>
                      <Option value="WorkCover">WorkCover</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="paymentTerms" label={<span className="text-xs font-semibold text-slate-500">Payment Terms</span>} initialValue="7 Days">
                    <Select className="rounded-xl">
                      <Option value="Due Immediately">Due Immediately</Option>
                      <Option value="7 Days">7 Days</Option>
                      <Option value="14 Days">14 Days</Option>
                    </Select>
                  </Form.Item>
                </div>

                <div className="pt-2">
                  <Button loading={creatingInv} type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="w-full rounded-xl font-bold h-10 text-white shadow">
                    Generate & Send Invoice
                  </Button>
                </div>
              </Form>
            </Card>
          </div>
        </div>
      )}

      {/* ─── PDF Preview Modal (Requirement 1) ─── */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <FilePdfOutlined style={{ color: '#8C4BFF', fontSize: 18 }} />
              <span className="font-black text-base text-slate-800 dark:text-white">
                Invoice PDF Preview: {previewInvoice ? getInvoiceDisplayNumber(previewInvoice) : ''}
              </span>
            </div>
            <Tag color={previewInvoice?.status === 'Paid' ? 'success' : 'warning'} className="font-extrabold uppercase rounded-lg border-none">
              {previewInvoice?.status || 'Processing'}
            </Tag>
          </div>
        }
        open={previewVisible}
        onCancel={() => { setPreviewVisible(false); setPreviewInvoice(null); }}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)} className="rounded-xl font-bold">
            Close
          </Button>,
          <Button
            key="edit"
            icon={<EditOutlined />}
            onClick={() => {
              setPreviewVisible(false)
              if (previewInvoice) handleOpenEdit(previewInvoice)
            }}
            className="rounded-xl font-bold"
          >
            Edit Content
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
            className="rounded-xl font-bold text-white shadow"
            onClick={() => handlePrintOrDownloadPDF(previewInvoice)}
          >
            Download / Print PDF
          </Button>
        ]}
        width={760}
        destroyOnHidden
      >
        {previewInvoice && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 font-sans space-y-6 my-2 shadow-sm">
            <div className="flex justify-between items-start border-b border-[#8C4BFF]/20 pb-4">
              <div>
                <h3 className="text-xl font-black text-[#8C4BFF] m-0">{store.clinicDetails?.name || 'Healthcare Clinic'}</h3>
                {(store.clinicDetails?.address || store.clinicDetails?.featureFlags?.address) && (
                  <p className="text-xs text-slate-400 m-0 mt-1">{store.clinicDetails?.address || store.clinicDetails?.featureFlags?.address}</p>
                )}
                <p className="text-xs text-slate-400 m-0">
                  {store.clinicDetails?.phone ? `Phone: ${store.clinicDetails.phone} ` : ''}
                  {store.clinicDetails?.featureFlags?.abn ? `| ABN: ${store.clinicDetails.featureFlags.abn}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block">TAX INVOICE</span>
                <span className="text-lg font-black text-slate-800 dark:text-white block mt-0.5">{getInvoiceDisplayNumber(previewInvoice)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
                <p className="font-extrabold text-sm text-slate-800 dark:text-white m-0">{previewInvoice.clientName || previewInvoice.patientName}</p>
                <p className="text-slate-400 m-0 mt-0.5">Attending: <strong>{previewInvoice.practitionerName || 'Dr. Sarah Jenkins'}</strong></p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timeline & Terms</span>
                <p className="m-0 text-slate-600 dark:text-slate-300">Issue Date: <strong>{previewInvoice.issueDate || dayjs().format('DD/MM/YYYY')}</strong></p>
                <p className="m-0 text-slate-600 dark:text-slate-300 mt-0.5">Due Date: <strong className="text-rose-500">{previewInvoice.dueDate || dayjs().add(7, 'day').format('DD/MM/YYYY')}</strong></p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-3 text-left">Service Item</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{previewInvoice.service || 'Physiotherapy Consultation'}</td>
                    <td className="p-3 text-right">1</td>
                    <td className="p-3 text-right">${(parseFloat(previewInvoice.amount) || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-slate-800 dark:text-white">${(parseFloat(previewInvoice.amount) || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>${(parseFloat(previewInvoice.amount) || 0).toFixed(2)} AUD</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount:</span>
                  <span>${(parseFloat(previewInvoice.amount) || 0).toFixed(2)} AUD</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Edit Invoice Modal (Requirement 2) ─── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-black text-base text-slate-800 dark:text-white">
              Edit Invoice & Line Items: {editingInvoice ? getInvoiceDisplayNumber(editingInvoice) : ''}
            </span>
          </div>
        }
        open={editVisible}
        onCancel={() => { setEditVisible(false); setEditingInvoice(null); }}
        footer={null}
        width={720}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveEdit} className="pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="clientName" label={<span className="text-xs font-semibold text-slate-500">Client / Patient</span>} rules={[{ required: true }]}>
              <Input className="rounded-xl h-10 font-bold" />
            </Form.Item>

            <Form.Item name="practitionerName" label={<span className="text-xs font-semibold text-slate-500">Practitioner</span>} rules={[{ required: true }]}>
              <Input className="rounded-xl h-10 font-bold" />
            </Form.Item>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Invoice Items</span>
              <Button size="small" icon={<PlusOutlined />} onClick={handleAddLineItem} className="rounded-lg text-xs font-bold">
                Add Item
              </Button>
            </div>

            {editLineItems.map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                    className="rounded-lg text-xs font-semibold"
                  />
                </div>
                <div className="col-span-2">
                  <InputNumber
                    min={1}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(val) => handleLineItemChange(idx, 'quantity', val)}
                    className="w-full rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <InputNumber
                    min={0}
                    step={0.01}
                    prefix="$"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(val) => handleLineItemChange(idx, 'rate', val)}
                    className="w-full rounded-lg text-xs font-bold"
                  />
                </div>
                <div className="col-span-1 text-right font-extrabold text-xs text-slate-700 dark:text-slate-200">
                  ${(item.total || 0).toFixed(2)}
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveLineItem(idx)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="amount" label={<span className="text-xs font-semibold text-slate-500">Total ($ AUD)</span>} rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} prefix="$" className="w-full rounded-xl h-10 font-black text-emerald-600 flex items-center" />
            </Form.Item>

            <Form.Item name="issueDate" label={<span className="text-xs font-semibold text-slate-500">Issue Date</span>}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="dueDate" label={<span className="text-xs font-semibold text-slate-500">Due Date</span>}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => setEditVisible(false)} className="rounded-xl font-bold h-10">Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingEdit}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-xl font-bold h-10 px-6 text-white shadow"
            >
              Save & Update Invoice
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
