'use client'

import { useState } from 'react'

type GeneratedSectionCardProps = {
  title: string
  text: string
}

export default function GeneratedSectionCard({
  title,
  text,
}: GeneratedSectionCardProps) {
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
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>

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
        className="min-h-[220px] w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm leading-7 text-gray-800"
      />
    </section>
  )
}