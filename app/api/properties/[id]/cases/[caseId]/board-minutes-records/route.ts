import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import {
  normalizeBoardMinutesFormattingOptions,
  type BoardMinutesRecordStatus,
  type MeetingType,
} from '@/lib/boardMinutesRecords'

type RouteContext = {
  params: Promise<{
    id: string
    caseId: string
  }>
}

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function resolveCurrentCompanyId(supabase: ServerSupabase) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('ログイン情報が取得できません。')
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profileRow?.company_id) {
    throw new Error('company_id が取得できません。')
  }

  return profileRow.company_id as string
}

function sanitizeSearchText(value: string) {
  return value.replace(/[%(),]/g, ' ').trim()
}

function normalizeMeetingType(value: unknown): MeetingType {
  if (value === 'board' || value === 'general' || value === 'meeting') {
    return value
  }

  return 'board'
}

function normalizeStatus(value: unknown): BoardMinutesRecordStatus {
  if (value === 'final') {
    return 'final'
  }

  return 'draft'
}

async function ensureScopedCase(
  supabase: ServerSupabase,
  companyId: string,
  propertyId: string,
  caseId: string
) {
  const { data: propertyRow, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (propertyError) {
    throw propertyError
  }

  if (!propertyRow) {
    return false
  }

  const { data: caseRow, error: caseError } = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (caseError) {
    throw caseError
  }

  return Boolean(caseRow)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: propertyId, caseId } = await context.params
    const companyId = await resolveCurrentCompanyId(supabase)

    const scoped = await ensureScopedCase(supabase, companyId, propertyId, caseId)

    if (!scoped) {
      return NextResponse.json(
        { error: '対象の物件または案件が見つかりません。' },
        { status: 404 }
      )
    }

    const searchText = sanitizeSearchText(
      request.nextUrl.searchParams.get('q') ?? ''
    )

    let query = supabase
      .from('board_minutes_records')
      .select('*')
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .eq('case_id', caseId)
      .order('updated_at', { ascending: false })
      .limit(100)

    const meetingTypeFilter = request.nextUrl.searchParams.get('meetingType')
    if (
      meetingTypeFilter === 'board' ||
      meetingTypeFilter === 'general' ||
      meetingTypeFilter === 'meeting'
    ) {
      query = query.eq('meeting_type', meetingTypeFilter)
    }

    const statusFilter = request.nextUrl.searchParams.get('status')
    if (statusFilter === 'draft' || statusFilter === 'final') {
      query = query.eq('status', statusFilter)
    }

    if (searchText) {
      query = query.or(
        `meeting_name.ilike.%${searchText}%,minutes_text.ilike.%${searchText}%`
      )
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: '保存済み議事録の取得に失敗しました。', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      records: data ?? [],
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: '保存済み議事録の取得に失敗しました。', detail: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: propertyId, caseId } = await context.params
    const companyId = await resolveCurrentCompanyId(supabase)

    const scoped = await ensureScopedCase(supabase, companyId, propertyId, caseId)

    if (!scoped) {
      return NextResponse.json(
        { error: '対象の物件または案件が見つかりません。' },
        { status: 404 }
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        { error: 'ログイン情報の取得に失敗しました。', detail: userError.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ログイン状態を確認できません。' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const meetingType = normalizeMeetingType(body.meetingType)
    const meetingName =
      typeof body.meetingName === 'string' && body.meetingName.trim()
        ? body.meetingName.trim()
        : null
    const transcriptText =
      typeof body.transcriptText === 'string' && body.transcriptText.trim()
        ? body.transcriptText.trim()
        : null
    const minutesText =
      typeof body.minutesText === 'string' ? body.minutesText.trim() : ''
    const supplementNote =
      typeof body.supplementNote === 'string' && body.supplementNote.trim()
        ? body.supplementNote.trim()
        : null
    const status = normalizeStatus(body.status)
    const formattingOptions = normalizeBoardMinutesFormattingOptions(
      body.formattingOptions
    )
    const preventDuplicate = body.preventDuplicate !== false

    if (!minutesText) {
      return NextResponse.json(
        { error: '議事録本文は必須です。' },
        { status: 400 }
      )
    }

    if (preventDuplicate) {
      let duplicateQuery = supabase
        .from('board_minutes_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('property_id', propertyId)
        .eq('case_id', caseId)
        .eq('meeting_type', meetingType)
        .eq('minutes_text', minutesText)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (meetingName) {
        duplicateQuery = duplicateQuery.eq('meeting_name', meetingName)
      }

      const { data: duplicateRows, error: duplicateError } = await duplicateQuery

      if (duplicateError) {
        return NextResponse.json(
          { error: '重複確認に失敗しました。', detail: duplicateError.message },
          { status: 500 }
        )
      }

      const duplicateRecord =
        Array.isArray(duplicateRows) && duplicateRows.length > 0
          ? duplicateRows[0]
          : null

      if (duplicateRecord) {
        return NextResponse.json({
          record: duplicateRecord,
          alreadyExists: true,
        })
      }
    }

    const { data, error } = await supabase
      .from('board_minutes_records')
      .insert({
        company_id: companyId,
        property_id: propertyId,
        case_id: caseId,
        meeting_type: meetingType,
        meeting_name: meetingName,
        transcript_text: transcriptText,
        minutes_text: minutesText,
        supplement_note: supplementNote,
        formatting_options: formattingOptions,
        status,
        source: 'ai_board_minutes_pro',
        generated_by_ai: true,
        created_by_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: '議事録の保存に失敗しました。', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        record: data,
        alreadyExists: false,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: '議事録の保存に失敗しました。', detail: message },
      { status: 500 }
    )
  }
}