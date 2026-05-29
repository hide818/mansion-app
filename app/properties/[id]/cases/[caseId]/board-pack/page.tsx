import { notFound } from 'next/navigation'
import BoardPackCenterClient from '@/app/components/BoardPackCenterClient'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

function pickFirstString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

export default async function BoardPackPage({ params }: PageProps) {
  const { id, caseId } = await params
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!property) {
    notFound()
  }

  const { data: caseRow } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('property_id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!caseRow) {
    notFound()
  }

  const propertyName =
    pickFirstString(property as Record<string, unknown>, ['name', 'property_name', 'title']) ||
    '物件'

  const caseTitle =
    pickFirstString(caseRow as Record<string, unknown>, ['title', 'name', 'subject']) ||
    '案件'

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{propertyName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            理事会パックセンター
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            案件名：{caseTitle}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            理事会に出す前の整理、議案書、説明文、想定質問を一気に作るページです。
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-3 py-1">案件の議案化</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">議案タイトル管理</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">理事会ステータス管理</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">上程予定月管理</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">理事会メモ管理</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">理事会報告ドラフト</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">議案書作成</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">AI議案生成</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">聞かれそうな質問</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">想定質問生成</span>
          </div>
        </div>

        <BoardPackCenterClient
          propertyId={id}
          caseId={caseId}
          propertyName={propertyName}
          caseTitle={caseTitle}
        />
      </div>
    </main>
  )
}