'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  propertyId: string
}

export default function RepairTaskLinksButton({ propertyId }: Props) {
  const router = useRouter()
  const [repairing, setRepairing] = useState(false)

  const handleRepair = async () => {
    const ok = window.confirm(
      'この物件に紐づく案件の task.property_id を補正します。実行しますか？'
    )

    if (!ok) return

    try {
      setRepairing(true)

      const response = await fetch('/api/tasks/repair-property-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '補正に失敗しました。')
        return
      }

      alert(`補正完了: ${data.updatedCount ?? 0} 件を更新しました。`)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('補正に失敗しました。')
    } finally {
      setRepairing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRepair}
      disabled={repairing}
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {repairing ? '補正中...' : 'タスク紐づけ補正'}
    </button>
  )
}