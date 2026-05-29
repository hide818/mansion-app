'use client'

export default function PrintHandoverButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 print:hidden"
    >
      印刷 / PDF保存
    </button>
  )
}