'use client'

import { useState } from 'react'
import CopyTextBlockButton from '@/app/components/CopyTextBlockButton'

type CaseAiToolClientProps = {
  endpoint: string
  title: string
  description: string
}

export default function CaseAiToolClient({
  endpoint,
  title,
  description,
}: CaseAiToolClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  async function handleGenerate() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(endpoint, {
        method: 'POST',
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json?.error || 'AI生成に失敗しました。')
      }

      setResult(String(json.text || ''))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'AI生成に失敗しました。'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '生成中...' : 'AIで生成する'}
          </button>

          <CopyTextBlockButton text={result} />
        </div>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-bold">生成結果</h3>
        <textarea
          value={result}
          readOnly
          placeholder="ここにAIの生成結果が表示されます。"
          className="min-h-[420px] w-full rounded-lg border p-4 text-sm leading-7"
        />
      </div>
    </div>
  )
}