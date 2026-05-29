import { formatDateTime } from '@/lib/boardMinutesRecords'

export type CommandCenterPriority = '高' | '中' | '低'
export type CommandCenterRiskLevel = '低' | '中' | '高'
export type CommandCenterTemperature = '平和' | '注意' | '炎上'
export type CommandCenterBoardLevel = '不要' | '検討' | '推奨'

export type CommandCenterActionItem = {
  title: string
  detail: string
  priority: CommandCenterPriority
  dueHint: string
}

export type CommandCenterTimelineItem = {
  label: string
  detail: string
  happenedAt: string
  kind: 'case' | 'task' | 'log' | 'complaint'
}

export type CommandCenterDocuments = {
  handoverReport: string
  boardReportDraft: string
  supervisorShortReport: string
  residentReplyDraft: string
  vendorRequestDraft: string
}

export type CommandCenterPayload = {
  caseMeta: {
    caseTitle: string
    caseStatus: string
    caseCategory: string
    casePriority: string
    dueDate: string
    updatedAt: string
  }
  currentSummary: string
  risk: {
    score: number
    level: CommandCenterRiskLevel
    reasons: string[]
  }
  temperature: CommandCenterTemperature
  counts: {
    openTasks: number
    overdueTasks: number
    dueSoonTasks: number
    complaintCount: number
    daysSinceUpdate: number | null
    daysSinceRecentLog: number | null
  }
  nextActions: CommandCenterActionItem[]
  alerts: CommandCenterActionItem[]
  missingChecks: string[]
  stakeholderNotes: string[]
  boardRecommendation: {
    level: CommandCenterBoardLevel
    reason: string
    recommendedAgendaTitle: string
    expectedQuestions: string[]
  }
  timeline: CommandCenterTimelineItem[]
  documents: CommandCenterDocuments
  generatedAt: string
}

type GenericRow = Record<string, unknown>

type NormalizedCase = {
  title: string
  status: string
  category: string
  priority: string
  dueDate: string
  updatedAt: string
  createdAt: string
  description: string
}

type NormalizedTask = {
  title: string
  status: string
  priority: string
  dueDate: string
  updatedAt: string
  createdAt: string
}

type NormalizedLog = {
  summary: string
  type: string
  createdAt: string
}

type NormalizedComplaint = {
  title: string
  status: string
  createdAt: string
}

