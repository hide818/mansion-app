'use client'

import { useState } from 'react'

type Props = {
  text: string
}

export default function CopyReportButton({ text }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error(error)
      alert('コピーに失敗しました。手動で選択してコピーしてください。')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      {copied ? 'コピーしました' : '日報をコピー'}
    </button>
  )
}