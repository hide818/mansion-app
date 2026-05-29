import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
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
  created_at: string | null
  board_status: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
}

type FileRow = {
  id: string
  category: string | null
}

type ToolCard = {
  title: string
  description: string
  href: string
  category: string
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isOverdue(value: string | null) {
  if (!value) return false

  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

export default async function CaseToolsPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold">案件ツール一覧</h1>
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
    .select(
      'id, property_id, title, status, assignee, created_at, board_status, board_agenda_title, board_next_action'
    )
    .eq('id', caseId)
    .eq('property_id', id)
    .maybeSingle<CaseRow>()

  if (caseError || !caseItem) {
    notFound()
  }

  const [{ data: tasks }, { data: logs }, { data: files }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date, priority')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('id, message, created_at')
      .eq('company_id', companyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('case_files')
      .select('id, category')
      .eq('company_id', companyId)
      .eq('case_id', caseId),
  ])

  const openTasks = (tasks ?? []).filter((item) => item.status !== '完了')
  const overdueTasks = openTasks.filter((item) => isOverdue(item.due_date))
  const latestLog = logs?.[0]
  const fileCount = files?.length ?? 0

  const toolCards: ToolCard[] = [
    {
      title: '対応抜けチェック',
      description: '抜けやすいポイントを自動で確認します。',
      href: `/properties/${id}/cases/${caseId}/coverage-check`,
      category: '判断支援',
    },
    {
      title: '引き継ぎチェックリスト',
      description: '担当変更前に不足項目を確認できます。',
      href: `/properties/${id}/cases/${caseId}/handover-checklist`,
      category: '引き継ぎ',
    },
    {
      title: '未来のタスク自動生成',
      description: '次に発生しやすい実務タスクを提案します。',
      href: `/properties/${id}/cases/${caseId}/future-tasks`,
      category: '判断支援',
    },
    {
      title: 'ワンクリック業者依頼文',
      description: '業者へ送るたたき台文章をすぐ出せます。',
      href: `/properties/${id}/cases/${caseId}/vendor-request`,
      category: '文書生成',
    },
    {
      title: '案件自動要約',
      description: '案件の全体像をすぐ読める形にまとめます。',
      href: `/properties/${id}/cases/${caseId}/auto-summary`,
      category: '文書生成',
    },
    {
      title: '理事会で聞かれそうな質問',
      description: '理事会で突っ込まれやすい論点を先に出します。',
      href: `/properties/${id}/cases/${caseId}/question-simulation`,
      category: '理事会',
    },
    {
      title: '理事会報告ドラフト生成',
      description: '理事会用の報告たたき台を作ります。',
      href: `/properties/${id}/cases/${caseId}/board-draft`,
      category: '理事会',
    },
    {
      title: '上司向け文体整形',
      description: '社内共有しやすい落ち着いた文体に整えます。',
      href: `/properties/${id}/cases/${caseId}/manager-tone`,
      category: '文書生成',
    },
    {
      title: '案件説明文生成',
      description: '短く説明しやすい案件説明文を出します。',
      href: `/properties/${id}/cases/${caseId}/simple-explanation`,
      category: '文書生成',
    },
    {
      title: '案件一言ステータス',
      description: '社内チャット向けの一行要約を作ります。',
      href: `/properties/${id}/cases/${caseId}/one-line-status`,
      category: '共有',
    },
    {
      title: '案件のゴール表示',
      description: 'この案件をどこまで持っていけば完了かを見えます。',
      href: `/properties/${id}/cases/${caseId}/goal`,
      category: '判断支援',
    },
    {
      title: '担当者変更モード',
      description: '担当変更時に口頭で伝えるべきことを整理します。',
      href: `/properties/${id}/cases/${caseId}/assignee-handoff`,
      category: '引き継ぎ',
    },
    {
      title: '理事会履歴管理',
      description: '理事会まわりの状態と保存済み提出セットを見ます。',
      href: `/properties/${id}/cases/${caseId}/board-history`,
      category: '理事会',
    },
    {
      title: '案件テンプレート機能',
      description: '案件の種類に応じた進行テンプレ候補を出します。',
      href: `/properties/${id}/cases/${caseId}/template-suggestions`,
      category: 'テンプレ',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{property.name ?? '物件名未設定'}</p>
        <h1 className="mt-1 text-2xl font-bold">案件ツール一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          この案件で使える売り機能を、迷わず開けるようにまとめています。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/properties/${id}/cases/${caseId}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          案件詳細へ戻る
        </Link>
        <Link
          href={`/properties/${id}/tools`}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          物件ツール一覧へ
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">案件状態</p>
          <p className="mt-2 text-sm font-medium">{caseItem.status ?? '未設定'}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">未完了タスク</p>
          <p className="mt-2 text-3xl font-bold">{openTasks.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">期限切れ</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{overdueTasks.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">添付資料</p>
          <p className="mt-2 text-3xl font-bold">{fileCount}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">案件のひと目サマリー</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>案件名: {caseItem.title ?? '案件名未設定'}</p>
          <p>担当者: {caseItem.assignee ?? '未設定'}</p>
          <p>理事会ステータス: {caseItem.board_status ?? '未設定'}</p>
          <p>次アクション: {caseItem.board_next_action ?? '未設定'}</p>
          <p>直近ログ: {latestLog?.message ?? 'ログ未登録'}</p>
          <p>作成日: {formatDate(caseItem.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border bg-white p-5 transition hover:border-gray-400 hover:bg-gray-50"
          >
            <p className="text-xs font-medium text-gray-500">{card.category}</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-gray-700">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}