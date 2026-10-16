import React, { useState, useMemo, useRef, useEffect } from 'react'
import { DatePicker, Select, Switch, Card, Button, Tooltip as AntdTooltip } from 'antd'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ArrowUpOutlined,
  DollarOutlined,
  CalendarOutlined,
  PercentageOutlined,
  UserAddOutlined,
  WarningOutlined,
  FileTextOutlined,
  DownloadOutlined,
  SlidersOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import dayjs from 'dayjs'
import { useClinicStore } from '../../../store/clinicStore'
import { toast } from 'react-hot-toast'
import { getReports } from '../../calendar/api/clinicAdminApi'


const { RangePicker } = DatePicker
const { Option } = Select



// Specific Reports Map
const SPECIFIC_REPORTS = {
  Overview: [
    { value: 'all_summary', label: 'All Activity Summary' },
    { value: 'exec_dashboard', label: 'Executive Dashboard' }
  ],
  Financial: [
    { value: 'invoices_ledger', label: 'Invoices Ledger' },
    { value: 'rev_by_prac', label: 'Revenue by Practitioner' },
    { value: 'outstanding_bal', label: 'Outstanding Balances' }
  ],
  Clients: [
    { value: 'client_reg', label: 'Client Registrations' },
    { value: 'waitlist_analysis', label: 'Waitlist Analysis' },
    { value: 'client_demo', label: 'Client Demographics' }
  ],
  'Appointments & Utilisation': [
    { value: 'appt_counts', label: 'Appointment Counts' },
    { value: 'cancel_rates', label: 'Cancellation Rates' },
    { value: 'prac_util', label: 'Practitioner Utilisation' }
  ]
}

// Default table headers for report categories (clean schema, no mock rows)
const DEFAULT_REPORT_HEADERS = {
  all_summary: ['Period', 'Appointments Completed', 'New Clients', 'Total Revenue ($)', 'Outstanding Balance ($)'],
  exec_dashboard: ['Metric Name', 'Current Value', 'Target Value', 'Status', 'Performance vs Target'],
  invoices_ledger: ['Invoice #', 'Invoice Date', 'Client Name', 'Practitioner', 'Amount ($)', 'Status'],
  rev_by_prac: ['Practitioner', 'Specialty', 'Completed Appointments', 'Total Revenue ($)', 'Average Fee ($)'],
  outstanding_bal: ['Invoice #', 'Client Name', 'Due Date', 'Total Amount ($)', 'Outstanding Balance ($)', 'Status'],
  client_reg: ['Client Name', 'Email', 'Phone', 'Registration Date', 'Status'],
  waitlist_analysis: ['Client Name', 'Practitioner', 'Preferred Days', 'Added Date', 'Status'],
  client_demo: ['Category', 'Client Count', 'Percentage (%)'],
  appt_counts: ['Practitioner', 'Completed', 'Cancelled', 'No Show', 'Total Scheduled'],
  cancel_rates: ['Practitioner', 'Total Booked', 'Cancelled', 'Cancellation Rate (%)'],
  prac_util: ['Practitioner', 'Booked Hours', 'Standard Capacity (hrs)', 'Utilisation (%)']
}

