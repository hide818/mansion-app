import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getUserCompanyId } from '@/lib/getUserCompanyId'

type PropertyRow = {
  id: string
  name: string | null
  address: string | null
  company_id: string | null
}

type CaseRow = {
  id: string
  title: string | null
  status: string | null
  assignee: string | null
  created_at: string | null
  property_id: string | null
  company_id: string | null
  board_status: string | null
  board_scheduled_for: string | null
  board_agenda_title: string | null
  board_decision_status: string | null
  board_decision_date: string | null
  board_decision_note: string | null
  board_next_action: string | null
}

type TaskRow = {
  id: string
  title: string | null
  status: string | null
  due_date: string | null
  created_at: string | null
  priority: string | null
}

type LogRow = {
  id: string
  message: string | null
  created_at: string | null
  type: string | null
}

type FileRow = {
  id: string
  file_name: string | null
  file_type: string | null
  category: string | null
  note: string | null
  created_at: string | null
}

export type CaseDocumentBaseData = {
  property: PropertyRow
  caseItem: CaseRow
  tasks: TaskRow[]
  logs: LogRow[]
  files: FileRow[]
}

function hasText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0
}

function safeText(value: string | null | undefined, fallback = '未設定') {
  if (hasText(value)) return String(value).trim()
  return fallback
}

function toDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function diffDaysFromToday(value: string | null | undefined) {
  const date = toDate(value)
  if (!date) return null

  const today = startOfToday()
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  const diffMs = target.getTime() - today.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function daysSince(value: string | null | undefined) {
  const date = toDate(value)
  if (!date) return null

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '未設定'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
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

function getOpenTasks(tasks: TaskRow[]) {
  return tasks.filter((task) => task.status !== '完了')
}

function getOverdueTasks(tasks: TaskRow[]) {
  return tasks.filter((task) => {
    if (task.status === '完了') return false
    const diff = diffDaysFromToday(task.due_date)
    return diff !== null && diff < 0
  })
}

function getDueSoonTasks(tasks: TaskRow[]) {
  return tasks.filter((task) => {
    if (task.status === '完了') return false
    const diff = diffDaysFromToday(task.due_date)
    return diff !== null && diff >= 0 && diff <= 7
  })
}

function getRecentLogs(logs: LogRow[]) {
  return logs.slice(0, 5)
}

function getRecentFiles(files: FileRow[]) {
  return files.slice(0, 8)
}

function summarizeOpenTasks(tasks: TaskRow[]) {
  const openTasks = getOpenTasks(tasks)

  if (openTasks.length === 0) {
    return '未完了タスクはありません。'
  }

  return openTasks
    .slice(0, 5)
    .map((task, index) => {
      return `${index + 1}. ${safeText(task.title)} / 期限: ${formatDate(task.due_date)} / 優先度: ${safeText(task.priority)} / 状況: ${safeText(task.status)}`
    })
    .join('\n')
}

function summarizeRecentLogs(logs: LogRow[]) {
  const recentLogs = getRecentLogs(logs)

  if (recentLogs.length === 0) {
    return '直近ログはありません。'
  }

  return recentLogs
    .map((log, index) => {
      return `${index + 1}. ${formatDateTime(log.created_at)} / ${safeText(log.message)}`
    })
    .join('\n')
}

function summarizeFiles(files: FileRow[]) {
  const recentFiles = getRecentFiles(files)

  if (recentFiles.length === 0) {
    return '添付資料はありません。'
  }

  return recentFiles
    .map((file, index) => {
      return `${index + 1}. ${safeText(file.file_name)} / 種別: ${safeText(file.category)} / メモ: ${safeText(file.note, 'なし')}`
    })
    .join('\n')
}

function getLatestLogDate(logs: LogRow[], caseCreatedAt: string | null) {
  const latestLog = logs[0]
  return latestLog?.created_at ?? caseCreatedAt
}

function getRiskScore(data: CaseDocumentBaseData) {
  let score = 0
  const reasons: string[] = []

  const openTasks = getOpenTasks(data.tasks)
  const overdueTasks = getOverdueTasks(data.tasks)
  const dueSoonTasks = getDueSoonTasks(data.tasks)
  const lastUpdateDays = daysSince(
    getLatestLogDate(data.logs, data.caseItem.created_at)
  )

  if (!hasText(data.caseItem.assignee)) {
    score += 2
    reasons.push('担当者が未設定です。')
  }

  if (overdueTasks.length >= 1) {
    score += 2
    reasons.push(`期限切れタスクが${overdueTasks.length}件あります。`)
  }

  if (openTasks.length >= 5) {
    score += 1
    reasons.push(`未完了タスクが${openTasks.length}件あり、整理が必要です。`)
  }

  if (lastUpdateDays !== null && lastUpdateDays >= 14) {
    score += 2
    reasons.push(`直近更新から${lastUpdateDays}日経過しています。`)
  }

  if (dueSoonTasks.length >= 2) {
    score += 1
    reasons.push(`7日以内期限のタスクが${dueSoonTasks.length}件あります。`)
  }

  if (
    hasText(data.caseItem.board_scheduled_for) &&
    diffDaysFromToday(data.caseItem.board_scheduled_for) !== null &&
    (diffDaysFromToday(data.caseItem.board_scheduled_for) as number) <= 14
  ) {
    score += 1
    reasons.push('理事会上程日が近く、事前準備が必要です。')
  }

  if (data.files.length === 0) {
    score += 1
    reasons.push('添付資料が未登録です。')
  }

  return {
    score,
    reasons,
  }
}

function getTemperatureLabel(score: number) {
  if (score >= 5) return '炎上'
  if (score >= 2) return '注意'
  return '平和'
}

export async function getCaseDocumentBaseData(params: {
  propertyId: string
  caseId: string
}): Promise<CaseDocumentBaseData | null> {
  const companyId = await getUserCompanyId()
  if (!companyId) return null

  const supabase = await createSupabaseServerClient()

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name, address, company_id')
    .eq('id', params.propertyId)
    .eq('company_id', companyId)
    .single()

  if (propertyError || !property) {
    return null
  }

  const { data: caseItem, error: caseError } = await supabase
    .from('cases')
    .select(
      'id, title, status, assignee, created_at, property_id, company_id, board_status, board_scheduled_for, board_agenda_title, board_decision_status, board_decision_date, board_decision_note, board_next_action'
    )
    .eq('id', params.caseId)
    .eq('property_id', params.propertyId)
    .single()

  if (caseError || !caseItem) {
    return null
  }

  if (caseItem.company_id && caseItem.company_id !== companyId) {
    return null
  }

  const [{ data: tasks }, { data: logs }, { data: files }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at, priority')
      .eq('case_id', params.caseId)
      .eq('company_id', companyId)
      .order('due_date', { ascending: true }),
    supabase
      .from('logs')
      .select('id, message, created_at, type')
      .eq('case_id', params.caseId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('case_files')
      .select('id, file_name, file_type, category, note, created_at')
      .eq('case_id', params.caseId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ])

  return {
    property,
    caseItem,
    tasks: tasks ?? [],
    logs: logs ?? [],
    files: files ?? [],
  }
}

export function buildAgendaDraft(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const agendaTitle = safeText(
    data.caseItem.board_agenda_title,
    `${caseTitle}に関する件`
  )
  const boardStatus = safeText(data.caseItem.board_status)
  const scheduledFor = formatDate(data.caseItem.board_scheduled_for)
  const currentStatus = safeText(data.caseItem.status)
  const assignee = safeText(data.caseItem.assignee, '担当未設定')
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '理事会での方向性確認後、必要な対応を進める。'
  )

  return `【議案タイトル】
${agendaTitle}

【物件名】
${propertyName}

【案件名】
${caseTitle}

【案件の現状】
本案件は「${currentStatus}」の状態です。
担当は「${assignee}」です。
理事会関連ステータスは「${boardStatus}」、上程予定は「${scheduledFor}」です。

【これまでの主な対応】
${summarizeRecentLogs(data.logs)}

【未完了タスク】
${summarizeOpenTasks(data.tasks)}

【理事会で確認・決定したいこと】
1. 本件について、現時点の対応方針で進めてよいか
2. 必要に応じて、見積取得・業者手配・住民周知の進め方をどうするか
3. 追加対応が必要な場合、どの範囲まで承認を取るか

【添付候補資料】
${summarizeFiles(data.files)}

【理事会後の想定アクション】
${nextAction}`
}

export function buildMinutesDraft(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const agendaTitle = safeText(
    data.caseItem.board_agenda_title,
    `${caseTitle}に関する件`
  )
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '決定内容に基づき、管理会社にて次対応を進める。'
  )

  return `【議題】
${agendaTitle}

【議事録ドラフト本文】
議長の指名により管理会社から、「${propertyName}」における「${caseTitle}」について説明がなされた。
管理会社から、現在の状況、これまでの対応経過、及び今後想定される対応について報告がなされた。
主な対応経過は以下のとおりである。
${summarizeRecentLogs(data.logs)}

また、現在残っている未完了タスクは以下のとおりである。
${summarizeOpenTasks(data.tasks)}

その後、出席者により協議が行われ、必要に応じて資料確認、今後の進め方、承認の要否等について意見交換がなされた。
議長が承認を諮ったところ、【承認 / 条件付き承認 / 継続審議】とする方向で整理された。
今後は、${nextAction}

【決定事項メモ】
・ここに正式な決定内容を追記
・ここに条件や補足を追記

【次回までの宿題】
・見積取得の要否確認
・関係者への連絡
・必要資料の整備`
}

export function buildHandoverReport(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const currentStatus = safeText(data.caseItem.status)
  const assignee = safeText(data.caseItem.assignee, '担当未設定')
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '案件の状況を確認し、未完了タスクから優先対応する。'
  )

  return `【引き継ぎ対象物件】
${propertyName}

【引き継ぎ対象案件】
${caseTitle}

【現在の状況】
本案件の現在ステータスは「${currentStatus}」です。
直近の担当者は「${assignee}」です。
理事会関連の状況は「${safeText(data.caseItem.board_status)}」です。

【まず把握してほしいこと】
1. 直近の対応履歴
${summarizeRecentLogs(data.logs)}

2. 未完了タスク
${summarizeOpenTasks(data.tasks)}

3. 添付資料
${summarizeFiles(data.files)}

【注意点】
・案件の最新状況は、直近ログの内容を優先して確認してください。
・期限が近いタスクから先に処理してください。
・理事会提出予定がある場合は、上程時期を見落とさないでください。

【次にやること】
${nextAction}

【引き継ぎ時の一言】
案件の概要把握は「直近ログ → 未完了タスク → 添付資料」の順で見ると早いです。`
}

