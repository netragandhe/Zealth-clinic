import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Tag, Input, Select, DatePicker, Modal, Space, Form, InputNumber, Tooltip } from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  DollarOutlined,
  FilePdfOutlined,
  MailOutlined,
  EditOutlined,
  CopyOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PrinterOutlined,
  CreditCardOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getPatients, getPractitioners } from '../../calendar/api/clinicAdminApi'

const { Option } = Select

// Standard unified invoice payment status calculation
export const deriveInvoicePaymentStatus = (invoice) => {
  if (!invoice) return { label: 'Unpaid', key: 'unpaid', color: 'default', bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6' }
  const today = dayjs().startOf('day')
  const amt = parseFloat(invoice.amount) || 0
  const due = invoice.due !== undefined && invoice.due !== null ? parseFloat(invoice.due) : amt
  const s = (invoice.status || '').toLowerCase()
  const ps = (invoice.paymentStatus || '').toLowerCase()

  const isCancelled = s === 'cancelled' || s === 'cancel'
  if (isCancelled) {
    return { label: 'Cancelled', key: 'cancelled', color: 'error', bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }
  }

  const isPaid = s === 'paid' || s === 'completed' || (due === 0 && amt > 0)
  if (isPaid) {
    return { label: 'Paid', key: 'paid', color: 'success', bg: '#DCFCE7', border: '#86EFAC', text: '#15803D' }
  }

  const isDraft = s === 'draft'
  if (isDraft) {
    return { label: 'Draft', key: 'draft', color: 'default', bg: '#F1F5F9', border: '#CBD5E1', text: '#475569' }
  }

  const isPartiallyPaid = ps === 'partially paid' || (due > 0 && due < amt)
  if (isPartiallyPaid) {
    return { label: 'Partially Paid', key: 'partially_paid', color: 'warning', bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }
  }

  const isOverdue = ps === 'overdue' || (due > 0 && invoice.dueDate && dayjs(invoice.dueDate).isBefore(today))
  if (isOverdue) {
    return { label: 'Overdue', key: 'overdue', color: 'error', bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }
  }

  return { label: 'Issued / Unpaid', key: 'unpaid', color: 'purple', bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6' }
}

export default function InvoicesPage() {
  const navigate = useNavigate()
  const store = useClinicStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [practitionerFilter, setPractitionerFilter] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('')
  const [issueDateFilter, setIssueDateFilter] = useState(null)
  const [dueDateFilter, setDueDateFilter] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const activeIdempotencyKeyRef = useRef(null)

  const getOrCreateIdempotencyKey = () => {
    if (!activeIdempotencyKeyRef.current) {
      activeIdempotencyKeyRef.current = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }
    return activeIdempotencyKeyRef.current
  }

  // Details Modal State
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  
  // Create Modal State
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()

  // PDF Preview Modal State (Requirement 1)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null)

  // Edit Invoice Modal State (Requirement 2)
  const [editVisible, setEditVisible] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [editForm] = Form.useForm()
  const [editLineItems, setEditLineItems] = useState([])

  const fetchInvoicesData = async () => {
    setLoading(true)
    try {
      if (!store.patients || store.patients.length === 0) {
        const pRes = await getPatients().catch(() => null)
        if (pRes && pRes.success && Array.isArray(pRes.data)) {
          store.setPatients(pRes.data)
        }
      }
      if (!store.practitioners || store.practitioners.length === 0) {
        const prRes = await getPractitioners().catch(() => null)
        if (prRes && prRes.success && Array.isArray(prRes.data)) {
          store.setPractitioners(prRes.data)
        }
      }
      const res = await getInvoices({
        search: searchText,
        status: statusFilter,
        practitioner: practitionerFilter,
        recipient: recipientFilter,
      })
      if (res && res.success && Array.isArray(res.data)) {
        store.setInvoices(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoicesData()
  }, [searchText, statusFilter, practitionerFilter, recipientFilter])

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

  // action: 'draft' | 'issue'
  const handleCreateInvoice = async (values, action = 'issue') => {
    if (isSubmittingRef.current) {
      console.warn('Duplicate invoice creation request blocked by synchronous submission lock.')
      return
    }
    isSubmittingRef.current = true
    setSubmitting(true)
    const isDraft = action === 'draft'
    const baseAmount = parseFloat(values.amount) || 0
    const taxRate = values.taxRate || (values.taxable ? 'GST on Income' : 'GST Free Income')
    const isTaxable = taxRate === 'GST on Income'
    const gstAmount = isTaxable ? parseFloat((baseAmount * 0.1).toFixed(2)) : 0
    const totalAmount = parseFloat((baseAmount + gstAmount).toFixed(2))

    // Stable submission/idempotency key: retained across network retries, reset on success/cancel
    const idempotencyKey = getOrCreateIdempotencyKey()

    const newInvoice = {
      idempotencyKey,
      clientName: values.clientName,
      patientName: values.clientName,
      recipient: values.recipient || values.clientName,
      practitionerName: values.practitionerName,
      amount: totalAmount,
      due: totalAmount,
      status: isDraft ? 'Draft' : 'Processing',
      sentStatus: isDraft ? 'Not Sent' : 'Not Sent',
      service: values.service || '',
      patientId: values.patientId || null,
      issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : dayjs().add(7, 'day').format('YYYY-MM-DD'),
      items: [
        {
          itemCode: values.itemCode || '',
          description: values.service || '',
          quantity: 1,
          rate: baseAmount,
          total: baseAmount,
          taxRate: taxRate,
          taxable: isTaxable
        }
      ]
    }

    try {
      const res = await createInvoice(newInvoice)
      if (res && res.success && res.data) {
        store.addInvoice(res.data)
        toast.success(isDraft ? 'Invoice saved as Draft!' : 'Invoice created & issued successfully!')
        activeIdempotencyKeyRef.current = null // Key fulfilled: reset for future new invoices
        setCreateVisible(false)
        createForm.resetFields()
        fetchInvoicesData()
      } else {
        toast.error('Failed to create invoice')
      }
    } catch (err) {
      console.error('Create invoice error:', err)
      toast.error('Error creating invoice in backend database')
      // Note: activeIdempotencyKeyRef.current is preserved here so retries reuse the same key!
    } finally {
      isSubmittingRef.current = false
      setSubmitting(false)
    }
  }

  // ─── Open Edit Modal Workflow (Requirement 2) ──────────────────────────────
  const handleOpenEdit = (invoice) => {
    setEditingInvoice(invoice)
    
    let parsedItems = []
    if (invoice.items) {
      if (Array.isArray(invoice.items)) {
        parsedItems = invoice.items
      } else if (typeof invoice.items === 'string') {
        try { parsedItems = JSON.parse(invoice.items) } catch (e) { parsedItems = [] }
      }
    }

    const invoiceAmount = parseFloat(invoice.amount) || 0
    
    if (parsedItems.length === 0) {
      // No items at all — generate a single authoritative line from the invoice amount
      parsedItems = [
        {
          id: 1,
          itemCode: invoice.itemCode || invoice.ndisCode || '',
          description: invoice.service || 'Clinical Care Service',
          quantity: 1,
          rate: invoiceAmount,
          total: invoiceAmount,
          taxRate: 'GST Free Income',
          taxable: false
        }
      ]
    } else {
      // Finding 22: Repair items that have all-zero rates but invoice has a non-zero amount
      const allZeroRates = parsedItems.every(it => !parseFloat(it.rate) && !parseFloat(it.total))
      if (allZeroRates && invoiceAmount > 0) {
        // Distribute amount equally across items
        const perItem = parseFloat((invoiceAmount / parsedItems.length).toFixed(2))
        parsedItems = parsedItems.map((it, i) => {
          const itemTaxRate = it.taxRate || (it.taxable ? 'GST on Income' : 'GST Free Income')
          const isTax = itemTaxRate === 'GST on Income'
          const rateVal = i === parsedItems.length - 1 ? parseFloat((invoiceAmount - perItem * (parsedItems.length - 1)).toFixed(2)) : perItem
          return {
            ...it,
            itemCode: it.itemCode || it.ndisCode || '',
            quantity: parseFloat(it.quantity) || 1,
            rate: rateVal,
            total: rateVal,
            taxRate: itemTaxRate,
            taxable: isTax
          }
        })
      } else {
        parsedItems = parsedItems.map(it => {
          const itemTaxRate = it.taxRate || (it.taxable ? 'GST on Income' : 'GST Free Income')
          const isTax = itemTaxRate === 'GST on Income'
          const qty = it.quantity !== undefined ? parseFloat(it.quantity) : 1
          const rate = parseFloat(it.rate) || 0
          const lineTotal = it.total !== undefined ? parseFloat(it.total) : parseFloat((qty * rate).toFixed(2))
          return {
            ...it,
            itemCode: it.itemCode || it.ndisCode || '',
            quantity: qty,
            rate: rate,
            total: lineTotal,
            taxRate: itemTaxRate,
            taxable: isTax
          }
        })
      }
    }
    setEditLineItems(parsedItems)

    editForm.resetFields()
    editForm.setFieldsValue({
      clientName: invoice.clientName || invoice.patientName,
      recipient: invoice.recipient || invoice.clientName,
      practitionerName: invoice.practitionerName,
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
    const currentItem = { ...updated[index], [field]: value }
    if (field === 'taxRate') {
      currentItem.taxable = value === 'GST on Income'
    }
    if (field === 'itemCode') {
      currentItem.itemCode = value
      currentItem.ndisCode = value
    }
    
    const qty = parseFloat(currentItem.quantity) || 0
    const rate = parseFloat(currentItem.rate) || 0
    currentItem.total = parseFloat((qty * rate).toFixed(2))
    
    updated[index] = currentItem
    setEditLineItems(updated)
    
    const subtotal = updated.reduce((sum, it) => sum + (it.total || 0), 0)
    const gstTotal = updated
      .filter(it => it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true')))
      .reduce((sum, it) => sum + ((it.total || 0) * 0.1), 0)
    const newTotal = parseFloat((subtotal + gstTotal).toFixed(2))
    
    editForm.setFieldsValue({
      amount: newTotal,
      due: editingInvoice?.status === 'Paid' ? 0 : newTotal
    })
  }

  const handleAddLineItem = () => {
    const newItem = {
      id: Date.now(),
      itemCode: '',
      description: 'Clinical Therapy Service Item',
      quantity: 1,
      rate: 80.00,
      total: 80.00,
      taxRate: 'GST Free Income',
      taxable: false
    }
    const updated = [...editLineItems, newItem]
    setEditLineItems(updated)
    const subtotal = updated.reduce((sum, it) => sum + (it.total || 0), 0)
    const gstTotal = updated
      .filter(it => it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true')))
      .reduce((sum, it) => sum + ((it.total || 0) * 0.1), 0)
    const newTotal = parseFloat((subtotal + gstTotal).toFixed(2))
    editForm.setFieldsValue({
      amount: newTotal,
      due: editingInvoice?.status === 'Paid' ? 0 : newTotal
    })
  }

  const handleRemoveLineItem = (index) => {
    if (editLineItems.length <= 1) {
      toast.error('Invoice must have at least one line item')
      return
    }
    const updated = editLineItems.filter((_, i) => i !== index)
    setEditLineItems(updated)
    const subtotal = updated.reduce((sum, it) => sum + (it.total || 0), 0)
    const gstTotal = updated
      .filter(it => it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true')))
      .reduce((sum, it) => sum + ((it.total || 0) * 0.1), 0)
    const newTotal = parseFloat((subtotal + gstTotal).toFixed(2))
    editForm.setFieldsValue({
      amount: newTotal,
      due: editingInvoice?.status === 'Paid' ? 0 : newTotal
    })
  }

  const handleSaveEdit = async (values) => {
    if (!editingInvoice) return
    setSubmitting(true)

    const totalAmt = parseFloat(values.amount) || editLineItems.reduce((sum, it) => sum + (it.total || 0), 0)

    const updatedData = {
      clientName: values.clientName,
      patientName: values.clientName,
      recipient: values.recipient || values.clientName,
      practitionerName: values.practitionerName,
      service: values.service || editLineItems[0]?.description || 'Clinical Care',
      amount: totalAmt,
      status: values.status || editingInvoice.status || 'Processing',
      sentStatus: values.sentStatus || editingInvoice.sentStatus || 'Not Sent',
      issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : (editingInvoice.issueDate || dayjs().format('YYYY-MM-DD')),
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : (editingInvoice.dueDate || dayjs().add(7, 'day').format('YYYY-MM-DD')),
      items: editLineItems
    }

    try {
      const res = await updateInvoice(editingInvoice.id, updatedData)
      if (res && res.success && res.data) {
        store.updateInvoice(res.data)
        toast.success(`Invoice ${getInvoiceDisplayNumber(editingInvoice)} updated and saved to database!`)
        setEditVisible(false)
        setDetailVisible(false)
        fetchInvoicesData()
      } else {
        toast.error('Failed to update invoice')
      }
    } catch (err) {
      console.error('Update invoice error:', err)
      toast.error('Failed to update invoice in backend database')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── PDF Preview & Download Engine (Requirement 1) ─────────────────────────
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
    const clinicName = store.clinicDetails?.name || store.user?.clinicName || 'Healthcare Clinic'
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
    let lines = []
    if (invoice.items) {
      if (Array.isArray(invoice.items)) lines = invoice.items
      else if (typeof invoice.items === 'string') {
        try { lines = JSON.parse(invoice.items) } catch (e) { lines = [] }
      }
    }

    const invoiceBaseAmount = parseFloat(invoice.amount) || 0
    if (lines.length === 0) {
      lines = [
        {
          description: invoice.service || 'Clinical Care Service',
          quantity: 1,
          rate: invoiceBaseAmount,
          total: invoiceBaseAmount
        }
      ]
    } else {
      // Finding 22: Repair items with all-zero rates — distribute invoice amount
      const allZeroRates = lines.every(it => !parseFloat(it.rate) && !parseFloat(it.total))
      if (allZeroRates && invoiceBaseAmount > 0) {
        const perItem = parseFloat((invoiceBaseAmount / lines.length).toFixed(2))
        lines = lines.map((it, i) => ({
          ...it,
          rate: i === lines.length - 1 ? parseFloat((invoiceBaseAmount - perItem * (lines.length - 1)).toFixed(2)) : perItem,
          total: i === lines.length - 1 ? parseFloat((invoiceBaseAmount - perItem * (lines.length - 1)).toFixed(2)) : perItem
        }))
      }
    }

    // Finding 22 & 29: Line items subtotal and dynamic GST calculation
    const itemsDerivedTotal = lines.reduce((s, it) => {
      const q = it.quantity !== undefined ? parseFloat(it.quantity) : 1
      const r = parseFloat(it.rate) || 0
      return s + (it.total !== undefined ? parseFloat(it.total) : parseFloat((q * r).toFixed(2)))
    }, 0)
    const subtotal = itemsDerivedTotal > 0 ? itemsDerivedTotal : invoiceBaseAmount
    const taxableTotal = lines
      .filter(it => it && (it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true'))))
      .reduce((s, it) => {
        const q = it.quantity !== undefined ? parseFloat(it.quantity) : 1
        const r = parseFloat(it.rate) || 0
        return s + (it.total !== undefined ? parseFloat(it.total) : parseFloat((q * r).toFixed(2)))
      }, 0)
    const gstAmount = parseFloat((taxableTotal * 0.1).toFixed(2))
    const reconciledTotal = gstAmount > 0 ? (subtotal + gstAmount) : subtotal
    const subtotalStr = subtotal.toFixed(2)
    const gstStr = gstAmount > 0 ? `$${gstAmount.toFixed(2)} AUD` : '$0.00 (0%)'
    const totalAmountStr = reconciledTotal.toFixed(2)
    const baseDue = parseFloat(invoice.due) !== undefined && invoice.due !== null ? parseFloat(invoice.due) : invoiceBaseAmount
    let paidAmount = 0
    let dueAmount = 0

    if (isPaid) {
      paidAmount = reconciledTotal
      dueAmount = 0
    } else if (baseDue >= invoiceBaseAmount || invoiceBaseAmount <= 0) {
      paidAmount = 0
      dueAmount = reconciledTotal
    } else {
      paidAmount = Math.max(0, invoiceBaseAmount - baseDue)
      dueAmount = Math.max(0, reconciledTotal - paidAmount)
    }

    const dueAmountStr = dueAmount.toFixed(2)
    const paidToDateStr = paidAmount.toFixed(2)

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
            .totals-card { width: 330px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
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
                  <th style="width: 140px;">Item Code</th>
                  <th>Description / Clinical Service</th>
                  <th class="text-right" style="width: 70px;">Qty</th>
                  <th class="text-right" style="width: 90px;">Unit Price</th>
                  <th style="width: 140px;">Tax Rate</th>
                  <th class="text-right" style="width: 110px;">Line Total ($ AUD)</th>
                </tr>
              </thead>
              <tbody>
                ${lines.map(item => {
                  const code = item.itemCode || item.ndisCode || '—'
                  const rateLabel = item.taxRate || (item.taxable ? 'GST on Income' : 'GST Free Income')
                  const isGst = rateLabel === 'GST on Income'
                  const isBasEx = rateLabel === 'BAS Excluded'
                  const badgeColor = isGst ? '#7c3aed' : (isBasEx ? '#475569' : '#059669')
                  const badgeBg = isGst ? '#f5f3ff' : (isBasEx ? '#f1f5f9' : '#ecfdf5')
                  const qty = item.quantity !== undefined ? parseFloat(item.quantity) : 1
                  const rate = parseFloat(item.rate) || 0
                  const lineTotal = item.total !== undefined ? parseFloat(item.total) : parseFloat((qty * rate).toFixed(2))
                  return `
                  <tr>
                    <td><strong style="color: #475569; font-family: monospace; font-size: 11px;">${code}</strong></td>
                    <td>
                      <strong style="color: #0f172a;">${item.description || 'Clinical Care Service'}</strong>
                    </td>
                    <td class="text-right">${qty}</td>
                    <td class="text-right">$${rate.toFixed(2)}</td>
                    <td>
                      <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; padding: 3px 8px; border-radius: 6px; display: inline-block;">
                        ${rateLabel}
                      </span>
                    </td>
                    <td class="text-right" style="font-weight: 800; color: #0f172a;">$${lineTotal.toFixed(2)}</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>

            <div class="totals-container">
              <div class="totals-card">
                <div class="totals-row">
                  <span>Subtotal (Excl. Tax):</span>
                  <span>$${subtotalStr} AUD</span>
                </div>
                <div class="totals-row">
                  <span>GST (10%):</span>
                  <span style="${gstAmount === 0 ? 'font-size: 11px; color: #059669; font-weight: 700;' : ''}">${gstStr}</span>
                </div>
                <div class="totals-row total-bold">
                  <span>Total (Inc. GST):</span>
                  <span>$${totalAmountStr} AUD</span>
                </div>
                ${paidAmount > 0 ? `
                <div class="totals-row" style="color: #16a34a; font-weight: 700; margin-top: 4px;">
                  <span>Paid to Date:</span>
                  <span>-$${paidToDateStr} AUD</span>
                </div>` : `
                <div class="totals-row" style="color: #64748b; margin-top: 4px;">
                  <span>Paid to Date:</span>
                  <span>$0.00 AUD</span>
                </div>`}
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

    let iframe = document.getElementById('invoice-print-frame')
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'invoice-print-frame'
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

  const handleRecordPayment = (invoice) => {
    if (!invoice) return
    setDetailVisible(false)
    setPreviewVisible(false)
    navigate('/payments', { state: { preselectInvoice: invoice } })
  }

  const handleSendInvoice = async (invoice) => {
    try {
      const res = await updateInvoice(invoice.id, { sentStatus: 'Sent' })
      if (res && res.success && res.data) {
        store.updateInvoice(res.data)
        toast.success(`Invoice ${getInvoiceDisplayNumber(invoice)} dispatched to ${invoice.recipient || invoice.clientName}`)
        setDetailVisible(false)
        setPreviewVisible(false)
        fetchInvoicesData()
      }
    } catch (err) {
      console.error('Send invoice error:', err)
      toast.error('Failed to update sent status')
    }
  }

  const handleCancelInvoice = async (invoiceId) => {
    try {
      const res = await updateInvoice(invoiceId, { status: 'Cancelled' })
      if (res && res.success && res.data) {
        store.updateInvoice(res.data)
        toast.success('Invoice marked Cancelled')
        setDetailVisible(false)
        setPreviewVisible(false)
        fetchInvoicesData()
      }
    } catch (err) {
      console.error('Cancel invoice error:', err)
      toast.error('Failed to cancel invoice')
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoice(invoiceId)
      store.deleteInvoice(invoiceId)
      toast.success('Invoice deleted from live database')
      setDetailVisible(false)
      setPreviewVisible(false)
      fetchInvoicesData()
    } catch (err) {
      console.error('Delete invoice error:', err)
      toast.error('Failed to delete invoice from database')
    }
  }

  const invoicesList = (store.invoices || []).filter(Boolean)

  const filteredInvoices = invoicesList.filter(inv => {
    const q = (searchText || '').toLowerCase()
    const matchesSearch = !searchText || 
                          (inv.id || '').toLowerCase().includes(q) ||
                          (inv.displayId || '').toLowerCase().includes(q) ||
                          (inv.invoiceNumber || '').toLowerCase().includes(q) ||
                          (inv.clientName || '').toLowerCase().includes(q) ||
                          (inv.patientName || '').toLowerCase().includes(q) ||
                          (inv.practitionerName || '').toLowerCase().includes(q)
    
    const today = dayjs().startOf('day')
    const amt = parseFloat(inv.amount) || 0
    const due = parseFloat(inv.due) || 0
    const s = (inv.status || '').toLowerCase()
    const ps = (inv.paymentStatus || '').toLowerCase()
    const isOverdue = ps === 'overdue' || (due > 0 && s !== 'paid' && s !== 'draft' && s !== 'cancelled' && s !== 'cancel' && inv.dueDate && dayjs(inv.dueDate).isBefore(today))
    const isPartiallyPaid = ps === 'partially paid' || (due > 0 && due < amt && s !== 'paid' && s !== 'draft' && s !== 'cancelled' && s !== 'cancel')
    const isPaid = s === 'paid' || s === 'completed' || due === 0
    const isDraft = s === 'draft'
    const isCancelled = s === 'cancelled' || s === 'cancel'

    let matchesStatus = true
    if (statusFilter) {
      const f = statusFilter.toLowerCase()
      if (f === 'paid') matchesStatus = isPaid
      else if (f === 'overdue') matchesStatus = isOverdue
      else if (f === 'partially paid') matchesStatus = isPartiallyPaid
      else if (f === 'draft') matchesStatus = isDraft
      else if (f === 'cancel') matchesStatus = isCancelled
      else matchesStatus = (s === 'processing' || s === 'sent' || s === 'issued') && !isOverdue && !isPartiallyPaid && !isPaid
    }
    
    const matchesPractitioner = !practitionerFilter || inv.practitionerName === practitionerFilter
    
    const matchesRecipient = !recipientFilter || 
                             (inv.recipient || '').toLowerCase().includes(recipientFilter.toLowerCase())
                             
    const matchesIssueDate = !issueDateFilter || 
                             (inv.issueDate && dayjs(inv.issueDate).isSame(dayjs(issueDateFilter), 'day'))
                             
    const matchesDueDate = !dueDateFilter || 
                           (inv.dueDate && dayjs(inv.dueDate).isSame(dayjs(dueDateFilter), 'day'))
    
    return matchesSearch && matchesStatus && matchesPractitioner && matchesRecipient && matchesIssueDate && matchesDueDate
  })

  const uniquePractitioners = Array.from(
    new Set(invoicesList.map(inv => inv.practitionerName).filter(Boolean))
  )

  const columns = [
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Invoice #</span>,
      dataIndex: 'displayId',
      key: 'displayId',
      render: (text, record) => {
        const invNum = getInvoiceDisplayNumber(record)
        return <span className="font-bold text-slate-800 dark:text-slate-200">{invNum}</span>
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">To (Client & Company)</span>,
      key: 'to',
      render: (_, record) => {
        let clientDisplayName = record.clientName || record.patientName || ''
        const foundPatient = store.patients.find(p => p.id === clientDisplayName || p.displayId === clientDisplayName || p.id === record.patientId || p.displayId === record.patientId)
        if (foundPatient) {
          clientDisplayName = foundPatient.fullName || foundPatient.name || clientDisplayName
        }
        if (!clientDisplayName || clientDisplayName.startsWith('CLI-') || clientDisplayName.length > 25) {
          if (foundPatient) {
            clientDisplayName = foundPatient.fullName || foundPatient.name
          }
        }
        const finalName = clientDisplayName || 'Client'
        const hasRecipient = record.recipient && record.recipient !== finalName

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{finalName}</span>
            {hasRecipient && (
              <span className="text-[10px] text-slate-400 font-semibold">{record.recipient}</span>
            )}
          </div>
        )
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Practitioner</span>,
      dataIndex: 'practitionerName',
      key: 'practitionerName',
      render: (text) => <span className="text-slate-500 font-semibold dark:text-slate-400">{text}</span>
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Issue date</span>,
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date) => {
        if (!date) return '—'
        return <span className="text-slate-500 dark:text-slate-400">{dayjs(date).format('DD/MM/YYYY')}</span>
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Due date</span>,
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => {
        if (!date) return '—'
        return <span className="text-slate-500 dark:text-slate-400">{dayjs(date).format('DD/MM/YYYY')}</span>
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Amount</span>,
      key: 'amount',
      render: (_, record) => {
        let lines = Array.isArray(record.items) ? record.items : []
        if (typeof record.items === 'string') {
          try { lines = JSON.parse(record.items) } catch (e) { lines = [] }
        }
        const baseAmt = parseFloat(record.amount) || 0
        const subtotal = lines.reduce((s, it) => {
          const q = it.quantity !== undefined ? parseFloat(it.quantity) : 1
          const r = parseFloat(it.rate) || 0
          return s + (it.total !== undefined ? parseFloat(it.total) : parseFloat((q * r).toFixed(2)))
        }, 0)
        const taxableSub = lines
          .filter(it => it && (it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true'))))
          .reduce((s, it) => {
            const q = it.quantity !== undefined ? parseFloat(it.quantity) : 1
            const r = parseFloat(it.rate) || 0
            return s + (it.total !== undefined ? parseFloat(it.total) : parseFloat((q * r).toFixed(2)))
          }, 0)
        const gst = parseFloat((taxableSub * 0.1).toFixed(2))
        const total = gst > 0 ? (subtotal > 0 ? subtotal + gst : baseAmt + gst) : (subtotal > 0 ? subtotal : baseAmt)
        return (
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300">${total.toFixed(2)}</span>
            {gst > 0 ? (
              <span className="block text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                (incl. ${gst.toFixed(2)} GST)
              </span>
            ) : (
              <span className="block text-[9px] text-slate-400 dark:text-slate-500">
                GST-free
              </span>
            )}
          </div>
        )
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Due balance</span>,
      key: 'due',
      render: (_, record) => {
        const isPaid = (record.status || '').toLowerCase() === 'paid' || (record.status || '').toLowerCase() === 'completed'
        if (isPaid) {
          return <span className="font-bold text-emerald-600 dark:text-emerald-400">$0.00</span>
        }
        let lines = Array.isArray(record.items) ? record.items : []
        if (typeof record.items === 'string') {
          try { lines = JSON.parse(record.items) } catch (e) { lines = [] }
        }
        const baseAmt = parseFloat(record.amount) || 0
        const baseDue = record.due !== undefined && record.due !== null ? parseFloat(record.due) : baseAmt
        const subtotal = lines.reduce((s, it) => {
          const q = it.quantity !== undefined ? parseFloat(it.quantity) : 1
          const r = parseFloat(it.rate) || 0
          return s + (it.total !== undefined ? parseFloat(it.total) : parseFloat((q * r).toFixed(2)))
        }, 0)
        const taxableSub = lines
          .filter(it => it && (it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true'))))
          .reduce((s, it) => {
            const q = it.quantity !== undefined ? parseFloat(it.quantity) : 1
            const r = parseFloat(it.rate) || 0
            return s + (it.total !== undefined ? parseFloat(it.total) : parseFloat((q * r).toFixed(2)))
          }, 0)
        const gst = parseFloat((taxableSub * 0.1).toFixed(2))
        const total = gst > 0 ? (subtotal > 0 ? subtotal + gst : baseAmt + gst) : (subtotal > 0 ? subtotal : baseAmt)

        let dueAmount
        if (baseDue >= baseAmt || baseAmt <= 0) {
          dueAmount = total
        } else {
          const paidSoFar = Math.max(0, baseAmt - baseDue)
          dueAmount = Math.max(0, total - paidSoFar)
        }

        if (dueAmount === 0) {
          return <span className="font-bold text-emerald-600 dark:text-emerald-400">$0.00</span>
        }
        return <span className="font-bold text-rose-500">${dueAmount.toFixed(2)}</span>
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Payment Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const st = deriveInvoicePaymentStatus(record)
        const due = parseFloat(record.due) || 0
        const amt = parseFloat(record.amount) || 0

        return (
          <Tooltip title={st.key === 'overdue' ? `Due date passed — $${due.toFixed(2)} still outstanding` : st.key === 'partially_paid' ? `Partial payment received — $${due.toFixed(2)} remaining of $${amt.toFixed(2)}` : null}>
            <span
              className="inline-flex items-center justify-center rounded-lg font-extrabold text-[10px] uppercase tracking-wider"
              style={{ backgroundColor: st.bg, border: `1px solid ${st.border}`, color: st.text, padding: '3px 10px' }}
            >
              {st.label}
            </span>
          </Tooltip>
        )
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Doc Status</span>,
      dataIndex: 'status',
      key: 'docStatus',
      render: (status) => {
        const s = (status || '').toLowerCase()
        const isDraft = s === 'draft'
        return (
          <Tag
            className="font-bold rounded-lg border-none uppercase text-[9px]"
            color={isDraft ? 'default' : 'purple'}
          >
            {isDraft ? 'Draft' : 'Issued'}
          </Tag>
        )
      }
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Delivery</span>,
      dataIndex: 'sentStatus',
      key: 'sentStatus',
      render: (status) => (
        <Tag color={status === 'Sent' ? 'blue' : 'default'} className="font-bold rounded-lg border-none uppercase text-[9px]">
          {status || 'Not Sent'}
        </Tag>
      )
    },
    {
      title: <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Actions</span>,
      key: 'actions',
      align: 'right',
      fixed: 'right',
      width: 145,
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Record Payment">
            <Button
              size="small"
              icon={<CreditCardOutlined />}
              aria-label="Record Payment"
              onClick={() => navigate('/clinic-admin/payments-centre', { state: { preselectInvoice: record } })}
              className="rounded-lg font-bold text-xs text-emerald-600 border-emerald-200 hover:border-emerald-400"
            />
          </Tooltip>

          <Tooltip title="Preview Invoice PDF">
            <Button
              size="small"
              icon={<EyeOutlined />}
              aria-label="Preview Invoice PDF"
              onClick={() => handleOpenPreview(record)}
              className="rounded-lg font-bold text-xs text-[#8C4BFF] border-purple-200 hover:border-purple-400"
            />
          </Tooltip>

          <Tooltip title="Edit Invoice Details">
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label="Edit Invoice Details"
              onClick={() => handleOpenEdit(record)}
              className="rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300 hover:border-[#8C4BFF]"
            />
          </Tooltip>

          <Tooltip title="Download or Print PDF">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              aria-label="Download or Print PDF"
              onClick={() => handlePrintOrDownloadPDF(record)}
              className="rounded-lg font-bold text-xs text-rose-500 border-rose-200 hover:border-rose-400"
            />
          </Tooltip>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white m-0">Invoices</h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">Manage billing, editable invoice drafts, PDF preview, and automated claim dispatch.</p>
        </div>
        <button
          onClick={() => {
            activeIdempotencyKeyRef.current = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            createForm.resetFields()
            createForm.setFieldsValue({
              issueDate: dayjs(),
              dueDate: dayjs().add(7, 'day')
            })
            setCreateVisible(true)
          }}
          className="h-10 rounded-xl flex items-center justify-center text-white border-none cursor-pointer transition-opacity hover:opacity-90 shadow px-5 gap-2 font-bold text-xs"
          style={{ backgroundColor: '#8C4BFF' }}
        >
          <PlusOutlined style={{ fontSize: 13 }} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filter Options Toolbar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <SearchOutlined
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: 13 }}
            />
            <input
              type="text"
              placeholder="Search invoice number, client or practitioner..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-[#8C4BFF] transition-colors text-xs"
              style={{ height: 38 }}
            />
          </div>

          <Select
            placeholder="Payment Status"
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            className="rounded-xl"
            style={{ width: 160, height: 38 }}
          >
            <Option value="Paid">✅ Paid</Option>
            <Option value="Overdue">🔴 Overdue</Option>
            <Option value="Partially Paid">🟡 Partially Paid</Option>
            <Option value="Processing">🟠 Issued / Processing</Option>
            <Option value="Draft">⬜ Draft</Option>
            <Option value="Cancel">❌ Cancelled</Option>
          </Select>

          <Select
            placeholder="Practitioner"
            allowClear
            value={practitionerFilter || undefined}
            onChange={setPractitionerFilter}
            className="rounded-xl"
            style={{ width: 160, height: 38 }}
          >
            {uniquePractitioners.map(p => (
              <Option key={p} value={p}>{p}</Option>
            ))}
          </Select>

          <Input
            placeholder="Filter Recipient"
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700"
            style={{ width: 150, height: 38 }}
          />

          <DatePicker
            placeholder="Issue Date"
            value={issueDateFilter}
            onChange={setIssueDateFilter}
            format="DD/MM/YYYY"
            className="rounded-xl border border-slate-200 dark:border-slate-700"
            style={{ width: 130, height: 38 }}
          />

          <DatePicker
            placeholder="Due Date"
            value={dueDateFilter}
            onChange={setDueDateFilter}
            format="DD/MM/YYYY"
            className="rounded-xl border border-slate-200 dark:border-slate-700"
            style={{ width: 130, height: 38 }}
          />
        </div>
      </div>

      {/* Invoice Grid Table - Desktop */}
      <div className="hidden md:block">
        <Table
          dataSource={filteredInvoices}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 shadow-sm rounded-2xl overflow-hidden cursor-pointer"
          onRow={(record) => ({
            onClick: () => {
              setSelectedInvoice(record)
              setDetailVisible(true)
            }
          })}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (total, range) => (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Showing {range[0]}-{range[1]} out of {total}
              </span>
            )
          }}
        />
      </div>

      {/* Invoice Cards - Mobile */}
      <div className="block md:hidden space-y-4">
        {filteredInvoices.map((inv) => {
          const isOverdue = inv.status !== 'Paid' && inv.status !== 'Draft' && parseFloat(inv.due) > 0 && dayjs(inv.dueDate).isBefore(dayjs(), 'day')
          const isPartiallyPaid = inv.status !== 'Paid' && inv.status !== 'Draft' && parseFloat(inv.due) > 0 && parseFloat(inv.due) < parseFloat(inv.amount)
          
          let statusBadge
          if (inv.status === 'Draft') {
            statusBadge = <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Draft</span>
          } else if (inv.status === 'Paid') {
            statusBadge = <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>
          } else if (isOverdue) {
            statusBadge = <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Overdue</span>
          } else if (isPartiallyPaid) {
            statusBadge = <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Partially Paid</span>
          } else {
            statusBadge = <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Unpaid</span>
          }

          return (
            <div 
              key={inv.id} 
              onClick={() => {
                setSelectedInvoice(inv)
                setDetailVisible(true)
              }}
              className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 shadow-sm rounded-2xl flex flex-col gap-2 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-[#8C4BFF] mb-1">{getInvoiceDisplayNumber(inv)}</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{inv.patientName}</div>
                </div>
                {statusBadge}
              </div>
              
              <div className="flex justify-between items-center mt-2 border-t border-slate-50 dark:border-slate-800 pt-2">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Amount</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">${(parseFloat(inv.amount) || 0).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Balance Due</div>
                  <div className={`text-sm font-bold ${parseFloat(inv.due) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>${(parseFloat(inv.due) || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )
        })}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No invoices found.
          </div>
        )}
      </div>

      {/* ─── Create Invoice Modal ────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <PlusOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-extrabold text-base text-slate-800 dark:text-white">Create New Invoice</span>
          </div>
        }
        open={createVisible}
        onCancel={() => {
          if (isSubmittingRef.current || submitting) return
          activeIdempotencyKeyRef.current = null
          setCreateVisible(false)
        }}
        footer={null}
        destroyOnHidden
        width={560}
      >
        <Form layout="vertical" form={createForm} onFinish={(values) => handleCreateInvoice(values, 'issue')} className="mt-4">
          <Form.Item name="clientName" label={<span className="text-xs font-semibold text-slate-500">Client / Patient Name</span>} rules={[{ required: true, message: 'Please select client' }]}>
            <Select placeholder="Select client patient" className="rounded-xl h-10 flex items-center">
              {store.patients.map(p => {
                const pName = p.fullName || p.name || p.displayId || 'Patient'
                return (
                  <Option key={p.id} value={pName}>
                    {pName} {p.displayId ? `(${p.displayId})` : ''}
                  </Option>
                )
              })}
            </Select>
          </Form.Item>

          <Form.Item name="recipient" label={<span className="text-xs font-semibold text-slate-500">Invoice Recipient / Payer (e.g. Plan Partners, WorkSafe, Client)</span>}>
            <Input placeholder="Leave blank to bill client directly" className="rounded-xl h-10" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="practitionerName" label={<span className="text-xs font-semibold text-slate-500">Attending Practitioner</span>} rules={[{ required: true }]}>
              <Select className="rounded-xl h-10 flex items-center">
                {store.practitioners.map(p => (
                  <Option key={p.id} value={p.name}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="itemCode" label={<span className="text-xs font-semibold text-slate-500">Item Code (e.g. NDIS Code)</span>}>
              <Input placeholder="e.g. 15_056_0128_1_3" className="rounded-xl h-10 font-mono" />
            </Form.Item>
          </div>

          <Form.Item name="service" label={<span className="text-xs font-semibold text-slate-500">Service Description</span>} rules={[{ required: true }]}>
            <Input placeholder="e.g. Physiotherapy Consultation" className="rounded-xl h-10" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="amount" label={<span className="text-xs font-semibold text-slate-500">Service Fee / Amount ($ AUD)</span>} rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} prefix="$" className="w-full rounded-xl h-10 flex items-center font-bold" />
            </Form.Item>
            <Form.Item name="taxRate" label={<span className="text-xs font-semibold text-slate-500">Tax Rate</span>} initialValue="GST Free Income">
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="GST Free Income">GST Free Income (0%)</Option>
                <Option value="GST on Income">GST on Income (10%)</Option>
                <Option value="BAS Excluded">BAS Excluded (0%)</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="issueDate" label={<span className="text-xs font-semibold text-slate-500">Issue Date</span>}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="dueDate" label={<span className="text-xs font-semibold text-slate-500">Due Date</span>}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              disabled={submitting}
              onClick={() => {
                if (isSubmittingRef.current || submitting) return
                activeIdempotencyKeyRef.current = null
                setCreateVisible(false)
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              disabled={submitting}
              loading={submitting}
              onClick={() => {
                if (isSubmittingRef.current || submitting) return
                createForm.validateFields().then(values => handleCreateInvoice(values, 'draft')).catch(() => {})
              }}
              className="rounded-xl font-bold h-10 px-5 border-slate-300 text-slate-600 dark:text-slate-300 dark:border-slate-600 hover:border-[#8C4BFF] hover:text-[#8C4BFF]"
            >
              Save as Draft
            </Button>
            <Button
              disabled={submitting}
              loading={submitting}
              onClick={() => {
                if (isSubmittingRef.current || submitting) return
                createForm.validateFields().then(values => handleCreateInvoice(values, 'issue')).catch(() => {})
              }}
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
              className="rounded-xl font-bold h-10 px-6 text-white shadow"
            >
              Issue Invoice
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ─── Edit Invoice & Preview Workflow Modal (Requirement 2) ─────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined style={{ color: '#8C4BFF' }} />
            <span className="font-extrabold text-base text-slate-800 dark:text-white">
              Edit Invoice: {editingInvoice ? getInvoiceDisplayNumber(editingInvoice) : ''}
            </span>
          </div>
        }
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        destroyOnHidden
        width={1050}
      >
        <Form layout="vertical" form={editForm} onFinish={handleSaveEdit} className="mt-3">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="clientName" label={<span className="text-xs font-semibold text-slate-500">Client / Patient</span>} rules={[{ required: true }]}>
              <Select className="rounded-xl h-10 flex items-center">
                {store.patients.map(p => {
                  const pName = p.fullName || p.name || p.displayId || 'Patient'
                  return (
                    <Option key={p.id} value={pName}>{pName}</Option>
                  )
                })}
              </Select>
            </Form.Item>

            <Form.Item name="recipient" label={<span className="text-xs font-semibold text-slate-500">Recipient / Payer Organization</span>}>
              <Input placeholder="e.g. Plan Partners Co / Insurer" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="practitionerName" label={<span className="text-xs font-semibold text-slate-500">Attending Practitioner</span>} rules={[{ required: true }]}>
              <Select className="rounded-xl h-10 flex items-center">
                {store.practitioners.map(p => (
                  <Option key={p.id} value={p.name}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="service" label={<span className="text-xs font-semibold text-slate-500">Primary Category</span>}>
              <Input placeholder="Physiotherapy / Occupational Therapy" className="rounded-xl h-10" />
            </Form.Item>
          </div>

          {/* Line Items Editor */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Itemized Services & Billing Lines
              </span>
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddLineItem} className="rounded-lg text-xs font-bold text-[#8C4BFF]">
                Add Line Item
              </Button>
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3">
              <div className="col-span-2">Item Code</div>
              <div className="col-span-3">Description of Service</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2">Unit Price ($)</div>
              <div className="col-span-2">Tax Rate</div>
              <div className="col-span-1 text-right">Line Total</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {editLineItems.map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-12 gap-3 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="col-span-2">
                  <Input
                    placeholder="e.g. 15_056_0128_1_3"
                    value={item.itemCode || item.ndisCode || ''}
                    onChange={(e) => handleLineItemChange(idx, 'itemCode', e.target.value)}
                    className="rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                    className="rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <InputNumber
                    min={0.01}
                    step={0.01}
                    precision={2}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(val) => handleLineItemChange(idx, 'quantity', val)}
                    className="w-full rounded-lg text-xs text-center"
                  />
                </div>
                <div className="col-span-2">
                  <InputNumber
                    min={0}
                    step={0.01}
                    prefix="$"
                    placeholder="Unit Price"
                    value={item.rate}
                    onChange={(val) => handleLineItemChange(idx, 'rate', val)}
                    className="w-full rounded-lg text-xs font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={item.taxRate || (item.taxable ? 'GST on Income' : 'GST Free Income')}
                    onChange={(val) => {
                      handleLineItemChange(idx, 'taxRate', val)
                      handleLineItemChange(idx, 'taxable', val === 'GST on Income')
                    }}
                    className="w-full text-xs"
                    size="small"
                  >
                    <Option value="GST Free Income">GST Free (0%)</Option>
                    <Option value="GST on Income">GST on Income (10%)</Option>
                    <Option value="BAS Excluded">BAS Excluded (0%)</Option>
                  </Select>
                </div>
                <div className="col-span-1 text-right font-extrabold text-xs text-slate-700 dark:text-slate-200">
                  ${(item.total || 0).toFixed(2)}
                </div>
                <div className="col-span-1 text-center">
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

            {/* Compact Tax & Calculation Summary Bar */}
            {(() => {
              const subtotal = editLineItems.reduce((s, it) => s + (it.total || 0), 0)
              const taxableSub = editLineItems.filter(it => it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true'))).reduce((s, it) => s + (it.total || 0), 0)
              const gst = parseFloat((taxableSub * 0.1).toFixed(2))
              const total = parseFloat((subtotal + gst).toFixed(2))
              return (
                <div className="flex flex-wrap items-center justify-end gap-3 text-xs pt-2 px-2 text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/50">
                  <span>Subtotal (Excl. Tax): <strong className="text-slate-800 dark:text-slate-200">${subtotal.toFixed(2)} AUD</strong></span>
                  <span>•</span>
                  <span>GST (10%): <strong className={gst > 0 ? "text-purple-600 dark:text-purple-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>{gst > 0 ? `$${gst.toFixed(2)} AUD` : '$0.00 AUD'}</strong></span>
                  <span>•</span>
                  <span>Total (Inc. GST): <strong className="text-[#8C4BFF] font-black">${total.toFixed(2)} AUD</strong></span>
                </div>
              )
            })()}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Form.Item name="amount" label={<span className="text-xs font-semibold text-slate-500">Total ($ AUD) — Auto-calculated</span>} rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} prefix="$" disabled className="w-full rounded-xl h-10 font-black text-emerald-600 flex items-center bg-slate-50 dark:bg-slate-800" />
            </Form.Item>

            <Form.Item name="due" label={<span className="text-xs font-semibold text-slate-500">Balance Due ($ AUD) — Managed by Payments</span>}>
              <InputNumber 
                min={0} 
                step={0.01} 
                prefix="$" 
                disabled
                className="w-full rounded-xl h-10 font-black text-rose-500 flex items-center bg-slate-50 dark:bg-slate-800" 
              />
            </Form.Item>

            <Form.Item name="issueDate" label={<span className="text-xs font-semibold text-slate-500">Issue Date</span>}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="dueDate" label={<span className="text-xs font-semibold text-slate-500">Due Date</span>}>
              <DatePicker className="w-full rounded-xl h-10" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="status" 
              label={<span className="text-xs font-semibold text-slate-500">Invoice Status</span>}
              extra={<span className="text-[11px] text-slate-400">Paid and Partially Paid statuses are derived automatically from verified payments. To record a payment, use Payments Centre.</span>}
            >
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Processing">Issued / Unpaid</Option>
                <Option value="Draft">Draft</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </Form.Item>

            <Form.Item name="sentStatus" label={<span className="text-xs font-semibold text-slate-500">Dispatch Status</span>}>
              <Select className="rounded-xl h-10 flex items-center">
                <Option value="Not Sent">Not Sent</Option>
                <Option value="Sent">Sent / Dispatched</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                const vals = editForm.getFieldsValue()
                const merged = {
                  ...editingInvoice,
                  ...vals,
                  items: editLineItems,
                  issueDate: vals.issueDate ? vals.issueDate.format('YYYY-MM-DD') : editingInvoice.issueDate,
                  dueDate: vals.dueDate ? vals.dueDate.format('YYYY-MM-DD') : editingInvoice.dueDate
                }
                handleOpenPreview(merged)
              }}
              className="rounded-xl font-bold"
            >
              Preview Changes
            </Button>

            <Space>
              <Button onClick={() => setEditVisible(false)} className="rounded-xl">Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                className="rounded-xl font-bold h-10 px-6 text-white shadow"
              >
                Save & Update Invoice
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* ─── Interactive Invoice PDF Preview Modal (Requirement 1) ─────────── */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <FilePdfOutlined style={{ color: '#8C4BFF', fontSize: 18 }} />
              <span className="font-black text-base text-slate-800 dark:text-white">
                Invoice PDF Preview: {previewInvoice ? getInvoiceDisplayNumber(previewInvoice) : ''}
              </span>
            </div>
            {(() => {
              const st = deriveInvoicePaymentStatus(previewInvoice)
              return (
                <Tag color={st.color} className="font-extrabold uppercase rounded-lg border-none">
                  {st.label}
                </Tag>
              )
            })()}
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
            key="send"
            icon={<MailOutlined />}
            onClick={() => {
              if (previewInvoice) handleSendInvoice(previewInvoice)
            }}
            className="rounded-xl font-bold"
          >
            Send Email
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
        destroyOnHidden
        width={900}
        className="rounded-2xl"
      >
        {previewInvoice && (
          <div className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl my-2 font-sans space-y-6 shadow-sm">
            {/* Header branding */}
            <div className="flex justify-between items-start border-b-2 border-[#8C4BFF] pb-4">
              <div>
                <h3 className="text-xl font-black text-[#8C4BFF] m-0">
                  {store.clinicDetails?.name || store.user?.clinicName || 'Healthcare Clinic'}
                </h3>
                {(store.clinicDetails?.address || store.clinicDetails?.featureFlags?.address) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-1">
                    {store.clinicDetails?.address || store.clinicDetails?.featureFlags?.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(store.clinicDetails?.phone || store.clinicDetails?.featureFlags?.phone) && (
                    <span>Phone: <strong>{store.clinicDetails?.phone || store.clinicDetails?.featureFlags?.phone}</strong></span>
                  )}
                  {(store.clinicDetails?.email || store.clinicDetails?.featureFlags?.email) && (
                    <span>Email: <strong>{store.clinicDetails?.email || store.clinicDetails?.featureFlags?.email}</strong></span>
                  )}
                  {(store.clinicDetails?.abn || store.clinicDetails?.featureFlags?.abn) && (
                    <span>ABN: <strong>{store.clinicDetails?.abn || store.clinicDetails?.featureFlags?.abn}</strong></span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-800 dark:text-white block tracking-tight">TAX INVOICE</span>
                <span className="text-xs font-bold text-[#8C4BFF] block mt-0.5">
                  {getInvoiceDisplayNumber(previewInvoice)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Issued: {previewInvoice.issueDate ? dayjs(previewInvoice.issueDate).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}
                </span>
              </div>
            </div>

            {/* Bill to & Due timeline */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-xs">
              <div>
                <span className="font-extrabold uppercase text-[10px] text-slate-400 block">Billed To</span>
                <span className="font-extrabold text-sm text-slate-800 dark:text-white block mt-1">
                  {previewInvoice.clientName || previewInvoice.patientName || 'Client'}
                </span>
                {previewInvoice.recipient && previewInvoice.recipient !== previewInvoice.clientName && (
                  <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                    Care of: <strong>{previewInvoice.recipient}</strong>
                  </span>
                )}
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  Attending: <strong>{previewInvoice.practitionerName || 'Dr. Sarah Jenkins'}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="font-extrabold uppercase text-[10px] text-slate-400 block">Payment Terms & Due</span>
                <span className="font-extrabold text-sm text-rose-500 block mt-1">
                  Due: {previewInvoice.dueDate ? dayjs(previewInvoice.dueDate).format('DD/MM/YYYY') : dayjs().add(7, 'day').format('DD/MM/YYYY')}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  Terms: Net 7 Days
                </span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  Dispatch Status: <strong>{previewInvoice.sentStatus || 'Not Sent'}</strong>
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3" style={{ width: 140 }}>Item Code</th>
                    <th className="p-3">Description of Service</th>
                    <th className="p-3 text-right" style={{ width: 70 }}>Qty</th>
                    <th className="p-3 text-right" style={{ width: 95 }}>Unit Price ($)</th>
                    <th className="p-3" style={{ width: 150 }}>Tax Rate</th>
                    <th className="p-3 text-right" style={{ width: 110 }}>Line Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(() => {
                    // Finding 22: Resolve line items, repairing all-zero-rate items
                    let previewLines = Array.isArray(previewInvoice.items) ? previewInvoice.items : []
                    if (typeof previewInvoice.items === 'string') {
                      try { previewLines = JSON.parse(previewInvoice.items) } catch (_e) { previewLines = [] }
                    }
                    const previewBaseAmt = parseFloat(previewInvoice.amount) || 0
                    if (previewLines.length === 0) {
                      previewLines = [{ itemCode: previewInvoice.itemCode || '', description: previewInvoice.service || 'Clinical Care Service', quantity: 1, rate: previewBaseAmt, total: previewBaseAmt, taxable: false, taxRate: 'GST Free Income' }]
                    } else {
                      const allZero = previewLines.every(it => !parseFloat(it.rate) && !parseFloat(it.total))
                      if (allZero && previewBaseAmt > 0) {
                        const perItem = parseFloat((previewBaseAmt / previewLines.length).toFixed(2))
                        previewLines = previewLines.map((it, i) => ({
                          ...it,
                          rate: i === previewLines.length - 1 ? parseFloat((previewBaseAmt - perItem * (previewLines.length - 1)).toFixed(2)) : perItem,
                          total: i === previewLines.length - 1 ? parseFloat((previewBaseAmt - perItem * (previewLines.length - 1)).toFixed(2)) : perItem
                        }))
                      }
                    }
                    const previewItemsSum = previewLines.reduce((s, it) => s + (parseFloat(it.total) || (parseFloat(it.rate) * (parseFloat(it.quantity) || 1)) || 0), 0)
                    const previewTaxable = previewLines.filter(it => it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true'))).reduce((s, it) => s + (parseFloat(it.total) || (parseFloat(it.rate) * (parseFloat(it.quantity) || 1)) || 0), 0)
                    const previewGst = parseFloat((previewTaxable * 0.1).toFixed(2))
                    const previewGross = parseFloat((previewItemsSum + previewGst).toFixed(2))
                    const previewReconciled = previewGross > 0 ? previewGross : previewBaseAmt
                    const hasReconcileGap = Math.abs(previewReconciled - previewBaseAmt) > 0.05 && Math.abs(previewItemsSum - previewBaseAmt) > 0.05 && previewBaseAmt > 0
                    return previewLines.map((it, idx) => {
                      const effectiveTaxRate = it.taxRate || (it.taxable === true || it.taxable === 'true' ? 'GST on Income' : 'GST Free Income')
                      return (
                        <tr key={idx} className="text-slate-700 dark:text-slate-300">
                          <td className="p-3 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {it.itemCode || it.ndisCode || '—'}
                          </td>
                          <td className="p-3">
                            <span className="font-bold block text-slate-800 dark:text-slate-100">{it.description || previewInvoice.service || 'Consultation Service'}</span>
                            {hasReconcileGap && idx === 0 && (
                              <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded mt-0.5 inline-block">⚠ Rate data incomplete — totals shown from invoice record</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">{parseFloat(it.quantity) || 1}</td>
                          <td className="p-3 text-right font-medium">${(parseFloat(it.rate) || 0).toFixed(2)}</td>
                          <td className="p-3">
                            {effectiveTaxRate === 'GST on Income' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                ⚡ GST on Income (10%)
                              </span>
                            ) : effectiveTaxRate === 'BAS Excluded' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                ✦ BAS Excluded (0%)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ✦ GST Free Income (0%)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                            ${(parseFloat(it.total) || (parseFloat(it.rate) * (parseFloat(it.quantity) || 1)) || 0).toFixed(2)}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>

            {/* Total Balance Card — Finding 22 & 29: subtotal and explicit tax presentation */}
            <div className="flex justify-end">
              {(() => {
                let balanceLines = Array.isArray(previewInvoice.items) ? previewInvoice.items : []
                if (typeof previewInvoice.items === 'string') { try { balanceLines = JSON.parse(previewInvoice.items) } catch (_e) { balanceLines = [] } }
                const balBaseAmt = parseFloat(previewInvoice.amount) || 0
                if (balanceLines.length === 0) balanceLines = [{ rate: balBaseAmt, quantity: 1, total: balBaseAmt, taxable: false, taxRate: 'GST Free Income' }]
                const allZeroB = balanceLines.every(it => !parseFloat(it.rate) && !parseFloat(it.total))
                if (allZeroB && balBaseAmt > 0) {
                  const p = parseFloat((balBaseAmt / balanceLines.length).toFixed(2))
                  balanceLines = balanceLines.map((it, i) => ({ ...it, rate: i === balanceLines.length - 1 ? parseFloat((balBaseAmt - p * (balanceLines.length - 1)).toFixed(2)) : p, total: i === balanceLines.length - 1 ? parseFloat((balBaseAmt - p * (balanceLines.length - 1)).toFixed(2)) : p }))
                }
                const reconciledSubtotal = balanceLines.reduce((s, it) => s + (parseFloat(it.total) || (parseFloat(it.rate) * (parseFloat(it.quantity) || 1)) || 0), 0)
                const taxableTotal = balanceLines.filter(it => it.taxRate === 'GST on Income' || (!it.taxRate && (it.taxable === true || it.taxable === 'true'))).reduce((s, it) => s + (parseFloat(it.total) || (parseFloat(it.rate) * (parseFloat(it.quantity) || 1)) || 0), 0)
                const gstVal = parseFloat((taxableTotal * 0.1).toFixed(2))
                const finalSubtotal = reconciledSubtotal > 0 ? reconciledSubtotal : balBaseAmt
                const grandTotal = parseFloat((finalSubtotal + gstVal).toFixed(2))
                const isPaidB = (previewInvoice.status || '').toLowerCase() === 'paid' || (previewInvoice.status || '').toLowerCase() === 'completed' || parseFloat(previewInvoice.due) === 0
                const baseDueB = parseFloat(previewInvoice.due) !== undefined && previewInvoice.due !== null ? parseFloat(previewInvoice.due) : balBaseAmt
                let dueAmtNum = 0
                if (isPaidB) {
                  dueAmtNum = 0
                } else if (baseDueB >= balBaseAmt || balBaseAmt <= 0) {
                  dueAmtNum = grandTotal
                } else {
                  const paidSoFar = Math.max(0, balBaseAmt - baseDueB)
                  dueAmtNum = Math.max(0, grandTotal - paidSoFar)
                }
                const dueAmtB = dueAmtNum.toFixed(2)
                return (
                  <div className="w-80 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal (Excl. Tax):</span>
                      <span className="font-bold">${finalSubtotal.toFixed(2)} AUD</span>
                    </div>
                    <div className="flex justify-between text-slate-500 items-center">
                      <span>GST (10%):</span>
                      <span className={`font-bold ${gstVal === 0 ? 'text-[11px] text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        ${gstVal.toFixed(2)} AUD
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-black text-sm text-slate-800 dark:text-white">
                      <span>Total (Inc. GST):</span>
                      <span>${grandTotal.toFixed(2)} AUD</span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1">
                      <span className={isPaidB ? 'text-slate-600 dark:text-slate-300' : 'text-rose-500'}>Balance Due:</span>
                      <span className={isPaidB ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-rose-500 font-black'}>
                        ${dueAmtB} AUD
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Bank details & Notice */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40 text-[11px] text-[#8C4BFF] space-y-1">
              <div className="font-bold">
                EFT Remittance: {store.clinicDetails?.featureFlags?.bankName || 'Bank'}{store.clinicDetails?.featureFlags?.bsb ? ` • BSB: ${store.clinicDetails.featureFlags.bsb}` : ''}{store.clinicDetails?.featureFlags?.accountNumber ? ` • Acc: ${store.clinicDetails.featureFlags.accountNumber}` : ''}
              </div>
              <div className="text-slate-500 dark:text-slate-400">Please quote {getInvoiceDisplayNumber(previewInvoice)} in electronic transfer description on all remittances.</div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Invoice Quick Actions Modal ─────────────────────────────────── */}
      <Modal
        title={selectedInvoice ? `Invoice details: ${getInvoiceDisplayNumber(selectedInvoice)}` : ''}
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setSelectedInvoice(null); }}
        footer={null}
        destroyOnHidden
        width={650}
        className="rounded-2xl overflow-hidden"
      >
        {selectedInvoice && (
          <div className="space-y-6 mt-4 font-sans">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Bill To</span>
                <span className="font-extrabold text-slate-800 dark:text-white mt-1 block">{selectedInvoice.clientName}</span>
                {selectedInvoice.recipient && selectedInvoice.recipient !== selectedInvoice.clientName && (
                  <span className="text-slate-500 text-[10px]">{selectedInvoice.recipient}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[9px]">Status / Sent Status</span>
                <div className="mt-1 flex items-center justify-end space-x-1.5">
                  <Tag color={selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Completed' ? 'success' : 'warning'} className="rounded-lg border-none uppercase font-bold text-[9px]">
                    {selectedInvoice.status}
                  </Tag>
                  <Tag color="blue" className="rounded-lg border-none font-bold text-[9px] uppercase">
                    {selectedInvoice.sentStatus}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Line Summary */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Practitioner / Details</span>
                <span>Due Date</span>
                <span>Balance Total</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                <span className="font-bold">{selectedInvoice.practitionerName}</span>
                <span>{selectedInvoice.dueDate ? dayjs(selectedInvoice.dueDate).format('DD/MM/YYYY') : '—'}</span>
                <span className="font-extrabold">${(parseFloat(selectedInvoice.amount) || 0).toFixed(2)}</span>
              </div>
              
              {(() => {
                const isPaid = (selectedInvoice.status || '').toLowerCase() === 'paid' || (selectedInvoice.status || '').toLowerCase() === 'completed' || parseFloat(selectedInvoice.due) === 0
                const dueAmt = isPaid ? '0.00' : (parseFloat(selectedInvoice.due) || 0).toFixed(2)
                return (
                  <div className="border-t border-slate-200/50 dark:border-slate-850 pt-2 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Remaining Balance Due:</span>
                    <span className={`font-extrabold ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      ${dueAmt} AUD
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Action buttons inside invoice */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px] mb-3">Invoice Operations</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button 
                  icon={<EyeOutlined />} 
                  onClick={() => {
                    setDetailVisible(false)
                    handleOpenPreview(selectedInvoice)
                  }}
                  className="rounded-xl font-bold text-xs h-10 text-[#8C4BFF] border-purple-200 flex items-center justify-center"
                >
                  PDF Preview
                </Button>

                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => {
                    setDetailVisible(false)
                    handleOpenEdit(selectedInvoice)
                  }}
                  className="rounded-xl font-bold text-xs h-10 flex items-center justify-center"
                >
                  Edit Invoice
                </Button>

                <Button 
                  icon={<DollarOutlined />} 
                  onClick={() => handleRecordPayment(selectedInvoice.id)}
                  disabled={selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Completed'}
                  className="rounded-xl font-bold text-xs h-10 border-emerald-200 text-emerald-600 hover:border-emerald-500 hover:text-emerald-500 flex items-center justify-center"
                >
                  Record Pay
                </Button>

                <Button 
                  icon={<MailOutlined />} 
                  onClick={() => handleSendInvoice(selectedInvoice)}
                  className="rounded-xl font-bold text-xs h-10 flex items-center justify-center"
                >
                  Send Invoice
                </Button>

                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={() => handlePrintOrDownloadPDF(selectedInvoice)}
                  className="rounded-xl font-bold text-xs h-10 text-red-500 border-red-200 flex items-center justify-center"
                >
                  Download PDF
                </Button>

                <Button 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                  className="rounded-xl font-bold text-xs h-10 text-red-600 border-red-100 flex items-center justify-center"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
