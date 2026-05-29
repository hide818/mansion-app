'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type AgendaRow = {
  id: string
  title: string
}

type PropertyOption = {
  id: string
  name: string
}

type ActionItem = {
  id: string
  title: string
  description: string
  recommendedType: 'task' | 'case'
}

type SelectedActionItem = ActionItem & {
  checked: boolean
  createType: 'task' | 'case'
}

type MinutesApiSuccess = {
  transcript: string
  minutes: string
  actionItems: ActionItem[]
}

type MinutesApiError = {
  error: string
}

type MinutesApiResponse = MinutesApiSuccess | MinutesApiError

type SaveMinutesResponse =
  | {
      success: true
      record: {
        id: string
      }
    }
  | {
      error: string
    }

type SaveActionItemsResponse =
  | {
      success: true
      createdCases: number
      createdTasks: number
      propertyId: string
    }
  | {
      error: string
    }

type SavedMinutesRecordResponse =
  | {
      record: {
        id: string
        propertyId: string
        propertyName: string
        meetingType: string
        title: string
        officialTitle: string
        heldOn: string | null
        meetingNumber: string
        termLabel: string
        meetingTerm: string
        meetingRound: string
        meetingPlace: string
        attendeesText: string
        chairpersonName: string
        bylawsArticle: string
        signatureDate: string | null
        managementCompanyDisplay: string
        minutesLayoutType: string
        transcript: string
        minutes: string
        agendas: Array<{
          title?: string
          body?: string
        }>
        actionItems: Array<{
          title?: string
          description?: string
          type?: string
        }>
      }
    }
  | {
      error: string
    }

type MinutesSection =
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'agenda'
      title: string
      body: string
    }

function createAgenda(index: number, title?: string): AgendaRow {
  return {
    id: crypto.randomUUID(),
    title: title?.trim() ? title : `第${index + 1}号議案`,
  }
}

function isMinutesApiSuccess(
  data: MinutesApiResponse,
): data is MinutesApiSuccess {
  return 'transcript' in data && 'minutes' in data && 'actionItems' in data
}

function normalizeMeetingType(value: string): '総会' | '理事会' {
  if (value === 'board_meeting' || value === '理事会') return '理事会'
  return '総会'
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

function formatMeetingDateTime(
  dateValue: string | null,
  startTime: string,
  endTime: string,
) {
  const dateText = formatDateOnly(dateValue)
  if (!dateText) return ''

  if (startTime && endTime) return `${dateText}${startTime}〜${endTime}`
  if (startTime) return `${dateText}${startTime}`
  return dateText
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatIndentedParagraphs(text: string) {
  if (!text.trim()) return '　議事録本文はありません。'

  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      return lines.map((line) => `　${line}`).join('\n')
    })
    .join('\n\n')
}

function splitMinutesIntoSections(minutes: string): MinutesSection[] {
  const normalized = minutes.replace(/\r\n/g, '\n').trim()

  if (!normalized) {
    return [{ type: 'paragraph', text: '　議事録本文はありません。' }]
  }

  const agendaRegex = /(第\s*\d+\s*号議案[^\n]*)/g
  const parts = normalized.split(agendaRegex).filter((part) => part.trim() !== '')

  if (parts.length <= 1) {
    return normalized
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => ({
        type: 'paragraph' as const,
        text: formatIndentedParagraphs(block),
      }))
  }

  const sections: MinutesSection[] = []
  let index = 0

  while (index < parts.length) {
    const current = parts[index]?.trim() ?? ''

    if (/^第\s*\d+\s*号議案/.test(current)) {
      const body = (parts[index + 1] ?? '').trim()
      sections.push({
        type: 'agenda',
        title: current,
        body: formatIndentedParagraphs(body || '本文なし'),
      })
      index += 2
    } else {
      sections.push({
        type: 'paragraph',
        text: formatIndentedParagraphs(current),
      })
      index += 1
    }
  }

  return sections
}

