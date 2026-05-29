'use client'

import { useMemo, useState } from 'react'

type GeneratedPack = {
  agendaizedSummary: string
  agendaTitle: string
  boardStatusNote: string
  scheduledMonthNote: string
  boardMemoDraft: string
  boardReportDraft: string
  proposalDraft: string
  aiAgendaDraft: string
  likelyQuestions: string[]
  expectedQuestions: string[]
}

type Props = {
  propertyId: string
  caseId: string
  propertyName: string
  caseTitle: string
}

type CopyState = 'idle' | 'done' | 'error'

const initialPack: GeneratedPack = {
  agendaizedSummary: '',
  agendaTitle: '',
  boardStatusNote: '',
  scheduledMonthNote: '',
  boardMemoDraft: '',
  boardReportDraft: '',
  proposalDraft: '',
  aiAgendaDraft: '',
  likelyQuestions: [],
  expectedQuestions: [],
}

export default function BoardPackCenterClient({
  propertyId,
  caseId,
  propertyName,
  caseTitle,
}: Props) {
  const [agendaTitleInput, setAgendaTitleInput] = useState('')
  const [boardStatus, setBoardStatus] = useState('上程前')
  const [scheduledMonth, setScheduledMonth] = useState('')
  const [meetingType, setMeetingType] = useState('理事会')
  const [tone, setTone] = useState('実務的')
  const [boardMemo, setBoardMemo] = useState('')
  const [focusPoints, setFocusPoints] = useState('')
  const [pack, setPack] = useState<GeneratedPack>(initialPack)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [copyState, setCopyState] = useState<Record<string, CopyState>>({})

  const sections = useMemo(
    () => [
      {
        key: 'agendaizedSummary',
        title: '1. 案件の議案化',
        description: '案件を理事会に出せる文章へ整理',
        content: pack.agendaizedSummary,
      },
      {
        key: 'agendaTitle',
        title: '2. 議案タイトル管理',
        description: 'そのまま使いやすい議案タイトル案',
        content: pack.agendaTitle,
      },
      {
        key: 'boardStatusNote',
        title: '3. 理事会ステータス管理',
        description: '今どの段階かを共有しやすい整理文',
        content: pack.boardStatusNote,
      },
      {
        key: 'scheduledMonthNote',
        title: '4. 上程予定月管理',
        description: 'いつ出すべきかのコメント整理',
        content: pack.scheduledMonthNote,
      },
      {
        key: 'boardMemoDraft',
        title: '5. 理事会メモ管理',
        description: '担当者用の理事会メモ下書き',
        content: pack.boardMemoDraft,
      },
      {
        key: 'boardReportDraft',
        title: '6. 理事会報告ドラフト生成',
        description: '理事会での説明文ドラフト',
        content: pack.boardReportDraft,
      },
      {
        key: 'proposalDraft',
        title: '7. 議案書作成機能',
        description: '上程文として使いやすい議案書下書き',
        content: pack.proposalDraft,
      },
      {
        key: 'aiAgendaDraft',
        title: '8. AI議案生成',
        description: '議案本文のAIドラフト',
        content: pack.aiAgendaDraft,
      },
      {
        key: 'likelyQuestions',
        title: '9. 理事会で聞かれそうな質問表示',
        description: '役員から来そうな質問',
        content: pack.likelyQuestions.map((item, index) => `${index + 1}. ${item}`).join('\n'),
      },
      {
        key: 'expectedQuestions',
        title: '10. 想定質問生成',
        description: '事前準備しておくべき質問集',
        content: pack.expectedQuestions.map((item, index) => `${index + 1}. ${item}`).join('\n'),
      },
    ],
    [pack]
  )

  async function copyText(key: string, text: string) {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopyState((prev) => ({ ...prev, [key]: 'done' }))
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [key]: 'idle' }))
      }, 1600)
    } catch {
      setCopyState((prev) => ({ ...prev, [key]: 'error' }))
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [key]: 'idle' }))
      }, 1600)
    }
  }

  function buildAllInOneText() {
    return [
      `【物件名】${propertyName}`,
      `【案件名】${caseTitle}`,
      `【会議種別】${meetingType}`,
      `【理事会ステータス】${boardStatus}`,
      `【上程予定月】${scheduledMonth || '未設定'}`,
      '',
      ...sections.map((section) => {
        return [`【${section.title}】`, section.content || '未生成', ''].join('\n')
      }),
    ].join('\n')
  }

  async function handleGenerate() {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/cases/${caseId}/board-pack`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agendaTitleInput,
            boardStatus,
            scheduledMonth,
            meetingType,
            tone,
            boardMemo,
            focusPoints,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data?.error || '生成に失敗しました。')
        return
      }

      setPack({
        agendaizedSummary: data.agendaizedSummary || '',
        agendaTitle: data.agendaTitle || '',
        boardStatusNote: data.boardStatusNote || '',
        scheduledMonthNote: data.scheduledMonthNote || '',
        boardMemoDraft: data.boardMemoDraft || '',
        boardReportDraft: data.boardReportDraft || '',
        proposalDraft: data.proposalDraft || '',
        aiAgendaDraft: data.aiAgendaDraft || '',
        likelyQuestions: Array.isArray(data.likelyQuestions) ? data.likelyQuestions : [],
        expectedQuestions: Array.isArray(data.expectedQuestions) ? data.expectedQuestions : [],
      })
    } catch {
      setErrorMessage('通信に失敗しました。開発サーバーとAPIキーを確認してください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">理事会パックセンター</h2>
          <p className="mt-1 text-sm text-gray-600">
            理事会に出す前の整理を、1画面で一気に作るページです。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">会議種別</span>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            >
              <option value="理事会">理事会</option>
              <option value="総会">総会</option>
              <option value="打合せ">打合せ</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">文体の雰囲気</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            >
              <option value="実務的">実務的</option>
              <option value="やや丁寧">やや丁寧</option>
              <option value="管理会社向け定型">管理会社向け定型</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">議案タイトル（任意）</span>
            <input
              value={agendaTitleInput}
              onChange={(e) => setAgendaTitleInput(e.target.value)}
              placeholder="例：外壁補修工事実施の件"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">理事会ステータス</span>
            <select
              value={boardStatus}
              onChange={(e) => setBoardStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            >
              <option value="上程前">上程前</option>
              <option value="整理中">整理中</option>
              <option value="理事会提出候補">理事会提出候補</option>
              <option value="説明待ち">説明待ち</option>
              <option value="承認待ち">承認待ち</option>
              <option value="保留">保留</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">上程予定月</span>
            <input
              value={scheduledMonth}
              onChange={(e) => setScheduledMonth(e.target.value)}
              placeholder="例：2026年5月"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">重視したい論点（任意）</span>
            <input
              value={focusPoints}
              onChange={(e) => setFocusPoints(e.target.value)}
              placeholder="例：費用感、緊急性、居住者影響"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">理事会メモ・補足（任意）</span>
          <textarea
            value={boardMemo}
            onChange={(e) => setBoardMemo(e.target.value)}
            rows={6}
            placeholder="例：理事長はコストに厳しい、まず緊急性から説明したい、前回の質疑で工期について懸念が出た など"
            className="w-full rounded-2xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-500"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '生成中...' : '理事会パックを生成する'}
          </button>

          <button
            type="button"
            onClick={() => copyText('all', buildAllInOneText())}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            全部まとめてコピー
          </button>

          <a
            href={`/properties/${propertyId}/cases/${caseId}/ai-board-minutes-pro`}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            AI議事録 本格版へ
          </a>
        </div>

        {copyState.all === 'done' && (
          <p className="mt-3 text-sm text-green-700">全部まとめてコピーしました。</p>
        )}
        {copyState.all === 'error' && (
          <p className="mt-3 text-sm text-red-600">コピーに失敗しました。</p>
        )}
        {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => {
          const state = copyState[section.key] || 'idle'

          return (
            <section
              key={section.key}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{section.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{section.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => copyText(section.key, section.content)}
                  disabled={!section.content}
                  className="shrink-0 rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state === 'done' ? 'コピー済み' : state === 'error' ? '失敗' : 'コピー'}
                </button>
              </div>

              <pre className="whitespace-pre-wrap break-words rounded-2xl bg-gray-50 p-4 text-sm leading-7 text-gray-800">
                {section.content || 'まだ生成していません。'}
              </pre>
            </section>
          )
        })}
      </div>
    </div>
  )
}