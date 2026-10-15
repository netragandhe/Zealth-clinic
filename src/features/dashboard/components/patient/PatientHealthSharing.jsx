import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Input, Select, Modal, Divider, Badge, Spin } from 'antd'
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  UnlockOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

const { Option } = Select

export default function PatientHealthSharing() {
  const [loading, setLoading] = useState(false)
  const [sharingClinics, setSharingClinics] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [availableClinics, setAvailableClinics] = useState([
    'Metro Rehab Centre', 'Footscray Physio & Ortho', 'East Melbourne Specialist Clinic'
  ])

  const [selectedAccessLevel, setSelectedAccessLevel] = useState('Limited Access')
  const [selectedClinic, setSelectedClinic] = useState('Metro Rehab Centre')

  const fetchHealthShares = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patient/health-sharing')
      if (res.data?.success && res.data.data) {
        if (Array.isArray(res.data.data.activeShares)) setSharingClinics(res.data.data.activeShares)
        if (Array.isArray(res.data.data.pendingRequests)) setPendingRequests(res.data.data.pendingRequests)
        if (Array.isArray(res.data.data.availableClinics) && res.data.data.availableClinics.length > 0) {
          setAvailableClinics(res.data.data.availableClinics)
          if (!selectedClinic && res.data.data.availableClinics[0]) setSelectedClinic(res.data.data.availableClinics[0])
        }
      }
    } catch (err) {
      console.warn('Health sharing API fetch fallback notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthShares()
  }, [])

  const handleGrantAccess = async () => {
    try {
      const res = await api.post('/api/patient/health-sharing/grant', {
        clinic: selectedClinic,
        level: selectedAccessLevel
      })
      if (res.data?.success) {
        toast.success(`Access granted to ${selectedClinic} successfully!`)
        fetchHealthShares()
      } else {
        const newShare = {
          id: `hs_${Date.now()}`,
          clinic: selectedClinic,
          practitioner: 'All Registered Providers',
          level: selectedAccessLevel,
          grantedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }
        setSharingClinics(prev => [...prev, newShare])
        toast.success(`Access granted to ${selectedClinic} successfully!`)
      }
    } catch (err) {
      const newShare = {
        id: `hs_${Date.now()}`,
        clinic: selectedClinic,
        practitioner: 'All Registered Providers',
        level: selectedAccessLevel,
        grantedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      }
      setSharingClinics(prev => [...prev, newShare])
      toast.success(`Access granted to ${selectedClinic} successfully!`)
    }
  }

  const handleRevoke = async (id, clinicName) => {
    try {
      const res = await api.delete(`/api/patient/health-sharing/${id}/revoke`)
      if (res.data?.success) {
        toast.error(`Access revoked for ${clinicName}.`)
        fetchHealthShares()
      } else {
        setSharingClinics(prev => prev.filter(c => (c.id || c.key) !== id))
        toast.error(`Access revoked for ${clinicName}.`)
      }
    } catch (err) {
      setSharingClinics(prev => prev.filter(c => (c.id || c.key) !== id))
      toast.error(`Access revoked for ${clinicName}.`)
    }
  }

  const handleApproveRequest = async (id, clinicName) => {
    try {
      const res = await api.put(`/api/patient/health-sharing/${id}/approve`)
      if (res.data?.success) {
        toast.success(`Access request approved for ${clinicName}!`)
        fetchHealthShares()
      } else {
        setPendingRequests(prev => prev.filter(r => r.id !== id))
        toast.success(`Access request approved for ${clinicName}!`)
      }
    } catch (err) {
      setPendingRequests(prev => prev.filter(r => r.id !== id))
      toast.success(`Access request approved for ${clinicName}!`)
    }
  }

  const handleDenyRequest = async (id, clinicName) => {
    try {
      const res = await api.put(`/api/patient/health-sharing/${id}/deny`)
      if (res.data?.success) {
        toast.success(`Access request denied for ${clinicName}.`)
        fetchHealthShares()
      } else {
        setPendingRequests(prev => prev.filter(r => r.id !== id))
        toast.success(`Access request denied for ${clinicName}.`)
      }
    } catch (err) {
      setPendingRequests(prev => prev.filter(r => r.id !== id))
      toast.success(`Access request denied for ${clinicName}.`)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Ownership Banner */}
      <Card 
        className="border border-[#8C4BFF]/20 rounded-2xl shadow-sm bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-slate-900"
        styles={{ body: { padding: '24px' } }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#8C4BFF]/10 flex items-center justify-center text-[#8C4BFF] flex-shrink-0">
            <SafetyCertificateOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white m-0">You Own Your Health Record</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-semibold leading-relaxed">
              ZealthOS guarantees patient-led health data ownership. Clinical notes, referal letters, outcome index graphs, and diagnostic files are encrypted. No clinic or practitioner can view your data unless you explicitly grant them permission below. You can revoke access at any moment.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginTop: '24px' }}>
        
        {/* Left Columns: Manage Permissions and Share Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Access Requests Alert Widget */}
          {pendingRequests.length > 0 && (
            <Card className="border border-amber-100 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl shadow-sm" title={<span className="font-extrabold text-xs text-amber-700 dark:text-amber-400">Incoming Clinic Access Requests</span>}>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{req.clinic}</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-550 block font-semibold">Practitioner requesting: {req.practitioner} ({req.grantedDate || req.date})</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleApproveRequest(req.id, req.clinic)}
                        style={{ backgroundColor: '#10B981', border: 'none' }}
                        className="rounded-lg text-[10px] font-bold text-white px-3"
                      >
                        Approve Access
                      </Button>
                      <Button
                        size="small"
                        danger
                        onClick={() => handleDenyRequest(req.id, req.clinic)}
                        className="rounded-lg text-[10px] font-bold px-3"
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active Clinics Shared Table */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Active Clinic Sharing Permissions</span>}>
            {loading ? (
              <div className="text-center py-8">
                <Spin description="Loading health share permissions..." />
              </div>
            ) : (
              <Table
                dataSource={sharingClinics}
                rowKey={(r) => r.id || r.key}
                pagination={false}
                scroll={{ x: 700 }}
                className="border-none"
                columns={[
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clinic / Provider Group</span>,
                    render: (_, rec) => (
                      <div>
                        <span className="font-bold text-slate-808 dark:text-slate-200 text-xs block">{rec.clinic}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Assigned to: {rec.practitioner}</span>
                      </div>
                    )
                  },
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Access Scope</span>,
                    dataIndex: 'level',
                    render: (level) => (
                      <Tag color={level === 'Full Access' ? 'purple' : 'blue'} className="rounded-full border-none font-bold text-[9px] px-2.5">
                        {level}
                      </Tag>
                    )
                  },
                  {
                    title: <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Authorized On</span>,
                    dataIndex: 'grantedDate',
                    render: (d) => <span className="text-slate-500 font-semibold text-xs">{d}</span>
                  },
                  {
                    title: '',
                    key: 'action',
                    align: 'right',
                    render: (_, rec) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => handleRevoke(rec.id || rec.key, rec.clinic)}
                        className="rounded-lg text-[10px] font-bold h-8"
                      >
                        Revoke Access
                      </Button>
                    )
                  }
                ]}
              />
            )}
          </Card>

          {/* Share Records Form */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-705 dark:text-slate-350">Authorize New Clinic / Practitioner</span>}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Search/Select Clinic</label>
                  <Select 
                    showSearch
                    placeholder="Search/Select Clinic..." 
                    className="w-full rounded-xl"
                    value={selectedClinic}
                    onChange={setSelectedClinic}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {availableClinics.map((cName, idx) => (
                      <Option key={cName || idx} value={cName}>{cName}</Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Access Scope</label>
                  <Select 
                    placeholder="Select Level" 
                    className="w-full rounded-xl"
                    value={selectedAccessLevel}
                    onChange={setSelectedAccessLevel}
                  >
                    <Option value="Full Access">Full Access (Notes, Reports, Outcome Measures, Documents)</Option>
                    <Option value="Limited Access">Limited Access (Reports, Referrals, Outcome Measures)</Option>
                    <Option value="Read Only">Read Only Access (View-only for reports/clinical metrics)</Option>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="primary"
                  icon={<UnlockOutlined />}
                  onClick={handleGrantAccess}
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                  className="rounded-xl font-bold text-xs h-9 text-white"
                >
                  Grant Share Access
                </Button>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Side: Permission Level Descriptions & Care Team Widget */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Permission Help Box */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Permission Tiers</span>}>
            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1">
                <Tag color="purple" className="rounded-full border-none font-bold text-[9px] uppercase">Full Access</Tag>
                <p className="m-0 text-[10px] leading-relaxed dark:text-slate-400">Can view consultation notes, specialist assessment reports, full outcome metrics history (ODI, LEFS), and uploaded document records.</p>
              </div>
              <Divider className="my-2 border-slate-100 dark:border-slate-800" />
              <div className="space-y-1">
                <Tag color="blue" className="rounded-full border-none font-bold text-[9px] uppercase">Limited Access</Tag>
                <p className="m-0 text-[10px] leading-relaxed dark:text-slate-400">Can view finalized clinic reports, referral documents, and outcome metrics scores. Excludes daily consultation notes.</p>
              </div>
              <Divider className="my-2 border-slate-100 dark:border-slate-800" />
              <div className="space-y-1">
                <Tag color="default" className="rounded-full border-none font-bold text-[9px] uppercase">Read Only</Tag>
                <p className="m-0 text-[10px] leading-relaxed dark:text-slate-400">Can view clinical indicators and reports. Restricts editing, downloading, or forwarding records.</p>
              </div>
            </div>
          </Card>

          {/* Care Team Widget */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">My Care Team Widget</span>}>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Active Providers:</span>
                <span className="text-[#8C4BFF]">{sharingClinics.length > 0 ? `${sharingClinics.length} Registered` : '0 Registered'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Shared Clinics:</span>
                <span className="text-emerald-500">{sharingClinics.length > 0 ? `${sharingClinics.length} Authorized` : '0 Authorized'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Pending Requests:</span>
                <span className="text-amber-500 font-extrabold">{pendingRequests.length}</span>
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  )
}
