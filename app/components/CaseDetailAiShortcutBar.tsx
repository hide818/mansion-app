import Link from 'next/link'

type CaseDetailAiShortcutBarProps = {
  propertyId?: string
  caseId?: string
  className?: string
  [key: string]: unknown
}

type ShortcutItem = {
  label: string
  href: string
  description: string
  accent: string
}

function ShortcutCard({ item }: { item: ShortcutItem }) {
  return (
    <Link
      href={item.href}
      className={`group block rounded-[22px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow ${item.accent}`}
    >
      <div className="text-sm font-bold">{item.label}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
      <div className="mt-4 text-xs font-semibold tracking-[0.18em] text-slate-500">
        OPEN
      </div>
    </Link>
  )
}

export default function CaseDetailAiShortcutBar({
  propertyId,
  caseId,
  className = '',
}: CaseDetailAiShortcutBarProps) {
  const hasCaseContext = Boolean(propertyId && caseId)

  const items: ShortcutItem[] = [
    {
      label: '案件司令塔AI',
      href: hasCaseContext
        ? `/properties/${propertyId}/cases/${caseId}`
        : '/dashboard',
      description: '現在の状況、危険度、次アクション、理事会提出判断を確認します。',
      accent: 'border-slate-200 bg-white text-slate-900',
    },
    {
      label: 'AI議事録 本格版',
      href: hasCaseContext
        ? `/properties/${propertyId}/cases/${caseId}/ai-board-minutes-pro`
        : '/ai-minutes',
      description: '案件単位で理事会議事録を整え、保存・印刷まで進めます。',
      accent: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      label: 'AI見積比較センター',
      href: hasCaseContext
        ? `/properties/${propertyId}/cases/${caseId}/estimate-ai-center`
        : '/estimate-ai-center',
      description: '見積比較、推奨判断、理事会用コメント作成まで一気に進めます。',
      accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ]

  return (
    <section className={`space-y-3 ${className}`}>
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-slate-400">
          AIショートカット
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          主要AI機能へすぐ移動
        </h2>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {items.map((item) => (
          <ShortcutCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  )
}