export type MeetingType = 'board' | 'general' | 'meeting'
export type BoardMinutesRecordStatus = 'draft' | 'final'

export type BoardMinutesFormattingOptions = {
  tone: string
  headingStyle: string
  detailLevel: string
  proseStyle: string
  decisionRule: string
  phraseRule: string
}

export type BoardMinutesRecord = {
  id: string
  company_id: string
  property_id: string
  case_id: string
  meeting_type: MeetingType
  meeting_name: string | null
  transcript_text: string | null
  minutes_text: string
  supplement_note: string | null
  formatting_options: BoardMinutesFormattingOptions | null
  status: BoardMinutesRecordStatus
  source: string | null
  generated_by_ai: boolean
  created_by_user_id: string | null
  created_at: string
  updated_at: string
}

export function getMeetingTypeLabel(meetingType: MeetingType) {
  if (meetingType === 'board') return '理事会'
  if (meetingType === 'general') return '総会'
  return '打合せ'
}

export function normalizeBoardMinutesFormattingOptions(
  value: unknown
): BoardMinutesFormattingOptions | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const source = value as Record<string, unknown>

  const tone = typeof source.tone === 'string' ? source.tone.trim() : ''
  const headingStyle =
    typeof source.headingStyle === 'string' ? source.headingStyle.trim() : ''
  const detailLevel =
    typeof source.detailLevel === 'string' ? source.detailLevel.trim() : ''
  const proseStyle =
    typeof source.proseStyle === 'string' ? source.proseStyle.trim() : ''
  const decisionRule =
    typeof source.decisionRule === 'string' ? source.decisionRule.trim() : ''
  const phraseRule =
    typeof source.phraseRule === 'string' ? source.phraseRule.trim() : ''

  if (
    !tone &&
    !headingStyle &&
    !detailLevel &&
    !proseStyle &&
    !decisionRule &&
    !phraseRule
  ) {
    return null
  }

  return {
    tone,
    headingStyle,
    detailLevel,
    proseStyle,
    decisionRule,
    phraseRule,
  }
}

export function formatDateTime(value: string | null) {
  if (!value) return '-'

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