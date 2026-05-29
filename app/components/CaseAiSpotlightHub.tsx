import Link from 'next/link'

type UserRole = 'admin' | 'general' | 'viewer' | null

type SpotlightLink = {
  label: string
  href: string
}

type SpotlightItem = {
  title: string
  lead: string
  description: string
  href: string
  buttonLabel: string
  tone: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'
  tags: string[]
  extraLinks: SpotlightLink[]
  viewerHidden?: boolean
}

type CaseAiSpotlightHubProps = {
  propertyId: string
  caseId: string
  role: UserRole
}

function getToneClasses(tone: SpotlightItem['tone']) {
  if (tone === 'blue') {
    return {
      card: 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100',
      badge: 'bg-blue-100 text-blue-900',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
      chip: 'bg-blue-50 text-blue-900 border-blue-200',
    }
  }

  if (tone === 'violet') {
    return {
      card: 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-100',
      badge: 'bg-violet-100 text-violet-900',
      button: 'bg-violet-600 text-white hover:bg-violet-700',
      chip: 'bg-violet-50 text-violet-900 border-violet-200',
    }
  }

  if (tone === 'emerald') {
    return {
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-100',
      badge: 'bg-emerald-100 text-emerald-900',
      button: 'bg-emerald-600 text-white hover:bg-emerald-700',
      chip: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    }
  }

  if (tone === 'amber') {
    return {
      card: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-100',
      badge: 'bg-amber-100 text-amber-900',
      button: 'bg-amber-600 text-white hover:bg-amber-700',
      chip: 'bg-amber-50 text-amber-900 border-amber-200',
    }
  }

  return {
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-100',
    badge: 'bg-rose-100 text-rose-900',
    button: 'bg-rose-600 text-white hover:bg-rose-700',
    chip: 'bg-rose-50 text-rose-900 border-rose-200',
  }
}

