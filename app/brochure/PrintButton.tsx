'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-[#1A6B4A] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#155C3E] transition-colors"
    >
      PDFで保存する
    </button>
  )
}
