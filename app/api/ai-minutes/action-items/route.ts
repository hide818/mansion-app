import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { isValidUuid } from '@/lib/isValidUuid'

type ActionItemPayload = {
  title: string
  description: string
  createType: 'task' | 'case'
}

type RequestPayload = {
  propertyId: string
  sourceMinutesRecordId?: string
  items: ActionItemPayload[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { propertyId, sourceMinutesRecordId, items } =
      (await request.json()) as RequestPayload

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId は必須です。' },
        { status: 400 },
      )
    }

    if (!isValidUuid(propertyId)) {
      return NextResponse.json(
        { error: 'propertyId の形式が不正です。' },
        { status: 400 },
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items は1件以上必要です。' },
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
      .select('id, company_id')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (propertyError) {
      return NextResponse.json(
        { error: '対象物件の確認に失敗しました。', detail: propertyError.message },
        { status: 500 },
      )
    }

    if (!property) {
      return NextResponse.json(
        { error: '対象物件が見つかりません。' },
        { status: 404 },
      )
    }

    if (sourceMinutesRecordId) {
      const { data: sourceRecord, error: sourceError } = await supabase
        .from('ai_minutes_records')
        .select('id, company_id')
        .eq('id', sourceMinutesRecordId)
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

    const caseRows = items
      .filter((item) => item.createType === 'case')
      .map((item) => ({
        company_id: companyId,
        property_id: propertyId,
        title: item.title?.trim() || '議事録由来案件',
        description: item.description?.trim() || '',
        status: '未着手',
        created_by: user.id,
        source_minutes_record_id: sourceMinutesRecordId || null,
      }))

    const taskRows = items
      .filter((item) => item.createType === 'task')
      .map((item) => ({
        company_id: companyId,
        property_id: propertyId,
        title: item.title?.trim() || '議事録由来タスク',
        description: item.description?.trim() || '',
        status: '未着手',
        created_by: user.id,
        source_minutes_record_id: sourceMinutesRecordId || null,
      }))

    if (caseRows.length > 0) {
      const { error: casesError } = await supabase.from('cases').insert(caseRows)

      if (casesError) {
        return NextResponse.json(
          { error: '案件追加に失敗しました。', detail: casesError.message },
          { status: 500 },
        )
      }
    }

    if (taskRows.length > 0) {
      const { error: tasksError } = await supabase.from('tasks').insert(taskRows)

      if (tasksError) {
        return NextResponse.json(
          { error: 'タスク追加に失敗しました。', detail: tasksError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      createdCases: caseRows.length,
      createdTasks: taskRows.length,
      propertyId,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: '案件・タスク追加中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}