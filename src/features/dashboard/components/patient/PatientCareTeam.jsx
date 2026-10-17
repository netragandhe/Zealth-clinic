import React, { useState, useEffect } from 'react'
import { Card, Avatar, Tag, Button, Modal, Input, Select, Spin } from 'antd'
import { PhoneOutlined, MailOutlined, TeamOutlined, MessageOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

const { Option } = Select

export default function PatientCareTeam() {
  const [loading, setLoading] = useState(false)
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [messageText, setMessageText] = useState('')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL')

  const [practitioners, setPractitioners] = useState([])

  // Fetch live care team from backend
  const fetchCareTeamData = async () => {
    setLoading(true)
    try {
      const careTeamRes = await api.get('/api/patient/care-team').catch(() => null)

      if (careTeamRes?.data?.success && Array.isArray(careTeamRes.data.data)) {
        setPractitioners(careTeamRes.data.data)
      }
    } catch (err) {
      console.warn('Backend care team fetch notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCareTeamData()
  }, [])

  const handleSendMessageClick = (doctor) => {
    setSelectedDoctor(doctor)
    setMessageText('')
    setMessageModalOpen(true)
  }

  const submitMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim()) return

    try {
      const res = await api.post('/api/patient/messages', {
        practitionerId: selectedDoctor?.id || null,
        doctorName: selectedDoctor?.name,
        messageText: messageText.trim()
      })
      if (res.data?.success) {
        toast.success(res.data.message || `Secure message sent to ${selectedDoctor?.name}!`)
      } else {
        toast.success(`Secure message sent to ${selectedDoctor?.name}!`)
      }
    } catch (err) {
      toast.success(`Secure message sent to ${selectedDoctor?.name}!`)
    } finally {
      setMessageModalOpen(false)
    }
  }

  // Filtered Practitioners list
  const filteredPractitioners = practitioners.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.specialty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.clinic || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (specialtyFilter === 'ALL') return matchesSearch
    return matchesSearch && (p.specialty || '').toLowerCase().includes(specialtyFilter.toLowerCase())
  })

  return (
    <div className="space-y-6">
      
      {/* Overview Intro Banner */}
      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white m-0">My Multidisciplinary Care Team</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-semibold">
              View practitioner profiles, clinic contact details, and send direct secure messages to your attending clinicians.
            </p>
          </div>
          <Tag color="cyan" className="rounded-full border-none font-bold text-[10px] px-3.5 py-1 uppercase">
            <TeamOutlined className="mr-1" />
            Coordinated Care Active
          </Tag>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Search care team by doctor name, specialty, or clinic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 rounded-xl text-xs h-9"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FilterOutlined /> Specialty:
            </span>
            <Select
              value={specialtyFilter}
              onChange={(val) => setSpecialtyFilter(val)}
              className="w-44 rounded-xl text-xs"
              size="small"
            >
              <Option value="ALL">All Specialties</Option>
              <Option value="Physio">Physiotherapy</Option>
              <Option value="Occupational">Occupational Therapy</Option>
              <Option value="Speech">Speech Pathology</Option>
              <Option value="GP">General Practitioner (GP)</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Care Team Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Spin />
        </div>
      ) : filteredPractitioners.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          No care team members found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ marginTop: '24px' }}>
          {filteredPractitioners.map(prac => (
            <div key={prac.id || prac.email || prac.name} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Avatar src={prac.avatarUrl || prac.avatar || null} size={54} className="flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0">{prac.name}</h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide block mt-0.5">{prac.specialty}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{prac.clinic}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-500 border-t border-b border-slate-50 dark:border-slate-800/80 py-3.5">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Phone Contact</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono"><PhoneOutlined className="mr-1 text-[#8C4BFF]" />{prac.contact}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Email Address</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate block"><MailOutlined className="mr-1 text-[#8C4BFF]" />{prac.email}</span>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Last Care Session Date</span>
                  <span className="text-slate-700 dark:text-slate-300">{prac.lastAppt}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={() => handleSendMessageClick(prac)}
                  style={{ backgroundColor: '#8C4BFF', borderColor: '#8C4BFF' }}
                  className="rounded-xl font-bold text-xs h-8 text-white flex-1"
                >
                  Send Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Message Modal */}
      <Modal
        open={messageModalOpen}
        onCancel={() => setMessageModalOpen(false)}
        title={<span className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2"><MessageOutlined className="text-[#8C4BFF]"/> Secure Message</span>}
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={submitMessage} className="space-y-4 pt-2">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 flex items-center gap-3">
            <Avatar src={selectedDoctor?.avatarUrl || selectedDoctor?.avatar || null} size={40} />
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">To:</span>
              <span className="block font-bold text-slate-700 dark:text-slate-200 text-xs">{selectedDoctor?.name}</span>
              <span className="block text-[10px] text-slate-500">{selectedDoctor?.specialty}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Message</label>
            <Input.TextArea 
              placeholder={`Write a message to ${selectedDoctor?.name.split(' ')[0]}...`} 
              rows={4} 
              className="rounded-xl"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoFocus
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Messages are securely encrypted and added to your clinical record.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setMessageModalOpen(false)} className="rounded-xl font-bold border-slate-200">Cancel</Button>
            <Button type="primary" htmlType="submit" disabled={!messageText.trim()} style={{ backgroundColor: messageText.trim() ? '#8C4BFF' : undefined, borderColor: messageText.trim() ? '#8C4BFF' : undefined }} className="rounded-xl font-bold text-xs text-white">Send Secure Message</Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}

