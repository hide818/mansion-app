'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type AgendaRow = {
  title?: string
  body?: string
}

type ActionItemRow = {
  title?: string
  description?: string
  assignee?: string
  dueDate?: string
  type?: string
}

type SelectedActionItem = {
  id: string
  title: string
  description: string
  checked: boolean
  createType: 'task' | 'case'
}

type SaveActionItemsResponse =
  | {
      success: true
      createdCases: number
      createdTasks: number
      propertyId: string
    }
  | { error: string }

type LinkedRow = {
  id: string
  title: string | null
  status: string | null
  created_at: string | null
}

type DetailResponse = {
  record: {
    id: string
    sourceRecordId: string | null
    sourceRecordTitle: string
    versionType: 'original' | 'derived'
    linkedCases: LinkedRow[]
    linkedTasks: LinkedRow[]
    status: string
  }
}

type PatchResponse = {
  success?: boolean
  record?: {
    id: string
    status?: string
    updatedAt?: string | null
  }
  error?: string
}

type SavedAiMinutesDetailClientProps = {
  recordId: string
  propertyId: string
  propertyName: string
  meetingType: string
  title: string
  officialTitle: string
  heldOn: string | null
  meetingNumber: string
  termLabel: string
  meetingTerm?: string | null
  meetingRound?: string | null
  meetingPlace?: string | null
  attendeesText?: string | null
  absenteeText?: string | null
  chairpersonName?: string | null
  bylawsArticle?: string | null
  signatureDate?: string | null
  managementCompanyDisplay?: string | null
  minutesLayoutType?: string | null
  transcript: string
  minutes: string
  agendas: AgendaRow[]
  actionItems: ActionItemRow[]
  status?: string
  createdAt: string | null
  updatedAt?: string | null
  templateSignaturePerson1?: string
  templateSignaturePerson2?: string
  templateShowSignatureSection?: boolean
  templateClosingRemarks?: string
}

function getStatusLabel(status: string): string {
  if (status === 'reviewing') return '確認中'
  if (status === 'finalized') return '確定済み'
  if (status === 'sent') return '送付済み'
  return '下書き'
}

function getStatusBadgeClass(status: string): string {
  if (status === 'reviewing') return 'bg-amber-100 text-amber-700'
  if (status === 'finalized') return 'bg-emerald-100 text-emerald-700'
  if (status === 'sent') return 'bg-sky-100 text-sky-700'
  return 'bg-gray-100 text-gray-600'
}

function formatMeetingType(value: string) {
  if (value === 'general_meeting') return '総会'
  if (value === 'board_meeting') return '理事会'
  return value
}

function formatDateTime(value: string | null) {
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

function formatDateOnly(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(date)
}

function buildBoardFormalCloseText({
  meetingTerm,
  meetingRound,
}: {
  meetingTerm: string
  meetingRound: string
}) {
  if (meetingTerm && meetingRound) {
    return `以上で議案及び説明事項についての審議が終了し、第${meetingTerm}期第${meetingRound}回理事会は閉会した。`
  }

  return '以上で議案及び説明事項についての審議が終了し、理事会は閉会した。'
}

function buildBoardFormalRegulationText({
  propertyName,
  bylawsArticle,
}: {
  propertyName: string
  bylawsArticle: string
}) {
  if (bylawsArticle.trim()) {
    return `${propertyName}管理規約第${bylawsArticle}条の規定に基づき、議事録を作成した議長及び本理事会に出席した理事２名が署名、捺印することとする。`
  }

  return `${propertyName}管理規約の規定に基づき、議事録を作成した議長及び本理事会に出席した理事２名が署名、捺印することとする。`
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }

    let current = ''

    for (const char of paragraph) {
      const testLine = current + char
      const width = ctx.measureText(testLine).width

      if (width > maxWidth && current) {
        lines.push(current)
        current = char
      } else {
        current = testLine
      }
    }

    if (current) {
      lines.push(current)
    }
  }

  return lines
}

function buildBoardFormalPages({
  propertyName,
  meetingTerm,
  meetingRound,
  heldOn,
  meetingPlace,
  attendeesText,
  absenteeText = '',
  managementCompanyDisplay,
  chairpersonName,
  bylawsArticle,
  signatureDate,
  minutes,
}: {
  propertyName: string
  meetingTerm: string
  meetingRound: string
  heldOn: string | null
  meetingPlace: string
  attendeesText: string
  absenteeText?: string
  managementCompanyDisplay: string
  chairpersonName: string
  bylawsArticle: string
  signatureDate: string | null
  minutes: string
}) {
  const pageWidthPx = 1240
  const pageHeightPx = 1754
  const marginX = 90
  const marginTop = 100
  const marginBottom = 100
  const contentWidth = pageWidthPx - marginX * 2
  const bodyLineHeight = 34

  const measureCanvas = document.createElement('canvas')
  measureCanvas.width = pageWidthPx
  measureCanvas.height = pageHeightPx
  const measureCtx = measureCanvas.getContext('2d')

  if (!measureCtx) {
    throw new Error('PDF描画の準備に失敗しました。')
  }

  const fontFamily =
    '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif'

  measureCtx.font = `28px ${fontFamily}`

  const titleLine =
    meetingTerm && meetingRound
      ? `第${meetingTerm}期第${meetingRound}回理事会議事録`
      : '理事会議事録'

  const headingLine =
    meetingTerm && meetingRound
      ? `第${meetingTerm}期第${meetingRound}回理事会`
      : '理事会'

  const openLine = chairpersonName.trim()
    ? `定刻、${chairpersonName}理事長を議長に選任し、直ちに審議に入った。`
    : '定刻、理事長を議長に選任し、直ちに審議に入った。'

  const closeLine = buildBoardFormalCloseText({
    meetingTerm,
    meetingRound,
  })

  const regulationLine = buildBoardFormalRegulationText({
    propertyName,
    bylawsArticle,
  })

  const signatureDateText = formatDateOnly(signatureDate || heldOn)

  const bodyLines = wrapCanvasText(
    measureCtx,
    minutes || '議事録本文はありません。',
    contentWidth,
  )
  const openLines = wrapCanvasText(measureCtx, openLine, contentWidth)
  const closeLines = wrapCanvasText(measureCtx, closeLine, contentWidth)
  const regulationLines = wrapCanvasText(measureCtx, regulationLine, contentWidth)

  const contentLines = [
    headingLine,
    '',
    '[TABLE]',
    '',
    ...openLines,
    '',
    ...bodyLines,
    '',
    ...closeLines,
    '',
    ...regulationLines,
    '',
    signatureDateText,
    '',
    `${propertyName}管理組合`,
    '',
    '議長　　　　　　　　　　　　印',
    '',
    '議事録署名人　　　　　　　　印',
    '',
    '議事録署名人　　　　　　　　印',
  ]

  const pages: string[][] = []
  let currentPage: string[] = []
  let currentHeight = 0

  for (const line of contentLines) {
    const lineHeight =
      line === ''
        ? 20
        : line === '[TABLE]'
          ? 220
          : bodyLineHeight

    if (
      currentPage.length > 0 &&
      currentHeight + lineHeight > pageHeightPx - marginTop - marginBottom
    ) {
      pages.push(currentPage)
      currentPage = []
      currentHeight = 0
    }

    currentPage.push(line)
    currentHeight += lineHeight
  }

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return {
    titleLine,
    propertyLine: `${propertyName}管理組合`,
    dateLine: formatDateOnly(heldOn),
    pages,
    pageWidthPx,
    pageHeightPx,
    marginX,
    marginTop,
    bodyLineHeight,
    fontFamily,
    tableValues: {
      heldOn: formatDateOnly(heldOn),
      meetingPlace,
      attendeesText,
      absenteeText,
      managementCompanyDisplay,
    },
  }
}

