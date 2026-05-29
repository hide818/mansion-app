"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewLogPage() {

  const params = useParams()
  const router = useRouter()

  const caseId = params.caseId as string
  const propertyId = params.id as string

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message) return

    setLoading(true)

    const { error } = await supabase
      .from("logs")
      .insert({
        case_id: caseId,
        message: message
      })

    if (error) {
      alert("ログ保存エラー")
      console.error(error)
    }

    setLoading(false)

    router.push(`/properties/${propertyId}/cases/${caseId}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-xl">

      <h1 className="text-2xl font-bold mb-6">
        対応履歴追加
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="対応内容を書く"
          className="w-full border p-3 rounded"
          rows={5}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          保存
        </button>

      </form>

    </div>
  )
}