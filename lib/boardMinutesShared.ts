import {
  formatDateTime,
  getMeetingTypeLabel,
  normalizeBoardMinutesFormattingOptions,
  type BoardMinutesFormattingOptions,
  type BoardMinutesRecordStatus,
  type MeetingType,
} from '@/lib/boardMinutesRecords'

export const COMPANY_STANDARD_FORMATTING: BoardMinutesFormattingOptions = {
  tone: '議事録定型文調',
  headingStyle: '第◯号議案',
  detailLevel: '標準',
  proseStyle: '流れる文章',
  decisionRule: '各議案の中に自然に入れる',
  phraseRule: '強めの定型文を使う',
}

export type BoardMinutesGenerationResult = {
  minutesTitle: string
  minutesText: string
  actionItems: string[]
  confirmationItems: string[]
  formattingApplied: BoardMinutesFormattingOptions
}

type BuildDocumentInput = {
  meetingType: MeetingType
  meetingName: string
  status: BoardMinutesRecordStatus
  createdAt?: string | null
  updatedAt?: string | null
  minutesText: string
  supplementNote?: string | null
  transcriptText?: string | null
}

export function getPropertyFormattingStorageKey(propertyId: string) {
  return `board-minutes-formatting:${propertyId}`
}

export function mergeBoardMinutesFormattingOptions(
  value: unknown
): BoardMinutesFormattingOptions {
  const normalized = normalizeBoardMinutesFormattingOptions(value)

  return {
    tone: normalized?.tone || COMPANY_STANDARD_FORMATTING.tone,
    headingStyle:
      normalized?.headingStyle || COMPANY_STANDARD_FORMATTING.headingStyle,
    detailLevel:
      normalized?.detailLevel || COMPANY_STANDARD_FORMATTING.detailLevel,
    proseStyle: normalized?.proseStyle || COMPANY_STANDARD_FORMATTING.proseStyle,
    decisionRule:
      normalized?.decisionRule || COMPANY_STANDARD_FORMATTING.decisionRule,
    phraseRule: normalized?.phraseRule || COMPANY_STANDARD_FORMATTING.phraseRule,
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function extractSectionItemsFromText(text: string, titles: string[]) {
  const normalizedLines = text
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.trim())

  const matchedTitleIndex = normalizedLines.findIndex((line) =>
    titles.some((title) => line === title || line === `【${title}】`)
  )

  if (matchedTitleIndex === -1) {
    return []
  }

  const items: string[] = []

  for (let index = matchedTitleIndex + 1; index < normalizedLines.length; index += 1) {
    const line = normalizedLines[index]

    if (!line) {
      if (items.length > 0) {
        break
      }
      continue
    }

    const isAnotherHeading =
      /^第[0-9０-９一二三四五六七八九十]+号議案/.test(line) ||
      /^【.+】$/.test(line) ||
      (line.endsWith('事項') && !line.startsWith('・') && !line.startsWith('-'))

    if (isAnotherHeading) {
      break
    }

    const cleaned = line
      .replace(/^[・\-●◦○]+/, '')
      .replace(/^[0-9０-９]+[.)．、]\s*/, '')
      .trim()

    if (cleaned) {
      items.push(cleaned)
    }
  }

  return items
}

export function buildPlainTextDocument(input: BuildDocumentInput) {
  const lines = [
    `会議種別: ${getMeetingTypeLabel(input.meetingType)}`,
    `会議名: ${input.meetingName.trim() || '会議名未設定'}`,
    `状態: ${input.status === 'final' ? '確定' : '下書き'}`,
    `作成日: ${formatDateTime(input.createdAt ?? null)}`,
    `更新日: ${formatDateTime(input.updatedAt ?? null)}`,
    '',
    '【議事録本文】',
    input.minutesText.trim(),
  ]

  if (input.supplementNote?.trim()) {
    lines.push('', '【補足メモ】', input.supplementNote.trim())
  }

  if (input.transcriptText?.trim()) {
    lines.push('', '【文字起こし全文】', input.transcriptText.trim())
  }

  return lines.join('\n')
}

export function buildWordHtmlDocument(input: BuildDocumentInput) {
  const meetingTypeLabel = getMeetingTypeLabel(input.meetingType)
  const meetingName = input.meetingName.trim() || '会議名未設定'
  const statusLabel = input.status === 'final' ? '確定' : '下書き'
  const minutesText = escapeHtml(input.minutesText).replaceAll('\n', '<br />')
  const supplementNote = escapeHtml(input.supplementNote ?? '').replaceAll(
    '\n',
    '<br />'
  )
  const transcriptText = escapeHtml(input.transcriptText ?? '').replaceAll(
    '\n',
    '<br />'
  )

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(meetingName)}</title>
<style>
  body {
    font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
    line-height: 1.8;
    color: #111827;
    padding: 32px;
  }
  h1 {
    font-size: 24px;
    margin: 0 0 8px 0;
  }
  .meta {
    margin-bottom: 24px;
    font-size: 14px;
    color: #4b5563;
  }
  .section-title {
    font-weight: bold;
    margin: 24px 0 8px 0;
    font-size: 16px;
  }
  .box {
    border: 1px solid #d1d5db;
    border-radius: 12px;
    padding: 16px;
    white-space: normal;
  }
</style>
</head>
<body>
  <h1>${escapeHtml(meetingName)}</h1>
  <div class="meta">
    <div>会議種別: ${escapeHtml(meetingTypeLabel)}</div>
    <div>状態: ${escapeHtml(statusLabel)}</div>
    <div>作成日: ${escapeHtml(formatDateTime(input.createdAt ?? null))}</div>
    <div>更新日: ${escapeHtml(formatDateTime(input.updatedAt ?? null))}</div>
  </div>

  <div class="section-title">議事録本文</div>
  <div class="box">${minutesText}</div>

  ${
    input.supplementNote?.trim()
      ? `
  <div class="section-title">補足メモ</div>
  <div class="box">${supplementNote}</div>
  `
      : ''
  }

  ${
    input.transcriptText?.trim()
      ? `
  <div class="section-title">文字起こし全文</div>
  <div class="box">${transcriptText}</div>
  `
      : ''
  }
</body>
</html>`
}