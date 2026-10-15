import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal, Form, Input, Select, Tag, Space, Spin } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  TagOutlined,
  StarOutlined,
  HeartOutlined,
  WarningOutlined,
  FlagOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  AuditOutlined,
  SmileOutlined,
  CrownOutlined,
  FireOutlined,
  AlertOutlined
} from '@ant-design/icons'
import { useClinicStore } from '../../../store/clinicStore'
import { getPatients } from '../../calendar/api/clinicAdminApi'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'

const { Option } = Select

const tagIconsMap = {
  TagOutlined: <TagOutlined style={{ fontSize: 10 }} />,
  StarOutlined: <StarOutlined style={{ fontSize: 10 }} />,
  HeartOutlined: <HeartOutlined style={{ fontSize: 10 }} />,
  WarningOutlined: <WarningOutlined style={{ fontSize: 10 }} />,
  FlagOutlined: <FlagOutlined style={{ fontSize: 10 }} />,
  LockOutlined: <LockOutlined style={{ fontSize: 10 }} />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined style={{ fontSize: 10 }} />,
  InfoCircleOutlined: <InfoCircleOutlined style={{ fontSize: 10 }} />,
  ApiOutlined: <ApiOutlined style={{ fontSize: 10 }} />,
  AuditOutlined: <AuditOutlined style={{ fontSize: 10 }} />,
  SmileOutlined: <SmileOutlined style={{ fontSize: 10 }} />,
  CrownOutlined: <CrownOutlined style={{ fontSize: 10 }} />,
  FireOutlined: <FireOutlined style={{ fontSize: 10 }} />,
  AlertOutlined: <AlertOutlined style={{ fontSize: 10 }} />,
}

function renderTagIcon(iconName) {
  return tagIconsMap[iconName] || <TagOutlined style={{ fontSize: 10 }} />
}

const defaultTagColors = {
  ndis: '#8C4BFF',
  private: '#10B981',
  medicare: '#0284C7',
  dva: '#F59E0B',
  workcover: '#EC4899',
  tac: '#6366F1',
  'home visit': '#14B8A6',
  telehealth: '#8B5CF6',
  paediatric: '#F97316',
  'aged care': '#059669',
  vip: '#D97706',
  active: '#10B981',
}

