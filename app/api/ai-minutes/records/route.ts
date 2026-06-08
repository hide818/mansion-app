import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { isValidUuid } from '@/lib/isValidUuid'

type SaveAiMinutesPayload = {
  propertyId: string
  meetingType: string
  title?: string
  officialTitle?: string
  heldOn?: string
  meetingNumber?: string
  termLabel?: string
  meetingTerm?: string
  meetingRound?: string
  meetingPlace?: string
  attendeesText?: string
  absenteeText?: string
  chairpersonName?: string
  bylawsArticle?: string
  signatureDate?: string
  managementCompanyDisplay?: string
  minutesLayoutType?: string
  transcript?: string
  minutes: string
  sourceRecordId?: string
  agendas?: Array<{
    title?: string
    body?: string
  }>
  actionItems?: Array<{
    title?: string
    description?: string
    assignee?: string
    dueDate?: string
    type?: string
  }>
}

type RecordListRow = {
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
  absentee_text: string | null
  chairperson_name: string | null
  bylaws_article: string | null
  signature_date: string | null
  management_company_display: string | null
  minutes_layout_type: string | null
  minutes: string | null
  status: string | null
  created_at: string | null
  source_record_id: string | null
}

type PropertyRow = {
  id: string
  name: string | null
}

function normalizeAgendas(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = item as Record<string, unknown>
    return {
      title: typeof row.title === 'string' ? row.title : '',
      body: typeof row.body === 'string' ? row.body : '',
    }
  })
}

function normalizeActionItems(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = item as Record<string, unknown>
    return {
      title: typeof row.title === 'string' ? row.title : '',
      description: typeof row.description === 'string' ? row.description : '',
      assignee: typeof row.assignee === 'string' ? row.assignee : '',
      dueDate: typeof row.dueDate === 'string' ? row.dueDate : '',
      type: typeof row.type === 'string' ? row.type : '',
    }
  })
}

