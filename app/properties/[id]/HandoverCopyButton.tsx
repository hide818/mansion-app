'use client'

import { useState } from 'react'

type Props = {
  text: string
}

export default function HandoverCopyButton({ text }: Props) {
  const [message, setMessage] = useState('')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('引き継ぎサマリーをコピーしました。')

      setTimeout(() => {
        setMessage('')
      }, 2500)
    } catch {
      setMessage('コピーに失敗しました。手動でコピーしてください。')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
      >
        引き継ぎ文をコピー
      </button>

      {message && (
        <p className="text-sm font-medium text-gray-700">
          {message}
        </p>
      )}
    </div>
  )
}