'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  property_id: string | null
  created_at: string
}

type Props = {
  initialCases: CaseRow[]
}

export default function CasesBoard({ initialCases }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredCases = useMemo(() => {
    return initialCases.filter((item) => {
      const matchesSearch =
        (item.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.assignee ?? '').toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ? true : (item.status ?? '') === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [initialCases, search, statusFilter])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">全案件一覧</h1>
        <p className="text-gray-500 mt-2">
          全物件の案件を横断して確認できます
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="案件名・担当者で検索"
            className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="all">全ステータス</option>
            <option value="進行中">進行中</option>
            <option value="完了">完了</option>
            <option value="保留">保留</option>
          </select>

          <div className="flex items-center text-sm text-gray-500">
            表示件数：{filteredCases.length}件
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCases.length === 0 && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">条件に一致する案件はありません</p>
          </div>
        )}

        {filteredCases.map((item) => (
          <Link
            key={item.id}
            href={
              item.property_id
                ? `/properties/${item.property_id}/cases/${item.id}`
                : '#'
            }
            className="block bg-white border rounded-2xl p-6 shadow-sm hover:bg-gray-50"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {item.title ?? '案件名未設定'}
              </h2>

              <span className="rounded-full border px-3 py-1 text-sm text-gray-700">
                {item.status ?? '未設定'}
              </span>
            </div>

            <p className="text-gray-600 mt-3">
              担当者：{item.assignee ?? '未設定'}
            </p>

            <p className="text-sm text-gray-400 mt-3 break-all">
              案件ID：{item.id}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}