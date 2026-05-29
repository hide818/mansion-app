import Link from 'next/link'

type UserRole = 'admin' | 'general' | 'viewer' | null

type CaseAiNextFeatureHeroProps = {
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

export default function CaseAiNextFeatureHero({
  propertyId,
  caseId,
  role,
}: CaseAiNextFeatureHeroProps) {
  const base = `/properties/${propertyId}/cases/${caseId}`

  const items: FeatureItem[] = [
    {
      title: 'AI タスク優先度自動提案',
      description: '未完了タスクを優先順で整理し、先に触るべき理由まで出します。',
      href: `${base}/ai-task-priority-suggester`,
      category: 'タスク管理',
      tone: 'blue',
    },
    {
      title: 'AI 今日やること抽出',
      description: '今日中に触るべきことと、後回しでいいことを切り分けます。',
      href: `${base}/ai-today-focus`,
      category: 'タスク管理',
      tone: 'amber',
    },
    {
      title: 'AI ログ自動タグ付け',
      description: '最近のログを、電話・メール・理事会・業者対応などのタグで整理します。',
      href: `${base}/ai-log-auto-tags`,
      category: 'ログ・履歴管理',
      tone: 'violet',
    },
    {
      title: 'AI 対応履歴の構造化',
      description: '時系列のログを、経過・論点・決定・残課題の形へ整理します。',
      href: `${base}/ai-history-structurer`,
      category: 'ログ・履歴管理',
      tone: 'emerald',
    },
    {
      title: 'AI 案件履歴ストーリー化',
      description: '案件の流れを、途中参加の人でも分かるストーリーにします。',
      href: `${base}/ai-case-story-builder`,
      category: 'ログ・履歴管理',
      tone: 'rose',
    },
    {
      title: 'AI クレーム再発警告',
      description: 'この案件や同物件のクレーム履歴から、再発リスクを警告します。',
      href: `${base}/ai-complaint-recurrence-alert`,
      category: 'クレーム管理',
      tone: 'rose',
    },
    {
      title: 'AI 過去類似クレーム表示',
      description: '同物件のクレーム履歴から、似たパターンを拾って共有向けに整理します。',
      href: `${base}/ai-similar-complaint-brief`,
      category: 'クレーム管理',
      tone: 'violet',
    },
    {
      title: 'AI 理事会提出推奨アラート',
      description: '理事会に上げるべき案件かどうかを、理由つきで判断補助します。',
      href: `${base}/ai-board-submission-alert`,
      category: '理事会・総会機能',
      tone: 'blue',
    },
    {
      title: 'AI 長期未更新案件アラート',
      description: '最近の活動日から見て、止まり気味の案件かどうかを見立てます。',
      href: `${base}/ai-stale-update-alert`,
      category: '判断支援・アラート',
      tone: 'amber',
    },
    {
      title: 'AI 優先度自動判定',
      description: '案件全体の優先度を、今の状況・タスク・クレーム感度から判定します。',
      href: `${base}/ai-priority-judge`,
      category: '判断支援・アラート',
      tone: 'emerald',
    },
  ]

  const visibleItems =
    role === 'viewer' ? items.filter((item) => !item.viewerHidden) : items

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
            新AI機能 第2弾 10本
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            判断補助・対応漏れ防止のAIを追加
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            社長、今回は「次に何をやるか」「この案件は止まっていないか」
            「理事会へ出すべきか」「クレームが再発しそうか」まで判断できる導線を上に固めています。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
          <Link
            href={`${base}/coverage-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            抜け漏れパック
          </Link>
          <Link
            href={`${base}/future-task-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            未来タスクパック
          </Link>
          <Link
            href={`${base}/board-judgement-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            理事会上程判断パック
          </Link>
          <Link
            href={`${base}/risk-temperature-pack`}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            温度感パック
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