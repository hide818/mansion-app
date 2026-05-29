import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

export type SupportPropertyRow = {
  id: string
  name: string | null
  address: string | null
  company_id: string | null
}

export type SupportCaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  company_id: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_decision_status: string | null
  board_decision_date: string | null
  board_decision_note: string | null
  board_next_action: string | null
}

export type SupportTaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  priority: string | null
  created_at: string | null
  company_id: string | null
}

export type SupportLogRow = {
  id: string
  message: string | null
  created_at: string | null
  type: string | null
  company_id: string | null
}

export type SupportCaseFileRow = {
  id: string
  case_id: string | null
  property_id: string | null
  company_id: string | null
  file_name: string | null
  file_path: string | null
  file_url: string | null
  file_type: string | null
  category: string | null
  note: string | null
  created_at: string | null
}

export type SupportRelatedCaseRow = {
  id: string
  title: string | null
  property_id: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  company_id: string | null
  board_status: string | null
}

export type CaseSupportData = {
  companyId: string
  property: SupportPropertyRow
  caseItem: SupportCaseRow
  tasks: SupportTaskRow[]
  logs: SupportLogRow[]
  caseFiles: SupportCaseFileRow[]
  relatedCases: SupportRelatedCaseRow[]
}

export function formatDate(value: string | null) {
  if (!value) return '未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTime(value: string | null) {
  if (!value) return '未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function daysSince(value: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

async function fetchCaseSupportData(
  propertyId: string,
  caseId: string
): Promise<CaseSupportData | null> {
  const supabase = await createSupabaseServerClient()
  const companyId = await getUserCompanyId()

  if (!companyId) {
    return null
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, company_id')
    .eq('id', propertyId)
    .maybeSingle()

  if (!property) {
    return null
  }

  if (property.company_id && property.company_id !== companyId) {
    return null
  }

  const { data: caseItem } = await supabase
    .from('cases')
    .select(`
      id,
      title,
      property_id,
      status,
      assignee,
      created_at,
      company_id,
      board_status,
      board_scheduled_for,
      board_agenda_title,
      board_decision_status,
      board_decision_date,
      board_decision_note,
      board_next_action
    `)
    .eq('id', caseId)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (!caseItem) {
    return null
  }

  if (caseItem.company_id && caseItem.company_id !== companyId) {
    return null
  }

  const { data: taskRows = [] } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, priority, created_at, company_id')
    .eq('case_id', caseId)
    .eq('property_id', propertyId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false })

  const { data: logRows = [] } = await supabase
    .from('logs')
    .select('id, message, created_at, type, company_id')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  const { data: caseFileRows = [] } = await supabase
    .from('case_files')
    .select(`
      id,
      case_id,
      property_id,
      company_id,
      file_name,
      file_path,
      file_url,
      file_type,
      category,
      note,
      created_at
    `)
    .eq('case_id', caseId)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  const { data: relatedCaseRows = [] } = await supabase
    .from('cases')
    .select(`
      id,
      title,
      property_id,
      status,
      assignee,
      created_at,
      company_id,
      board_status
    `)
    .eq('company_id', companyId)
    .neq('id', caseId)
    .order('created_at', { ascending: false })
    .limit(10)

  const tasks = (taskRows as SupportTaskRow[]).filter((item) => {
    if (!item.company_id) return true
    return item.company_id === companyId
  })

  const logs = (logRows as SupportLogRow[]).filter((item) => {
    if (!item.company_id) return true
    return item.company_id === companyId
  })

  const caseFiles = (caseFileRows as SupportCaseFileRow[]).filter((item) => {
    if (!item.company_id) return true
    return item.company_id === companyId
  })

  const relatedCases = (relatedCaseRows as SupportRelatedCaseRow[]).filter((item) => {
    if (!item.company_id) return true
    return item.company_id === companyId
  })

  return {
    companyId,
    property: property as SupportPropertyRow,
    caseItem: caseItem as SupportCaseRow,
    tasks,
    logs,
    caseFiles,
    relatedCases,
  }
}

export async function getCaseSupportDataOrNull(
  propertyId: string,
  caseId: string
) {
  return fetchCaseSupportData(propertyId, caseId)
}

export async function getCaseSupportData(
  propertyId: string,
  caseId: string
) {
  const data = await fetchCaseSupportData(propertyId, caseId)

  if (!data) {
    notFound()
  }

  return data
}