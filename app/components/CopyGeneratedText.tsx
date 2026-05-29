'use client'

import { useState } from 'react'

type CopyGeneratedTextProps = {
  title: string
  text: string
}

export default function CopyGeneratedText({
  title,
  text,
}: CopyGeneratedTextProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      alert('コピーに失敗しました。')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {copied ? 'コピーしました' : 'コピーする'}
        </button>
      </div>

      <textarea
        readOnly
        value={text}
        className="min-h-[520px] w-full rounded-xl border border-gray-300 bg-white p-4 text-sm leading-7 text-gray-800"
      />
    </div>
  )
}