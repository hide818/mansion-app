import Link from 'next/link'

type PropertyAiEntryCardsProps = {
  propertyId: string
  role: 'admin' | 'general' | 'viewer' | null
}

type EntryItem = {
  title: string
  description: string
  href: string
}

function SectionCard({
  title,
  description,
  items,
  featured,
}: {
  title: string
  description: string
  items: EntryItem[]
  featured?: boolean
}) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${
        featured ? 'border-sky-200 bg-sky-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="mb-4">
        <h2 className={`text-base font-bold ${featured ? 'text-sky-900' : 'text-gray-900'}`}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl border p-4 transition ${
              featured
                ? 'border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-100'
                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="text-sm font-bold text-gray-900">{item.title}</div>
            <div className="mt-1 text-xs leading-5 text-gray-600">
              {item.description}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function PropertyAiEntryCards({
  propertyId,
  role,
}: PropertyAiEntryCardsProps) {
  const handoverItems: EntryItem[] = [
    {
      title: '引き継ぎAI',
      description: '物件全体の引き継ぎ文をAIで作成・編集・保存します。',
      href: `/properties/${propertyId}/handover-ai`,
    },
    {
      title: 'AI業務引き継ぎメモ',
      description: '担当変更や共有前に、要点を短時間で整理します。',
      href: `/properties/${propertyId}/ai-property-handover`,
    },
    {
      title: 'AI引き継ぎ実行パック',
      description: '引き継ぎ向けの文書・判断材料をまとめて確認します。',
      href: `/properties/${propertyId}/ai-handover-exec-pack`,
    },
    {
      title: 'AI引き継ぎ監査パック',
      description: '抜け漏れがないかを引き継ぎ前に点検します。',
      href: `/properties/${propertyId}/ai-handover-audit-pack`,
    },
  ]

  const boardItems: EntryItem[] = [
    {
      title: 'AI月次報告',
      description: '役員向けに共有しやすい月次報告のたたき台を作ります。',
      href: `/properties/${propertyId}/ai-monthly-report-board`,
    },
    {
      title: 'AI理事会用 物件全体ブリーフ',
      description: '理事会前に、物件全体の論点をまとめて整理します。',
      href: `/properties/${propertyId}/ai-board-brief`,
    },
    {
      title: 'AI理事会提出セット',
      description: '理事会前に必要な材料を一気に確認します。',
      href: `/properties/${propertyId}/ai-board-submit-pack`,
    },
    {
      title: 'AI理事会直前パック',
      description: '直前確認・言い回し・抜け漏れ確認に使います。',
      href: `/properties/${propertyId}/ai-board-lastminute-pack`,
    },
  ]

  const controlItems: EntryItem[] = [
    {
      title: 'AI物件次アクション提案',
      description: 'いま優先すべき動きをAIで整理します。',
      href: `/properties/${propertyId}/ai-property-next-actions`,
    },
    {
      title: 'AI物件ログ要約',
      description: '最近の動きを短く整理して共有しやすくします。',
      href: `/properties/${propertyId}/ai-log-summary`,
    },
    {
      title: 'AI管理向けブリーフ',
      description: '上司や社内共有向けに要点を整えます。',
      href: `/properties/${propertyId}/ai-management-brief`,
    },
    {
      title: 'AI優先度チェックパック',
      description: '何から片づけるべきかを見失わないための導線です。',
      href: `/properties/${propertyId}/ai-priority-check-pack`,
    },
  ]

  const complaintItems: EntryItem[] = [
    {
      title: 'AIクレーム要約',
      description: '共有用にクレームの要点を短く整理します。',
      href: `/properties/${propertyId}/ai-complaint-brief`,
    },
    {
      title: 'AIクレーム対応提案',
      description: '次の対応案や言い回しのたたき台を作ります。',
      href: `/properties/${propertyId}/ai-complaint-actions`,
    },
    {
      title: 'AIクレーム対応パック',
      description: '初動・共有・説明文をまとめて確認します。',
      href: `/properties/${propertyId}/ai-complaint-response-pack`,
    },
    {
      title: 'AIクレーム再発防止パック',
      description: '再発防止や共有事項の整理に使います。',
      href: `/properties/${propertyId}/ai-complaint-prevent-pack`,
    },
  ]

  const commonItems: EntryItem[] = [
    {
      title: '物件ツール一覧',
      description: '物件で使う主要機能を一覧で開けます。',
      href: `/properties/${propertyId}/tools`,
    },
    {
      title: '物件AIツールセンター',
      description: 'AI系の導線をまとめて見たい時に使います。',
      href: `/properties/${propertyId}/ai-center`,
    },
    {
      title: '月次報告ページ',
      description: '通常の月次報告画面を開きます。',
      href: `/properties/${propertyId}/monthly-report`,
    },
    {
      title: 'クレーム共有ページ',
      description: 'クレームの履歴と共有向け画面を開きます。',
      href: `/properties/${propertyId}/complaints-summary`,
    },
  ]

  const adminItems: EntryItem[] =
    role === 'admin'
      ? [
          {
            title: 'AI上司提出パック',
            description: '社内提出向けの整理を行います。',
            href: `/properties/${propertyId}/ai-boss-submit-pack`,
          },
          {
            title: 'AI担当変更準備パック',
            description: '引き継ぎ前の準備をまとめて確認します。',
            href: `/properties/${propertyId}/ai-assignee-ready-pack`,
          },
        ]
      : []

  const minutesItems: EntryItem[] = [
    {
      title: 'AI議事録を作成',
      description: '音声から理事会議事録を自動生成します。',
      href: '/ai-minutes',
    },
    {
      title: 'この物件の保存済み議事録',
      description: '作成済みの議事録を確認・編集・出力します。',
      href: `/ai-minutes/records?propertyId=${propertyId}`,
    },
  ]

  return (
    <div className="space-y-4">
      <SectionCard
        title="議事録"
        description="AI議事録の作成と保存済み議事録の確認はこちらから。"
        items={minutesItems}
        featured
      />

      <SectionCard
        title="引き継ぎ・属人化解消"
        description="担当変更や共有前に使う導線です。"
        items={handoverItems}
      />

      <SectionCard
        title="理事会・月次報告"
        description="理事会前、報告前、役員共有前に使う導線です。"
        items={boardItems}
      />

      <SectionCard
        title="判断補助・優先度整理"
        description="次に何をやるか、どう伝えるかを整理する導線です。"
        items={controlItems}
      />

      <SectionCard
        title="クレーム共有・再発防止"
        description="クレーム対応の共有、説明、再発防止に使う導線です。"
        items={complaintItems}
      />

      <SectionCard
        title="通常導線"
        description="AI以外も含めて、この物件でよく開く画面をまとめています。"
        items={[...commonItems, ...adminItems]}
      />
    </div>
  )
}