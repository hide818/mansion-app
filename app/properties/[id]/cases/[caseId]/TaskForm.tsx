'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type CaseRow = {
  property_id: string | null
  company_id: string | null
}

export default function TaskForm({
  caseId,
}: {
  caseId: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('中')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!title.trim()) {
      alert('タスク名を入力してください')
      return
    }

    if (!caseId) {
      alert('案件IDが取得できませんでした')
      return
    }

    setLoading(true)

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('property_id, company_id')
      .eq('id', caseId)
      .single<CaseRow>()

    if (caseError) {
      alert('案件情報の取得に失敗しました')
      console.error(caseError)
      setLoading(false)
      return
    }

    if (!caseData?.property_id) {
      alert('この案件に property_id が入っていません')
      setLoading(false)
      return
    }

    if (!caseData?.company_id) {
      alert('この案件に company_id が入っていません')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          case_id: caseId,
          property_id: caseData.property_id,
          company_id: caseData.company_id,
          status: '未完了',
          due_date: dueDate || null,
          priority,
        },
      ])

    if (error) {
      alert('タスク追加エラー')
      console.error(error)
      setLoading(false)
      return
    }

    setTitle('')
    setDueDate('')
    setPriority('中')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスク名"
        className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            期限
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border bg-white p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">
            優先度
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border bg-white p-2"
          >
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? '追加中...' : '追加'}
      </button>
    </div>
  )
}