export function buildVendorRequest(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const agendaTitle = safeText(
    data.caseItem.board_agenda_title,
    caseTitle
  )

  return `件名：${propertyName} ${agendaTitle} に関する見積ご依頼

いつもお世話になっております。
${propertyName}管理担当です。

表題の件につきまして、下記内容にてご対応可否および概算見積のご確認をお願いいたします。

【対象物件】
${propertyName}

【案件名】
${caseTitle}

【ご依頼内容】
・現地確認の可否
・対応可能な工事 / 作業内容
・概算見積または正式見積のご提示
・対応可能時期のご教示

【現在把握している状況】
${summarizeRecentLogs(data.logs)}

【参考情報】
未完了タスク：
${summarizeOpenTasks(data.tasks)}

添付候補資料：
${summarizeFiles(data.files)}

お手数をおかけしますが、ご確認のほどよろしくお願いいたします。`
}

export function buildExpectedQuestions(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const currentStatus = safeText(data.caseItem.status)
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '理事会で方向性確認後に具体対応を進める予定です。'
  )

  return `【理事会想定質問シート】
物件名：${propertyName}
案件名：${caseTitle}

Q1. なぜ今この案件を理事会で取り上げる必要があるのか
A1. 現在の案件ステータスは「${currentStatus}」であり、今後の進め方や承認の要否を整理する必要があるためです。

Q2. ここまでどんな対応をしてきたのか
A2.
${summarizeRecentLogs(data.logs)}

Q3. まだ残っている作業は何か
A3.
${summarizeOpenTasks(data.tasks)}

Q4. 添付資料や見積は何があるのか
A4.
${summarizeFiles(data.files)}

Q5. 理事会で決めてもらいたいことは何か
A5. 今後の進め方、必要な見積取得・業者手配の範囲、住民周知の要否などです。

Q6. 理事会後の次アクションは何か
A6. ${nextAction}`
}

