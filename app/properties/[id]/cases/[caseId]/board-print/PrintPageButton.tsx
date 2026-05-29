'use client'

export default function PrintPageButton() {
  function handlePrint() {
    const source = document.getElementById('board-print-document')

    if (!source) {
      window.alert('印刷対象が見つかりませんでした。ページを再読み込みしてください。')
      return
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1200')

    if (!printWindow) {
      window.alert('印刷用ウィンドウを開けませんでした。ポップアップブロックを確認してください。')
      return
    }

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>理事会提出用 印刷</title>
  <style>
    @page {
      size: A4;
      margin: 8mm;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: white;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
    }

    body {
      padding: 0;
    }

    .print-root {
      width: 100%;
      box-sizing: border-box;
    }

    .print-root * {
      box-sizing: border-box;
    }

    h1 {
      font-size: 24px;
      margin: 0;
      font-weight: 700;
    }

    h2 {
      font-size: 18px;
      margin: 0;
      font-weight: 700;
    }

    p {
      margin: 0;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      margin: 0;
      font-family: inherit;
    }

    .rounded-2xl,
    .rounded-xl,
    .rounded-lg,
    .rounded-full {
      border-radius: 0 !important;
    }

    .shadow-sm {
      box-shadow: none !important;
    }

    .bg-slate-50,
    .bg-slate-100,
    .bg-white {
      background: white !important;
    }

    .border,
    .border-b,
    .border-dashed {
      border-color: #94a3b8 !important;
    }

    .p-6 { padding: 16px !important; }
    .p-4 { padding: 12px !important; }
    .pt-4 { padding-top: 12px !important; }
    .pb-4 { padding-bottom: 12px !important; }
    .mt-1 { margin-top: 4px !important; }
    .mt-2 { margin-top: 8px !important; }
    .mt-3 { margin-top: 10px !important; }
    .mt-5 { margin-top: 16px !important; }
    .mt-6 { margin-top: 18px !important; }
    .mt-8 { margin-top: 24px !important; }

    .text-2xl { font-size: 24px !important; line-height: 1.3 !important; }
    .text-lg { font-size: 18px !important; line-height: 1.4 !important; }
    .text-sm { font-size: 12px !important; line-height: 1.7 !important; }
    .text-xs { font-size: 10px !important; line-height: 1.6 !important; }

    .leading-7 { line-height: 1.7 !important; }
    .font-bold { font-weight: 700 !important; }
    .font-semibold { font-weight: 600 !important; }

    .space-y-3 > * + * { margin-top: 10px !important; }
    .space-y-4 > * + * { margin-top: 12px !important; }

    .flex {
      display: flex !important;
    }

    .flex-wrap {
      flex-wrap: wrap !important;
    }

    .items-center {
      align-items: center !important;
    }

    .gap-2 {
      gap: 6px !important;
    }

    .break-all {
      word-break: break-all !important;
    }

    @media print {
      html, body {
        width: 100%;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="print-root">
    ${source.outerHTML}
  </div>
</body>
</html>
`

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    printWindow.focus()

    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
    >
      この報告書だけ印刷
    </button>
  )
}