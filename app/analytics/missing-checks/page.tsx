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
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_next_action: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  status: string | null
}

type LogRow = {
  id: string
  case_id: string | null
}

type FileRow = {
  id: string
  case_id: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

export default async function MissingChecksPage() {
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

  const [{ data: cases, error: casesError }, { data: tasks, error: tasksError }, { data: logs, error: logsError }, { data: files, error: filesError }] =
    await Promise.all([
      supabase
        .from('cases')
        .select(
          'id, title, property_id, status, assignee, board_status, board_scheduled_for, board_agenda_title, board_next_action'
        )
        .eq('company_id', companyId)
        .neq('status', '完了'),
      supabase.from('tasks').select('id, case_id, status').eq('company_id', companyId),
      supabase.from('logs').select('id, case_id').eq('company_id', companyId),
      supabase.from('case_files').select('id, case_id').eq('company_id', companyId),
    ])

  if (casesError || tasksError || logsError || filesError) {
    console.error('missing checks page error:', { casesError, tasksError, logsError, filesError })

    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          対応抜けチェックの取得に失敗しました。cases / tasks / logs / case_files を確認してください。
        </div>
      </div>
    )
  }

  const safeCases = (cases ?? []) as CaseRow[]
  const safeTasks = (tasks ?? []) as TaskRow[]
  const safeLogs = (logs ?? []) as LogRow[]
  const safeFiles = (files ?? []) as FileRow[]

  const propertyIds = Array.from(new Set(safeCases.map((item) => item.property_id).filter(Boolean))) as string[]

  const { data: properties } =
    propertyIds.length > 0
      ? await supabase.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] as PropertyRow[] }

  const propertyMap = new Map<string, string>()
  ;((properties ?? []) as PropertyRow[]).forEach((item) => {
    propertyMap.set(item.id, item.name ?? '物件名未設定')
  })

  const taskCountMap = new Map<string, number>()
  const openTaskCountMap = new Map<string, number>()
  const logCountMap = new Map<string, number>()
  const fileCountMap = new Map<string, number>()

  safeTasks.forEach((item) => {
    if (!item.case_id) return
    taskCountMap.set(item.case_id, (taskCountMap.get(item.case_id) ?? 0) + 1)
    if (item.status !== '完了') {
      openTaskCountMap.set(item.case_id, (openTaskCountMap.get(item.case_id) ?? 0) + 1)
    }
  })

  safeLogs.forEach((item) => {
    if (!item.case_id) return
    logCountMap.set(item.case_id, (logCountMap.get(item.case_id) ?? 0) + 1)
  })

  safeFiles.forEach((item) => {
    if (!item.case_id) return
    fileCountMap.set(item.case_id, (fileCountMap.get(item.case_id) ?? 0) + 1)
  })

  const rows = safeCases
    .map((item) => {
      const checks: string[] = []

      if (!item.assignee) checks.push('担当者未設定')
      if ((taskCountMap.get(item.id) ?? 0) === 0) checks.push('タスク未登録')
      if ((logCountMap.get(item.id) ?? 0) === 0) checks.push('対応ログ未登録')
      if ((fileCountMap.get(item.id) ?? 0) === 0) checks.push('添付資料未登録')

      if (item.board_status === '上程予定') {
        if (!item.board_scheduled_for) checks.push('上程予定月未設定')
        if (!item.board_agenda_title) checks.push('議案タイトル未設定')
        if (!item.board_next_action) checks.push('理事会向け次アクション未設定')
      }

      if ((openTaskCountMap.get(item.id) ?? 0) === 0 && item.status !== '完了') {
        checks.push('未完了案件だが未完了タスクなし')
      }

      return {
        ...item,
        checks,
      }
    })
    .filter((item) => item.checks.length > 0)
    .sort((a, b) => b.checks.length - a.checks.length)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">対応抜けチェック</h1>
        <p className="mt-2 text-sm text-gray-600">
          担当者、タスク、ログ、添付資料、理事会情報の抜けを案件ごとに自動チェックしています。
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm text-red-700">要確認案件数</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">チェック対象</div>
          <div className="mt-2 text-sm font-medium text-gray-900">
            担当 / タスク / ログ / 添付 / 理事会設定
          </div>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-sm text-yellow-700">使い方</div>
          <div className="mt-2 text-sm font-medium text-yellow-900">朝の確認や引き継ぎ前の総点検</div>
        </div>
      </div>

      <div className="grid gap-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            現時点で大きな対応抜けは見つかりませんでした。
          </div>
        ) : (
          rows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{item.title || '無題案件'}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    物件: {item.property_id ? propertyMap.get(item.property_id) ?? '-' : '-'} / ステータス:{' '}
                    {item.status || '-'}
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

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="text-sm text-red-700">不足している可能性がある項目</div>
                <ul className="mt-2 space-y-1 text-sm text-red-900">
                  {item.checks.map((check) => (
                    <li key={check}>・{check}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}