import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import AiToolSelectorClient from '@/app/components/AiToolSelectorClient'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type AiLink = {
  title: string
  description: string
  href: string
  badge: string
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

export default async function AiCenterPage({ params }: PageProps) {
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

  const { count: openTaskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('property_id', id)
    .eq('case_id', caseId)
    .eq('is_done', false)

  const { count: logCount } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('property_id', id)
    .eq('case_id', caseId)

  const { count: fileCount } = await supabase
    .from('case_files')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('property_id', id)
    .eq('case_id', caseId)

  const propertyName =
    pickFirstString(property as Record<string, unknown>, ['name', 'property_name', 'title']) ||
    '物件'

  const caseTitle =
    pickFirstString(caseRow as Record<string, unknown>, ['title', 'name', 'subject']) ||
    '案件'

  const boardStatus =
    pickFirstString(caseRow as Record<string, unknown>, ['board_status', 'meeting_status']) ||
    '未設定'

  const basePath = `/properties/${id}/cases/${caseId}`

  const primaryLinks: AiLink[] = [
    {
      title: '理事会パック',
      description: '議案化、理事会報告、議案書、想定質問を一気に作る',
      href: `${basePath}/board-pack`,
      badge: '中核',
    },
    {
      title: '引き継ぎパック',
      description: '担当変更時の整理を一気に作る',
      href: `${basePath}/handover-pack`,
      badge: '属人化対策',
    },
    {
      title: '業者対応パック',
      description: '見積比較や業者説明の文章を作る',
      href: `${basePath}/vendor-pack`,
      badge: '業者対応',
    },
  ]

  const subLinks: AiLink[] = [
    {
      title: '上司共有パック',
      description: '上司向けの短文共有や状況整理を出す',
      href: `${basePath}/manager-pack`,
      badge: '共有',
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <Link
              href={basePath}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 案件詳細へ戻る
            </Link>
          </div>

          <p className="text-sm font-semibold text-green-700">案件AIツールセンター</p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            この案件で使うAIを
            <br />
            ここから一気に動かす
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-gray-600">
            社長、今回は案件単位の売り機能をまとめて見せるために、
            理事会・引き継ぎ・業者対応・判断補助・次アクション・文章作成の導線を
            ここからすぐ使える形にしています。
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">
              物件：{propertyName}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
              案件：{caseTitle}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
              理事会状態：{boardStatus}
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">主要パック</h2>
              <p className="mt-1 text-sm text-gray-600">
                まずはここから使えば、案件の骨格が一気に整う。
              </p>
            </div>

            <Link
              href={`${basePath}/board-pack`}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              理事会パックを開く
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-green-300 hover:bg-gray-50"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs leading-6 text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">未完了タスク</p>
            <p className="mt-3 text-5xl font-bold tracking-tight text-gray-900">
              {openTaskCount ?? 0}
            </p>
            <p className="mt-3 text-sm text-gray-600">この案件に残っている未完了タスク</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">対応ログ</p>
            <p className="mt-3 text-5xl font-bold tracking-tight text-gray-900">
              {logCount ?? 0}
            </p>
            <p className="mt-3 text-sm text-gray-600">この案件に蓄積された履歴数</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">添付資料</p>
            <p className="mt-3 text-5xl font-bold tracking-tight text-gray-900">
              {fileCount ?? 0}
            </p>
            <p className="mt-3 text-sm text-gray-600">見積・写真・報告などの資料数</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">理事会予定</p>
            <p className="mt-3 text-5xl font-bold tracking-tight text-gray-900">
              {boardStatus === '未設定' ? '-' : '•'}
            </p>
            <p className="mt-3 text-sm text-gray-600">理事会状態：{boardStatus}</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-400">補助パック</h2>
            <p className="mt-1 text-xs text-slate-400">
              必要なときに使う追加機能。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {subLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-600">{item.title}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs leading-6 text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <AiToolSelectorClient propertyId={id} caseId={caseId} />
      </div>
    </main>
  )
}
