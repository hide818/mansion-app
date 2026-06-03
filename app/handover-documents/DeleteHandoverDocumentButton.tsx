'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { dangerButtonClass } from '@/app/components/ui/buttonStyles'

type DeleteHandoverDocumentButtonProps = {
  documentId: string
}

export default function DeleteHandoverDocumentButton({
  documentId,
}: DeleteHandoverDocumentButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    const ok = window.confirm('この保存済み引き継ぎ書を削除します。よろしいですか？')

    if (!ok) return

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/handover-documents/${documentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || '削除に失敗しました。')
        return
      }

      router.refresh()
    } catch {
      alert('通信エラーが発生しました。時間をおいて再度お試しください。')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className={dangerButtonClass}
    >
      {isDeleting ? '削除中...' : '削除する'}
    </button>
  )
}