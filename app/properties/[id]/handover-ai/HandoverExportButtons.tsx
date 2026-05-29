'use client'

import { useMemo, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type Props = {
  propertyId: string
  propertyName: string
  address: string
  content: string
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .trim()
}

function toRtfUnicode(text: string) {
  let result = ''

  for (const char of text) {
    if (char === '\\') {
      result += '\\\\'
      continue
    }

    if (char === '{') {
      result += '\\{'
      continue
    }

    if (char === '}') {
      result += '\\}'
      continue
    }

    if (char === '\n') {
      result += '\\line '
      continue
    }

    const code = char.charCodeAt(0)

    if (code > 127) {
      const signedCode = code > 32767 ? code - 65536 : code
      result += `\\u${signedCode}?`
      continue
    }

    result += char
  }

  return result
}

function buildRtfDocument(args: {
  propertyName: string
  address: string
  content: string
}) {
  const header = [
    '引き継ぎ書',
    '',
    `物件名: ${args.propertyName}`,
    `住所: ${args.address}`,
    '',
  ].join('\n')

  const body = `${header}${args.content}`

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss Helvetica;}}\\uc1\\pard\\f0\\fs24 ${toRtfUnicode(
    body
  )}}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPdfHtml(args: {
  propertyName: string
  address: string
  content: string
}) {
  const safePropertyName = escapeHtml(args.propertyName)
  const safeAddress = escapeHtml(args.address)
  const safeContent = escapeHtml(args.content).replace(/\n/g, '<br />')

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>引き継ぎ書</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111111;
      }

      body {
        font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
      }

      .sheet {
        width: 794px;
        box-sizing: border-box;
        background: #ffffff;
        color: #111111;
        padding: 40px;
      }

      .title {
        font-size: 32px;
        font-weight: 700;
        line-height: 1.4;
        margin: 0 0 12px 0;
      }

      .meta {
        font-size: 16px;
        line-height: 1.8;
        margin: 0;
      }

      .header {
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 16px;
      }

      .content {
        margin-top: 24px;
        font-size: 15px;
        line-height: 2;
        white-space: normal;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <div id="pdf-root" class="sheet">
      <div class="header">
        <h1 class="title">引き継ぎ書</h1>
        <p class="meta">物件名: ${safePropertyName}</p>
        <p class="meta">住所: ${safeAddress}</p>
      </div>

      <div class="content">${safeContent}</div>
    </div>
  </body>
</html>`
}

function waitForIframeLoad(iframe: HTMLIFrameElement) {
  return new Promise<void>((resolve) => {
    let resolved = false

    const done = () => {
      if (resolved) return
      resolved = true
      resolve()
    }

    iframe.addEventListener('load', done, { once: true })
    window.setTimeout(done, 300)
  })
}

export default function HandoverExportButtons({
  propertyId,
  propertyName,
  address,
  content,
}: Props) {
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [message, setMessage] = useState('')

  const fileBaseName = useMemo(() => {
    const safePropertyName = sanitizeFileName(propertyName || 'property')
    return `${safePropertyName}_引き継ぎ書`
  }, [propertyName])

  async function handleDownloadPdf() {
    let tempIframe: HTMLIFrameElement | null = null

    try {
      setIsExportingPdf(true)
      setMessage('PDFを作成中です...')

      tempIframe = document.createElement('iframe')
      tempIframe.style.position = 'fixed'
      tempIframe.style.left = '-10000px'
      tempIframe.style.top = '0'
      tempIframe.style.width = '820px'
      tempIframe.style.height = '1200px'
      tempIframe.style.opacity = '0'
      tempIframe.style.pointerEvents = 'none'
      tempIframe.setAttribute('aria-hidden', 'true')

      document.body.appendChild(tempIframe)

      const iframeDocument =
        tempIframe.contentDocument || tempIframe.contentWindow?.document

      if (!iframeDocument) {
        throw new Error('PDF出力用の一時画面を作成できませんでした')
      }

      iframeDocument.open()
      iframeDocument.write(
        buildPdfHtml({
          propertyName,
          address,
          content,
        })
      )
      iframeDocument.close()

      await waitForIframeLoad(tempIframe)

      const target = iframeDocument.getElementById('pdf-root')

      if (!target) {
        throw new Error('PDF出力用の内容が見つかりませんでした')
      }

      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 900,
        windowHeight: target.scrollHeight + 100,
      })

      const imageData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = 210
      const pageHeight = 297
      const margin = 10
      const printableWidth = pageWidth - margin * 2
      const printableHeight = pageHeight - margin * 2
      const imageHeight = (canvas.height * printableWidth) / canvas.width

      let heightLeft = imageHeight
      let position = margin

      pdf.addImage(
        imageData,
        'PNG',
        margin,
        position,
        printableWidth,
        imageHeight
      )
      heightLeft -= printableHeight

      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(
          imageData,
          'PNG',
          margin,
          position,
          printableWidth,
          imageHeight
        )
        heightLeft -= printableHeight
      }

      pdf.save(`${fileBaseName}.pdf`)
      setMessage('PDFをダウンロードしました')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'PDFの作成中にエラーが発生しました'
      )
    } finally {
      if (tempIframe && tempIframe.parentNode) {
        tempIframe.parentNode.removeChild(tempIframe)
      }

      setIsExportingPdf(false)
    }
  }

  function handleDownloadWord() {
    try {
      setIsExportingWord(true)
      setMessage('Wordファイルを作成中です...')

      const rtf = buildRtfDocument({
        propertyName,
        address,
        content,
      })

      const blob = new Blob([rtf], { type: 'application/rtf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `${fileBaseName}.rtf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage('Wordファイルをダウンロードしました')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Wordファイルの作成中にエラーが発生しました'
      )
    } finally {
      setIsExportingWord(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">保存版の出力</h2>
      <p className="mt-2 text-sm text-slate-600">
        保存済みの引き継ぎ書を基準に、そのまま印刷・PDF・Word出力できます。
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`/properties/${propertyId}/handover-ai/print`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          印刷ページを開く
        </a>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExportingPdf ? 'PDF作成中...' : 'PDFで保存'}
        </button>

        <button
          type="button"
          onClick={handleDownloadWord}
          disabled={isExportingWord}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExportingWord ? 'Word作成中...' : 'Wordでダウンロード'}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </div>
  )
}