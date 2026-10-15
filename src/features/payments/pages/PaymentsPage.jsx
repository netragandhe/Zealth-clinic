import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Input, Modal, Form, Select, DatePicker, Tooltip, Tag, Space, Divider } from 'antd'
import { SearchOutlined, UserOutlined, FileTextOutlined, CreditCardOutlined, DollarOutlined, BankOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { useClinicStore } from '../../../store/clinicStore'
import { getPayments, createPayment, getInvoices, getPatients } from '../../calendar/api/clinicAdminApi'

const { Option } = Select

export default function PaymentsPage() {
  const store = useClinicStore()
  const navigate = useNavigate()
  const { darkMode } = store
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Data for payment allocation
  const [allInvoices, setAllInvoices] = useState([])
  const [patientList, setPatientList] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [enteredAmount, setEnteredAmount] = useState('')

  const [form] = Form.useForm()

  const fetchPaymentsData = async () => {
    setLoading(true)
    try {
      const res = await getPayments({ search })
      if (res && res.success && Array.isArray(res.data)) {
        setPayments(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPatientsAndInvoices = async () => {
    try {
      const [invRes, patRes] = await Promise.allSettled([
        getInvoices({ limit: 300 }),
        getPatients({ limit: 300 })
      ])
      if (invRes.status === 'fulfilled' && invRes.value?.success && Array.isArray(invRes.value.data)) {
        setAllInvoices(invRes.value.data)
        if (store.setInvoices) store.setInvoices(invRes.value.data)
      }
      if (patRes.status === 'fulfilled' && patRes.value?.success && Array.isArray(patRes.value.data)) {
        setPatientList(patRes.value.data)
        if (store.setPatients) store.setPatients(patRes.value.data)
      }
    } catch (err) {
      console.warn('Error loading patients/invoices for payments:', err)
    }
  }

  useEffect(() => {
    fetchPaymentsData()
    loadPatientsAndInvoices()
  }, [search])

  const handleOpenModal = () => {
    loadPatientsAndInvoices()
    form.resetFields()
    setSelectedClient(null)
    setSelectedInvoice(null)
    setEnteredAmount('')
    form.setFieldsValue({
      date: dayjs(),
      paymentMethod: 'Stripe / Credit Card'
    })
    setModalOpen(true)
  }

  const handleClientChange = (val) => {
    const matched = (patientList.length > 0 ? patientList : (store.patients || [])).find(p =>
      p.id === val || (p.fullName || p.name || '').toLowerCase() === (val || '').toLowerCase()
    )
    const clientName = matched ? (matched.fullName || matched.name) : val
    setSelectedClient(matched || { id: null, name: val, fullName: val })
    setSelectedInvoice(null)
    setEnteredAmount('')

    form.setFieldsValue({
      clientName: clientName,
      patientId: matched ? matched.id : null,
      invoiceReference: undefined,
      amount: undefined
    })
  }

  const handleInvoiceChange = (invRef) => {
    if (!invRef) {
      setSelectedInvoice(null)
      return
    }
    const inv = allInvoices.find(i => 
      (i.displayId && i.displayId === invRef) ||
      (i.invoiceNumber && i.invoiceNumber === invRef) ||
      (i.id && i.id === invRef)
    )
    setSelectedInvoice(inv || null)
    if (inv) {
      const invDue = inv.due !== undefined && inv.due !== null ? parseFloat(inv.due) : (parseFloat(inv.amount) || 0)
      const autoAmt = invDue > 0 ? invDue.toFixed(2) : (parseFloat(inv.amount) || 0).toFixed(2)
      form.setFieldsValue({
        amount: autoAmt
      })
      setEnteredAmount(autoAmt)
    }
  }

  // Filter unpaid or open invoices for selected client
  const clientInvoices = allInvoices.filter(inv => {
    if (!selectedClient) return false
    const matchClient =
      (selectedClient.id && inv.patientId === selectedClient.id) ||
      (selectedClient.name && (
        (inv.clientName || '').toLowerCase().trim() === selectedClient.name.toLowerCase().trim() ||
        (inv.patientName || '').toLowerCase().trim() === selectedClient.name.toLowerCase().trim()
      )) ||
      (selectedClient.fullName && (
        (inv.clientName || '').toLowerCase().trim() === selectedClient.fullName.toLowerCase().trim() ||
        (inv.patientName || '').toLowerCase().trim() === selectedClient.fullName.toLowerCase().trim()
      ))
    return matchClient
  })

  const handleAddPayment = async (values) => {
    setSubmitting(true)
    const clientName = values.clientName || (selectedClient ? (selectedClient.fullName || selectedClient.name) : values.from)
    const patientId = values.patientId || (selectedClient ? selectedClient.id : null)

    const newPayment = {
      from: clientName,
      clientName: clientName,
      patientId: patientId,
      amount: parseFloat(values.amount) || 0,
      paymentDate: values.date ? values.date.format('DD MMM YYYY') : dayjs().format('DD MMM YYYY'),
      paymentMethod: values.paymentMethod || 'Stripe / Credit Card',
      invoiceReference: values.invoiceReference || (selectedInvoice ? (selectedInvoice.displayId || selectedInvoice.invoiceNumber || selectedInvoice.id) : null),
      transactionReference: values.transactionReference ? values.transactionReference.trim() : null
    }

    try {
      const res = await createPayment(newPayment)
      if (res && res.success && res.data) {
        setPayments(prev => [res.data, ...prev])
        toast.success('New payment recorded & allocated successfully!')
        setModalOpen(false)
        form.resetFields()
        setSelectedClient(null)
        setSelectedInvoice(null)
        setEnteredAmount('')
        fetchPaymentsData()
        loadPatientsAndInvoices()
      } else {
        toast.error(res?.message || 'Failed to record payment')
      }
    } catch (err) {
      console.error('Add payment error:', err)
      toast.error('Error saving payment to database')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = (payments || []).filter(p => {
    if (!p) return false
    const q = (search || '').toLowerCase()
    const pFrom = (p.clientName || p.from || '').toLowerCase()
    const pId = (p.receiptNumber || p.id || '').toLowerCase()
    const pInv = (p.invoiceReference || '').toLowerCase()
    return !search || pFrom.includes(q) || pId.includes(q) || pInv.includes(q)
  })

  const columns = [
    {
      title: <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Payment #</span>,
      key: 'receiptNumber',
      sorter: (a, b) => (a.receiptNumber || a.id || '').localeCompare(b.receiptNumber || b.id || ''),
      render: (_, record) => <span className="font-semibold text-slate-700 dark:text-slate-300 text-[13px] font-mono">{record.receiptNumber || record.id}</span>,
    },
    {
      title: <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">From / Client</span>,
      key: 'from',
      render: (_, record) => (
        <span className="font-semibold text-[#8C4BFF] cursor-pointer text-[13px] hover:underline">
          {record.clientName || record.from}
        </span>
      ),
    },
    {
      title: <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Allocated Invoice</span>,
      key: 'invoiceReference',
      render: (_, record) => record.invoiceReference ? (
        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-[#8C4BFF] font-semibold text-xs rounded-md border border-purple-100 dark:border-purple-900/50">
          {record.invoiceReference}
        </span>
      ) : (
        <span className="text-slate-400 text-xs italic">Unallocated</span>
      ),
    },
    {
      title: <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Method</span>,
      key: 'paymentMethod',
      render: (_, record) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">
          {record.paymentMethod || 'Stripe / Credit Card'}
        </span>
      ),
    },
    {
      title: <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Amount</span>,
      dataIndex: 'amount', 
      key: 'amount',
      render: val => <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">${(parseFloat(val) || 0).toFixed(2)} AUD</span>,
    },
    {
      title: <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Payment date</span>,
      key: 'date',
      align: 'right',
      render: (_, record) => <span className="font-medium text-slate-700 dark:text-slate-300 text-[13px]">{record.paymentDate || record.date}</span>,
    },
  ]

  // Compute live breakdown for modal
  const invTotal = selectedInvoice ? (parseFloat(selectedInvoice.amount) || 0) : 0
  const invCurrentDue = selectedInvoice ? (selectedInvoice.due !== undefined && selectedInvoice.due !== null ? parseFloat(selectedInvoice.due) : invTotal) : 0
  const parsedPayAmount = parseFloat(enteredAmount) || 0
  const remainingDue = Math.max(0, invCurrentDue - parsedPayAmount)
  const isFullyPaidByThis = selectedInvoice && parsedPayAmount >= invCurrentDue && invCurrentDue > 0

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#202020] dark:text-white m-0">Payments</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track patient remittances, allocate payments to outstanding invoices, and reconcile accounts in real time.
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          type="primary"
          style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
          className="rounded-lg font-bold text-[13px] h-10 px-5 text-white shadow-sm flex items-center gap-1.5"
        >
          + Record New Payment
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search by client name, receipt #, or invoice reference..."
          value={search} 
          onChange={e => setSearch(e.target.value)}
          onPressEnter={fetchPaymentsData}
          prefix={<SearchOutlined className="text-slate-400 mr-1" />}
          className="rounded-lg h-[40px] flex-1 border-[#d9d9d9] dark:border-slate-700 dark:bg-slate-800 text-[13px]"
        />
        <Button
          className="rounded-lg h-[40px] px-6 font-semibold text-[13px] border-[#d9d9d9] text-[#202020] dark:text-slate-200 dark:border-slate-700 hover:border-[#8C4BFF] hover:text-[#8C4BFF]"
          onClick={fetchPaymentsData}
        >
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="border border-[#e8e8e8] dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <Table
          dataSource={filtered} 
          columns={columns} 
          loading={loading}
          rowKey={record => record.id || record.receiptNumber}
          expandable={{
            expandedRowRender: record => {
              const rcpt = record.receiptNumber || record.id || 'RCPT'
              const invRef = record.invoiceReference || 'Unallocated'
              const txId = record.transactionId || `tx_${rcpt.toLowerCase().replace(/[^a-z0-9]/g, '')}_892`
              const method = record.paymentMethod || 'Stripe / Credit Card'
              const status = record.status || 'Successful (Paid)'

              return (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 my-2 space-y-3 text-xs shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                      Remittance Allocation: <span className="text-[#8C4BFF] font-mono">{rcpt}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">Client / Remitter</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{record.clientName || record.from}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">Payment Method</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{method}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">Allocated Invoice</span>
                      <span className="font-bold text-[#8C4BFF]">{invRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[10px]">Transaction Reference</span>
                      <span className="font-bold text-slate-600 dark:text-slate-400 font-mono">{txId}</span>
                    </div>
                  </div>
                </div>
              )
            },
            expandIcon: ({ expanded, onExpand, record }) => (
              <div 
                className="text-[#8C4BFF] font-black cursor-pointer text-center w-6 text-sm hover:scale-125 transition-transform select-none" 
                onClick={e => onExpand(record, e)}
                title={expanded ? 'Hide details (-)' : 'Show details (+)'}
              >
                {expanded ? '−' : '+'}
              </div>
            )
          }}
          pagination={{ 
            total: filtered.length,
            pageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            placement: ['bottomRight']
          }}
          className="payments-table custom-pagination-table"
        />
      </div>

      <style>{`
        .payments-table .ant-table-thead > tr > th {
          background-color: #F8FAFC !important;
          border-bottom: 1px solid #e8e8e8 !important;
          font-weight: 700;
        }
        .dark .payments-table .ant-table-thead > tr > th {
          background-color: #1e293b !important;
          border-bottom: 1px solid #334155 !important;
        }
        .payments-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0 !important;
          padding: 12px 16px !important;
        }
        .dark .payments-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155 !important;
        }
        .payments-table .ant-table-row:last-child > td {
          border-bottom: none !important;
        }
      `}</style>

      {/* Explicit Payment Allocation Modal (Finding 24) */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CreditCardOutlined className="text-[#8C4BFF] text-lg" />
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white m-0">Record & Allocate Payment</h3>
              <p className="text-xs text-slate-400 font-normal m-0">Select client, allocate against outstanding invoices, and update balance due in real time.</p>
            </div>
          </div>
        }
        open={modalOpen} 
        onCancel={() => { setModalOpen(false); form.resetFields() }} 
        footer={null}
        width={640}
        destroyOnHidden
        className="rounded-2xl"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleAddPayment} 
          className="mt-4 space-y-4"
          initialValues={{
            paymentMethod: 'Stripe / Credit Card',
            date: dayjs()
          }}
        >
          <Form.Item name="patientId" hidden>
            <Input />
          </Form.Item>

          {/* Section 1: Client Selector */}
          <div className="space-y-1">
            <Form.Item 
              name="clientName" 
              label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Client / Patient *</span>} 
              rules={[{ required: true, message: 'Please select or enter client name' }]}
              className="mb-1"
            >
              <Select
                showSearch
                placeholder="Search or select client from database..."
                onChange={handleClientChange}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={(patientList.length > 0 ? patientList : (store.patients || [])).map(p => ({
                  value: p.fullName || p.name || p.id,
                  label: `${p.fullName || p.name || 'Client'}${p.email ? ` (${p.email})` : ''}`
                }))}
                className="h-10 rounded-lg w-full"
              />
            </Form.Item>
            <span className="text-[11px] text-slate-400">Selecting a client will instantly retrieve their open invoices with remaining due balances.</span>
          </div>

          {/* Section 2: Invoice Allocation Selector (Always Available) */}
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileTextOutlined className="text-[#8C4BFF]" />
                Allocate to Outstanding Invoice
              </span>
              <span className="text-[11px] text-[#8C4BFF] font-semibold">
                {selectedClient ? `${clientInvoices.length} client invoice(s)` : `${allInvoices.length} total invoice(s)`}
              </span>
            </div>

            <Form.Item 
              name="invoiceReference" 
              className="mb-1"
            >
              <Select
                allowClear
                showSearch
                placeholder={selectedClient ? "Select client invoice to allocate..." : "Select any open invoice (auto-fills client & due amount)..."}
                onChange={handleInvoiceChange}
                filterOption={(input, option) =>
                  (option?.children?.props?.children?.[0]?.props?.children?.[0] ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                className="w-full h-10"
              >
                {(selectedClient ? (clientInvoices.length > 0 ? clientInvoices : allInvoices) : allInvoices).map(inv => {
                  const invNumber = inv.displayId || inv.invoiceNumber || inv.id
                  const invDue = inv.due !== undefined && inv.due !== null ? parseFloat(inv.due) : (parseFloat(inv.amount) || 0)
                  const isPaid = (inv.status || '').toLowerCase() === 'paid' || invDue === 0
                  const invClient = inv.clientName || inv.patientName || 'Client'
                  return (
                    <Option key={inv.id || invNumber} value={invNumber}>
                      <div className="flex justify-between items-center py-0.5 text-xs">
                        <span className="font-bold text-slate-800 dark:text-white">{invNumber} &bull; {invClient} &bull; {inv.service || 'Service'}</span>
                        <span className={isPaid ? "text-emerald-600 font-semibold" : "text-rose-500 font-extrabold"}>
                          {isPaid ? "Paid ($0.00)" : `Due: $${invDue.toFixed(2)} AUD`}
                        </span>
                      </div>
                    </Option>
                  )
                })}
              </Select>
            </Form.Item>

            {selectedClient && clientInvoices.length === 0 && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                No specific unpaid invoices found for {selectedClient.fullName || selectedClient.name}. Payment can be allocated to any other invoice or saved as unallocated.
              </div>
            )}

            {/* Invoice Breakdown Banner */}
            {selectedInvoice && (
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Invoice Amount:</span>
                    <span className="font-bold text-slate-800 dark:text-white">${invTotal.toFixed(2)} AUD</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Current Outstanding Due:</span>
                    <span className="font-extrabold text-rose-500">${invCurrentDue.toFixed(2)} AUD</span>
                  </div>
                  {enteredAmount && !isNaN(parseFloat(enteredAmount)) && (
                    <div className="flex justify-between pt-1.5 border-t border-slate-150 dark:border-slate-800 font-bold items-center">
                      <span className="text-slate-700 dark:text-slate-200">Balance Due After Payment:</span>
                      <span className={isFullyPaidByThis ? "text-emerald-600 font-black text-sm" : "text-amber-600 font-black text-sm"}>
                        ${remainingDue.toFixed(2)} AUD
                        {isFullyPaidByThis && (
                          <span className="ml-1.5 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            ✓ Marks Fully Paid
                          </span>
                        )}
                        {!isFullyPaidByThis && remainingDue > 0 && (
                          <span className="ml-1.5 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                            Partial Payment
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Section 3: Payment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item 
              name="amount" 
              label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Amount ($ AUD) *</span>} 
              rules={[{ required: true, message: 'Please enter payment amount' }]}
              className="mb-2"
            >
              <Input 
                type="number" 
                step="0.01" 
                prefix={<span className="text-slate-400 font-semibold">$</span>}
                placeholder="0.00" 
                className="rounded-lg h-10 font-bold text-slate-800 dark:text-white" 
                onChange={e => setEnteredAmount(e.target.value)}
              />
            </Form.Item>

            <Form.Item 
              name="paymentMethod" 
              label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method *</span>} 
              rules={[{ required: true, message: 'Please select payment method' }]}
              className="mb-2"
            >
              <Select className="h-10 rounded-lg">
                <Option value="Stripe / Credit Card">Stripe / Credit Card</Option>
                <Option value="Direct Deposit / EFT">Direct Deposit / EFT</Option>
                <Option value="Cash">Cash</Option>
                <Option value="HICAPS / EFTPOS">HICAPS / EFTPOS</Option>
                <Option value="Medicare">Medicare</Option>
                <Option value="NDIS Plan Manager">NDIS Plan Manager</Option>
                <Option value="Cheque">Cheque</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item 
              name="date" 
              label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Date *</span>} 
              rules={[{ required: true, message: 'Please select payment date' }]}
              className="mb-2"
            >
              <DatePicker className="rounded-lg w-full h-10" format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item 
              name="transactionReference" 
              label={<span className="text-xs font-bold text-slate-700 dark:text-slate-300">Transaction / Reference #</span>} 
              className="mb-2"
            >
              <Input 
                placeholder="e.g. EFT-9821, ch_3M001, Check #104" 
                className="rounded-lg h-10 font-mono text-xs" 
              />
            </Form.Item>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
            <Button 
              onClick={() => { setModalOpen(false); form.resetFields() }} 
              className="rounded-lg h-10 px-5 font-semibold text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting} 
              style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} 
              className="rounded-lg h-10 px-6 font-bold text-xs text-white shadow-sm"
            >
              Save & Allocate Payment
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
