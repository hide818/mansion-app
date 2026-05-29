'use client'

import { useState } from 'react'

type BoardReportCopyButtonProps = {
  text: string
}

export default function BoardReportCopyButton({
  text,
}: BoardReportCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      alert('コピーに失敗しました。もう一度お試しください。')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  )
}