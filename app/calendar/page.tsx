'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CalEvent = {
  date: string
  label: string
  type: 'task' | 'inspection' | 'repair'
  urgent?: boolean
  href: string
}

const TYPE_COLOR: Record<string, string> = {
  task: 'bg-blue-500',
  inspection: 'bg-orange-500',
  repair: 'bg-purple-500',
}

const TYPE_BADGE: Record<string, string> = {
  task: 'bg-blue-50 text-blue-700',
  inspection: 'bg-orange-50 text-orange-700',
  repair: 'bg-purple-50 text-purple-700',
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function CalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [taskRes, insRes, repRes] = await Promise.all([
        fetch('/api/tasks?limit=200'),
        fetch('/api/inspections'),
        fetch('/api/repairs'),
      ])
      const evts: CalEvent[] = []

      if (taskRes.ok) {
        const tasks = await taskRes.json()
        for (const t of tasks) {
          if (t.due_date) evts.push({ date: t.due_date, label: t.title ?? '無題タスク', type: 'task', urgent: t.status !== 'done', href: '/tasks' })
        }
      }
      if (insRes.ok) {
        const ins = await insRes.json()
        for (const i of ins) {
          if (i.next_due_date && i.status !== 'completed') {
            const days = Math.ceil((new Date(i.next_due_date).getTime() - today.getTime()) / 86400000)
            evts.push({ date: i.next_due_date, label: i.inspection_name, type: 'inspection', urgent: days <= 30, href: '/inspections' })
          }
        }
      }
      if (repRes.ok) {
        const reps = await repRes.json()
        for (const r of reps) {
          if (r.start_date) evts.push({ date: r.start_date, label: r.title, type: 'repair', href: '/repairs' })
        }
      }
      setEvents(evts)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  // カレンダー構築
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(d: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function eventsOn(d: number) {
    return events.filter(e => e.date === dateStr(d))
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const selectedEvents = selectedDay ? events.filter(e => e.date === selectedDay) : []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">カレンダー</h1>
        <p className="text-sm text-slate-500">タスク・法定点検・修繕の期限を一画面で確認</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">📋 タスク → 「案件・タスク」から登録</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">🔍 法定点検 → 「法定点検」から登録</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">🔧 修繕 → 「修繕履歴」から登録</span>
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 px-4 py-3 sm:px-6">
        {[['task', 'タスク'], ['inspection', '法定点検'], ['repair', '修繕']].map(([t, l]) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${TYPE_COLOR[t]}`} />
            <span className="text-xs text-slate-500">{l}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-6 sm:px-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-slate-200 bg-white px-4 py-3">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-slate-100">
            <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <p className="font-bold text-slate-800">{viewYear}年 {MONTHS[viewMonth]}</p>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-slate-100">
            <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* 曜日 */}
        <div className="grid grid-cols-7 border border-b-0 border-slate-200 bg-slate-50">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{w}</div>
          ))}
        </div>

        {/* グリッド */}
        <div className="grid grid-cols-7 rounded-b-xl border border-slate-200 bg-white overflow-hidden">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className="min-h-[72px] border-b border-r border-slate-100 bg-slate-50/50 last:border-r-0" />
            const ds = dateStr(day)
            const dayEvts = eventsOn(day)
            const isToday = ds === todayStr
            const isSelected = ds === selectedDay
            const dow = (firstDay + day - 1) % 7
            return (
              <div key={idx} onClick={() => setSelectedDay(isSelected ? null : ds)}
                className={`min-h-[72px] cursor-pointer border-b border-r border-slate-100 p-1 transition last:border-r-0 ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-blue-600 text-white' : dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-slate-700'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvts.slice(0, 2).map((e, i) => (
                    <div key={i} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${e.urgent ? 'bg-red-50 text-red-700' : `${TYPE_BADGE[e.type]}`}`}>
                      {e.label}
                    </div>
                  ))}
                  {dayEvts.length > 2 && <div className="text-[10px] text-slate-400 pl-1">+{dayEvts.length - 2}件</div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* 選択日の詳細 */}
        {selectedDay && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4">
            <p className="mb-3 font-semibold text-slate-800">{selectedDay.replace(/-/g, '/')}の予定</p>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-slate-400">予定なし</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e, i) => (
                  <Link key={i} href={e.href}
                    className={`flex items-center gap-3 rounded-lg p-2.5 ${e.urgent ? 'bg-red-50' : TYPE_BADGE[e.type]} hover:opacity-80`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_COLOR[e.type]}`} />
                    <span className="flex-1 text-sm font-medium">{e.label}</span>
                    <span className="text-xs opacity-60">→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
