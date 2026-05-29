type EstimateComparisonDocumentsTabsVendor = {
  id: string
  vendorName: string
  headline: string
  estimateText: string
  priceText: string
  notes: string
  enabled?: boolean
}

type EstimateComparisonDocumentsTabsProps = {
  vendors: EstimateComparisonDocumentsTabsVendor[]
  activeVendorId: string
  onChangeVendor: (vendorId: string) => void
}

export default function EstimateComparisonDocumentsTabs({
  vendors,
  activeVendorId,
  onChangeVendor,
}: EstimateComparisonDocumentsTabsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {vendors.map((vendor) => {
          const isActive = vendor.id === activeVendorId
          const filled = Boolean(
            vendor.vendorName.trim() ||
              vendor.headline.trim() ||
              vendor.estimateText.trim() ||
              vendor.priceText.trim() ||
              vendor.notes.trim()
          )

          return (
            <button
              key={vendor.id}
              type="button"
              onClick={() => onChangeVendor(vendor.id)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{vendor.vendorName.trim() || `業者${vendor.id.replace('vendor-', '')}`}</span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  filled
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {filled ? '入力済み' : '未入力'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}