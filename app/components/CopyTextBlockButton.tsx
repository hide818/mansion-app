'use client'

import { useState } from 'react'

type CopyTextBlockButtonProps = {
  text: string
}

export default function CopyTextBlockButton({
  text,
}: CopyTextBlockButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1600)
    } catch {
      alert('コピーに失敗しました。ブラウザの権限を確認してください。')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      {copied ? 'コピーしました' : 'コピーする'}
    </button>
  )
}