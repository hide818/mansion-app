type EstimateComparisonSummaryVendor = {
  id: string
  vendorName: string
  headline: string
  estimateText: string
  priceText: string
  notes: string
  enabled?: boolean
}

type EstimateComparisonSummaryResult = {
  recommendedVendor?: string
  questions?: string[]
  cautions?: string[]
  strengths?: string[]
}

type EstimateComparisonSummaryCardsProps = {
  vendors: EstimateComparisonSummaryVendor[]
  result: EstimateComparisonSummaryResult | null
}

function SummaryCard({
  label,
  value,
  subtext,
}: {
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-bold text-slate-900">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-2 text-xs leading-6 text-slate-500">{subtext}</div>
    </div>
  )
}

export default function EstimateComparisonSummaryCards({
  vendors,
  result,
}: EstimateComparisonSummaryCardsProps) {
  const comparedCount = vendors.filter(
    (vendor) =>
      Boolean(vendor.enabled ?? true) &&
      (vendor.vendorName.trim() || vendor.estimateText.trim())
  ).length

  const questionCount = result?.questions?.length ?? 0
  const cautionCount = result?.cautions?.length ?? 0
  const strengthCount = result?.strengths?.length ?? 0

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="推奨業者"
        value={result?.recommendedVendor || '未判定'}
        subtext="比較結果から最も推奨された業者です"
      />
      <SummaryCard
        label="比較社数"
        value={`${comparedCount}社`}
        subtext="今回比較に使っている業者数です"
      />
      <SummaryCard
        label="要確認"
        value={`${questionCount}件`}
        subtext="比較前に詰めたい確認質問の数です"
      />
      <SummaryCard
        label="注意点"
        value={`${cautionCount}件 / 強み ${strengthCount}件`}
        subtext="比較時に見ておきたい注意点と強みです"
      />
    </div>
  )
}