function pickString(row: GenericRow | null | undefined, keys: string[]) {
  if (!row) return ''

  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function pickDateString(row: GenericRow | null | undefined, keys: string[]) {
  if (!row) return ''

  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function toDayStartTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function getDaysSince(value: string) {
  const target = toDayStartTime(value)
  if (target === null) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.floor((today.getTime() - target) / (1000 * 60 * 60 * 24))
}

function isOpenStatus(value: string) {
  const normalized = value.trim().toLowerCase()

  if (!normalized) return true

  return ![
    'done',
    'completed',
    'complete',
    'closed',
    'resolved',
    'finished',
    '完了',
    '完結',
    '解決',
    '終了',
    'closed_won',
  ].includes(normalized)
}

function getPriorityRank(value: string) {
  const normalized = value.trim().toLowerCase()

  if (
    normalized.includes('高') ||
    normalized.includes('urgent') ||
    normalized.includes('critical')
  ) {
    return 3
  }

  if (
    normalized.includes('中') ||
    normalized.includes('normal') ||
    normalized.includes('medium')
  ) {
    return 2
  }

  return 1
}

function normalizeCase(row: GenericRow): NormalizedCase {
  return {
    title: pickString(row, ['title', 'name', 'case_title']),
    status: pickString(row, ['status']),
    category: pickString(row, ['category', 'type']),
    priority: pickString(row, ['priority']),
    dueDate: pickDateString(row, ['due_date', 'deadline']),
    updatedAt: pickDateString(row, ['updated_at']),
    createdAt: pickDateString(row, ['created_at']),
    description: pickString(row, ['description', 'body', 'memo', 'notes']),
  }
}

function normalizeTask(row: GenericRow): NormalizedTask {
  return {
    title: pickString(row, ['title', 'name', 'task_title']),
    status: pickString(row, ['status']),
    priority: pickString(row, ['priority']),
    dueDate: pickDateString(row, ['due_date', 'deadline']),
    updatedAt: pickDateString(row, ['updated_at']),
    createdAt: pickDateString(row, ['created_at']),
  }
}

function normalizeLog(row: GenericRow): NormalizedLog {
  return {
    summary: pickString(row, ['content', 'detail', 'message', 'note', 'title']),
    type: pickString(row, ['type', 'category']),
    createdAt: pickDateString(row, ['created_at', 'updated_at']),
  }
}

function normalizeComplaint(row: GenericRow): NormalizedComplaint {
  return {
    title: pickString(row, ['title', 'name', 'content', 'detail']),
    status: pickString(row, ['status']),
    createdAt: pickDateString(row, ['created_at', 'updated_at']),
  }
}

function formatDueHint(value: string) {
  if (!value) return '期限未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '期限未設定'
  }

  return `期限: ${new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)}`
}

function buildRiskLevel(score: number): CommandCenterRiskLevel {
  if (score >= 70) return '高'
  if (score >= 35) return '中'
  return '低'
}

function buildTemperature(score: number): CommandCenterTemperature {
  if (score >= 70) return '炎上'
  if (score >= 35) return '注意'
  return '平和'
}

function limitStrings(items: string[], max = 6) {
  return items.filter(Boolean).slice(0, max)
}

function buildDocuments(input: {
  caseData: NormalizedCase
  openTasks: NormalizedTask[]
  overdueTasks: NormalizedTask[]
  complaints: NormalizedComplaint[]
  nextActions: CommandCenterActionItem[]
  alerts: CommandCenterActionItem[]
  missingChecks: string[]
  boardLevel: CommandCenterBoardLevel
  boardReason: string
  agendaTitle: string
}) {
  const caseTitle = input.caseData.title || '案件名未設定'
  const currentStatus = input.caseData.status || '未設定'
  const openTaskCount = input.openTasks.length
  const overdueCount = input.overdueTasks.length
  const complaintCount = input.complaints.length

  const nextActionLines =
    input.nextActions.length > 0
      ? input.nextActions.map((item) => `・${item.title}（${item.detail}）`).join('\n')
      : '・次アクションなし'

  const alertLines =
    input.alerts.length > 0
      ? input.alerts.map((item) => `・${item.title}（${item.detail}）`).join('\n')
      : '・目立った注意点なし'

  const missingCheckLines =
    input.missingChecks.length > 0
      ? input.missingChecks.map((item) => `・${item}`).join('\n')
      : '・目立った抜け漏れ候補なし'

  const complaintLines =
    input.complaints.length > 0
      ? input.complaints
          .slice(0, 5)
          .map((item) => `・${item.title || 'クレーム記録あり'}`)
          .join('\n')
      : '・クレーム記録なし'

  const handoverReport = [
    `【案件名】`,
    `${caseTitle}`,
    ``,
    `【現在の状況】`,
    `本案件は「${currentStatus || '未設定'}」の状態であり、未完了タスクは ${openTaskCount} 件、うち期限切れは ${overdueCount} 件です。`,
    complaintCount > 0
      ? `また、関連クレームが ${complaintCount} 件確認されているため、関係者対応には注意が必要です。`
      : `現時点で大きなクレーム記録は見当たりません。`,
    ``,
    `【次にやること】`,
    nextActionLines,
    ``,
    `【注意点】`,
    alertLines,
    ``,
    `【確認漏れ防止】`,
    missingCheckLines,
  ].join('\n')

  const boardReportDraft = [
    `管理会社から、${caseTitle} について現状報告を行う。`,
    `本案件は現在「${currentStatus || '未設定'}」であり、未完了タスクは ${openTaskCount} 件、期限切れタスクは ${overdueCount} 件である。`,
    complaintCount > 0
      ? `なお、関連クレームが ${complaintCount} 件確認されており、対応経過の共有が必要な状況である。`
      : `なお、現時点では重大なクレーム記録は確認されていない。`,
    `今後の主な対応予定は以下のとおりである。`,
    nextActionLines,
    ``,
    `議案化判断: ${input.boardLevel}`,
    `理由: ${input.boardReason}`,
    input.boardLevel === '不要'
      ? `本件は現時点では理事会報告必須までは至らないが、進行状況の変化に応じて再判断する。`
      : `理事会での共有候補議案名は「${input.agendaTitle}」とする。`,
  ].join('\n')

  const supervisorShortReport = [
    `${caseTitle} の件、現状は「${currentStatus || '未設定'}」です。`,
    `未完了タスク ${openTaskCount} 件、期限切れ ${overdueCount} 件、関連クレーム ${complaintCount} 件です。`,
    `直近の対応優先は以下のとおりです。`,
    nextActionLines,
  ].join('\n')

  const residentReplyDraft = [
    `お世話になっております。`,
    `ご連絡いただいております ${caseTitle} の件につきまして、現在対応状況の確認及び関係先との調整を進めております。`,
    overdueCount > 0
      ? `一部、対応期限を意識して進めるべき事項があるため、優先的に整理を進めております。`
      : `現時点では、必要な確認を順次進めております。`,
    `進捗があり次第、改めてご報告申し上げますので、今しばらくお待ちくださいますようお願いいたします。`,
  ].join('\n')

  const vendorRequestDraft = [
    `お世話になっております。`,
    `${caseTitle} の件につきまして、下記内容の確認及び対応可否をご教示ください。`,
    ``,
    alertLines,
    ``,
    `また、今後の対応予定時期が分かりましたら、あわせてご連絡をお願いいたします。`,
    `何卒よろしくお願いいたします。`,
  ].join('\n')

  return {
    handoverReport,
    boardReportDraft,
    supervisorShortReport,
    residentReplyDraft,
    vendorRequestDraft,
  }
}

export function buildHeuristicCommandCenter(args: {
  caseRow: GenericRow
  taskRows: GenericRow[]
  logRows: GenericRow[]
  complaintRows: GenericRow[]
}): CommandCenterPayload {
  const caseData = normalizeCase(args.caseRow)
  const tasks = args.taskRows.map(normalizeTask)
  const logs = args.logRows.map(normalizeLog)
  const complaints = args.complaintRows.map(normalizeComplaint)

  const openTasks = tasks.filter((task) => isOpenStatus(task.status))
  const overdueTasks = openTasks.filter((task) => {
    const days = getDaysSince(task.dueDate)
    return days !== null && days > 0
  })
  const dueSoonTasks = openTasks.filter((task) => {
    const dueTime = toDayStartTime(task.dueDate)
    if (dueTime === null) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diff = Math.floor((dueTime - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7
  })

  const daysSinceUpdate = getDaysSince(caseData.updatedAt)
  const sortedLogs = [...logs].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return timeB - timeA
  })
  const recentLog = sortedLogs[0]
  const daysSinceRecentLog = recentLog ? getDaysSince(recentLog.createdAt) : null

  let riskScore = 0
  const riskReasons: string[] = []

  if (overdueTasks.length > 0) {
    riskScore += Math.min(overdueTasks.length * 18, 36)
    riskReasons.push(`期限切れタスクが ${overdueTasks.length} 件あります。`)
  }

  if (dueSoonTasks.length > 0) {
    riskScore += Math.min(dueSoonTasks.length * 6, 18)
    riskReasons.push(`期限が近いタスクが ${dueSoonTasks.length} 件あります。`)
  }

  if (complaints.length > 0) {
    riskScore += Math.min(complaints.length * 12, 36)
    riskReasons.push(`関連クレームが ${complaints.length} 件あります。`)
  }

  if (daysSinceUpdate !== null && daysSinceUpdate >= 14) {
    riskScore += 14
    riskReasons.push(`案件更新から ${daysSinceUpdate} 日経過しています。`)
  }

  if (daysSinceRecentLog === null) {
    riskScore += 12
    riskReasons.push('対応ログが見当たりません。')
  } else if (daysSinceRecentLog >= 14) {
    riskScore += 10
    riskReasons.push(`直近ログから ${daysSinceRecentLog} 日経過しています。`)
  }

  if (openTasks.length === 0) {
    riskScore += 8
    riskReasons.push('未完了タスクが登録されておらず、次対応が曖昧です。')
  }

  if (!caseData.dueDate) {
    riskScore += 6
    riskReasons.push('案件期限が未設定です。')
  }

  if (!caseData.priority) {
    riskScore += 4
    riskReasons.push('案件優先度が未設定です。')
  }

  riskScore = Math.max(0, Math.min(100, riskScore))

  const riskLevel = buildRiskLevel(riskScore)
  const temperature = buildTemperature(riskScore)

  const nextActions: CommandCenterActionItem[] = []

  for (const task of overdueTasks.slice(0, 3)) {
    nextActions.push({
      title: task.title || '期限切れタスクの対応',
      detail: '期限切れとなっているため、最優先で整理・連絡・実施判断を行う。',
      priority: '高',
      dueHint: formatDueHint(task.dueDate),
    })
  }

  for (const task of dueSoonTasks.slice(0, 2)) {
    nextActions.push({
      title: task.title || '期限接近タスクの前倒し確認',
      detail: '期限が近いため、実施可否と担当者確認を前倒しで行う。',
      priority: getPriorityRank(task.priority) >= 3 ? '高' : '中',
      dueHint: formatDueHint(task.dueDate),
    })
  }

  if (nextActions.length === 0) {
    nextActions.push({
      title: '案件の現状確認',
      detail: '未完了タスクと直近対応履歴を見直し、次の一手を明確化する。',
      priority: riskLevel === '高' ? '高' : '中',
      dueHint: '本日中に確認',
    })
  }

  const alerts: CommandCenterActionItem[] = []

  if (complaints.length > 0) {
    alerts.push({
      title: 'クレーム対応の共有不足に注意',
      detail: '居住者・理事会・業者で認識差が出ないよう、経過共有の文面整理が必要。',
      priority: '高',
      dueHint: '早めに共有',
    })
  }

  if (daysSinceRecentLog === null || (daysSinceRecentLog !== null && daysSinceRecentLog >= 14)) {
    alerts.push({
      title: '対応履歴の空白に注意',
      detail: 'ログ更新が薄く、引き継ぎ事故や説明不足につながるおそれがある。',
      priority: '中',
      dueHint: '本日中に整理',
    })
  }

  if (overdueTasks.length > 0) {
    alerts.push({
      title: '期限超過タスクあり',
      detail: '説明を求められた際に回答できるよう、遅延理由と現対応を整理する。',
      priority: '高',
      dueHint: '即整理',
    })
  }

  const missingChecks: string[] = []

  if (!caseData.priority) {
    missingChecks.push('案件優先度が未設定です。')
  }

  if (!caseData.dueDate) {
    missingChecks.push('案件期限が未設定です。')
  }

  if (openTasks.length === 0) {
    missingChecks.push('未完了タスクが登録されていません。')
  }

  if (logs.length === 0) {
    missingChecks.push('対応ログが未登録です。')
  }

  if (!caseData.category) {
    missingChecks.push('案件カテゴリが未設定です。')
  }

  const stakeholderNotes: string[] = []
  if (complaints.length > 0) {
    stakeholderNotes.push(
      `クレーム起点の案件のため、居住者説明のトーンと進捗共有頻度に注意。`
    )
  }

  if (caseData.category) {
    stakeholderNotes.push(`案件カテゴリは「${caseData.category}」です。`)
  }

  if (caseData.priority) {
    stakeholderNotes.push(`案件優先度は「${caseData.priority}」です。`)
  }

  const boardLevel: CommandCenterBoardLevel =
    complaints.length > 0 || riskScore >= 70
      ? '推奨'
      : riskScore >= 40 || overdueTasks.length > 0
      ? '検討'
      : '不要'

  const boardReason =
    boardLevel === '推奨'
      ? 'クレーム・期限超過・高リスク要素があり、理事会共有の必要性が高い。'
      : boardLevel === '検討'
      ? '期限や進捗面で共有価値があり、理事会議題化を検討できる。'
      : '現時点では担当内整理で進められる可能性が高い。'

  const agendaTitle =
    caseData.title
      ? `${caseData.title} について`
      : '案件進捗報告について'

  const expectedQuestions = limitStrings([
    overdueTasks.length > 0
      ? '期限超過となっている理由と、今後の解消見込みはどうか。'
      : '',
    complaints.length > 0
      ? '居住者・理事会への説明はどこまで済んでいるか。'
      : '',
    caseData.dueDate
      ? '今後のスケジュールはいつまでを見込んでいるか。'
      : '完了目標時期はいつ頃を想定しているか。',
    openTasks.length > 0
      ? '現在残っている未完了タスクは何か。'
      : '今後必要な対応項目は何か。',
    '理事会で承認や判断が必要な論点はあるか。',
  ])

  const currentSummary = [
    `${caseData.title || '本案件'} は現在「${caseData.status || '未設定'}」の状態です。`,
    `未完了タスクは ${openTasks.length} 件、うち期限切れは ${overdueTasks.length} 件です。`,
    complaints.length > 0
      ? `関連クレームは ${complaints.length} 件確認されており、説明対応にも注意が必要です。`
      : `現時点で重大なクレーム記録は見当たりません。`,
    riskLevel === '高'
      ? `総合判断としては高リスクであり、早急な整理と共有が必要です。`
      : riskLevel === '中'
      ? `総合判断としては注意水準であり、進捗確認と抜け漏れ防止が必要です。`
      : `総合判断としては比較的安定していますが、次アクションの明確化は必要です。`,
  ].join(' ')

  const timeline: CommandCenterTimelineItem[] = [
    ...(caseData.updatedAt
      ? [
          {
            label: '案件更新',
            detail: `${caseData.title || '案件'} の更新が行われました。`,
            happenedAt: caseData.updatedAt,
            kind: 'case' as const,
          },
        ]
      : []),
    ...tasks.slice(0, 6).map((task) => ({
      label: task.title || 'タスク',
      detail: `${task.status || '未設定'} / ${task.priority || '優先度未設定'} / ${formatDueHint(
        task.dueDate
      )}`,
      happenedAt: task.updatedAt || task.createdAt,
      kind: 'task' as const,
    })),
    ...logs.slice(0, 6).map((log) => ({
      label: log.type || '対応ログ',
      detail: log.summary || 'ログ記録あり',
      happenedAt: log.createdAt,
      kind: 'log' as const,
    })),
    ...complaints.slice(0, 4).map((complaint) => ({
      label: 'クレーム',
      detail: complaint.title || 'クレーム記録あり',
      happenedAt: complaint.createdAt,
      kind: 'complaint' as const,
    })),
  ]
    .filter((item) => item.happenedAt)
    .sort((a, b) => {
      const timeA = new Date(a.happenedAt).getTime()
      const timeB = new Date(b.happenedAt).getTime()
      return timeB - timeA
    })
    .slice(0, 10)

  const documents = buildDocuments({
    caseData,
    openTasks,
    overdueTasks,
    complaints,
    nextActions,
    alerts,
    missingChecks,
    boardLevel,
    boardReason,
    agendaTitle,
  })

  return {
    caseMeta: {
      caseTitle: caseData.title || '案件名未設定',
      caseStatus: caseData.status || '未設定',
      caseCategory: caseData.category || '未設定',
      casePriority: caseData.priority || '未設定',
      dueDate: caseData.dueDate || '',
      updatedAt: caseData.updatedAt || '',
    },
    currentSummary,
    risk: {
      score: riskScore,
      level: riskLevel,
      reasons: riskReasons.length > 0 ? riskReasons : ['大きな危険要素は見当たりません。'],
    },
    temperature,
    counts: {
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      complaintCount: complaints.length,
      daysSinceUpdate,
      daysSinceRecentLog,
    },
    nextActions,
    alerts,
    missingChecks,
    stakeholderNotes,
    boardRecommendation: {
      level: boardLevel,
      reason: boardReason,
      recommendedAgendaTitle: agendaTitle,
      expectedQuestions,
    },
    timeline,
    documents,
    generatedAt: formatDateTime(new Date().toISOString()),
  }
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function sanitizeActionItemArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  const result: CommandCenterActionItem[] = []

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue
    }

    const row = item as Record<string, unknown>
    const title = typeof row.title === 'string' ? row.title.trim() : ''
    const detail = typeof row.detail === 'string' ? row.detail.trim() : ''
    const dueHint = typeof row.dueHint === 'string' ? row.dueHint.trim() : ''
    const rawPriority =
      typeof row.priority === 'string' ? row.priority.trim() : '中'
    const priority: CommandCenterPriority =
      rawPriority === '高' || rawPriority === '中' || rawPriority === '低'
        ? rawPriority
        : '中'

    if (!title && !detail) {
      continue
    }

    result.push({
      title: title || '未設定',
      detail: detail || '',
      priority,
      dueHint,
    })
  }

  return result
}

