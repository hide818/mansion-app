import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import SavedAiMinutesDetailClient from '@/app/components/SavedAiMinutesDetailClient'

type PageProps = {
  params: Promise<{
    recordId: string
  }>
}

type RecordDetailRow = {
  id: string
  company_id: string
  property_id: string
  meeting_type: string
  title: string | null
  official_title: string | null
  held_on: string | null
  meeting_number: string | null
  term_label: string | null
  meeting_term: string | null
  meeting_round: string | null
  meeting_place: string | null
  attendees_text: string | null
  chairperson_name: string | null
  bylaws_article: string | null
  signature_date: string | null
  management_company_display: string | null
  minutes_layout_type: string | null
  transcript: string | null
  minutes: string | null
  agendas: unknown
  action_items: unknown
  status: string | null
  created_at: string | null
  updated_at: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

type PropertyTemplateRow = {
  signature_person_1: string | null
  signature_person_2: string | null
  show_signature_section: boolean | null
  closing_remarks: string | null
}

export default async function AiMinutesRecordDetailPage({ params }: PageProps) {
  const { recordId } = await params
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('ai_minutes_records')
    .select(`
      id,
      company_id,
      property_id,
      meeting_type,
      title,
      official_title,
      held_on,
      meeting_number,
      term_label,
      meeting_term,
      meeting_round,
      meeting_place,
      attendees_text,
      chairperson_name,
      bylaws_article,
      signature_date,
      management_company_display,
      minutes_layout_type,
      transcript,
      minutes,
      agendas,
      action_items,
      status,
      created_at,
      updated_at
    `)
    .eq('id', recordId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    throw new Error(`保存済み議事録の取得に失敗しました: ${error.message}`)
  }

  if (!data) {
    notFound()
  }

  const row = data as RecordDetailRow

  const { data: propertyData, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', row.property_id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (propertyError) {
    throw new Error(`物件名の取得に失敗しました: ${propertyError.message}`)
  }

  const property = propertyData as PropertyRow | null
  const propertyName = property?.name ?? '物件名未設定'
  const agendas = Array.isArray(row.agendas) ? row.agendas : []
  const actionItems = Array.isArray(row.action_items) ? row.action_items : []

  const { data: templateData } = await supabase
    .from('properties')
    .select('signature_person_1, signature_person_2, show_signature_section, closing_remarks')
    .eq('id', row.property_id)
    .eq('company_id', companyId)
    .maybeSingle<PropertyTemplateRow>()

  const templateSignaturePerson1 = templateData?.signature_person_1 ?? ''
  const templateSignaturePerson2 = templateData?.signature_person_2 ?? ''
  const templateShowSignatureSection = templateData?.show_signature_section ?? true
  const templateClosingRemarks = templateData?.closing_remarks ?? ''

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">議事録AI</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">保存済み議事録詳細</h1>
              <p className="mt-2 text-sm text-gray-600">
                保存した議事録を再確認して、そのまま再編集や文書出力ができます。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ai-minutes"
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                議事録AIへ戻る
              </Link>

              <Link
                href="/ai-minutes/records"
                className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                保存済み一覧へ
              </Link>
            </div>
          </div>
        </div>

        <SavedAiMinutesDetailClient
          recordId={row.id}
          propertyId={row.property_id}
          propertyName={propertyName}
          meetingType={row.meeting_type}
          title={row.title ?? ''}
          officialTitle={row.official_title ?? ''}
          heldOn={row.held_on}
          meetingNumber={row.meeting_number ?? ''}
          termLabel={row.term_label ?? ''}
          meetingTerm={row.meeting_term ?? ''}
          meetingRound={row.meeting_round ?? ''}
          meetingPlace={row.meeting_place ?? ''}
          attendeesText={row.attendees_text ?? ''}
          chairpersonName={row.chairperson_name ?? ''}
          bylawsArticle={row.bylaws_article ?? ''}
          signatureDate={row.signature_date}
          managementCompanyDisplay={row.management_company_display ?? ''}
          minutesLayoutType={row.minutes_layout_type ?? 'standard'}
          transcript={row.transcript ?? ''}
          minutes={row.minutes ?? ''}
          agendas={agendas}
          actionItems={actionItems}
          status={row.status ?? 'draft'}
          createdAt={row.created_at}
          updatedAt={row.updated_at}
          templateSignaturePerson1={templateSignaturePerson1}
          templateSignaturePerson2={templateSignaturePerson2}
          templateShowSignatureSection={templateShowSignatureSection}
          templateClosingRemarks={templateClosingRemarks}
        />
      </div>
    </main>
  )
}