async function createBoardFormalPdf({
  propertyName,
  meetingTerm,
  meetingRound,
  heldOn,
  meetingPlace,
  attendeesText,
  absenteeText = '',
  managementCompanyDisplay,
  chairpersonName,
  bylawsArticle,
  signatureDate,
  minutes,
}: {
  propertyName: string
  meetingTerm: string
  meetingRound: string
  heldOn: string | null
  meetingPlace: string
  attendeesText: string
  absenteeText?: string
  managementCompanyDisplay: string
  chairpersonName: string
  bylawsArticle: string
  signatureDate: string | null
  minutes: string
}) {
  const { jsPDF } = await import('jspdf')

  const {
    titleLine,
    propertyLine,
    dateLine,
    pages,
    pageWidthPx,
    pageHeightPx,
    marginX,
    marginTop,
    bodyLineHeight,
    fontFamily,
    tableValues,
  } = buildBoardFormalPages({
    propertyName,
    meetingTerm,
    meetingRound,
    heldOn,
    meetingPlace,
    attendeesText,
    absenteeText,
    managementCompanyDisplay,
    chairpersonName,
    bylawsArticle,
    signatureDate,
    minutes,
  })

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  })

  const coverCanvas = document.createElement('canvas')
  coverCanvas.width = pageWidthPx
  coverCanvas.height = pageHeightPx
  const coverCtx = coverCanvas.getContext('2d')

  if (!coverCtx) {
    throw new Error('表紙描画に失敗しました。')
  }

  coverCtx.fillStyle = '#ffffff'
  coverCtx.fillRect(0, 0, pageWidthPx, pageHeightPx)
  coverCtx.fillStyle = '#111827'
  coverCtx.textAlign = 'center'

  coverCtx.font = `700 54px ${fontFamily}`
  coverCtx.fillText(titleLine, pageWidthPx / 2, 540)

  coverCtx.font = `700 42px ${fontFamily}`
  coverCtx.fillText(propertyLine, pageWidthPx / 2, 700)

  coverCtx.font = `400 34px ${fontFamily}`
  coverCtx.fillText(dateLine || '', pageWidthPx / 2, 860)

  pdf.addImage(coverCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)

  pages.forEach((pageLines, pageIndex) => {
    pdf.addPage()

    const canvas = document.createElement('canvas')
    canvas.width = pageWidthPx
    canvas.height = pageHeightPx
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('本文描画に失敗しました。')
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx)

    let y = marginTop

    for (const line of pageLines) {
      if (line === '') {
        y += 20
        continue
      }

      if (line === '[TABLE]') {
        const leftX = marginX
        const topY = y
        const leftWidth = 220
        const rightWidth = 840
        const rowHeight = 55

        const rows = [
          ['開催日時', tableValues.heldOn || ''],
          ['開催場所', tableValues.meetingPlace || ''],
          ['出席者', tableValues.attendeesText || ''],
          ...(tableValues.absenteeText ? [['欠席者', tableValues.absenteeText]] : []),
          ['管理会社', tableValues.managementCompanyDisplay || ''],
        ]

        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 2
        ctx.font = `400 24px ${fontFamily}`
        ctx.fillStyle = '#111827'
        ctx.textAlign = 'left'

        rows.forEach((row, index) => {
          const rowY = topY + rowHeight * index
          ctx.strokeRect(leftX, rowY, leftWidth, rowHeight)
          ctx.strokeRect(leftX + leftWidth, rowY, rightWidth, rowHeight)

          ctx.font = `700 24px ${fontFamily}`
          ctx.fillText(row[0], leftX + 16, rowY + 36)

          ctx.font = `400 24px ${fontFamily}`
          ctx.fillText(row[1], leftX + leftWidth + 16, rowY + 36)
        })

        y += rowHeight * rows.length
        continue
      }

      if (pageIndex === 0 && y === marginTop) {
        ctx.fillStyle = '#111827'
        ctx.font = `700 40px ${fontFamily}`
        ctx.fillText(line, marginX, y)
        y += 60
        continue
      }

      ctx.fillStyle = '#374151'
      ctx.font = `400 26px ${fontFamily}`
      ctx.fillText(line, marginX, y)
      y += bodyLineHeight
    }

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)
  })

  const fileNameBase = `${propertyName}_理事会議事録`
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')

  pdf.save(`${fileNameBase}.pdf`)
}