export function buildOneLineStatus(data: CaseDocumentBaseData) {
  const caseTitle = safeText(data.caseItem.title)
  const currentStatus = safeText(data.caseItem.status)
  const openTaskCount = getOpenTasks(data.tasks).length
  const recentLog = getRecentLogs(data.logs)[0]

  const recentLogText = recentLog?.message
    ? recentLog.message.trim()
    : '直近ログなし'

  return `${caseTitle}は現在「${currentStatus}」。未完了タスクは${openTaskCount}件で、直近対応は「${recentLogText}」です。`
}

export function buildNextActionMemo(data: CaseDocumentBaseData) {
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '未完了タスクと直近ログを確認し、優先度の高いものから対応する。'
  )
  const openTasks = getOpenTasks(data.tasks)

  const topTask =
    openTasks.length > 0
      ? `${safeText(openTasks[0].title)}（期限: ${formatDate(openTasks[0].due_date)} / 優先度: ${safeText(openTasks[0].priority)}）`
      : '未完了タスクなし'

  return `【次にやること】
1. 最優先タスク
${topTask}

2. 推奨アクション
${nextAction}

3. 確認ポイント
・直近ログの更新内容
・添付資料の有無
・理事会上程予定の有無`
}

export function buildSimpleExplanation(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const currentStatus = safeText(data.caseItem.status)
  const boardStatus = safeText(data.caseItem.board_status)

  return `【案件のかんたん説明】
この案件は「${propertyName}」の「${caseTitle}」に関するものです。
現在のステータスは「${currentStatus}」で、理事会関係の状況は「${boardStatus}」です。
これまでの対応履歴と未完了タスクを整理しながら、必要に応じて理事会確認や業者対応へつなげる案件です。`
}

export function buildManagerToneMemo(data: CaseDocumentBaseData) {
  const propertyName = safeText(data.property.name)
  const caseTitle = safeText(data.caseItem.title)
  const currentStatus = safeText(data.caseItem.status)
  const assignee = safeText(data.caseItem.assignee, '担当未設定')
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '未完了タスクと直近ログを踏まえ、優先度順に対応予定です。'
  )

  return `【上司共有用メモ】
物件名：${propertyName}
案件名：${caseTitle}
現在ステータス：${currentStatus}
担当者：${assignee}

直近の対応状況は以下のとおりです。
${summarizeRecentLogs(data.logs)}

未完了タスクは以下のとおりです。
${summarizeOpenTasks(data.tasks)}

今後は、${nextAction}`
}

export function buildFileSummary(data: CaseDocumentBaseData) {
  return `【添付資料まとめ】
${summarizeFiles(data.files)}`
}

export function buildEstimateCheckMemo(data: CaseDocumentBaseData) {
  const estimateFiles = data.files.filter((file) => file.category === 'estimate')

  if (estimateFiles.length === 0) {
    return `【見積確認メモ】
現在、estimate 区分の資料は登録されていません。
必要に応じて、案件詳細ページから見積書PDFや関連資料を追加してください。`
  }

  const lines = estimateFiles
    .slice(0, 5)
    .map((file, index) => {
      return `${index + 1}. ${safeText(file.file_name)} / メモ: ${safeText(file.note, 'なし')}`
    })
    .join('\n')

  return `【見積確認メモ】
現在登録されている見積関連資料は以下のとおりです。
${lines}

確認ポイント
・工事項目の抜け漏れがないか
・保証内容の記載があるか
・比較対象が足りているか`
}

