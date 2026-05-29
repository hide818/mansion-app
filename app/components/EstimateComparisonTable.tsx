type EstimateComparisonTableVendor = {
  id: string
  vendorName: string
  headline: string
  estimateText: string
  priceText: string
  notes: string
  enabled?: boolean
}

type EstimateComparisonTableRow = {
  item: string
  vendorA: string
  vendorB: string
  vendorC: string
  comment: string
}

type EstimateComparisonTableProps = {
  vendors: EstimateComparisonTableVendor[]
  rows: EstimateComparisonTableRow[]
}

export default function EstimateComparisonTable({
  vendors,
  rows,
}: EstimateComparisonTableProps) {
  const activeVendors = vendors.filter(
    (vendor) =>
      Boolean(vendor.enabled ?? true) &&
      (vendor.vendorName.trim() || vendor.estimateText.trim())
  )

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        まだ比較表はありません。見積本文を2社以上入力して「AI見積比較を実行」を押すとここに出ます。
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-900">
              比較項目
            </th>

            {activeVendors.map((vendor) => (
              <th
                key={vendor.id}
                className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-900"
              >
                {vendor.vendorName.trim() || `業者${vendor.id.replace('vendor-', '')}`}
              </th>
            ))}

            <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-900">
              コメント
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const values = [row.vendorA, row.vendorB, row.vendorC]

            return (
              <tr key={`${row.item}-${index}`} className="align-top">
                <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
                  {row.item}
                </td>

                {activeVendors.map((vendor, vendorIndex) => (
                  <td
                    key={`${row.item}-${vendor.id}`}
                    className="border-b border-slate-100 px-4 py-3 text-slate-700"
                  >
                    {values[vendorIndex] || '-'}
                  </td>
                ))}

                <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                  {row.comment || '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}