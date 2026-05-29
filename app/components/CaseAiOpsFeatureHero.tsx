import Link from 'next/link'

type UserRole = 'admin' | 'general' | 'viewer' | null

type CaseAiOpsFeatureHeroProps = {
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

export default function CaseAiOpsFeatureHero({
  propertyId,
  caseId,
  role,
}: CaseAiOpsFeatureHeroProps) {
  const base = `/properties/${propertyId}/cases/${caseId}`

  const items: FeatureItem[] = [
    {
      title: 'AI 業者評価メモ',
      description: '最近の対応ログや見積資料から、業者評価のたたき台を作ります。',
      href: `${base}/ai-vendor-evaluation-brief`,
      category: '見積・業者管理',
      tone: 'blue',
    },
    {
      title: 'AI 見積履歴分析',
      description: 'この案件の見積資料の流れを見て、比較の観点や判断材料を整理します。',
      href: `${base}/ai-estimate-history-analysis`,
      category: '見積・業者管理',
      tone: 'violet',
    },
    {
      title: 'AI 成功対応パターン抽出',
      description: 'この案件の動きから、うまく進んだ対応パターンを共有向けに抜き出します。',
      href: `${base}/ai-success-pattern-extractor`,
      category: 'ナレッジ・検索',
      tone: 'emerald',
    },
    {
      title: 'AI ナレッジ蓄積メモ',
      description: '案件完了後や区切り時に、再利用しやすい知見メモを残します。',
      href: `${base}/ai-knowledge-capture-note`,
      category: 'ナレッジ・検索',
      tone: 'amber',
    },
    {
      title: 'AI 注意メッセージ生成',
      description: '今この案件で共有しておくべき注意事項を、短く分かりやすく出します。',
      href: `${base}/ai-caution-message-builder`,
      category: '判断支援・アラート',
      tone: 'rose',
    },
    {
      title: 'AI おすすめアクション生成',
      description: '次の一手を短く整理し、誰にどう動くかまで見やすくします。',
      href: `${base}/ai-recommended-action-builder`,
      category: '判断支援・アラート',
      tone: 'blue',
    },
    {
      title: 'AI 更新通知文生成',
      description: '進捗共有や状況更新の通知文を、社内外向けに整えます。',
      href: `${base}/ai-update-notice-draft`,
      category: '通知・共有',
      tone: 'violet',
    },
    {
      title: 'AI 期限通知文生成',
      description: '期限が近い時の案内や催促文を、角が立ちにくい形で作ります。',
      href: `${base}/ai-deadline-notice-draft`,
      category: '通知・共有',
      tone: 'amber',
    },
    {
      title: 'AI 担当者通知文生成',
      description: '担当変更や担当依頼の連絡文を、分かりやすく作ります。',
      href: `${base}/ai-assignee-notice-draft`,
      category: '通知・共有',
      tone: 'emerald',
    },
    {
      title: 'AI 通知文ひな形生成',
      description: 'まだ用途が固まっていない時でも使える、汎用の通知文を作ります。',
      href: `${base}/ai-general-notification-draft`,
      category: '通知・共有',
      tone: 'rose',
    },
  ]

  const visibleItems =
    role === 'viewer' ? items.filter((item) => !item.viewerHidden) : items

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            新AI機能 第3弾 10本
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            通知・共有・ナレッジ化のAIを追加
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            社長、今回は案件を進めるだけじゃなく、
            「どう共有するか」「どう通知するか」「どう再利用できる知見にするか」
            まで固めています。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
          <Link
            href={`${base}/manager-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            上司共有パック
          </Link>
          <Link
            href={`${base}/vendor-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            業者対応パック
          </Link>
          <Link
            href={`${base}/document-center`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            文書センター
          </Link>
          <Link
            href={`${base}/handover-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            引き継ぎパック
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