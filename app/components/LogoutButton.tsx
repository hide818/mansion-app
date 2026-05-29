'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        const text = await response.text()
        alert(text || 'ログアウトに失敗しました。')
        return
      }

      router.replace('/login')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('ログアウト中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'ログアウト中...' : 'ログアウト'}
    </button>
  )
}