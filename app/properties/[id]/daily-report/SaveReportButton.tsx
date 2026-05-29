'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  propertyId: string
  propertyName: string
  mode: 'short' | 'detail'
  reportText: string
}

function buildTitle(propertyName: string, mode: 'short' | 'detail') {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const modeLabel = mode === 'short' ? '短め版' : 'しっかり版'

  return `${y}/${m}/${d} ${propertyName} 物件日報 (${modeLabel})`
}

export default function SaveReportButton({
  propertyId,
  propertyName,
  mode,
  reportText,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          reportType: 'property_daily',
          reportMode: mode,
          title: buildTitle(propertyName, mode),
          body: reportText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '保存に失敗しました。')
        return
      }

      setSaved(true)
      router.refresh()

      setTimeout(() => {
        setSaved(false)
      }, 2000)
    } catch (error) {
      console.error(error)
      alert('保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="rounded-xl bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? '保存中...' : saved ? '保存しました' : '日報を保存'}
    </button>
  )
}