'use client'

import { useRef, useState } from 'react'

type QaEntry = {
  question: string
  answer: string
}

type MemoryResponse = {
  answer?: string
  error?: string
}

const QUICK_QUESTIONS = [
  'この物件で今すぐ注意すべきことは？',
  '未完了・期限切れの対応は？',
  '次回理事会で確認すべきことは？',
  '引き継ぎで必ず伝えるべきことは？',
  '最近のトラブル・クレームは？',
  '30日以上止まっている案件は？',
  'この物件のクセや注意点は？',
  '過去に揉めた・長引いた案件は？',
] as const

function normalizeLine(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
}

function renderAnswer(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trimStart()

    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const content = normalizeLine(trimmed.replace(/^#+\s+/, ''))
      return (
        <h4 key={i} className="mt-4 text-sm font-bold text-slate-800 first:mt-0">
          {content}
        </h4>
      )
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const content = normalizeLine(trimmed.slice(2))
      return (
        <p key={i} className="mt-1 text-sm leading-6 text-slate-700">
          ・{content}
        </p>
      )
    }

    if (trimmed === '' || trimmed === '---') {
      return <div key={i} className="my-1" />
    }

    return (
      <p key={i} className="mt-1 text-sm leading-6 text-slate-700">
        {normalizeLine(trimmed)}
      </p>
    )
  })
}

export default function PropertyMemoryAiClient({
  propertyId,
}: {
  propertyId: string
}) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<QaEntry[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed) {
      setError('質問を入力してください。')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/properties/${propertyId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ question: trimmed }),
      })

      const data = (await res.json()) as MemoryResponse

      if (!res.ok || data.error) {
        setError(data.error ?? '回答の取得に失敗しました。')
        return
      }

      if (data.answer) {
        setHistory((prev) => [{ question: trimmed, answer: data.answer! }, ...prev])
        setQuestion('')
      }
    } catch (err) {
      console.error(err)
      setError('通信エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickQuestion(q: string) {
    setQuestion(q)
    textareaRef.current?.focus()
    void submit(q)
  }

  async function handleCopy(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      window.setTimeout(() => setCopiedIndex(null), 1600)
    } catch {
      // コピー失敗は無視
    }
  }

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">物件メモリAI</h2>
        <p className="mt-1 text-sm text-slate-500">
          この物件の案件・タスク・クレーム・議事録・対応履歴をもとに、前任者に聞くように質問できます。
        </p>
      </div>

      {/* クイック質問ボタン */}
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">クイック質問</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleQuickQuestion(q)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 質問入力欄 */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              void submit(question)
            }
          }}
          placeholder="例：外壁工事の経緯は？　Ctrl+Enter で送信"
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-3">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {!error && <span />}

          <button
            type="button"
            onClick={() => void submit(question)}
            disabled={loading || !question.trim()}
            className="inline-flex min-w-[96px] items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold !text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '回答生成中...' : '質問する'}
          </button>
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-sm text-emerald-700">
            物件の記録を確認しています...
          </p>
        </div>
      )}

      {/* 回答履歴（最新が上） */}
      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* 質問 */}
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <p className="text-xs font-semibold text-slate-500">質問</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">
                  {entry.question}
                </p>
              </div>

              {/* 回答 */}
              <div className="px-5 py-4">
                <div className="text-sm text-slate-700">
                  {renderAnswer(entry.answer)}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleCopy(index, entry.answer)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    {copiedIndex === index ? 'コピーしました' : 'コピー'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
