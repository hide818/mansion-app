import Link from 'next/link'
import { posts } from './posts/index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kuraブログ — マンション管理会社の業務効率化・DX情報',
  description: 'マンション管理会社向けに、議事録作成・引き継ぎ・属人化解消・DX推進に関する実践的な情報をお届けします。',
  alternates: { canonical: 'https://kura-management.com/blog' },
  openGraph: {
    title: 'Kuraブログ — マンション管理会社の業務効率化・DX情報',
    description: 'マンション管理会社向けに、議事録作成・引き継ぎ・属人化解消・DX推進に関する実践的な情報をお届けします。',
    url: 'https://kura-management.com/blog',
    siteName: 'Kura',
    locale: 'ja_JP',
    type: 'website',
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  '議事録': 'bg-blue-50 text-blue-700',
  '業務効率化': 'bg-emerald-50 text-emerald-700',
  'DX・IT化': 'bg-violet-50 text-violet-700',
  '総会・理事会': 'bg-amber-50 text-amber-700',
  '管理費・会計': 'bg-red-50 text-red-700',
  '修繕工事': 'bg-orange-50 text-orange-700',
  '管理会社': 'bg-sky-50 text-sky-700',
  '住民対応': 'bg-pink-50 text-pink-700',
  '管理組合': 'bg-teal-50 text-teal-700',
}

export default function BlogPage() {
  const sorted = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/lp" className="flex items-center gap-2 text-lg font-extrabold text-slate-900 tracking-tight">
            Kura
          </Link>
          <Link href="/lp" className="text-sm text-slate-500 hover:text-slate-900">
            サービスTOPへ →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">Blog</p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            マンション管理会社の<br />業務効率化・DX情報
          </h1>
          <p className="mt-4 text-slate-500">
            フロント担当者の現場で役立つ、議事録・引き継ぎ・属人化解消の実践情報をお届けします。
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>
                  {post.category}
                </span>
                <time className="text-xs text-slate-400">{post.publishedAt}</time>
              </div>
              <h2 className="mb-2 text-base font-bold text-slate-900 group-hover:text-blue-700 leading-snug">
                {post.title}
              </h2>
              <p className="mt-auto pt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">
                {post.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-blue-600 p-8 text-white text-center">
          <p className="mb-2 text-sm font-semibold opacity-75">Kura — 管理会社専用AI</p>
          <h2 className="mb-3 text-2xl font-extrabold">記事で紹介した業務を自動化するツール</h2>
          <p className="mb-6 text-sm opacity-80">AI議事録・案件管理・引き継ぎ書自動生成を1つにまとめたSaaS</p>
          <Link
            href="/lp"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50"
          >
            詳細を見る →
          </Link>
        </div>
      </main>
    </div>
  )
}
