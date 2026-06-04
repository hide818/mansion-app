import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export type AssigneeRisk = {
  assigneeId: string | null
  assigneeName: string
  overdueTaskCount: number
  staleCaseCount: number
  openComplaintCount: number
  total: number
  riskLevel: 'critical' | 'warning' | 'ok'
}

export type StaleCaseItem = {
  id: string
  title: string
  propertyName: string
  assigneeName: string
  staleDays: number
  href: string
}

export type HandoverMissingProperty = {
  id: string
  name: string
  href: string
}

export type RiskSummaryResponse = {
  overdueTaskTotal: number
  staleCaseTotal: number
  openComplaintTotal: number
  handoverMissingCount: number
  assigneeRisks: AssigneeRisk[]
  staleCaseRanking: StaleCaseItem[]
  handoverMissingProperties: HandoverMissingProperty[]
}

const TASK_DONE = new Set(['done', 'closed', '完了', 'completed'])
const CASE_DONE = new Set(['done', 'closed', '完了', 'completed'])
const COMPLAINT_RESOLVED = new Set(['解決', '完了', '対応完了', 'closed', 'done', 'completed'])
const STALE_DAYS = 14

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const companyId = await getUserCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: '会社情報が取得できません。' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const [taskRes, caseRes, complaintRes, propertyRes, handoverRes, profileRes, logRes] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, due_date, assigned_to, property_id, case_id')
          .eq('company_id', companyId)
          .not('due_date', 'is', null)
          .lt('due_date', todayStr)
          .limit(500),
        supabase
          .from('cases')
          .select('id, title, status, assigned_to, property_id, updated_at, created_at')
          .eq('company_id', companyId)
          .limit(500),
        supabase
          .from('complaints')
          .select('id, title, status, property_id, assigned_to')
          .eq('company_id', companyId)
          .limit(500),
        supabase
          .from('properties')
          .select('id, name')
          .eq('company_id', companyId),
        supabase
          .from('handover_documents')
          .select('property_id')
          .eq('company_id', companyId),
        supabase
          .from('profiles')
          .select('id, display_name')
          .eq('company_id', companyId),
        supabase
          .from('logs')
          .select('case_id, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1000),
      ])

    const propMap = new Map<string, string>()
    for (const p of propertyRes.data ?? []) {
      propMap.set(p.id as string, (p.name as string | null) ?? '不明な物件')
    }

    const profileMap = new Map<string, string>()
    for (const p of profileRes.data ?? []) {
      profileMap.set(p.id as string, (p.display_name as string | null) ?? '名前未設定')
    }

    // 最終ログ日をcase_idで引く
    const latestLogMap = new Map<string, string>()
    for (const log of logRes.data ?? []) {
      const cid = log.case_id as string | null
      const ca = log.created_at as string | null
      if (cid && ca && !latestLogMap.has(cid)) {
        latestLogMap.set(cid, ca)
      }
    }

    // 期限切れタスク（未完了のみ）
    const overdueTasks = (taskRes.data ?? []).filter(
      (t) => !TASK_DONE.has(t.status as string ?? '')
    )

    // 停滞案件（未完了 + 14日以上更新なし）
    const staleCases = (caseRes.data ?? []).filter((c) => {
      if (CASE_DONE.has(c.status as string ?? '')) return false
      const lastActivity = latestLogMap.get(c.id as string) ?? c.updated_at ?? c.created_at
      return daysSince(lastActivity as string | null) >= STALE_DAYS
    })

    // 未解決クレーム
    const openComplaints = (complaintRes.data ?? []).filter(
      (c) => !COMPLAINT_RESOLVED.has(c.status as string ?? '')
    )

    // 引き継ぎ書未整備物件
    const handoverPropertyIds = new Set(
      (handoverRes.data ?? []).map((h) => h.property_id as string)
    )
    const handoverMissingProperties: HandoverMissingProperty[] = (propMap
      ? Array.from(propMap.entries())
      : []
    )
      .filter(([id]) => !handoverPropertyIds.has(id))
      .slice(0, 10)
      .map(([id, name]) => ({
        id,
        name,
        href: `/properties/${id}/ai-property-handover`,
      }))

    // 担当者ごとに集計
    const assigneeMap = new Map<
      string,
      { overdueTask: number; staleCase: number; openComplaint: number }
    >()

    const getOrCreate = (key: string) => {
      if (!assigneeMap.has(key)) {
        assigneeMap.set(key, { overdueTask: 0, staleCase: 0, openComplaint: 0 })
      }
      return assigneeMap.get(key)!
    }

    for (const t of overdueTasks) {
      const key = (t.assigned_to as string | null) ?? '__unassigned__'
      getOrCreate(key).overdueTask += 1
    }
    for (const c of staleCases) {
      const key = (c.assigned_to as string | null) ?? '__unassigned__'
      getOrCreate(key).staleCase += 1
    }
    for (const c of openComplaints) {
      const key = (c.assigned_to as string | null) ?? '__unassigned__'
      getOrCreate(key).openComplaint += 1
    }

    const assigneeRisks: AssigneeRisk[] = Array.from(assigneeMap.entries())
      .map(([key, counts]) => {
        const total = counts.overdueTask + counts.staleCase + counts.openComplaint
        const riskLevel: AssigneeRisk['riskLevel'] =
          total >= 10 ? 'critical' : total >= 3 ? 'warning' : 'ok'
        return {
          assigneeId: key === '__unassigned__' ? null : key,
          assigneeName:
            key === '__unassigned__'
              ? '担当未設定'
              : (profileMap.get(key) ?? key),
          overdueTaskCount: counts.overdueTask,
          staleCaseCount: counts.staleCase,
          openComplaintCount: counts.openComplaint,
          total,
          riskLevel,
        }
      })
      .sort((a, b) => b.total - a.total)

    // 停滞日数ランキング（上位10件）
    const staleCaseRanking: StaleCaseItem[] = staleCases
      .map((c) => {
        const lastActivity = latestLogMap.get(c.id as string) ?? c.updated_at ?? c.created_at
        const sd = daysSince(lastActivity as string | null)
        const propName = propMap.get(c.property_id as string) ?? '不明な物件'
        const assigneeName =
          c.assigned_to
            ? (profileMap.get(c.assigned_to as string) ?? String(c.assigned_to))
            : '担当未設定'
        return {
          id: c.id as string,
          title: (c.title as string | null) ?? '無題案件',
          propertyName: propName,
          assigneeName,
          staleDays: sd,
          href: c.property_id
            ? `/properties/${c.property_id}/cases/${c.id}`
            : `/cases`,
        }
      })
      .sort((a, b) => b.staleDays - a.staleDays)
      .slice(0, 10)

    const result: RiskSummaryResponse = {
      overdueTaskTotal: overdueTasks.length,
      staleCaseTotal: staleCases.length,
      openComplaintTotal: openComplaints.length,
      handoverMissingCount: handoverMissingProperties.length,
      assigneeRisks,
      staleCaseRanking,
      handoverMissingProperties,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[manager/risk-summary]', error)
    return NextResponse.json({ error: 'リスク集計の取得に失敗しました。' }, { status: 500 })
  }
}
