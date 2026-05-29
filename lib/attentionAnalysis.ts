export type GenericRow = Record<string, unknown>

function pickString(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function pickDate(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }
  }
  return null
}

function pickBoolean(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'boolean') return value
  }
  return false
}

export function formatDate(value: Date | string | null) {
  if (!value) return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}

export function endOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
}

export function getTaskTitle(task: GenericRow) {
  return (
    pickString(task, ['title', 'name', 'task_name', 'subject']) ||
    'タスク名未設定'
  )
}

export function getTaskStatus(task: GenericRow) {
  return pickString(task, ['status']) || '未設定'
}

export function getCaseTitle(caseRow: GenericRow) {
  return (
    pickString(caseRow, ['title', 'name', 'subject']) ||
    '案件名未設定'
  )
}

export function getPropertyName(property: GenericRow) {
  return (
    pickString(property, ['name', 'property_name', 'title']) ||
    '物件名未設定'
  )
}

export function getTaskDueDate(task: GenericRow) {
  return pickDate(task, ['due_date', 'deadline', 'due_at', 'limit_date'])
}

export function getTaskCreatedAt(task: GenericRow) {
  return pickDate(task, ['created_at'])
}

export function getTaskPriority(task: GenericRow) {
  return pickString(task, ['priority']) || '未設定'
}

export function getTaskPropertyId(task: GenericRow) {
  return pickString(task, ['property_id'])
}

export function getTaskCaseId(task: GenericRow) {
  return pickString(task, ['case_id'])
}

export function getCaseId(caseRow: GenericRow) {
  return pickString(caseRow, ['id'])
}

export function getCasePropertyId(caseRow: GenericRow) {
  return pickString(caseRow, ['property_id'])
}

export function getCaseStatus(caseRow: GenericRow) {
  return pickString(caseRow, ['status']) || '未設定'
}

export function getCaseCreatedAt(caseRow: GenericRow) {
  return pickDate(caseRow, ['created_at'])
}

export function getCaseUpdatedAt(caseRow: GenericRow) {
  return pickDate(caseRow, ['updated_at'])
}

export function getLogCaseId(log: GenericRow) {
  return pickString(log, ['case_id'])
}

export function getLogCreatedAt(log: GenericRow) {
  return pickDate(log, ['created_at', 'logged_at', 'date'])
}

export function isTaskDone(task: GenericRow) {
  if (pickBoolean(task, ['is_done', 'done', 'completed'])) {
    return true
  }

  const status = getTaskStatus(task).toLowerCase()
  return [
    'done',
    'completed',
    'closed',
    'resolved',
    'finished',
    '完了',
    '対応済',
    '解決済',
  ].some((word) => status.includes(word))
}

export function isCaseClosed(caseRow: GenericRow) {
  if (pickBoolean(caseRow, ['is_done', 'done', 'completed'])) {
    return true
  }

  const status = getCaseStatus(caseRow).toLowerCase()
  return [
    'done',
    'completed',
    'closed',
    'finished',
    '完了',
    'クローズ',
    '終了',
  ].some((word) => status.includes(word))
}

export function buildPropertyMap(rows: GenericRow[]) {
  const map = new Map<string, GenericRow>()
  rows.forEach((row) => {
    const id = pickString(row, ['id'])
    if (id) map.set(id, row)
  })
  return map
}

export function buildCaseMap(rows: GenericRow[]) {
  const map = new Map<string, GenericRow>()
  rows.forEach((row) => {
    const id = getCaseId(row)
    if (id) map.set(id, row)
  })
  return map
}

export function makeCaseHref(args: {
  propertyId?: string
  caseId?: string
}) {
  if (!args.propertyId || !args.caseId) return ''
  return `/properties/${args.propertyId}/cases/${args.caseId}`
}

export function diffDaysFromToday(date: Date) {
  const today = startOfToday()
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = target.getTime() - today.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}