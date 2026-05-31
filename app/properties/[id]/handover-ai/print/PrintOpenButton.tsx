'use client'

export default function PrintOpenButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex min-w-[64px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:opacity-90"
    >
      印刷する
    </button>
  )
}