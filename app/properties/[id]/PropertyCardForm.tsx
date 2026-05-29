'use client'

import { useState, useTransition } from 'react'

type PropertyCard = {
  property_id: string
  management_memo: string | null
  board_memo: string | null
  caution_notes: string | null
  officer_memo: string | null
  pinned_note: string | null
  updated_at: string | null
}

type Props = {
  propertyId: string
  initialCard: PropertyCard | null
}

export default function PropertyCardForm({ propertyId, initialCard }: Props) {
  const [managementMemo, setManagementMemo] = useState(initialCard?.management_memo ?? '')
  const [boardMemo, setBoardMemo] = useState(initialCard?.board_memo ?? '')
  const [cautionNotes, setCautionNotes] = useState(initialCard?.caution_notes ?? '')
  const [officerMemo, setOfficerMemo] = useState(initialCard?.officer_memo ?? '')
  const [pinnedNote, setPinnedNote] = useState(initialCard?.pinned_note ?? '')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/card`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            management_memo: managementMemo,
            board_memo: boardMemo,
            caution_notes: cautionNotes,
            officer_memo: officerMemo,
            pinned_note: pinnedNote,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setMessage(data.error ?? '保存に失敗しました。')
          return
        }

        setMessage('物件カルテを保存しました。')
      } catch {
        setMessage('通信エラーが発生しました。もう一度試してください。')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">重要情報ピン留め</h2>
        <textarea
          value={pinnedNote}
          onChange={(e) => setPinnedNote(e.target.value)}
          placeholder="最重要事項をここに記入します。例：理事長とのやり取り注意、長期修繕委員会が厳しい、騒音クレーム継続中 など"
          className="min-h-[120px] w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">管理メモ</h2>
        <textarea
          value={managementMemo}
          onChange={(e) => setManagementMemo(e.target.value)}
          placeholder="管理上の基本情報、注意点、普段の対応で気をつけることを書く"
          className="min-h-[160px] w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">理事会メモ</h2>
        <textarea
          value={boardMemo}
          onChange={(e) => setBoardMemo(e.target.value)}
          placeholder="理事会・総会でよく出る論点、過去の流れ、今後の上程候補などを書く"
          className="min-h-[160px] w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">注意事項</h2>
        <textarea
          value={cautionNotes}
          onChange={(e) => setCautionNotes(e.target.value)}
          placeholder="トラブル、住民対応、特殊ルール、対応時の注意点などを書く"
          className="min-h-[160px] w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">理事長・役員対応メモ</h2>
        <textarea
          value={officerMemo}
          onChange={(e) => setOfficerMemo(e.target.value)}
          placeholder="理事長や役員の傾向、連絡時の注意点、好む進め方などを書く"
          className="min-h-[160px] w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '保存中...' : '物件カルテを保存'}
        </button>

        {message && (
          <p className="text-sm font-medium text-gray-700">
            {message}
          </p>
        )}
      </div>
    </form>
  )
}