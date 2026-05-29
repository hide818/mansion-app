  'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewTaskPage() {

  const params = useParams()
  const router = useRouter()

  const propertyId = params.id as string
  const caseId = params.caseId as string

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('未着手')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {

    setLoading(true)

    const { error } = await supabase
      .from('tasks')
      .insert({
        title: title,
        status: status,
        case_id: caseId,
        property_id: propertyId
      })

    if (error) {
      alert('タスク作成エラー')
      console.error(error)
      setLoading(false)
      return
    }

    router.push(`/properties/${propertyId}/cases/${caseId}`)
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        タスク作成
      </h1>

      <div className="space-y-4">

        <div>
          <div className="mb-1">タスク名</div>
          <input
            className="border p-2 w-full"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1">ステータス</div>
          <select
            className="border p-2 w-full"
            value={status}
            onChange={(e)=>setStatus(e.target.value)}
          >
            <option value="未着手">未着手</option>
            <option value="進行中">進行中</option>
            <option value="完了">完了</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? '作成中...' : '作成'}
        </button>

      </div>

    </div>
  )
}