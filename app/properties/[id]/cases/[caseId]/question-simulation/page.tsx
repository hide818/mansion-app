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

type QuestionRow = {
  question: string
  answerHint: string
}

function containsText(base: string, keywords: string[]) {
  const text = base.toLowerCase()
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

export default async function QuestionSimulationPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">理事会で聞かれそうな質問</h1>
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

  const [{ data: tasks }, { data: logs }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('id, message, created_at')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const openTasks = (tasks ?? []).filter((item) => item.status !== '完了')
  const latestLog = (logs ?? [])[0]
  const textBase = [
    caseItem.title ?? '',
    caseItem.board_agenda_title ?? '',
    caseItem.board_next_action ?? '',
    latestLog?.message ?? '',
    ...openTasks.map((item) => item.title ?? ''),
  ].join(' ')

  const questions: QuestionRow[] = [
    {
      question: 'この案件は今どこまで進んでいますか？',
      answerHint: `現在の案件ステータスは「${caseItem.status ?? '未設定'}」で、直近の動きは「${latestLog?.message ?? 'ログ未登録'}」です。`,
    },
    {
      question: '次に何をする予定ですか？',
      answerHint: caseItem.board_next_action
        ? `次の想定アクションは「${caseItem.board_next_action}」です。`
        : '次アクションはまだ明文化されていないため、案件詳細で整理が必要です。',
    },
    {
      question: 'まだ終わっていないことは何ですか？',
      answerHint:
        openTasks.length === 0
          ? '未完了タスクは現在ありません。'
          : `未完了タスクは ${openTasks.length} 件あり、最優先は「${openTasks[0]?.title ?? 'タスク名未設定'}」です。`,
    },
  ]

  if (containsText(textBase, ['見積', '工事', '修繕', '業者'])) {
    questions.push({
      question: '見積や業者との調整はどうなっていますか？',
      answerHint: '見積・業者調整が論点になりやすい案件です。業者への依頼状況と回答待ち有無を整理しておくと安全です。',
    })
  }

  if (containsText(textBase, ['漏水', '騒音', '苦情', 'クレーム'])) {
    questions.push({
      question: '住民対応や再発防止はどう考えていますか？',
      answerHint: 'クレーム性が強い案件なので、一次対応だけでなく、再発防止や経過報告まで説明できるようにしておくとよいです。',
    })
  }

  if (containsText(textBase, ['理事会', '総会', '議案'])) {
    questions.push({
      question: '今回、理事会に諮る必要性は何ですか？',
      answerHint: '理事会判断が必要な理由、理事会で決めたいこと、決定後に進む内容を分けて説明できるようにしておくと通りやすいです。',
    })
  }

  const uniqueQuestions = questions.filter(
    (item, index, array) =>
      array.findIndex((target) => target.question === item.question) === index
  )

  const copyText = [
    `【物件名】${property.name ?? '物件名未設定'}`,
    `【案件名】${caseItem.title ?? '案件名未設定'}`,
    '■理事会で聞かれそうな質問',
    ...uniqueQuestions.map(
      (item) => `・質問: ${item.question}\n  回答の軸: ${item.answerHint}`
    ),
  ].join('\n')

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
          <h1 className="mt-1 text-2xl font-bold">理事会で聞かれそうな質問</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件内容から、理事会で突っ込まれやすい質問を先に出します。
          </p>
        </div>

        <CopyTextButton text={copyText} label="質問候補をコピー" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/cases/${caseId}/board-draft`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          理事会報告ドラフトへ
        </Link>
      </div>

      <div className="space-y-4">
        {uniqueQuestions.map((item) => (
          <div key={item.question} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">{item.question}</h2>
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">回答の軸</p>
              <p className="mt-2 text-sm leading-7 text-gray-700">{item.answerHint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}