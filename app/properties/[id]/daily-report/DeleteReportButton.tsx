'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  reportId: string
}

export default function DeleteReportButton({ reportId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const ok = window.confirm('この保存済み日報を削除しますか？')
    if (!ok) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '削除に失敗しました。')
        return
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('削除に失敗しました。')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {deleting ? '削除中...' : '削除'}
    </button>
  )
}