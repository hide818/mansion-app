import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

export default async function DashboardAiOperationsPage() {
  const companyId = await getUserCompanyId()

  if (!companyId) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, property_id, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(8)

  const safeProperties = (properties ?? []) as PropertyRow[]
  const safeCases = (cases ?? []) as CaseRow[]

  const propertyMap = new Map(safeProperties.map((item) => [item.id, item.name ?? '物件名未設定']))

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          ダッシュボードへ戻る
        </Link>
        <Link
          href={`/cases/ai-cross-case-next-actions`}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          案件横断AI次アクションへ
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">ダッシュボードAI業務センター</h1>
        <p className="text-sm text-gray-600 mt-2">
          全体俯瞰からAI機能へすぐ飛べる入口です。まずどこを触るか迷った時はここから使います。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href={`/cases/ai-cross-case-next-actions`}
          className="rounded-2xl border bg-white p-5 hover:bg-gray-50 transition"
        >
          <div className="font-semibold">案件横断AI次アクション提案</div>
          <div className="text-sm text-gray-600 mt-2">
            複数案件の中で、今どれから触るべきかをAIが整理します。
          </div>
        </Link>

        <Link
          href={`/handover-documents/ai-center`}
          className="rounded-2xl border bg-white p-5 hover:bg-gray-50 transition"
        >
          <div className="font-semibold">引き継ぎAI業務センター</div>
          <div className="text-sm text-gray-600 mt-2">
            引き継ぎ書、案件引き継ぎ、物件引き継ぎ系のAI導線をまとめています。
          </div>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold">最近の物件からAIへ入る</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {safeProperties.length === 0 ? (
            <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
              物件データがありません。
            </div>
          ) : (
            safeProperties.map((item) => (
              <div key={item.id} className="rounded-2xl border bg-white p-5 space-y-3">
                <div className="font-semibold">{item.name ?? '物件名未設定'}</div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/properties/${item.id}/ai-center`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    物件AIセンター
                  </Link>
                  <Link
                    href={`/properties/${item.id}/ai-management-brief`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    AI対応提案
                  </Link>
                  <Link
                    href={`/properties/${item.id}/ai-board-report-batch`}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    AI理事会報告
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">最近の案件からAIへ入る</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {safeCases.length === 0 ? (
            <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
              案件データがありません。
            </div>
          ) : (
            safeCases.map((item) => (
              <div key={item.id} className="rounded-2xl border bg-white p-5 space-y-3">
                <div className="font-semibold">{item.title ?? '案件名未設定'}</div>
                <div className="text-sm text-gray-600">
                  物件：{propertyMap.get(item.property_id ?? '') ?? '物件名不明'} / 状況：{item.status ?? '未設定'}
                </div>
                {item.property_id ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/properties/${item.property_id}/cases/${item.id}/ai-center`}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                    >
                      案件AIセンター
                    </Link>
                    <Link
                      href={`/properties/${item.property_id}/cases/${item.id}/ai-response-suggestion`}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                    >
                      AI対応提案
                    </Link>
                    <Link
                      href={`/properties/${item.property_id}/cases/${item.id}/ai-agenda`}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                    >
                      AI議案生成
                    </Link>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">物件ID不明のためAI導線を表示できません。</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}