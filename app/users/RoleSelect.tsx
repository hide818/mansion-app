'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AppRole = 'admin' | 'general' | 'viewer'

export default function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string
  currentRole: AppRole
  disabled: boolean
}) {
  const router = useRouter()
  const [role, setRole] = useState<AppRole>(currentRole)
  const [loading, setLoading] = useState(false)

  async function handleChange(nextRole: AppRole) {
    try {
      setRole(nextRole)
      setLoading(true)

      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: nextRole }),
      })

      if (!response.ok) {
        const text = await response.text()
        alert(text || '権限変更に失敗しました。')
        setRole(currentRole)
        return
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('権限変更中にエラーが発生しました。')
      setRole(currentRole)
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={role}
      disabled={disabled || loading}
      onChange={(event) => handleChange(event.target.value as AppRole)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
    >
      <option value="admin">管理者</option>
      <option value="general">一般</option>
      <option value="viewer">閲覧のみ</option>
    </select>
  )
}