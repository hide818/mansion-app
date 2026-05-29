'use client'

import { useMemo, useState } from 'react'

type AiPackTool = {
  key: string
  title: string
  endpoint: string
  basePrompt: string
}

type MultiAiPackClientProps = {
  title: string
  description: string
  tools: AiPackTool[]
  notePlaceholder?: string
  featureList: string[]
}

function pickTextFromResponse(data: any): string {
  const candidates = [
    data?.generatedText,
    data?.text,
    data?.content,
    data?.result,
    data?.summary,
    data?.output,
    data?.message,
    data?.data?.text,
    data?.data?.content,
    data?.data?.result,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
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

async function readResponse(response: Response) {
  const raw = await response.text()

  if (!raw) return {}

  try {
    return JSON.parse(raw)
  } catch {
    return { text: raw }
  }
}

export default function MultiAiPackClient({
  title,
  description,
  tools,
  notePlaceholder,
  featureList,
}: MultiAiPackClientProps) {
  const [note, setNote] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const [error, setError] = useState('')

  const mergedText = useMemo(() => {
    return tools
      .map((tool) => {
        const value = results[tool.key]
        if (!value?.trim()) return ''
        return `【${tool.title}】\n${value.trim()}`
      })
      .filter(Boolean)
      .join('\n\n')
  }, [results, tools])

  async function runSingleTool(tool: AiPackTool) {
    const composedPrompt = note.trim()
      ? `${tool.basePrompt}\n\n追加条件:\n${note.trim()}`
      : tool.basePrompt

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

    const data = await readResponse(response)

    if (!response.ok) {
      const message =
        typeof data?.error === 'string'
          ? data.error
          : typeof data?.message === 'string'
            ? data.message
            : `HTTP ${response.status}`

      throw new Error(`${tool.title}: ${message}`)
    }

    return pickTextFromResponse(data)
  }

  async function handleGenerateAll() {
    setIsLoading(true)
    setLoadingLabel('')
    setError('')

    try {
      const nextResults: Record<string, string> = {}

      for (const tool of tools) {
        setLoadingLabel(tool.title)
        const text = await runSingleTool(tool)
        nextResults[tool.key] = text

        setResults((current) => ({
          ...current,
          [tool.key]: text,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました。')
    } finally {
      setIsLoading(false)
      setLoadingLabel('')
    }
  }

  async function handleCopyAll() {
    if (!mergedText.trim()) return
    await navigator.clipboard.writeText(mergedText)
  }

  async function handleCopyOne(value: string) {
    if (!value.trim()) return
    await navigator.clipboard.writeText(value)
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm leading-6 text-gray-600">{description}</p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="mb-2 text-sm font-semibold text-gray-700">このパックで使うAI機能</div>
        <ul className="space-y-2 text-sm text-gray-600">
          {featureList.map((item) => (
            <li key={item}>・{item}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          追加メモ
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            notePlaceholder ??
            '例：役員向けにやわらかく、上司共有向けに短め、業者向けに実務的に、など'
          }
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
          disabled={!mergedText.trim()}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          全部コピーする
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {tools.map((tool) => {
          const value = results[tool.key] ?? ''

          return (
            <div
              key={tool.key}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-800">
                  {tool.title}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyOne(value)}
                  disabled={!value.trim()}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
                >
                  この部分をコピー
                </button>
              </div>

              <textarea
                value={value}
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
          )
        })}
      </div>

      {mergedText ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">結合版</div>
          <textarea
            value={mergedText}
            readOnly
            rows={22}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-7 outline-none"
          />
        </div>
      ) : null}
    </div>
  )
}