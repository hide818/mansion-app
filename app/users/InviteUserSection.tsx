'use client'

import { useState } from 'react'

type AppRole = 'admin' | 'general' | 'viewer'

export default function InviteUserSection() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AppRole>('general')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

  async function handleCreateInvite() {
    try {
      setLoading(true)
      setInviteUrl('')

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        alert(text || '招待リンクの発行に失敗しました。')
        return
      }

      const data = await response.json()
      const token = data?.invitation?.token

      if (!token) {
        alert('招待リンクの生成結果を取得できませんでした。')
        return
      }

      const url = `${window.location.origin}/login?invite=${token}`
      setInviteUrl(url)
    } catch (error) {
      console.error(error)
      alert('招待リンク発行中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      alert('招待リンクをコピーしました。')
    } catch (error) {
      console.error(error)
      alert('コピーに失敗しました。')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">ユーザー招待</h2>
        <p className="mt-1 text-sm text-gray-600">
          招待リンクを発行して、同じ会社のメンバー追加に使います。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            招待先メールアドレス（任意）
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@company.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            付与する権限
          </label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AppRole)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
          >
            <option value="admin">管理者</option>
            <option value="general">一般</option>
            <option value="viewer">閲覧のみ</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleCreateInvite}
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '発行中...' : '招待リンクを発行'}
        </button>
      </div>

      {inviteUrl ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="text-sm font-medium text-blue-900">発行された招待リンク</div>
          <div className="mt-2 break-all text-sm text-blue-800">{inviteUrl}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 hover:bg-blue-100"
          >
            リンクをコピー
          </button>
        </div>
      ) : null}
    </div>
  )
}