import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, Switch, Tag, Spin, Empty } from 'antd'
import { CheckOutlined, PlayCircleOutlined, FireOutlined, BellOutlined, MobileOutlined } from '@ant-design/icons'
import { toast } from 'react-hot-toast'
import api from '../../../../api/axios'

export default function PatientExercises() {
  const [loading, setLoading] = useState(false)
  const [exerciseToday, setExerciseToday] = useState([])

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patient/exercises')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setExerciseToday(res.data.data)
      }
    } catch (err) {
      console.warn('Prescribed exercises fetch fallback notice:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  const handleToggleExercise = async (ex) => {
    // Optimistic UI update
    setExerciseToday(prev => prev.map(p => p.id === ex.id ? { ...p, done: !p.done } : p))
    if (!ex.done) toast.success(`Great job! ${ex.name} completed!`)

    try {
      const res = await api.put(`/api/patient/exercises/${ex.id}/toggle`)
      if (res.data?.success && res.data.data) {
        setExerciseToday(prev => prev.map(p => p.id === ex.id ? res.data.data : p))
      }
    } catch (err) {
      console.warn('Toggle exercise DB sync notice:', err?.message)
    }
  }

  const completedCount = exerciseToday.filter(ex => ex.done).length
  const totalCount = exerciseToday.length
  const compliancePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      
      {/* Gamification Header */}
      <div className="bg-gradient-to-r from-[#8C4BFF] to-[#30D2BE] rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black m-0 text-white flex items-center gap-2">
            <FireOutlined className="text-orange-400" /> 14 Day Streak!
          </h2>
          <p className="text-xs font-semibold mt-1 opacity-90 m-0">You're in the top 10% of patients for compliance this week. Keep it up!</p>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-center min-w-[120px]">
          <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">Daily Goal</span>
          <span className="block text-lg font-black">{completedCount} / {totalCount} Done</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercises List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-808 dark:text-slate-200">Today's Prescribed Routine</h3>
          
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" description="Loading prescribed exercises..." />
            </div>
          ) : exerciseToday.length === 0 ? (
            <Card className="text-center py-8 rounded-2xl">
              <Empty description="No prescribed exercises scheduled for today." />
            </Card>
          ) : (
            <div className="space-y-4">
              {exerciseToday.map(ex => (
                <Card key={ex.id} className={`border ${ex.done ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'} rounded-2xl shadow-sm overflow-hidden body-no-padding`}>
                  <div className="flex flex-col sm:flex-row">
                    {/* Video Thumbnail */}
                    <div className="sm:w-32 h-32 relative flex-shrink-0 bg-slate-900">
                      <img src={ex.img || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=200'} alt={ex.name} className={`w-full h-full object-cover transition-all ${ex.done ? 'opacity-50 grayscale' : 'opacity-80 hover:opacity-100 cursor-pointer'}`} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <PlayCircleOutlined className={`text-3xl ${ex.done ? 'text-white/50' : 'text-white'}`} />
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`font-extrabold text-sm block ${ex.done ? 'text-slate-500 line-through' : 'text-slate-808 dark:text-slate-200'}`}>{ex.name}</span>
                          {ex.done && <Tag color="success" className="m-0 border-none rounded-full px-2 py-0.5 text-[9px] font-bold"><CheckOutlined /> DONE</Tag>}
                        </div>
                        <span className="text-[11px] text-[#8C4BFF] font-black uppercase tracking-wide block mt-1">{ex.reps}</span>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 mb-0">{ex.note}</p>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button
                          type={ex.done ? 'default' : 'primary'}
                          onClick={() => handleToggleExercise(ex)}
                          style={ex.done ? { backgroundColor: 'transparent', color: '#64748B', border: '1px solid #CBD5E1' } : { backgroundColor: '#8C4BFF', border: 'none' }}
                          className="rounded-xl font-bold text-xs h-8 px-5 shadow-sm"
                        >
                          {ex.done ? 'Undo' : 'Mark Completed'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-6 mt-[32px]">
          {/* Adherence Progress Widget */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm text-center bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase">Adherence Progress</span>}>
            <div className="py-4 flex flex-col items-center justify-center">
              <Progress
                type="dashboard"
                percent={compliancePercent}
                strokeColor={{
                  '0%': '#30D2BE',
                  '100%': '#8C4BFF',
                }}
                strokeWidth={10}
                gapDegree={60}
                size={140}
              />
              <span className="text-slate-500 text-xs font-semibold block mt-4">
                {compliancePercent === 100 ? "Amazing! You've finished all exercises." : "Keep pushing! You're almost there."}
              </span>
            </div>
          </Card>

          {/* Reminders Widget */}
          <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900" title={<span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase">Daily Reminders</span>}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellOutlined className="text-[#8C4BFF] text-lg" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Push Notifications</span>
                    <span className="block text-[10px] text-slate-400">Receive app alerts at 8:00 AM</span>
                  </div>
                </div>
                <Switch defaultChecked onChange={(c) => toast.success(`Push notifications ${c ? 'enabled' : 'disabled'}`)} />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="flex items-center gap-2">
                  <MobileOutlined className="text-[#30D2BE] text-lg" />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">SMS Reminders</span>
                    <span className="block text-[10px] text-slate-400">Receive texts at 9:00 AM</span>
                  </div>
                </div>
                <Switch onChange={(c) => toast.success(`SMS reminders ${c ? 'enabled' : 'disabled'}`)} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
