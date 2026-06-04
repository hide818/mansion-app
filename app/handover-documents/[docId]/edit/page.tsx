import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { getUserProfile } from '@/lib/getUserProfile'
import { canEdit } from '@/lib/permissions'

type Props = {
  params: Promise<{
    docId: string
  }>
  searchParams?: Promise<{
    error?: string
  }>
}

type HandoverRow = {
  id: string
  property_id: string | null
  basic_info: string | null
  management_system: string | null
  board_info: string | null
  schedule: string | null
  rules: string | null
  directors: string | null
  vendors: string | null
  history: string | null
  cautions: string | null
  tasks: string | null
  note: string | null
}

function getTemplate(type: string, propertyName = '') {
  switch (type) {
    case 'basic_info':
      return `物件名：${propertyName}
所在地：
総戸数：
築年数：`
    case 'management_system':
      return `担当フロント：
管理員：
勤務時間：`
    case 'board_info':
      return `【理事会】
開催頻度：
開催曜日・時間：
主な開催場所：

【総会】
開催時期：
会場：
議案傾向：`
    case 'schedule':
      return `〇月：
〇月：
〇月：
〇月：`
    case 'rules':
      return `ゴミ出しルール：
駐車場ルール：
ペット：
特記事項：
クレームが多い住戸：
要注意人物：`
    case 'directors':
      return `理事長：
連絡手段：
副理事長：
傾向：
理事長：
理事会：`
    case 'vendors':
      return `清掃会社：
設備点検：
消防設備：
よく使う業者：`
    case 'history':
      return `【過去トラブル・履歴】
騒音問題：
漏水事故：
管理費滞納：`
    case 'cautions':
      return `理事長との関係性：
クレーム対応の傾向：
今後の慎重対応事項：`
    case 'tasks':
      return `【手入力の引き継ぎタスク】
進行中案件の状況説明
理事長への後任紹介
各業者への担当変更連絡
データ（議事録・契約書等）の共有`
    case 'note':
      return `その他、特記事項があれば記載`
    default:
      return ''
  }
}

function withFallback(value: string | null | undefined, template: string) {
  const text = value ?? ''
  return text.trim() ? text : template
}

async function updateHandoverAction(formData: FormData) {
  'use server'

  const currentProfile = await getUserProfile()
  if (!currentProfile || !canEdit(currentProfile.role)) {
    redirect('/handover-documents?error=' + encodeURIComponent('権限がありません'))
  }

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const docId = String(formData.get('doc_id') ?? '').trim()
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

  if (!docId) {
    redirect('/handover-documents')
  }

  if (!basicInfo) {
    redirect(
      `/handover-documents/${docId}/edit?error=${encodeURIComponent('基本情報は必須です')}`,
    )
  }

  const { error } = await supabase
    .from('handover_documents')
    .update({
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
    .eq('id', docId)
    .eq('company_id', companyId)

  if (error) {
    redirect(
      `/handover-documents/${docId}/edit?error=${encodeURIComponent(
        error.message || '更新に失敗しました',
      )}`,
    )
  }

  redirect(`/handover-documents/${docId}?updated=1`)
}

export default async function EditHandoverPage({ params, searchParams }: Props) {
  const { docId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : ''

  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('handover_documents')
    .select(`
      id,
      property_id,
      basic_info,
      management_system,
      board_info,
      schedule,
      rules,
      directors,
      vendors,
      history,
      cautions,
      tasks,
      note
    `)
    .eq('id', docId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">引き継ぎ編集</p>
          <h1 className="mt-1 text-3xl font-bold text-red-700">引き継ぎ書の取得に失敗しました</h1>
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const doc = data as HandoverRow | null

  if (!doc) {
    return notFound()
  }

  let propertyName = ''
  if (doc.property_id) {
    const { data: propertyData } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', doc.property_id)
      .eq('company_id', companyId)
      .maybeSingle()

    propertyName = propertyData?.name ?? ''
  }

  const basicInfoValue = withFallback(doc.basic_info, getTemplate('basic_info', propertyName))
  const managementSystemValue = withFallback(doc.management_system, getTemplate('management_system'))
  const boardInfoValue = withFallback(doc.board_info, getTemplate('board_info'))
  const scheduleValue = withFallback(doc.schedule, getTemplate('schedule'))
  const rulesValue = withFallback(doc.rules, getTemplate('rules'))
  const directorsValue = withFallback(doc.directors, getTemplate('directors'))
  const vendorsValue = withFallback(doc.vendors, getTemplate('vendors'))
  const historyValue = withFallback(doc.history, getTemplate('history'))
  const cautionsValue = withFallback(doc.cautions, getTemplate('cautions'))
  const tasksValue = withFallback(doc.tasks, getTemplate('tasks'))
  const noteValue = withFallback(doc.note, getTemplate('note'))

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">引き継ぎDX</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">引き継ぎ書を編集</h1>
            <p className="mt-2 text-sm text-slate-600">
              保存済みの引き継ぎ書を修正できます。
            </p>
          </div>

          <Link
            href={`/handover-documents/${doc.id}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            詳細へ戻る
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">更新エラー</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      ) : null}

      <form action={updateHandoverAction} className="space-y-6">
        <input type="hidden" name="doc_id" value={doc.id} />
        <input type="hidden" name="property_id" value={doc.property_id ?? ''} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">1．基本情報</h2>
          <textarea
            name="basic_info"
            defaultValue={basicInfoValue}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">2．管理体制</h2>
          <textarea
            name="management_system"
            defaultValue={managementSystemValue}
            rows={5}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">3．理事会・総会関係</h2>
          <textarea
            name="board_info"
            defaultValue={boardInfoValue}
            rows={10}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">5．年間スケジュール</h2>
          <textarea
            name="schedule"
            defaultValue={scheduleValue}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">6．重要ルール・ローカルルール</h2>
          <textarea
            name="rules"
            defaultValue={rulesValue}
            rows={8}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">7．理事長・役員情報</h2>
          <textarea
            name="directors"
            defaultValue={directorsValue}
            rows={8}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">8．業者関係</h2>
          <textarea
            name="vendors"
            defaultValue={vendorsValue}
            rows={7}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">9．過去トラブル・履歴</h2>
          <textarea
            name="history"
            defaultValue={historyValue}
            rows={14}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">10．注意事項</h2>
          <textarea
            name="cautions"
            defaultValue={cautionsValue}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">11．引き継ぎタスク</h2>
          <textarea
            name="tasks"
            defaultValue={tasksValue}
            rows={22}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">13．備考</h2>
          <textarea
            name="note"
            defaultValue={noteValue}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            更新する
          </button>
        </div>
      </form>
    </div>
  )
}