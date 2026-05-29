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
  board_next_action: string | null
}

type TaskTemplateRow = {
  title: string
  priority: string
  dueHint: string
}

type TemplateSection = {
  templateName: string
  reason: string
  taskTemplates: TaskTemplateRow[]
}

function includesAnyText(base: string, keywords: string[]) {
  const text = base.toLowerCase()
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

function buildTemplateSections(caseTitle: string, nextAction: string | null): TemplateSection[] {
  const text = `${caseTitle} ${nextAction ?? ''}`

  if (includesAnyText(text, ['漏水', '水漏れ', '給水', '排水'])) {
    return [
      {
        templateName: '漏水・水回り対応テンプレ',
        reason: '漏水系は初動と記録が重要なためです。',
        taskTemplates: [
          { title: '現地状況を確認する', priority: '高', dueHint: '今日' },
          { title: '関係者へ一次報告を入れる', priority: '高', dueHint: '今日' },
          { title: '写真と被害範囲を整理する', priority: '高', dueHint: '今日〜明日' },
          { title: '業者へ確認または見積依頼を出す', priority: '高', dueHint: '明日まで' },
          { title: '再発防止と今後方針を整理する', priority: '中', dueHint: '今週中' },
        ],
      },
    ]
  }

  if (includesAnyText(text, ['騒音', '苦情', 'クレーム', 'トラブル'])) {
    return [
      {
        templateName: 'クレーム・住民対応テンプレ',
        reason: '感情面の配慮と経過記録が重要なためです。',
        taskTemplates: [
          { title: '申出内容を正確に整理する', priority: '高', dueHint: '今日' },
          { title: '一次対応の連絡を入れる', priority: '高', dueHint: '今日' },
          { title: '関係先へ事実確認する', priority: '高', dueHint: '明日まで' },
          { title: '経過をログへ残す', priority: '高', dueHint: '都度' },
          { title: '再発防止案を整理する', priority: '中', dueHint: '今週中' },
        ],
      },
    ]
  }

  if (includesAnyText(text, ['理事会', '議案', '総会'])) {
    return [
      {
        templateName: '理事会提出テンプレ',
        reason: '理事会案件は、論点整理と質問対策が重要なためです。',
        taskTemplates: [
          { title: '議案タイトルを確定する', priority: '高', dueHint: '今日〜明日' },
          { title: '現状と論点を整理する', priority: '高', dueHint: '今週中' },
          { title: '理事会で決めたい事項を明文化する', priority: '高', dueHint: '今週中' },
          { title: '想定質問を洗い出す', priority: '中', dueHint: '今週中' },
          { title: '提出資料を最終確認する', priority: '高', dueHint: '上程前' },
        ],
      },
    ]
  }

  return [
    {
      templateName: '標準案件進行テンプレ',
      reason: '案件を止めずに前へ進めるための基本形です。',
      taskTemplates: [
        { title: '現状を確認する', priority: '高', dueHint: '今日' },
        { title: '関係者へ状況共有する', priority: '高', dueHint: '今日〜明日' },
        { title: '次にやることを明文化する', priority: '高', dueHint: '今日' },
        { title: '必要資料を集める', priority: '中', dueHint: '今週中' },
        { title: '完了条件を確認する', priority: '中', dueHint: '今週中' },
      ],
    },
  ]
}

export default async function TemplateSuggestionsPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">案件テンプレート機能</h1>
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
    .select('id, property_id, title, status, board_next_action')
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const sections = buildTemplateSections(
    caseItem.title ?? '案件名未設定',
    caseItem.board_next_action
  )

  const copyText = [
    `【物件名】${property.name ?? '物件名未設定'}`,
    `【案件名】${caseItem.title ?? '案件名未設定'}`,
    '■案件テンプレート候補',
    ...sections.flatMap((section) => [
      `【${section.templateName}】`,
      `理由: ${section.reason}`,
      ...section.taskTemplates.map(
        (task) => `・${task.title} / 優先度:${task.priority} / 目安:${task.dueHint}`
      ),
      '',
    ]),
  ].join('\n')

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">案件テンプレート機能</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件タイトルや次アクションから、使えそうな進行テンプレを提案します。
          </p>
        </div>

        <CopyTextButton text={copyText} label="テンプレ候補をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/future-tasks`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          未来のタスク自動生成へ
        </Link>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.templateName} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">{section.templateName}</h2>
            <p className="mt-2 text-sm text-gray-700">{section.reason}</p>

            <div className="mt-4 space-y-3">
              {section.taskTemplates.map((task) => (
                <div key={task.title} className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    優先度: {task.priority} / 目安: {task.dueHint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}