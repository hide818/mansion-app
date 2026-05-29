'use client'

import { useMemo, useState } from 'react'
import type { AiSection, AiResponseBody } from '@/lib/utils'

type PackTool = {
  key: string
  title: string
  endpoint: string
  prompt: string
}

type PropertyAiPackClientProps = {
  title: string
  description: string
  tools: PackTool[]
  notePlaceholder?: string
  referenceText: string
}

function extractGeneratedText(data: AiResponseBody): string {
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
      .map((section: AiSection) => {
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

async function readResponseBody(response: Response): Promise<AiResponseBody> {
  const raw = await response.text()

  if (!raw) return {}

  try {
    return JSON.parse(raw) as AiResponseBody
  } catch {
    return { text: raw }
  }
}

export default function PropertyAiPackClient({
  title,
  description,
  tools,
  notePlaceholder,
  referenceText,
}: PropertyAiPackClientProps) {
  const [note, setNote] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')

  const combinedText = useMemo(() => {
    return tools
      .map((tool) => {
        const value = results[tool.key]
        if (!value?.trim()) return ''
        return `【${tool.title}】\n${value.trim()}`
      })
      .filter(Boolean)
      .join('\n\n')
  }, [results, tools])

  async function handleGenerateAll() {
    setIsLoading(true)
    setError('')

    try {
      const nextResults: Record<string, string> = {}

      for (const tool of tools) {
        setLoadingLabel(tool.title)

        const composedPrompt = note.trim()
          ? `${tool.prompt}\n\n追加条件:\n${note.trim()}`
          : tool.prompt

        const response = await fetch(tool.endpoint, {
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
          throw new Error(`${tool.title}: ${message}`)
        }

        nextResults[tool.key] = extractGeneratedText(data)
        setResults((current) => ({
          ...current,
          [tool.key]: nextResults[tool.key],
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パック生成に失敗しました。')
    } finally {
      setIsLoading(false)
      setLoadingLabel('')
    }
  }

  async function handleCopyAll() {
    if (!combinedText.trim()) return
    await navigator.clipboard.writeText(combinedText)
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm leading-6 text-gray-600">{description}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          追加メモ
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={notePlaceholder ?? '例：役員向けにやわらかく、上司提出向けに短めで、など'}
          rows={5}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleGenerateAll}
          disabled={isLoading}
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading
            ? `生成中...${loadingLabel ? `（${loadingLabel}）` : ''}`
            : 'パックを一気に生成する'}
        </button>

        <button
          type="button"
          onClick={handleCopyAll}
          disabled={!combinedText.trim()}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          全文をコピーする
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {tools.map((tool) => (
          <div
            key={tool.key}
            className="rounded-xl border border-gray-200 p-4"
          >
            <div className="mb-2 text-sm font-semibold text-gray-700">
              {tool.title}
            </div>

            <textarea
              value={results[tool.key] ?? ''}
              onChange={(e) =>
                setResults((current) => ({
                  ...current,
                  [tool.key]: e.target.value,
                }))
              }
              rows={10}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-7 outline-none focus:border-gray-500"
            />
          </div>
        ))}
      </div>

      {combinedText ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">パック結合版</div>
          <textarea
            value={combinedText}
            readOnly
            rows={20}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-7 outline-none"
          />
        </div>
      ) : null}

      <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">
          AIに渡す共通参照データを見る
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-gray-600">
          {referenceText}
        </pre>
      </details>
    </div>
  )
}
