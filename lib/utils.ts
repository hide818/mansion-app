// 日付フォーマット
export function formatDate(value: string | null | undefined): string {
  if (!value) return '未設定'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
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

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 日付状態の判定
export function isToday(value: string | null | undefined): boolean {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(date)
  due.setHours(0, 0, 0, 0)
  return due < today
}

export type DueLevel = 'danger' | 'warning' | 'normal' | 'none'

export function getDueLevel(value: string | null | undefined): DueLevel {
  if (!value) return 'none'
  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  due.setHours(0, 0, 0, 0)
  if (due.getTime() <= today.getTime()) return 'danger'
  if (due.getTime() === tomorrow.getTime()) return 'warning'
  return 'normal'
}

// ステータス・優先度ラベル
export function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'todo': return '未着手'
    case 'doing': return '進行中'
    case 'done': return '完了'
    case 'pending': return '保留'
    default: return status ?? '未設定'
  }
}

export function getPriorityLabel(priority: string | null | undefined): string {
  switch (priority) {
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return priority ?? '未設定'
  }
}

export function formatMeetingType(value: string | null | undefined): string {
  if (value === 'general_meeting') return '総会'
  if (value === 'board_meeting') return '理事会'
  return value ?? '議事録'
}

// cases テーブルのカラム名がDBによって異なる問題への対応
// P1b（DBマイグレーション後）に削除予定
type CaseLike = Record<string, unknown>

export function pickCaseTitle(item: CaseLike): string {
  const v = item.title ?? item.name
  return typeof v === 'string' && v ? v : '無題案件'
}

export function pickCaseDueDate(item: CaseLike): string | null {
  const v = item.due_date ?? item.deadline ?? item.due_at ?? item.limit_date
  return typeof v === 'string' ? v : null
}

export function pickCaseDescription(item: CaseLike): string {
  const v = item.overview ?? item.description ?? item.content
  return typeof v === 'string' ? v : ''
}

// DBにどのカラムが存在するか検出する（P1b完了後に削除予定）
const CASE_DATE_FIELDS = ['due_date', 'deadline', 'due_at', 'limit_date'] as const

export function detectCaseDateField(item: CaseLike): string {
  for (const field of CASE_DATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      return field
    }
  }
  return ''
}

// AI レスポンス解析用の共通型
// MultiAiPackClient / PropertyAiPackClient / PropertyAiToolClient で共有
export type AiSection = {
  title?: string
  content?: string
  text?: string
  body?: string
}

export type AiResponseBody = {
  generatedText?: string
  text?: string
  content?: string
  result?: string
  summary?: string
  output?: string
  body?: string
  message?: string
  error?: string
  data?: {
    text?: string
    content?: string
    result?: string
  }
  sections?: AiSection[]
}
