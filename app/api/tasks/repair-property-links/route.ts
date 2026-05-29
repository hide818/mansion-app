import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type CaseRow = {
  id: string
  property_id: string | null
}

type TaskRow = {
  id: string
  case_id: string | null
  property_id: string | null
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('id, property_id')
      .eq('company_id', companyId)

    if (casesError) {
      return NextResponse.json(
        { error: `cases の取得に失敗しました: ${casesError.message}` },
        { status: 500 }
      )
    }

    const cases = (casesData ?? []) as CaseRow[]

    const casePropertyMap = new Map<string, string>()
    for (const item of cases) {
      if (item.id && item.property_id) {
        casePropertyMap.set(item.id, item.property_id)
      }
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, case_id, property_id')
      .eq('company_id', companyId)

    if (tasksError) {
      return NextResponse.json(
        { error: `tasks の取得に失敗しました: ${tasksError.message}` },
        { status: 500 }
      )
    }

    const tasks = (tasksData ?? []) as TaskRow[]

    const targets = tasks.filter((task) => {
      if (task.property_id) return false
      if (!task.case_id) return false
      return casePropertyMap.has(task.case_id)
    })

    let updatedCount = 0

    for (const task of targets) {
      const propertyId = task.case_id ? casePropertyMap.get(task.case_id) : null
      if (!propertyId) continue

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ property_id: propertyId })
        .eq('id', task.id)
        .eq('company_id', companyId)

      if (updateError) {
        return NextResponse.json(
          {
            error: `task ${task.id} の更新に失敗しました: ${updateError.message}`,
          },
          { status: 500 }
        )
      }

      updatedCount += 1
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `タスク紐づけ補正が完了しました。更新件数: ${updatedCount}件`,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました。'

    return NextResponse.json(
      { error: `補正中に予期しないエラーが発生しました: ${message}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'このAPIは POST で呼び出してください。',
    },
    { status: 405 }
  )
}