export function buildCoverageCheckMemo(data: CaseDocumentBaseData) {
  const openTasks = getOpenTasks(data.tasks)
  const overdueTasks = getOverdueTasks(data.tasks)
  const dueSoonTasks = getDueSoonTasks(data.tasks)
  const lastUpdateDays = daysSince(
    getLatestLogDate(data.logs, data.caseItem.created_at)
  )

  const lines = [
    `1. 担当者設定：${hasText(data.caseItem.assignee) ? 'OK' : '要確認（担当未設定）'}`,
    `2. 直近ログ：${data.logs.length > 0 ? `OK（最新は${formatDateTime(data.logs[0].created_at)}）` : '要確認（ログ未登録）'}`,
    `3. 未完了タスク：${openTasks.length > 0 ? `OK（${openTasks.length}件）` : '要確認（未完了タスクなし）'}`,
    `4. 期限切れタスク：${overdueTasks.length === 0 ? 'OK' : `要対応（${overdueTasks.length}件）`}`,
    `5. 近日期限タスク：${dueSoonTasks.length === 0 ? 'OK' : `注意（7日以内に${dueSoonTasks.length}件）`}`,
    `6. 添付資料：${data.files.length > 0 ? `OK（${data.files.length}件）` : '要確認（資料なし）'}`,
    `7. 理事会予定：${hasText(data.caseItem.board_scheduled_for) ? `確認済み（${formatDate(data.caseItem.board_scheduled_for)}）` : '未設定'}`,
    `8. 最終更新日数：${lastUpdateDays === null ? '不明' : `${lastUpdateDays}日前`}`,
  ].join('\n')

  return `【対応抜けチェックシート】
案件名：${safeText(data.caseItem.title)}
物件名：${safeText(data.property.name)}

${lines}`
}

export function buildCoverageFixMemo(data: CaseDocumentBaseData) {
  const overdueTasks = getOverdueTasks(data.tasks)
  const dueSoonTasks = getDueSoonTasks(data.tasks)
  const lines: string[] = []

  if (!hasText(data.caseItem.assignee)) {
    lines.push('・担当者を設定してください。')
  }

  if (data.logs.length === 0) {
    lines.push('・最低1件はログを登録してください。')
  }

  if (overdueTasks.length > 0) {
    lines.push(`・期限切れタスク${overdueTasks.length}件を今日中に整理してください。`)
  }

  if (dueSoonTasks.length > 0) {
    lines.push(`・7日以内期限タスク${dueSoonTasks.length}件の優先順位を見直してください。`)
  }

  if (data.files.length === 0) {
    lines.push('・関連資料や写真、見積書があれば添付登録してください。')
  }

  if (!hasText(data.caseItem.board_scheduled_for) && hasText(data.caseItem.board_status)) {
    lines.push('・理事会関係ステータスがあるため、上程予定月の要否を確認してください。')
  }

  if (lines.length === 0) {
    lines.push('・大きな抜けは見当たりません。未完了タスクの消化を優先してください。')
  }

  return `【すぐ直すべきポイント】
${lines.join('\n')}`
}

export function buildAssigneeChangeMemo(data: CaseDocumentBaseData) {
  const latestLog = getRecentLogs(data.logs)[0]
  const nextAction = safeText(
    data.caseItem.board_next_action,
    '未完了タスクの上から順に優先対応してください。'
  )

  return `【担当変更メモ】
物件名：${safeText(data.property.name)}
案件名：${safeText(data.caseItem.title)}
現在ステータス：${safeText(data.caseItem.status)}
現在の担当者表示：${safeText(data.caseItem.assignee, '担当未設定')}
理事会ステータス：${safeText(data.caseItem.board_status)}

【最初に把握すること】
1. 直近の対応内容
${latestLog ? `${formatDateTime(latestLog.created_at)} / ${safeText(latestLog.message)}` : '直近ログなし'}

2. 未完了タスク
${summarizeOpenTasks(data.tasks)}

3. 添付資料
${summarizeFiles(data.files)}

【引き継ぎ後の最初の動き】
${nextAction}`
}

