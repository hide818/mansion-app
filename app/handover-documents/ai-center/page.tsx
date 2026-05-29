import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type HandoverRow = {
  id: string
  property_id: string | null
  title: string | null
  updated_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '未設定'
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

export default async function HandoverAiCenterPage() {
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

  const { data: handovers } = await supabase
    .from('handover_documents')
    .select('id, property_id, title, updated_at')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })
    .limit(20)

  const safeProperties = (properties ?? []) as PropertyRow[]
  const safeHandovers = (handovers ?? []) as HandoverRow[]
  const propertyMap = new Map(safeProperties.map((item) => [item.id, item.name ?? '物件名未設定']))

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/handover-documents`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          保存済み引き継ぎ書一覧へ戻る
        </Link>
        <Link
          href={`/dashboard/ai-operations`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          ダッシュボードAIへ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">引き継ぎAI業務センター</h1>
        <p className="text-sm text-gray-600 mt-2">
          物件引き継ぎ、案件引き継ぎ、印刷・保存導線をまとめた引き継ぎ専用の入口です。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {safeHandovers.length === 0 ? (
          <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
            保存済み引き継ぎ書がありません。
          </div>
        ) : (
          safeHandovers.map((item) => {
            if (!item.property_id) {
              return (
                <div key={item.id} className="rounded-2xl border bg-white p-5">
                  <div className="font-semibold">{item.title ?? 'タイトル未設定'}</div>
                  <div className="text-sm text-gray-500 mt-2">
                    物件ID不明のため導線を表示できません。
                  </div>
                </div>
              )
            }

            return (
              <div key={item.id} className="rounded-2xl border bg-white p-5 space-y-3">
                <div className="font-semibold">{item.title ?? 'タイトル未設定'}</div>
                <div className="text-sm text-gray-600">
                  物件：{propertyMap.get(item.property_id) ?? '物件名不明'} / 更新日：{formatDateTime(item.updated_at)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/properties/${item.property_id}/handover-ai`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    物件引き継ぎAI
                  </Link>
                  <Link
                    href={`/properties/${item.property_id}/handover-ai/print`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    印刷ページ
                  </Link>
                  <Link
                    href={`/properties/${item.property_id}/ai-center`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    物件AIセンター
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="font-semibold">案件単位の引き継ぎAIについて</div>
        <div className="text-sm text-gray-600 mt-2 leading-6">
          案件単位の引き継ぎAIは案件詳細から使う想定です。案件ごとの状況、未完了事項、注意点をまとめるときは
          「案件AIツールセンター」内の「案件AI引き継ぎサマリー」へ入ってください。
        </div>
      </div>
    </div>
  )
}