function sanitizeDocuments(value: unknown, fallback: CommandCenterDocuments) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback
  }

  const row = value as Record<string, unknown>

  return {
    handoverReport:
      typeof row.handoverReport === 'string' && row.handoverReport.trim()
        ? row.handoverReport.trim()
        : fallback.handoverReport,
    boardReportDraft:
      typeof row.boardReportDraft === 'string' && row.boardReportDraft.trim()
        ? row.boardReportDraft.trim()
        : fallback.boardReportDraft,
    supervisorShortReport:
      typeof row.supervisorShortReport === 'string' &&
      row.supervisorShortReport.trim()
        ? row.supervisorShortReport.trim()
        : fallback.supervisorShortReport,
    residentReplyDraft:
      typeof row.residentReplyDraft === 'string' && row.residentReplyDraft.trim()
        ? row.residentReplyDraft.trim()
        : fallback.residentReplyDraft,
    vendorRequestDraft:
      typeof row.vendorRequestDraft === 'string' && row.vendorRequestDraft.trim()
        ? row.vendorRequestDraft.trim()
        : fallback.vendorRequestDraft,
  }
}

export function extractJsonObject(text: string) {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null
  }

  const sliced = text.slice(firstBrace, lastBrace + 1)

  try {
    return JSON.parse(sliced) as Record<string, unknown>
  } catch {
    return null
  }
}

