import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import AiMinutesRecordsListClient from '../../components/AiMinutesRecordsListClient'

type RecordRow = {
  id: string
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
  minutes: string | null
  created_at: string | null
  source_record_id: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

export default async function AiMinutesRecordsPage() {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  const { data, error } = await supabase
    .from('ai_minutes_records')
    .select(`
      id,
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
      minutes,
      created_at,
      source_record_id
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    throw new Error(`保存済み議事録一覧の取得に失敗しました: ${error.message}`)
  }

  const rows = (data ?? []) as RecordRow[]

  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (propertiesError) {
    throw new Error(`物件名の取得に失敗しました: ${propertiesError.message}`)
  }

  const properties = ((propertiesData ?? []) as PropertyRow[]).map((property) => ({
    id: property.id,
    name: property.name ?? '物件名未設定',
  }))

  const propertyNameMap = new Map(
    properties.map((property) => [property.id, property.name]),
  )

  const records = rows.map((row) => ({
    id: row.id,
    propertyId: row.property_id,
    propertyName: propertyNameMap.get(row.property_id) ?? '物件名未設定',
    meetingType: row.meeting_type,
    title: row.title ?? '',
    officialTitle: row.official_title ?? '',
    heldOn: row.held_on,
    meetingNumber: row.meeting_number ?? '',
    termLabel: row.term_label ?? '',
    meetingTerm: row.meeting_term ?? '',
    meetingRound: row.meeting_round ?? '',
    meetingPlace: row.meeting_place ?? '',
    attendeesText: row.attendees_text ?? '',
    chairpersonName: row.chairperson_name ?? '',
    bylawsArticle: row.bylaws_article ?? '',
    signatureDate: row.signature_date,
    managementCompanyDisplay: row.management_company_display ?? '',
    minutesLayoutType: row.minutes_layout_type ?? 'standard',
    minutes: row.minutes ?? '',
    createdAt: row.created_at,
    versionType: row.source_record_id ? ('derived' as const) : ('original' as const),
    sourceRecordId: row.source_record_id,
  }))

  return (
    <AiMinutesRecordsListClient
      initialRecords={records}
      properties={properties}
    />
  )
}