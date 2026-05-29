import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type BoardReportSetFileInput = {
  case_file_id: string
  sort_order?: number | null
  comment?: string | null
}

type BoardReportSetInput = {
  id?: string
  property_id: string
  case_id: string
  title?: string | null
  mode?: string | null
  progress_text?: string | null
  recent_action_text?: string | null
  next_plan_text?: string | null
  staff_note?: string | null
  decision_text?: string | null
  agenda_title?: string | null
  agenda_body?: string | null
  include_cover_page?: boolean | null
  files?: BoardReportSetFileInput[]
}

function toText(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return fallback
}

function toFileRows(files: BoardReportSetFileInput[] | undefined, boardReportSetId: string) {
  if (!Array.isArray(files)) return []

  return files
    .filter((file) => file && typeof file.case_file_id === 'string' && file.case_file_id.trim() !== '')
    .map((file, index) => ({
      board_report_set_id: boardReportSetId,
      case_file_id: file.case_file_id,
      sort_order:
        typeof file.sort_order === 'number' && Number.isFinite(file.sort_order)
          ? file.sort_order
          : index + 1,
      comment: toText(file.comment),
    }))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId(supabase)

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const caseId = searchParams.get('caseId')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId が必要です。' },
        { status: 400 }
      )
    }

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId が必要です。' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('board_report_sets')
      .select(`
        id,
        company_id,
        property_id,
        case_id,
        title,
        mode,
        progress_text,
        recent_action_text,
        next_plan_text,
        staff_note,
        decision_text,
        agenda_title,
        agenda_body,
        include_cover_page,
        created_at,
        board_report_set_files (
          id,
          board_report_set_id,
          case_file_id,
          sort_order,
          comment,
          created_at
        )
      `)
      .eq('company_id', companyId)
      .eq('property_id', propertyId)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      items: data ?? [],
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId(supabase)

    const body = (await request.json()) as BoardReportSetInput

    if (!body?.property_id) {
      return NextResponse.json(
        { error: 'property_id は必須です。' },
        { status: 400 }
      )
    }

    if (!body?.case_id) {
      return NextResponse.json(
        { error: 'case_id は必須です。' },
        { status: 400 }
      )
    }

    const payload = {
      company_id: companyId,
      property_id: body.property_id,
      case_id: body.case_id,
      title: toText(body.title) ?? '理事会提出セット',
      mode: toText(body.mode) ?? 'report',
      progress_text: toText(body.progress_text),
      recent_action_text: toText(body.recent_action_text),
      next_plan_text: toText(body.next_plan_text),
      staff_note: toText(body.staff_note),
      decision_text: toText(body.decision_text),
      agenda_title: toText(body.agenda_title),
      agenda_body: toText(body.agenda_body),
      include_cover_page: toBoolean(body.include_cover_page, true),
    }

    let boardReportSetId = body.id ?? null

    if (boardReportSetId) {
      const { error: updateError } = await supabase
        .from('board_report_sets')
        .update(payload)
        .eq('id', boardReportSetId)
        .eq('company_id', companyId)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('board_report_sets')
        .insert(payload)
        .select('id')
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        )
      }

      boardReportSetId = inserted.id
    }

    if (!boardReportSetId) {
      return NextResponse.json(
        { error: '保存後のセットIDが取得できませんでした。' },
        { status: 500 }
      )
    }

    const { error: deleteFilesError } = await supabase
      .from('board_report_set_files')
      .delete()
      .eq('board_report_set_id', boardReportSetId)

    if (deleteFilesError) {
      return NextResponse.json(
        { error: deleteFilesError.message },
        { status: 500 }
      )
    }

    const fileRows = toFileRows(body.files, boardReportSetId)

    if (fileRows.length > 0) {
      const { error: insertFilesError } = await supabase
        .from('board_report_set_files')
        .insert(fileRows)

      if (insertFilesError) {
        return NextResponse.json(
          { error: insertFilesError.message },
          { status: 500 }
        )
      }
    }

    const { data: savedItem, error: fetchError } = await supabase
      .from('board_report_sets')
      .select(`
        id,
        company_id,
        property_id,
        case_id,
        title,
        mode,
        progress_text,
        recent_action_text,
        next_plan_text,
        staff_note,
        decision_text,
        agenda_title,
        agenda_body,
        include_cover_page,
        created_at,
        board_report_set_files (
          id,
          board_report_set_id,
          case_file_id,
          sort_order,
          comment,
          created_at
        )
      `)
      .eq('id', boardReportSetId)
      .eq('company_id', companyId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: savedItem,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}