export function buildAssigneeFirstDayChecklist(data: CaseDocumentBaseData) {
  const overdueTasks = getOverdueTasks(data.tasks)
  const dueSoonTasks = getDueSoonTasks(data.tasks)

  return `【担当変更 初日チェックリスト】
1. 直近ログを3件読む
2. 未完了タスクを確認する
3. 期限切れタスク ${overdueTasks.length}件 を優先確認する
4. 7日以内期限タスク ${dueSoonTasks.length}件 を確認する
5. 添付資料を確認する
6. 理事会上程予定 ${hasText(data.caseItem.board_scheduled_for) ? `あり（${formatDate(data.caseItem.board_scheduled_for)}）` : 'なし / 未設定'}
7. 次にやることを1つ決めてログを残す`
}

export function buildBoardJudgementMemo(data: CaseDocumentBaseData) {
  const overdueTasks = getOverdueTasks(data.tasks).length
  const hasBoardDate = hasText(data.caseItem.board_scheduled_for)
  const hasAgendaTitle = hasText(data.caseItem.board_agenda_title)
  const hasEstimate = data.files.some((file) => file.category === 'estimate')
  const hasReport = data.files.some((file) => file.category === 'report')
  const openTasks = getOpenTasks(data.tasks).length

  let judgement = '継続監視'
  const reasons: string[] = []

  if (hasBoardDate || hasAgendaTitle) {
    judgement = '上程準備を進める'
    reasons.push('理事会上程の情報がすでに入っています。')
  }

  if (hasEstimate || hasReport) {
    if (judgement !== '上程準備を進める') {
      judgement = '上程候補'
    }
    reasons.push('理事会説明に使える資料が登録されています。')
  }

  if (overdueTasks >= 1 || openTasks >= 4) {
    if (judgement === '継続監視') {
      judgement = '理事会確認を検討'
    }
    reasons.push('案件が長引く可能性があり、理事会判断が有効です。')
  }

  if (reasons.length === 0) {
    reasons.push('現時点では理事会提出の決め手が弱く、まず実務対応を進める段階です。')
  }

  return `【理事会提出判断メモ】
判定：${judgement}

【理由】
${reasons.map((reason, index) => `${index + 1}. ${reason}`).join('\n')}

【案件状況】
・理事会ステータス：${safeText(data.caseItem.board_status)}
・上程予定：${formatDate(data.caseItem.board_scheduled_for)}
・議案タイトル：${safeText(data.caseItem.board_agenda_title, '未設定')}
・未完了タスク：${openTasks}件
・期限切れタスク：${overdueTasks}件`
}

export function buildBoardSubmissionChecklist(data: CaseDocumentBaseData) {
  const hasEstimate = data.files.some((file) => file.category === 'estimate')
  const hasPhoto = data.files.some((file) => file.category === 'photo')
  const hasReport = data.files.some((file) => file.category === 'report')

  return `【理事会提出前チェック】
1. 議案タイトル：${hasText(data.caseItem.board_agenda_title) ? 'OK' : '未設定'}
2. 上程予定日：${hasText(data.caseItem.board_scheduled_for) ? `OK（${formatDate(data.caseItem.board_scheduled_for)}）` : '未設定'}
3. 見積資料：${hasEstimate ? 'あり' : 'なし'}
4. 写真資料：${hasPhoto ? 'あり' : 'なし'}
5. 報告資料：${hasReport ? 'あり' : 'なし'}
6. 未完了タスク整理：${getOpenTasks(data.tasks).length === 0 ? '済み' : `未完了 ${getOpenTasks(data.tasks).length}件`}
7. 説明用メモ：案件文書系ページで作成してください`
}

