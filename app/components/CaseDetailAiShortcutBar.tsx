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
      label: 'AI議事録を作成',
      href: '/ai-minutes',
      description: '音声から理事会議事録を自動生成します。保存・編集・出力まで進めます。',
      accent: 'border-sky-300 bg-sky-50 text-sky-700',
    },
    {
      label: '保存済み議事録',
      href: hasCaseContext
        ? `/ai-minutes/records?propertyId=${propertyId}`
        : '/ai-minutes/records',
      description: '作成した議事録を確認・編集・出力します。',
      accent: 'border-sky-200 bg-white text-sky-800',
    },
    {
      label: '案件司令塔AI',
      href: hasCaseContext
        ? `/properties/${propertyId}/cases/${caseId}`
        : '/dashboard',
      description: '現在の状況、危険度、次アクション、理事会提出判断を確認します。',
      accent: 'border-slate-200 bg-white text-slate-900',
    },
  ]

  return (
    <section className={`space-y-3 ${className}`}>
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-sky-500">
          議事録ショートカット
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          議事録の作成・確認はここから
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