export type Post = {
  slug: string
  title: string
  description: string
  publishedAt: string
  category: string
  keywords: string[]
}

export const posts: Post[] = [
  {
    slug: 'rikaikaigi-gijiroku-kakikata',
    title: 'マンション理事会議事録の書き方と必須項目【テンプレート付き】',
    description: 'マンション理事会議事録の書き方、必須記載項目、よくある失敗を解説。フロント担当者が2時間かかる議事録作成を短縮するポイントも紹介します。',
    publishedAt: '2026-05-20',
    category: '議事録',
    keywords: ['理事会議事録', '議事録 書き方', 'マンション管理 議事録', '議事録 テンプレート'],
  },
  {
    slug: 'sogai-gijiroku-sakusei',
    title: 'マンション総会議事録の作成時間を半分以下にする方法',
    description: '総会議事録の作成に2〜3時間かけていませんか？AI活用で50分に短縮できる具体的な手順を解説。管理会社フロント担当者の残業削減に直結します。',
    publishedAt: '2026-05-27',
    category: '議事録',
    keywords: ['総会議事録', '議事録 AI', '議事録 時間短縮', 'マンション管理 効率化'],
  },
  {
    slug: 'zokuninuka-kaisho',
    title: 'マンション管理会社の属人化を解消する5つの方法',
    description: '担当者が退職するたびに発生する業務の属人化。管理会社でよくある5つの属人化パターンと、それぞれの解消策を具体的に解説します。',
    publishedAt: '2026-06-03',
    category: '業務効率化',
    keywords: ['属人化 解消', 'マンション管理 引き継ぎ', '管理会社 業務効率化', '担当者 退職'],
  },
  {
    slug: 'hikitsugisho-template',
    title: 'マンション管理フロント担当者の引き継ぎ書の作り方【テンプレート無料配布】',
    description: '管理会社フロント担当者が退職・異動するときの引き継ぎ書テンプレートと書き方を解説。物件ごとの特記事項・懸案事項の整理方法も紹介します。',
    publishedAt: '2026-06-05',
    category: '業務効率化',
    keywords: ['引き継ぎ書 テンプレート', 'マンション管理 引き継ぎ', 'フロント担当 引き継ぎ', '引き継ぎ書 書き方'],
  },
  {
    slug: 'kanri-kaisha-dx-guide',
    title: '中小マンション管理会社のDX推進ガイド【2026年版】',
    description: '独立系・中小マンション管理会社がDXを進めるための実践ガイド。大手と同じ投資は不要。5名以下の組織でもできる業務デジタル化の手順を解説します。',
    publishedAt: '2026-06-09',
    category: 'DX・IT化',
    keywords: ['マンション管理 DX', '管理会社 IT化', 'マンション管理 SaaS', '中小管理会社'],
  },
  {
    slug: 'kanri-kaisha-saas-hikaku',
    title: 'マンション管理会社向けSaaS比較【2026年版】選び方と主要機能',
    description: '中小・独立系マンション管理会社がSaaS導入を検討する際のポイントを解説。AI議事録・引き継ぎ書・タスク管理の機能比較と選定基準を紹介します。',
    publishedAt: '2026-06-13',
    category: 'DX・IT化',
    keywords: ['マンション管理 SaaS', '管理会社 システム', 'マンション管理 DX', '管理会社 効率化'],
  },
  {
    slug: 'riji-kai-ai-gijiroku',
    title: '理事会議事録をAIで自動作成する方法【2026年版】',
    description: '音声をアップロードするだけで理事会議事録を自動生成。AI議事録の仕組み・メリット・注意点を解説。作成時間を2時間→50分に短縮できます。',
    publishedAt: '2026-06-13',
    category: '議事録',
    keywords: ['理事会議事録 AI', '議事録 自動作成', '議事録 AI', 'マンション管理 AI'],
  },
  {
    slug: 'kanri-kaisha-ninmu-hikitsugi',
    title: 'マンション管理会社の担当者交代・引き継ぎをスムーズにする方法',
    description: '担当者退職のたびに発生する引き継ぎコストを削減する5つの対策。AIによる引き継ぎ書自動生成で「退職翌日に引き継ぎ書90%完成」を実現する方法を解説。',
    publishedAt: '2026-06-13',
    category: '業務効率化',
    keywords: ['マンション管理 引き継ぎ', '担当者交代 引き継ぎ', '引き継ぎ書 自動作成', '管理会社 属人化'],
  },
  {
    slug: 'anken-kanri-excel-datsu',
    title: 'マンション管理会社の案件管理をExcelから脱却する方法',
    description: '物件ごとのExcel管理に限界を感じていませんか？全物件の案件・タスク・期限を一画面で管理する方法と、Excelからの移行で失敗しないポイントを解説します。',
    publishedAt: '2026-07-17',
    category: '業務効率化',
    keywords: ['マンション管理 案件管理', '管理会社 タスク管理', 'マンション管理 Excel', '案件管理 ツール'],
  },
  {
    slug: 'sogai-junbi-checklist',
    title: 'マンション管理組合総会の準備チェックリスト完全版【2ヶ月前〜当日】',
    description: '定期総会の準備漏れを防ぐチェックリストを公開。招集通知の発送期限・定足数の確認・議事録作成まで、2ヶ月前から当日後までの全工程を網羅しています。',
    publishedAt: '2026-07-17',
    category: '総会・理事会',
    keywords: ['マンション総会 準備', '管理組合 総会 チェックリスト', '総会 招集通知', '総会議事録'],
  },
  {
    slug: 'kanri-kaisha-hitoride-kanri',
    title: 'マンション管理会社が人手不足を乗り越える業務効率化の5つの方法',
    description: '1人で20〜30棟を担当するフロント担当者の業務効率化。AI議事録・案件管理一元化・引き継ぎ書自動生成で、残業削減と離職率低下を同時に実現する方法を解説。',
    publishedAt: '2026-07-17',
    category: '業務効率化',
    keywords: ['マンション管理 人手不足', '管理会社 業務効率化', 'フロント担当 残業削減', '管理会社 少人数'],
  },
]
