'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type RecordRow = {
  id: string
  propertyId: string
  propertyName: string
  meetingType: string
  title: string
  officialTitle: string
  heldOn: string | null
  meetingNumber: string
  termLabel: string
  meetingTerm: string
  meetingRound: string
  meetingPlace: string
  attendeesText: string
  chairpersonName: string
  bylawsArticle: string
  signatureDate: string | null
  managementCompanyDisplay: string
  minutesLayoutType: string
  minutes: string
  createdAt: string | null
  versionType: 'original' | 'derived'
  sourceRecordId: string | null
}

type PropertyOption = {
  id: string
  name: string
}

type Props = {
  initialRecords: RecordRow[]
  properties: PropertyOption[]
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMeetingType(value: string) {
  if (value === 'general_meeting') return '総会'
  if (value === 'board_meeting') return '理事会'
  return value
}

function matchesDateFilter(value: string | null, fromDate: string, toDate: string) {
  if (!fromDate && !toDate) return true
  if (!value) return false

  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return false

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`)
    if (target < from) return false
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59`)
    if (target > to) return false
  }

  return true
}

export default function AiMinutesRecordsListClient({
  initialRecords,
  properties,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPropertyFilter = searchParams.get('propertyId') ?? ''

  const [propertyFilter, setPropertyFilter] = useState(initialPropertyFilter)
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('')
  const [titleKeyword, setTitleKeyword] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [records, setRecords] = useState<RecordRow[]>(initialRecords)
  const [deletingId, setDeletingId] = useState('')
  const [message, setMessage] = useState('')

  const filteredRecords = useMemo(() => {
    const keyword = titleKeyword.trim().toLowerCase()

    const next = records.filter((record) => {
      const matchesProperty = propertyFilter
        ? record.propertyId === propertyFilter
        : true

      const matchesMeetingType = meetingTypeFilter
        ? record.meetingType === meetingTypeFilter
        : true

      const targetTitle = `${record.title} ${record.officialTitle}`.toLowerCase()
      const matchesTitle = keyword ? targetTitle.includes(keyword) : true
      const matchesDate = matchesDateFilter(record.createdAt, createdFrom, createdTo)

      return matchesProperty && matchesMeetingType && matchesTitle && matchesDate
    })

    next.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime
    })

    return next
  }, [
    records,
    propertyFilter,
    meetingTypeFilter,
    titleKeyword,
    createdFrom,
    createdTo,
    sortOrder,
  ])

  async function handleDelete(recordId: string) {
    const target = records.find((record) => record.id === recordId)
    const ok = window.confirm(
      `${target?.title || 'この議事録'} を削除しますか？\nこの操作は元に戻せません。`,
    )

    if (!ok) return

    try {
      setDeletingId(recordId)
      setMessage('')

      const response = await fetch(`/api/ai-minutes/records/${recordId}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as { success?: boolean; error?: string }

      if (!response.ok) {
        throw new Error(data.error || '削除に失敗しました。')
      }

      setRecords((prev) => prev.filter((record) => record.id !== recordId))
      setMessage('保存済み議事録を削除しました。')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '削除に失敗しました。')
    } finally {
      setDeletingId('')
    }
  }

  function clearFilters() {
    setPropertyFilter('')
    setMeetingTypeFilter('')
    setTitleKeyword('')
    setCreatedFrom('')
    setCreatedTo('')
    setSortOrder('newest')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">議事録AI</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">保存済み議事録一覧</h1>
              <p className="mt-2 text-sm text-gray-600">
                保存した議事録を検索、絞り込み、再編集、削除できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ai-minutes"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                新規作成
              </Link>
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                物件名で絞り込み
              </label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
              >
                <option value="">すべて</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                会議種別で絞り込み
              </label>
              <select
                value={meetingTypeFilter}
                onChange={(e) => setMeetingTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
              >
                <option value="">すべて</option>
                <option value="general_meeting">総会</option>
                <option value="board_meeting">理事会</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                タイトル検索
              </label>
              <input
                type="text"
                value={titleKeyword}
                onChange={(e) => setTitleKeyword(e.target.value)}
                placeholder="正式タイトルや議事録名で検索"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                作成日 from
              </label>
              <input
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                作成日 to
              </label>
              <input
                type="date"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                並び順
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              絞り込みを解除
            </button>
          </div>
        </section>

        {message ? (
          <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700 shadow-sm">
            {message}
          </section>
        ) : null}

        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-base font-semibold text-gray-900">
              該当する保存済み議事録はありません
            </p>
            <p className="mt-2 text-sm text-gray-600">
              絞り込み条件を変えるか、新しく議事録を保存してください。
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-semibold">物件名</th>
                    <th className="px-4 py-3 font-semibold">会議種別</th>
                    <th className="px-4 py-3 font-semibold">タイトル</th>
                    <th className="px-4 py-3 font-semibold">版情報</th>
                    <th className="px-4 py-3 font-semibold">メタ情報</th>
                    <th className="px-4 py-3 font-semibold">作成日時</th>
                    <th className="px-4 py-3 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-4 text-gray-900">{record.propertyName}</td>
                      <td className="px-4 py-4 text-gray-700">
                        {formatMeetingType(record.meetingType)}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        <div className="space-y-1">
                          <p>{record.title || 'タイトル未設定'}</p>
                          {record.officialTitle ? (
                            <p className="text-xs text-gray-500">
                              正式タイトル: {record.officialTitle}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        <div className="space-y-1 text-xs">
                          <p>{record.versionType === 'original' ? '原本' : '派生版'}</p>
                          {record.sourceRecordId ? (
                            <p className="text-gray-500">元議事録あり</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        <div className="space-y-1 text-xs">
                          {record.heldOn ? <p>開催日: {record.heldOn}</p> : null}
                          {record.meetingTerm ? <p>理事会期: 第{record.meetingTerm}期</p> : null}
                          {record.meetingRound ? <p>理事会回数: 第{record.meetingRound}回</p> : null}
                          {record.meetingPlace ? <p>開催場所: {record.meetingPlace}</p> : null}
                          {!record.heldOn &&
                          !record.meetingTerm &&
                          !record.meetingRound &&
                          !record.meetingPlace ? <p>-</p> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {formatDateTime(record.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/ai-minutes/records/${record.id}`}
                            className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            開く
                          </Link>

                          <Link
                            href={`/ai-minutes?reuseRecordId=${record.id}`}
                            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            再編集
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === record.id ? '削除中...' : '削除'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}