function createStandardWordBlob({
  propertyName,
  meetingType,
  title,
  officialTitle,
  heldOn,
  meetingNumber,
  termLabel,
  createdAt,
  minutes,
}: {
  propertyName: string
  meetingType: string
  title: string
  officialTitle: string
  heldOn: string | null
  meetingNumber: string
  termLabel: string
  createdAt: string | null
  minutes: string
}) {
  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title || '議事録'}</title>
<style>
body {
  font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  color: #111827;
  line-height: 1.8;
  font-size: 11pt;
}
h1 {
  font-size: 18pt;
  margin-bottom: 8pt;
}
h2 {
  font-size: 13pt;
  margin-top: 18pt;
  margin-bottom: 8pt;
}
.meta {
  margin-bottom: 14pt;
}
.meta p {
  margin: 2pt 0;
}
.minutes {
  white-space: pre-wrap;
}
</style>
</head>
<body>
  <h1>${propertyName} ${formatMeetingType(meetingType)} 議事録</h1>
  <div class="meta">
    <p>タイトル: ${title || 'タイトル未設定'}</p>
    ${officialTitle ? `<p>正式タイトル: ${officialTitle}</p>` : ''}
    ${heldOn ? `<p>開催日: ${heldOn}</p>` : ''}
    ${meetingNumber ? `<p>開催回数: ${meetingNumber}</p>` : ''}
    ${termLabel ? `<p>期別: ${termLabel}</p>` : ''}
    <p>作成日時: ${formatDateTime(createdAt)}</p>
  </div>
  <h2>議事録本文</h2>
  <div class="minutes">${(minutes || '議事録本文はありません。')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')}</div>
</body>
</html>
  `.trim()

  return new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  })
}

function createBoardFormalWordBlob({
  propertyName,
  meetingTerm,
  meetingRound,
  heldOn,
  meetingPlace,
  attendeesText,
  absenteeText = '',
  managementCompanyDisplay,
  chairpersonName,
  bylawsArticle,
  signatureDate,
  minutes,
  signaturePerson1 = '',
  signaturePerson2 = '',
  showSignatureSection = true,
  closingRemarks = '',
}: {
  propertyName: string
  meetingTerm: string
  meetingRound: string
  heldOn: string | null
  meetingPlace: string
  attendeesText: string
  absenteeText?: string
  managementCompanyDisplay: string
  chairpersonName: string
  bylawsArticle: string
  signatureDate: string | null
  minutes: string
  signaturePerson1?: string
  signaturePerson2?: string
  showSignatureSection?: boolean
  closingRemarks?: string
}) {
  const titleLine =
    meetingTerm && meetingRound
      ? `第${meetingTerm}期第${meetingRound}回理事会議事録`
      : '理事会議事録'

  const headingLine =
    meetingTerm && meetingRound
      ? `第${meetingTerm}期第${meetingRound}回理事会`
      : '理事会'

  const openLine = chairpersonName.trim()
    ? `定刻、${chairpersonName}理事長を議長に選任し、直ちに審議に入った。`
    : '定刻、理事長を議長に選任し、直ちに審議に入った。'

  const closeLine = buildBoardFormalCloseText({
    meetingTerm,
    meetingRound,
  })

  const regulationLine = buildBoardFormalRegulationText({
    propertyName,
    bylawsArticle,
  })

  const signatureDateText = formatDateOnly(signatureDate || heldOn)

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${titleLine}</title>
<style>
body {
  font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  color: #111827;
  line-height: 1.9;
  font-size: 11pt;
}
.page-break {
  page-break-after: always;
}
.cover {
  text-align: center;
  padding-top: 180pt;
}
.cover h1 {
  font-size: 24pt;
  margin-bottom: 24pt;
}
.cover h2 {
  font-size: 18pt;
  margin-bottom: 24pt;
}
.heading {
  font-size: 18pt;
  font-weight: bold;
  margin-bottom: 16pt;
}
.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16pt;
}
.info-table td {
  border: 1px solid #475569;
  padding: 8pt 10pt;
  vertical-align: top;
}
.info-table .label {
  width: 120pt;
  font-weight: bold;
}
.minutes {
  white-space: pre-wrap;
}
.signature-line {
  margin-top: 20pt;
}
.signature-row {
  margin-top: 18pt;
}
</style>
</head>
<body>
  <div class="cover page-break">
    <h1>${titleLine}</h1>
    <h2>${propertyName}管理組合</h2>
    <div>${formatDateOnly(heldOn)}</div>
  </div>

  <div class="heading">${headingLine}</div>

  <table class="info-table">
    <tr>
      <td class="label">開催日時</td>
      <td>${formatDateOnly(heldOn)}</td>
    </tr>
    <tr>
      <td class="label">開催場所</td>
      <td>${meetingPlace || ''}</td>
    </tr>
    <tr>
      <td class="label">出席者</td>
      <td>${attendeesText || ''}</td>
    </tr>
    ${absenteeText ? `<tr><td class="label">欠席者</td><td>${absenteeText}</td></tr>` : ''}
    <tr>
      <td class="label">管理会社</td>
      <td>${managementCompanyDisplay || ''}</td>
    </tr>
  </table>

  <p>${openLine}</p>

  <div class="minutes">${(minutes || '議事録本文はありません。')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')}</div>

  <p>${closeLine}</p>
  <p>${regulationLine}</p>
  ${closingRemarks ? `<p style="white-space:pre-wrap;">${closingRemarks.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
  <p>${signatureDateText}</p>
  <p>${propertyName}管理組合</p>

  ${showSignatureSection ? `
  <div class="signature-line">
    <div class="signature-row">議長　　　　　　　　　　　　印</div>
    <div class="signature-row">議事録署名人${signaturePerson1 ? `　${signaturePerson1.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}` : ''}　　　　　　　　印</div>
    <div class="signature-row">議事録署名人${signaturePerson2 ? `　${signaturePerson2.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}` : ''}　　　　　　　　印</div>
  </div>
  ` : ''}
</body>
</html>
  `.trim()

  return new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  })
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // ブラウザがダウンロードを開始した後に解放する
  window.setTimeout(() => URL.revokeObjectURL(url), 200)
}

export default function SavedAiMinutesDetailClient({
  recordId,
  propertyId,
  propertyName,
  meetingType,
  title,
  officialTitle,
  heldOn,
  meetingNumber,
  termLabel,
  meetingTerm = '',
  meetingRound = '',
  meetingPlace = '',
  attendeesText = '',
  absenteeText = '',
  chairpersonName = '',
  bylawsArticle = '',
  signatureDate = null,
  managementCompanyDisplay = '',
  minutesLayoutType = 'standard',
  transcript,
  minutes,
  agendas,
  actionItems,
  status = 'draft',
  createdAt,
  templateSignaturePerson1 = '',
  templateSignaturePerson2 = '',
  templateShowSignatureSection = true,
  templateClosingRemarks = '',
}: SavedAiMinutesDetailClientProps) {
  const router = useRouter()

  // 編集・ステータス管理の状態
  const [currentStatus, setCurrentStatus] = useState(status)
  const [currentMinutes, setCurrentMinutes] = useState(minutes)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMinutes, setEditedMinutes] = useState(minutes)
  const [saving, setSaving] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [editSaveMessage, setEditSaveMessage] = useState('')

  // 既存の状態
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [linkedCases, setLinkedCases] = useState<LinkedRow[]>([])
  const [linkedTasks, setLinkedTasks] = useState<LinkedRow[]>([])
  const [versionType, setVersionType] = useState<'original' | 'derived'>('original')
  const [sourceRecordId, setSourceRecordId] = useState<string | null>(null)
  const [sourceRecordTitle, setSourceRecordTitle] = useState('')

  const safeMeetingTerm = meetingTerm ?? ''
  const safeMeetingRound = meetingRound ?? ''
  const safeMeetingPlace = meetingPlace ?? ''
  const safeAttendeesText = attendeesText ?? ''
  const safeAbsenteeText = absenteeText ?? ''
  const safeChairpersonName = chairpersonName ?? ''
  const safeBylawsArticle = bylawsArticle ?? ''
  const safeManagementCompanyDisplay = managementCompanyDisplay ?? ''

  const selectedItemsInitial = useMemo<SelectedActionItem[]>(
    () =>
      Array.isArray(actionItems)
        ? actionItems.map((item, index) => ({
            id: crypto.randomUUID(),
            title: item.title?.trim() || `宿題${index + 1}`,
            description: item.description?.trim() || '',
            checked: true,
            createType: item.type === 'case' ? 'case' : 'task',
          }))
        : [],
    [actionItems],
  )

  const [selectedItems, setSelectedItems] = useState<SelectedActionItem[]>(
    selectedItemsInitial,
  )

  useEffect(() => {
    setSelectedItems(selectedItemsInitial)
  }, [selectedItemsInitial])

  useEffect(() => {
    let cancelled = false

    async function fetchDetailMeta() {
      try {
        const response = await fetch(`/api/ai-minutes/records/${recordId}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const data = (await response.json()) as DetailResponse | { error: string }

        if (!response.ok || !('record' in data)) {
          return
        }

        if (cancelled) return

        setLinkedCases(data.record.linkedCases ?? [])
        setLinkedTasks(data.record.linkedTasks ?? [])
        setVersionType(data.record.versionType ?? 'original')
        setSourceRecordId(data.record.sourceRecordId ?? null)
        setSourceRecordTitle(data.record.sourceRecordTitle ?? '')
        if (data.record.status) {
          setCurrentStatus(data.record.status)
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchDetailMeta()

    return () => {
      cancelled = true
    }
  }, [recordId])

  // PATCHリクエスト用の共通ペイロードビルダー
  function buildPatchBody(overrides: { minutes?: string; status?: string } = {}) {
    return {
      propertyId,
      meetingType,
      title,
      officialTitle,
      ...(heldOn !== null && { heldOn }),
      meetingNumber,
      termLabel,
      meetingTerm: safeMeetingTerm,
      meetingRound: safeMeetingRound,
      meetingPlace: safeMeetingPlace,
      attendeesText: safeAttendeesText,
      chairpersonName: safeChairpersonName,
      bylawsArticle: safeBylawsArticle,
      ...(signatureDate !== null && { signatureDate }),
      managementCompanyDisplay: safeManagementCompanyDisplay,
      minutesLayoutType: minutesLayoutType ?? 'standard',
      transcript,
      minutes: overrides.minutes ?? currentMinutes,
      agendas,
      actionItems,
      ...(overrides.status !== undefined && { status: overrides.status }),
    }
  }

  function handleStartEdit() {
    if (currentStatus === 'finalized' || currentStatus === 'sent') {
      const ok = window.confirm(
        '確定済みの議事録を編集しますか？\n編集後に必要に応じて「確定する」を押してください。',
      )
      if (!ok) return
    }
    setEditedMinutes(currentMinutes)
    setIsEditing(true)
    setEditSaveMessage('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditedMinutes(currentMinutes)
    setEditSaveMessage('')
  }

  async function handleSaveEdit() {
    try {
      setSaving(true)
      setEditSaveMessage('')

      const response = await fetch(`/api/ai-minutes/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPatchBody({ minutes: editedMinutes })),
      })

      const data = (await response.json()) as PatchResponse

      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました。')
      }

      setCurrentMinutes(editedMinutes)
      setIsEditing(false)
      setEditSaveMessage('上書き保存しました。')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeStatus(newStatus: string) {
    if (newStatus === 'finalized' && currentStatus === 'finalized') {
      const ok = window.confirm('すでに確定済みです。再度確定しますか？')
      if (!ok) return
    }

    try {
      setStatusChanging(true)
      setEditSaveMessage('')

      const response = await fetch(`/api/ai-minutes/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPatchBody({ status: newStatus })),
      })

      const data = (await response.json()) as PatchResponse

      if (!response.ok) {
        throw new Error(data.error || 'ステータスの変更に失敗しました。')
      }

      setCurrentStatus(newStatus)
      setEditSaveMessage(
        newStatus === 'finalized'
          ? '議事録を確定しました。'
          : newStatus === 'sent'
            ? '送付済みに変更しました。'
            : newStatus === 'reviewing'
              ? '確認中に変更しました。'
              : '下書きに戻しました。',
      )
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'ステータスの変更に失敗しました。')
    } finally {
      setStatusChanging(false)
    }
  }

  const printableText = useMemo(() => {
    if (minutesLayoutType === 'board_formal') {
      const titleLine =
        safeMeetingTerm && safeMeetingRound
          ? `第${safeMeetingTerm}期第${safeMeetingRound}回理事会議事録`
          : '理事会議事録'

      const headingLine =
        safeMeetingTerm && safeMeetingRound
          ? `第${safeMeetingTerm}期第${safeMeetingRound}回理事会`
          : '理事会'

      const openLine = safeChairpersonName.trim()
        ? `定刻、${safeChairpersonName}理事長を議長に選任し、直ちに審議に入った。`
        : '定刻、理事長を議長に選任し、直ちに審議に入った。'

      return [
        titleLine,
        `${propertyName}管理組合`,
        formatDateOnly(heldOn),
        '',
        headingLine,
        '',
        `開催日時　${formatDateOnly(heldOn)}`,
        `開催場所　${safeMeetingPlace}`,
        `出席者　${safeAttendeesText}`,
        `管理会社　${safeManagementCompanyDisplay}`,
        '',
        openLine,
        '',
        currentMinutes || '議事録本文はありません。',
        '',
        buildBoardFormalCloseText({
          meetingTerm: safeMeetingTerm,
          meetingRound: safeMeetingRound,
        }),
        buildBoardFormalRegulationText({
          propertyName,
          bylawsArticle: safeBylawsArticle,
        }),
        templateClosingRemarks || '',
        formatDateOnly(signatureDate || heldOn),
        `${propertyName}管理組合`,
        ...(templateShowSignatureSection
          ? [
              '議長　　　　　　　　　　　　印',
              `議事録署名人${templateSignaturePerson1 ? `　${templateSignaturePerson1}` : ''}　　　　　　　　印`,
              `議事録署名人${templateSignaturePerson2 ? `　${templateSignaturePerson2}` : ''}　　　　　　　　印`,
            ]
          : []),
      ]
        .filter(Boolean)
        .join('\n')
    }

    return [
      `${propertyName} ${formatMeetingType(meetingType)} 議事録`,
      `タイトル: ${title || 'タイトル未設定'}`,
      officialTitle ? `正式タイトル: ${officialTitle}` : '',
      heldOn ? `開催日: ${heldOn}` : '',
      meetingNumber ? `開催回数: ${meetingNumber}` : '',
      termLabel ? `期別: ${termLabel}` : '',
      `作成日時: ${formatDateTime(createdAt)}`,
      '',
      currentMinutes || '議事録本文はありません。',
    ]
      .filter(Boolean)
      .join('\n')
  }, [
    minutesLayoutType,
    safeMeetingTerm,
    safeMeetingRound,
    propertyName,
    heldOn,
    safeMeetingPlace,
    safeAttendeesText,
    safeManagementCompanyDisplay,
    safeChairpersonName,
    currentMinutes,
    safeBylawsArticle,
    signatureDate,
    meetingType,
    title,
    officialTitle,
    meetingNumber,
    termLabel,
    createdAt,
    templateSignaturePerson1,
    templateSignaturePerson2,
    templateShowSignatureSection,
    templateClosingRemarks,
  ])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(printableText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error(error)
      alert('コピーに失敗しました。')
    }
  }

  function handlePrint() {
    window.print()
  }

  async function handleDownloadPdf() {
    try {
      setDownloadingPdf(true)

      if (minutesLayoutType === 'board_formal') {
        await createBoardFormalPdf({
          propertyName,
          meetingTerm: safeMeetingTerm,
          meetingRound: safeMeetingRound,
          heldOn,
          meetingPlace: safeMeetingPlace,
          attendeesText: safeAttendeesText,
          absenteeText: safeAbsenteeText,
          managementCompanyDisplay: safeManagementCompanyDisplay,
          chairpersonName: safeChairpersonName,
          bylawsArticle: safeBylawsArticle,
          signatureDate,
          minutes: currentMinutes,
        })
      } else {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
        })
        const split = doc.splitTextToSize(printableText, 180)
        doc.text(split, 15, 20)
        const fileNameBase = `${propertyName}_${formatMeetingType(meetingType)}_議事録`
          .replace(/[\\/:*?"<>|]/g, '_')
          .replace(/\s+/g, '_')
        doc.save(`${fileNameBase}.pdf`)
      }
    } catch (error) {
      console.error(error)
      alert('PDFダウンロードに失敗しました。')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDownloadWord() {
    try {
      setDownloadingWord(true)

      const fileNameBase = `${propertyName}_${formatMeetingType(meetingType)}_議事録`
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')

      const blob =
        minutesLayoutType === 'board_formal'
          ? createBoardFormalWordBlob({
              propertyName,
              meetingTerm: safeMeetingTerm,
              meetingRound: safeMeetingRound,
              heldOn,
              meetingPlace: safeMeetingPlace,
              attendeesText: safeAttendeesText,
              absenteeText: safeAbsenteeText,
              managementCompanyDisplay: safeManagementCompanyDisplay,
              chairpersonName: safeChairpersonName,
              bylawsArticle: safeBylawsArticle,
              signatureDate,
              minutes: currentMinutes,
              signaturePerson1: templateSignaturePerson1,
              signaturePerson2: templateSignaturePerson2,
              showSignatureSection: templateShowSignatureSection,
              closingRemarks: templateClosingRemarks,
            })
          : createStandardWordBlob({
              propertyName,
              meetingType,
              title,
              officialTitle,
              heldOn,
              meetingNumber,
              termLabel,
              createdAt,
              minutes: currentMinutes,
            })

      downloadBlob(blob, `${fileNameBase}.doc`)
    } catch (error) {
      console.error(error)
      alert('Wordダウンロードに失敗しました。')
    } finally {
      setDownloadingWord(false)
    }
  }

  function toggleActionItem(id: string) {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    )
  }

  function changeActionItemType(id: string, value: 'task' | 'case') {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, createType: value } : item,
      ),
    )
  }

  async function handleSaveActionItems() {
    const checkedItems = selectedItems.filter((item) => item.checked)

    if (checkedItems.length === 0) {
      alert('追加する宿題を1つ以上選択してください。')
      return
    }

    try {
      setSavingItems(true)
      setSaveMessage('')

      const response = await fetch('/api/ai-minutes/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          sourceMinutesRecordId: recordId,
          items: checkedItems.map((item) => ({
            title: item.title,
            description: item.description,
            createType: item.createType,
          })),
        }),
      })

      const data = (await response.json()) as SaveActionItemsResponse

      if (!response.ok) {
        throw new Error('error' in data ? data.error : '追加に失敗しました。')
      }

      if (!('success' in data) || !data.success) {
        throw new Error('追加結果が不正です。')
      }

      setSaveMessage(
        `案件 ${data.createdCases} 件、タスク ${data.createdTasks} 件を追加しました。`,
      )

      const refreshResponse = await fetch(`/api/ai-minutes/records/${recordId}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const refreshData = (await refreshResponse.json()) as
        | DetailResponse
        | { error: string }

      if (refreshResponse.ok && 'record' in refreshData) {
        setLinkedCases(refreshData.record.linkedCases ?? [])
        setLinkedTasks(refreshData.record.linkedTasks ?? [])
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '追加に失敗しました。')
    } finally {
      setSavingItems(false)
    }
  }

  async function handleDelete() {
    const ok = window.confirm('この保存済み議事録を削除しますか？')
    if (!ok) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/ai-minutes/records/${recordId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || '削除に失敗しました。')
      }

      router.push('/ai-minutes/records')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '削除に失敗しました。')
    } finally {
      setDeleting(false)
    }
  }

  const boardFormalTitle =
    safeMeetingTerm && safeMeetingRound
      ? `第${safeMeetingTerm}期第${safeMeetingRound}回理事会議事録`
      : '理事会議事録'

  const boardFormalHeading =
    safeMeetingTerm && safeMeetingRound
      ? `第${safeMeetingTerm}期第${safeMeetingRound}回理事会`
      : '理事会'

  const boardFormalOpenText = safeChairpersonName.trim()
    ? `定刻、${safeChairpersonName}理事長を議長に選任し、直ちに審議に入った。`
    : '定刻、理事長を議長に選任し、直ちに審議に入った。'

  const boardFormalCloseText = buildBoardFormalCloseText({
    meetingTerm: safeMeetingTerm,
    meetingRound: safeMeetingRound,
  })

  const boardFormalRegulationText = buildBoardFormalRegulationText({
    propertyName,
    bylawsArticle: safeBylawsArticle,
  })

  const boardFormalSignatureDate = formatDateOnly(signatureDate || heldOn)

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 20mm 22mm;
        }

        .minutes-print-only {
          display: none;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .minutes-print-only,
          .minutes-print-only * {
            visibility: visible !important;
          }

          .minutes-print-only {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff !important;
          }

          .minutes-screen-only {
            display: none !important;
          }

          .print-page-break {
            page-break-after: always;
            break-after: page;
          }

          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print-board-table {
            width: 100%;
            border-collapse: collapse;
          }

          .print-board-table td {
            border: 1px solid #475569;
            padding: 8pt 10pt;
            vertical-align: top;
            font-size: 10.5pt;
            line-height: 1.8;
          }
        }
      `}</style>

      <div className="space-y-6">
        <div className="minutes-screen-only space-y-6">
          {/* アクションバー */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            {/* 出力・印刷ボタン行 */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white hover:bg-slate-800"
              >
                印刷
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingPdf ? 'PDF作成中...' : 'PDF出力'}
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                disabled={downloadingWord}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingWord ? 'Word作成中...' : 'Word出力'}
              </button>

              <Link
                href={`/ai-minutes?reuseRecordId=${recordId}`}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                再編集
              </Link>

              <div className="ml-auto flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold !text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? '保存中...' : '上書き保存'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    本文を編集
                  </button>
                )}
              </div>
            </div>

            {/* ステータス管理行 */}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <span className="text-sm font-semibold text-gray-600">ステータス:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(currentStatus)}`}
              >
                {getStatusLabel(currentStatus)}
              </span>

              <div className="flex flex-wrap gap-2">
                {currentStatus === 'draft' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus('reviewing')}
                      disabled={statusChanging}
                      className="inline-flex items-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                    >
                      確認中にする
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus('finalized')}
                      disabled={statusChanging}
                      className="inline-flex items-center rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold !text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      確定する
                    </button>
                  </>
                )}
                {currentStatus === 'reviewing' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus('finalized')}
                      disabled={statusChanging}
                      className="inline-flex items-center rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold !text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      確定する
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus('draft')}
                      disabled={statusChanging}
                      className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      下書きに戻す
                    </button>
                  </>
                )}
                {currentStatus === 'finalized' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus('sent')}
                      disabled={statusChanging}
                      className="inline-flex items-center rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                    >
                      送付済みにする
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus('draft')}
                      disabled={statusChanging}
                      className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      下書きに戻す
                    </button>
                  </>
                )}
                {currentStatus === 'sent' && (
                  <button
                    type="button"
                    onClick={() => handleChangeStatus('finalized')}
                    disabled={statusChanging}
                    className="inline-flex items-center rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    確定済みに戻す
                  </button>
                )}
              </div>
            </div>

            {/* 保存・ステータス変更後メッセージ */}
            {editSaveMessage ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {editSaveMessage}
              </div>
            ) : null}

            {/* セカンダリボタン行 */}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                {copied ? 'コピーしました' : 'コピー'}
              </button>

              <Link
                href="/ai-minutes/records"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                一覧へ戻る
              </Link>

              <Link
                href={`/properties/${propertyId}`}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                物件詳細
              </Link>

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>

          {/* 詳細・本文セクション */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-emerald-700">保存済み議事録</p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(currentStatus)}`}
                >
                  {getStatusLabel(currentStatus)}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {minutesLayoutType === 'board_formal'
                  ? boardFormalTitle
                  : `${propertyName} ${formatMeetingType(meetingType)} 議事録`}
              </h2>

              <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                <p>タイトル: {title || 'タイトル未設定'}</p>
                {officialTitle ? <p>正式タイトル: {officialTitle}</p> : null}
                {heldOn ? <p>開催日: {heldOn}</p> : null}
                {meetingNumber ? <p>開催回数: {meetingNumber}</p> : null}
                {termLabel ? <p>期別: {termLabel}</p> : null}
                {safeMeetingTerm ? <p>理事会期: 第{safeMeetingTerm}期</p> : null}
                {safeMeetingRound ? <p>理事会回数: 第{safeMeetingRound}回</p> : null}
                {safeMeetingPlace ? <p>開催場所: {safeMeetingPlace}</p> : null}
                {safeAttendeesText ? <p>出席者: {safeAttendeesText}</p> : null}
                {safeAbsenteeText ? <p>欠席者: {safeAbsenteeText}</p> : null}
                {safeManagementCompanyDisplay ? (
                  <p>管理会社: {safeManagementCompanyDisplay}</p>
                ) : null}
                <p>作成日時: {formatDateTime(createdAt)}</p>
                <p>版種別: {versionType === 'original' ? '原本' : '派生版'}</p>
                {sourceRecordId ? (
                  <p>
                    元議事録:
                    <Link
                      href={`/ai-minutes/records/${sourceRecordId}`}
                      className="ml-2 text-sky-700 underline"
                    >
                      {sourceRecordTitle || '元議事録を開く'}
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {minutesLayoutType === 'board_formal' ? (
                <section className="space-y-8">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <h3 className="text-3xl font-bold text-slate-900">
                      {boardFormalTitle}
                    </h3>
                    <p className="mt-8 text-2xl font-semibold text-slate-900">
                      {propertyName}管理組合
                    </p>
                    <p className="mt-8 text-lg text-slate-700">
                      {formatDateOnly(heldOn)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {boardFormalHeading}
                    </h3>

                    <table className="mt-5 w-full border-collapse text-sm">
                      <tbody>
                        <tr>
                          <td className="w-40 border border-slate-400 px-4 py-3 font-semibold text-slate-900">
                            開催日時
                          </td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">
                            {formatDateOnly(heldOn)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">
                            開催場所
                          </td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">
                            {safeMeetingPlace}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">
                            出席者
                          </td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">
                            {safeAttendeesText}
                          </td>
                        </tr>
                        {safeAbsenteeText ? (
                          <tr>
                            <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">
                              欠席者
                            </td>
                            <td className="border border-slate-400 px-4 py-3 text-slate-700">
                              {safeAbsenteeText}
                            </td>
                          </tr>
                        ) : null}
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">
                            管理会社
                          </td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">
                            {safeManagementCompanyDisplay}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                      {boardFormalOpenText}
                    </p>

                    {isEditing ? (
                      <textarea
                        value={editedMinutes}
                        onChange={(e) => setEditedMinutes(e.target.value)}
                        className="mt-6 w-full rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-8 text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        rows={20}
                      />
                    ) : (
                      <div className="mt-6 whitespace-pre-wrap text-sm leading-8 text-slate-800">
                        {currentMinutes || '議事録本文はありません。'}
                      </div>
                    )}

                    <div className="mt-8 space-y-4 text-sm leading-8 text-slate-800">
                      <p>{boardFormalCloseText}</p>
                      <p>{boardFormalRegulationText}</p>
                      <p>{boardFormalSignatureDate}</p>
                      <p>{propertyName}管理組合</p>
                    </div>

                    {templateShowSignatureSection ? (
                      <div className="mt-10 space-y-8 text-sm text-slate-900">
                        <p>議長　　　　　　　　　　　　印</p>
                        <p>議事録署名人{templateSignaturePerson1 ? `　${templateSignaturePerson1}` : ''}　　　　　　　　印</p>
                        <p>議事録署名人{templateSignaturePerson2 ? `　${templateSignaturePerson2}` : ''}　　　　　　　　印</p>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : (
                <>
                  <section>
                    <h3 className="text-lg font-bold text-gray-900">議事録本文</h3>
                    {isEditing ? (
                      <textarea
                        value={editedMinutes}
                        onChange={(e) => setEditedMinutes(e.target.value)}
                        className="mt-3 w-full rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-gray-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        rows={24}
                      />
                    ) : (
                      <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-gray-50 p-5 text-sm leading-7 text-gray-800">
                        {currentMinutes || '議事録本文はありません。'}
                      </div>
                    )}
                  </section>

                  {agendas.length > 0 ? (
                    <section>
                      <h3 className="text-lg font-bold text-gray-900">議案ごとの内容</h3>
                      <div className="mt-3 space-y-4">
                        {agendas.map((agenda, index) => (
                          <div
                            key={`${agenda.title || 'agenda'}-${index}`}
                            className="rounded-2xl border border-gray-200 p-5"
                          >
                            <p className="font-semibold text-gray-900">
                              {agenda.title || `第${index + 1}号議案`}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                              {agenda.body || '本文なし'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </>
              )}

              {linkedCases.length > 0 ? (
                <section>
                  <h3 className="text-lg font-bold text-gray-900">この議事録から作られた案件</h3>
                  <div className="mt-3 space-y-3">
                    {linkedCases.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <p className="font-semibold text-emerald-900">
                          {item.title || '案件名未設定'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-emerald-900">
                          <span>状態: {item.status || '-'}</span>
                          <span>作成日時: {formatDateTime(item.created_at)}</span>
                        </div>
                        <div className="mt-3">
                          <Link
                            href={`/properties/${propertyId}/cases/${item.id}`}
                            className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            関連案件を見る
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {linkedTasks.length > 0 ? (
                <section>
                  <h3 className="text-lg font-bold text-gray-900">この議事録から作られたタスク</h3>
                  <div className="mt-3 space-y-3">
                    {linkedTasks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-sky-200 bg-sky-50 p-4"
                      >
                        <p className="font-semibold text-sky-900">
                          {item.title || 'タスク名未設定'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-sky-900">
                          <span>状態: {item.status || '-'}</span>
                          <span>作成日時: {formatDateTime(item.created_at)}</span>
                        </div>
                        <div className="mt-3">
                          <Link
                            href={`/properties/${propertyId}/tasks`}
                            className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
                          >
                            この物件のタスク一覧を見る
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {selectedItems.length > 0 ? (
                <section>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">宿題事項</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        保存済み議事録からでも、再度案件・タスクに追加できます。
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveActionItems}
                      disabled={savingItems}
                      className="inline-flex min-w-[64px] items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium !text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:!text-slate-500"
                    >
                      {savingItems ? '追加中...' : '選択した宿題を案件・タスクに追加'}
                    </button>
                  </div>

                  {saveMessage ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                      <p>{saveMessage}</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Link
                          href={`/properties/${propertyId}/cases`}
                          className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          この物件の案件一覧を見る
                        </Link>

                        <Link
                          href={`/properties/${propertyId}/tasks`}
                          className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                        >
                          この物件のタスク一覧を見る
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleActionItem(item.id)}
                              className="mt-1 h-4 w-4"
                            />

                            <div>
                              <p className="font-semibold text-amber-900">{item.title}</p>
                              <p className="mt-2 text-sm leading-6 text-amber-900">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="min-w-[150px]">
                            <label className="mb-2 block text-xs font-medium text-amber-900">
                              追加先
                            </label>
                            <select
                              value={item.createType}
                              onChange={(e) =>
                                changeActionItemType(
                                  item.id,
                                  e.target.value as 'task' | 'case',
                                )
                              }
                              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                            >
                              <option value="task">タスク</option>
                              <option value="case">案件</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {transcript ? (
                <section>
                  <h3 className="text-lg font-bold text-gray-900">文字起こし原文</h3>
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-gray-50 p-5 text-sm leading-7 text-gray-700">
                    {transcript}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>

        {/* 印刷専用エリア（管理UIなし、議事録本文のみ） */}
        <div className="minutes-print-only">
          {minutesLayoutType === 'board_formal' ? (
            <>
              <div className="print-page-break bg-white px-8 py-20 text-center text-gray-900">
                <h1 className="mt-40 text-3xl font-bold">{boardFormalTitle}</h1>
                <p className="mt-16 text-2xl font-semibold">{propertyName}管理組合</p>
                <p className="mt-16 text-lg">{formatDateOnly(heldOn)}</p>
              </div>

              <div className="bg-white text-gray-900">
                <h1 className="text-center text-2xl font-bold">{boardFormalHeading}</h1>

                <table className="print-board-table mt-5 text-sm">
                  <tbody>
                    <tr>
                      <td className="w-40 font-semibold">開催日時</td>
                      <td>{formatDateOnly(heldOn)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">開催場所</td>
                      <td>{safeMeetingPlace}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">出席者</td>
                      <td>{safeAttendeesText}</td>
                    </tr>
                    {safeAbsenteeText ? (
                      <tr>
                        <td className="font-semibold">欠席者</td>
                        <td>{safeAbsenteeText}</td>
                      </tr>
                    ) : null}
                    <tr>
                      <td className="font-semibold">管理会社</td>
                      <td>{safeManagementCompanyDisplay}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-6 whitespace-pre-wrap text-sm leading-8">
                  {boardFormalOpenText}
                </p>

                <div className="mt-6 whitespace-pre-wrap text-sm leading-8">
                  {currentMinutes || '議事録本文はありません。'}
                </div>

                <div className="print-avoid-break">
                  <div className="mt-8 space-y-4 text-sm leading-8">
                    <p>{boardFormalCloseText}</p>
                    <p>{boardFormalRegulationText}</p>
                    <p>{boardFormalSignatureDate}</p>
                    <p>{propertyName}管理組合</p>
                  </div>

                  {templateShowSignatureSection ? (
                    <div className="mt-10 space-y-8 text-sm">
                      <p>議長　　　　　　　　　　　　印</p>
                      <p>議事録署名人{templateSignaturePerson1 ? `　${templateSignaturePerson1}` : ''}　　　　　　　　印</p>
                      <p>議事録署名人{templateSignaturePerson2 ? `　${templateSignaturePerson2}` : ''}　　　　　　　　印</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white text-gray-900">
              <div className="border-b border-gray-300 pb-4">
                <h1 className="mt-2 text-2xl font-bold">
                  {propertyName} {formatMeetingType(meetingType)} 議事録
                </h1>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>タイトル: {title || 'タイトル未設定'}</p>
                  {officialTitle ? <p>正式タイトル: {officialTitle}</p> : null}
                  {heldOn ? <p>開催日: {heldOn}</p> : null}
                  {meetingNumber ? <p>開催回数: {meetingNumber}</p> : null}
                  {termLabel ? <p>期別: {termLabel}</p> : null}
                  <p>作成日時: {formatDateTime(createdAt)}</p>
                </div>
              </div>

              <section className="mt-6">
                <h2 className="text-lg font-bold text-gray-900">議事録本文</h2>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-900">
                  {currentMinutes || '議事録本文はありません。'}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
