import React, { useState, useEffect } from 'react'
import { Card, Progress, Tag, Table, Input, Select, Button, Modal, Form, Spin, Empty, Popconfirm } from 'antd'
import { WarningOutlined, DollarOutlined, InfoCircleOutlined, SwapOutlined, SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

const { Option } = Select

export default function PatientFundingClaims() {
  const [loading, setLoading] = useState(false)
  const [activeFunding, setActiveFunding] = useState([])
  const [alerts, setAlerts] = useState([])
  const [claimsHistory, setClaimsHistory] = useState([])

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [fundingFilter, setFundingFilter] = useState('ALL')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchFundingAndClaims = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patient/funding-claims', {
        params: { search: searchTerm, funding: fundingFilter }
      })
      if (res.data?.success && res.data.data) {
        if (Array.isArray(res.data.data.activeFunding)) setActiveFunding(res.data.data.activeFunding)
        if (Array.isArray(res.data.data.alerts)) setAlerts(res.data.data.alerts)
        if (Array.isArray(res.data.data.claimsHistory)) setClaimsHistory(res.data.data.claimsHistory)
      }
    } catch (err) {
      console.warn('Funding & claims API fetch fallback notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFundingAndClaims()
  }, [searchTerm, fundingFilter])

  const handleOpenAddModal = () => {
    form.resetFields()
    setModalOpen(true)
  }

  const handleSaveClaim = async (values) => {
    try {
      const res = await api.post('/api/patient/claims', values)
      if (res.data?.success) {
        toast.success('New claim transaction submitted!')
        fetchFundingAndClaims()
      }
      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      toast.error('Failed to submit claim transaction')
    }
  }

  const handleDeleteClaim = async (id) => {
    try {
      const res = await api.delete(`/api/patient/claims/${id}`)
      if (res.data?.success) {
        toast.success('Claim record removed')
        fetchFundingAndClaims()
      }
    } catch (err) {
      toast.error('Failed to delete claim')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Intro header & Search Filter */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-808 dark:text-white m-0">My Funding, NDIS & Claims Accounts</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              Track government NDIS plans, Medicare EPC limits, WorkCover claims, and private health cover balances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search claims..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl text-xs w-full sm:w-44"
              allowClear
            />
            <Select
              value={fundingFilter}
              onChange={(val) => setFundingFilter(val)}
              className="w-32 text-xs"
            >
              <Option value="ALL">All Funding</Option>
              <Option value="NDIS">NDIS</Option>
              <Option value="EPC">EPC</Option>
              <Option value="WorkCover">WorkCover</Option>
            </Select>
            <Tag color="purple" className="rounded-full border-none font-bold text-[10px] px-3.5 py-1 uppercase">
              <DollarOutlined className="mr-1" />
              Active Claims Management
            </Tag>
          </div>
        </div>
      </Card>

      {/* Funding Alerts */}
      <div className="space-y-3" style={{ marginTop: '24px' }}>
        {alerts.map((a, idx) => (
          <div key={a.id || idx} className={`p-4 rounded-xl border flex gap-3 items-center text-xs font-semibold ${
            a.color === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400' : 'bg-blue-50/50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-400'
          }`}>
            {a.color === 'warning' ? <WarningOutlined className="text-base flex-shrink-0" /> : <InfoCircleOutlined className="text-base flex-shrink-0" />}
            <div>
              <span className="font-bold block text-[13px]">{a.type}</span>
              <p className="m-0 mt-0.5 font-medium">{a.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Funding cards */}
      {loading ? (
        <div className="text-center py-8">
          <Spin description="Loading funding accounts..." />
        </div>
      ) : activeFunding.length === 0 ? (
        <Card className="text-center py-6 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">No active funding accounts (NDIS / Medicare EPC) registered for your clinic.</span>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeFunding.map((fund, idx) => (
            <div key={fund.id || idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0">{fund.type}</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Expiry Date: {fund.expiry}</span>
                </div>
                <Tag color={fund.status === 'Active' ? 'success' : 'warning'} className="m-0 border-none rounded-full px-2.5 py-0.5 text-[8.5px] font-bold uppercase">{fund.status}</Tag>
              </div>

              <div className="space-y-2 border-t border-b border-slate-50 dark:border-slate-850 py-3.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Remaining Balance</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{fund.remaining}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                  <span>Used to Date: {fund.used}</span>
                  <span>Total Budget: {fund.total}</span>
                </div>
                <Progress percent={fund.percent || 50} strokeColor="#8C4BFF" showInfo={false} size="small" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim History Ledger */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Recent Claim Processing & Remittances</span>}>
        {loading ? (
          <div className="text-center py-8">
            <Spin description="Loading claims ledger..." />
          </div>
        ) : claimsHistory.length === 0 ? (
          <Empty description="No claims found matching filter." />
        ) : (
          <Table
            dataSource={claimsHistory}
            rowKey={(r) => r.id || r.displayId}
            pagination={false}
            scroll={{ x: 700 }}
            className="border-none"
            columns={[
              {
                title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Claim Transaction ID</span>,
                dataIndex: 'id',
                render: (id, rec) => <span className="font-mono text-xs text-slate-450 dark:text-slate-500 font-bold">{rec.displayId || id}</span>
              },
              {
                title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clinic Care Service</span>,
                render: (_, rec) => (
                  <div>
                    <span className="text-slate-750 dark:text-slate-305 font-semibold text-xs block">{rec.service}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Date: {rec.date}</span>
                  </div>
                )
              },
              {
                title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Account / Program</span>,
                dataIndex: 'funding',
                render: (f) => <Tag color="default" className="m-0 border-slate-200 dark:border-slate-800 rounded-full text-[9px] font-semibold">{f}</Tag>
              },
              {
                title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Claimed Total</span>,
                dataIndex: 'amount',
                render: (a) => <span className="font-extrabold text-[#8C4BFF] text-xs">{a}</span>
              },
              {
                title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Processing Status</span>,
                dataIndex: 'status',
                render: (s) => (
                  <Tag color={s === 'Approved' ? 'success' : 'processing'} className="rounded-full border-none font-bold text-[9px] px-2.5 py-0.5">
                    {s}
                  </Tag>
                )
              },
              {
                title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Actions</span>,
                key: 'actions',
                render: (_, record) => (
                  <Popconfirm
                    title="Are you sure you want to delete this claim record?"
                    onConfirm={() => handleDeleteClaim(record.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )
              }
            ]}
          />
        )}
      </Card>

      {/* New Claim Modal */}
      <Modal
        title={<span className="font-bold">Submit New Claim Transaction</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSaveClaim} className="mt-4">
          <Form.Item name="service" label="Clinic Care Service Name" rules={[{ required: true, message: 'Please enter service name' }]}>
            <Input placeholder="e.g. Physiotherapy Consultation" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="funding" label="Account / Program" rules={[{ required: true, message: 'Please select funding program' }]}>
            <Select className="rounded-lg">
              <Option value="NDIS">NDIS</Option>
              <Option value="EPC">Medicare EPC</Option>
              <Option value="WorkCover">WorkCover</Option>
              <Option value="Private">Private Health Cover</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Claimed Amount ($)" rules={[{ required: true, message: 'Please enter claim amount' }]}>
            <Input placeholder="e.g. $180.00" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="date" label="Service Date">
            <Input type="date" className="rounded-lg" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }} className="rounded-lg font-bold">
              Submit Claim
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  )
}
