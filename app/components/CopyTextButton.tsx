'use client'

import { useState } from 'react'

type CopyTextButtonProps = {
  text: string
  label?: string
}

export default function CopyTextButton({
  text,
  label = 'コピー',
}: CopyTextButtonProps) {
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
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {copied ? 'コピーしました' : label}
    </button>
  )
}