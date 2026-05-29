'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TaskForm({
  propertyId,
}: {
  propertyId: string
}) {
  const [title, setTitle] = useState('')
  const router = useRouter()

  const handleAdd = async () => {
    if (!title.trim()) {
      alert('タスク名を入力してください')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          property_id: propertyId,
          status: '未完了',
        },
      ])

    if (error) {
      alert('タスク追加エラー')
      console.error(error)
      return
    }

    setTitle('')
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスク名"
        className="border p-2 rounded w-full"
      />

      <button
        onClick={handleAdd}
        className="bg-blue-600 text-white px-4 rounded-lg"
      >
        タスク追加
      </button>
    </div>
  )
}