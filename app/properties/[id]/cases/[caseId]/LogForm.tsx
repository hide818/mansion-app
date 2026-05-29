'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LogForm({
  caseId,
}: {
  caseId: string
}) {
  const router = useRouter()
  const [text, setText] = useState('')

  const handleAdd = async () => {
    if (!text.trim()) return

    const { error } = await supabase
      .from('logs')
      .insert([
        {
          case_id: caseId,
          message: text.trim(),
          type: 'manual',
        },
      ])

    if (error) {
      alert('ログ追加エラー')
      console.error(error)
      return
    }

    setText('')
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="作業内容やメモを入力"
        className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <button
        onClick={handleAdd}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        ログ追加
      </button>
    </div>
  )
}