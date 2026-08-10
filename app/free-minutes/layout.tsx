import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI議事録 無料で試す — 月2回・登録のみ | Kura',
  description: '分譲マンション管理会社向けAI議事録を月2回まで無料で利用できます。理事会・総会の録音をアップロードするだけ。登録のみ・クレジットカード不要。',
  keywords: 'マンション管理会社 AI議事録,マンション管理 議事録 AI,理事会 議事録 AI,総会 議事録 AI,理事会 議事録 作成 自動',
  alternates: { canonical: 'https://kura-management.com/free-minutes' },
  openGraph: {
    title: 'AI議事録 無料で試す — 月2回・登録のみ | Kura',
    description: '理事会・総会の音声をアップロードするだけで議事録を自動生成。月2回まで無料・クレジットカード不要。',
    url: 'https://kura-management.com/free-minutes',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function FreeMinutesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
