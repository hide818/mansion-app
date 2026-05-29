import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import CopyTextButton from '@/app/components/CopyTextButton'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PageProps = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type PropertyRow = {
  id: string
  name: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  title: string | null
  status: string | null
  assignee: string | null
  board_status: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
}

type GoalSection = {
  title: string
  body: string
}

function buildGoalSections(params: {
  caseItem: CaseRow
  openTasks: TaskRow[]
}) {
  const { caseItem, openTasks } = params

  const sections: GoalSection[] = []

  sections.push({
    title: 'この案件の最終ゴール',
    body: caseItem.board_status && caseItem.board_status !== '未設定'
      ? `理事会対応を含めて「${caseItem.title ?? '案件名未設定'}」を完了状態まで持っていくことです。`
      : `「${caseItem.title ?? '案件名未設定'}」について、必要な確認・調整・報告を終え、案件を完了にすることです。`,
  })

  sections.push({
    title: '今の中間ゴール',
    body: caseItem.board_next_action
      ? `まずは「${caseItem.board_next_action}」を完了させることです。`
      : 'まずは次にやることを明文化し、動きを止めない状態にすることです。',
  })

  sections.push({
    title: '完了条件の目安',
    body:
      openTasks.length === 0
        ? '未完了タスクがなく、関係者への説明や記録も済んでいる状態です。'
        : `未完了タスク ${openTasks.length} 件が解消され、必要な説明・報告まで終わっている状態です。`,
  })

  sections.push({
    title: '今すぐやるべきこと',
    body:
      caseItem.board_next_action
        ? `直近では「${caseItem.board_next_action}」を実行し、その結果をログへ残してください。`
        : openTasks[0]?.title
          ? `直近では未完了タスク「${openTasks[0].title}」を前に進めてください。`
          : '直近では最新状況を確認し、次の一手を決めてください。',
  })

  return sections
}

export default async function GoalPage({ params }: PageProps) {
  const { id, caseId } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId()

  if (!companyId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">案件のゴール表示</h1>
        <p className="mt-4 text-sm text-red-600">company_id が取得できませんでした。</p>
      </div>
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('id', id)
    .maybeSingle<PropertyRow>()

  if (propertyError || !property) {
    notFound()
  }

  const { data: caseItem, error: caseError } = await supabase
    .from('cases')
    .select('id, property_id, title, status, assignee, board_status, board_agenda_title, board_next_action')
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status')
    .eq('company_id', companyId)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  const openTasks = (tasks ?? []).filter((item) => item.status !== '完了')
  const sections = buildGoalSections({
    caseItem,
    openTasks,
  })

  const copyText = [
    `【物件名】${property.name ?? '物件名未設定'}`,
    `【案件名】${caseItem.title ?? '案件名未設定'}`,
    '■案件のゴール整理',
    ...sections.map((section) => `【${section.title}】\n${section.body}`),
  ].join('\n\n')

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">案件のゴール表示</h1>
          <p className="mt-2 text-sm text-gray-600">
            この案件をどこまで持っていけば完了なのかを、言葉で見える化します。
          </p>
        </div>

        <CopyTextButton text={copyText} label="ゴール整理をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/one-line-status`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          一言ステータスへ
        </Link>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-gray-700">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}