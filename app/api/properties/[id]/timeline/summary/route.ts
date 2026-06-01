import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'
import { generateOpenAIText } from '@/lib/openaiText'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getMeetingTypeLabel(type: string | null): string {
  if (type === 'board_meeting') return '理事会'
  if (type === 'general_meeting') return '総会'
  return type ?? '会議'
}

export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const { id: propertyId } = await context.params
    const supabase = await createSupabaseServerClient()
    const companyId = await getUserCompanyId()

    const { data: property } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', propertyId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (!property) {
      return NextResponse.json({ error: '物件が見つかりません。' }, { status: 404 })
    }

    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [casesRes, tasksRes, complaintsRes, minutesRes] = await Promise.all([
      supabase
        .from('cases')
        .select('id, title, status, created_at, updated_at, overview')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('tasks')
        .select('id, title, status, due_date, created_at')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('complaints')
        .select('id, title, status, category, created_at')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('ai_minutes_records')
        .select('id, title, meeting_type, held_on, created_at')
        .eq('property_id', propertyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const lines: string[] = [
      `物件名: ${property.name ?? '不明'}`,
      `要約基準日: ${today.toISOString().split('T')[0]}`,
      '',
    ]

    const cases = casesRes.data ?? []
    if (cases.length > 0) {
      lines.push('【案件】')
      for (const c of cases) {
        const done = ['done', 'closed', '完了'].includes(c.status ?? '')
        const stagnant = !done && !!c.updated_at && new Date(c.updated_at) < thirtyDaysAgo
        const tag = stagnant ? '【30日停滞】' : ''
        const overview = c.overview ? ` ／ ${String(c.overview).slice(0, 50)}` : ''
        lines.push(
          `- [${c.status ?? '不明'}]${tag} ${c.title ?? '（無題）'}（作成: ${String(c.created_at ?? '').split('T')[0]}）${overview}`,
        )
      }
      lines.push('')
    }

    const tasks = tasksRes.data ?? []
    if (tasks.length > 0) {
      lines.push('【タスク】')
      for (const t of tasks) {
        const done = t.status === 'done'
        const overdue = !done && !!t.due_date && new Date(t.due_date) < today
        const tag = overdue ? '【期限切れ】' : ''
        const due = t.due_date ? `（期限: ${t.due_date}）` : ''
        lines.push(`- [${t.status ?? '不明'}]${tag} ${t.title ?? '（無題）'}${due}`)
      }
      lines.push('')
    }

    const complaints = complaintsRes.data ?? []
    if (complaints.length > 0) {
      lines.push('【クレーム】')
      for (const c of complaints) {
        const cat = c.category ? `（${c.category}）` : ''
        lines.push(
          `- [${c.status ?? '不明'}] ${c.title ?? '（件名なし）'}${cat}（受付: ${String(c.created_at ?? '').split('T')[0]}）`,
        )
      }
      lines.push('')
    }

    const minutesList = minutesRes.data ?? []
    if (minutesList.length > 0) {
      lines.push('【議事録】')
      for (const m of minutesList) {
        const mt = getMeetingTypeLabel(m.meeting_type)
        const date = m.held_on ?? String(m.created_at ?? '').split('T')[0]
        lines.push(`- ${mt} ${date} 「${m.title ?? '（無題）'}」`)
      }
      lines.push('')
    }

    const userPrompt = lines.join('\n')

    const systemPrompt = `あなたは分譲マンション管理会社のフロント担当支援AIです。
物件の対応履歴データを受け取り、以下の形式で日本語で要約してください。

## 直近の主な出来事
（直近3〜5件の重要な出来事を箇条書き）

## 未完了事項
（未完了タスク・進行中案件を箇条書き）

## 注意が必要な案件・タスク
（期限切れ・30日停滞・未対応クレームを明示）

## 次回確認すべきこと
（期限が近いタスクや要対応案件を具体的に）

## 引き継ぎ時のポイント
（担当変更時に伝えるべき事項を3〜5点）

簡潔に実務で使えるレベルで出力してください。`

    const summary = await generateOpenAIText({ systemPrompt, userPrompt })
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('[timeline/summary]', error)
    return NextResponse.json(
      { error: '要約の生成中にエラーが発生しました。' },
      { status: 500 },
    )
  }
}
