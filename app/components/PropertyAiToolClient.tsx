'use client'

import { useMemo, useState } from 'react'

type PropertyAiToolClientProps = {
  title: string
  description: string
  endpoint: string
  defaultPrompt: string
  outputTitle: string
  notePlaceholder?: string
  bullets?: string[]
}

function extractGeneratedText(data: any): string {
  const candidates = [
    data?.generatedText,
    data?.text,
    data?.content,
    data?.result,
    data?.summary,
    data?.output,
    data?.body,
    data?.message,
    data?.data?.text,
    data?.data?.content,
    data?.data?.result,
  ]

  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim()
    }
  }

  if (Array.isArray(data?.sections)) {
    const joined = data.sections
      .map((section: any) => {
        const sectionTitle =
          typeof section?.title === 'string' && section.title.trim()
            ? `【${section.title.trim()}】\n`
            : ''

        const sectionBody =
          typeof section?.content === 'string'
            ? section.content
            : typeof section?.text === 'string'
              ? section.text
              : typeof section?.body === 'string'
                ? section.body
                : ''

        return `${sectionTitle}${sectionBody}`.trim()
      })
      .filter(Boolean)
      .join('\n\n')

    if (joined.trim()) return joined.trim()
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  return JSON.stringify(data, null, 2)
}

async function readResponseBody(response: Response) {
  const raw = await response.text()

  if (!raw) return {}

  try {
    return JSON.parse(raw)
  } catch {
    return { text: raw }
  }
}

export default function PropertyAiToolClient({
  title,
  description,
  endpoint,
  defaultPrompt,
  outputTitle,
  notePlaceholder,
  bullets = [],
}: PropertyAiToolClientProps) {
  const [note, setNote] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const composedPrompt = useMemo(() => {
    const extra = note.trim()
    if (!extra) return defaultPrompt
    return `${defaultPrompt}\n\n追加条件:\n${extra}`
  }, [defaultPrompt, note])

  async function handleGenerate() {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: composedPrompt,
          input: composedPrompt,
          requestText: composedPrompt,
          instruction: note.trim(),
          extraInstruction: note.trim(),
          note: note.trim(),
        }),
      })

      const data = await readResponseBody(response)

      if (!response.ok) {
        const message =
          typeof data?.error === 'string'
            ? data.error
            : typeof data?.message === 'string'
              ? data.message
              : `HTTP ${response.status}`
        throw new Error(message)
      }

      const text = extractGeneratedText(data)
      setOutput(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopy() {
    if (!output.trim()) return
    await navigator.clipboard.writeText(output)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm leading-6 text-gray-600">{description}</p>
      </div>

      {bullets.length > 0 ? (
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">この出力で狙うこと</div>
          <ul className="space-y-2 text-sm text-gray-600">
            {bullets.map((item) => (
              <li key={item}>・{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          追加メモ
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={notePlaceholder ?? '役員向けに柔らかく、など追記があればここに書く'}
          rows={5}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? '生成中...' : 'AIで生成する'}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!output.trim()}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          コピーする
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {output ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">{outputTitle}</div>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={18}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-7 outline-none focus:border-gray-500"
          />
        </div>
      ) : null}

      <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">
          AIに渡す参照データを見る
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-gray-600">
          {defaultPrompt}
        </pre>
      </details>
    </div>
  )
}