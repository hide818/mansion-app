import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  board_status: string | null
  board_scheduled_for: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDate(value: string | null) {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default async function BoardCasesAiPrepPage() {
  const companyId = await getUserCompanyId()

  if (!companyId) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .limit(50)

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, property_id, status, board_status, board_scheduled_for')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(30)

  const safeProperties = (properties ?? []) as PropertyRow[]
  const safeCases = (cases ?? []) as CaseRow[]
  const propertyMap = new Map(safeProperties.map((item) => [item.id, item.name ?? '物件名未設定']))

  const boardCases = safeCases.filter(
    (item) => item.board_status && !['未設定', '不要', '完了'].includes(item.board_status)
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/board-cases`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          理事会予定案件一覧へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">理事会AI準備センター</h1>
        <p className="text-sm text-gray-600 mt-2">
          理事会対象案件について、議案、説明文、想定質問、シミュレーションへすぐ入れる準備画面です。
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">理事会対象案件数</div>
          <div className="text-2xl font-bold mt-2">{boardCases.length}</div>
        </div>
        <Link
          href={`/cases/ai-cross-case-next-actions`}
          className="rounded-2xl border bg-white p-4 hover:bg-gray-50 transition"
        >
          <div className="text-sm text-gray-500">案件横断AI</div>
          <div className="font-semibold mt-2">優先順位を先に確認</div>
        </Link>
        <Link
          href={`/dashboard/ai-operations`}
          className="rounded-2xl border bg-white p-4 hover:bg-gray-50 transition"
        >
          <div className="text-sm text-gray-500">ダッシュボードAI</div>
          <div className="font-semibold mt-2">全体俯瞰へ戻る</div>
        </Link>
      </div>

      <div className="grid gap-4">
        {boardCases.length === 0 ? (
          <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
            理事会対象案件がありません。
          </div>
        ) : (
          boardCases.map((item) => {
            const propertyName = propertyMap.get(item.property_id ?? '') ?? '物件名不明'

            if (!item.property_id) {
              return (
                <div key={item.id} className="rounded-2xl border bg-white p-5">
                  <div className="font-semibold">{item.title ?? '案件名未設定'}</div>
                  <div className="text-sm text-gray-500 mt-2">
                    物件ID不明のためAI導線を表示できません。
                  </div>
                </div>
              )
            }

            return (
              <div key={item.id} className="rounded-2xl border bg-white p-5 space-y-3">
                <div className="font-semibold">{item.title ?? '案件名未設定'}</div>
                <div className="text-sm text-gray-600">
                  物件：{propertyName} / 状況：{item.status ?? '未設定'} / 理事会：{item.board_status ?? '未設定'} / 上程予定：{formatDate(item.board_scheduled_for)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/properties/${item.property_id}/cases/${item.id}/ai-agenda`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    AI議案生成
                  </Link>
                  <Link
                    href={`/properties/${item.property_id}/cases/${item.id}/ai-board-explanation`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    AI説明文
                  </Link>
                  <Link
                    href={`/properties/${item.property_id}/cases/${item.id}/ai-expected-questions`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    想定質問
                  </Link>
                  <Link
                    href={`/properties/${item.property_id}/cases/${item.id}/ai-question-simulation`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    理事会シミュレーション
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}