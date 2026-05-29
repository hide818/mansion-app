'use client'

type EstimateComparisonCopyButtonProps = {
  text: string
  label?: string
  onCopied?: () => void
}

export default function EstimateComparisonCopyButton({
  text,
  label = 'コピー',
  onCopied,
}: EstimateComparisonCopyButtonProps) {
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        onCopied?.()
      }}
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </button>
  )
}