function normalizeHeldOn(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Number(limitParam || '100') || 100, 500)

    let query = supabase
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
        absentee_text,
        chairperson_name,
        bylaws_article,
        signature_date,
        management_company_display,
        minutes_layout_type,
        minutes,
        status,
        created_at,
        source_record_id
      `)
      .eq('company_id', companyId)
      .limit(limit)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: '保存済み議事録一覧の取得に失敗しました。', detail: error.message },
        { status: 500 },
      )
    }

    const rows = (data ?? []) as RecordListRow[]
    const propertyIds = Array.from(
      new Set(rows.map((row) => row.property_id).filter(Boolean)),
    )

    let propertyNameMap = new Map<string, string>()

    if (propertyIds.length > 0) {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId)
        .in('id', propertyIds)

      if (propertiesError) {
        return NextResponse.json(
          { error: '物件名の取得に失敗しました。', detail: propertiesError.message },
          { status: 500 },
        )
      }

      const properties = (propertiesData ?? []) as PropertyRow[]
      propertyNameMap = new Map(
        properties.map((property) => [property.id, property.name ?? '物件名未設定']),
      )
    }

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
      absenteeText: row.absentee_text ?? '',
      chairpersonName: row.chairperson_name ?? '',
      bylawsArticle: row.bylaws_article ?? '',
      signatureDate: row.signature_date,
      managementCompanyDisplay: row.management_company_display ?? '',
      minutesLayoutType: row.minutes_layout_type ?? 'standard',
      minutes: row.minutes ?? '',
      status: row.status ?? 'draft',
      createdAt: row.created_at,
      versionType: row.source_record_id ? 'derived' : 'original',
      sourceRecordId: row.source_record_id,
    }))

    return NextResponse.json({ records })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: '保存済み議事録一覧の取得中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const {
      propertyId,
      meetingType,
      title,
      officialTitle,
      heldOn,
      meetingNumber,
      termLabel,
      meetingTerm,
      meetingRound,
      meetingPlace,
      attendeesText,
      absenteeText,
      chairpersonName,
      bylawsArticle,
      signatureDate,
      managementCompanyDisplay,
      minutesLayoutType,
      transcript,
      minutes,
      sourceRecordId,
      agendas,
      actionItems,
    } = (await request.json()) as SaveAiMinutesPayload

    if (!propertyId || !meetingType || !minutes) {
      return NextResponse.json(
        { error: 'propertyId / meetingType / minutes は必須です。' },
        { status: 400 },
      )
    }

    if (!isValidUuid(propertyId)) {
      return NextResponse.json(
        { error: 'propertyId の形式が不正です。' },
        { status: 400 },
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ログイン情報を確認できませんでした。' },
        { status: 401 },
      )
    }

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, company_id, name')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (propertyError) {
      return NextResponse.json(
        { error: '物件確認に失敗しました。', detail: propertyError.message },
        { status: 500 },
      )
    }

    if (!property) {
      return NextResponse.json(
        { error: '保存対象の物件が見つかりません。' },
        { status: 404 },
      )
    }

    if (sourceRecordId) {
      const { data: sourceRecord, error: sourceError } = await supabase
        .from('ai_minutes_records')
        .select('id, company_id')
        .eq('id', sourceRecordId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (sourceError) {
        return NextResponse.json(
          { error: '元議事録の確認に失敗しました。', detail: sourceError.message },
          { status: 500 },
        )
      }

      if (!sourceRecord) {
        return NextResponse.json(
          { error: '元議事録が見つかりません。' },
          { status: 404 },
        )
      }
    }

    const normalizedOfficialTitle = normalizeText(officialTitle)
    const normalizedTitle =
      normalizeText(title) ||
      normalizedOfficialTitle ||
      `${property.name ?? '物件'} ${meetingType}議事録`

    const insertPayload = {
      company_id: companyId,
      property_id: propertyId,
      meeting_type: meetingType,
      title: normalizedTitle,
      official_title: normalizedOfficialTitle,
      held_on: normalizeHeldOn(heldOn),
      meeting_number: normalizeText(meetingNumber),
      term_label: normalizeText(termLabel),
      meeting_term: normalizeText(meetingTerm),
      meeting_round: normalizeText(meetingRound),
      meeting_place: normalizeText(meetingPlace),
      attendees_text: normalizeText(attendeesText),
      absentee_text: normalizeText(absenteeText),
      chairperson_name: normalizeText(chairpersonName),
      bylaws_article: normalizeText(bylawsArticle),
      signature_date: normalizeHeldOn(signatureDate),
      management_company_display: normalizeText(managementCompanyDisplay),
      minutes_layout_type: normalizeText(minutesLayoutType) || 'standard',
      transcript: typeof transcript === 'string' ? transcript : '',
      minutes,
      agendas: normalizeAgendas(agendas),
      action_items: normalizeActionItems(actionItems),
      status: 'draft',
      created_by: user.id,
      source_record_id: sourceRecordId || null,
    }

    const { data, error } = await supabase
      .from('ai_minutes_records')
      .insert(insertPayload)
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
        absentee_text,
        chairperson_name,
        bylaws_article,
        signature_date,
        management_company_display,
        minutes_layout_type,
        created_at
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: '議事録の保存に失敗しました。', detail: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      record: {
        id: data.id,
        propertyId: data.property_id,
        meetingType: data.meeting_type,
        title: data.title ?? '',
        officialTitle: data.official_title ?? '',
        heldOn: data.held_on,
        meetingNumber: data.meeting_number ?? '',
        termLabel: data.term_label ?? '',
        meetingTerm: data.meeting_term ?? '',
        meetingRound: data.meeting_round ?? '',
        meetingPlace: data.meeting_place ?? '',
        attendeesText: data.attendees_text ?? '',
        absenteeText: data.absentee_text ?? '',
        chairpersonName: data.chairperson_name ?? '',
        bylawsArticle: data.bylaws_article ?? '',
        signatureDate: data.signature_date,
        managementCompanyDisplay: data.management_company_display ?? '',
        minutesLayoutType: data.minutes_layout_type ?? 'standard',
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: '議事録保存中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}