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
    recordId: string
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

async function ensureScopedRecord(
  supabase: ServerSupabase,
  companyId: string,
  propertyId: string,
  caseId: string,
  recordId: string
) {
  const { data, error } = await supabase
    .from('board_minutes_records')
    .select('*')
    .eq('id', recordId)
    .eq('company_id', companyId)
    .eq('property_id', propertyId)
    .eq('case_id', caseId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: propertyId, caseId, recordId } = await context.params
    const companyId = await resolveCurrentCompanyId(supabase)

    const record = await ensureScopedRecord(
      supabase,
      companyId,
      propertyId,
      caseId,
      recordId
    )

    if (!record) {
      return NextResponse.json(
        { error: '保存済み議事録が見つかりません。' },
        { status: 404 }
      )
    }

    return NextResponse.json({ record })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: '保存済み議事録の取得に失敗しました。', detail: message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: propertyId, caseId, recordId } = await context.params
    const companyId = await resolveCurrentCompanyId(supabase)

    const existingRecord = await ensureScopedRecord(
      supabase,
      companyId,
      propertyId,
      caseId,
      recordId
    )

    if (!existingRecord) {
      return NextResponse.json(
        { error: '保存済み議事録が見つかりません。' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const nextMeetingType: MeetingType =
      body.meetingType === 'board' ||
      body.meetingType === 'general' ||
      body.meetingType === 'meeting'
        ? body.meetingType
        : existingRecord.meeting_type

    const nextStatus: BoardMinutesRecordStatus =
      body.status === 'final' || body.status === 'draft'
        ? body.status
        : existingRecord.status

    const nextMeetingName =
      typeof body.meetingName === 'string'
        ? body.meetingName.trim() || null
        : existingRecord.meeting_name

    const nextTranscriptText =
      typeof body.transcriptText === 'string'
        ? body.transcriptText.trim() || null
        : existingRecord.transcript_text

    const nextMinutesText =
      typeof body.minutesText === 'string'
        ? body.minutesText.trim()
        : existingRecord.minutes_text

    const nextSupplementNote =
      typeof body.supplementNote === 'string'
        ? body.supplementNote.trim() || null
        : existingRecord.supplement_note

    if (!nextMinutesText) {
      return NextResponse.json(
        { error: '議事録本文は必須です。' },
        { status: 400 }
      )
    }

    const nextFormattingOptions =
      body.formattingOptions === undefined
        ? existingRecord.formatting_options
        : normalizeBoardMinutesFormattingOptions(body.formattingOptions)

    const { data, error } = await supabase
      .from('board_minutes_records')
      .update({
        meeting_type: nextMeetingType,
        meeting_name: nextMeetingName,
        transcript_text: nextTranscriptText,
        minutes_text: nextMinutesText,
        supplement_note: nextSupplementNote,
        formatting_options: nextFormattingOptions,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .eq('case_id', caseId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: '議事録の更新に失敗しました。', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ record: data })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: '議事録の更新に失敗しました。', detail: message },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: propertyId, caseId, recordId } = await context.params
    const companyId = await resolveCurrentCompanyId(supabase)

    const existingRecord = await ensureScopedRecord(
      supabase,
      companyId,
      propertyId,
      caseId,
      recordId
    )

    if (!existingRecord) {
      return NextResponse.json(
        { error: '保存済み議事録が見つかりません。' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('board_minutes_records')
      .delete()
      .eq('id', recordId)
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .eq('case_id', caseId)

    if (error) {
      return NextResponse.json(
        { error: '議事録の削除に失敗しました。', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: '議事録の削除に失敗しました。', detail: message },
      { status: 500 }
    )
  }
}