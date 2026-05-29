import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type SearchParams = Promise<{
  propertyId?: string
  error?: string
}>

type PropertyRow = {
  id: string
  name: string | null
}

type RawCaseRow = {
  id: string
  title?: string | null
  name?: string | null
  status?: string | null
  due_date?: string | null
  deadline?: string | null
  due_at?: string | null
  limit_date?: string | null
  overview?: string | null
  description?: string | null
  content?: string | null
}

type RawTaskRow = {
  id: string
  title?: string | null
  status?: string | null
  priority?: string | null
  due_date?: string | null
  created_at?: string | null
  case_id?: string | null
}

type RawComplaintRow = {
  id: string
  title?: string | null
  category?: string | null
  content?: string | null
  created_at?: string | null
  status?: string | null
}

async function createHandoverAction(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const propertyId = String(formData.get('property_id') ?? '').trim() || null
  const basicInfo = String(formData.get('basic_info') ?? '').trim()
  const managementSystem = String(formData.get('management_system') ?? '').trim()
  const boardInfo = String(formData.get('board_info') ?? '').trim()
  const schedule = String(formData.get('schedule') ?? '').trim()
  const rules = String(formData.get('rules') ?? '').trim()
  const directors = String(formData.get('directors') ?? '').trim()
  const vendors = String(formData.get('vendors') ?? '').trim()
  const history = String(formData.get('history') ?? '').trim()
  const cautions = String(formData.get('cautions') ?? '').trim()
  const tasks = String(formData.get('tasks') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  if (!propertyId) {
    redirect(
      `/handover-documents/new?error=${encodeURIComponent('物件を選択してください')}`,
    )
  }

  if (!basicInfo) {
    redirect(
      `/handover-documents/new?propertyId=${encodeURIComponent(
        propertyId ?? '',
      )}&error=${encodeURIComponent('基本情報は必須です')}`,
    )
  }

  const { error } = await supabase.from('handover_documents').insert({
    company_id: companyId,
    property_id: propertyId,
    basic_info: basicInfo,
    management_system: managementSystem,
    board_info: boardInfo,
    schedule,
    rules,
    directors,
    vendors,
    history,
    cautions,
    tasks,
    note,
  })

  if (error) {
    redirect(
      `/handover-documents/new?propertyId=${encodeURIComponent(
        propertyId ?? '',
      )}&error=${encodeURIComponent(error.message || '保存に失敗しました')}`,
    )
  }

  redirect(`/handover-documents?propertyId=${propertyId}&created=1`)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function pickCaseTitle(item: RawCaseRow) {
  return item.title ?? item.name ?? '無題案件'
}

function pickCaseDueDate(item: RawCaseRow) {
  return item.due_date ?? item.deadline ?? item.due_at ?? item.limit_date ?? null
}

function pickCaseDescription(item: RawCaseRow) {
  return item.overview ?? item.description ?? item.content ?? ''
}

function getCaseStatusLabel(status: string | null | undefined) {
  if (!status) return '未設定'

  switch (status) {
    case 'todo':
      return '未着手'
    case 'doing':
      return '進行中'
    case 'done':
      return '完了'
    case 'pending':
      return '保留'
    default:
      return status
  }
}

function getTaskStatusLabel(status: string | null | undefined) {
  if (!status) return '未設定'

  switch (status) {
    case 'todo':
      return '未着手'
    case 'doing':
      return '進行中'
    case 'done':
      return '完了'
    case 'pending':
      return '保留'
    default:
      return status
  }
}

function getPriorityLabel(priority: string | null | undefined) {
  if (!priority) return '未設定'

  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return priority
  }
}

function buildAutoCasesText(cases: RawCaseRow[]) {
  if (cases.length === 0) {
    return '現在進行中の案件はありません。'
  }

  return cases
    .map((item, index) => {
      const title = pickCaseTitle(item)
      const description = pickCaseDescription(item)
      const status = getCaseStatusLabel(item.status)
      const dueDate = formatDate(pickCaseDueDate(item))

      return [
        `${index + 1}．${title}`,
        `内容：${description || '未入力'}`,
        `現状：${status}`,
        `次アクション：未入力`,
        `注意点：期限 ${dueDate}`,
      ].join('\n')
    })
    .join('\n\n')
}

function buildAutoTasksText(tasks: RawTaskRow[], caseTitleMap: Map<string, string | null>) {
  if (tasks.length === 0) {
    return '未完了タスクはありません。'
  }

  return tasks
    .map((item, index) => {
      const caseTitle = item.case_id ? (caseTitleMap.get(item.case_id) ?? '未設定') : '物件直下'
      return [
        `${index + 1}．${item.title || '無題タスク'}`,
        `状況：${getTaskStatusLabel(item.status)}`,
        `優先度：${getPriorityLabel(item.priority)}`,
        `期限：${formatDate(item.due_date)}`,
        `案件：${caseTitle}`,
      ].join('\n')
    })
    .join('\n\n')
}

function buildAutoComplaintsText(complaints: RawComplaintRow[]) {
  if (complaints.length === 0) {
    return 'クレーム履歴はありません。'
  }

  return complaints
    .map((item, index) => {
      return [
        `${index + 1}．${item.title || item.category || '無題クレーム'}`,
        `内容：${item.content || '未入力'}`,
        `状況：${item.status || '未設定'}`,
        `発生日：${formatDate(item.created_at)}`,
      ].join('\n')
    })
    .join('\n\n')
}

export default async function NewHandoverPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const selectedPropertyId = params?.propertyId ?? ''
  const errorMessage = params?.error ? decodeURIComponent(params.error) : ''

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data: propertiesData } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const properties = (propertiesData ?? []) as PropertyRow[]
  const selectedPropertyName =
    properties.find((item) => item.id === selectedPropertyId)?.name ?? ''

  let autoCasesText = '物件を選択すると、自動で表示されます。'
  let autoTasksText = '物件を選択すると、自動で表示されます。'
  let autoComplaintsText = '物件を選択すると、自動で表示されます。'

  if (selectedPropertyId) {
    const [{ data: casesData }, { data: tasksData }, { data: complaintsData }] =
      await Promise.all([
        supabase
          .from('cases')
          .select('*')
          .eq('company_id', companyId)
          .eq('property_id', selectedPropertyId)
          .neq('status', 'done')
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('id, title, status, priority, due_date, created_at, case_id')
          .eq('company_id', companyId)
          .eq('property_id', selectedPropertyId)
          .neq('status', 'done')
          .order('created_at', { ascending: false }),
        supabase
          .from('complaints')
          .select('id, title, category, content, created_at, status')
          .eq('company_id', companyId)
          .eq('property_id', selectedPropertyId)
          .order('created_at', { ascending: false }),
      ])

    const activeCases = (casesData ?? []) as RawCaseRow[]
    const unfinishedTasks = (tasksData ?? []) as RawTaskRow[]
    const complaints = (complaintsData ?? []) as RawComplaintRow[]

    const caseTitleMap = new Map<string, string | null>()
    for (const item of activeCases) {
      caseTitleMap.set(item.id, pickCaseTitle(item))
    }

    autoCasesText = buildAutoCasesText(activeCases)
    autoTasksText = buildAutoTasksText(unfinishedTasks, caseTitleMap)
    autoComplaintsText = buildAutoComplaintsText(complaints)
  }

  const basicInfoTemplate = `物件名：${selectedPropertyName}
所在地：
総戸数：
築年数：`

  const managementSystemTemplate = `担当フロント：
管理員：
勤務時間：`

  const boardInfoTemplate = `【理事会】
開催頻度：
開催曜日・時間：
主な開催場所：

【総会】
開催時期：
会場：
議案傾向：`

  const scheduleTemplate = `〇月：
〇月：
〇月：
〇月：`

  const rulesTemplate = `ゴミ出しルール：
駐車場ルール：
ペット：
特記事項：
クレームが多い住戸：
要注意人物：`

  const directorsTemplate = `理事長：
連絡手段：
副理事長：
傾向：
理事長：
理事会：`

  const vendorsTemplate = `清掃会社：
設備点検：
消防設備：
よく使う業者：`

  const historyTemplate = `【過去トラブル・履歴】
騒音問題：
漏水事故：
管理費滞納：

【自動取得：クレーム履歴】
${autoComplaintsText}`

  const cautionsTemplate = `理事長との関係性：
クレーム対応の傾向：
今後の慎重対応事項：`

  const tasksTemplate = `【手入力の引き継ぎタスク】
進行中案件の状況説明
理事長への後任紹介
各業者への担当変更連絡
データ（議事録・契約書等）の共有

【自動取得：進行中案件】
${autoCasesText}

【自動取得：未完了タスク】
${autoTasksText}`

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">引き継ぎDX</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">引き継ぎ書を作成</h1>
            <p className="mt-2 text-sm text-slate-600">
              物件を選ぶと、進行中案件・未完了タスク・クレーム履歴を自動で差し込みます。
            </p>
          </div>

          <Link
            href="/handover-documents"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            引き継ぎ一覧へ戻る
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">保存エラー</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      <form action={createHandoverAction} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">対象物件</h2>
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              物件を選択
            </label>
            <select
              name="property_id"
              defaultValue={selectedPropertyId}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              required
            >
              <option value="">選択してください</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name || '無題物件'}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <Link
              href={selectedPropertyId ? `/handover-documents/new?propertyId=${selectedPropertyId}` : '/handover-documents/new'}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              この物件で再読込
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">1．基本情報</h2>
          <textarea
            name="basic_info"
            defaultValue={basicInfoTemplate}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">2．管理体制</h2>
          <textarea
            name="management_system"
            defaultValue={managementSystemTemplate}
            rows={5}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">3．理事会・総会関係</h2>
          <textarea
            name="board_info"
            defaultValue={boardInfoTemplate}
            rows={10}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">5．年間スケジュール</h2>
          <textarea
            name="schedule"
            defaultValue={scheduleTemplate}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">6．重要ルール・ローカルルール</h2>
          <textarea
            name="rules"
            defaultValue={rulesTemplate}
            rows={8}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">7．理事長・役員情報</h2>
          <textarea
            name="directors"
            defaultValue={directorsTemplate}
            rows={8}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">8．業者関係</h2>
          <textarea
            name="vendors"
            defaultValue={vendorsTemplate}
            rows={7}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">9．過去トラブル・履歴</h2>
          <textarea
            name="history"
            defaultValue={historyTemplate}
            rows={14}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">10．注意事項</h2>
          <textarea
            name="cautions"
            defaultValue={cautionsTemplate}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">11．引き継ぎタスク</h2>
          <textarea
            name="tasks"
            defaultValue={tasksTemplate}
            rows={22}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">13．備考</h2>
          <textarea
            name="note"
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            placeholder="その他、特記事項があれば記載"
          />
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            保存する
          </button>
        </div>
      </form>
    </div>
  )
}