function SpotlightCard({ item }: { item: SpotlightItem }) {
  const tone = getToneClasses(item.tone)

  return (
    <section className={`rounded-3xl border p-5 shadow-sm ${tone.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone.badge}`}
          >
            {item.lead}
          </div>
          <h2 className="mt-3 text-xl font-bold text-gray-900">{item.title}</h2>
        </div>
      </div>

      <p className="mt-3 text-sm leading-7 text-gray-700">{item.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tone.chip}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <Link
          href={item.href}
          className={`inline-flex rounded-xl px-4 py-2 text-sm font-bold transition ${tone.button}`}
        >
          {item.buttonLabel}
        </Link>
      </div>

      {item.extraLinks.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {item.extraLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default function CaseAiSpotlightHub({
  propertyId,
  caseId,
  role,
}: CaseAiSpotlightHubProps) {
  const base = `/properties/${propertyId}/cases/${caseId}`

  const items: SpotlightItem[] = [
    {
      title: '理事会報告ドラフト',
      lead: '理事会・総会機能',
      description:
        '理事会へ出す説明のたたき台をすぐ作る入口です。議案化の前後どちらでも使いやすく、まず見せたい売り機能です。',
      href: `${base}/board-draft`,
      buttonLabel: '理事会報告ドラフトを開く',
      tone: 'blue',
      tags: ['理事会報告ドラフト生成', '議案化', '共有短縮'],
      extraLinks: [
        { label: '理事会パック', href: `${base}/board-pack` },
        { label: '議案書ページ', href: `${base}/agenda-document` },
      ],
    },
    {
      title: 'AI議案生成',
      lead: 'AI機能',
      description:
        '案件内容から議案タイトルと説明の骨格を作る入口です。理事会へ持っていく前の下書きを一気に早くします。',
      href: `${base}/ai-agenda`,
      buttonLabel: 'AI議案生成を開く',
      tone: 'violet',
      tags: ['AI議案生成', '議案タイトル', '理事会準備'],
      extraLinks: [
        { label: '議案書ドラフト', href: `${base}/document-agenda` },
        { label: '理事会設定', href: `${base}/board-settings` },
      ],
    },
    {
      title: 'AI議事録生成',
      lead: 'AI機能',
      description:
        '理事会後のまとめを素早く作る入口です。決定事項、今後の宿題、共有事項の整理に向いています。',
      href: `${base}/ai-minutes`,
      buttonLabel: 'AI議事録生成を開く',
      tone: 'emerald',
      tags: ['AI議事録生成', '決定事項整理', '議事録作成'],
      extraLinks: [
        { label: '理事会議事録ページ', href: `${base}/board-minutes` },
        { label: '議事録ドラフト', href: `${base}/document-minutes` },
      ],
    },
    {
      title: '想定質問生成',
      lead: '理事会・総会機能',
      description:
        '理事会で突っ込まれそうな点を先回りして準備する入口です。質問を受ける前に答えの筋を作れます。',
      href: `${base}/ai-expected-questions`,
      buttonLabel: '想定質問生成を開く',
      tone: 'amber',
      tags: ['想定質問生成', '理事会で聞かれそうな質問', '防御力アップ'],
      extraLinks: [
        { label: '想定質問文書', href: `${base}/document-questions` },
        { label: '理事会Q&Aパック', href: `${base}/ai-board-qna-pack` },
      ],
    },
    {
      title: 'AI引き継ぎサマリー',
      lead: '引き継ぎ・属人化解消',
      description:
        '案件の今の状況、注意点、次アクションを短く整理する入口です。担当変更や休暇前の共有に強いです。',
      href: `${base}/ai-case-handover`,
      buttonLabel: 'AI引き継ぎサマリーを開く',
      tone: 'blue',
      tags: ['AI引き継ぎサマリー', '属人化解消', '共有しやすい'],
      extraLinks: [
        { label: '引き継ぎパック', href: `${base}/handover-pack` },
        { label: '引き継ぎ文書', href: `${base}/document-handover` },
      ],
    },
    {
      title: '担当者変更モード',
      lead: '案件管理',
      description:
        '担当変更時の事故を減らすための入口です。引き継ぎ漏れ、見落とし、人物メモの抜けを防ぐ前提で使います。',
      href: `${base}/assignee-handoff`,
      buttonLabel: '担当者変更モードを開く',
      tone: 'rose',
      tags: ['担当者変更モード', '引き継ぎチェック', '属人化防止'],
      extraLinks: [
        { label: '担当変更パック', href: `${base}/assignee-change-pack` },
        { label: '引き継ぎチェック', href: `${base}/handover-checklist` },
      ],
      viewerHidden: true,
    },
    {
      title: 'ワンクリック業者依頼文',
      lead: '見積・業者管理',
      description:
        '業者へ投げる依頼文のたたき台を一気に作る入口です。見積依頼や追加確認の時間をかなり短くできます。',
      href: `${base}/vendor-request`,
      buttonLabel: '業者依頼文を開く',
      tone: 'emerald',
      tags: ['ワンクリック業者依頼文', '見積依頼', '文書作成'],
      extraLinks: [
        { label: '業者対応パック', href: `${base}/vendor-pack` },
        { label: '業者依頼文書', href: `${base}/document-vendor-request` },
      ],
      viewerHidden: true,
    },
    {
      title: 'AI見積比較コメント生成',
      lead: 'AI機能',
      description:
        '見積を比較したときのコメントや説明文のたたき台を作る入口です。上司説明や理事会説明にそのままつなげやすいです。',
      href: `${base}/ai-estimate-comment`,
      buttonLabel: 'AI見積比較コメントを開く',
      tone: 'violet',
      tags: ['AI見積比較コメント生成', '比較説明', '判断補助'],
      extraLinks: [
        { label: '見積判断パック', href: `${base}/ai-estimate-judgement-pack` },
        { label: '業者比較パック', href: `${base}/ai-vendor-compare-pack` },
      ],
    },
    {
      title: '次にやること提案',
      lead: '判断支援・アラート',
      description:
        '案件が止まりにくいよう、次の一手を短く見せる入口です。担当者が変わっても迷いにくくなります。',
      href: `${base}/next-action-ai`,
      buttonLabel: '次アクション提案を開く',
      tone: 'amber',
      tags: ['次にやること提案', 'AI次アクション', '停滞防止'],
      extraLinks: [
        { label: '未来タスクパック', href: `${base}/future-task-pack` },
        { label: '未来タスク生成', href: `${base}/future-tasks` },
      ],
    },
    {
      title: '対応抜けチェック',
      lead: '判断支援・アラート',
      description:
        '抜けや漏れを先に見つける入口です。クレーム化しそうな見落としや、説明不足の芽を拾うための機能です。',
      href: `${base}/coverage-check`,
      buttonLabel: '対応抜けチェックを開く',
      tone: 'rose',
      tags: ['対応抜けチェック', '判断補助', '事故防止'],
      extraLinks: [
        { label: '抜け漏れパック', href: `${base}/coverage-pack` },
        { label: '温度感パック', href: `${base}/risk-temperature-pack` },
      ],
    },
  ]

  const visibleItems =
    role === 'viewer' ? items.filter((item) => !item.viewerHidden) : items

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-500">
              案件AIフラッグシップ導線
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              10機能を一気に使える実務ハブ
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              社長、今回は「派手さ」と「実務性」を両立させるために、
              理事会・引き継ぎ・業者依頼・見積判断・抜け漏れ防止までを
              1画面に固めています。まずこの画面を見せれば、
              このSaaSが何に強いか一発で伝わる構成です。
            </p>
          </div>

          <div className="inline-flex rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700">
            {role === 'admin'
              ? '管理者表示'
              : role === 'general'
                ? '一般表示'
                : '閲覧表示'}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {visibleItems.map((item) => (
          <SpotlightCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  )
}