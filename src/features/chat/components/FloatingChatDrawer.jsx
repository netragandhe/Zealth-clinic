import React, { useState, useEffect, useRef } from 'react'
import { Drawer, Tooltip } from 'antd'
import { MessageFilled } from '@ant-design/icons'
import UniversalLiveChat from './UniversalLiveChat'

export default function FloatingChatDrawer() {
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('zealth_chat_widget_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('zealth_chat_widget_pos')
      return saved ? JSON.parse(saved) : { x: 0, y: 0 }
    } catch {
      return { x: 0, y: 0 }
    }
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  const dragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, moved: false })

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
      moved: false,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragStartRef.current.startX
      const deltaY = e.clientY - dragStartRef.current.startY

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        dragStartRef.current.moved = true
      }

      const newPos = {
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      }
      setPosition(newPos)
      try {
        localStorage.setItem('zealth_chat_widget_pos', JSON.stringify(newPos))
      } catch {}
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const toggleCollapsed = (e) => {
    e.stopPropagation()
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('zealth_chat_widget_collapsed', String(next))
    } catch {}
  }

  const handleClick = () => {
    if (!dragStartRef.current.moved) {
      setOpen(true)
    }
  }

  return (
    <>
      <style>{`
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .animate-subtle-float {
          animation: subtleFloat 2.8s ease-in-out infinite;
        }
      `}</style>

      {/* Floating & Draggable launcher widget positioned safely above bottom actions */}
      <div
        ref={dragRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: 'none',
        }}
        className="fixed bottom-32 right-6 md:bottom-24 z-40 select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        {isCollapsed ? (
          /* Minimized Compact Pill Bar */
          <div className="flex items-center gap-1.5 bg-slate-900/90 dark:bg-slate-800/90 text-white rounded-full pl-3 pr-2 py-1.5 shadow-xl border border-white/20 backdrop-blur-md hover:scale-105 transition-all">
            <button
              type="button"
              onClick={handleClick}
              className="text-xs font-bold flex items-center gap-1.5 border-none bg-transparent text-white cursor-pointer p-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Chat</span>
            </button>
            <Tooltip title="Expand Widget">
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-[10px] border-none cursor-pointer ml-1"
              >
                +
              </button>
            </Tooltip>
          </div>
        ) : (
          /* Full Floating Circular Launcher Button */
          <div className="relative group">
            <Tooltip title="Open Live Chat (Drag to move, click '-' to minimize)" placement="left">
              <button
                type="button"
                onClick={handleClick}
                className={`w-13 h-13 rounded-full bg-gradient-to-tr from-[#8C4BFF] via-[#702BE0] to-[#30D2BE] text-white shadow-2xl hover:shadow-[0_12px_28px_rgba(140,75,255,0.6)] hover:scale-105 active:scale-95 transition-shadow duration-300 flex items-center justify-center text-xl border-2 border-white/30 group relative ${
                  isDragging ? '' : 'animate-subtle-float'
                }`}
              >
                <MessageFilled className="group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </button>
            </Tooltip>
            {/* Collapse button badge */}
            <Tooltip title="Minimize widget" placement="top">
              <button
                type="button"
                onClick={toggleCollapsed}
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center border border-white/40 shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer z-10"
              >
                —
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Slide-in Live Chat Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-sm text-slate-800 dark:text-white">ZealthOS Live Chat Widget</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8C4BFF]/10 text-[#8C4BFF] font-bold">
              Real-time Active
            </span>
          </div>
        }
        placement="right"
        size={780}
        onClose={() => setOpen(false)}
        open={open}
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
        className="dark:bg-slate-900"
      >
        {open && <UniversalLiveChat isDrawer={true} />}
      </Drawer>
    </>
  )
}

