'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { secondaryButtonClass } from '@/app/components/ui/buttonStyles'

type RepairResponse = {
  success?: boolean
  message?: string
  updatedCount?: number
  repairedCount?: number
  count?: number
  error?: string
}

export default function RepairAllTaskLinksButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleRepair() {
    const ok = window.confirm(
      'case_id をもとに task の property_id を補正します。実行しますか？'
    )

    if (!ok) return

    try {
      setIsLoading(true)

      const response = await fetch('/api/tasks/repair-property-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const rawText = await response.text()

      let data: RepairResponse | null = null
      try {
        data = rawText ? (JSON.parse(rawText) as RepairResponse) : null
      } catch {
        data = null
      }

      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          `タスク紐づけ補正に失敗しました。status: ${response.status}`

        window.alert(message)
        return
      }

      const updatedCount =
        data?.updatedCount ?? data?.repairedCount ?? data?.count ?? 0

      const message =
        data?.message || `タスク紐づけ補正が完了しました。更新件数: ${updatedCount}件`

      window.alert(message)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'タスク紐づけ補正に失敗しました。'

      window.alert(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRepair}
      disabled={isLoading}
      className={secondaryButtonClass}
    >
      {isLoading ? '補正中...' : 'タスク紐づけ補正'}
    </button>
  )
}