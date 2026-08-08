import type { Metadata } from 'next'
import Link from 'next/link'
import TemplateDownloadForm from './TemplateDownloadForm'

export const metadata: Metadata = {
  title: '総会議事録テンプレート 無料ダウンロード｜Kura',
  description: 'マンション管理会社・管理組合向け 総会議事録テンプレートを無料配布。区分所有法対応、定足数確認・各議案の採決欄付き。メールアドレスを登録するだけでご利用いただけます。',
  alternates: { canonical: 'https://kura-management.com/templates' },
}

const FEATURES = [
  '区分所有法第42条・マンション標準管理規約に準拠',
  '定足数確認欄・出席者カウント表付き',
  '第1〜4号議案（賛成/反対/棄権・決議結果）記入欄',
  '議長・議事録署名人の署名押印欄',
  'ブラウザで開いてそのまま印刷 / PDF保存可能',
  '商用利用・社内配布 すべて無料',
]

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <nav className="border-b border-[#d2d2d7] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/lp" className="text-lg font-extrabold text-[#1d1d1f] tracking-tight">Kura</Link>
          <Link href="/blog" className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">ブログ</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700 mb-4">
            無料テンプレート配布
          </span>
          <h1 className="text-3xl font-extrabold text-[#1d1d1f] tracking-tight sm:text-4xl leading-tight">
            総会議事録テンプレート
          </h1>
          <p className="mt-4 text-[#6e6e73] text-lg max-w-xl mx-auto leading-relaxed">
            区分所有法対応。定足数確認から採決記録まで、
            そのまま使える実用テンプレートを無料でお渡しします。
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 items-start">
          {/* テンプレート説明 */}
          <div>
            {/* Preview */}
            <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden shadow-sm mb-6">
              <div className="bg-[#1d1d1f] px-5 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="ml-2 text-xs text-white/60">sokai-gijiroku-template.html</span>
              </div>
              <div className="p-6 text-center">
                <div className="border-b-2 border-[#1d1d1f] pb-3 mb-2">
                  <p className="text-base font-bold tracking-widest">第　　回　定期総会　議事録</p>
                </div>
                <div className="text-left text-xs mt-4 space-y-1 text-[#3d3d3d]">
                  <div className="flex gap-2 border-b border-gray-200 pb-1">
                    <span className="font-semibold w-24 shrink-0">開催日時</span>
                    <span className="text-gray-400">令和　　年　　月　　日...</span>
                  </div>
                  <div className="flex gap-2 border-b border-gray-200 pb-1">
                    <span className="font-semibold w-24 shrink-0">議長</span>
                    <span className="text-gray-400">理事長　　　　　　</span>
                  </div>
                  <div className="mt-2 border border-gray-200 p-2 text-[10px] bg-gray-50">
                    <p className="font-semibold">■ 出席状況・定足数確認</p>
                    <p className="text-gray-400 mt-1">総区分所有者数 __ 名 ／ 委任状 __ 通...</p>
                  </div>
                  <div className="mt-2 border border-gray-200 p-2 text-[10px]">
                    <p className="font-semibold">第１号議案：事業報告・収支決算...</p>
                    <div className="flex gap-4 mt-1 text-gray-400">
                      <span>賛成：___</span>
                      <span>反対：___</span>
                      <span>棄権：___</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#6e6e73]">A4・印刷対応フォーマット</p>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#3d3d3d]">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div>
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold text-[#1d1d1f] mb-1">メールアドレスを入力してください</h2>
              <p className="text-sm text-[#6e6e73] mb-6">テンプレートのリンクをメールでお送りします。無料・登録不要。</p>
              <TemplateDownloadForm />
            </div>

            {/* Kura紹介 */}
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-semibold text-blue-700 mb-1">このテンプレートを提供している Kura とは？</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                分譲マンション管理会社向けのAI業務管理SaaS。会議音声をアップロードするだけで議事録を自動生成。案件管理・担当者引き継ぎ書まで1つのツールにまとめています。
              </p>
              <Link
                href="/lp?utm_source=templates_page&utm_medium=sidebar"
                className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:underline"
              >
                14日間無料で試す →
              </Link>
            </div>
          </div>
        </div>

        {/* 他テンプレートの予告 */}
        <div className="mt-16 border-t border-[#d2d2d7] pt-10">
          <h2 className="text-base font-bold text-[#1d1d1f] mb-4">近日公開予定のテンプレート</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {['引き継ぎ書テンプレート', '理事会議事録テンプレート', 'フロント業務チェックリスト'].map((name) => (
              <div key={name} className="rounded-xl border border-[#d2d2d7] bg-white p-4 text-sm text-[#6e6e73]">
                <p className="font-medium text-[#3d3d3d] mb-1">{name}</p>
                <span className="text-xs bg-[#f5f5f7] px-2 py-0.5 rounded-full">準備中</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