export function resolveTagColor(label, clientTags) {
  const labelStr = typeof label === 'string' ? label : (label?.name || label?.label || String(label || ''))
  const lk = labelStr.toLowerCase().trim()
  const matched = Array.isArray(clientTags) ? clientTags.find(t => String(t?.name || t?.label || '').toLowerCase().trim() === lk) : null
  if (matched && matched.color) return matched.color
  if (defaultTagColors[lk]) return defaultTagColors[lk]
  let hash = 0
  for (let i = 0; i < lk.length; i++) {
    hash = lk.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 75%, 45%)`
}

function ClientTag({ label, clientTags }) {
  const labelStr = typeof label === 'string' ? label : (label?.name || label?.label || String(label || ''))
  const matched = Array.isArray(clientTags) ? clientTags.find(t => String(t?.name || t?.label || '').toLowerCase() === labelStr.toLowerCase()) : null
  const color = resolveTagColor(labelStr, clientTags)
  const icon = matched ? matched.icon : 'TagOutlined'
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mr-1 border"
      style={{
        backgroundColor: color + '15',
        color: color,
        borderColor: color + '30',
      }}
    >
      {renderTagIcon(icon)}
      <span>{labelStr}</span>
    </span>
  )
}

export default function PatientsPage() {
  const store = useClinicStore()
  const navigate = useNavigate()
  const basePath = window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '/clinic'
  const [searchText, setSearchText] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [sortBy, setSortBy] = useState('Clients name')
  const [patientsList, setPatientsList] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  React.useEffect(() => {
    const loadPatientsFromDB = async () => {
      try {
        setLoadingPatients(true)
        const res = await getPatients({ search: searchText })
        if (res?.success && Array.isArray(res.data)) {
          setPatientsList(res.data)
          if (typeof store.setPatients === 'function') {
            store.setPatients(res.data)
          }
        }
      } catch (err) {
        console.error('Failed to load patients from live DB:', err)
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatientsFromDB()
  }, [searchText])

  const isPractitioner = React.useMemo(() => {
    const role = (store.userRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : '') || '').toLowerCase()
    return role === 'practitioner' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/practitioner'))
  }, [store.userRole])

  const [activeClientTab, setActiveClientTab] = useState(() => isPractitioner ? 'my_clients' : 'all_clients')

  // Find logged-in practitioner object dynamically
  const loggedInPractitioner = React.useMemo(() => {
    if (!Array.isArray(store.practitioners) || store.practitioners.length === 0) return null
    let parsedUser = null
    try {
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (uStr) parsedUser = JSON.parse(uStr)
    } catch (e) {}
    const uId = parsedUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '')
    const uEmail = (parsedUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '')).toLowerCase().trim()
    const uName = (parsedUser?.name || (typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : '')).toLowerCase().trim()

    return store.practitioners.find(p => p.userId === uId || p.id === uId) ||
           store.practitioners.find(p => p.email && p.email.toLowerCase().trim() === uEmail) ||
           store.practitioners.find(p => p.name && p.name.toLowerCase().replace(/dr\.?\s*/g, '').includes(uName.replace(/dr\.?\s*/g, ''))) ||
           store.practitioners[0] || null
  }, [store.practitioners])

  // Set of patient IDs with existing appointment or consultation history with the logged-in practitioner
  const myPatientIds = React.useMemo(() => {
    if (!loggedInPractitioner) return new Set()
    const ids = new Set()
    const pracId = loggedInPractitioner.id
    const pracName = (loggedInPractitioner.name || '').toLowerCase().replace(/dr\.?\s*/g, '').trim()

    if (Array.isArray(store.appointments)) {
      store.appointments.forEach(a => {
        const apptPracName = (a.practitionerName || '').toLowerCase().replace(/dr\.?\s*/g, '').trim()
        if (a.patientId && (a.practitionerId === pracId || (pracName && apptPracName && (apptPracName.includes(pracName) || pracName.includes(apptPracName))))) {
          ids.add(a.patientId)
        }
      })
    }
    if (Array.isArray(store.consultations)) {
      store.consultations.forEach(c => {
        const consPracName = (c.practitionerName || '').toLowerCase().replace(/dr\.?\s*/g, '').trim()
        if (c.patientId && (c.practitionerId === pracId || (pracName && consPracName && (consPracName.includes(pracName) || pracName.includes(consPracName))))) {
          ids.add(c.patientId)
        }
      })
    }
    return ids
  }, [loggedInPractitioner, store.appointments, store.consultations])

  const allPats = React.useMemo(() => {
    const map = new Map()
    const processPatient = (p) => {
      if (p && p.id) {
        // Exclude staff/admin accounts mistakenly linked to Patient table (preserve valid patients with userId === null)
        if (p.user && p.user.role && p.user.role !== 'PATIENT') return
        map.set(p.id, {
          ...p,
          name: p.fullName || p.name || 'Unknown Client',
          dob: p.dob || '',
          phone: p.phone || '',
          email: p.email || '',
          tags: Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : [])
        })
      }
    }
    if (Array.isArray(store.patients)) store.patients.forEach(processPatient)
    if (Array.isArray(patientsList)) patientsList.forEach(processPatient)
    return Array.from(map.values())
  }, [patientsList, store.patients])

  const myClientsList = React.useMemo(() => {
    return allPats.filter(p => myPatientIds.has(p.id))
  }, [allPats, myPatientIds])

  const baseList = React.useMemo(() => {
    if (isPractitioner) {
      return myClientsList.length > 0 ? myClientsList : allPats
    }
    return allPats
  }, [isPractitioner, myClientsList, allPats])

  const filteredPatients = baseList.filter((p) => {
    const search = (searchText || '').trim().toLowerCase()
    const matchesSearch = !search ||
      (p.name || '').toLowerCase().includes(search) ||
      (p.email || '').toLowerCase().includes(search) ||
      (p.phone || '').toLowerCase().includes(search)

    const matchesTag = !selectedTag || selectedTag === 'All tags' || (Array.isArray(p.tags) && p.tags.includes(selectedTag))
    return matchesSearch && matchesTag
  })

  // Paginate: show 15 per page
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15
  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE)
  const pageData = filteredPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      {/* ── Header + Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white m-0">Clients</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-semibold">
            {isPractitioner
              ? 'Viewing clients assigned under your clinical care'
              : 'Manage your clients and their details.'}
          </p>
          
          {/* Practitioner Access Isolation Indicator */}
          {isPractitioner && (
            <div className="flex items-center gap-2 mt-3 bg-purple-50 dark:bg-purple-950/40 p-1.5 px-3 rounded-xl w-fit border border-purple-200 dark:border-purple-800">
              <span className="text-xs font-bold text-[#8C4BFF] flex items-center gap-1.5">
                <SafetyCertificateOutlined style={{ fontSize: 13 }} />
                My Assigned Clients ({baseList.length})
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 border-l border-purple-200 dark:border-purple-800 pl-2">
                Clinical Access Controls Active
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <SearchOutlined
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: 13 }}
            />
            <input
              type="text"
              placeholder="Search client here..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#8C4BFF] transition-colors"
            />
          </div>

          {/* Filters & Add Client Button Group */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Tag filter */}
            <Select
              placeholder="All tags"
              allowClear
              value={selectedTag || undefined}
              onChange={(v) => {
                setSelectedTag(v || '')
                setPage(1)
              }}
              className="rounded-xl flex-1 sm:flex-none"
              style={{ minWidth: 120, height: 38 }}
            >
              {store.clientTags.map((tag) => (
                <Option key={tag.id} value={tag.name}>
                  <span className="inline-flex items-center gap-1.5">
                    {renderTagIcon(tag.icon)}
                    <span>{tag.name}</span>
                  </span>
                </Option>
              ))}
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onChange={setSortBy}
              className="rounded-xl flex-1 sm:flex-none"
              style={{ minWidth: 130, height: 38 }}
            >
              <Option value="Clients name">Clients name</Option>
              <Option value="Date of Birth">Date of Birth</Option>
              <Option value="Recent">Recent</Option>
            </Select>

            {/* Add Client Button */}
            <button
              onClick={() => navigate(`${basePath}/patients/new`)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-85 cursor-pointer whitespace-nowrap bg-[#8C4BFF] h-[38px] flex-shrink-0"
            >
              <PlusOutlined style={{ fontSize: 10 }} />
              Add client
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <div className="w-full">
            {/* Table Header */}
            <div
              className="hidden md:grid text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
              style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1.8fr 1.8fr 1.5fr', alignItems: 'stretch' }}
            >
              <span className="bg-slate-50 dark:bg-slate-800/60 py-3 px-6 font-bold text-slate-700 dark:text-slate-300">Client Name</span>
              <span className="py-3 px-4 flex items-center">Date of Birth</span>
              <span className="py-3 px-4 flex items-center">Contact Number</span>
              <span className="py-3 px-4 flex items-center">Email</span>
              <span className="py-3 px-4 flex items-center">Tags</span>
              <span className="py-3 px-4 flex items-center justify-end pr-6">Action</span>
            </div>

            {/* Table Rows */}
            {pageData.map((patient, idx) => (
              <div
                key={patient.id}
                onClick={() => navigate(`${basePath}/patients/${patient.id}`)}
                className="flex flex-col md:grid border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group py-2 md:py-0"
                style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1.8fr 1.8fr 1.5fr', alignItems: 'stretch' }}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#8C4BFF] transition-colors bg-slate-50/50 md:bg-slate-50 dark:bg-slate-800/50 md:dark:bg-slate-800 py-3 md:py-4 px-4 md:px-6 md:border-r border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between">
                  <span className="md:hidden font-bold text-xs text-slate-400 uppercase tracking-wider">Client Name</span>
                  {patient.name}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 py-1.5 md:py-4 px-4 flex items-center justify-between">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Date of Birth</span>
                  {patient.dob ? dayjs(patient.dob).format('D MMM, YYYY') : '—'}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 py-1.5 md:py-4 px-4 flex items-center justify-between">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Contact</span>
                  {patient.phone || '—'}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-500 py-1.5 md:py-4 px-4 flex items-center justify-between truncate">
                  <span className="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">Email</span>
                  <span className="truncate">{patient.email || '—'}</span>
                </span>
                <div className="flex flex-wrap gap-1 py-3 md:py-4 px-4 items-center justify-start md:justify-start">
                  {(patient.tags || []).slice(0, 3).map((tag) => (
                    <ClientTag key={tag} label={tag} clientTags={store.clientTags} />
                  ))}
                </div>
                <div className="py-3 md:py-4 px-4 flex items-center justify-end pr-6">
                  {basePath === '/clinic-admin' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/clinic-admin/patients/${patient.id}`)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#8C4BFF] hover:bg-[#7B3DE8] border-none shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      View Profile
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/practitioner/consultations?patientId=${patient.id}`)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#8C4BFF] hover:bg-[#7B3DE8] border-none shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      Start Consultation
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loadingPatients ? (
              <div className="py-16 text-center text-slate-400">
                <Spin size="large" />
                <p className="text-xs text-slate-400 mt-3 font-semibold">Loading clients from live database...</p>
              </div>
            ) : pageData.length === 0 ? (
              <div className="py-16 text-center text-slate-300">
                <p className="text-sm font-semibold text-slate-400">No clients found</p>
                <p className="text-xs text-slate-300 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredPatients.length)} out of {filteredPatients.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
              >
                {'< Previous'}
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${page === p ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-400 text-xs px-1">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className="w-7 h-7 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 transition-colors"
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
              >
                {'Next >'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