export function mergeAiCommandCenterPayload(
  base: CommandCenterPayload,
  aiData: unknown
): CommandCenterPayload {
  if (!aiData || typeof aiData !== 'object' || Array.isArray(aiData)) {
    return base
  }

  const row = aiData as Record<string, unknown>

  const nextRisk = row.risk
  let mergedRisk = base.risk

  if (nextRisk && typeof nextRisk === 'object' && !Array.isArray(nextRisk)) {
    const riskRow = nextRisk as Record<string, unknown>
    const score =
      typeof riskRow.score === 'number'
        ? Math.max(0, Math.min(100, Math.round(riskRow.score)))
        : base.risk.score
    const level =
      riskRow.level === '低' || riskRow.level === '中' || riskRow.level === '高'
        ? riskRow.level
        : base.risk.level
    const reasons = sanitizeStringArray(riskRow.reasons)

    mergedRisk = {
      score,
      level,
      reasons: reasons.length > 0 ? reasons : base.risk.reasons,
    }
  }

  const boardRecommendationBase = base.boardRecommendation
  let mergedBoardRecommendation = boardRecommendationBase

  const nextBoard = row.boardRecommendation
  if (nextBoard && typeof nextBoard === 'object' && !Array.isArray(nextBoard)) {
    const boardRow = nextBoard as Record<string, unknown>
    const level =
      boardRow.level === '不要' ||
      boardRow.level === '検討' ||
      boardRow.level === '推奨'
        ? boardRow.level
        : boardRecommendationBase.level
    const reason =
      typeof boardRow.reason === 'string' && boardRow.reason.trim()
        ? boardRow.reason.trim()
        : boardRecommendationBase.reason
    const recommendedAgendaTitle =
      typeof boardRow.recommendedAgendaTitle === 'string' &&
      boardRow.recommendedAgendaTitle.trim()
        ? boardRow.recommendedAgendaTitle.trim()
        : boardRecommendationBase.recommendedAgendaTitle
    const expectedQuestions = sanitizeStringArray(boardRow.expectedQuestions)

    mergedBoardRecommendation = {
      level,
      reason,
      recommendedAgendaTitle,
      expectedQuestions:
        expectedQuestions.length > 0
          ? expectedQuestions
          : boardRecommendationBase.expectedQuestions,
    }
  }

  const mergedNextActions = sanitizeActionItemArray(row.nextActions)
  const mergedAlerts = sanitizeActionItemArray(row.alerts)
  const mergedMissingChecks = sanitizeStringArray(row.missingChecks)
  const mergedStakeholderNotes = sanitizeStringArray(row.stakeholderNotes)

  const mergedTemperature =
    row.temperature === '平和' || row.temperature === '注意' || row.temperature === '炎上'
      ? row.temperature
      : base.temperature

  const mergedCurrentSummary =
    typeof row.currentSummary === 'string' && row.currentSummary.trim()
      ? row.currentSummary.trim()
      : base.currentSummary

  return {
    ...base,
    currentSummary: mergedCurrentSummary,
    risk: mergedRisk,
    temperature: mergedTemperature,
    nextActions: mergedNextActions.length > 0 ? mergedNextActions : base.nextActions,
    alerts: mergedAlerts.length > 0 ? mergedAlerts : base.alerts,
    missingChecks:
      mergedMissingChecks.length > 0 ? mergedMissingChecks : base.missingChecks,
    stakeholderNotes:
      mergedStakeholderNotes.length > 0
        ? mergedStakeholderNotes
        : base.stakeholderNotes,
    boardRecommendation: mergedBoardRecommendation,
    documents: sanitizeDocuments(row.documents, base.documents),
  }
}