'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Property = { id: string; name: string | null }

type Props = {
  properties: Property[]
  selectedPropertyId: string
}

export default function PropertySelector({ properties, selectedPropertyId }: Props) {
  const router = useRouter()
  const selectRef = useRef<HTMLSelectElement>(null)
  const [loading, setLoading] = useState(false)

  function handleReload() {
    const id = selectRef.current?.value ?? ''
    if (!id) return
    setLoading(true)
    router.push(`/handover-documents/new?propertyId=${encodeURIComponent(id)}`)
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          物件を選択
        </label>
        <select
          ref={selectRef}
          defaultValue={selectedPropertyId}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
        >
          <option value="">選択してください</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || '無題物件'}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleReload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            読み込み中...
          </>
        ) : (
          'この物件で再読込'
        )}
      </button>
    </div>
  )
}
