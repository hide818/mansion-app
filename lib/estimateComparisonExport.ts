import type { EstimateComparisonResultData } from '../app/components/EstimateComparisonResultSections'

function sanitizeFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise<void>((resolve) => {
    let resolved = false
    const done = () => {
      if (resolved) return
      resolved = true
      resolve()
    }
    iframe.addEventListener('load', done, { once: true })
    window.setTimeout(done, 500)
  })
}

function deriveVendorCols(result: EstimateComparisonResultData): string[] {
  const fromRows = [
    ...new Set(
      result.comparisonRows
        .flatMap((row) => row.values.map((v) => v.vendorName))
        .filter(Boolean)
    ),
  ]
  return fromRows.length > 0 ? fromRows : result.vendorSummaries.map((vs) => vs.vendorName)
}

function buildPdfHtml(
  result: EstimateComparisonResultData,
  appliedSections: string[],
  projectTitle: string,
  vendorCols: string[]
): string {
  const has = (s: string) => appliedSections.includes(s)
  let sectionsHtml = ''

  sectionsHtml += `
    <div class="section">
      <div class="section-num">01</div>
      <h2 class="section-title">総評</h2>
      <p class="body-text">${escapeHtml(result.overview)}</p>
    </div>`

  if (has('comparisonTable') && result.comparisonRows.length > 0) {
    const headerCells = ['比較項目', ...vendorCols, '備考']
      .map((h) => `<th>${escapeHtml(h)}</th>`)
      .join('')
    const bodyRows = result.comparisonRows
      .map((row) => {
        const cells = vendorCols
          .map((name) => {
            const found = row.values.find((v) => v.vendorName === name)
            return `<td>${escapeHtml(found?.value ?? '見積書上では確認できません')}</td>`
          })
          .join('')
        return `<tr><td class="item-col">${escapeHtml(row.item)}</td>${cells}<td class="note-col">${escapeHtml(row.note ?? '')}</td></tr>`
      })
      .join('')
    sectionsHtml += `
      <div class="section">
        <div class="section-num">02</div>
        <h2 class="section-title">比較表</h2>
        <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
      </div>`
  }

  if (has('vendorSummaries') && result.vendorSummaries.length > 0) {
    const cards = result.vendorSummaries
      .map((vs) => {
        const str =
          vs.strengths.length > 0
            ? `<div class="vendor-label strengths-label">基準見積との比較・特長</div><ul>${vs.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
            : ''
        const con =
          vs.concerns.length > 0
            ? `<div class="vendor-label concerns-label">基準見積との差異・懸念点</div><ul>${vs.concerns.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
            : ''
        return `<div class="vendor-card"><div class="vendor-name">${escapeHtml(vs.vendorName)}</div><div class="vendor-amount">見積総額：${escapeHtml(vs.totalAmount)}</div>${str}${con}</div>`
      })
      .join('')
    sectionsHtml += `
      <div class="section">
        <div class="section-num">03</div>
        <h2 class="section-title">各社の特徴</h2>
        <div class="vendor-grid">${cards}</div>
      </div>`
  }

  if (has('priceDifference') && result.priceDifferenceSummary) {
    const badge = result.cheapestVendor
      ? `<div class="cheapest-badge">最安値：${escapeHtml(result.cheapestVendor)}（金額のみの判断は禁物です）</div>`
      : ''
    sectionsHtml += `
      <div class="section">
        <div class="section-num">04</div>
        <h2 class="section-title">金額差・注意点</h2>
        ${badge}
        <p class="body-text">${escapeHtml(result.priceDifferenceSummary)}</p>
      </div>`
  }

  if (has('missingItems') && result.missingItems.length > 0) {
    const items = result.missingItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('')
    sectionsHtml += `
      <div class="section">
        <div class="section-num">05</div>
        <h2 class="section-title">不足している項目</h2>
        <ul>${items}</ul>
      </div>`
  }

  if (has('questionsToVendors') && result.questionsToVendors.length > 0) {
    const qs = result.questionsToVendors
      .map((q, i) => `<li><span class="q-num">Q${i + 1}</span>${escapeHtml(q)}</li>`)
      .join('')
    sectionsHtml += `
      <div class="section">
        <div class="section-num">06</div>
        <h2 class="section-title">業者へ確認すべき質問</h2>
        <ul>${qs}</ul>
      </div>`
  }

  if (has('boardComment') && result.boardComment) {
    sectionsHtml += `
      <div class="section section-board">
        <div class="section-num section-num-board">07</div>
        <h2 class="section-title">理事会向けコメント</h2>
        <div class="comment-box">${escapeHtml(result.boardComment).replace(/\n/g, '<br/>')}</div>
      </div>`
  }

  if (has('agendaDraft') && result.agendaDraft) {
    sectionsHtml += `
      <div class="section section-agenda">
        <div class="section-num section-num-agenda">08</div>
        <h2 class="section-title">総会議案文</h2>
        <div class="comment-box">${escapeHtml(result.agendaDraft).replace(/\n/g, '<br/>')}</div>
      </div>`
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<title>${escapeHtml(projectTitle)}</title>
<style>
html,body{margin:0;padding:0;background:#fff;color:#111;font-family:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif;}
#pdf-root{width:794px;box-sizing:border-box;padding:40px;}
.doc-label{font-size:11px;font-weight:700;letter-spacing:.18em;color:#059669;margin:0 0 8px;}
.doc-heading{font-size:26px;font-weight:700;color:#111;margin:0 0 4px;}
.doc-date{font-size:12px;color:#64748b;margin:0 0 28px;}
.section{border:1px solid #e2e8f0;border-radius:14px;padding:24px;margin-bottom:18px;background:#fff;}
.section-board{border-color:#d1fae5;}.section-agenda{border-color:#ede9fe;}
.section-num{font-size:10px;font-weight:700;letter-spacing:.18em;color:#94a3b8;margin-bottom:5px;}
.section-num-board{color:#059669;}.section-num-agenda{color:#7c3aed;}
.section-title{font-size:17px;font-weight:700;color:#0f172a;margin:0 0 12px;}
.body-text{font-size:13px;line-height:1.9;color:#334155;margin:0;}
table{width:100%;border-collapse:collapse;font-size:11px;}
th{padding:7px 9px;text-align:left;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;}
td{padding:7px 9px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:top;line-height:1.6;}
.item-col{font-weight:600;white-space:nowrap;}.note-col{font-size:11px;color:#64748b;}
.vendor-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.vendor-card{border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#f8fafc;}
.vendor-name{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px;}
.vendor-amount{font-size:12px;font-weight:600;color:#475569;margin-bottom:6px;}
.vendor-label{font-size:10px;font-weight:700;margin-top:7px;margin-bottom:2px;}
.strengths-label{color:#059669;}.concerns-label{color:#b45309;}
.vendor-card ul{margin:0;padding-left:13px;}.vendor-card li{font-size:11px;line-height:1.7;color:#334155;}
.cheapest-badge{display:inline-block;border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:5px 12px;font-size:12px;font-weight:600;color:#92400e;margin-bottom:9px;}
ul{margin:0;padding-left:16px;}li{font-size:13px;line-height:1.8;color:#334155;}
.q-num{display:inline-block;font-weight:700;color:#0284c7;margin-right:5px;}
.comment-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.9;color:#1e293b;}
</style>
</head>
<body>
<div id="pdf-root">
  <div class="doc-label">AIツール / 見積比較表</div>
  <h1 class="doc-heading">${escapeHtml(projectTitle)}</h1>
  <div class="doc-date">${today}</div>
  ${sectionsHtml}
</div>
</body>
</html>`
}

export async function exportEstimateComparisonToExcel(
  result: EstimateComparisonResultData,
  appliedSections: string[],
  projectTitle: string
): Promise<void> {
  const XLSX = await import('xlsx')
  const has = (s: string) => appliedSections.includes(s)
  const vendorCols = deriveVendorCols(result)

  const wb = XLSX.utils.book_new()

  // 1. 比較表（comparisonTable が選択されているか、行データがあれば出力）
  if (has('comparisonTable') && result.comparisonRows.length > 0) {
    const header = ['比較項目', ...vendorCols, '備考']
    const rows = result.comparisonRows.map((row) => {
      const cells = vendorCols.map((name) => {
        const found = row.values.find((v) => v.vendorName === name)
        return found?.value ?? '見積書上では確認できません'
      })
      return [row.item, ...cells, row.note ?? '']
    })
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, '比較表')
  }

  // 2. 各社特徴
  if (has('vendorSummaries') && result.vendorSummaries.length > 0) {
    const rows: string[][] = [['業者名', '見積総額', '特長', '懸念点']]
    for (const vs of result.vendorSummaries) {
      rows.push([
        vs.vendorName,
        vs.totalAmount,
        vs.strengths.join('\n'),
        vs.concerns.join('\n'),
      ])
    }
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, '各社特徴')
  }

  // 3. 金額差・注意点
  if (has('priceDifference') && result.priceDifferenceSummary) {
    const rows: string[][] = []
    if (result.cheapestVendor) {
      rows.push(['最安値業者', result.cheapestVendor])
    }
    rows.push(['金額差・注意点', result.priceDifferenceSummary])
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, '金額差・注意点')
  }

  // 4. 不足項目
  if (has('missingItems') && result.missingItems.length > 0) {
    const rows: string[][] = [['不足している項目']]
    result.missingItems.forEach((item) => rows.push([item]))
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, '不足項目')
  }

  // 5. 業者への確認事項
  if (has('questionsToVendors') && result.questionsToVendors.length > 0) {
    const rows: string[][] = [['Q番号', '質問内容']]
    result.questionsToVendors.forEach((q, i) => rows.push([`Q${i + 1}`, q]))
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, '業者への確認事項')
  }

  // 6. 理事会コメント
  if (has('boardComment') && result.boardComment) {
    const ws = XLSX.utils.aoa_to_sheet([['理事会向けコメント'], [result.boardComment]])
    XLSX.utils.book_append_sheet(wb, ws, '理事会コメント')
  }

  // 7. 総会議案文
  if (has('agendaDraft') && result.agendaDraft) {
    const ws = XLSX.utils.aoa_to_sheet([['総会議案文'], [result.agendaDraft]])
    XLSX.utils.book_append_sheet(wb, ws, '総会議案文')
  }

  const date = new Date().toISOString().slice(0, 10)
  const title = sanitizeFileName(projectTitle || '工事見積比較')
  XLSX.writeFile(wb, `見積比較表_${title}_${date}.xlsx`)
}

export async function exportEstimateComparisonToPdf(
  result: EstimateComparisonResultData,
  appliedSections: string[],
  projectTitle: string
): Promise<void> {
  const vendorCols = deriveVendorCols(result)
  let tempIframe: HTMLIFrameElement | null = null

  try {
    tempIframe = document.createElement('iframe')
    tempIframe.style.cssText =
      'position:fixed;left:-10000px;top:0;width:820px;height:1200px;opacity:0;pointer-events:none;'
    tempIframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(tempIframe)

    const iframeDocument =
      tempIframe.contentDocument ?? tempIframe.contentWindow?.document
    if (!iframeDocument) throw new Error('PDF出力用の一時画面を作成できませんでした')

    iframeDocument.open()
    iframeDocument.write(buildPdfHtml(result, appliedSections, projectTitle, vendorCols))
    iframeDocument.close()

    await waitForIframeLoad(tempIframe)

    const target = iframeDocument.getElementById('pdf-root')
    if (!target) throw new Error('PDF出力用の内容が見つかりませんでした')

    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 900,
      windowHeight: target.scrollHeight + 100,
    })

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const margin = 10
    const printableWidth = 210 - margin * 2
    const printableHeight = 297 - margin * 2
    const imageData = canvas.toDataURL('image/png')
    const imageHeight = (canvas.height * printableWidth) / canvas.width

    let heightLeft = imageHeight
    let position = margin
    pdf.addImage(imageData, 'PNG', margin, position, printableWidth, imageHeight)
    heightLeft -= printableHeight

    while (heightLeft > 0) {
      position = margin - (imageHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', margin, position, printableWidth, imageHeight)
      heightLeft -= printableHeight
    }

    const date = new Date().toISOString().slice(0, 10)
    const title = sanitizeFileName(projectTitle || '工事見積比較')
    pdf.save(`見積比較表_${title}_${date}.pdf`)
  } finally {
    if (tempIframe?.parentNode) {
      tempIframe.parentNode.removeChild(tempIframe)
    }
  }
}
