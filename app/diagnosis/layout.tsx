import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マンション管理会社 業務効率化診断 — 無料で業務の課題を確認 | Kura',
  description: '分譲マンション管理会社向けの無料業務診断。議事録作成・案件管理・引き継ぎなど6つの質問に答えるだけで、自社の業務負担を整理できます。登録不要・1分で完了。',
  keywords: 'マンション管理会社 業務効率化,マンション管理 フロント 業務,マンション管理会社 DX,フロント 業務改善,管理会社 業務診断',
  alternates: { canonical: 'https://kura-management.com/diagnosis' },
  openGraph: {
    title: 'マンション管理会社 業務効率化診断 — 無料 | Kura',
    description: '議事録・案件管理・引き継ぎなど6つの質問で業務の課題を確認。登録不要・1分。',
    url: 'https://kura-management.com/diagnosis',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function DiagnosisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