export function buildFutureTaskDraft(data: CaseDocumentBaseData) {
  const dueSoonTasks = getDueSoonTasks(data.tasks)
  const boardDate = formatDate(data.caseItem.board_scheduled_for)
  const suggestions: string[] = []

  suggestions.push(`1. 直近ログ確認タスク / 期限: 今日 / 理由: 案件の最新状況を把握するため`)
  suggestions.push(`2. 未完了タスク整理 / 期限: 明日 / 理由: 優先順位の再確認を行うため`)

  if (hasText(data.caseItem.board_scheduled_for)) {
    suggestions.push(`3. 理事会提出資料確認 / 期限: ${boardDate} の前営業日 / 理由: 上程準備を間に合わせるため`)
  } else {
    suggestions.push(`3. 理事会提出要否の確認 / 期限: 今週中 / 理由: 理事会判断が必要か整理するため`)
  }

  if (data.files.some((file) => file.category === 'estimate')) {
    suggestions.push(`4. 見積比較の確認 / 期限: 今週中 / 理由: 次判断に必要な材料を揃えるため`)
  } else {
    suggestions.push(`4. 見積取得の要否確認 / 期限: 今週中 / 理由: 次アクションを具体化するため`)
  }

  if (dueSoonTasks.length > 0) {
    suggestions.push(`5. 近日期限タスクの前倒し対応 / 期限: 3日以内 / 理由: 期限直前の詰まりを防ぐため`)
  } else {
    suggestions.push(`5. 関係者共有ログの追加 / 期限: 3日以内 / 理由: 属人化を防ぐため`)
  }

  return `【未来タスクたたき台】
${suggestions.join('\n')}`
}

export function buildTodayActionMemo(data: CaseDocumentBaseData) {
  const overdueTasks = getOverdueTasks(data.tasks)
  const dueSoonTasks = getDueSoonTasks(data.tasks)
  const latestLog = getRecentLogs(data.logs)[0]

  const firstAction =
    overdueTasks[0]?.title ??
    dueSoonTasks[0]?.title ??
    data.caseItem.board_next_action ??
    '直近ログ確認'

  return `【今日やること】
1. 最優先
${safeText(firstAction)}

2. 今日見るもの
・最新ログ：${latestLog ? safeText(latestLog.message) : 'ログなし'}
・期限切れタスク：${overdueTasks.length}件
・7日以内期限タスク：${dueSoonTasks.length}件

3. 今日中に残したい記録
・対応結果をログに1件残す
・次にやることを1行で残す`
}

export function buildRiskTemperatureReport(data: CaseDocumentBaseData) {
  const risk = getRiskScore(data)
  const temperature = getTemperatureLabel(risk.score)

  const reasons =
    risk.reasons.length > 0
      ? risk.reasons.map((reason, index) => `${index + 1}. ${reason}`).join('\n')
      : '大きな注意点は見当たりません。'

  return `【案件リスク・温度感レポート】
リスクスコア：${risk.score}
温度感：${temperature}

【判定理由】
${reasons}

【基本情報】
・案件ステータス：${safeText(data.caseItem.status)}
・担当者：${safeText(data.caseItem.assignee, '担当未設定')}
・未完了タスク：${getOpenTasks(data.tasks).length}件
・期限切れタスク：${getOverdueTasks(data.tasks).length}件
・添付資料：${data.files.length}件`
}

export function buildRiskActionMemo(data: CaseDocumentBaseData) {
  const risk = getRiskScore(data)
  const temperature = getTemperatureLabel(risk.score)
  const lines: string[] = []

  if (temperature === '炎上') {
    lines.push('・今日中に期限切れタスクと担当者設定を見直してください。')
    lines.push('・理事会または上司確認が必要か判断してください。')
    lines.push('・ログを追加して現状を見える化してください。')
  } else if (temperature === '注意') {
    lines.push('・未完了タスクの優先順位を整理してください。')
    lines.push('・直近ログが古い場合は更新してください。')
    lines.push('・必要資料の不足があれば追加してください。')
  } else {
    lines.push('・大きな火種はありません。')
    lines.push('・次アクションを1つ進め、ログを残してください。')
  }

  return `【おすすめアクション】
${lines.join('\n')}`
}