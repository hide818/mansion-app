import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
}

type LogRow = {
  id: string
  case_id: string | null
  message: string | null
  created_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function pickPatternText(messages: string[]) {
  const joined = messages.join(' / ')

  if (joined.includes('見積')) return '見積取得→比較→報告の流れが使える'
  if (joined.includes('理事会')) return '理事会報告→方針確認→次回対応の流れが使える'
  if (joined.includes('現地')) return '現地確認→写真整理→業者相談の流れが使える'
  if (joined.includes('電話')) return '電話記録→関係者共有→次アクション整理の流れが使える'

  return '完了案件の対応順を参考パターンとして流用できる'
}

export default async function SuccessPatternsPage() {
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
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          所属会社が設定されていません。profiles.company_id を確認してください。
        </div>
      </div>
    )
  }

  const [{ data: cases, error: casesError }, { data: tasks, error: tasksError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase
        .from('cases')
        .select('id, title, property_id, status, assignee, created_at')
        .eq('company_id', companyId)
        .eq('status', '完了')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('tasks')
        .select('id, case_id, status')
        .eq('company_id', companyId),
      supabase
        .from('logs')
        .select('id, case_id, message, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
    ])

  if (casesError || tasksError || logsError) {
    console.error('success patterns page error:', { casesError, tasksError, logsError })

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          過去の成功対応パターン表示の取得に失敗しました。cases / tasks / logs テーブルを確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeLogs = (logs ?? []) as LogRow[]

  const propertyIds = Array.from(
    new Set(safeCases.map((item) => item.property_id).filter(Boolean))
  ) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const taskCountMap = new Map<string, number>()
  safeTasks.forEach((item) => {
    if (!item.case_id) return
    taskCountMap.set(item.case_id, (taskCountMap.get(item.case_id) ?? 0) + 1)
  })

  const logMessagesMap = new Map<string, string[]>()
  safeLogs.forEach((item) => {
    if (!item.case_id) return
    if (!logMessagesMap.has(item.case_id)) {
      logMessagesMap.set(item.case_id, [])
    }

    if (item.message) {
      logMessagesMap.get(item.case_id)!.push(item.message)
    }
  })

  const rows = safeCases.map((item) => {
    const messages = (logMessagesMap.get(item.id) ?? []).slice(0, 5)
    const pattern = pickPatternText(messages)
    const taskCount = taskCountMap.get(item.id) ?? 0

    return {
      ...item,
      pattern,
      taskCount,
    }
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">過去の成功対応パターン表示</h1>
        <p className="mt-2 text-sm text-gray-600">
          完了案件のタスク数とログ内容から、参考にしやすい対応パターンを表示します。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-sm text-green-700">完了案件数</div>
          <div className="mt-2 text-3xl font-bold text-green-900">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">使い方</div>
          <div className="mt-2 text-sm font-medium text-blue-900">似た案件に流用できる進め方を探す</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">対象</div>
          <div className="mt-2 text-sm font-medium text-gray-900">完了済み案件のみ</div>
        </div>
      </div>

      <div className="grid gap-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            完了案件がまだありません。
          </div>
        ) : (
          rows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{item.title || '無題案件'}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    物件: {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'} / 担当者:{' '}
                    {item.assignee || '-'} / 完了案件
                  </div>
                </div>

                <div>
                  {item.property_id ? (
                    <Link
                      href={`/properties/${item.property_id}/cases/${item.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    >
                      案件詳細へ
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="text-sm text-green-700">参考パターン</div>
                <div className="mt-2 text-base font-semibold text-green-900">{item.pattern}</div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">作成日</div>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(item.created_at)}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">登録タスク数</div>
                  <div className="mt-1 text-sm text-gray-900">{item.taskCount}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">活用イメージ</div>
                  <div className="mt-1 text-sm text-gray-900">似た案件の進め方のたたき台</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}