function buildBoardFormalPrintHtml(params: {
  propertyName: string
  meetingTerm: string
  meetingRound: string
  heldOn: string | null
  startTime: string
  endTime: string
  meetingPlace: string
  attendeesText: string
  managementCompanyDisplay: string
  chairpersonName: string
  bylawsArticle: string
  signatureDate: string | null
  minutes: string
}) {
  const {
    propertyName,
    meetingTerm,
    meetingRound,
    heldOn,
    startTime,
    endTime,
    meetingPlace,
    attendeesText,
    managementCompanyDisplay,
    chairpersonName,
    bylawsArticle,
    signatureDate,
    minutes,
  } = params

  const heldOnText = formatMeetingDateTime(heldOn, startTime, endTime)
  const signatureDateText = formatDateOnly(signatureDate || heldOn)

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

  const closeLine =
    meetingTerm && meetingRound
      ? `以上で議案及び説明事項についての審議が終了し、第${meetingTerm}期第${meetingRound}回理事会は閉会した。`
      : '以上で議案及び説明事項についての審議が終了し、理事会は閉会した。'

  const regulationLine = bylawsArticle.trim()
    ? `${propertyName}管理規約第${bylawsArticle}条の規定に基づき、議事録を作成した議長及び本理事会に出席した理事２名が署名、捺印することとする。`
    : `${propertyName}管理規約の規定に基づき、議事録を作成した議長及び本理事会に出席した理事２名が署名、捺印することとする。`

  const sections = splitMinutesIntoSections(minutes)

  const sectionsHtml = sections
    .map((section) => {
      if (section.type === 'agenda') {
        return `
          <section class="agenda-block">
            <h2 class="agenda-title">${escapeHtml(section.title)}</h2>
            <div class="minutes">${escapeHtml(section.body).replace(/\n/g, '<br>')}</div>
          </section>
        `
      }

      return `
        <section class="paragraph-block">
          <div class="minutes">${escapeHtml(section.text).replace(/\n/g, '<br>')}</div>
        </section>
      `
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(titleLine)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  }
  body { font-size: 11pt; line-height: 2; }
  .page {
    width: 100%;
    min-height: 260mm;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .cover-title { font-size: 24pt; font-weight: 700; margin: 0; }
  .cover-org { font-size: 18pt; font-weight: 600; margin-top: 28pt; }
  .cover-date { font-size: 13pt; margin-top: 28pt; }

  .body-page { padding-top: 6mm; }
  .body-heading {
    text-align: center;
    font-size: 18pt;
    font-weight: 700;
    margin: 0 0 18pt 0;
  }

  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20pt;
  }
  .info-table td {
    border: 1px solid #475569;
    padding: 8pt 10pt;
    vertical-align: top;
  }
  .info-label { width: 120pt; font-weight: 700; }

  .minutes { white-space: pre-wrap; }
  .paragraph-block {
    margin-top: 12pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .agenda-block {
    margin-top: 18pt;
    margin-bottom: 16pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .agenda-title {
    font-size: 13pt;
    font-weight: 700;
    margin: 0 0 8pt 0;
  }

  .signature-page {
    padding-top: 12mm;
    page-break-before: always;
    break-before: page;
  }
  .signature-text {
    text-align: left;
    white-space: pre-wrap;
    line-height: 2;
  }
  .signature-date {
    margin-top: 28pt;
    text-align: left;
  }

  /* ここを左基準に固定 */
  .signature-block {
    width: 100%;
    margin-top: 22pt;
  }
  .signature-org {
    width: 100%;
    margin-left: 110pt;
    text-align: left;
  }
  .signature-grid {
    width: 100%;
    margin-top: 20pt;
    margin-left: 110pt;
    border-collapse: separate;
    border-spacing: 0 18pt;
  }
  .signature-role {
    width: 180pt;
    text-align: left;
  }
  .signature-name {
    width: 140pt;
    text-align: left;
  }
  .signature-seal {
    width: 60pt;
    text-align: left;
  }

  @media print {
    .print-button { display: none; }
  }
  .print-button-wrap {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 9999;
  }
  .print-button {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 14px;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="print-button-wrap">
    <button class="print-button" onclick="window.print()">印刷する</button>
  </div>

  <section class="page cover-page">
    <h1 class="cover-title">${escapeHtml(titleLine)}</h1>
    <div class="cover-org">${escapeHtml(propertyName)}管理組合</div>
    <div class="cover-date">${escapeHtml(heldOnText)}</div>
  </section>

  <section class="page body-page">
    <h1 class="body-heading">${escapeHtml(headingLine)}</h1>

    <table class="info-table">
      <tr><td class="info-label">開催日時</td><td>${escapeHtml(heldOnText)}</td></tr>
      <tr><td class="info-label">開催場所</td><td>${escapeHtml(meetingPlace || '')}</td></tr>
      <tr><td class="info-label">出席者</td><td>${escapeHtml(attendeesText || '')}</td></tr>
      <tr><td class="info-label">管理会社</td><td>${escapeHtml(managementCompanyDisplay || '')}</td></tr>
    </table>

    <section class="paragraph-block">
      <div class="minutes">${escapeHtml(formatIndentedParagraphs(openLine)).replace(/\n/g, '<br>')}</div>
    </section>

    ${sectionsHtml}
  </section>

  <section class="page signature-page">
    <div class="signature-text">${escapeHtml(formatIndentedParagraphs(`${closeLine}\n${regulationLine}`)).replace(/\n/g, '<br>')}</div>
    <div class="signature-date">${escapeHtml(signatureDateText)}</div>

    <div class="signature-block">
      <div class="signature-org">${escapeHtml(propertyName)}管理組合</div>
      <table class="signature-grid">
        <tr>
          <td class="signature-role">議長</td>
          <td class="signature-name"></td>
          <td class="signature-seal">印</td>
        </tr>
        <tr>
          <td class="signature-role">議事録署名人</td>
          <td class="signature-name"></td>
          <td class="signature-seal">印</td>
        </tr>
        <tr>
          <td class="signature-role">議事録署名人</td>
          <td class="signature-name"></td>
          <td class="signature-seal">印</td>
        </tr>
      </table>
    </div>
  </section>
</body>
</html>
  `.trim()
}

function buildGeneralMeetingStatusRows(params: {
  ownersTotalCount: string
  votingRightsTotalCount: string
  attendeesCount: string
  attendeesVotingRightsCount: string
  proxyCount: string
  proxyVotingRightsCount: string
  writtenVoteCount: string
  writtenVoteRightsCount: string
  effectiveVotingRightsCount: string
}) {
  const {
    ownersTotalCount,
    votingRightsTotalCount,
    attendeesCount,
    attendeesVotingRightsCount,
    proxyCount,
    proxyVotingRightsCount,
    writtenVoteCount,
    writtenVoteRightsCount,
    effectiveVotingRightsCount,
  } = params

  return `
    <tr>
      <td>組合員総数</td>
      <td>${escapeHtml(ownersTotalCount || '0')}人</td>
      <td>議決権総数</td>
      <td>${escapeHtml(votingRightsTotalCount || '0')}個</td>
    </tr>
    <tr>
      <td>出席者</td>
      <td>${escapeHtml(attendeesCount || '0')}人</td>
      <td>議決権数</td>
      <td>${escapeHtml(attendeesVotingRightsCount || '0')}個</td>
    </tr>
    <tr>
      <td>委任状</td>
      <td>${escapeHtml(proxyCount || '0')}人</td>
      <td>議決権数</td>
      <td>${escapeHtml(proxyVotingRightsCount || '0')}個</td>
    </tr>
    <tr>
      <td>議決権行使者数</td>
      <td>${escapeHtml(writtenVoteCount || '0')}人</td>
      <td>議決権数</td>
      <td>${escapeHtml(writtenVoteRightsCount || '0')}個</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td>有効議決権数</td>
      <td>${escapeHtml(effectiveVotingRightsCount || '0')}個</td>
    </tr>
  `.trim()
}

function buildGeneralMeetingPrintHtml(params: {
  propertyName: string
  generalMeetingCategory: '通常総会' | '臨時総会'
  extraordinaryMeetingCount: string
  termNumber: string
  heldOn: string | null
  startTime: string
  endTime: string
  managementCompanyDisplay: string
  chairpersonName: string
  bylawsArticle: string
  ownersTotalCount: string
  votingRightsTotalCount: string
  attendeesCount: string
  attendeesVotingRightsCount: string
  proxyCount: string
  proxyVotingRightsCount: string
  writtenVoteCount: string
  writtenVoteRightsCount: string
  effectiveVotingRightsCount: string
  minutes: string
}) {
  const {
    propertyName,
    generalMeetingCategory,
    extraordinaryMeetingCount,
    termNumber,
    heldOn,
    startTime,
    endTime,
    managementCompanyDisplay,
    chairpersonName,
    bylawsArticle,
    ownersTotalCount,
    votingRightsTotalCount,
    attendeesCount,
    attendeesVotingRightsCount,
    proxyCount,
    proxyVotingRightsCount,
    writtenVoteCount,
    writtenVoteRightsCount,
    effectiveVotingRightsCount,
    minutes,
  } = params

  const heldOnText = formatMeetingDateTime(heldOn, startTime, endTime)
  const displayTerm = termNumber.trim() ? `第${termNumber.trim()}期` : ''

  const titleLine =
    generalMeetingCategory === '臨時総会'
      ? `${displayTerm}${extraordinaryMeetingCount.trim()}臨時総会議事録`
      : `${displayTerm}通常総会議事録`

  const headingLine =
    generalMeetingCategory === '臨時総会'
      ? `${displayTerm}${extraordinaryMeetingCount.trim()}臨時総会`
      : `${displayTerm}通常総会`

  const closeLine =
    generalMeetingCategory === '臨時総会'
      ? `以上で議案及び説明事項についての審議が終了し、${displayTerm}${extraordinaryMeetingCount.trim()}臨時総会は閉会した。`
      : `以上で議案及び説明事項についての審議が終了し、${displayTerm}通常総会は閉会した。`

  const regulationLine = bylawsArticle.trim()
    ? `${propertyName}管理規約第${bylawsArticle}条の規定に基づき、議事録を作成した議長及び本総会に出席した組合員２名が署名、捺印することとする。`
    : `${propertyName}管理規約の規定に基づき、議事録を作成した議長及び本総会に出席した組合員２名が署名、捺印することとする。`

  const signatureDateText = formatDateOnly(heldOn)

  const openingReport = chairpersonName.trim()
    ? `総会の開催に先立ち、本総会の議長に${chairpersonName.trim()}氏が就任し、出席状況の確認が行われ、本総会が成立している旨の報告がなされた後、審議に入った。`
    : '総会の開催に先立ち、本総会の議長が就任し、出席状況の確認が行われ、本総会が成立している旨の報告がなされた後、審議に入った。'

  const sections = splitMinutesIntoSections(minutes)
  const statusRowsHtml = buildGeneralMeetingStatusRows({
    ownersTotalCount,
    votingRightsTotalCount,
    attendeesCount,
    attendeesVotingRightsCount,
    proxyCount,
    proxyVotingRightsCount,
    writtenVoteCount,
    writtenVoteRightsCount,
    effectiveVotingRightsCount,
  })

  const sectionsHtml = sections
    .map((section) => {
      if (section.type === 'agenda') {
        return `
          <section class="agenda-block">
            <h2 class="agenda-title">${escapeHtml(section.title)}</h2>
            <div class="minutes">${escapeHtml(section.body).replace(/\n/g, '<br>')}</div>
          </section>
        `
      }

      return `
        <section class="paragraph-block">
          <div class="minutes">${escapeHtml(section.text).replace(/\n/g, '<br>')}</div>
        </section>
      `
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(titleLine)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  }
  body { font-size: 11pt; line-height: 2; }
  .page {
    width: 100%;
    min-height: 260mm;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .cover-title { font-size: 24pt; font-weight: 700; margin: 0; }
  .cover-org { font-size: 18pt; font-weight: 600; margin-top: 28pt; }
  .cover-date { font-size: 13pt; margin-top: 28pt; }

  .body-page { padding-top: 6mm; }
  .body-heading {
    text-align: center;
    font-size: 18pt;
    font-weight: 700;
    margin: 0 0 18pt 0;
  }

  .info-table,
  .status-table,
  .company-table {
    width: 100%;
    border-collapse: collapse;
  }

  .info-table { margin-bottom: 16pt; }
  .status-table { margin-bottom: 16pt; }
  .company-table { margin-bottom: 20pt; }

  .info-table td,
  .status-table td,
  .company-table td {
    border: 1px solid #475569;
    padding: 8pt 10pt;
    vertical-align: middle;
  }

  .info-label,
  .company-label { width: 120pt; font-weight: 700; }

  .status-table td:nth-child(1) { width: 200pt; font-weight: 700; }
  .status-table td:nth-child(2) { width: 110pt; text-align: left; }
  .status-table td:nth-child(3) { width: 170pt; font-weight: 700; }
  .status-table td:nth-child(4) { width: 110pt; text-align: left; }

  .minutes { white-space: pre-wrap; }
  .paragraph-block {
    margin-top: 12pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .agenda-block {
    margin-top: 18pt;
    margin-bottom: 16pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .agenda-title {
    font-size: 13pt;
    font-weight: 700;
    margin: 0 0 8pt 0;
  }

  .signature-page {
    padding-top: 12mm;
    page-break-before: always;
    break-before: page;
  }
  .signature-text {
    text-align: left;
    white-space: pre-wrap;
    line-height: 2;
  }
  .signature-date {
    margin-top: 28pt;
    text-align: left;
  }

  /* 総会最終ページを左基準で固定 */
  .signature-block {
    width: 100%;
    margin-top: 22pt;
  }
  .signature-org {
    width: 100%;
    margin-left: 110pt;
    text-align: left;
  }
  .signature-grid {
    width: 100%;
    margin-top: 20pt;
    margin-left: 110pt;
    border-collapse: separate;
    border-spacing: 0 18pt;
  }
  .signature-role {
    width: 180pt;
    text-align: left;
  }
  .signature-name {
    width: 140pt;
    text-align: left;
  }
  .signature-seal {
    width: 60pt;
    text-align: left;
  }

  @media print {
    .print-button { display: none; }
  }
  .print-button-wrap {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 9999;
  }
  .print-button {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 14px;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="print-button-wrap">
    <button class="print-button" onclick="window.print()">印刷する</button>
  </div>

  <section class="page cover-page">
    <h1 class="cover-title">${escapeHtml(titleLine)}</h1>
    <div class="cover-org">${escapeHtml(propertyName)}管理組合</div>
    <div class="cover-date">${escapeHtml(heldOnText)}</div>
  </section>

  <section class="page body-page">
    <h1 class="body-heading">${escapeHtml(headingLine)}</h1>

    <table class="info-table">
      <tr><td class="info-label">開催日時</td><td>${escapeHtml(heldOnText)}</td></tr>
    </table>

    <table class="status-table">
      ${statusRowsHtml}
    </table>

    <table class="company-table">
      <tr><td class="company-label">管理会社</td><td>${escapeHtml(managementCompanyDisplay || '')}</td></tr>
    </table>

    <section class="paragraph-block">
      <div class="minutes">${escapeHtml(formatIndentedParagraphs(openingReport)).replace(/\n/g, '<br>')}</div>
    </section>

    ${sectionsHtml}
  </section>

  <section class="page signature-page">
    <div class="signature-text">${escapeHtml(formatIndentedParagraphs(`${closeLine}\n${regulationLine}`)).replace(/\n/g, '<br>')}</div>
    <div class="signature-date">${escapeHtml(signatureDateText)}</div>

    <div class="signature-block">
      <div class="signature-org">${escapeHtml(propertyName)}管理組合</div>
      <table class="signature-grid">
        <tr>
          <td class="signature-role">議長</td>
          <td class="signature-name"></td>
          <td class="signature-seal">印</td>
        </tr>
        <tr>
          <td class="signature-role">議事録署名人</td>
          <td class="signature-name"></td>
          <td class="signature-seal">印</td>
        </tr>
        <tr>
          <td class="signature-role">議事録署名人</td>
          <td class="signature-name"></td>
          <td class="signature-seal">印</td>
        </tr>
      </table>
    </div>
  </section>
</body>
</html>
  `.trim()
}

export default function AiMinutesPage() {
  const searchParams = useSearchParams()
  const reuseRecordId = searchParams.get('reuseRecordId') ?? ''

  const [meetingType, setMeetingType] = useState<'総会' | '理事会'>('総会')
  const [propertyId, setPropertyId] = useState('')
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [reusingLoading, setReusingLoading] = useState(false)

  const [officialTitle, setOfficialTitle] = useState('')
  const [heldOn, setHeldOn] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [meetingNumber, setMeetingNumber] = useState('')
  const [termLabel, setTermLabel] = useState('')

  const [meetingTerm, setMeetingTerm] = useState('')
  const [meetingRound, setMeetingRound] = useState('')
  const [meetingPlace, setMeetingPlace] = useState('')
  const [attendeesText, setAttendeesText] = useState('')
  const [chairpersonName, setChairpersonName] = useState('')
  const [bylawsArticle, setBylawsArticle] = useState('')
  const [signatureDate, setSignatureDate] = useState('')
  const [managementCompanyDisplay, setManagementCompanyDisplay] = useState('')
  const [, setMinutesLayoutType] = useState<'standard' | 'board_formal'>('standard')

  const [generalMeetingCategory, setGeneralMeetingCategory] = useState<'通常総会' | '臨時総会'>('通常総会')
  const [extraordinaryMeetingCount, setExtraordinaryMeetingCount] = useState('')
  const [termNumber, setTermNumber] = useState('')
  const [ownersTotalCount, setOwnersTotalCount] = useState('')
  const [votingRightsTotalCount, setVotingRightsTotalCount] = useState('')
  const [attendeesCount, setAttendeesCount] = useState('')
  const [attendeesVotingRightsCount, setAttendeesVotingRightsCount] = useState('')
  const [proxyCount, setProxyCount] = useState('')
  const [proxyVotingRightsCount, setProxyVotingRightsCount] = useState('')
  const [writtenVoteCount, setWrittenVoteCount] = useState('')
  const [writtenVoteRightsCount, setWrittenVoteRightsCount] = useState('')
  const [effectiveVotingRightsCount, setEffectiveVotingRightsCount] = useState('')

  const [agendas, setAgendas] = useState<AgendaRow[]>([
    createAgenda(0),
    createAgenda(1),
  ])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [savingMinutes, setSavingMinutes] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [downloadingWord, setDownloadingWord] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<MinutesApiSuccess | null>(null)
  const [editableMinutes, setEditableMinutes] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedActionItem[]>([])
  const [saveMessage, setSaveMessage] = useState('')
  const [savedPropertyId, setSavedPropertyId] = useState('')
  const [minutesSaveMessage, setMinutesSaveMessage] = useState('')
  const [savedMinutesRecordId, setSavedMinutesRecordId] = useState('')
  const [currentEditingRecordId, setCurrentEditingRecordId] = useState('')
  const [reuseMessage, setReuseMessage] = useState('')

  const selectedProperty = useMemo(() => {
    return properties.find((item) => item.id === propertyId) ?? null
  }, [properties, propertyId])

  const hasCheckedItems = useMemo(() => {
    return selectedItems.some((item) => item.checked)
  }, [selectedItems])

  const canSubmit = useMemo(() => {
    const hasAgenda = agendas.some((item) => item.title.trim())
    return Boolean(
      propertyId && hasAgenda && audioFile && !loading && !propertiesLoading,
    )
  }, [propertyId, agendas, audioFile, loading, propertiesLoading])

  const canSaveMinutes = useMemo(() => {
    const hasAgenda = agendas.some((item) => item.title.trim())
    return Boolean(
      editableMinutes.trim() &&
        propertyId &&
        selectedProperty &&
        hasAgenda &&
        !loading &&
        !savingMinutes &&
        !propertiesLoading,
    )
  }, [
    editableMinutes,
    propertyId,
    selectedProperty,
    agendas,
    loading,
    savingMinutes,
    propertiesLoading,
  ])

  const isBoardMeeting = meetingType === '理事会'
  const isGeneralMeeting = meetingType === '総会'

  const safeMeetingTerm = meetingTerm.trim()
  const safeMeetingRound = meetingRound.trim()
  const safeMeetingPlace = meetingPlace.trim()
  const safeAttendeesText = attendeesText.trim()
  const safeChairpersonName = chairpersonName.trim()
  const safeBylawsArticle = bylawsArticle.trim()
  const safeManagementCompanyDisplay = managementCompanyDisplay.trim()
  const displayGeneralTerm = termNumber.trim() ? `第${termNumber.trim()}期` : ''
  const heldOnText = formatMeetingDateTime(heldOn, startTime, endTime)

  const boardFormalTitle =
    safeMeetingTerm && safeMeetingRound
      ? `第${safeMeetingTerm}期第${safeMeetingRound}回理事会議事録`
      : '理事会議事録'

  const boardFormalHeading =
    safeMeetingTerm && safeMeetingRound
      ? `第${safeMeetingTerm}期第${safeMeetingRound}回理事会`
      : '理事会'

  const boardFormalOpenText = safeChairpersonName
    ? `定刻、${safeChairpersonName}理事長を議長に選任し、直ちに審議に入った。`
    : '定刻、理事長を議長に選任し、直ちに審議に入った。'

  const boardFormalCloseText =
    safeMeetingTerm && safeMeetingRound
      ? `以上で議案及び説明事項についての審議が終了し、第${safeMeetingTerm}期第${safeMeetingRound}回理事会は閉会した。`
      : '以上で議案及び説明事項についての審議が終了し、理事会は閉会した。'

  const boardFormalRegulationText = safeBylawsArticle
    ? `${selectedProperty?.name ?? ''}管理規約第${safeBylawsArticle}条の規定に基づき、議事録を作成した議長及び本理事会に出席した理事２名が署名、捺印することとする。`
    : `${selectedProperty?.name ?? ''}管理規約の規定に基づき、議事録を作成した議長及び本理事会に出席した理事２名が署名、捺印することとする。`

  const generalFormalTitle =
    generalMeetingCategory === '臨時総会'
      ? `${displayGeneralTerm}${extraordinaryMeetingCount.trim()}臨時総会議事録`
      : `${displayGeneralTerm}通常総会議事録`

  const generalFormalHeading =
    generalMeetingCategory === '臨時総会'
      ? `${displayGeneralTerm}${extraordinaryMeetingCount.trim()}臨時総会`
      : `${displayGeneralTerm}通常総会`

  const generalOpeningReport = safeChairpersonName
    ? `総会の開催に先立ち、本総会の議長に${safeChairpersonName}氏が就任し、出席状況の確認が行われ、本総会が成立している旨の報告がなされた後、審議に入った。`
    : '総会の開催に先立ち、本総会の議長が就任し、出席状況の確認が行われ、本総会が成立している旨の報告がなされた後、審議に入った。'

  const generalCloseText =
    generalMeetingCategory === '臨時総会'
      ? `以上で議案及び説明事項についての審議が終了し、${displayGeneralTerm}${extraordinaryMeetingCount.trim()}臨時総会は閉会した。`
      : `以上で議案及び説明事項についての審議が終了し、${displayGeneralTerm}通常総会は閉会した。`

  const generalRegulationText = safeBylawsArticle
    ? `${selectedProperty?.name ?? ''}管理規約第${safeBylawsArticle}条の規定に基づき、議事録を作成した議長及び本総会に出席した組合員２名が署名、捺印することとする。`
    : `${selectedProperty?.name ?? ''}管理規約の規定に基づき、議事録を作成した議長及び本総会に出席した組合員２名が署名、捺印することとする。`

  useEffect(() => {
    let cancelled = false

    async function fetchProperties() {
      try {
        setPropertiesLoading(true)
        const response = await fetch('/api/properties/options', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = (await response.json()) as
          | { properties: PropertyOption[] }
          | { error: string }

        if (!response.ok) {
          if (!cancelled) setErrorMessage('物件一覧の取得に失敗しました。')
          return
        }

        if (!cancelled && 'properties' in data) {
          setProperties(data.properties)
          if (data.properties.length === 1 && !reuseRecordId) {
            setPropertyId(data.properties[0].id)
          }
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) setErrorMessage('物件一覧の取得に失敗しました。')
      } finally {
        if (!cancelled) setPropertiesLoading(false)
      }
    }

    fetchProperties()
    return () => {
      cancelled = true
    }
  }, [reuseRecordId])

  useEffect(() => {
    if (!signatureDate && heldOn) setSignatureDate(heldOn)
  }, [heldOn, signatureDate])

  useEffect(() => {
    setMinutesLayoutType(meetingType === '理事会' ? 'board_formal' : 'standard')
  }, [meetingType])

  useEffect(() => {
    if (generalMeetingCategory === '通常総会') {
      setExtraordinaryMeetingCount('')
    }
  }, [generalMeetingCategory])

  useEffect(() => {
    if (propertiesLoading || !reuseRecordId) return

    let cancelled = false

    async function fetchSavedRecord() {
      try {
        setReusingLoading(true)
        setErrorMessage('')
        setReuseMessage('')

        const response = await fetch(`/api/ai-minutes/records/${reuseRecordId}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const data = (await response.json()) as SavedMinutesRecordResponse

        if (!response.ok) {
          if (!cancelled) setErrorMessage('保存済み議事録の読込に失敗しました。')
          return
        }

        if (!('record' in data)) {
          if (!cancelled) setErrorMessage('保存済み議事録の読込結果が不正です。')
          return
        }

        const record = data.record
        if (cancelled) return

        const nextMeetingType = normalizeMeetingType(record.meetingType)

        setCurrentEditingRecordId(record.id)
        setMeetingType(nextMeetingType)
        setPropertyId(record.propertyId)
        setOfficialTitle(record.officialTitle ?? '')
        setHeldOn(record.heldOn ?? '')
        setMeetingNumber(record.meetingNumber ?? '')
        setTermLabel(record.termLabel ?? '')
        setMeetingTerm(record.meetingTerm ?? '')
        setMeetingRound(record.meetingRound ?? '')
        setMeetingPlace(record.meetingPlace ?? '')
        setAttendeesText(record.attendeesText ?? '')
        setChairpersonName(record.chairpersonName ?? '')
        setBylawsArticle(record.bylawsArticle ?? '')
        setSignatureDate(record.signatureDate ?? record.heldOn ?? '')
        setManagementCompanyDisplay(record.managementCompanyDisplay ?? '')
        setMinutesLayoutType(nextMeetingType === '理事会' ? 'board_formal' : 'standard')

        const loadedAgendas: AgendaRow[] =
          Array.isArray(record.agendas) && record.agendas.length > 0
            ? record.agendas.map((agenda, index) => createAgenda(index, agenda.title))
            : [createAgenda(0), createAgenda(1)]

        const loadedSelectedActionItems: SelectedActionItem[] =
          Array.isArray(record.actionItems)
            ? record.actionItems.map((item, index) => ({
                id: crypto.randomUUID(),
                title: item.title?.trim() || `宿題${index + 1}`,
                description: item.description?.trim() || '',
                recommendedType: item.type === 'case' ? 'case' : 'task',
                checked: true,
                createType: item.type === 'case' ? 'case' : 'task',
              }))
            : []

        const loadedResultActionItems: ActionItem[] = loadedSelectedActionItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          recommendedType: item.recommendedType,
        }))

        setAgendas(loadedAgendas)
        setAudioFile(null)
        setResult({
          transcript: record.transcript ?? '',
          minutes: record.minutes ?? '',
          actionItems: loadedResultActionItems,
        })
        setEditableMinutes(record.minutes ?? '')
        setSelectedItems(loadedSelectedActionItems)
        setSaveMessage('')
        setSavedPropertyId('')
        setMinutesSaveMessage('')
        setSavedMinutesRecordId('')
        setReuseMessage('保存済み議事録を読み込みました。修正後に上書き保存または別名保存できます。')
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setErrorMessage('保存済み議事録の読込中に通信エラーが発生しました。')
        }
      } finally {
        if (!cancelled) setReusingLoading(false)
      }
    }

    fetchSavedRecord()
    return () => {
      cancelled = true
    }
  }, [reuseRecordId, propertiesLoading])

  function updateAgenda(id: string, value: string) {
    setAgendas((prev) => prev.map((item) => (item.id === id ? { ...item, title: value } : item)))
  }

  function addAgenda() {
    setAgendas((prev) => [...prev, createAgenda(prev.length)])
  }

  function removeAgenda(id: string) {
    setAgendas((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((item) => item.id !== id)
    })
  }

  function toggleActionItem(id: string) {
    setSelectedItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)))
  }

  function changeActionItemType(id: string, value: 'task' | 'case') {
    setSelectedItems((prev) => prev.map((item) => (item.id === id ? { ...item, createType: value } : item)))
  }

  function checkAllActionItems() {
    setSelectedItems((prev) => prev.map((item) => ({ ...item, checked: true })))
  }

  function uncheckAllActionItems() {
    setSelectedItems((prev) => prev.map((item) => ({ ...item, checked: false })))
  }

  function resetMessagesBeforeNewSave() {
    setErrorMessage('')
    setSaveMessage('')
    setSavedPropertyId('')
    setMinutesSaveMessage('')
    setSavedMinutesRecordId('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!audioFile) {
      setErrorMessage('音声ファイルを選択してください。')
      return
    }

    if (!propertyId || !selectedProperty) {
      setErrorMessage('マンション名を選択してください。')
      return
    }

    const cleanedAgendas = agendas.map((item) => item.title.trim()).filter(Boolean)
    if (cleanedAgendas.length === 0) {
      setErrorMessage('議題を1つ以上入力してください。')
      return
    }

    setLoading(true)
    resetMessagesBeforeNewSave()
    setReuseMessage('')
    setResult(null)
    setEditableMinutes('')
    setSelectedItems([])

    try {
      const formData = new FormData()
      formData.append('meetingType', meetingType)
      formData.append('propertyName', selectedProperty.name)
      formData.append('agendas', JSON.stringify(cleanedAgendas))
      formData.append('audio', audioFile)

      const response = await fetch('/api/ai-minutes', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as MinutesApiResponse

      if (!response.ok) {
        if ('error' in data) setErrorMessage(data.error || '議事録の作成に失敗しました。')
        else setErrorMessage('議事録の作成に失敗しました。')
        return
      }

      if (!isMinutesApiSuccess(data)) {
        setErrorMessage('議事録の作成結果が不正です。')
        return
      }

      setResult(data)
      setEditableMinutes(data.minutes)
      setSelectedItems(
        data.actionItems.map((item) => ({
          ...item,
          checked: true,
          createType: item.recommendedType,
        })),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('通信エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!editableMinutes) return
    await navigator.clipboard.writeText(editableMinutes)
  }

  function buildSavePayload(sourceRecordId?: string) {
    if (!selectedProperty) return null

    const cleanedAgendas = agendas.map((item) => item.title.trim()).filter(Boolean)
    if (cleanedAgendas.length === 0) return null

    return {
      propertyId,
      meetingType: meetingType === '理事会' ? 'board_meeting' : 'general_meeting',
      title: isBoardMeeting ? boardFormalTitle : generalFormalTitle,
      officialTitle,
      heldOn,
      startTime,
      endTime,
      meetingNumber: isGeneralMeeting ? meetingNumber : '',
      termLabel: isGeneralMeeting ? termLabel : '',
      meetingTerm: isBoardMeeting ? safeMeetingTerm : '',
      meetingRound: isBoardMeeting ? safeMeetingRound : '',
      meetingPlace: safeMeetingPlace,
      attendeesText: safeAttendeesText,
      chairpersonName: safeChairpersonName,
      bylawsArticle: safeBylawsArticle,
      signatureDate: isBoardMeeting ? signatureDate || heldOn || null : heldOn || null,
      managementCompanyDisplay: safeManagementCompanyDisplay,
      minutesLayoutType: isBoardMeeting ? 'board_formal' : 'standard',
      transcript: result?.transcript ?? '',
      minutes: editableMinutes,
      sourceRecordId,
      agendas: cleanedAgendas.map((agendaTitle) => ({
        title: agendaTitle,
        body: '',
      })),
      actionItems: selectedItems.map((item) => ({
        title: item.title,
        description: item.description,
        type: item.createType,
      })),
      generalMeetingCategory,
      extraordinaryMeetingCount,
      termNumber,
      ownersTotalCount,
      votingRightsTotalCount,
      attendeesCount,
      attendeesVotingRightsCount,
      proxyCount,
      proxyVotingRightsCount,
      writtenVoteCount,
      writtenVoteRightsCount,
      effectiveVotingRightsCount,
    }
  }

  async function handleSaveAsNew() {
    if (!canSaveMinutes) {
      setErrorMessage('保存前に議事録本文と議題を確認してください。')
      return
    }

    const payload = buildSavePayload(currentEditingRecordId || undefined)
    if (!payload) {
      setErrorMessage('保存データの組み立てに失敗しました。')
      return
    }

    setSavingMinutes(true)
    setErrorMessage('')
    setMinutesSaveMessage('')
    setSavedMinutesRecordId('')

    try {
      const response = await fetch('/api/ai-minutes/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as SaveMinutesResponse

      if (!response.ok) {
        setErrorMessage('error' in data ? data.error : '議事録の保存に失敗しました。')
        return
      }

      if (!('success' in data) || !data.success) {
        setErrorMessage('保存結果が不正です。')
        return
      }

      setSavedMinutesRecordId(data.record.id)
      setMinutesSaveMessage(currentEditingRecordId ? '議事録を別バージョンとして保存しました。' : '議事録を保存しました。')
    } catch (error) {
      console.error(error)
      setErrorMessage('議事録保存中に通信エラーが発生しました。')
    } finally {
      setSavingMinutes(false)
    }
  }

  async function handleOverwriteSave() {
    if (!currentEditingRecordId) {
      setErrorMessage('上書き対象の議事録がありません。')
      return
    }

    if (!canSaveMinutes) {
      setErrorMessage('保存前に議事録本文と議題を確認してください。')
      return
    }

    const payload = buildSavePayload()
    if (!payload) {
      setErrorMessage('保存データの組み立てに失敗しました。')
      return
    }

    const ok = window.confirm('この保存済み議事録を上書き保存しますか？')
    if (!ok) return

    setSavingMinutes(true)
    setErrorMessage('')
    setMinutesSaveMessage('')
    setSavedMinutesRecordId('')

    try {
      const response = await fetch(`/api/ai-minutes/records/${currentEditingRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as SaveMinutesResponse

      if (!response.ok) {
        setErrorMessage('error' in data ? data.error : '上書き保存に失敗しました。')
        return
      }

      if (!('success' in data) || !data.success) {
        setErrorMessage('保存結果が不正です。')
        return
      }

      setSavedMinutesRecordId(data.record.id)
      setMinutesSaveMessage('保存済み議事録を上書き保存しました。')
    } catch (error) {
      console.error(error)
      setErrorMessage('上書き保存中に通信エラーが発生しました。')
    } finally {
      setSavingMinutes(false)
    }
  }

  async function handleSaveActionItems() {
    const checkedItems = selectedItems.filter((item) => item.checked)

    if (!propertyId) {
      setErrorMessage('マンション名を選択してください。')
      return
    }

    if (checkedItems.length === 0) {
      setErrorMessage('追加する宿題を1つ以上選択してください。')
      return
    }

    setSavingItems(true)
    setErrorMessage('')
    setSaveMessage('')

    try {
      const response = await fetch('/api/ai-minutes/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          sourceMinutesRecordId: currentEditingRecordId || undefined,
          items: checkedItems.map((item) => ({
            title: item.title,
            description: item.description,
            createType: item.createType,
          })),
        }),
      })

      const data = (await response.json()) as SaveActionItemsResponse

      if (!response.ok) {
        setErrorMessage('error' in data ? data.error : '追加に失敗しました。')
        return
      }

      if (!('success' in data) || !data.success) {
        setErrorMessage('追加結果が不正です。')
        return
      }

      setSavedPropertyId(data.propertyId)
      setSaveMessage(`案件 ${data.createdCases} 件、タスク ${data.createdTasks} 件を追加しました。`)
    } catch (error) {
      console.error(error)
      setErrorMessage('案件・タスク追加中に通信エラーが発生しました。')
    } finally {
      setSavingItems(false)
    }
  }

  async function handleDownloadWord() {
    if (!selectedProperty) return

    try {
      setDownloadingWord(true)

      const html = isBoardMeeting
        ? buildBoardFormalPrintHtml({
            propertyName: selectedProperty.name,
            meetingTerm: safeMeetingTerm,
            meetingRound: safeMeetingRound,
            heldOn,
            startTime,
            endTime,
            meetingPlace: safeMeetingPlace,
            attendeesText: safeAttendeesText,
            managementCompanyDisplay: safeManagementCompanyDisplay,
            chairpersonName: safeChairpersonName,
            bylawsArticle: safeBylawsArticle,
            signatureDate,
            minutes: editableMinutes,
          })
        : buildGeneralMeetingPrintHtml({
            propertyName: selectedProperty.name,
            generalMeetingCategory,
            extraordinaryMeetingCount,
            termNumber,
            heldOn,
            startTime,
            endTime,
            managementCompanyDisplay: safeManagementCompanyDisplay,
            chairpersonName: safeChairpersonName,
            bylawsArticle: safeBylawsArticle,
            ownersTotalCount,
            votingRightsTotalCount,
            attendeesCount,
            attendeesVotingRightsCount,
            proxyCount,
            proxyVotingRightsCount,
            writtenVoteCount,
            writtenVoteRightsCount,
            effectiveVotingRightsCount,
            minutes: editableMinutes,
          })

      const blob = new Blob([html], {
        type: 'text/html;charset=utf-8',
      })

      const fileNameBase = `${selectedProperty.name}_${meetingType}議事録`
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${fileNameBase}.html`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (error) {
      console.error(error)
      alert('Wordダウンロードに失敗しました。')
    } finally {
      setDownloadingWord(false)
    }
  }

  function handlePrintMinutesOnly() {
    try {
      if (!selectedProperty) {
        alert('物件情報が見つかりません。')
        return
      }

      const html = isBoardMeeting
        ? buildBoardFormalPrintHtml({
            propertyName: selectedProperty.name,
            meetingTerm: safeMeetingTerm,
            meetingRound: safeMeetingRound,
            heldOn,
            startTime,
            endTime,
            meetingPlace: safeMeetingPlace,
            attendeesText: safeAttendeesText,
            managementCompanyDisplay: safeManagementCompanyDisplay,
            chairpersonName: safeChairpersonName,
            bylawsArticle: safeBylawsArticle,
            signatureDate,
            minutes: editableMinutes,
          })
        : buildGeneralMeetingPrintHtml({
            propertyName: selectedProperty.name,
            generalMeetingCategory,
            extraordinaryMeetingCount,
            termNumber,
            heldOn,
            startTime,
            endTime,
            managementCompanyDisplay: safeManagementCompanyDisplay,
            chairpersonName: safeChairpersonName,
            bylawsArticle: safeBylawsArticle,
            ownersTotalCount,
            votingRightsTotalCount,
            attendeesCount,
            attendeesVotingRightsCount,
            proxyCount,
            proxyVotingRightsCount,
            writtenVoteCount,
            writtenVoteRightsCount,
            effectiveVotingRightsCount,
            minutes: editableMinutes,
          })

      const blob = new Blob([html], {
        type: 'text/html;charset=utf-8',
      })

      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank', 'noopener,noreferrer')

      if (!printWindow) {
        URL.revokeObjectURL(url)
        alert('印刷タブを開けませんでした。ポップアップ設定を確認してください。')
        return
      }

      const revoke = () => {
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 3000)
      }

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus()
          printWindow.print()
          revoke()
        }, 400)
      }
    } catch (error) {
      console.error(error)
      alert('印刷準備に失敗しました。')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">議事録AI</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">議事録の作成</h1>
        <p className="mt-2 text-sm text-slate-600">
          会議情報と音声をもとに議事録を作成し、保存・再編集・印刷まで一括で行います。
        </p>
      </section>

      {reuseMessage ? (
        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-sky-700">再編集読込完了</p>
          <p className="mt-2 text-sm text-sky-700">{reuseMessage}</p>
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">会議の種別</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as '総会' | '理事会')}
                disabled={reusingLoading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="総会">総会</option>
                <option value="理事会">理事会</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">マンション名</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={propertiesLoading || reusingLoading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="">{propertiesLoading ? '読み込み中...' : '選択してください'}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">開催日</label>
              <input
                type="date"
                value={heldOn}
                onChange={(e) => setHeldOn(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">開始時刻</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">終了時刻</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {isGeneralMeeting ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">総会種別</label>
                <select
                  value={generalMeetingCategory}
                  onChange={(e) => setGeneralMeetingCategory(e.target.value as '通常総会' | '臨時総会')}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="通常総会">通常総会</option>
                  <option value="臨時総会">臨時総会</option>
                </select>
              </div>

              {generalMeetingCategory === '臨時総会' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">臨時総会回数</label>
                  <input
                    type="text"
                    value={extraordinaryMeetingCount}
                    onChange={(e) => setExtraordinaryMeetingCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                    placeholder="例：第2回"
                  />
                </div>
              ) : (
                <div />
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">第〇期</label>
                <input
                  type="text"
                  value={termNumber}
                  onChange={(e) => setTermNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">規約条番号</label>
                <input
                  type="text"
                  value={bylawsArticle}
                  onChange={(e) => setBylawsArticle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：49"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">組合員総数</label>
                <input
                  type="text"
                  value={ownersTotalCount}
                  onChange={(e) => setOwnersTotalCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：120"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">議決権総数</label>
                <input
                  type="text"
                  value={votingRightsTotalCount}
                  onChange={(e) => setVotingRightsTotalCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：120"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">出席者</label>
                <input
                  type="text"
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：45"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">議決権数</label>
                <input
                  type="text"
                  value={attendeesVotingRightsCount}
                  onChange={(e) => setAttendeesVotingRightsCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：80"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">委任状</label>
                <input
                  type="text"
                  value={proxyCount}
                  onChange={(e) => setProxyCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">議決権数</label>
                <input
                  type="text"
                  value={proxyVotingRightsCount}
                  onChange={(e) => setProxyVotingRightsCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">議決権行使者数</label>
                <input
                  type="text"
                  value={writtenVoteCount}
                  onChange={(e) => setWrittenVoteCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">議決権数</label>
                <input
                  type="text"
                  value={writtenVoteRightsCount}
                  onChange={(e) => setWrittenVoteRightsCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">有効議決権数</label>
                <input
                  type="text"
                  value={effectiveVotingRightsCount}
                  onChange={(e) => setEffectiveVotingRightsCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：115"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">議長名</label>
                <input
                  type="text"
                  value={chairpersonName}
                  onChange={(e) => setChairpersonName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：岡本"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">管理会社</label>
                <input
                  type="text"
                  value={managementCompanyDisplay}
                  onChange={(e) => setManagementCompanyDisplay(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：総合システム管理株式会社　小松"
                />
              </div>
            </div>
          ) : null}

          {isBoardMeeting ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">理事会期</label>
                <input
                  type="text"
                  value={meetingTerm}
                  onChange={(e) => setMeetingTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：39"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">理事会回数</label>
                <input
                  type="text"
                  value={meetingRound}
                  onChange={(e) => setMeetingRound(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">開催場所</label>
                <input
                  type="text"
                  value={meetingPlace}
                  onChange={(e) => setMeetingPlace(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：集会室"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">出席者</label>
                <input
                  type="text"
                  value={attendeesText}
                  onChange={(e) => setAttendeesText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：岡本、高橋、野田"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">理事長名</label>
                <input
                  type="text"
                  value={chairpersonName}
                  onChange={(e) => setChairpersonName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：岡本"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">管理規約条番号</label>
                <input
                  type="text"
                  value={bylawsArticle}
                  onChange={(e) => setBylawsArticle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：49"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">署名欄日付</label>
                <input
                  type="date"
                  value={signatureDate}
                  onChange={(e) => setSignatureDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">管理会社表示</label>
                <input
                  type="text"
                  value={managementCompanyDisplay}
                  onChange={(e) => setManagementCompanyDisplay(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  placeholder="例：総合システム管理株式会社　小松"
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">音声ファイル</label>
            <input
              type="file"
              accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,audio/*"
              onChange={(e) => {
                setAudioFile(e.target.files?.[0] ?? null)
                setResult(null)
                setEditableMinutes('')
                setSelectedItems([])
                setSaveMessage('')
                setSavedPropertyId('')
                setMinutesSaveMessage('')
                setSavedMinutesRecordId('')
                setReuseMessage('')
                setErrorMessage('')
              }}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">議題</h2>
              <p className="mt-1 text-sm text-slate-600">議題名は自分で登録し、AIは本文だけを当てはめます。</p>
            </div>

            <button
              type="button"
              onClick={addAgenda}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              議題を追加
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {agendas.map((agenda, index) => (
              <div key={agenda.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-700">議題 {index + 1}</label>
                  {agendas.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeAgenda(agenda.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      削除
                    </button>
                  ) : null}
                </div>

                <input
                  type="text"
                  value={agenda.title}
                  onChange={(e) => updateAgenda(agenda.id, e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
            ))}
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600">エラー</p>
            <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          </section>
        ) : null}

        {minutesSaveMessage ? (
          <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">保存完了</p>
            <p className="mt-2 text-sm text-sky-700">{minutesSaveMessage}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/ai-minutes/records"
                className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
              >
                保存済み議事録一覧を見る
              </Link>

              {savedMinutesRecordId ? (
                <Link
                  href={`/ai-minutes/records/${savedMinutesRecordId}`}
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  この議事録を開く
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        {saveMessage ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">追加完了</p>
            <p className="mt-2 text-sm text-emerald-700">{saveMessage}</p>

            {savedPropertyId ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/properties/${savedPropertyId}/cases`}
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  この物件の案件一覧を見る
                </Link>

                <Link
                  href={`/properties/${savedPropertyId}/tasks`}
                  className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                >
                  この物件のタスク一覧を見る
                </Link>

                <Link
                  href={`/properties/${savedPropertyId}`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  この物件の詳細を見る
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? '作成中...' : '議事録の作成'}
          </button>
        </div>
      </form>

      {(result || editableMinutes) ? (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">生成結果 / 編集</h2>
                <p className="mt-1 text-sm text-slate-600">
                  議事録本文はここで修正できます。再編集時は上書き保存か別名保存を選べます。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  コピー
                </button>

                <button
                  type="button"
                  onClick={handlePrintMinutesOnly}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  議事録のみ印刷
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWord}
                  disabled={downloadingWord}
                  className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingWord ? '保存中...' : 'Word互換HTML保存'}
                </button>

                {currentEditingRecordId ? (
                  <>
                    <button
                      type="button"
                      onClick={handleOverwriteSave}
                      disabled={!canSaveMinutes || savingMinutes}
                      className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      {savingMinutes ? '保存中...' : '上書き保存'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAsNew}
                      disabled={!canSaveMinutes || savingMinutes}
                      className="rounded-xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      {savingMinutes ? '保存中...' : '別名保存'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    disabled={!canSaveMinutes || savingMinutes}
                    className="rounded-xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    {savingMinutes ? '保存中...' : 'この議事録を保存する'}
                  </button>
                )}
              </div>
            </div>

            {isBoardMeeting ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <h3 className="text-3xl font-bold text-slate-900">{boardFormalTitle}</h3>
                  <p className="mt-8 text-2xl font-semibold text-slate-900">
                    {selectedProperty?.name ?? ''}管理組合
                  </p>
                  <p className="mt-8 text-lg text-slate-700">{heldOnText}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-center text-2xl font-bold text-slate-900">{boardFormalHeading}</h3>

                  <table className="mt-5 w-full border-collapse text-sm">
                    <tbody>
                      <tr>
                        <td className="w-40 border border-slate-400 px-4 py-3 font-semibold text-slate-900">開催日時</td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">{heldOnText}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">開催場所</td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">{safeMeetingPlace}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">出席者</td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">{safeAttendeesText}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">管理会社</td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">{safeManagementCompanyDisplay}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-8 space-y-6 text-sm leading-8 text-slate-800">
                    <p className="whitespace-pre-wrap">{formatIndentedParagraphs(boardFormalOpenText)}</p>
                  </div>

                  <textarea
                    value={editableMinutes}
                    onChange={(e) => setEditableMinutes(e.target.value)}
                    className="mt-6 min-h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-9 text-slate-700 outline-none focus:border-slate-400"
                  />

                  <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm font-semibold text-slate-700">最終ページプレビュー</p>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-800">
                      {formatIndentedParagraphs(`${boardFormalCloseText}\n${boardFormalRegulationText}`)}
                    </div>
                    <p className="mt-8 text-sm text-slate-800">{formatDateOnly(signatureDate || heldOn)}</p>

                    <div className="mt-6 text-sm text-slate-800" style={{ marginLeft: '110pt' }}>
                      {selectedProperty?.name ?? ''}管理組合
                    </div>

                    <div className="mt-8 space-y-6 text-sm text-slate-800" style={{ marginLeft: '110pt' }}>
                      <div className="grid" style={{ gridTemplateColumns: '180pt 140pt 60pt' }}>
                        <div className="text-left">議長</div>
                        <div className="text-left"></div>
                        <div className="text-left">印</div>
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: '180pt 140pt 60pt' }}>
                        <div className="text-left">議事録署名人</div>
                        <div className="text-left"></div>
                        <div className="text-left">印</div>
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: '180pt 140pt 60pt' }}>
                        <div className="text-left">議事録署名人</div>
                        <div className="text-left"></div>
                        <div className="text-left">印</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <h3 className="text-3xl font-bold text-slate-900">{generalFormalTitle}</h3>
                  <p className="mt-8 text-2xl font-semibold text-slate-900">
                    {selectedProperty?.name ?? ''}管理組合
                  </p>
                  <p className="mt-8 text-lg text-slate-700">{heldOnText}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-center text-2xl font-bold text-slate-900">{generalFormalHeading}</h3>

                  <table className="mt-5 w-full border-collapse text-sm">
                    <tbody>
                      <tr>
                        <td className="w-40 border border-slate-400 px-4 py-3 font-semibold text-slate-900">開催日時</td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">{heldOnText}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">組合員総数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{ownersTotalCount || '0'}人</td>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">議決権総数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{votingRightsTotalCount || '0'}個</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">出席者</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{attendeesCount || '0'}人</td>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">議決権数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{attendeesVotingRightsCount || '0'}個</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">委任状</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{proxyCount || '0'}人</td>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">議決権数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{proxyVotingRightsCount || '0'}個</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">議決権行使者数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{writtenVoteCount || '0'}人</td>
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">議決権数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{writtenVoteRightsCount || '0'}個</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-slate-400 px-4 py-3 text-slate-700" />
                          <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-900">有効議決権数</td>
                          <td className="border border-slate-400 px-4 py-3 text-slate-700">{effectiveVotingRightsCount || '0'}個</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <table className="mt-5 w-full border-collapse text-sm">
                    <tbody>
                      <tr>
                        <td className="w-40 border border-slate-400 px-4 py-3 font-semibold text-slate-900">管理会社</td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">{safeManagementCompanyDisplay}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-8 space-y-6 text-sm leading-8 text-slate-800">
                    <p className="whitespace-pre-wrap">{formatIndentedParagraphs(generalOpeningReport)}</p>
                  </div>

                  <textarea
                    value={editableMinutes}
                    onChange={(e) => setEditableMinutes(e.target.value)}
                    className="mt-6 min-h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-9 text-slate-700 outline-none focus:border-slate-400"
                  />

                  <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm font-semibold text-slate-700">最終ページプレビュー</p>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-800">
                      {formatIndentedParagraphs(`${generalCloseText}\n${generalRegulationText}`)}
                    </div>
                    <p className="mt-8 text-sm text-slate-800">{formatDateOnly(heldOn)}</p>

                    <div className="mt-6 text-sm text-slate-800" style={{ marginLeft: '110pt' }}>
                      {selectedProperty?.name ?? ''}管理組合
                    </div>

                    <div className="mt-8 space-y-6 text-sm text-slate-800" style={{ marginLeft: '110pt' }}>
                      <div className="grid" style={{ gridTemplateColumns: '180pt 140pt 60pt' }}>
                        <div className="text-left">議長</div>
                        <div className="text-left"></div>
                        <div className="text-left">印</div>
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: '180pt 140pt 60pt' }}>
                        <div className="text-left">議事録署名人</div>
                        <div className="text-left"></div>
                        <div className="text-left">印</div>
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: '180pt 140pt 60pt' }}>
                        <div className="text-left">議事録署名人</div>
                        <div className="text-left"></div>
                        <div className="text-left">印</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">抽出された宿題</h2>
                <p className="mt-1 text-sm text-slate-600">選択したものだけ案件・タスクに追加できます。</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={checkAllActionItems}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  すべて選択
                </button>
                <button
                  type="button"
                  onClick={uncheckAllActionItems}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  すべて解除
                </button>
              </div>
            </div>

            {selectedItems.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                宿題は抽出されませんでした。
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {selectedItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleActionItem(item.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>

                      <div className="min-w-[150px]">
                        <label className="mb-2 block text-xs font-medium text-slate-600">追加先</label>
                        <select
                          value={item.createType}
                          onChange={(e) => changeActionItemType(item.id, e.target.value as 'task' | 'case')}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                        >
                          <option value="task">タスク</option>
                          <option value="case">案件</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!hasCheckedItems || savingItems}
                    onClick={handleSaveActionItems}
                    className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {savingItems ? '追加中...' : '選択した宿題を案件・タスクに追加'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {result?.transcript ? (
            <details className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                文字起こし結果を確認する
              </summary>

              <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 font-sans text-sm leading-8 text-slate-700">
                {result.transcript}
              </pre>
            </details>
          ) : null}
        </>
      ) : null}
    </div>
  )
}