export default function ReportsPage() {
  const store = useClinicStore()
  const darkMode = store.darkMode

  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()])
  const [period, setPeriod] = useState('Monthly')
  const [practitioner, setPractitioner] = useState('All Practitioners')
  const [location, setLocation] = useState('All Locations')
  const [compare, setCompare] = useState(false)
  const [reportCategory, setReportCategory] = useState('Overview')
  const [specificReport, setSpecificReport] = useState('all_summary')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeDataTable, setIncludeDataTable] = useState(true)
  const [liveReportData, setLiveReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchLiveReports = async () => {
      setLoading(true)
      try {
        const params = {
          startDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
          endDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
          period,
          practitioner,
          location,
          reportCategory,
          reportType: specificReport
        }
        const res = await getReports(params)
        if (res && res.success && res.data) {
          setLiveReportData(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch live reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveReports()
  }, [dateRange, period, practitioner, location, reportCategory, specificReport])


  // Sync category transitions
  const handleCategoryChange = (val) => {
    setReportCategory(val)
    const options = SPECIFIC_REPORTS[val] || []
    if (options.length > 0) {
      setSpecificReport(options[0].value)
    }
  }

  // Handle specific report change and scroll to table
  const handleReportTypeChange = (val) => {
    setSpecificReport(val)
    setTimeout(() => {
      document.getElementById('detailed-reports-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Get active dynamic table data from backend; clean default schema when loading/empty
  const effectiveTableData = useMemo(() => {
    let rawTable = (liveReportData && liveReportData.tableData && Array.isArray(liveReportData.tableData.headers) && Array.isArray(liveReportData.tableData.rows))
      ? liveReportData.tableData
      : { headers: DEFAULT_REPORT_HEADERS[specificReport] || [], rows: [] }

    if (!rawTable || !rawTable.rows) return { headers: DEFAULT_REPORT_HEADERS[specificReport] || [], rows: [] }

    if (!searchTerm.trim()) return rawTable

    const query = searchTerm.toLowerCase().trim()
    const filteredRows = rawTable.rows.filter(row => {
      return Object.values(row).some(val => String(val).toLowerCase().includes(query))
    })

    return {
      headers: rawTable.headers,
      rows: filteredRows
    }
  }, [liveReportData, specificReport, searchTerm])

  // Dynamic Practitioners options list from database
  const practitionerOptions = useMemo(() => {
    if (liveReportData && Array.isArray(liveReportData.practitioners) && liveReportData.practitioners.length > 0) {
      const dbList = liveReportData.practitioners.map(p => p.startsWith('Dr.') ? p.replace('Dr. ', '') : p)
      return Array.from(new Set(['All Practitioners', ...dbList]))
    }
    return ['All Practitioners']
  }, [liveReportData])

  // Dynamic Locations options list from database
  const locationOptions = useMemo(() => {
    if (liveReportData && Array.isArray(liveReportData.locations) && liveReportData.locations.length > 0) {
      return Array.from(new Set(['All Locations', ...liveReportData.locations]))
    }
    return ['All Locations']
  }, [liveReportData])

  // Exports Handlers
  const handleDownloadPDF = () => {
    const tableData = effectiveTableData
    if (!tableData || tableData.rows.length === 0) {
      toast.error('No data available to generate PDF.')
      return
    }

    const doc = new jsPDF()
    const reportTitle = SPECIFIC_REPORTS[reportCategory]?.find(r => r.value === specificReport)?.label || 'Report'
    
    // Add title
    doc.setFontSize(18)
    doc.text(`Health Clinic - ${reportTitle}`, 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${dayjs().format('DD MMM YYYY, hh:mm A')}`, 14, 30)

    // Generate table
    const tableColumn = tableData.headers
    const tableRows = tableData.rows.map(row => Object.values(row))

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [140, 75, 255] }
    })

    doc.save(`${specificReport}_report_${dayjs().format('YYYY-MM-DD')}.pdf`)
    toast.success('PDF downloaded successfully!')
  }

  const handleExportCSV = () => {
    const tableData = effectiveTableData
    if (!tableData || tableData.rows.length === 0) {
      toast.error('No data available to export.')
      return
    }

    const { headers, rows } = tableData
    
    // Format as CSV content
    const csvRows = []
    csvRows.push(headers.join(','))
    rows.forEach(row => {
      const values = Object.values(row).map(value => {
        const escaped = ('' + value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(values.join(','))
    })
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${specificReport}_report_${dayjs().format('YYYY-MM-DD')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Successfully exported report data as CSV!')
  }

  // Dynamically compute card metrics strictly based on selected filters and live database
  const metrics = useMemo(() => {
    if (liveReportData && liveReportData.metrics) {
      const m = liveReportData.metrics
      return {
        revenue: m.revenue ?? 0,
        appointments: m.appointments ?? 0,
        newClients: m.newClients ?? 0,
        outstanding: m.outstanding ?? 0,
        practitionersCount: m.practitionersCount ?? 1,
        utilisation: m.utilisation ?? 0,
        cancellation: m.cancellation ?? 0,
        uninvoiced: m.uninvoiced ?? 0,
        bookedHours: m.bookedHours ?? 0,
        availableHours: m.availableWorkingHours ?? m.availableHours ?? 40
      }
    }
    // Clean neutral zeros during initial load (never display unfiltered store fallback amounts)
    return {
      revenue: 0,
      appointments: 0,
      newClients: 0,
      outstanding: 0,
      utilisation: 0,
      cancellation: 0,
      uninvoiced: 0,
      practitionersCount: 1,
      bookedHours: 0,
      availableHours: 40
    }
  }, [liveReportData])

  // Dynamically compute charts data strictly from DB data
  const chartRevenueData = useMemo(() => {
    const list = (liveReportData && Array.isArray(liveReportData.revenueTrend) && liveReportData.revenueTrend.length > 0)
      ? liveReportData.revenueTrend
      : ((liveReportData && Array.isArray(liveReportData.monthlyRevenue)) ? liveReportData.monthlyRevenue : [])

    if (list.length > 0) {
      return list.map(d => ({
        name: d.name,
        current: Math.round(d.current || 0),
        previous: Math.round(d.previous || 0)
      }))
    }
    return []
  }, [liveReportData])

  // Client growth chart from DB
  const chartClientGrowthData = useMemo(() => {
    if (liveReportData && Array.isArray(liveReportData.clientGrowth)) {
      return liveReportData.clientGrowth
    }
    return []
  }, [liveReportData])

  // Payment status pie chart from DB
  const chartPaymentStatusData = useMemo(() => {
    if (liveReportData && Array.isArray(liveReportData.paymentStatus)) {
      return [
        { name: 'Paid', value: liveReportData.paymentStatus.find(p => p.name === 'Paid')?.value || 0, color: '#30D2BE' },
        { name: 'Outstanding', value: liveReportData.paymentStatus.find(p => p.name === 'Outstanding')?.value || 0, color: '#F59E0B' },
        { name: 'Draft / Uninvoiced', value: liveReportData.paymentStatus.find(p => p.name === 'Draft / Uninvoiced')?.value || 0, color: '#8C4BFF' }
      ]
    }
    return []
  }, [liveReportData])

  const chartPractitionerData = useMemo(() => {
    const list = (liveReportData && Array.isArray(liveReportData.practitionerPerformance)) ? liveReportData.practitionerPerformance : []
    const selectedPrac = (practitioner || '').replace('Dr. ', '').trim()
    return list
      .filter(d => selectedPrac === 'All Practitioners' || selectedPrac === 'All' || selectedPrac === '' || (d.name || '').includes(selectedPrac))
      .map(d => ({
        name: d.name,
        Appointments: Math.max(0, Math.round(d.Appointments || 0)),
        Revenue: Math.round(d.Revenue || 0)
      }))
  }, [liveReportData, practitioner])

  // Filters cards depending on reportCategory
  const statsList = [
    {
      id: 'utilisation',
      label: 'Utilisation',
      icon: '%',
      value: `${metrics.utilisation}%`,
      sub: metrics.practitionersCount && metrics.practitionersCount > 1
        ? `(Booked ${metrics.bookedHours ?? 0}h / ${metrics.availableHours ?? 40}h cap · ${metrics.practitionersCount} pracs)`
        : `(Booked ${metrics.bookedHours ?? Math.round(metrics.utilisation * 0.4)}h / ${metrics.availableHours ?? 40}h cap)`,
      tooltip: metrics.practitionersCount && metrics.practitionersCount > 1
        ? `Formula: (Booked Hours [${metrics.bookedHours ?? 0}h] / Total Capacity [${metrics.availableHours ?? 40}h across ${metrics.practitionersCount} active practitioners × 40h/week]) × 100.`
        : `Formula: (Booked Hours / Available Working Hours [${metrics.availableHours ?? 40}h]) × 100. Standard capacity is 40 hours per practitioner per week.`,
      cat: 'Appointments & Utilisation'
    },
    {
      id: 'revenue',
      label: 'Revenue',
      icon: <DollarOutlined className="border border-slate-600 rounded-full p-0.5" />,
      value: `$${Number(metrics.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: metrics.revenue > 0 ? 'Total period revenue' : 'No revenue recorded',
      tooltip: 'Total revenue collected from paid invoices and payments in this period.',
      cat: 'Financial'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <CalendarOutlined />,
      value: String(metrics.appointments || 0),
      sub: 'Scheduled visits',
      tooltip: 'Total scheduled patient appointments in this period.',
      cat: 'Appointments & Utilisation'
    },
    {
      id: 'cancellation',
      label: 'Cancellation',
      icon: <WarningOutlined />,
      value: `${metrics.cancellation}%`,
      sub: metrics.cancellation > 0 ? `${metrics.cancellation}% cancellation rate` : 'Zero cancellations',
      tooltip: 'Percentage of total appointments that were cancelled.',
      cat: 'Appointments & Utilisation'
    },
    {
      id: 'newClients',
      label: 'New Clients',
      icon: <UserAddOutlined />,
      value: String(metrics.newClients || 0),
      sub: 'Onboarded this period',
      tooltip: 'Total unique registered clients / patients.',
      cat: 'Clients'
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      icon: <DollarOutlined className="border border-slate-600 rounded-full p-0.5" />,
      value: `$${Number(metrics.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: Number(metrics.outstanding || 0) === 0 ? 'All invoices settled' : 'Total current unpaid balance',
      tooltip: 'Total current unpaid balance across all active invoices (excluding draft and cancelled invoices, matching Dashboard).',
      cat: 'Financial'
    },
    {
      id: 'uninvoiced',
      label: 'Uninvoiced',
      icon: <FileTextOutlined />,
      value: String(metrics.uninvoiced || 0),
      sub: 'Draft invoice needed',
      tooltip: 'Draft invoices awaiting finalisation.',
      cat: 'Financial'
    }
  ]

  const visibleStats = statsList

  return (
    <div className="w-full min-h-full p-8 transition-colors duration-300" style={{ backgroundColor: darkMode ? '#0B1120' : '#F8FAFC' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 no-print mb-6">
        <div>
          <h1 className="text-3xl font-extrabold m-0 tracking-tight" style={{ color: darkMode ? '#FFFFFF' : '#0E1B33' }}>
            Performance Overview Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: darkMode ? '#94A3B8' : '#475569' }}>
            Real-time analytics, utilization rates, and financial reports across all locations.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-xs font-semibold text-slate-400">
            Last updated: {dayjs().format('DD MMM YYYY, h:mm A')}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <DownloadOutlined />
              <span>CSV</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold bg-[#8C4BFF] hover:bg-[#7b3fe0] text-white border-none cursor-pointer transition-colors"
            >
              <FileTextOutlined />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Filters Block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-sm no-print">
        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-4">Dashboard Filters</span>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2 xl:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Date Range</label>
            <div className="flex items-center gap-2">
              <DatePicker 
                className="h-9 w-full rounded-lg text-xs text-slate-800 dark:text-slate-200" 
                placeholder="Start date" 
                value={dateRange[0]}
                onChange={val => setDateRange([val, dateRange[1]])}
              />
              <span className="text-slate-400">-</span>
              <DatePicker 
                className="h-9 w-full rounded-lg text-xs text-slate-800 dark:text-slate-200" 
                placeholder="End date" 
                value={dateRange[1]}
                onChange={val => setDateRange([dateRange[0], val])}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Period</label>
            <Select value={period} onChange={setPeriod} className="w-full h-9 rounded-lg text-xs [&_.ant-select-selection-item]:!text-slate-800 dark:[&_.ant-select-selection-item]:!text-slate-200">
              <Option value="Daily">Daily</Option>
              <Option value="Weekly">Weekly</Option>
              <Option value="Monthly">Monthly</Option>
              <Option value="Yearly">Yearly</Option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Practitioner</label>
            <Select value={practitioner} onChange={setPractitioner} className="w-full h-9 rounded-lg text-xs [&_.ant-select-selection-item]:!text-slate-800 dark:[&_.ant-select-selection-item]:!text-slate-200">
              {practitionerOptions.map(p => (
                <Option key={p} value={p}>{p}</Option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Clinic Location</label>
            <Select value={location} onChange={setLocation} className="w-full h-9 rounded-lg text-xs [&_.ant-select-selection-item]:!text-slate-800 dark:[&_.ant-select-selection-item]:!text-slate-200">
              {locationOptions.map(loc => (
                <Option key={loc} value={loc}>{loc}</Option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg h-9">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Compare (Prev. Period)</span>
            <Switch 
              checked={compare}
              onChange={setCompare}
              size="small" 
              style={{ backgroundColor: compare ? '#8C4BFF' : undefined }} 
            />
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full my-5" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Report Category</label>
            <Select value={reportCategory} onChange={handleCategoryChange} className="w-full h-9 rounded-lg text-xs [&_.ant-select-selection-item]:!text-slate-800 dark:[&_.ant-select-selection-item]:!text-slate-200">
              {Object.keys(SPECIFIC_REPORTS).map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Report Type</label>
            <Select value={specificReport} onChange={handleReportTypeChange} className="w-full h-9 rounded-lg text-xs [&_.ant-select-selection-item]:!text-slate-800 dark:[&_.ant-select-selection-item]:!text-slate-200">
              {(SPECIFIC_REPORTS[reportCategory] || []).map(r => (
                <Option key={r.value} value={r.value}>{r.label}</Option>
              ))}
            </Select>
          </div>
        </div>
      </div>


      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3 xl:gap-4 mb-6">
        {visibleStats.map(s => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[16px] p-4 shadow-sm flex flex-col justify-between h-[116px] transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {s.label}
                </span>
                {s.tooltip && (
                  <AntdTooltip title={s.tooltip}>
                    <InfoCircleOutlined className="text-slate-400 hover:text-[#8C4BFF] cursor-pointer text-[10px]" />
                  </AntdTooltip>
                )}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[13px]">
                {s.icon}
              </div>
            </div>

            {/* Main Calculated KPI Numeric Value */}
            <div className="my-1">
              {loading ? (
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
              ) : (
                <div className="text-[20px] font-black text-slate-800 dark:text-white tracking-tight leading-none truncate" title={s.value}>
                  {s.value}
                </div>
              )}
            </div>

            {/* Sub-text Caption */}
            <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 truncate">
              {s.id === 'utilisation' || s.id === 'revenue' ? (
                <>
                  <ArrowUpOutlined style={{ fontSize: '8px', color: '#10B981' }} />
                  <span className="truncate">{s.sub}</span>
                </>
              ) : (
                <span className="truncate">{s.sub}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Recharts Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Revenue Graph */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-white m-0">Revenue Trend</h3>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {dateRange && dateRange[0] && dateRange[1]
                  ? `${dateRange[0].format('D MMM YYYY')} – ${dateRange[1].format('D MMM YYYY')}`
                  : 'Total period revenue'}
              </span>
            </div>
            <span className="text-xs font-bold text-[#8C4BFF] bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-lg">
              {period} View
            </span>
          </div>
          <div className="h-64">
            {(!chartRevenueData || chartRevenueData.length === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                No revenue trend data recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartRevenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1E293B' : '#F1F5F9'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? '' : val} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', color: darkMode ? '#FFFFFF' : '#1E293B', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="current" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 2: Practitioner Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-white m-0">Practitioner Performance</h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Revenue & appointment counts</span>
          </div>
          <div className="h-64">
            {(!chartPractitionerData || chartPractitionerData.length === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                No practitioner activity recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartPractitionerData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1E293B' : '#F1F5F9'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#475569'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? '' : val} />
                <Tooltip cursor={{ fill: darkMode ? '#1E293B' : '#F3F4F6' }} contentStyle={{ backgroundColor: darkMode ? '#1E293B' : '#FFFFFF', color: darkMode ? '#FFFFFF' : '#1E293B', borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Revenue" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Reports Section */}
      <div id="detailed-reports-section" className="mt-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white m-0">Detailed Reports ({SPECIFIC_REPORTS[reportCategory]?.find(r => r.value === specificReport)?.label || 'Report'})</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 mb-0">View the detailed breakdown for the selected report type.</p>
          </div>
          <div className="w-full lg:w-72">
            <input
              type="text"
              placeholder="Search table rows..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-[#8C4BFF] transition-colors"
            />
          </div>
        </div>

        {specificReport === 'prac_util' && (
          <div className="mb-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-purple-900 dark:text-purple-300">
            <InfoCircleOutlined className="text-[#8C4BFF] text-sm shrink-0" />
            <span>
              <strong>Utilisation Rate Formula:</strong> (Hours Scheduled ÷ Available Working Hours) × 100. Standard full-time clinical capacity is 40 hours per practitioner per week.
            </span>
          </div>
        )}

        {/* Dynamic Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {effectiveTableData.headers.map((h, i) => (
                  <th key={i} className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {effectiveTableData.rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {Object.values(r).map((val, j) => (
                    <td key={j} className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {j === Object.keys(r).length - 1 && (val === 'Paid' || val === 'Active' || val === 'On Track' || val === 'Exceeded') ? (
                        <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                          {val}
                        </span>
                      ) : j === Object.keys(r).length - 1 && (val === 'Outstanding' || val === 'Action Needed' || val === 'Inactive') ? (
                        <span className="bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                          {val}
                        </span>
                      ) : j === Object.keys(r).length - 1 && val === 'Draft' ? (
                        <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                          {val}
                        </span>
                      ) : typeof val === 'number' && (effectiveTableData.headers[j] || '').includes('($)') ? (
                        `${val.toLocaleString()}`
                      ) : (
                        val
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!effectiveTableData.rows || effectiveTableData.rows.length === 0) && (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No data available for the selected period.
            </div>
          )}
        </div>
      </div>

      {/* Global overrides for this specific layout */}
      <style>{`
        .custom-dark-select .ant-select-selector {
          background-color: ${darkMode ? '#1E293B' : '#EEF2F6'} !important;
          border: none !important;
          color: ${darkMode ? '#E2E8F0' : '#334155'} !important;
          border-radius: 12px !important;
          height: 36px !important;
          align-items: center !important;
          font-size: 13px !important;
        }
        .custom-dark-dropdown {
          background-color: ${darkMode ? '#1E293B' : '#FFFFFF'} !important;
          border: 1px solid ${darkMode ? '#334155' : '#E2E8F0'} !important;
        }
        .custom-dark-dropdown .ant-select-item {
          color: ${darkMode ? '#E2E8F0' : '#334155'} !important;
        }
        .custom-dark-dropdown .ant-select-item-option-active {
          background-color: ${darkMode ? '#334155' : '#F1F5F9'} !important;
        }
      `}</style>
    </div>
  )
}
