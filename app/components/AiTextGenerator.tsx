'use client'

import { useState } from 'react'

type AiTextGeneratorProps = {
  title: string
  description: string
  apiPath: string
  placeholder?: string
}

export default function AiTextGenerator({
  title,
  description,
  apiPath,
  placeholder = 'ここにAIの生成結果が表示されます。',
}: AiTextGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function handleGenerate() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(apiPath, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || '生成に失敗しました。')
      }

      setResult(data.text || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーです。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result)
      alert('コピーしました。')
    } catch {
      alert('コピーに失敗しました。')
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'AI生成中...' : 'AIで生成する'}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!result}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60"
        >
          コピー
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <textarea
        value={result}
        onChange={(e) => setResult(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[520px] rounded-xl border p-4 text-sm leading-7 bg-gray-50"
      />
    </div>
  )
}