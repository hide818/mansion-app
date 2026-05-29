import Link from 'next/link'

type UserRole = 'admin' | 'general' | 'viewer' | null

type CaseAiNewFeatureHeroProps = {
  propertyId: string
  caseId: string
  role: UserRole
}

type FeatureItem = {
  title: string
  description: string
  href: string
  category: string
  tone: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'
  viewerHidden?: boolean
}

function getToneClass(tone: FeatureItem['tone']) {
  if (tone === 'blue') {
    return 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-950'
  }

  if (tone === 'violet') {
    return 'border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-950'
  }

  if (tone === 'emerald') {
    return 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
  }

  if (tone === 'amber') {
    return 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950'
  }

  return 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-950'
}

function FeatureCard({ item }: { item: FeatureItem }) {
  return (
    <Link
      href={item.href}
      className={`block rounded-2xl border p-4 transition ${getToneClass(item.tone)}`}
    >
      <div className="text-xs font-bold opacity-80">{item.category}</div>
      <div className="mt-2 text-base font-bold">{item.title}</div>
      <div className="mt-2 text-sm leading-6 opacity-90">{item.description}</div>
    </Link>
  )
}

export default function CaseAiNewFeatureHero({
  propertyId,
  caseId,
  role,
}: CaseAiNewFeatureHeroProps) {
  const base = `/properties/${propertyId}/cases/${caseId}`

  const items: FeatureItem[] = [
    {
      title: 'AI PDF見積解析',
      description: '見積書本文を貼るだけで、金額・範囲・不足事項・説明時の注意点まで整理します。',
      href: `${base}/ai-pdf-estimate-analysis`,
      category: '見積・業者管理',
      tone: 'blue',
    },
    {
      title: 'AI 保証内容比較',
      description: '保証年数だけでなく、保証範囲や免責まで比べやすく整理します。',
      href: `${base}/ai-warranty-compare`,
      category: '見積・業者管理',
      tone: 'violet',
    },
    {
      title: 'AI 工事項目比較',
      description: '各見積の作業範囲の違いや、抜け漏れの可能性を整理します。',
      href: `${base}/ai-work-scope-compare`,
      category: '見積・業者管理',
      tone: 'emerald',
    },
    {
      title: 'AI 見積比較表生成',
      description: '複数見積を、理事会や社内共有へ貼りやすい比較表テキストへまとめます。',
      href: `${base}/ai-estimate-comparison-table`,
      category: '見積・業者管理',
      tone: 'amber',
    },
    {
      title: 'AI 見積比較コメント生成',
      description: '採用候補・見送り候補の理由を、自然で実務向きの文面へ整えます。',
      href: `${base}/ai-estimate-comment-generator`,
      category: '見積・業者管理',
      tone: 'rose',
    },
    {
      title: 'AI 議案書ドラフト生成',
      description: '背景・現状・提案内容・承認いただきたい事項をまとめて作成します。',
      href: `${base}/ai-board-proposal-draft`,
      category: '理事会・文書生成',
      tone: 'blue',
    },
    {
      title: 'AI 引き継ぎ報告書生成',
      description: '現在の状況、注意点、未完了タスク、次アクションを一気に整理します。',
      href: `${base}/ai-handover-report-draft`,
      category: '引き継ぎ・属人化解消',
      tone: 'violet',
    },
    {
      title: 'AI 文書整形',
      description: 'ラフな文章やメモを、社内外で使いやすい自然な日本語へ整えます。',
      href: `${base}/ai-document-polisher`,
      category: '文書作成・自動生成',
      tone: 'emerald',
    },
    {
      title: 'AI 月次報告生成',
      description: 'この案件の今月の状況、未解決事項、来月予定を共有文へまとめます。',
      href: `${base}/ai-monthly-case-report`,
      category: '文書作成・自動生成',
      tone: 'amber',
    },
    {
      title: 'AI クレーム要約',
      description: 'クレーム性のある案件を、配慮を保った共有向け文章へまとめます。',
      href: `${base}/ai-case-complaint-brief`,
      category: 'クレーム管理・AI要約',
      tone: 'rose',
    },
  ]

  const visibleItems =
    role === 'viewer' ? items.filter((item) => !item.viewerHidden) : items

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900">
            新AI機能 10本
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            追加した新機能をここから一気に起動
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            社長、見積・理事会・引き継ぎ・文書整形・月次共有・クレーム要約まで、
            新しく追加したAI機能を上に固めました。
            まずこの並びを見せるだけで、「ただの案件管理」ではなく
            「実務を片づけるAI業務SaaS」に見えます。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
          <Link
            href={`${base}/document-center`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            文書センター
          </Link>
          <Link
            href={`${base}/board-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            理事会パック
          </Link>
          <Link
            href={`${base}/handover-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            引き継ぎパック
          </Link>
          <Link
            href={`${base}/manager-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            上司共有パック
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <FeatureCard key={item.href} item={item} />
        ))}
      </div>
    </section>
  )
}