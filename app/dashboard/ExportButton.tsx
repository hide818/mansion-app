'use client'

export default function ExportButton() {
  const handleExport = () => {
    window.location.href = '/api/export/cases'
  }

  return (
    <button
      onClick={handleExport}
      className="bg-white border px-4 py-2 rounded-lg hover:bg-gray-50"
    >
      CSV出力
    </button>
  )
}