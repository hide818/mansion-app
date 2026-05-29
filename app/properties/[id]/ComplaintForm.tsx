'use client'

import { useState, useTransition } from 'react'

type Props = {
  propertyId: string
}

export default function ComplaintForm({ propertyId }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('騒音')
  const [location, setLocation] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [detail, setDetail] = useState('')
  const [status, setStatus] = useState('受付')
  const [isRepeat, setIsRepeat] = useState(false)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/complaints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            category,
            location,
            reporter_name: reporterName,
            detail,
            status,
            is_repeat: isRepeat,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setMessage(data.error ?? 'クレーム登録に失敗しました。')
          return
        }

        setTitle('')
        setCategory('騒音')
        setLocation('')
        setReporterName('')
        setDetail('')
        setStatus('受付')
        setIsRepeat(false)
        setMessage('クレームを登録しました。')

        window.location.reload()
      } catch {
        setMessage('通信エラーが発生しました。もう一度試してください。')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            件名
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：上階の足音について"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            種別
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="騒音">騒音</option>
            <option value="駐車">駐車</option>
            <option value="ゴミ">ゴミ</option>
            <option value="ペット">ペット</option>
            <option value="設備">設備</option>
            <option value="住民対応">住民対応</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            発生場所
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例：303号室付近、駐車場No.5"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            申出者
          </label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="例：302号室居住者"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            対応状況
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="受付">受付</option>
            <option value="確認中">確認中</option>
            <option value="対応中">対応中</option>
            <option value="解決">解決</option>
            <option value="経過観察">経過観察</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <input
              type="checkbox"
              checked={isRepeat}
              onChange={(e) => setIsRepeat(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">再発案件</span>
          </label>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          詳細
        </label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="申出内容、聞き取り内容、初動対応などを書く"
          className="min-h-[140px] w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? '登録中...' : 'クレームを登録'}
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