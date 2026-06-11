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
]
